import { CheckCircle2, FileText, Mail, Star } from "lucide-react";
import type { CfrKpis } from "../../domain/cfr.repository";
import { cardClass } from "./cfr-ui";

export interface CfrKpiCardsProps {
  kpis: CfrKpis;
}

function completionRate(kpis: CfrKpis): string {
  if (kpis.total === 0) {
    return "No requests yet";
  }
  return `${Math.round((kpis.submitted / kpis.total) * 100)}% completion rate`;
}

export function CfrKpiCards({ kpis }: CfrKpiCardsProps) {
  const avgRatingDisplay = kpis.total > 0 ? kpis.averageRating.toFixed(1) : "0.0";

  const cards = [
    {
      label: "Total CFRs",
      value: kpis.total,
      hint: "All customer feedback requests",
      iconBg: "bg-zinc-100 text-ink",
      icon: FileText,
    },
    {
      label: "Submitted",
      value: kpis.submitted,
      hint: completionRate(kpis),
      iconBg: "bg-emerald-50 text-success",
      icon: CheckCircle2,
    },
    {
      label: "Sent",
      value: kpis.sent,
      hint: "Awaiting client feedback",
      iconBg: "bg-violet-50 text-violet",
      icon: Mail,
    },
    {
      label: "Average Rating",
      value: avgRatingDisplay,
      hint: "Out of 5 overall satisfaction",
      iconBg: "bg-amber-50 text-warning",
      icon: Star,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`${cardClass} flex items-start justify-between p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(24,24,27,0.06)]`}
          >
            <div className="min-w-0 pr-3">
              <p className="text-sm font-medium text-muted">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">{card.value}</p>
              <p className="mt-2 text-xs text-muted">{card.hint}</p>
            </div>
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.iconBg}`}>
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
