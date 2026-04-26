import { NextRequest, NextResponse } from "next/server";

import {
  createGenerationJob,
  createGenerationJobEvent,
  createGenerationLog,
  failGenerationLog,
  findVerifiedUserByPhone,
  setGenerationJobQueueMessageId
} from "@/lib/server/mysql";
import { saveJobInputFiles } from "@/lib/server/job-files";
import { enqueueGenerationJob, hasQueueConfig } from "@/lib/server/sqs";
import { normalizeBangladeshPhone } from "@/lib/server/otp";
import { getAIConfig } from "@/config/ai.config";
import { RideFormData } from "@/types";

export const runtime = "nodejs";

export async function GET() {
  const config = getAIConfig();

  return NextResponse.json({
    ok: true,
    provider: config.provider,
    hasApiKey: Boolean(config.apiKey),
    hasApiUrl: Boolean(config.apiUrl),
    textModel: config.textModel,
    imageModel: config.imageModel,
    responsesModel: config.responsesModel,
    openAIUseResponsesIdentity: config.openAIUseResponsesIdentity,
    maxReferenceImages: config.maxReferenceImages,
    imageSize: config.imageSize,
    imageQuality: config.imageQuality,
    inputFidelity: config.inputFidelity,
    hasQueueConfig: hasQueueConfig()
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const rawPayload = formData.get("payload");

    if (!rawPayload || typeof rawPayload !== "string") {
      return NextResponse.json({ message: "Missing request payload." }, { status: 400 });
    }

    const payload = JSON.parse(rawPayload) as RideFormData;
    const photos = formData.getAll("photos");
    const imageFiles = photos.filter((item): item is File => item instanceof File);
    const normalizedPhone = normalizeBangladeshPhone(payload.phone);
    const verifiedUser = await findVerifiedUserByPhone(normalizedPhone);

    if (!verifiedUser) {
      return NextResponse.json(
        {
          message: "Verify your phone number before generating an image."
        },
        { status: 403 }
      );
    }

    if (!hasQueueConfig()) {
      return NextResponse.json(
        {
          message: "Queue configuration is missing. Set AWS SQS environment variables first."
        },
        { status: 500 }
      );
    }

    const config = getAIConfig();
    const generationLogId = await createGenerationLog({
      userId: verifiedUser.id,
      phone: verifiedUser.phone,
      bikeType: payload.bikeType,
      environment: payload.environment,
      provider: config.provider
    });

    const jobId = await createGenerationJob({
      userId: verifiedUser.id,
      phone: verifiedUser.phone,
      generationLogId,
      bikeType: payload.bikeType,
      environment: payload.environment,
      provider: config.provider,
      model: config.imageModel,
      payloadJson: JSON.stringify(payload)
    });

    try {
      await saveJobInputFiles(jobId, imageFiles);
      const messageId = await enqueueGenerationJob(jobId);
      await setGenerationJobQueueMessageId(jobId, messageId);
      await createGenerationJobEvent(jobId, "queued", messageId || "Queued in AWS SQS.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not queue generation job.";
      await createGenerationJobEvent(jobId, "queue_failed", message);
      await failGenerationLog(generationLogId, message);
      throw error;
    }

    return NextResponse.json({
      ok: true,
      jobId
    });
  } catch (error) {
    console.error("Generate route failed", error);

    return NextResponse.json(
      {
        message: "We could not generate your ride story right now."
      },
      { status: 500 }
    );
  }
}
