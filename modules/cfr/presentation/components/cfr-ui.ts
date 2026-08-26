export const fieldClass = (hasError?: boolean) =>
  `h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-ink outline-none transition-all duration-150 placeholder:text-zinc-400 focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:bg-zinc-50 disabled:opacity-60 ${
    hasError ? "border-red-400" : "border-line"
  }`;

export const textareaClass =
  "w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm leading-6 text-ink outline-none transition-all duration-150 placeholder:text-zinc-400 focus:border-accent focus:ring-2 focus:ring-accent/15";

export const labelClass = "text-xs font-medium text-ink";

export const selectChevron = {
  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  backgroundSize: "16px",
} as const;

export const primaryButtonClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryButtonClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-white px-5 text-sm font-medium text-muted transition-colors duration-150 hover:bg-zinc-50 hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none";

export const iconButtonClass =
  "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white text-muted transition-all duration-150 hover:border-accent/30 hover:bg-accent-soft hover:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40";

export const cardClass =
  "rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(24,24,27,0.04)]";
