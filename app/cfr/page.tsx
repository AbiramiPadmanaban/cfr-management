import { getDashboardOverviewHandler } from "@/modules/cfr/presentation/api";
import { CfrDashboardView } from "@/modules/cfr/presentation";

export const dynamic = "force-dynamic";

export default async function CfrDashboardPage() {
  const overview = await getDashboardOverviewHandler();
  return <CfrDashboardView overview={overview} />;
}
