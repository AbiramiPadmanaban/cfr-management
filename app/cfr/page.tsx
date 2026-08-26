import { getDashboardOverviewAction } from "@/modules/cfr/presentation/server-actions/cfr-actions";
import { CfrDashboardView } from "@/modules/cfr/presentation";

export const dynamic = "force-dynamic";

export default async function CfrDashboardPage() {
  const overview = await getDashboardOverviewAction();

  return <CfrDashboardView overview={overview} />;
}
