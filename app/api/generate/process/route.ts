import { NextRequest, NextResponse } from "next/server";

import { processGenerationJob } from "@/lib/server/generation-jobs";

export const runtime = "nodejs";

function getInternalQueueToken() {
  return process.env.QUEUE_INTERNAL_TOKEN || process.env.OTP_SECRET || "";
}

export async function POST(request: NextRequest) {
  let body: {
    jobId?: number;
    retryCount?: number;
    finalAttempt?: boolean;
  } | null = null;

  try {
    const token = request.headers.get("x-queue-token") || "";

    if (!getInternalQueueToken() || token !== getInternalQueueToken()) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    body = (await request.json()) as {
      jobId?: number;
      retryCount?: number;
      finalAttempt?: boolean;
    };

    const jobId = Number(body.jobId || 0);

    if (!Number.isFinite(jobId) || jobId <= 0) {
      return NextResponse.json({ message: "Invalid job id." }, { status: 400 });
    }

    const result = await processGenerationJob({
      jobId,
      retryCount: Math.max(0, Number(body.retryCount || 0)),
      finalAttempt: Boolean(body.finalAttempt)
    });

    if (!result.ok && !result.final) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to process generation job", error);
    return NextResponse.json(
      {
        ok: false,
        final: Boolean(body?.finalAttempt),
        message: error instanceof Error ? error.message : "Worker processing failed."
      },
      { status: 500 }
    );
  }
}
