import { NextResponse } from "next/server";
import { completePasswordChange } from "@/modules/auth/presentation/lib/auth-service";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    token?: string;
    password?: string;
    confirmPassword?: string;
  } | null;

  const result = await completePasswordChange(
    body?.token || "",
    "PASSWORD_SETUP",
    body?.password || "",
    body?.confirmPassword || ""
  );

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
