import { NextRequest, NextResponse } from "next/server";

import {
  countSuccessfulOtpRequestsSince,
  createOtpRequest,
  findLatestOtpRequest,
  markOtpSendStatus
} from "@/lib/server/mysql";
import { generateOtpCode, hashOtp, normalizeBangladeshPhone, sendOtpSms } from "@/lib/server/otp";

export const runtime = "nodejs";

const RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_TTL_MS = 5 * 60 * 1000;
const SEND_WINDOW_MS = 30 * 60 * 1000;
const MAX_SENDS_PER_WINDOW = 3;

export async function POST(request: NextRequest) {
  try {
    const { phone } = (await request.json()) as { phone?: string };

    if (!phone) {
      return NextResponse.json({ message: "Phone number is required." }, { status: 400 });
    }

    const normalizedPhone = normalizeBangladeshPhone(phone);
    const latest = await findLatestOtpRequest(normalizedPhone);

    if (latest?.blocked_until && new Date(latest.blocked_until).getTime() > Date.now()) {
      return NextResponse.json(
        {
          message: "OTP activity is temporarily frozen. Please wait 3 minutes before trying again.",
          modalMessage: "Too many wrong OTP attempts. OTP activity is frozen for 3 minutes.",
          blockedUntil: latest.blocked_until
        },
        { status: 429 }
      );
    }

    if (latest && Date.now() - new Date(latest.created_at).getTime() < RESEND_COOLDOWN_MS) {
      return NextResponse.json(
        {
          message: "Please wait a minute before requesting another OTP.",
          modalMessage: "You can resend OTP after 1 minute."
        },
        { status: 429 }
      );
    }

    const sendCount = await countSuccessfulOtpRequestsSince(
      normalizedPhone,
      new Date(Date.now() - SEND_WINDOW_MS)
    );

    if (sendCount >= MAX_SENDS_PER_WINDOW) {
      return NextResponse.json(
        {
          message: "OTP resend limit reached. Please try again after 30 minutes.",
          modalMessage: "You already requested OTP 3 times. Please wait 30 minutes before sending again."
        },
        { status: 429 }
      );
    }

    const otp = generateOtpCode();
    const otpHash = hashOtp(normalizedPhone, otp);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    const otpRequestId = await createOtpRequest({
      phone: normalizedPhone,
      otpHash,
      expiresAt
    });

    try {
      await sendOtpSms(normalizedPhone, otp);
      await markOtpSendStatus(otpRequestId, "sent");
    } catch (error) {
      await markOtpSendStatus(otpRequestId, "failed");
      throw error;
    }

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
