import type { CfrDashboardOverview } from "../../domain/cfr.repository";
import { CfrKpiCards } from "../components/cfr-kpi-cards";
import {
  CfrDepartmentRatingChart,
  CfrFeedbackStatusChart,
  CfrSatisfactionTrendChart,
} from "../components/cfr-dashboard-charts";

export interface CfrDashboardViewProps {
  overview: CfrDashboardOverview;
}

export function CfrDashboardView({ overview }: CfrDashboardViewProps) {
  const { kpis, satisfactionTrend, departmentRatings } = overview;

  return (
    <div className="cfr-fade-up flex h-auto min-h-0 w-full min-w-0 flex-1 flex-col gap-3 lg:h-full lg:gap-4 lg:overflow-hidden">
      <div className="shrink-0">
        <h2 className="text-2xl font-semibold tracking-tight text-ink">Customer Feedback Overview</h2>
        <p className="mt-1 text-sm text-muted">
          Monitor customer feedback and organizational satisfaction at a glance.
        </p>
      </div>

      <div className="grid shrink-0 grid-cols-1 items-stretch gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <CfrKpiCards kpis={kpis} />
        <CfrFeedbackStatusChart kpis={kpis} compact />
      </div>

      <div className="grid min-h-0 flex-none grid-cols-1 gap-4 lg:flex-1 lg:grid-cols-2 lg:overflow-hidden">
        <div className="min-h-0 min-w-0">
          <CfrSatisfactionTrendChart trend={satisfactionTrend} />
        </div>
        <div className="min-h-0 min-w-0">
          <CfrDepartmentRatingChart departmentRatings={departmentRatings} />
        </div>
      </div>
    </div>
  );
}
