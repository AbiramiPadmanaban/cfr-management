import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) {
    return false;
  }

  const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  const stored = Buffer.from(hash, "hex");
  if (stored.length !== derived.length) {
    return false;
  }

  return timingSafeEqual(stored, derived);
}

const DUMMY_HASH_PROMISE = hashPassword("invalid-password-placeholder");

export async function verifyPasswordDummy(password: string): Promise<void> {
  const dummyHash = await DUMMY_HASH_PROMISE;
  await verifyPassword(password, dummyHash);
}
