"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, LoaderCircle, Mail } from "lucide-react";
import {
  fieldClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/modules/cfr/presentation/components/cfr-ui";
import { forgotPasswordAction } from "../server-actions/auth-actions";
import { AuthShell } from "../components/auth-shell";

export function ForgotPasswordView() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await forgotPasswordAction({ email });
        setMessage(result.message);
      } catch {
        setError("Unable to process the request right now. Please try again.");
      }
    });
  };

  return (
    <AuthShell
      title="Forgot password"
      subtitle="Enter your registered email address and we will send a reset link if an account exists."
    >
      {message ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800">
          {message}
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
            className={fieldClass()}
            placeholder="name@company.com"
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
              Sending...
            </>
          ) : (
            <>
              <Mail className="h-4 w-4" aria-hidden="true" />
              Send reset link
            </>
          )}
        </button>
      </form>

      <Link href="/login" className={`${secondaryButtonClass} mt-4 w-full`}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to login
      </Link>
    </AuthShell>
  );
}
