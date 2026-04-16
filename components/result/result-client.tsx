"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ResultCard } from "@/components/result/result-card";
import { Button } from "@/components/ui/button";
import { loadRideResult } from "@/lib/utils/storage";
import { RideGenerationResponse } from "@/types";

export function ResultClient() {
  const router = useRouter();
  const [result, setResult] = useState<RideGenerationResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const stored = await loadRideResult();

        if (!cancelled) {
          setResult(stored);
        }
      } catch (error) {
        console.error(error);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!result) {
    return (
      <div className="mx-auto max-w-xl rounded-[32px] border border-white/80 bg-white/75 p-8 text-center shadow-glow backdrop-blur">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">No ride story yet</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Generate your personalized scene first, then come back here for the share-ready result.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black"
        >
          Start the experience
        </Link>
      </div>
    );
  }

  return <ResultCard result={result} onRegenerate={() => router.push("/")} />;
}
