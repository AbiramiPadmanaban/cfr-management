import type { CfrKpis } from "../../domain/cfr.repository";

export interface CfrKpiCardsProps {
  kpis: CfrKpis;
}

export function CfrKpiCards({ kpis }: CfrKpiCardsProps) {
  const avgRatingDisplay = kpis.total > 0 ? kpis.averageRating.toFixed(2) : "-";

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total CFRs */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total CFRs</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {kpis.total}
        </p>
      </div>

      {/* Submitted */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Submitted</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-green-600 dark:text-green-400">
          {kpis.submitted}
        </p>
      </div>

      {/* Draft */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Draft</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-amber-600 dark:text-amber-400">
          {kpis.draft}
        </p>
      </div>

      {/* Average Rating */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Average Rating</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-blue-600 dark:text-blue-400">
          {avgRatingDisplay}
        </p>
      </div>
    </div>
  );
}
