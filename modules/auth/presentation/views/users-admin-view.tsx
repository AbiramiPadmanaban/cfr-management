"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, MailPlus, UserPlus } from "lucide-react";
import type { PublicAuthUser, UserRole } from "../../domain/auth.repository";
import {
  cardClass,
  fieldClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
  selectChevron,
} from "@/modules/cfr/presentation/components/cfr-ui";
import {
  createUserAction,
  sendPasswordSetupEmailAction,
  setUserActiveAction,
} from "../server-actions/auth-actions";

function formatDate(value: Date | string | null): string {
  if (!value) {
    return "—";
  }
  return new Date(value).toLocaleDateString("en-GB");
}

export function UsersAdminView({ users: initialUsers }: { users: PublicAuthUser[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("USER");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [rowPendingId, setRowPendingId] = useState<string | null>(null);

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await createUserAction({ email, name, role });
      if (!result.ok) {
        setError(result.error);
        return;
      }

      setUsers((current) => [result.user, ...current]);
      setEmail("");
      setName("");
      setRole("USER");
      if (result.emailSent) {
        setSuccess(`User created and password setup email sent to ${result.user.email}.`);
      } else {
        setSuccess(
          `User created, but the setup email could not be sent${
            result.emailError ? `: ${result.emailError}` : "."
          }`
        );
      }
    });
  };

  const handleResend = (userId: string) => {
    setError(null);
    setSuccess(null);
    setRowPendingId(userId);
    startTransition(async () => {
      const result = await sendPasswordSetupEmailAction(userId);
      setRowPendingId(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.emailSent) {
        setSuccess(`Password setup email sent to ${result.user.email}.`);
      } else {
        setError(result.emailError || "Failed to send the password setup email.");
      }
    });
  };

  const handleToggleActive = (userId: string, isActive: boolean) => {
    setError(null);
    setSuccess(null);
    setRowPendingId(userId);
    startTransition(async () => {
      const result = await setUserActiveAction(userId, isActive);
      setRowPendingId(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setUsers((current) =>
        current.map((user) => (user.id === result.user.id ? result.user : user))
      );
      setSuccess(
        isActive
          ? `${result.user.email} has been activated.`
          : `${result.user.email} has been deactivated.`
      );
    });
  };

  return (
    <div className="cfr-fade-up flex w-full min-w-0 flex-1 flex-col gap-6">
      <div className="w-full shrink-0">
        <h2 className="text-2xl font-semibold tracking-tight text-ink">Users</h2>
        <p className="mt-1 text-sm text-muted">
          Create accounts by email. Users receive a secure link to set their password. There is no
          public registration.
        </p>
      </div>

      {success ? (
        <div className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800">
          {success}
        </div>
      ) : null}
      {error ? (
        <div className="w-full rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className={`w-full ${cardClass} p-5 sm:p-6`}>
        <div className="mb-4 flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-accent" aria-hidden="true" />
          <h3 className="text-base font-semibold text-ink">Add user</h3>
        </div>
        <form
          onSubmit={handleCreate}
          className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="user-email" className={labelClass}>
              Email address
            </label>
            <input
              id="user-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={fieldClass()}
              placeholder="name@company.com"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="user-name" className={labelClass}>
              Name
            </label>
            <input
              id="user-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={fieldClass()}
              placeholder="Optional"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="user-role" className={labelClass}>
              Role
            </label>
            <select
              id="user-role"
              value={role}
              onChange={(event) => setRole(event.target.value as UserRole)}
              className={`${fieldClass()} appearance-none pr-10`}
              style={selectChevron}
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <button type="submit" disabled={isPending} className={primaryButtonClass}>
              {isPending && !rowPendingId ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Creating...
                </>
              ) : (
                <>
                  <MailPlus className="h-4 w-4" aria-hidden="true" />
                  Create user & send setup email
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      <section className={`flex w-full min-h-0 flex-1 flex-col overflow-hidden ${cardClass}`}>
        <div className="shrink-0 border-b border-line px-5 py-4 sm:px-6">
          <h3 className="text-base font-semibold text-ink">Directory</h3>
        </div>
        {users.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-5 py-12 text-center sm:px-6">
            <div>
              <p className="text-sm font-medium text-ink">No users yet.</p>
              <p className="mt-1 text-sm text-muted">Create the first account above.</p>
            </div>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="text-[11px] font-medium tracking-[0.14em] text-muted uppercase">
                  <th className="px-5 py-3 font-medium sm:px-6">User</th>
                  <th className="px-3 py-3 font-medium">Role</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Password</th>
                  <th className="px-3 py-3 font-medium">Created</th>
                  <th className="px-3 py-3 text-right font-medium sm:px-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.map((user) => {
                  const busy = rowPendingId === user.id;
                  return (
                    <tr key={user.id} className="hover:bg-zinc-50/80">
                      <td className="px-5 py-3.5 sm:px-6">
                        <div className="font-medium text-ink" title={user.email}>
                          {user.email}
                        </div>
                        <div className="mt-0.5 text-xs text-muted">
                          {user.name || "No name"}
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-ink">{user.role}</td>
                      <td className="px-3 py-3.5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            user.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-zinc-100 text-muted"
                          }`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-muted">
                        {user.passwordConfigured ? "Configured" : "Pending setup"}
                      </td>
                      <td className="px-3 py-3.5 text-muted">{formatDate(user.createdAt)}</td>
                      <td className="px-3 py-3.5 sm:px-6">
                        <div className="flex justify-end gap-2">
                          {!user.passwordConfigured ? (
                            <button
                              type="button"
                              disabled={busy || isPending}
                              onClick={() => handleResend(user.id)}
                              className={secondaryButtonClass}
                            >
                              Resend setup
                            </button>
                          ) : null}
                          <button
                            type="button"
                            disabled={busy || isPending}
                            onClick={() => handleToggleActive(user.id, !user.isActive)}
                            className={secondaryButtonClass}
                          >
                            {user.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
