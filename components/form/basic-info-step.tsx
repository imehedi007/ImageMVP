import Image from "next/image";
import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { RideFormData } from "@/types";

interface Props {
  data: RideFormData;
  previewUrls: string[];
  onFileChange: (files: FileList | null) => void | Promise<void>;
  update: <K extends keyof RideFormData>(key: K, value: RideFormData[K]) => void;
  onDateOfBirthChange: (value: string) => void;
  otpCode: string;
  onOtpChange: (value: string) => void;
  onSendOtp: () => void | Promise<void>;
  onVerifyOtp: () => void | Promise<void>;
  otpSent: boolean;
  otpVerified: boolean;
  otpBusy: boolean;
  otpAction: "send" | "verify" | null;
  otpLocked: boolean;
  otpStatusMessage?: string;
  otpError?: string;
}

export function BasicInfoStep({
  data,
  previewUrls,
  onFileChange,
  update,
  onDateOfBirthChange,
  otpCode,
  onOtpChange,
  onSendOtp,
  onVerifyOtp,
  otpSent,
  otpVerified,
  otpBusy,
  otpAction,
  otpLocked,
  otpStatusMessage,
  otpError
}: Props) {
  return (
    <section className="mx-auto w-full max-w-[640px]">
      <div className="mb-8 text-center md:mb-7">
        <h2 className="text-[1.85rem] font-black leading-tight tracking-[-0.04em] text-white md:text-[2.05rem]">
          Tell us about you
        </h2>
        <p className="mt-3 text-[0.95rem] leading-6 text-white/68 md:text-[1rem]">
          Enter your details to personalize your AI avatar experience.
        </p>
      </div>

      <div className="space-y-5">
        <Field label="Full Name">
          <InputWithIcon
            icon="user"
            placeholder="Enter your full name"
            value={data.name}
            onChange={(event) => update("name", event.target.value)}
          />
        </Field>

        <Field label="Date of Birth">
          <div className="relative">
            <FieldIcon
              type="calendar"
              className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-white/48"
            />
            <Input
              type="date"
              value={data.dateOfBirth}
              onChange={(event) => onDateOfBirthChange(event.target.value)}
              className="h-[52px] rounded-md border border-white/[0.065] bg-transparent pl-12 text-[0.95rem] text-white [background-image:none] placeholder:text-white/42 focus:border-white/16 focus:ring-0"
            />
          </div>
          {data.ageRange ? <p className="text-xs text-white/50">Calculated age: {data.ageRange}</p> : null}
        </Field>

        <Field label="Mobile Number">
          <div className="relative">
            <InputWithIcon
              icon="phone"
              placeholder="Enter your mobile number"
              value={data.phone}
              onChange={(event) => update("phone", event.target.value)}
              className="pr-32"
            />
            <button
              type="button"
              onClick={onSendOtp}
              disabled={otpBusy || otpLocked || !data.phone.trim()}
              className="absolute right-2 top-1/2 h-9 -translate-y-1/2 rounded-[5px] bg-[#282a57] px-4 text-xs text-white transition hover:bg-[#32366b] disabled:cursor-not-allowed disabled:opacity-55"
            >
              {otpVerified ? "Verified" : otpLocked ? "Locked" : otpAction === "send" ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}
            </button>
          </div>
        </Field>

        {otpSent ? (
          <Field label="OTP Verification">
            <div className="relative">
              <InputWithIcon
                icon="shield"
                placeholder="Enter 4-digit OTP"
                className="pr-32"
                value={otpCode}
                onChange={(event) => onOtpChange(event.target.value)}
                inputMode="numeric"
                maxLength={4}
              />
              <button
                type="button"
                onClick={onVerifyOtp}
                disabled={otpBusy || otpLocked || otpVerified || otpCode.trim().length < 4}
                className="absolute right-2 top-1/2 h-9 -translate-y-1/2 rounded-[5px] bg-[#282a57] px-4 text-xs text-white transition hover:bg-[#32366b] disabled:cursor-not-allowed disabled:opacity-55"
              >
                {otpVerified ? "Verified" : otpLocked ? "Locked" : otpAction === "verify" ? "Verifying..." : "Verify OTP"}
              </button>
            </div>
          </Field>
        ) : null}

        {otpStatusMessage ? <p className="text-sm text-emerald-300">{otpStatusMessage}</p> : null}
        {otpError ? <p className="text-sm text-rose-300">{otpError}</p> : null}

        {otpVerified ? (
          <div className="space-y-2">
            <div className="text-[0.9rem] font-semibold text-white">Your Photo</div>
            <p className="text-[0.8rem] text-white/30">Upload a clear front-facing photo</p>

            <label className="mt-3 flex min-h-[156px] cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed border-white/20 bg- px-5 py-5 text-center transition hover:border-white/28 md:min-h-[180px]">
              <input
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={(event) => onFileChange(event.target.files)}
              />

              {previewUrls[0] ? (
                <div className="relative min-h-[150px]  max-w-[200px] w-[100%] overflow-hidden rounded-md md:min-h-[170px]">
                  <Image src={previewUrls[0]} alt="Selected rider preview" fill className="object-cover" />
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.035] text-white/50 md:h-[72px] md:w-[72px]">
                    <FieldIcon type="user" className="h-8 w-8" />
                  </div>
                  <div className="mt-4 text-[1rem] font-medium text-white">Upload your photo</div>
                  <div className="mt-2 text-[0.85rem] text-white/58">1:1 ratio · JPG, PNG · Max 5MB</div>
                </div>
              )}
            </label>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-[0.9rem] font-semibold text-white">{label}</span>
      {children}
    </label>
  );
}

function InputWithIcon({
  icon,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon: "user" | "calendar" | "phone" | "shield" }) {
  return (
    <div className="relative">
      <FieldIcon
        type={icon}
        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/48"
      />
      <Input
        {...props}
        className={`h-[52px] rounded-md border border-white/[0.065] bg-transparent pl-12 text-[0.95rem] text-white [background-image:none] placeholder:text-white/42 focus:border-white/16 focus:ring-0 ${className || ""}`}
      />
    </div>
  );
}

function FieldIcon({ type, className = "" }: { type: "user" | "calendar" | "phone" | "shield"; className?: string }) {
  if (type === "calendar") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 3v3M17 3v3M4 9h16M5 5h14v15H5V5Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "phone") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6.6 3.8 9 3l2.1 5-1.4 1.1c1 2 2.5 3.5 4.5 4.5l1.1-1.4 5 2.1-.8 2.4c-.4 1.2-1.5 2-2.8 1.8C9.7 17.7 4.3 12.3 3.5 5.4c-.1-1.3.7-2.4 1.9-2.8Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "shield") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3 19 6v5c0 5-2.7 8.5-7 10-4.3-1.5-7-5-7-10V6l7-3Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m9 12 2 2 4-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M5 20c1.4-4.4 3.8-6.6 7-6.6s5.6 2.2 7 6.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
