import { generateSecret, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";
import { registryPrisma } from "./registry-prisma";

export async function generateTotpSetup(username: string) {
  const secret = generateSecret();
  const otpauth = generateURI({
    issuer: "PersonalFinance",
    label: username,
    secret,
  });
  const qrCode = await QRCode.toDataURL(otpauth);
  return { secret, qrCode, otpauth };
}

export async function verifyTotpCode(secret: string, token: string): Promise<boolean> {
  try {
    const result = verifySync({ token, secret });
    return result.valid;
  } catch {
    return false;
  }
}

export async function getUserById(id: string) {
  return registryPrisma.user.findUnique({ where: { id } });
}

export async function getUserByUsername(username: string) {
  return registryPrisma.user.findUnique({
    where: { username: username.toLowerCase().trim() },
  });
}

export async function hasAnyUser(): Promise<boolean> {
  const count = await registryPrisma.user.count();
  return count > 0;
}
