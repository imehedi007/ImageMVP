"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { BasicInfoStep } from "@/components/form/basic-info-step";
import { ColorStep } from "@/components/form/color-step";
import { PhotoStep } from "@/components/form/photo-step";
import { ReviewStep } from "@/components/form/review-step";
import { SelectionStep } from "@/components/form/selection-step";
import { Button } from "@/components/ui/button";
import { GenerationPreview } from "@/components/ui/generation-preview";
import { Progress } from "@/components/ui/progress";
import { useExperienceContent } from "@/hooks/useExperienceContent";
import { useFormState } from "@/hooks/useFormState";
import { useImageUpload } from "@/hooks/useImageUpload";
import { saveRideResult } from "@/lib/utils/storage";

const TOTAL_STEPS = 7;

export function RideStoryExperience() {
  const router = useRouter();
  const { data, progress, step, update, next, back, setData } = useFormState(TOTAL_STEPS);
  const { files, previewUrls, updateFiles } = useImageUpload();
  const { content, loading: contentLoading, error: contentError } = useExperienceContent();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [defaultsHydrated, setDefaultsHydrated] = useState(false);

  useEffect(() => {
    if (!content || defaultsHydrated) {
      return;
    }

    setData((current) => ({
      ...current,
      bikeType: content.bikes[0]?.name || current.bikeType,
      environment: (content.environments[0]?.id as typeof current.environment) || current.environment,
      favoriteColor: content.settings.defaultFavoriteColor || content.colors[0] || current.favoriteColor,
      behavior: (content.behaviorQuestion.options[0]?.id as typeof current.behavior) || current.behavior,
      ageRange: content.settings.defaultAgeRange || current.ageRange,
      vibe: current.vibe || content.settings.defaultVibe || current.vibe
    }));
    setDefaultsHydrated(true);
  }, [content, defaultsHydrated, setData]);

  async function handleGenerate() {
    try {
      setLoading(true);
      setError("");

      const formData = new FormData();
      formData.append(
        "payload",
        JSON.stringify({
          ...data,
          photoDataUrl: previewUrls[0],
          photoName: files[0]?.name
        })
      );

      files.forEach((file) => formData.append("photos", file));

      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error("Generation failed");
      }

      const result = await response.json();
      await saveRideResult(result);
      router.push("/result");
    } catch (issue) {
      console.error(issue);
      setError("Your ride story could not be generated. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (contentLoading || !content) {
    return (
      <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="rounded-[32px] border border-white/80 bg-slate-950 p-6 text-white shadow-glow sm:p-8">
          <GenerationPreview loading />
        </aside>
        <div className="rounded-[32px] border border-white/80 bg-white/70 p-8 shadow-glow">
          <div className="h-8 w-56 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-4 h-4 w-80 animate-pulse rounded-full bg-slate-100" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="h-14 animate-pulse rounded-3xl bg-slate-100" />
            <div className="h-14 animate-pulse rounded-3xl bg-slate-100" />
            <div className="h-14 animate-pulse rounded-3xl bg-slate-100 sm:col-span-2" />
          </div>
          {contentError ? <p className="mt-6 text-sm text-rose-600">{contentError}</p> : null}
        </div>
      </div>
    );
  }

  const stepContent = [
    <BasicInfoStep key="basic" data={data} update={update} />,
    <SelectionStep
      key="bike"
      eyebrow="Step 2"
      title="Choose the bike that matches your energy."
      description="These visual styles influence the final scene direction, mood, and visual brand of your ride story."
      options={content.bikes}
      value={data.bikeType}
      onSelect={(value) => update("bikeType", value)}
      type="image"
    />,
    <SelectionStep
      key="environment"
      eyebrow="Step 3"
      title="Pick your ride environment."
      description="Whether you belong to the streets, hills, or coastline, the backdrop should feel like your world."
      options={content.environments}
      value={data.environment}
      onSelect={(value) => update("environment", value as typeof data.environment)}
    />,
    <ColorStep
      key="color"
      colors={content.colors}
      value={data.favoriteColor}
      onSelect={(value) => update("favoriteColor", value)}
    />,
    <SelectionStep
      key="behavior"
      eyebrow="Step 5"
      title={content.behaviorQuestion.title}
      description={content.behaviorQuestion.description}
      options={content.behaviorQuestion.options}
      value={data.behavior}
      onSelect={(value) => update("behavior", value as typeof data.behavior)}
    />,
    <PhotoStep
      key="photo"
      previewUrls={previewUrls}
      maxFiles={1}
      onFileChange={async (nextFiles) => {
        await updateFiles(nextFiles, 1);
      }}
    />,
    <ReviewStep key="review" data={data} />
  ][step];

  return (
    <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
      <aside className="space-y-6 rounded-[32px] border border-white/80 bg-slate-950 p-6 text-white shadow-glow sm:p-8">
        {!loading ? (
          <>
            <div className="space-y-4">
              <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/80">
                {content.hero.eyebrow}
              </span>
              <h1 className="max-w-sm text-4xl font-semibold tracking-tight sm:text-5xl">
                {content.hero.title}
              </h1>
              <p className="max-w-md text-sm leading-7 text-slate-300 sm:text-base">
                {content.hero.description}
              </p>
            </div>

            <Progress current={step} total={TOTAL_STEPS} progress={progress} />

            <div className="grid gap-3">
              {content.hero.highlights.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                  {item}
                </div>
              ))}
            </div>

            <div className="rounded-[28px] bg-gradient-to-br from-white/12 to-white/5 p-5">
              <div className="text-sm font-semibold text-white">{content.hero.viralityTitle}</div>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {content.hero.viralityDescription}
              </p>
            </div>
          </>
        ) : null}

        {loading ? <GenerationPreview loading={loading} /> : null}
      </aside>

      <div className="space-y-5">
        {stepContent}

        {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
        <p className="text-xs leading-6 text-slate-500">
          If AI generation is unavailable, the app will still return a preview result so the flow remains testable.
        </p>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" onClick={back} disabled={step === 0 || loading}>
            Back
          </Button>
          {step === TOTAL_STEPS - 1 ? (
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? "Generating your scene..." : "Generate My Ride Story"}
            </Button>
          ) : (
            <Button onClick={next}>Continue</Button>
          )}
        </div>
      </div>
    </div>
  );
}
