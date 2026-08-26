"use client";

import { useState, useTransition } from "react";
import { LogOut, UserRound } from "lucide-react";
import { logoutAction } from "@/modules/auth/presentation/server-actions/auth-actions";

export function AuthUserMenu({
  email,
  name,
}: {
  email: string;
  name: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const initials = (name || email)
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white transition-opacity hover:opacity-90"
        title={email}
        aria-label="Account menu"
        aria-expanded={open}
      >
        {initials || "SP"}
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close account menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-line bg-white shadow-lg">
            <div className="border-b border-line px-4 py-3">
              <div className="flex items-center gap-2 text-ink">
                <UserRound className="h-4 w-4 text-muted" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{name || "Signed in"}</p>
                  <p className="truncate text-xs text-muted">{email}</p>
                </div>
              </div>
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  await logoutAction();
                });
              }}
              className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-muted transition-colors hover:bg-zinc-50 hover:text-ink disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              {isPending ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
