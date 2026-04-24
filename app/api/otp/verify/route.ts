import { NextRequest, NextResponse } from "next/server";

import {
  findLatestOtpRequest,
  incrementOtpAttempt,
  markOtpVerified,
  upsertVerifiedUser
} from "@/lib/server/mysql";
import { hashOtp, isOtpExpired, normalizeBangladeshPhone, parseAge } from "@/lib/server/otp";

export const runtime = "nodejs";

const MAX_VERIFY_ATTEMPTS = 5;

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
      return NextResponse.json({ message: "Incorrect OTP." }, { status: 400 });
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
