import { ReactNode } from "react";

interface StepShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

export function StepShell({ eyebrow, title, description, children }: StepShellProps) {
  return (
    <section className="animate-rise space-y-6 rounded-[32px] border border-white/10 bg-[#071427]/90 p-5 shadow-[0_24px_60px_rgba(2,10,28,0.45)] backdrop-blur sm:p-8">
      <div className="space-y-3">
        <span className="inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-300">
          {eyebrow}
        </span>
        <div className="space-y-2">
          <h2 className="max-w-xl text-3xl font-black uppercase tracking-[-0.03em] text-white sm:text-4xl">{title}</h2>
          <p className="max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
