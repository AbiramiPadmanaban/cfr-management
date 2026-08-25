import { SolidProLogo } from "@/components/shared/solid-pro-logo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customer Feedback | SOLiDPRO",
  robots: {
    index: false,
    follow: false,
  },
};

export default function FeedbackLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F6FA] text-[#0f172a]">
      <header className="border-b border-white/10 bg-[#163172]">
        <div className="flex w-full items-center justify-start px-8 py-4">
          <div className="flex flex-col items-start text-left">
            <SolidProLogo className="h-8 w-auto text-white" />
            <span className="mt-1 text-[10px] font-bold tracking-[0.2em] text-slate-300/80 uppercase">
              Customer Feedback
            </span>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-8 py-10">{children}</main>
    </div>
  );
}
