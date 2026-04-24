import crypto from "node:crypto";
import { calculateAgeFromDateOfBirth } from "@/lib/utils/age";

const SMS_API_URL = "http://bulksmsbd.net/api/smsapi";

export function normalizeBangladeshPhone(raw: string) {
  const digits = raw.replace(/\D/g, "");

  if (digits.startsWith("8801") && digits.length === 13) {
    return digits;
  }

  if (digits.startsWith("01") && digits.length === 11) {
    return `88${digits}`;
  }

  throw new Error("Enter a valid Bangladesh mobile number.");
}

export function parseAge(value: string) {
  const normalized = value.trim();
  const firstNumericToken = normalized.match(/\d+/)?.[0] || "";
  const age = Number(firstNumericToken || normalized);

  if (!Number.isFinite(age) || age < 8 || age > 100) {
    throw new Error("Enter a valid age.");
  }

  return age;
}

export function generateOtpCode() {
  return String(crypto.randomInt(1000, 10000));
}

export function hashOtp(phone: string, otp: string) {
  const secret = process.env.OTP_SECRET || "ride-story-otp-secret";
  return crypto.createHash("sha256").update(`${phone}:${otp}:${secret}`).digest("hex");
}

export function isOtpExpired(expiresAt: string) {
  return new Date(expiresAt).getTime() < Date.now();
}

export async function sendOtpSms(phone: string, otp: string) {
  const apiKey = process.env.BULKSMSBD_API_KEY;
  const senderId = process.env.BULKSMSBD_SENDER_ID;

  if (!apiKey || !senderId) {
    throw new Error("BulkSMSBD credentials are missing.");
  }

  const message = `Your Ride Story OTP is ${otp}. It will expire in 5 minutes.`;
  const body = new URLSearchParams({
    api_key: apiKey,
    senderid: senderId,
    number: phone,
    message
  });

  const response = await fetch(SMS_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: body.toString()
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`BulkSMSBD send failed: ${response.status} ${text}`);
  }

  return text;
}
