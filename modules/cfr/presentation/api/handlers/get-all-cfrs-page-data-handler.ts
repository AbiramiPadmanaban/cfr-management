import { cache } from "react";
import { requireAuth } from "@/server/auth/require-auth";
import type { CfrFilterInput } from "../../../domain/cfr.repository";
import { PrismaCfrRepository } from "../../../infrastructure/cfr.prisma-repo";

function createCfrRepo() {
  return new PrismaCfrRepository();
}

export type AllCfrsSearchParams = {
  departmentId?: string;
  projectId?: string;
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: string;
  limit?: string;
};

function parseCfrStatus(value: string | undefined): CfrFilterInput["status"] {
  if (value === "DRAFT" || value === "SENT" || value === "SUBMITTED") {
    return value;
  }
  return undefined;
}

function parseDateParam(value: string | undefined): string | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined;
  }
  const parsed = new Date(`${value}T00:00:00.000`);
  return Number.isNaN(parsed.getTime()) ? undefined : value;
}

export const getAllCfrsPageDataHandler = cache(async (searchParams: AllCfrsSearchParams) => {
  await requireAuth();

  const page = Number.parseInt(searchParams.page || "1", 10);
  const limit = Number.parseInt(searchParams.limit || "10", 10);
  const filters: CfrFilterInput = {
    departmentId: searchParams.departmentId || undefined,
    projectId: searchParams.projectId || undefined,
    status: parseCfrStatus(searchParams.status),
    search: searchParams.search || undefined,
    dateFrom: parseDateParam(searchParams.dateFrom),
    dateTo: parseDateParam(searchParams.dateTo),
  };

  const repo = createCfrRepo();
  const [departments, result] = await Promise.all([
    repo.getDepartments(),
    repo.getCfrs(filters, page, limit),
  ]);

  return {
    departments,
    cfrs: result.cfrs,
    totalCount: result.totalCount,
    currentPage: Number.isFinite(page) && page > 0 ? page : 1,
    limit: Number.isFinite(limit) && limit > 0 ? limit : 10,
  };
});
