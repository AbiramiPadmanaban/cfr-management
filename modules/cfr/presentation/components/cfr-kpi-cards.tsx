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
    <>
      {cards.map((card) => (
        <Link
          key={card.label}
          href={card.href}
          className={`${cardClass} flex min-h-0 min-w-0 flex-col px-4 py-3 transition-colors hover:border-accent/40 hover:bg-zinc-50/80`}
          title={`View ${card.label.toLowerCase()}`}
        >
          <p className="shrink-0 text-sm font-semibold text-ink">{card.label}</p>
          <div className="flex flex-1 items-center justify-center py-2">
            <p className="text-3xl font-semibold tracking-tight text-ink">{card.value}</p>
          </div>
          <p className="shrink-0 text-center text-[11px] text-muted">{card.hint}</p>
        </Link>
      ))}
      <Link
        href={allCfrsHref({ status: "SUBMITTED" })}
        className={`${cardClass} flex min-h-0 min-w-0 flex-col px-4 py-3 transition-colors hover:border-accent/40 hover:bg-zinc-50/80`}
        title="View submitted CFRs"
      >
        <p className="shrink-0 text-sm font-semibold text-ink">Overall Organization Rating</p>
        <div className="flex flex-1 items-center justify-center py-2">
          <p className="flex items-center gap-1.5 text-3xl font-semibold tracking-tight text-ink">
            <Star className="h-5 w-5 shrink-0 fill-amber-400 text-amber-400" aria-hidden="true" />
            <span className="truncate">
              {kpis.submitted > 0 ? `${kpis.averageRating.toFixed(1)} / 5` : "—"}
            </span>
          </p>
        </div>
        <p className="shrink-0 text-center text-[11px] text-muted">Overall score</p>
      </Link>
    </>
  );
}
