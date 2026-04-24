import { AIRuntimeConfig } from "@/config/ai.config";
import { AIProvider, GenerateImageParams } from "@/lib/ai/types";

export class GeminiProvider implements AIProvider {
  constructor(private readonly config: AIRuntimeConfig) {}

  async generateText(prompt: string): Promise<string> {
    const response = await fetch(this.buildModelUrl(this.config.textModel), {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: "You create vibrant, emotionally intelligent, social-media-ready personality copy." }]
        },
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      throw new Error(await this.buildErrorMessage("text", response));
    }

    const data = await response.json();
    return this.extractText(data);
  }

  async generateImage({ prompt, images = [], image }: GenerateImageParams): Promise<string> {
    const referenceImages = images.length
      ? images.slice(0, this.config.maxReferenceImages)
      : image
        ? [image]
        : [];

    const parts: Array<Record<string, unknown>> = [{ text: prompt }];

    for (const file of referenceImages) {
      parts.push({
        inlineData: {
          mimeType: file.type || "image/jpeg",
          data: await this.fileToBase64(file)
        }
      });
    }

    const imageConfig: Record<string, string> = {
      aspectRatio: this.config.imageAspectRatio
    };

    if (this.config.imageSize && this.config.imageModel.includes("3.1")) {
      imageConfig.imageSize = this.config.imageSize;
    }

    const response = await fetch(this.buildModelUrl(this.config.imageModel), {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts
          }
        ],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig
        }
      })
    });

    if (!response.ok) {
      throw new Error(await this.buildErrorMessage("image generation", response));
    }

    const data = await response.json();
    return this.extractImage(data);
  }

  private buildModelUrl(model: string) {
    const baseUrl = this.config.apiUrl || "https://generativelanguage.googleapis.com/v1beta";
    return `${baseUrl}/models/${model}:generateContent`;
  }

  private buildHeaders() {
    return {
      "Content-Type": "application/json",
      "x-goog-api-key": this.config.apiKey || ""
    };
  }

  private extractText(data: unknown) {
    const parsed = data as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    const parts = parsed.candidates?.[0]?.content?.parts;

    if (!Array.isArray(parts)) {
      return "{}";
    }

    const text = parts
      .map((part) => part?.text)
      .filter((value): value is string => typeof value === "string")
      .join("")
      .trim();

    return text || "{}";
  }

  private extractImage(data: unknown) {
    const parsed = data as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            inlineData?: {
              data?: string;
              mimeType?: string;
            };
          }>;
        };
      }>;
    };

    const parts = parsed.candidates?.[0]?.content?.parts;

    if (!Array.isArray(parts)) {
      throw new Error("Gemini image response did not include any content parts.");
    }

    for (const part of parts) {
      const base64 = part?.inlineData?.data;
      const mimeType = part?.inlineData?.mimeType || "image/png";

      if (typeof base64 === "string" && base64.length > 0) {
        return `data:${mimeType};base64,${base64}`;
      }
    }

    throw new Error("Gemini image response did not include an image payload.");
  }

  private async buildErrorMessage(action: string, response: Response) {
    const raw = await response.text();

    try {
      const parsed = JSON.parse(raw) as {
        error?: {
          message?: string;
        };
      };
      const message = parsed.error?.message || raw;
      return `Gemini ${action} failed: ${response.status} ${message}`;
    } catch {
      return `Gemini ${action} failed: ${response.status} ${raw}`;
    }
  }

  private async fileToBase64(file: File) {
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer).toString("base64");
  }
}
