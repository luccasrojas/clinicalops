import crypto from "crypto";

const SECRET = process.env.FILE_HASH_SECRET || "super-secret-string";

export function generateToken(filename: string) {
  return crypto.createHmac("sha256", SECRET).update(filename).digest("hex");
}

export function verifyToken(filename: string, token: string) {
  const expectedToken = generateToken(filename);
  return crypto.timingSafeEqual(Buffer.from(expectedToken), Buffer.from(token));
}
