import { NextRequest, NextResponse } from "next/server";

import { createAIProvider } from "@/lib/ai";
import { getAIConfig, hasUsableAIConfig } from "@/config/ai.config";
import { readExperienceContent } from "@/lib/content";
import {
  completeGenerationLog,
  createGenerationLog,
  failGenerationLog,
  findVerifiedUserByPhone
} from "@/lib/server/mysql";
import { normalizeBangladeshPhone } from "@/lib/server/otp";
import { createMockRideStoryImage } from "@/lib/utils/mock-image";
import { buildRidePromptBundle, fallbackStoryText } from "@/lib/utils/prompt";
import { RideFormData, RideGenerationResponse } from "@/types";

export const runtime = "nodejs";

function parseStoryPayload(raw: string | undefined, fallback: { summary: string; caption: string }) {
  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<{ summary: string; caption: string }>;
    return {
      summary: parsed.summary || fallback.summary,
      caption: parsed.caption || fallback.caption
    };
  } catch {
    return fallback;
  }
}

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
    inputFidelity: config.inputFidelity
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
    const file = imageFiles[0];
    const content = await readExperienceContent();
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

    const bundle = buildRidePromptBundle(payload, content);
    const fallback = fallbackStoryText(payload, bundle);
    const config = getAIConfig();
    const generationLogId = await createGenerationLog({
      userId: verifiedUser.id,
      phone: verifiedUser.phone,
      bikeType: payload.bikeType,
      environment: payload.environment,
      provider: config.provider
    });

    let imageUrl = createMockRideStoryImage(bundle.imagePrompt, payload.favoriteColor);
    let summary = fallback.summary;
    let caption = fallback.caption;
    let providerError: string | null = null;
    let imageGenerated = false;

    if (hasUsableAIConfig(config)) {
      try {
        const provider = createAIProvider();

        const [storyResult, imageResult] = await Promise.allSettled([
          provider.generateText(bundle.storyPrompt),
          provider.generateImage({ prompt: bundle.imagePrompt, image: file, images: imageFiles })
        ]);

        if (storyResult.status === "fulfilled") {
          const story = parseStoryPayload(storyResult.value, fallback);
          summary = story.summary;
          caption = story.caption;
        } else {
          providerError = storyResult.reason instanceof Error ? storyResult.reason.message : "Text generation failed.";
        }

        if (imageResult.status === "fulfilled") {
          imageUrl = imageResult.value;
          imageGenerated = true;
        } else if (!providerError) {
          providerError = imageResult.reason instanceof Error ? imageResult.reason.message : "Image generation failed.";
        }
      } catch (error) {
        providerError = error instanceof Error ? error.message : "Unexpected AI provider error.";
      }
    }

    if (providerError && !imageGenerated) {
      await failGenerationLog(generationLogId, providerError);
    } else {
      await completeGenerationLog(generationLogId);
    }

    const response: RideGenerationResponse = {
      imageUrl,
      summary,
      caption,
      prompt: bundle.imagePrompt,
      profile: {
        personalityTraits: bundle.personalityTraits,
        emotionalTone: bundle.emotionalTone,
        socialDynamic: bundle.socialDynamic,
        sceneDirection: bundle.sceneDirection
      }
    };

    return NextResponse.json({
      ...response,
      providerError
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
