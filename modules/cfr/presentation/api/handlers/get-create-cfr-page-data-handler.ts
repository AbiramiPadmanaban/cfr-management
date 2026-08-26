import { cache } from "react";
import { requireAuth } from "@/server/auth/require-auth";
import { PrismaCfrRepository } from "../../../infrastructure/cfr.prisma-repo";

function createCfrRepo() {
  return new PrismaCfrRepository();
}

export const getCreateCfrPageDataHandler = cache(async () => {
  await requireAuth();
  const departments = await createCfrRepo().getDepartments();
  return { departments };
});
