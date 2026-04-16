import { RideGenerationResponse } from "@/types";

const STORAGE_KEY = "ride-story-result";
const DB_NAME = "ride-story-db";
const STORE_NAME = "results";

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

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Failed to open ride story database."));
  });
}
