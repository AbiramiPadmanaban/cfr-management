"use client";

import Link from "next/link";
import { ArrowRight, FilePlus2 } from "lucide-react";
import type { CfrWithProject, CfrKpis } from "../../domain/cfr.repository";
import { CfrKpiCards } from "../components/cfr-kpi-cards";
import { CfrStatusBadge } from "../components/cfr-status-badge";
import { CfrActionNeededMarks, formatCfrDate } from "../components/cfr-action-needed";
import { getCfrAverageRating } from "../components/cfr-rating-criteria";
import { cardClass, primaryButtonClass } from "../components/cfr-ui";

export interface CfrDashboardViewProps {
  kpis: CfrKpis;
  recentCfrs: CfrWithProject[];
}

export function CfrDashboardView({ kpis, recentCfrs }: CfrDashboardViewProps) {
  return (
    <div className="cfr-fade-up mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-ink">Customer Feedback Overview</h2>
          <p className="mt-1 text-sm text-muted">
            Monitor customer feedback and project satisfaction at a glance.
          </p>
        </div>
        <Link href="/cfr/create" className={primaryButtonClass}>
          <FilePlus2 className="h-4 w-4" aria-hidden="true" />
          Create CFR
        </Link>
      </div>

      <CfrKpiCards kpis={kpis} />

      <section className={`${cardClass} p-5 sm:p-6`}>
        <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-ink">Recent CFRs</h3>
            <p className="mt-0.5 text-sm text-muted">Latest customer feedback activity</p>
          </div>
          <Link
            href="/cfr/all"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium text-accent transition-colors duration-150 hover:bg-accent-soft"
          >
            View All
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-2">
          {recentCfrs.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-medium text-ink">No recent feedback reviews found.</p>
              <p className="mt-1 text-sm text-muted">Create a CFR to start collecting customer ratings.</p>
            </div>
          ) : (
            <table className="w-full table-fixed border-collapse text-left text-sm">
              <thead>
                <tr className="text-[11px] font-medium tracking-[0.14em] text-muted uppercase">
                  <th className="px-3 py-3 font-medium">Project</th>
                  <th className="w-[14%] px-3 py-3 font-medium">Client</th>
                  <th className="w-[14%] px-3 py-3 font-medium">Overall Rating</th>
                  <th className="w-[12%] px-3 py-3 font-medium">Status</th>
                  <th className="w-[14%] px-3 py-3 font-medium">Date Received</th>
                  <th className="w-[12%] px-3 py-3 font-medium">By</th>
                  <th className="w-[12%] px-3 py-3 font-medium">Action Needed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recentCfrs.map((cfr) => {
                  const averageRating = getCfrAverageRating(cfr);
                  return (
                  <tr key={cfr.id} className="transition-colors duration-150 hover:bg-zinc-50/80">
                    <td className="px-3 py-3.5">
                      <div className="truncate font-medium text-ink" title={cfr.project.projectName}>
                        {cfr.project.projectName}
                      </div>
                      <div className="mt-0.5 truncate font-mono text-xs text-muted">{cfr.projectNumber}</div>
                    </td>
                    <td className="truncate px-3 py-3.5 text-ink">{cfr.client}</td>
                    <td className="px-3 py-3.5 font-semibold whitespace-nowrap text-ink">
                      {averageRating != null ? `${averageRating.toFixed(1)} / 5` : "Pending"}
                    </td>
                    <td className="px-3 py-3.5">
                      <CfrStatusBadge status={cfr.status} />
                    </td>
                    <td className="px-3 py-3.5 whitespace-nowrap text-muted">
                      {cfr.status === "SUBMITTED" ? formatCfrDate(cfr.feedbackSubmittedAt) : "—"}
                    </td>
                    <td className="truncate px-3 py-3.5 text-ink">
                      {cfr.status === "SUBMITTED" ? cfr.reviewedBy || "—" : "—"}
                    </td>
                    <td className="px-3 py-3.5">
                      <CfrActionNeededMarks
                        cfrId={cfr.id}
                        received={cfr.status === "SUBMITTED"}
                        actionNeeded={cfr.actionNeeded}
                      />
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
