import type { Metadata } from "next";
import { ForgotPasswordView } from "@/modules/auth/presentation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Forgot password | CFR Management",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordView />;
}
