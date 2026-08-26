import type { Metadata } from "next";
import { LoginView } from "@/modules/auth/presentation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in | CFR Management",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ setup?: string; reset?: string; next?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  let initialMessage: string | null = null;
  if (params.setup === "1") {
    initialMessage = "Password set successfully. You can now sign in.";
  } else if (params.reset === "1") {
    initialMessage = "Password reset successfully. You can now sign in with your new password.";
  }

  return <LoginView initialMessage={initialMessage} nextPath={params.next || null} />;
}
