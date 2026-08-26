import type { Metadata } from "next";
import { PasswordFormView } from "@/modules/auth/presentation";
import {
  setPasswordAction,
  validateSetupTokenAction,
} from "@/modules/auth/presentation/server-actions/auth-actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Set password | CFR Management",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function SetPasswordPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = params.token || "";
  const validation = await validateSetupTokenAction(token);

  return (
    <PasswordFormView
      mode="setup"
      token={token}
      email={validation.status === "valid" ? validation.email : undefined}
      status={validation.status}
      onSubmit={setPasswordAction}
    />
  );
}
