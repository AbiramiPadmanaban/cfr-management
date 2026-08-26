"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, X } from "lucide-react";

export const CFR_TOAST_EVENT = "cfr:toast";

export function showCfrToast(message: string) {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(
    new CustomEvent(CFR_TOAST_EVENT, {
      detail: { message },
    })
  );
}

function ToastCard({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 5000);
    return () => window.clearTimeout(timer);
  }, [onClose, message]);

  return (
    <div
      role="status"
      aria-live="assertive"
      className="cfr-fade-up pointer-events-auto flex w-[min(100vw-2rem,24rem)] items-start gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-[0_16px_40px_rgba(24,24,27,0.18)]"
    >
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-success">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
      </div>
      <p className="flex-1 pt-1 text-sm font-medium text-ink">{message}</p>
      <button
        type="button"
        onClick={onClose}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-zinc-50 hover:text-ink"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function CfrToastHost() {
  const [message, setMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const dismiss = useCallback(() => {
    setMessage(null);
  }, []);

  useEffect(() => {
    setMounted(true);
    const onToast = (event: Event) => {
      const custom = event as CustomEvent<{ message?: string }>;
      const nextMessage = custom.detail?.message?.trim();
      if (nextMessage) {
        setMessage(nextMessage);
      }
    };
    window.addEventListener(CFR_TOAST_EVENT, onToast);
    return () => window.removeEventListener(CFR_TOAST_EVENT, onToast);
  }, []);

  if (!mounted || !message) {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none fixed right-5 bottom-5 z-[9999] sm:right-6 sm:bottom-6">
      <ToastCard key={message} message={message} onClose={dismiss} />
    </div>,
    document.body
  );
}
