import "server-only";

import { cookies } from "next/headers";
import { SESSION_TTL_MS } from "@/modules/auth/domain/password-rules";
import {
  decryptSession,
  encryptSession,
  SESSION_COOKIE_NAME,
} from "./session-crypto";

export { decryptSession, encryptSession, SESSION_COOKIE_NAME };

export async function createSession(userId: string, sessionVersion: number): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const session = await encryptSession({ userId, sessionVersion });
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function readSession() {
  const cookieStore = await cookies();
  return decryptSession(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}
