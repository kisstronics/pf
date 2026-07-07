import { generateSecret, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";
import { prisma } from "./prisma";

export async function generateTotpSetup() {
  const secret = generateSecret();
  const otpauth = generateURI({
    issuer: "PersonalFinance",
    label: "finance@local",
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

export async function getUser() {
  return prisma.user.findFirst();
}

export async function isSetupComplete(): Promise<boolean> {
  const user = await getUser();
  return !!user?.totpEnabled;
}
