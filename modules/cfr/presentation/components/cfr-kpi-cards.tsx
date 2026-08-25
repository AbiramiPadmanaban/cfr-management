import type { CfrKpis } from "../../domain/cfr.repository";

export interface CfrKpiCardsProps {
  kpis: CfrKpis;
}

export function CfrKpiCards({ kpis }: CfrKpiCardsProps) {
  const avgRatingDisplay = kpis.total > 0 ? kpis.averageRating.toFixed(1) : "0.0";

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total CFRs */}
      <div className="flex justify-between items-start rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <span className="text-sm font-semibold text-slate-700">Total CFRs</span>
          <p className="mt-2 text-3.5xl font-extrabold text-slate-900 leading-none">
            {kpis.total}
          </p>
          <span className="mt-3 block text-xs text-slate-450">All created CFR reviews</span>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#185adb]">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      </div>

      {/* 2. Submitted */}
      <div className="flex justify-between items-start rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <span className="text-sm font-semibold text-slate-700">Submitted</span>
          <p className="mt-2 text-3.5xl font-extrabold text-slate-900 leading-none">
            {kpis.submitted}
          </p>
          <span className="mt-3 block text-xs text-slate-450">Reviews marked as submitted</span>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
      </div>

      {/* 3. Sent */}
      <div className="flex justify-between items-start rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <span className="text-sm font-semibold text-slate-700">Sent</span>
          <p className="mt-2 text-3.5xl font-extrabold text-slate-900 leading-none">
            {kpis.sent}
          </p>
          <span className="mt-3 block text-xs text-slate-450">Awaiting client feedback</span>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </div>
      </div>

      {/* 4. Average Rating */}
      <div className="flex justify-between items-start rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <span className="text-sm font-semibold text-slate-700">Average Rating</span>
          <p className="mt-2 text-3.5xl font-extrabold text-slate-900 leading-none">
            {avgRatingDisplay}
          </p>
          <span className="mt-3 block text-xs text-slate-450">Out of 5 overall satisfaction</span>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#185adb]">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.969 0 1.371 1.24.588 1.81l-3.97 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.888a1 1 0 00-1.176 0l-3.97 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.97-2.888c-.784-.57-.38-1.81.588-1.81h4.906a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
