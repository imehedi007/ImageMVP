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
      <div className="mx-auto my-auto max-w-xl rounded-[26px] border border-white/10 bg-[#071427] p-8 text-center text-white shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
        <h1 className="text-3xl font-black tracking-tight">No ride story yet</h1>
        <p className="mt-3 text-sm leading-7 text-white/58">
          Generate your personalized scene first, then come back here for the share-ready result.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:-translate-y-0.5"
        >
          Start the experience
        </Link>
      </div>
    );
  }

  return <ResultCard result={result} onRegenerate={() => router.push("/")} />;
}
