import { getKpisAction, getCfrsAction } from "@/modules/cfr/presentation/server-actions/cfr-actions";
import { CfrDashboardView } from "@/modules/cfr/presentation";

export const dynamic = "force-dynamic";

export default async function CfrDashboardPage() {
  const kpis = await getKpisAction();
  
  // Query only the 5 most recent records
  const result = await getCfrsAction(undefined, 1, 5);
  
  return (
    <CfrDashboardView
      kpis={kpis}
      recentCfrs={result.cfrs}
    />
  );
}
