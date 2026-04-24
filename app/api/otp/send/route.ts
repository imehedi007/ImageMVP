import { NextRequest, NextResponse } from "next/server";

import { createOtpRequest, findLatestOtpRequest } from "@/lib/server/mysql";
import { generateOtpCode, hashOtp, normalizeBangladeshPhone, sendOtpSms } from "@/lib/server/otp";

export const runtime = "nodejs";

const RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_TTL_MS = 5 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const { phone } = (await request.json()) as { phone?: string };

    if (!phone) {
      return NextResponse.json({ message: "Phone number is required." }, { status: 400 });
    }

    const normalizedPhone = normalizeBangladeshPhone(phone);
    const latest = await findLatestOtpRequest(normalizedPhone);

    if (latest && Date.now() - new Date(latest.created_at).getTime() < RESEND_COOLDOWN_MS) {
      return NextResponse.json(
        { message: "Please wait a minute before requesting another OTP." },
        { status: 429 }
      );
    }

    const otp = generateOtpCode();
    const otpHash = hashOtp(normalizedPhone, otp);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await createOtpRequest({
      phone: normalizedPhone,
      otpHash,
      expiresAt
    });

    await sendOtpSms(normalizedPhone, otp);

    return NextResponse.json({
      ok: true,
      phone: normalizedPhone,
      expiresInSeconds: OTP_TTL_MS / 1000
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "OTP could not be sent.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
