"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/utils/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "dark";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-full px-4 py-3 text-sm transition duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "border-0 bg-white text-black shadow-none [background-image:none] hover:bg-white hover:[background-image:none]",
        variant === "secondary" &&
          "border border-white/10 bg-white/5 text-white backdrop-blur hover:border-blue-400/35 hover:bg-white/10",
        variant === "dark" &&
          "border border-white/8 bg-[#15171d] text-white shadow-none [background-image:none] hover:bg-[#1a1d24] hover:[background-image:none]",
        variant === "ghost" && "text-slate-300 hover:bg-white/5",
        className
      )}
      {...props}
    />
  );
});
