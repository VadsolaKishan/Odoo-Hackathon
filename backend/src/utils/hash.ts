import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

export const hashPassword = (password: string): string => {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
};

export const verifyPassword = (password: string, hash: string): boolean => {
  const [salt, key] = hash.split(":");
  if (!salt || !key) return false;
  
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = scryptSync(password, salt, 64);
  
  // Prevent timing attacks by comparing buffers of the same length
  if (keyBuffer.length !== derivedKey.length) return false;
  return timingSafeEqual(keyBuffer, derivedKey);
};
