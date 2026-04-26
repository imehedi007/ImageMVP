import { promises as fs } from "fs";
import os from "os";
import path from "path";

import { RideGenerationResponse } from "@/types";

interface StoredInputManifestItem {
  name: string;
  type: string;
  fileName: string;
}

const JOB_BASE_DIR = path.join(os.tmpdir(), "yamaha-ai-generation-jobs");

function getJobDir(jobId: number) {
  return path.join(JOB_BASE_DIR, String(jobId));
}

function getInputsDir(jobId: number) {
  return path.join(getJobDir(jobId), "inputs");
}

function getManifestPath(jobId: number) {
  return path.join(getJobDir(jobId), "manifest.json");
}

function getResultPath(jobId: number) {
  return path.join(getJobDir(jobId), "result.json");
}

export async function saveJobInputFiles(jobId: number, files: File[]) {
  const inputsDir = getInputsDir(jobId);
  await fs.mkdir(inputsDir, { recursive: true });

  const manifest: StoredInputManifestItem[] = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
    const storedName = `input-${index + 1}.${extension || "jpg"}`;
    const filePath = path.join(inputsDir, storedName);
    const buffer = Buffer.from(await file.arrayBuffer());

    await fs.writeFile(filePath, buffer);
    manifest.push({
      name: file.name,
      type: file.type || "image/jpeg",
      fileName: storedName
    });
  }

  await fs.writeFile(getManifestPath(jobId), JSON.stringify(manifest, null, 2), "utf8");
}

export async function loadJobInputFiles(jobId: number) {
  const rawManifest = await fs.readFile(getManifestPath(jobId), "utf8");
  const manifest = JSON.parse(rawManifest) as StoredInputManifestItem[];

  return Promise.all(
    manifest.map(async (item) => {
      const buffer = await fs.readFile(path.join(getInputsDir(jobId), item.fileName));
      return new File([buffer], item.name, { type: item.type });
    })
  );
}

export async function saveJobResult(jobId: number, result: RideGenerationResponse) {
  await fs.mkdir(getJobDir(jobId), { recursive: true });
  await fs.writeFile(getResultPath(jobId), JSON.stringify(result), "utf8");
}

export async function loadJobResult(jobId: number) {
  try {
    const raw = await fs.readFile(getResultPath(jobId), "utf8");
    return JSON.parse(raw) as RideGenerationResponse;
  } catch {
    return null;
  }
}
