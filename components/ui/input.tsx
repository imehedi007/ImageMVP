import { InputHTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/utils/cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-[22px] border border-blue-400/14 bg-[linear-gradient(180deg,rgba(15,32,58,0.92),rgba(9,24,44,0.98))] px-4 py-3.5 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none transition",
        "placeholder:text-slate-500 focus:border-blue-400/45 focus:ring-2 focus:ring-blue-500/15",
        className
      )}
      {...props}
    />
  );
});
