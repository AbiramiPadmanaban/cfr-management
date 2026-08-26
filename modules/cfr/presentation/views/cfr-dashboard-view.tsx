import Link from "next/link";
import { ArrowRight, Plus, Star } from "lucide-react";
import type { CfrDashboardOverview } from "../../domain/cfr.repository";
import { CfrKpiCards } from "../components/cfr-kpi-cards";
import {
  CfrDepartmentRatingChart,
  CfrFeedbackStatusChart,
  CfrFeedbackTrendChart,
} from "../components/cfr-dashboard-charts";
import { getCfrAverageRating } from "../components/cfr-rating-criteria";
import { cardClass, primaryButtonClass } from "../components/cfr-ui";

export interface CfrDashboardViewProps {
  overview: CfrDashboardOverview;
}

function formatRecentDate(value: Date | string | null | undefined): string {
  if (!value) {
    return "—";
  }
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function CfrDashboardView({ overview }: CfrDashboardViewProps) {
  const { kpis, trend, departmentRatings, recentFeedback } = overview;

  return (
    <div className="cfr-fade-up mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-ink">Customer Feedback Overview</h2>
          <p className="mt-1 text-sm text-muted">
            Monitor customer feedback and organizational satisfaction at a glance.
          </p>
        </div>
        <Link href="/cfr/create" className={primaryButtonClass}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Create CFR
        </Link>
      </div>

      <CfrKpiCards kpis={kpis} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CfrFeedbackTrendChart trend={trend} />
        <CfrDepartmentRatingChart departmentRatings={departmentRatings} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CfrFeedbackStatusChart kpis={kpis} />

        <section className={`${cardClass} flex h-full min-h-[320px] flex-col p-5 sm:p-6`}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-ink">Recent Feedback</h3>
            <Link
              href="/cfr/all"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium text-accent transition-colors duration-150 hover:bg-accent-soft"
            >
              View All
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          {recentFeedback.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-medium text-ink">No recent feedback found.</p>
              <p className="mt-1 text-sm text-muted">Submitted reviews will appear here.</p>
            </div>
          ) : (
            <table className="mt-4 w-full table-fixed border-collapse text-left text-sm">
              <thead>
                <tr className="text-[11px] font-medium tracking-[0.14em] text-muted uppercase">
                  <th className="px-2 py-3 font-medium">Project</th>
                  <th className="w-[22%] px-2 py-3 font-medium">Client</th>
                  <th className="w-[22%] px-2 py-3 font-medium">Rating</th>
                  <th className="w-[18%] px-2 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recentFeedback.map((cfr) => {
                  const averageRating = getCfrAverageRating(cfr);
                  return (
                    <tr key={cfr.id} className="transition-colors duration-150 hover:bg-zinc-50/80">
                      <td className="truncate px-2 py-3.5 font-medium text-ink" title={cfr.project.projectName}>
                        {cfr.project.projectName}
                      </td>
                      <td className="truncate px-2 py-3.5 text-ink">{cfr.client}</td>
                      <td className="px-2 py-3.5 font-semibold whitespace-nowrap text-ink">
                        {averageRating != null ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                            {averageRating.toFixed(1)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-2 py-3.5 whitespace-nowrap text-muted">
                        {formatRecentDate(cfr.feedbackSubmittedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
