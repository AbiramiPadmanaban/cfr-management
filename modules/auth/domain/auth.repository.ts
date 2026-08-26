export type UserRole = "ADMIN" | "USER";
export type AuthTokenType = "PASSWORD_SETUP" | "PASSWORD_RESET";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string | null;
  passwordSetAt: Date | null;
  isActive: boolean;
  role: UserRole;
  sessionVersion: number;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export interface PublicAuthUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
  passwordConfigured: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export interface CreateUserInput {
  email: string;
  name?: string | null;
  role?: UserRole;
}

export type AuthTokenLookup =
  | { status: "valid"; user: AuthUser; tokenId: string }
  | { status: "expired" }
  | { status: "invalid" };

export interface AuthRepository {
  findByEmail(email: string): Promise<AuthUser | null>;
  findById(id: string): Promise<AuthUser | null>;
  listUsers(): Promise<PublicAuthUser[]>;
  createUser(input: CreateUserInput): Promise<AuthUser>;
  setPassword(userId: string, passwordHash: string): Promise<AuthUser>;
  setActive(userId: string, isActive: boolean): Promise<PublicAuthUser>;
  recordLogin(userId: string): Promise<void>;
  createToken(input: {
    userId: string;
    tokenHash: string;
    type: AuthTokenType;
    expiresAt: Date;
  }): Promise<void>;
  lookupToken(tokenHash: string, type: AuthTokenType): Promise<AuthTokenLookup>;
  consumeToken(tokenId: string): Promise<void>;
  invalidateUnusedTokens(userId: string, type: AuthTokenType): Promise<void>;
}

export function toPublicUser(user: AuthUser): PublicAuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    passwordConfigured: Boolean(user.passwordHash && user.passwordSetAt),
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}
