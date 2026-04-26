import { createAIProvider } from "@/lib/ai";
import { getAIConfig, hasUsableAIConfig } from "@/config/ai.config";
import { readExperienceContent } from "@/lib/content";
import { loadJobInputFiles, saveJobResult } from "@/lib/server/job-files";
import {
  completeGenerationJob,
  completeGenerationLog,
  createGenerationJobEvent,
  failGenerationJob,
  failGenerationLog,
  getGenerationJob,
  setGenerationJobPending,
  setGenerationJobProcessing
} from "@/lib/server/mysql";
import { createMockRideStoryImage } from "@/lib/utils/mock-image";
import { buildRidePromptBundle, fallbackStoryText } from "@/lib/utils/prompt";
import { RideFormData, RideGenerationResponse } from "@/types";

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

export async function processGenerationJob(params: { jobId: number; retryCount: number; finalAttempt: boolean }) {
  const job = await getGenerationJob(params.jobId);

  if (!job) {
    return {
      ok: false,
      final: true,
      message: "Generation job not found."
    };
  }

  if (job.status === "completed") {
    return {
      ok: true,
      final: true
    };
  }

  if (job.status === "failed") {
    return {
      ok: false,
      final: true,
      message: job.error_message || "Generation job already failed."
    };
  }

  try {
    await setGenerationJobProcessing(job.id, params.retryCount);
    await createGenerationJobEvent(job.id, "processing", `Attempt ${params.retryCount + 1} started.`);

    const payload = JSON.parse(job.payload_json || "{}") as RideFormData;
    const imageFiles = await loadJobInputFiles(job.id);
    const content = await readExperienceContent();
    const bundle = buildRidePromptBundle(payload, content);
    const fallback = fallbackStoryText(payload, bundle);
    const config = getAIConfig();

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
          provider.generateImage({ prompt: bundle.imagePrompt, image: imageFiles[0], images: imageFiles })
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
      if (params.finalAttempt) {
        await failGenerationJob(job.id, providerError, params.retryCount);
        if (job.generation_log_id) {
          await failGenerationLog(job.generation_log_id, providerError);
        }
        await createGenerationJobEvent(job.id, "failed", providerError);

        return {
          ok: false,
          final: true,
          message: providerError
        };
      }

      await setGenerationJobPending(job.id, params.retryCount, providerError);
      await createGenerationJobEvent(job.id, "retry_scheduled", providerError);

      return {
        ok: false,
        final: false,
        message: providerError
      };
    }

    const result: RideGenerationResponse = {
      imageUrl,
      summary,
      caption,
      prompt: bundle.imagePrompt,
      profile: {
        personalityTraits: bundle.personalityTraits,
        emotionalTone: bundle.emotionalTone,
        socialDynamic: bundle.socialDynamic,
        sceneDirection: bundle.sceneDirection
      },
      providerError
    };

    await saveJobResult(job.id, result);
    await completeGenerationJob(job.id, {
      summary,
      caption,
      errorMessage: providerError
    });

    if (job.generation_log_id) {
      await completeGenerationLog(job.generation_log_id);
    }

    await createGenerationJobEvent(job.id, "completed", providerError || "Generation completed.");

    return {
      ok: true,
      final: true,
      result
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected worker failure.";

    if (params.finalAttempt) {
      await failGenerationJob(job.id, message, params.retryCount);
      if (job.generation_log_id) {
        await failGenerationLog(job.generation_log_id, message);
      }
      await createGenerationJobEvent(job.id, "failed", message);

      return {
        ok: false,
        final: true,
        message
      };
    }

    await setGenerationJobPending(job.id, params.retryCount, message);
    await createGenerationJobEvent(job.id, "retry_scheduled", message);

    return {
      ok: false,
      final: false,
      message
    };
  }
}
