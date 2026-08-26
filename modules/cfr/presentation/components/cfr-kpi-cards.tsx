import { Star } from "lucide-react";
import type { CfrKpis } from "../../domain/cfr.repository";
import { cardClass } from "./cfr-ui";

export interface CfrKpiCardsProps {
  kpis: CfrKpis;
}

function responseRate(kpis: CfrKpis): string {
  if (kpis.total === 0) {
    return "No requests yet";
  }
  return `${Math.round((kpis.submitted / kpis.total) * 100)}% response`;
}

export function CfrKpiCards({ kpis }: CfrKpiCardsProps) {
  const cards = [
    {
      label: "Total Requests",
      value: String(kpis.total),
      hint: "All CFRs",
    },
    {
      label: "Feedback Received",
      value: String(kpis.submitted),
      hint: responseRate(kpis),
    },
    {
      label: "Pending Feedback",
      value: String(kpis.sent),
      hint: "Awaiting",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className={`${cardClass} flex flex-col justify-between p-5`}>
          <p className="text-sm font-medium text-muted">{card.label}</p>
          <p className="mt-6 text-4xl font-semibold tracking-tight text-ink">{card.value}</p>
          <p className="mt-6 text-xs text-muted">{card.hint}</p>
        </div>
      ))}
      <div className={`${cardClass} flex flex-col justify-between p-5`}>
        <p className="text-sm font-medium text-muted">Overall Org Rating</p>
        <p className="mt-6 flex items-center gap-2 text-3xl font-semibold tracking-tight text-ink">
          <Star className="h-6 w-6 fill-amber-400 text-amber-400" aria-hidden="true" />
          {kpis.submitted > 0 ? `${kpis.averageRating.toFixed(1)} / 5` : "—"}
        </p>
        <p className="mt-6 text-xs text-muted">Overall score</p>
      </div>
    </div>
  );
}
