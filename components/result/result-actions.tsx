"use client";

import { RideGenerationResponse } from "@/types";

interface Props {
  result: RideGenerationResponse;
}

export function ResultActions({ result }: Props) {
  function onDownload() {
    const link = document.createElement("a");
    link.href = result.imageUrl;
    link.download = "yamaha-persona-card.png";
    link.click();
  }

  function shareTo(platform: "facebook" | "instagram" | "tiktok") {
    const encodedCaption = encodeURIComponent(result.caption);
    const encodedUrl = encodeURIComponent(window.location.href);

    if (platform === "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedCaption}`, "_blank", "noopener,noreferrer");
      return;
    }

    if (platform === "instagram") {
      navigator.clipboard?.writeText(result.caption).catch(() => undefined);
      window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
      return;
    }

    navigator.clipboard?.writeText(result.caption).catch(() => undefined);
    window.open("https://www.tiktok.com/upload", "_blank", "noopener,noreferrer");
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <ShareButton label="Facebook" icon="f" className="bg-[#285bb8]" onClick={() => shareTo("facebook")} />
      <ShareButton label="Instagram" icon="◎" className="bg-[linear-gradient(135deg,#f77737,#c01569)]" onClick={() => shareTo("instagram")} />
      <ShareButton label="Tiktok" icon="♪" className="border border-white/12 bg-black" onClick={() => shareTo("tiktok")} />
      <ShareButton label="Download Card" icon="↓" className="bg-[#28538d]" onClick={onDownload} />
    </div>
  );
}

function ShareButton({
  label,
  icon,
  className,
  onClick
}: {
  label: string;
  icon: string;
  className: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex py-3 items-center justify-center gap-4 rounded-[3px] text-white transition hover:brightness-110 ${className}`}
    >
      <span className="text-[1.45rem] font-sm leading-none">{icon}</span>
      <span className="text-[0.85rem] font-sm uppercase ">{label}</span>
    </button>
  );
}
