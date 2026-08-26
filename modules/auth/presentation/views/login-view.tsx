"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { LoaderCircle, LogIn } from "lucide-react";
import {
  fieldClass,
  labelClass,
  primaryButtonClass,
} from "@/modules/cfr/presentation/components/cfr-ui";
import { loginAction } from "../server-actions/auth-actions";
import { AuthShell } from "../components/auth-shell";

export function LoginView({
  initialMessage,
  nextPath,
}: {
  initialMessage?: string | null;
  nextPath?: string | null;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await loginAction({
        email,
        password,
        next: nextPath || undefined,
      });
      if (result && "ok" in result && result.ok === false) {
        setError(result.error);
      }
    });
  };

  return (
    <AuthShell title="Sign in">
      {initialMessage ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800">
          {initialMessage}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className={labelClass}>
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={fieldClass(Boolean(error))}
            placeholder="name@company.com"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="password" className={labelClass}>
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-accent transition-colors hover:text-accent-hover"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={fieldClass(Boolean(error))}
            placeholder="Enter your password"
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
              Signing in...
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Sign in
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
}
