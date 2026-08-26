import { NextResponse } from "next/server";
import { loginUser } from "@/modules/auth/presentation/lib/auth-service";
import { createSession } from "@/server/auth/session";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
  } | null;

  if (!body?.email || !body.password) {
    return NextResponse.json(
      { ok: false, error: "Email and password are required." },
      { status: 400 }
    );
  }

  const result = await loginUser(body.email, body.password);
  if (!result.ok) {
    return NextResponse.json(result, { status: 401 });
  }

  await createSession(result.user.id, result.user.sessionVersion);
  return NextResponse.json({
    ok: true,
    user: {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
    },
  });
}
