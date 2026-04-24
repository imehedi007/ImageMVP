"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { BasicInfoStep } from "@/components/form/basic-info-step";
import { SelectionStep } from "@/components/form/selection-step";
import { Button } from "@/components/ui/button";
import { GenerationStatusScreen } from "@/components/ui/generation-status-screen";
import { useExperienceContent } from "@/hooks/useExperienceContent";
import { useFormState } from "@/hooks/useFormState";
import { useImageUpload } from "@/hooks/useImageUpload";
import { calculateAgeFromDateOfBirth } from "@/lib/utils/age";
import { saveRideResult } from "@/lib/utils/storage";

const TOTAL_STEPS = 3;

export function RideStoryExperience() {
  const router = useRouter();
  const { data, progress, step, update, next, back, setData } = useFormState(TOTAL_STEPS);
  const { files, previewUrls, updateFiles } = useImageUpload();
  const { content, loading: contentLoading, error: contentError } = useExperienceContent();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpStatusMessage, setOtpStatusMessage] = useState("");
  const [otpError, setOtpError] = useState("");
  const [defaultsHydrated, setDefaultsHydrated] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

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
      vibe: current.vibe || content.settings.defaultVibe || current.vibe
    }));
    setDefaultsHydrated(true);
  }, [content, defaultsHydrated, setData]);

  const selectedBike = useMemo(
    () => content?.bikes.find((bike) => bike.name === data.bikeType)?.name || data.bikeType,
    [content?.bikes, data.bikeType]
  );

  function handleDateOfBirthChange(value: string) {
    update("dateOfBirth", value);

    try {
      const nextAge = value ? String(calculateAgeFromDateOfBirth(value)) : "";
      update("ageRange", nextAge);
      setOtpError("");
    } catch (issue) {
      update("ageRange", "");
      if (value) {
        setOtpError(issue instanceof Error ? issue.message : "Enter a valid date of birth.");
      }
    }

    resetOtpState();
  }

  function resetOtpState() {
    setOtpCode("");
    setOtpSent(false);
    setOtpVerified(false);
    setOtpStatusMessage("");
    setOtpError("");
  }

  async function handleSendOtp() {
    try {
      setOtpBusy(true);
      setOtpError("");
      setOtpStatusMessage("");

      const response = await fetch("/api/otp/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          phone: data.phone
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "OTP could not be sent.");
      }

      setOtpSent(true);
      setOtpVerified(false);
      setOtpStatusMessage("OTP sent successfully. Enter the 4-digit code to verify.");
    } catch (issue) {
      setOtpError(issue instanceof Error ? issue.message : "OTP could not be sent.");
    } finally {
      setOtpBusy(false);
    }
  }

  async function handleVerifyOtp() {
    try {
      setOtpBusy(true);
      setOtpError("");
      setOtpStatusMessage("");

      const response = await fetch("/api/otp/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          age: data.ageRange,
          dateOfBirth: data.dateOfBirth,
          otp: otpCode
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "OTP verification failed.");
      }

      if (result.phone) {
        update("phone", result.phone);
      }
      setOtpVerified(true);
      setOtpStatusMessage("Phone number verified successfully.");
    } catch (issue) {
      setOtpVerified(false);
      setOtpError(issue instanceof Error ? issue.message : "OTP verification failed.");
    } finally {
      setOtpBusy(false);
    }
  }

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
      setLoading(false);
    }
  }

  const canContinueProfile =
    Boolean(data.name.trim()) && Boolean(data.phone.trim()) && Boolean(previewUrls[0]) && otpVerified;
  const canGenerate = Boolean(data.environment) && !loading;

  if (loading) {
    return <GenerationStatusScreen bikeName={selectedBike} />;
  }

  if (contentLoading || !content) {
    return (
      <section className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-xl rounded-[32px] border border-blue-400/10 bg-[#071427]/85 p-6 shadow-[0_25px_60px_rgba(2,10,28,0.45)] backdrop-blur sm:p-8">
          <div className="h-3 w-44 animate-pulse rounded-full bg-blue-400/20" />
          <div className="mt-5 h-16 w-4/5 animate-pulse rounded-[24px] bg-white/6" />
          <div className="mt-4 h-16 w-full animate-pulse rounded-[24px] bg-white/6" />
          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="h-32 animate-pulse rounded-[24px] bg-white/6" />
            <div className="h-32 animate-pulse rounded-[24px] bg-white/6" />
          </div>
          {contentError ? <p className="mt-6 text-sm text-rose-300">{contentError}</p> : null}
        </div>
      </section>
    );
  }

  if (!hasStarted) {
    return (
      <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden py-6 text-white sm:py-8">
        <div className="absolute inset-0 bg-[#041122]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.025)_1px,transparent_1.5px)] bg-[length:22px_22px] opacity-20" />

        <div className="relative mx-auto flex w-full max-w-[720px] flex-col items-center text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/[0.04] bg-white/[0.055] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:mb-5 sm:text-[12px]">
            <LandingIcon type="sparkle" className="text-[#6687ff]" />
            AI Powered
          </div>

          <h1 className="text-[clamp(2rem,8vw,4rem)] font-black leading-[0.9] tracking-[-0.07em] text-white sm:text-[clamp(2rem,8vw,4rem)]">
            Your Ride 
            <span className="text-[#6687ff] ml-3">
              Story
            </span>
          </h1>

          <p className="mt-5 max-w-[470px] px-2 text-sm font-normal text-white/70 sm:mt-5 sm:px-0">
            Discover your unique rider personality and generate a cinematic AI avatar of you on your dream bike.
          </p>

          <Button
            onClick={() => setHasStarted(true)}
            className="mt-10 w-full max-w-[220px] rounded-[24px] border-0 bg-white text-sm font-normal tracking-[0.04em] text-black shadow-none [background-image:none] hover:bg-white hover:[background-image:none]"
          >
            Start the Journey
          </Button>


        </div>
      </section>
    );
  }

  const stepScreens = [
    <BasicInfoStep
      key="profile"
      data={data}
      previewUrls={previewUrls}
      onFileChange={async (nextFiles) => {
        await updateFiles(nextFiles, 1);
      }}
      update={(key, value) => {
        update(key, value);

        if (key === "name" || key === "phone") {
          resetOtpState();
        }
      }}
      onDateOfBirthChange={handleDateOfBirthChange}
      otpCode={otpCode}
      onOtpChange={setOtpCode}
      onSendOtp={handleSendOtp}
      onVerifyOtp={handleVerifyOtp}
      otpSent={otpSent}
      otpVerified={otpVerified}
      otpBusy={otpBusy}
      otpStatusMessage={otpStatusMessage}
      otpError={otpError}
    />,
    <SelectionStep
      key="bike"
      eyebrow="Step 2"
      title="Choose your bike"
      description="Select the bike you want to appear with. Mobile view keeps the cards compact so browsing feels fast."
      options={content.bikes}
      value={data.bikeType}
      onSelect={(value) => update("bikeType", value)}
      type="image"
    />,
    <SelectionStep
      key="environment"
      eyebrow="Step 3"
      title="Pick your ride environment."
      description="Choose the Bangladesh backdrop that should shape your final portrait scene."
      options={content.environments}
      value={data.environment}
      onSelect={(value) => update("environment", value as typeof data.environment)}
      type="image"
    />
  ];

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-[1240px] flex-col justify-center py-6 sm:py-8">
      <div className="">
        <WizardStepper step={step} />

        <div className="mt-10 space-y-5 md:mt-12">
          {stepScreens[step]}

          {error ? <p className="text-sm font-medium text-rose-300">{error}</p> : null}

          <div className="mx-auto flex w-full max-w-[640px] gap-4 pt-2 sm:pt-3">
            <Button
              variant="dark"
              onClick={step === 0 ? () => setHasStarted(false) : back}
              className="h-14 flex-1 rounded-[12px] font-medium"
              disabled={loading}
            >
              <span className="mr-3 text-xl leading-none">←</span> Back
            </Button>

            {step === TOTAL_STEPS - 1 ? (
              <Button
                onClick={handleGenerate}
                className="h-14 flex-1 rounded-[12px] font-medium"
                disabled={!canGenerate}
              >
                Generate <span className="ml-3 text-xl leading-none">→</span>
              </Button>
            ) : (
              <Button
                onClick={next}
                className="h-14 flex-1 rounded-[12px] font-medium"
                disabled={step === 0 ? !canContinueProfile : false}
              >
                Continue <span className="ml-3 text-xl leading-none">→</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function normalizeAgeValue(value: string) {
  return value.match(/\d+/)?.[0] || value;
}

function LandingStepCard({
  index,
  title,
  description,
  icon,
  mobile = false
}: {
  index: string;
  title: string;
  description: string;
  icon: "person" | "bike" | "pin";
  mobile?: boolean;
}) {
  return (
    <div
      className={`relative z-10 rounded-[22px] border border-[#dce6f6] bg-white/86 shadow-[0_14px_35px_rgba(26,60,116,0.08)] ${
        mobile ? " items-center gap-4 px-3 py-3 text-left" : "px-5 py-5 text-center"
      }`}
    >
      <div className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#126df6] text-base font-bold text-white shadow-[0_10px_22px_rgba(18,109,246,0.28)]">
        {index}
      </div>

      <div
        className={`flex items-center justify-center rounded-full bg-white text-[#126df6] shadow-[0_14px_32px_rgba(26,60,116,0.1)] ${
          mobile ? "h-10 w-10 p-2" : "mx-auto h-20 w-20"
        }`}
      >
        <LandingIcon type={icon} />
      </div>

      <div className={mobile ? "" : "mt-6"}>
        <div className="text-lg font-black text-[#071847]">{title}</div>
        <p className="mt-2 text-base font-medium text-[#68718d]">{description}</p>
      </div>
    </div>
  );
}

function LandingFeature({
  icon,
  title,
  subtitle,
  bordered = false
}: {
  icon: "scan" | "magic" | "share";
  title: string;
  subtitle: string;
  bordered?: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 items-center justify-center gap-3 px-3 sm:gap-4 sm:px-6 ${
        bordered ? "border-x border-white/[0.09]" : ""
      }`}
    >
      <LandingIcon
        type={icon}
        className={
          icon === "magic"
            ? "h-6 w-6 text-[#9b42ff] sm:h-8 sm:w-8"
            : icon === "share"
              ? "h-7 w-7 text-[#80f4e3] sm:h-8 sm:w-8"
              : "h-7 w-7 text-[#627aff] sm:h-8 sm:w-8"
        }
      />
      <div className="min-w-0">
        <div className="truncate text-[0.95rem] font-semibold leading-tight tracking-[-0.04em] text-white sm:text-[0.9rem]">
          {title}
        </div>
        <div className="mt-1 truncate text-[0.78rem] leading-tight text-white/58 sm:text-[0.78rem]">{subtitle}</div>
      </div>
    </div>
  );
}

function LandingMetric({ value, label, bordered = false }: { value: string; label: string; bordered?: boolean }) {
  return (
    <div className={`px-4 ${bordered ? "border-x border-white/[0.1]" : ""}`}>
      <div className="text-[1.8rem] font-black leading-none tracking-[-0.04em] text-white sm:text-[1.55rem]">
        {value}
      </div>
      <div className="mx-auto mt-2 max-w-[80px] text-[0.95rem] leading-[1.35] text-white/62 sm:text-[0.82rem]">
        {label}
      </div>
    </div>
  );
}

function LandingIcon({
  type,
  className = ""
}: {
  type:
    | "person"
    | "bike"
    | "pin"
    | "bolt"
    | "shield"
    | "send"
    | "sparkle"
    | "scan"
    | "magic"
    | "share"
    | "play"
    | "lock";
  className?: string;
}) {
  const baseClass = className || "h-10 w-10";
  const stroke = 2;

  if (type === "sparkle") {
    return (
      <svg className={baseClass} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M8 3l1.6 4.4L14 9l-4.4 1.6L8 15l-1.6-4.4L2 9l4.4-1.6L8 3Z" fill="currentColor" />
        <path d="M17 11l1.1 3 2.9 1.1-2.9 1.1L17 19l-1.1-2.8L13 15.1l2.9-1.1L17 11Z" fill="currentColor" />
      </svg>
    );
  }

  if (type === "scan") {
    return (
      <svg className={baseClass} viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path d="M13 8H8v8M35 8h5v8M13 40H8v-8M35 40h5v-8" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" />
        <path d="m24 17 6 12H18l6-12Z" stroke="currentColor" strokeWidth={stroke} strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "magic") {
    return (
      <svg className={baseClass} viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path d="M20 5l4.4 12.2L36 22l-11.6 4.8L20 39l-4.4-12.2L4 22l11.6-4.8L20 5Z" stroke="currentColor" strokeWidth={stroke} strokeLinejoin="round" />
        <path d="M36 8v8M32 12h8M38 28v6M35 31h6" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "share") {
    return (
      <svg className={baseClass} viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path d="M8 30c13-2 20-8 26-18v10h8C34 31 24 37 8 39v-9Z" stroke="currentColor" strokeWidth={stroke} strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "play") {
    return (
      <svg className={baseClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M8 5.5v13l10-6.5-10-6.5Z" fill="currentColor" />
      </svg>
    );
  }

  if (type === "lock") {
    return (
      <svg className={baseClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 10V8a5 5 0 0 1 10 0v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M6 10h12v10H6V10Z" fill="currentColor" opacity="0.9" />
      </svg>
    );
  }

  if (type === "person") {
    return (
      <svg className={baseClass} viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <circle cx="24" cy="17" r="8" stroke="currentColor" strokeWidth={stroke} />
        <path d="M11 41c2.4-8.2 7-12.2 13-12.2S34.6 32.8 37 41" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "bike") {
    return (
      <svg className={baseClass} viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <circle cx="15" cy="31" r="6" stroke="currentColor" strokeWidth={stroke} />
        <circle cx="35" cy="31" r="6" stroke="currentColor" strokeWidth={stroke} />
        <path d="M15 31h8l6-10h5l-3 10M23 31l-6-10h8m7-6h6" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "pin") {
    return (
      <svg className={baseClass} viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path d="M24 43s13-12.3 13-25A13 13 0 1 0 11 18c0 12.7 13 25 13 25Z" stroke="currentColor" strokeWidth={stroke} strokeLinejoin="round" />
        <circle cx="24" cy="18" r="4" stroke="currentColor" strokeWidth={stroke} />
      </svg>
    );
  }

  if (type === "shield") {
    return (
      <svg className={baseClass} viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path d="M24 5 38 10v10c0 10.6-5.4 18-14 23-8.6-5-14-12.4-14-23V10l14-5Z" stroke="currentColor" strokeWidth={stroke} />
        <path d="m18 24 4 4 8-9" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "send") {
    return (
      <svg className={baseClass} viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path d="M42 7 21 42l-4-16-13-6L42 7Z" stroke="currentColor" strokeWidth={stroke} strokeLinejoin="round" />
        <path d="m17 26 25-19" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg className={baseClass} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="m27 3-16 24h12l-2 18 16-25H25l2-17Z" stroke="currentColor" strokeWidth={stroke} strokeLinejoin="round" />
    </svg>
  );
}

function SidebarTag({ active, index, label }: { active: boolean; index: string; label: string }) {
  return (
    <div
      className={`rounded-[24px] border px-4 py-4 transition ${
        active ? "border-blue-400/35 bg-blue-500/10 text-white" : "border-white/8 bg-white/5 text-slate-400"
      }`}
    >
      <div className="text-[11px] uppercase tracking-[0.35em] text-blue-300/75">{index}</div>
      <div className="mt-2 text-sm font-medium">{label}</div>
    </div>
  );
}

function WizardStepper({ step }: { step: number }) {
  const steps = ["User Data", "Bike", "Environment"];

  return (
    <div className="mx-auto w-full max-w-[760px]">
      <div className="grid grid-cols-[1fr_1fr_1fr] items-start">
        {steps.map((label, index) => {
          const active = step === index;
          const complete = step > index;

          return (
            <div key={label} className="relative flex flex-col items-center">
              {index > 0 ? (
                <div
                  className={`absolute right-1/2 top-4 h-px w-full ${
                    complete || active ? "bg-[#8f96ff]/40" : "bg-white/14"
                  }`}
                />
              ) : null}
              <div
                className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold ${
                  active
                    ? "border-[#8f96ff] bg-[#8f96ff] text-[#05070b] shadow-[0_0_24px_rgba(143,150,255,0.42)]"
                    : complete
                      ? "border-[#8f96ff]/55 bg-[#8f96ff]/18 text-white"
                      : "border-white/17 bg-transparent text-white/64"
                }`}
              >
                {index + 1}
              </div>
              <div className={`mt-3 text-center text-sm ${active ? "text-[#a8adff]" : "text-white/62"}`}>
                {label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProcessTab({ active, index, label }: { active: boolean; index: string; label: string }) {
  return (
    <div
      className={`rounded-[22px] border px-5 py-4 transition ${
        active ? "border-[#1f90ff] text-[#7fb5ff]" : "border-white/25 text-white"
      }`}
    >
      <div className="text-sm font-medium">{index}</div>
      <div className="mt-2 text-[0.95rem] uppercase leading-7">{label}</div>
    </div>
  );
}
