import { ReactNode } from "react";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#041122] text-white">
      <div className="absolute inset-0 -z-10 bg-[#041122]" />
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}
