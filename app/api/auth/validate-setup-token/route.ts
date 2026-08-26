import { NextResponse } from "next/server";
import { validateAuthToken } from "@/modules/auth/presentation/lib/auth-service";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") || "";
  const result = await validateAuthToken(token, "PASSWORD_SETUP");
  return NextResponse.json(result);
}
