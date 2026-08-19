import {
  getDepartmentsAction,
  getCfrsAction,
  getKpisAction,
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
  }>;
}

export default async function CfrPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;

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

  // Fetch data on the server
  const [departments, cfrs, kpis] = await Promise.all([
    getDepartmentsAction(),
    getCfrsAction({ departmentId, projectId, status, search }),
    getKpisAction(),
  ]);

  return (
    <CfrPageView
      departments={departments}
      cfrs={cfrs}
      kpis={kpis}
    />
  );
}
