import type { ReactNode } from "react";

export default function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#030711] text-slate-100 antialiased [font-family:var(--font-inter),system-ui,sans-serif]">
      {children}
    </div>
  );
}
