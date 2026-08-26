import { generateAuthToken, hashAuthToken } from "@/lib/auth-token";
import {
  buildPasswordResetUrl,
  buildPasswordSetupUrl,
  sendPasswordResetEmail,
  sendPasswordSetupEmail,
} from "@/lib/email";
import { hashPassword, verifyPassword, verifyPasswordDummy } from "@/lib/password";
import type {
  AuthTokenType,
  AuthUser,
  CreateUserInput,
  PublicAuthUser,
} from "../../domain/auth.repository";
import { toPublicUser } from "../../domain/auth.repository";
import {
  FORGOT_PASSWORD_MESSAGE,
  RESET_TOKEN_TTL_MS,
  SETUP_TOKEN_TTL_MS,
  getPasswordIssues,
  isValidEmail,
  normalizeEmail,
} from "../../domain/password-rules";
import { PrismaAuthRepository } from "../../infrastructure/auth.prisma-repo";

const authRepo = new PrismaAuthRepository();

export type AuthActionResult =
  | { ok: true }
  | { ok: false; error: string };

export type CreateUserResult =
  | { ok: true; user: PublicAuthUser; emailSent: boolean; emailError?: string }
  | { ok: false; error: string };

export type TokenValidationResult =
  | { status: "valid"; email: string }
  | { status: "expired" }
  | { status: "invalid" };

export async function loginUser(email: string, password: string): Promise<
  | { ok: true; user: AuthUser }
  | { ok: false; error: string }
> {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized) || !password) {
    return { ok: false, error: "Enter a valid email address and password." };
  }

  const user = await authRepo.findByEmail(normalized);
  if (!user || !user.passwordHash || !user.passwordSetAt) {
    await verifyPasswordDummy(password);
    return { ok: false, error: "Invalid email or password." };
  }

  const matches = await verifyPassword(password, user.passwordHash);
  if (!matches) {
    return { ok: false, error: "Invalid email or password." };
  }

  if (!user.isActive) {
    return { ok: false, error: "This account is inactive. Contact your administrator." };
  }

  await authRepo.recordLogin(user.id);
  return { ok: true, user };
}

export async function requestPasswordReset(email: string): Promise<AuthActionResult> {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    return { ok: true };
  }

  const user = await authRepo.findByEmail(normalized);
  if (!user || !user.isActive || !user.passwordHash) {
    return { ok: true };
  }

  const token = await issueToken(user, "PASSWORD_RESET", RESET_TOKEN_TTL_MS);
  try {
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl: buildPasswordResetUrl(token),
    });
  } catch (error) {
    console.error("Failed to send password reset email:", error);
  }

  return { ok: true };
}

export function forgotPasswordMessage(): string {
  return FORGOT_PASSWORD_MESSAGE;
}

export async function validateAuthToken(
  token: string,
  type: AuthTokenType
): Promise<TokenValidationResult> {
  if (!token || token.length < 32) {
    return { status: "invalid" };
  }

  const lookup = await authRepo.lookupToken(hashAuthToken(token), type);
  if (lookup.status === "valid") {
    return { status: "valid", email: lookup.user.email };
  }
  return { status: lookup.status };
}

export async function completePasswordChange(
  token: string,
  type: AuthTokenType,
  password: string,
  confirmPassword: string
): Promise<AuthActionResult> {
  if (password !== confirmPassword) {
    return { ok: false, error: "Passwords do not match." };
  }

  const issues = getPasswordIssues(password);
  if (issues.length > 0) {
    return {
      ok: false,
      error: `Password must include: ${issues.join(", ").toLowerCase()}.`,
    };
  }

  if (!token || token.length < 32) {
    return { ok: false, error: "This link is invalid or has expired." };
  }

  const lookup = await authRepo.lookupToken(hashAuthToken(token), type);
  if (lookup.status !== "valid") {
    return {
      ok: false,
      error:
        lookup.status === "expired"
          ? "This link has expired. Request a new one from the login page."
          : "This link is invalid or has already been used.",
    };
  }

  const passwordHash = await hashPassword(password);
  await authRepo.setPassword(lookup.user.id, passwordHash);
  await authRepo.consumeToken(lookup.tokenId);
  await authRepo.invalidateUnusedTokens(lookup.user.id, type);
  return { ok: true };
}

export async function createUserWithSetupEmail(input: CreateUserInput): Promise<CreateUserResult> {
  const email = normalizeEmail(input.email);
  if (!isValidEmail(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const existing = await authRepo.findByEmail(email);
  if (existing) {
    return { ok: false, error: "A user with this email already exists." };
  }

  const user = await authRepo.createUser({
    email,
    name: input.name?.trim() || null,
    role: input.role ?? "USER",
  });

  const emailResult = await sendSetupEmailForUser(user);
  return {
    ok: true,
    user: toPublicUser(user),
    emailSent: emailResult.emailSent,
    emailError: emailResult.emailError,
  };
}

export async function resendSetupEmail(userId: string): Promise<CreateUserResult> {
  const user = await authRepo.findById(userId);
  if (!user) {
    return { ok: false, error: "User not found." };
  }
  if (!user.isActive) {
    return { ok: false, error: "This account is inactive." };
  }
  if (user.passwordHash && user.passwordSetAt) {
    return { ok: false, error: "This user has already set a password." };
  }

  const emailResult = await sendSetupEmailForUser(user);
  return {
    ok: true,
    user: toPublicUser(user),
    emailSent: emailResult.emailSent,
    emailError: emailResult.emailError,
  };
}

export async function listUsers(): Promise<PublicAuthUser[]> {
  return authRepo.listUsers();
}

export async function setUserActive(userId: string, isActive: boolean): Promise<PublicAuthUser> {
  return authRepo.setActive(userId, isActive);
}

async function issueToken(user: AuthUser, type: AuthTokenType, ttlMs: number): Promise<string> {
  await authRepo.invalidateUnusedTokens(user.id, type);
  const token = generateAuthToken();
  await authRepo.createToken({
    userId: user.id,
    tokenHash: hashAuthToken(token),
    type,
    expiresAt: new Date(Date.now() + ttlMs),
  });
  return token;
}

async function sendSetupEmailForUser(user: AuthUser): Promise<{
  emailSent: boolean;
  emailError?: string;
}> {
  const token = await issueToken(user, "PASSWORD_SETUP", SETUP_TOKEN_TTL_MS);
  const setupUrl = buildPasswordSetupUrl(token);
  try {
    await sendPasswordSetupEmail({
      to: user.email,
      name: user.name,
      setupUrl,
    });
    return { emailSent: true };
  } catch (error) {
    console.error("Failed to send password setup email:", error);
    return {
      emailSent: false,
      emailError:
        error instanceof Error
          ? error.message
          : "User was created, but the setup email could not be sent.",
    };
  }
}

export { SETUP_TOKEN_TTL_MS };
