import Link from "next/link";
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

function allCfrsHref(params: Record<string, string | undefined> = {}): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      search.set(key, value);
    }
  }
  const query = search.toString();
  return query ? `/cfr/all?${query}` : "/cfr/all";
}

export function CfrKpiCards({ kpis }: CfrKpiCardsProps) {
  const cards = [
    {
      label: "Total Requests",
      value: String(kpis.total),
      hint: "All CFRs",
      href: allCfrsHref(),
    },
    {
      label: "Feedback Received",
      value: String(kpis.submitted),
      hint: responseRate(kpis),
      href: allCfrsHref({ status: "SUBMITTED" }),
    },
    {
      label: "Pending Feedback",
      value: String(kpis.sent),
      hint: "Awaiting",
      href: allCfrsHref({ status: "SENT" }),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Link
          key={card.label}
          href={card.href}
          className={`${cardClass} flex flex-col justify-center px-4 py-3 transition-colors hover:border-accent/40 hover:bg-zinc-50/80`}
          title={`View ${card.label.toLowerCase()}`}
        >
          <p className="text-xs font-medium text-muted">{card.label}</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-ink">{card.value}</p>
          <p className="mt-1 text-[11px] text-muted">{card.hint}</p>
        </Link>
      ))}
      <Link
        href={allCfrsHref({ status: "SUBMITTED" })}
        className={`${cardClass} flex flex-col justify-center px-4 py-3 transition-colors hover:border-accent/40 hover:bg-zinc-50/80`}
        title="View submitted CFRs"
      >
        <p className="text-xs font-medium text-muted">Overall Organization Rating</p>
        <p className="mt-1.5 flex items-center gap-1.5 text-2xl font-semibold tracking-tight text-ink">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
          {kpis.submitted > 0 ? `${kpis.averageRating.toFixed(1)} / 5` : "—"}
        </p>
        <p className="mt-1 text-[11px] text-muted">Overall score</p>
      </Link>
    </div>
  );
}
