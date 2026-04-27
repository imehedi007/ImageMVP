import { RideGenerationResponse } from "@/types";
import { getJobBlobs, saveJobInputBlobs, saveJobResultBlob } from "./mysql";

interface StoredInputManifestItem {
  name: string;
  type: string;
  data: string; // base64
}

export async function saveJobInputFiles(jobId: number, files: File[]) {
  const manifest: StoredInputManifestItem[] = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");

    manifest.push({
      name: file.name,
      type: file.type || "image/jpeg",
      data: base64
    });
  }

  await saveJobInputBlobs(jobId, JSON.stringify(manifest));
}

export async function loadJobInputFiles(jobId: number) {
  const blobs = await getJobBlobs(jobId);
  if (!blobs || !blobs.input_images_json) {
    throw new Error(`No input images found in database for job ${jobId}`);
  }

  const manifest = JSON.parse(blobs.input_images_json) as StoredInputManifestItem[];

  return manifest.map((item) => {
    const buffer = Buffer.from(item.data, "base64");
    return new File([buffer], item.name, { type: item.type });
  });
}

export async function saveJobResult(jobId: number, result: RideGenerationResponse) {
  await saveJobResultBlob(jobId, JSON.stringify(result));
}

export async function loadJobResult(jobId: number) {
  try {
    const blobs = await getJobBlobs(jobId);
    if (!blobs || !blobs.result_data_json) {
      return null;
    }

    return JSON.parse(blobs.result_data_json) as RideGenerationResponse;
  } catch {
    return null;
  }
}
