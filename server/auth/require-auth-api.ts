import "server-only";

import { NextResponse } from "next/server";
import { getCurrentUser } from "./require-auth";
import type { AuthUser } from "@/modules/auth/domain/auth.repository";

export async function requireSessionForApi(): Promise<AuthUser | NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  return user;
}

export async function requireAdminForApi(): Promise<AuthUser | NextResponse> {
  const user = await requireSessionForApi();
  if (user instanceof NextResponse) {
    return user;
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  return user;
}
