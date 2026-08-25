import {
  getDepartmentsAction,
  getCfrsAction,
} from "@/modules/cfr/presentation/server-actions/cfr-actions";
import { CfrPageView } from "@/modules/cfr/presentation";
import type { CfrStatus } from "@/app/generated/prisma";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    departmentId?: string;
    projectId?: string;
    status?: string;
    search?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function CfrAllPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;

  // Pagination parameters
  const page = parseInt(resolvedSearchParams.page || "1");
  const limit = parseInt(resolvedSearchParams.limit || "10");

  const departmentId = resolvedSearchParams.departmentId || undefined;
  const projectId = resolvedSearchParams.projectId || undefined;
  const search = resolvedSearchParams.search || undefined;

  let status: CfrStatus | undefined = undefined;
  if (
    resolvedSearchParams.status === "DRAFT" ||
    resolvedSearchParams.status === "SENT" ||
    resolvedSearchParams.status === "SUBMITTED"
  ) {
    status = resolvedSearchParams.status;
  }

  // Query paginated data on the server
  const [departments, result] = await Promise.all([
    getDepartmentsAction(),
    getCfrsAction({ departmentId, projectId, status, search }, page, limit),
  ]);

  return (
    <CfrPageView
      departments={departments}
      cfrs={result.cfrs}
      totalCount={result.totalCount}
      currentPage={page}
      limit={limit}
    />
  );
}
