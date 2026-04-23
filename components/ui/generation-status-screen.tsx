"use client";

import { useEffect, useMemo, useState } from "react";

interface GenerationStatusScreenProps {
  bikeName?: string;
}

export function GenerationStatusScreen({ bikeName }: GenerationStatusScreenProps) {
  const stages = useMemo(
    () => [
      "Reading your details",
      `Mapping ${bikeName || "Yamaha"} selection`,
      "Rendering cinematic portrait",
      "Building persona card"
    ],
    [bikeName]
  );
  const [activeStage, setActiveStage] = useState(0);
  const [progress, setProgress] = useState(12);

  useEffect(() => {
    const stageTimer = window.setInterval(() => {
      setActiveStage((current) => Math.min(current + 1, stages.length - 1));
    }, 2600);

    const progressTimer = window.setInterval(() => {
      setProgress((current) => Math.min(current + 5, 94));
    }, 520);

    return () => {
      window.clearInterval(stageTimer);
      window.clearInterval(progressTimer);
    };
  }, [stages.length]);

  return (
    <section className="relative isolate flex min-h-[100svh] items-center justify-center overflow-hidden rounded-[32px] border border-blue-400/15 bg-[#041122] px-5 py-10 text-white sm:px-8 sm:py-12">
      <div className="absolute left-1/2 top-1/2 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-500/10" />
      <div className="absolute left-1/2 top-1/2 h-[470px] w-[470px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-500/10" />
      <div className="absolute left-1/2 top-1/2 h-[310px] w-[310px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-500/10" />

      <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center justify-center text-center">
        <div className="mb-9 flex items-center gap-4">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-blue-500/70 bg-[#0d2444] text-3xl font-semibold text-blue-300 shadow-[0_0_0_8px_rgba(29,78,216,0.08)]">
            <span className="absolute inset-[-7px] rounded-full border border-blue-500/70" />
            <span className="loading-orbit absolute inset-[-7px] rounded-full">
              <span className="absolute left-1/2 top-[-5px] h-3 w-3 -translate-x-1/2 rounded-full bg-blue-300 shadow-[0_0_18px_rgba(96,165,250,0.95)]" />
            </span>
            Y
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] uppercase tracking-[0.48em] text-blue-300/70 sm:text-xs">
            AI is rendering your cinematic portrait
          </p>
          <h2 className="text-4xl font-black uppercase tracking-[-0.04em] text-white sm:text-5xl md:text-6xl">
            Crafting Your
            <span className="mt-1 block text-blue-300">Persona</span>
          </h2>
          <p className="mx-auto max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
            We are matching your photo, bike selection, and destination to produce a share-ready Yamaha persona card.
          </p>
        </div>

        <div className="mt-14 w-full max-w-xl">
          <div className="mb-5 min-h-7 text-center text-[12px] font-semibold uppercase tracking-[0.36em] text-blue-200 sm:text-sm">
            {stages[activeStage]}
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-blue-950/70">
            <div
              className="h-full rounded-full bg-blue-400 transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-5 text-center text-[11px] uppercase tracking-[0.5em] text-blue-300/70">
            Processing . Please wait
          </div>
        </div>
      </div>
    </section>
  );
}
