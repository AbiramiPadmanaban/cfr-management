import { NextResponse } from "next/server";
import { resendSetupEmail } from "@/modules/auth/presentation/lib/auth-service";
import { requireAdminForApi } from "@/server/auth/require-auth-api";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  const session = await requireAdminForApi();
  if (session instanceof NextResponse) {
    return session;
  }

  const { id } = await context.params;
  const result = await resendSetupEmail(id);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
