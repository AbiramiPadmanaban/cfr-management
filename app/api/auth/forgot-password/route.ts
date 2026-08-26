import { NextResponse } from "next/server";
import {
  forgotPasswordMessage,
  requestPasswordReset,
} from "@/modules/auth/presentation/lib/auth-service";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: string } | null;
  await requestPasswordReset(body?.email || "");
  return NextResponse.json({ ok: true, message: forgotPasswordMessage() });
}
