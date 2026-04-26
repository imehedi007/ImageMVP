import { NextRequest, NextResponse } from "next/server";

import { getGenerationJob } from "@/lib/server/mysql";
import { loadJobResult } from "@/lib/server/job-files";
import { normalizeBangladeshPhone } from "@/lib/server/otp";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const jobId = Number(request.nextUrl.searchParams.get("jobId") || "0");
    const phone = request.nextUrl.searchParams.get("phone") || "";

    if (!Number.isFinite(jobId) || jobId <= 0) {
      return NextResponse.json({ message: "Invalid job id." }, { status: 400 });
    }

    const job = await getGenerationJob(jobId);

    if (!job) {
      return NextResponse.json({ message: "Job not found." }, { status: 404 });
    }

    if (phone) {
      const normalizedPhone = normalizeBangladeshPhone(phone);

      if (normalizedPhone !== job.phone) {
        return NextResponse.json({ message: "Unauthorized job access." }, { status: 403 });
      }
    }

    if (job.status === "completed") {
      const result = await loadJobResult(job.id);

      if (!result) {
        return NextResponse.json({
          status: "processing",
          message: "Result file is still being finalized."
        });
      }

      return NextResponse.json({
        status: "completed",
        result
      });
    }

    if (job.status === "failed") {
      return NextResponse.json({
        status: "failed",
        message: job.error_message || "Image generation failed."
      });
    }

    return NextResponse.json({
      status: job.status,
      retryCount: job.retry_count
    });
  } catch (error) {
    console.error("Failed to fetch generation status", error);
    return NextResponse.json({ message: "Could not load job status." }, { status: 500 });
  }
}
