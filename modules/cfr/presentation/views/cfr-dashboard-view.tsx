"use client";

import { useState } from "react";
import Link from "next/link";
import type { CfrWithProject, CfrKpis } from "../../domain/cfr.repository";

// Components
import { CfrKpiCards } from "../components/cfr-kpi-cards";
import { CfrViewDialog } from "../components/cfr-view-dialog";
import { CfrActionNeededMarks, formatCfrDate } from "../components/cfr-action-needed";

export interface CfrDashboardViewProps {
  kpis: CfrKpis;
  recentCfrs: CfrWithProject[];
}

export function CfrDashboardView({ kpis, recentCfrs }: CfrDashboardViewProps) {
  const [selectedCfr, setSelectedCfr] = useState<CfrWithProject | null>(null);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "bg-green-50 text-green-700 border-green-250 rounded-full px-2.5 py-0.5 text-xs font-semibold border";
      case "SENT":
        return "bg-blue-50 text-blue-700 border-blue-200 rounded-full px-2.5 py-0.5 text-xs font-semibold border";
      case "DRAFT":
      default:
        return "bg-amber-50 text-amber-700 border-amber-250 rounded-full px-2.5 py-0.5 text-xs font-semibold border";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2.5xl font-black text-slate-900 tracking-tight">My Dashboard</h1>
      </div>

      {/* 4 KPI Metric Cards */}
      <CfrKpiCards kpis={kpis} />

      {/* Recent Reviews Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent CFRs</h3>
            <p className="text-xs text-slate-400">
              Your most recent customer feedback reviews
            </p>
          </div>
          <Link
            href="/cfr/all"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-[#1a3574] px-4 text-xs font-bold text-white hover:bg-[#152e66] transition-colors"
          >
            View All CFRs
          </Link>
        </div>

        {/* Recent CFRs Preview Table */}
        <div className="mt-4 overflow-x-auto">
          {recentCfrs.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              No recent feedback reviews found.
            </div>
          ) : (
            <table className="w-full min-w-[980px] border-collapse text-left text-sm text-slate-650">
              <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-bold">CFR ID</th>
                  <th className="px-4 py-3 font-bold">PROJECT & ID</th>
                  <th className="px-4 py-3 font-bold">CLIENT</th>
                  <th className="px-4 py-3 font-bold">OVERALL RATING</th>
                  <th className="px-4 py-3 font-bold">STATUS</th>
                  <th className="px-4 py-3 font-bold">DATE RECEIVED</th>
                  <th className="px-4 py-3 font-bold">BY</th>
                  <th className="px-4 py-3 font-bold">ACTION NEEDED</th>
                  <th className="px-4 py-3 font-bold text-right">VIEW</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentCfrs.map((cfr) => (
                  <tr key={cfr.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-4 py-4 font-semibold text-slate-900">
                      #{cfr.id}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-900">
                        {cfr.project.projectName}
                      </div>
                      <div className="text-xs text-slate-400">{cfr.projectNumber}</div>
                    </td>
                    <td className="px-4 py-4 text-slate-700">{cfr.client}</td>
                    <td className="px-4 py-4 font-bold text-slate-900">
                      {cfr.overallSatisfaction != null
                        ? `${cfr.overallSatisfaction} / 5`
                        : "Pending"}
                    </td>
                    <td className="px-4 py-4">
                      <span className={getStatusBadgeClass(cfr.status)}>
                        {cfr.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {cfr.status === "SUBMITTED"
                        ? formatCfrDate(cfr.feedbackSubmittedAt)
                        : "—"}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {cfr.status === "SUBMITTED" ? cfr.reviewedBy || "—" : "—"}
                    </td>
                    <td className="px-4 py-4">
                      <CfrActionNeededMarks
                        cfrId={cfr.id}
                        received={cfr.status === "SUBMITTED"}
                        actionNeeded={cfr.actionNeeded}
                      />
                    </td>
                    <td className="px-4 py-4 text-right">
                      {/* View Action Eye icon similar to screenshots */}
                      <button
                        onClick={() => setSelectedCfr(cfr)}
                        className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:text-[#185adb] shadow-sm transition-all"
                        title="View Details"
                      >
                        <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Details View Dialog Modal */}
      {selectedCfr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
          <div className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                CFR Detailed Scorecard
              </h3>
              <button
                onClick={() => setSelectedCfr(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <div className="mt-4 flex-1 overflow-y-auto pr-1">
              <CfrViewDialog cfr={selectedCfr} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
