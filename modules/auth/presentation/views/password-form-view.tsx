"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound, LoaderCircle } from "lucide-react";
import {
  fieldClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/modules/cfr/presentation/components/cfr-ui";
import { AuthShell } from "../components/auth-shell";
import { PasswordStrengthMeter } from "../components/password-strength-meter";

type PasswordFormMode = "setup" | "reset";

export function PasswordFormView({
  mode,
  token,
  email,
  status,
  onSubmit,
}: {
  mode: PasswordFormMode;
  token: string;
  email?: string;
  status: "valid" | "expired" | "invalid";
  onSubmit: (input: {
    token: string;
    password: string;
    confirmPassword: string;
  }) => Promise<{ ok: false; error: string } | void>;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const title = mode === "setup" ? "Set password" : "Reset password";

  if (status !== "valid") {
    return (
      <AuthShell
        title={status === "expired" ? "Link expired" : "Invalid link"}
        subtitle={
          status === "expired"
            ? "This password link has expired. Request a new one from the login page."
            : "This password link is invalid or has already been used."
        }
      >
        <Link href={mode === "setup" ? "/login" : "/forgot-password"} className={`${primaryButtonClass} w-full`}>
          {mode === "setup" ? "Go to login" : "Request a new link"}
        </Link>
        <Link href="/login" className={`${secondaryButtonClass} mt-3 w-full`}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to login
        </Link>
      </AuthShell>
    );
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await onSubmit({ token, password, confirmPassword });
      if (result && result.ok === false) {
        setError(result.error);
      }
    });
  };

  return (
    <AuthShell title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {email ? (
          <div className="space-y-1.5">
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <input
              id="email"
              type="email"
              readOnly
              value={email}
              className={`${fieldClass()} bg-zinc-50`}
            />
          </div>
        ) : null}

        <div className="space-y-1.5">
          <label htmlFor="password" className={labelClass}>
            New password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={fieldClass(Boolean(error))}
            placeholder="Create a strong password"
          />
          <PasswordStrengthMeter password={password} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className={labelClass}>
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className={fieldClass(Boolean(error))}
            placeholder="Re-enter your password"
          />
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <button type="submit" disabled={isPending} className={`${primaryButtonClass} w-full`}>
          {isPending ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              Saving...
            </>
          ) : (
            <>
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              {mode === "setup" ? "Set password" : "Reset password"}
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
}
