import { AIRuntimeConfig } from "@/config/ai.config";
import { AIProvider, GenerateImageParams } from "@/lib/ai/types";

export class OpenRouterProvider implements AIProvider {
  constructor(private readonly config: AIRuntimeConfig) {}

  async generateText(prompt: string): Promise<string> {
    const response = await fetch(`${this.config.apiUrl || "https://openrouter.ai/api/v1"}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.textModel,
        messages: [
          {
            role: "system",
            content: "You create vibrant, emotionally intelligent, social-media-ready personality copy."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.9
      })
    });

    if (!response.ok) {
      throw new Error(await this.buildErrorMessage("text", response));
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "{}";
  }

  async generateImage({ prompt, images = [], image }: GenerateImageParams): Promise<string> {
    const referenceImages = images.length
      ? images.slice(0, this.config.maxReferenceImages)
      : image
        ? [image]
        : [];

    const content: Array<Record<string, unknown>> = [
      {
        type: "text",
        text: prompt
      }
    ];

    for (const file of referenceImages) {
      content.push({
        type: "image_url",
        image_url: {
          url: await this.fileToDataUrl(file)
        }
      });
    }

    const response = await fetch(`${this.config.apiUrl || "https://openrouter.ai/api/v1"}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.imageModel,
        messages: [
          {
            role: "user",
            content
          }
        ],
        modalities: ["image", "text"],
        image_config: {
          aspect_ratio: this.config.imageAspectRatio,
          image_size: this.config.imageSize
        }
      })
    });

    if (!response.ok) {
      throw new Error(await this.buildErrorMessage("image generation", response));
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;
    const imageItem = message?.images?.[0];

    if (imageItem?.image_url?.url) {
      return imageItem.image_url.url as string;
    }

    if (imageItem?.imageUrl?.url) {
      return imageItem.imageUrl.url as string;
    }

    throw new Error("OpenRouter image response did not include an image payload.");
  }

  private async buildErrorMessage(action: string, response: Response) {
    const raw = await response.text();

    try {
      const parsed = JSON.parse(raw);
      const message = parsed?.error?.message || parsed?.message || raw;
      return `OpenRouter ${action} failed: ${response.status} ${message}`;
    } catch {
      return `OpenRouter ${action} failed: ${response.status} ${raw}`;
    }
  }

  private async fileToDataUrl(file: File) {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return `data:${file.type || "image/jpeg"};base64,${base64}`;
  }
}
