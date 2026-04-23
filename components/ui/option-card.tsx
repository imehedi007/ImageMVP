import Image from "next/image";

import { cn } from "@/lib/utils/cn";

interface OptionCardProps {
  title: string;
  description: string;
  active: boolean;
  image?: string;
  swatch?: string;
  compact?: boolean;
  onClick: () => void;
}

export function OptionCard({ title, description, active, image, swatch, compact = false, onClick }: OptionCardProps) {
  if (image) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "group relative overflow-hidden rounded-[18px] border bg-[#091324] text-left transition duration-300",
          "px-5 pb-6 pt-5 sm:px-6 sm:pb-7",
          active
            ? "border-[#7f82ff] shadow-[0_0_0_1px_rgba(127,130,255,0.38)]"
            : "border-white/10 hover:-translate-y-1 hover:border-white/20"
        )}
      >
        {active ? (
          <span className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[#8f96ff] text-[#07101f] shadow-[0_10px_28px_rgba(143,150,255,0.35)]">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m6 12 4 4 8-8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        ) : null}

        <div className="relative mx-auto h-[120px] w-full max-w-[260px] sm:h-[138px]">
          <Image
            src={image}
            alt={title}
            fill
            className="object-contain transition duration-500 group-hover:scale-[1.03]"
          />
        </div>

        <div className="mt-5">
          <div className="text-[1.25rem] font-black leading-tight tracking-[-0.03em] text-white">{title}</div>
          <p className="mt-3 text-[0.98rem] leading-7 text-white/56">{description}</p>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group overflow-hidden rounded-[18px] border bg-[#091324] text-left transition duration-300",
        active
          ? "border-[#7f82ff] shadow-[0_0_0_1px_rgba(127,130,255,0.38)]"
          : "border-white/10 hover:-translate-y-1 hover:border-white/20"
      )}
    >
      {swatch ? <div className={cn(compact ? "h-16" : "h-24")} style={{ backgroundColor: swatch }} /> : null}
      <div className={cn("space-y-2", compact ? "p-4" : "p-5")}>
        <div className={cn("font-semibold text-white", compact ? "text-base" : "text-lg")}>{title}</div>
        <p className={cn("text-white/56", compact ? "text-sm leading-6" : "text-base leading-7")}>{description}</p>
      </div>
    </button>
  );
}
