"use client";

import { getPasswordStrength } from "../../domain/password-rules";

export function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = getPasswordStrength(password);
  const widths = ["w-0", "w-1/4", "w-2/4", "w-3/4", "w-full"];
  const colors = [
    "bg-zinc-200",
    "bg-red-400",
    "bg-amber-400",
    "bg-emerald-400",
    "bg-accent",
  ];

  return (
    <div className="space-y-2">
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
        <div
          className={`h-full rounded-full transition-all duration-200 ${widths[strength.score]} ${colors[strength.score]}`}
        />
      </div>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs text-muted">
          {password
            ? strength.issues.length > 0
              ? `Needs: ${strength.issues.join(", ").toLowerCase()}`
              : "Password meets all requirements."
            : "Use 8+ characters with upper, lower, number, and special character."}
        </p>
        {password ? (
          <span className="shrink-0 text-xs font-medium text-ink">{strength.label}</span>
        ) : null}
      </div>
    </div>
  );
}
