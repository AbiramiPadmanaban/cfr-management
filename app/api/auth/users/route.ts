import { NextResponse } from "next/server";
import { createUserWithSetupEmail } from "@/modules/auth/presentation/lib/auth-service";
import { requireAdminForApi } from "@/server/auth/require-auth-api";

export async function POST(request: Request) {
  const session = await requireAdminForApi();
  if (session instanceof NextResponse) {
    return session;
  }

  const body = (await request.json().catch(() => null)) as {
    email?: string;
    name?: string;
    role?: "ADMIN" | "USER";
  } | null;

  if (!body?.email) {
    return NextResponse.json({ ok: false, error: "Email is required." }, { status: 400 });
  }

  const result = await createUserWithSetupEmail({
    email: body.email,
    name: body.name,
    role: body.role,
  });

  return NextResponse.json(result, { status: result.ok ? 201 : 400 });
}
