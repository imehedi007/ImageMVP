export type AIProviderName = "openai" | "openrouter" | "replicate" | "stability" | "custom";

export interface AIRuntimeConfig {
  provider: AIProviderName;
  apiKey?: string;
  apiUrl?: string;
  textModel: string;
  imageModel: string;
  responsesModel: string;
  openAIUseResponsesIdentity: boolean;
  maxReferenceImages: number;
  imageSize: string;
  imageQuality: string;
  inputFidelity: string;
  imageAspectRatio: string;
}

export function getAIConfig(): AIRuntimeConfig {
  const provider = (process.env.AI_PROVIDER as AIProviderName) || "openai";

  return {
    provider,
    apiKey: resolveAPIKey(provider),
    apiUrl: process.env.AI_API_URL,
    textModel: process.env.AI_TEXT_MODEL || "gpt-4o-mini",
    imageModel: process.env.AI_IMAGE_MODEL || "gpt-image-1",
    responsesModel: process.env.AI_RESPONSES_MODEL || process.env.AI_TEXT_MODEL || "gpt-4o-mini",
    openAIUseResponsesIdentity: process.env.AI_OPENAI_USE_RESPONSES_IDENTITY === "true",
    maxReferenceImages: Number(process.env.AI_MAX_REFERENCE_IMAGES || "1"),
    imageSize: process.env.AI_IMAGE_SIZE || "1024x1536",
    imageQuality: process.env.AI_IMAGE_QUALITY || "high",
    inputFidelity: process.env.AI_INPUT_FIDELITY || "high",
    imageAspectRatio: process.env.AI_IMAGE_ASPECT_RATIO || "4:5"
  };
}

export function hasUsableAIConfig(config: AIRuntimeConfig) {
  if (config.provider === "custom") {
    return Boolean(config.apiUrl);
  }

  return Boolean(config.apiKey);
}

function resolveAPIKey(provider: AIProviderName) {
  switch (provider) {
    case "stability":
      return process.env.STABILITY_API_KEY || process.env.AI_API_KEY;
    default:
      return process.env.AI_API_KEY;
  }
}
