import { prisma } from "@/lib/prisma";
import type { User } from "@/app/generated/prisma";
import type {
  AuthRepository,
  AuthTokenLookup,
  AuthTokenType,
  AuthUser,
  CreateUserInput,
  PublicAuthUser,
} from "../domain/auth.repository";
import { toPublicUser } from "../domain/auth.repository";
import { normalizeEmail } from "../domain/password-rules";

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    passwordHash: user.passwordHash,
    passwordSetAt: user.passwordSetAt,
    isActive: user.isActive,
    role: user.role,
    sessionVersion: user.sessionVersion,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}

export class PrismaAuthRepository implements AuthRepository {
  async findByEmail(email: string): Promise<AuthUser | null> {
    const user = await prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
    });
    return user ? toAuthUser(user) : null;
  }

  async findById(id: string): Promise<AuthUser | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? toAuthUser(user) : null;
  }

  async listUsers(): Promise<PublicAuthUser[]> {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return users.map((user) => toPublicUser(toAuthUser(user)));
  }

  async createUser(input: CreateUserInput): Promise<AuthUser> {
    const user = await prisma.user.create({
      data: {
        email: normalizeEmail(input.email),
        name: input.name?.trim() || null,
        role: input.role ?? "USER",
      },
    });
    return toAuthUser(user);
  }

  async setPassword(userId: string, passwordHash: string): Promise<AuthUser> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordSetAt: new Date(),
        sessionVersion: { increment: 1 },
      },
    });
    return toAuthUser(user);
  }

  async setActive(userId: string, isActive: boolean): Promise<PublicAuthUser> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isActive,
        sessionVersion: isActive ? undefined : { increment: 1 },
      },
    });
    return toPublicUser(toAuthUser(user));
  }

  async recordLogin(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  async createToken(input: {
    userId: string;
    tokenHash: string;
    type: AuthTokenType;
    expiresAt: Date;
  }): Promise<void> {
    await prisma.authToken.create({
      data: {
        userId: input.userId,
        tokenHash: input.tokenHash,
        type: input.type,
        expiresAt: input.expiresAt,
      },
    });
  }

  async lookupToken(tokenHash: string, type: AuthTokenType): Promise<AuthTokenLookup> {
    const token = await prisma.authToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!token || token.type !== type || token.usedAt) {
      return { status: "invalid" };
    }

    if (token.expiresAt.getTime() <= Date.now() || !token.user.isActive) {
      return { status: "expired" };
    }

    return { status: "valid", user: toAuthUser(token.user), tokenId: token.id };
  }

  async consumeToken(tokenId: string): Promise<void> {
    await prisma.authToken.update({
      where: { id: tokenId },
      data: { usedAt: new Date() },
    });
  }

  async invalidateUnusedTokens(userId: string, type: AuthTokenType): Promise<void> {
    await prisma.authToken.updateMany({
      where: {
        userId,
        type,
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });
  }
}
