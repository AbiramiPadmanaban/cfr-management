import type { Metadata } from "next";
import { PasswordFormView } from "@/modules/auth/presentation";
import {
  resetPasswordAction,
  validateResetTokenAction,
} from "@/modules/auth/presentation/server-actions/auth-actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reset password | CFR Management",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = params.token || "";
  const validation = await validateResetTokenAction(token);

  return (
    <PasswordFormView
      mode="reset"
      token={token}
      email={validation.status === "valid" ? validation.email : undefined}
      status={validation.status}
      onSubmit={resetPasswordAction}
    />
  );
}
