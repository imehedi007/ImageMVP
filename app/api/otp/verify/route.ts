import { NextRequest, NextResponse } from "next/server";

import {
  findLatestOtpRequest,
  incrementOtpAttempt,
  markOtpVerified,
  setOtpBlockedUntil,
  upsertVerifiedUser
} from "@/lib/server/mysql";
import { hashOtp, isOtpExpired, normalizeBangladeshPhone, parseAge } from "@/lib/server/otp";

export const runtime = "nodejs";

const MAX_VERIFY_ATTEMPTS = 5;
const FREEZE_MS = 3 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      name?: string;
      phone?: string;
      age?: string;
      dateOfBirth?: string;
      otp?: string;
    };

    if (!body.name?.trim()) {
      return NextResponse.json({ message: "Name is required." }, { status: 400 });
    }

    if (!body.phone) {
      return NextResponse.json({ message: "Phone number is required." }, { status: 400 });
    }

    if (!body.age) {
      return NextResponse.json({ message: "Age is required." }, { status: 400 });
    }

    if (!body.otp?.trim()) {
      return NextResponse.json({ message: "OTP is required." }, { status: 400 });
    }

    const normalizedPhone = normalizeBangladeshPhone(body.phone);
    const age = parseAge(body.age);
    const otp = body.otp.trim();
    const latest = await findLatestOtpRequest(normalizedPhone);

    if (!latest) {
      return NextResponse.json({ message: "Send an OTP first." }, { status: 400 });
    }

    if (latest.blocked_until && new Date(latest.blocked_until).getTime() > Date.now()) {
      return NextResponse.json(
        {
          message: "Too many wrong OTP attempts. Please wait 3 minutes before trying again.",
          modalMessage: "This number is temporarily frozen for 3 minutes because of too many wrong OTP attempts.",
          blockedUntil: latest.blocked_until
        },
        { status: 429 }
      );
    }

    if (latest.verified_at) {
      const user = await upsertVerifiedUser({
        name: body.name.trim(),
        phone: normalizedPhone,
        age
      });

      return NextResponse.json({ ok: true, verified: true, userId: user?.id || null });
    }

    if (latest.attempt_count >= MAX_VERIFY_ATTEMPTS) {
      return NextResponse.json({ message: "Too many incorrect OTP attempts." }, { status: 429 });
    }

    if (isOtpExpired(latest.expires_at)) {
      return NextResponse.json({ message: "OTP expired. Please request a new one." }, { status: 400 });
    }

    const inputHash = hashOtp(normalizedPhone, otp);

    if (inputHash !== latest.otp_hash) {
      await incrementOtpAttempt(latest.id);
      const nextAttemptCount = latest.attempt_count + 1;

      if (nextAttemptCount >= 3) {
        const blockedUntil = new Date(Date.now() + FREEZE_MS);
        await setOtpBlockedUntil(latest.id, blockedUntil);
        return NextResponse.json(
          {
            message: "Too many wrong OTP attempts. Please wait 3 minutes before trying again.",
            modalMessage:
              "You entered the wrong OTP 3 times. OTP activity is frozen for 3 minutes.",
            blockedUntil: blockedUntil.toISOString()
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { message: `Incorrect OTP. ${3 - nextAttemptCount} attempt left.` },
        { status: 400 }
      );
    }

    await markOtpVerified(latest.id);

    const user = await upsertVerifiedUser({
      name: body.name.trim(),
      phone: normalizedPhone,
      age
    });

    return NextResponse.json({
      ok: true,
      verified: true,
      userId: user?.id || null,
      phone: normalizedPhone
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "OTP verification failed.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
