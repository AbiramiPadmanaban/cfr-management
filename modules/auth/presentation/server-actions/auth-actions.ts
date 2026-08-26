"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireAuth } from "@/server/auth/require-auth";
import { createSession, deleteSession } from "@/server/auth/session";
import type { UserRole } from "../../domain/auth.repository";
import {
  completePasswordChange,
  createUserWithSetupEmail,
  forgotPasswordMessage,
  listUsers,
  loginUser,
  requestPasswordReset,
  resendSetupEmail,
  setUserActive,
  validateAuthToken,
} from "../lib/auth-service";

export async function loginAction(input: {
  email: string;
  password: string;
  next?: string;
}) {
  const result = await loginUser(input.email, input.password);
  if (!result.ok) {
    return result;
  }

  await createSession(result.user.id, result.user.sessionVersion);
  const nextPath =
    input.next && input.next.startsWith("/cfr") && !input.next.startsWith("//")
      ? input.next
      : "/cfr";
  redirect(nextPath);
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}

export async function forgotPasswordAction(input: { email: string }) {
  await requestPasswordReset(input.email);
  return { ok: true as const, message: forgotPasswordMessage() };
}

export async function validateSetupTokenAction(token: string) {
  return validateAuthToken(token, "PASSWORD_SETUP");
}

export async function validateResetTokenAction(token: string) {
  return validateAuthToken(token, "PASSWORD_RESET");
}

export async function setPasswordAction(input: {
  token: string;
  password: string;
  confirmPassword: string;
}) {
  const result = await completePasswordChange(
    input.token,
    "PASSWORD_SETUP",
    input.password,
    input.confirmPassword
  );
  if (!result.ok) {
    return result;
  }
  await deleteSession();
  redirect("/login?setup=1");
}

export async function resetPasswordAction(input: {
  token: string;
  password: string;
  confirmPassword: string;
}) {
  const result = await completePasswordChange(
    input.token,
    "PASSWORD_RESET",
    input.password,
    input.confirmPassword
  );
  if (!result.ok) {
    return result;
  }
  await deleteSession();
  redirect("/login?reset=1");
}

export async function listUsersAction() {
  await requireAdmin();
  return listUsers();
}

export async function createUserAction(input: {
  email: string;
  name?: string;
  role?: UserRole;
}) {
  await requireAdmin();
  const result = await createUserWithSetupEmail(input);
  if (result.ok) {
    revalidatePath("/cfr/users");
  }
  return result;
}

export async function sendPasswordSetupEmailAction(userId: string) {
  await requireAdmin();
  const result = await resendSetupEmail(userId);
  if (result.ok) {
    revalidatePath("/cfr/users");
  }
  return result;
}

export async function setUserActiveAction(userId: string, isActive: boolean) {
  const currentUser = await requireAdmin();
  if (currentUser.id === userId) {
    return { ok: false as const, error: "You cannot change the status of your own account." };
  }

  const user = await setUserActive(userId, isActive);
  revalidatePath("/cfr/users");
  return { ok: true as const, user };
}

export async function getAuthenticatedUserAction() {
  const user = await requireAuth();
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}
