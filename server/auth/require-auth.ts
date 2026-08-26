import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { PrismaAuthRepository } from "@/modules/auth/infrastructure/auth.prisma-repo";
import { deleteSession, readSession } from "./session";

const authRepo = new PrismaAuthRepository();

export const getCurrentUser = cache(async () => {
  const session = await readSession();
  if (!session?.userId) {
    return null;
  }

  const user = await authRepo.findById(session.userId);
  if (!user || !user.isActive || user.sessionVersion !== session.sessionVersion) {
    await deleteSession();
    return null;
  }

  return user;
});

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "ADMIN") {
    redirect("/cfr");
  }
  return user;
}
