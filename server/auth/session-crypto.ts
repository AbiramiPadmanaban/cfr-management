import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export const SESSION_COOKIE_NAME = "cfr_session";

export interface SessionPayload extends JWTPayload {
  userId: string;
  sessionVersion: number;
}

function getEncodedSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET is missing or too short. Add a 32+ character secret to .env."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function encryptSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    sessionVersion: payload.sessionVersion,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getEncodedSecret());
}

export async function decryptSession(session: string | undefined): Promise<SessionPayload | null> {
  if (!session) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(session, getEncodedSecret(), {
      algorithms: ["HS256"],
    });
    if (typeof payload.userId !== "string" || typeof payload.sessionVersion !== "number") {
      return null;
    }
    return payload as SessionPayload;
  } catch {
    return null;
  }
}
