import { cache } from "react";
import { requireAuth } from "@/server/auth/require-auth";
import { PrismaCfrRepository } from "../../../infrastructure/cfr.prisma-repo";

function createCfrRepo() {
  return new PrismaCfrRepository();
}

export const getDashboardOverviewHandler = cache(async () => {
  await requireAuth();
  return createCfrRepo().getDashboardOverview();
});
