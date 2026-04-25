"use client";

interface ToastItem {
  id: number;
  message: string;
  tone?: "default" | "success" | "error";
}

export function ToastStack({ toasts }: { toasts: ToastItem[] }) {
  if (!toasts.length) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[90] flex w-[min(92vw,380px)] flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-2xl border px-4 py-3 text-sm shadow-[0_18px_40px_rgba(2,10,28,0.35)] backdrop-blur ${
            toast.tone === "error"
              ? "border-rose-400/25 bg-rose-500/12 text-rose-100"
              : toast.tone === "success"
                ? "border-emerald-400/25 bg-emerald-500/12 text-emerald-100"
                : "border-white/10 bg-[#0b1730]/92 text-white"
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
