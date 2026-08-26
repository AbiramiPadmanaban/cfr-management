import type { ReactNode } from "react";
import { X } from "lucide-react";
import { SolidProBrand } from "@/components/shared/solid-pro-logo";

export interface CfrModalProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}

export function CfrModal({ title, subtitle, badge, onClose, children }: CfrModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="cfr-fade-scale flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-line bg-white shadow-2xl sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cfr-modal-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <SolidProBrand subtitle="Customer Feedback Report" tone="light" />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <h3 id="cfr-modal-title" className="text-lg font-semibold tracking-tight text-ink">
                {title}
              </h3>
              {badge}
            </div>
            {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted transition-colors duration-150 hover:bg-zinc-50 hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            aria-label="Close"
            title="Close"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
      </div>
    </div>
  );
}
