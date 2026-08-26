import { getAllCfrsPageDataHandler } from "@/modules/cfr/presentation/api";
import { CfrPageView } from "@/modules/cfr/presentation";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    departmentId?: string;
    projectId?: string;
    status?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function CfrAllPage({ searchParams }: PageProps) {
  const data = await getAllCfrsPageDataHandler(await searchParams);

  return (
    <CfrPageView
      departments={data.departments}
      cfrs={data.cfrs}
      totalCount={data.totalCount}
      currentPage={data.currentPage}
      limit={data.limit}
    />
  );
}
