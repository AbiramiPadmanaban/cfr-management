import { SolidProBrand } from "@/components/shared/solid-pro-logo";
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
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-ink">
      <header className="shrink-0 border-b border-line bg-white">
        <div className="flex w-full items-center justify-start px-4 py-4 sm:px-8">
          <SolidProBrand subtitle="Customer Feedback Report" tone="light" />
        </div>
      </header>
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</main>
    </div>
  );
}
