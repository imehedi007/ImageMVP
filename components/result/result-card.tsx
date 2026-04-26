"use client";

import { useState } from "react";

import { ResultActions } from "@/components/result/result-actions";
import { Button } from "@/components/ui/button";
import { RideGenerationResponse } from "@/types";

interface Props {
  result: RideGenerationResponse;
  onRegenerate: () => void;
}

export function ResultCard({ result, onRegenerate }: Props) {
  const [showPrompt, setShowPrompt] = useState(false);

  return (
    <section className="mx-auto grid min-h-screen w-full max-w-7xl items-top items-start gap-8 py-6 lg:grid-cols-[0.92fr_1.08fr] lg:py-10">
      <div className="rounded-[26px] border border-white/10 bg-[#071427] p-3 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-[#0b1728]">
          <img src={result.imageUrl} alt="Generated Yamaha persona card" className="h-full w-full object-contain" />
        </div>
      </div>

      <div className="space-y-4 text-white">
        <div className="space-y-6">
          <span className="inline-flex rounded-full bg-[#24255f] px-4 py-2 text-xs font-light  uppercase text-[#b3a7ff]">
            Your Result
          </span>
          <h1 className="max-w-[720px] text-[clamp(1.6rem,3.6vw,3rem)] font-black leading-[1.12] tracking-[-0.055em]">
            Your ride personality is ready.
          </h1>
          <p className="max-w-[700px] text-md text-white/62">
            {result.summary}
          </p>
        </div>

        <div className="h-px w-full bg-white/12" />

        <div className="space-y-6">
          <h2 className="text-sm font-normal uppercase  text-[#a69bff]">
            Share your persona card
          </h2>
          <ResultActions result={result} />
        </div>

        <div className="rounded-[18px] border border-[#675dff]/80 bg-[#071427] p-4">
          <div className="flex items-center gap-3 text-sm font-normal uppercase text-[#a69bff]">
            <span className="text-lg">🏆</span>
            Active Contest
          </div>
          {/* <h3 className="mt-6 text-[16px] font-black uppercase leading-tight tracking-[0.02em] text-white">
            Win a Yamaha R15M
          </h3> */}
          <p className="mt-3 text-sm text-white/40">
            Share your Persona Card with #MyYamahaPersona on any platform. The most creative share wins a brand-new
            Yamaha R15M.
          </p>
          {/* <p className="mt-5 text-[14px] font-medium text-white/58">
            Contest closes August 31, 2025.
          </p> */}
        </div>

        {result.providerError ? (
          <div className="rounded-[16px] border border-amber-300/25 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
            AI fallback used: {result.providerError}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button variant="dark" onClick={onRegenerate} className="rounded-[12px] px-7">
            Regenerate
          </Button>
          <Button variant="dark" onClick={() => setShowPrompt((current) => !current)} className="rounded-[12px] px-7">
            {showPrompt ? "Hide Prompt" : "Show Prompt"}
          </Button>
        </div>

        {showPrompt ? (
          <div className="rounded-[16px] border border-white/10 bg-white/[0.03] p-5 text-sm leading-7 text-white/58">
            {result.prompt}
          </div>
        ) : null}
      </div>
    </section>
  );
}
