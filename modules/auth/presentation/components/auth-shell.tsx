"use client";

import type { ReactNode } from "react";
import { SolidProBrand } from "@/components/shared/solid-pro-logo";
import { cardClass } from "@/modules/cfr/presentation/components/cfr-ui";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-ink">
      <header className="border-b border-line bg-white">
        <div className="flex w-full items-center justify-start px-4 py-4 sm:px-8">
          <SolidProBrand subtitle="Customer Feedback Report" tone="light" />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className={`cfr-fade-up w-full max-w-md ${cardClass} p-6 sm:p-8`}>
          <div className="mb-6 space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
            {subtitle ? (
              <p className="text-sm leading-6 text-muted">{subtitle}</p>
            ) : null}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
