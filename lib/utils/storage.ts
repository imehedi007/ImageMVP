import { RideFormData, RideGenerationResponse } from "@/types";

const STORAGE_KEY = "ride-story-result";
const DRAFT_KEY = "ride-story-draft";
const DB_NAME = "ride-story-db";
const DB_VERSION = 2;
const STORE_NAME = "results";
const DRAFT_STORE_NAME = "drafts";

export interface RideDraft {
  data: RideFormData;
  previewUrls: string[];
  hasStarted: boolean;
  currentStep: number;
  otpSent: boolean;
  otpVerified: boolean;
}

export async function saveRideResult(result: RideGenerationResponse) {
  if (typeof window === "undefined") {
    return;
  }

  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(result, STORAGE_KEY);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error("Failed to save ride result."));
  });
}

export async function loadRideResult(): Promise<RideGenerationResponse | null> {
  if (typeof window === "undefined") {
    return null;
  }

  const db = await openDatabase();
  return new Promise<RideGenerationResponse | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(STORAGE_KEY);

    request.onsuccess = () => resolve((request.result as RideGenerationResponse | undefined) || null);
    request.onerror = () => reject(request.error || new Error("Failed to load ride result."));
  });
}

export async function saveRideDraft(draft: RideDraft) {
  if (typeof window === "undefined") {
    return;
  }

  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DRAFT_STORE_NAME, "readwrite");
    const store = tx.objectStore(DRAFT_STORE_NAME);
    const request = store.put(draft, DRAFT_KEY);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error("Failed to save ride draft."));
  });
}

export async function loadRideDraft(): Promise<RideDraft | null> {
  if (typeof window === "undefined") {
    return null;
  }

  const db = await openDatabase();
  return new Promise<RideDraft | null>((resolve, reject) => {
    const tx = db.transaction(DRAFT_STORE_NAME, "readonly");
    const store = tx.objectStore(DRAFT_STORE_NAME);
    const request = store.get(DRAFT_KEY);

    request.onsuccess = () => resolve((request.result as RideDraft | undefined) || null);
    request.onerror = () => reject(request.error || new Error("Failed to load ride draft."));
  });
}

export async function clearRideDraft() {
  if (typeof window === "undefined") {
    return;
  }

  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DRAFT_STORE_NAME, "readwrite");
    const store = tx.objectStore(DRAFT_STORE_NAME);
    const request = store.delete(DRAFT_KEY);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error("Failed to clear ride draft."));
  });
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }

      if (!db.objectStoreNames.contains(DRAFT_STORE_NAME)) {
        db.createObjectStore(DRAFT_STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Failed to open ride story database."));
  });
}
