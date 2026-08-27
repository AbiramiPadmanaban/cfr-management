"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  CfrDepartmentRating,
  CfrKpis,
  CfrSatisfactionPoint,
  CfrSatisfactionTrend,
} from "../../domain/cfr.repository";
import { cardClass, selectChevron } from "./cfr-ui";

type PeriodMode = "monthly" | "yearly";

const RATING_MIN = 1;
const RATING_MAX = 5;

function ratingY(value: number, paddingTop: number, innerHeight: number) {
  const clamped = Math.min(RATING_MAX, Math.max(RATING_MIN, value));
  return (
    paddingTop +
    innerHeight -
    ((clamped - RATING_MIN) / (RATING_MAX - RATING_MIN)) * innerHeight
  );
}

function buildPolyline(points: { x: number; y: number }[]) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function monthlySeriesForYear(monthly: CfrSatisfactionPoint[], year: number) {
  return monthly
    .filter((point) => point.year === year)
    .sort((a, b) => (a.month ?? 0) - (b.month ?? 0));
}

function monthDateRange(year: number, month: number): { dateFrom: string; dateTo: string } {
  const lastDay = new Date(year, month, 0).getDate();
  const mm = String(month).padStart(2, "0");
  return {
    dateFrom: `${year}-${mm}-01`,
    dateTo: `${year}-${mm}-${String(lastDay).padStart(2, "0")}`,
  };
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

export function CfrSatisfactionTrendChart({ trend }: { trend: CfrSatisfactionTrend }) {
  const router = useRouter();
  const defaultYear = trend.availableYears.includes(new Date().getFullYear())
    ? new Date().getFullYear()
    : (trend.availableYears[trend.availableYears.length - 1] ?? new Date().getFullYear());

  const [mode, setMode] = useState<PeriodMode>("monthly");
  const [selectedYear, setSelectedYear] = useState(defaultYear);

  const series = useMemo(() => {
    if (mode === "yearly") {
      return trend.yearly;
    }
    return monthlySeriesForYear(trend.monthly, selectedYear);
  }, [mode, selectedYear, trend.monthly, trend.yearly]);

  const width = 640;
  const height = 320;
  const padding = { top: 28, right: 12, bottom: 36, left: 28 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const yTicks = [1, 2, 3, 4, 5];
  const baselineY = ratingY(RATING_MIN, padding.top, innerHeight);

  const pointCoords = series.map((point, index) => {
    const x =
      padding.left +
      (series.length === 1 ? innerWidth / 2 : (index / (series.length - 1)) * innerWidth);
    return {
      ...point,
      x,
      y:
        point.averageRating != null
          ? ratingY(point.averageRating, padding.top, innerHeight)
          : null,
    };
  });

  const plotted = pointCoords.filter(
    (point): point is typeof point & { y: number; averageRating: number } =>
      point.y != null && point.averageRating != null
  );

  const polyline = buildPolyline(plotted);
  const area =
    plotted.length > 0
      ? `${plotted[0].x},${baselineY} ${polyline} ${plotted[plotted.length - 1].x},${baselineY}`
      : "";

  const navigateToPoint = (point: CfrSatisfactionPoint) => {
    if (mode === "monthly" && point.month) {
      const range = monthDateRange(point.year, point.month);
      router.push(allCfrsHref({ ...range, status: "SUBMITTED" }));
      return;
    }
    router.push(
      allCfrsHref({
        dateFrom: `${point.year}-01-01`,
        dateTo: `${point.year}-12-31`,
        status: "SUBMITTED",
      })
    );
  };

  return (
    <section className={`${cardClass} flex h-full min-h-[280px] min-w-0 flex-col overflow-hidden p-4 sm:p-5 lg:min-h-0`}>
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-ink">Customer Satisfaction Trend</h3>
          <p className="mt-0.5 text-sm text-muted">
            {mode === "monthly" ? `Avg rating by month · ${selectedYear}` : "Avg rating by year"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-line bg-zinc-50 p-0.5">
            <button
              type="button"
              onClick={() => setMode("monthly")}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                mode === "monthly" ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setMode("yearly")}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                mode === "yearly" ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              Yearly
            </button>
          </div>
          {mode === "monthly" && (
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
              className="h-8 appearance-none rounded-lg border border-line bg-white py-1 pr-8 pl-2.5 text-xs font-semibold text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
              style={selectChevron}
              aria-label="Select year"
            >
              {trend.availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {series.length === 0 ? (
        <p className="mt-8 flex-1 text-center text-sm text-muted">
          {mode === "monthly"
            ? `No months available for ${selectedYear}.`
            : "No yearly rating history yet."}
        </p>
      ) : (
        <div className="mt-3 flex min-h-0 flex-1 items-center">
          <svg viewBox={`0 0 ${width} ${height}`} className="h-full min-h-[280px] w-full" role="img">
            <title>
              {mode === "monthly"
                ? `Average customer rating by month for ${selectedYear}`
                : "Average customer rating by year"}
            </title>
            {yTicks.map((tick) => {
              const y = ratingY(tick, padding.top, innerHeight);
              return (
                <g key={tick}>
                  <line
                    x1={padding.left}
                    x2={width - padding.right}
                    y1={y}
                    y2={y}
                    stroke="#e4e4e7"
                    strokeDasharray={tick === RATING_MIN ? undefined : "4 4"}
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    className="fill-muted text-[10px]"
                  >
                    {tick}
                  </text>
                </g>
              );
            })}
            {area && <polygon points={area} fill="#0f766e" fillOpacity="0.1" />}
            {plotted.length > 1 && (
              <polyline
                points={polyline}
                fill="none"
                stroke="#0f766e"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}
            {pointCoords.map((point) => (
              <g
                key={point.key}
                className="cursor-pointer"
                onClick={() => navigateToPoint(point)}
                role="link"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigateToPoint(point);
                  }
                }}
              >
                <title>
                  {mode === "monthly"
                    ? `View submitted CFRs for ${point.label} ${point.year}`
                    : `View submitted CFRs for ${point.year}`}
                </title>
                <rect
                  x={point.x - innerWidth / series.length / 2}
                  y={padding.top}
                  width={Math.max(12, innerWidth / series.length)}
                  height={innerHeight}
                  fill="transparent"
                />
                {point.y == null ? (
                  <circle cx={point.x} cy={baselineY} r="2.5" fill="#d4d4d8" />
                ) : (
                  <>
                    <circle cx={point.x} cy={point.y} r="5" fill="#0f766e" />
                    <circle cx={point.x} cy={point.y} r="2" fill="#ffffff" />
                    <text
                      x={point.x}
                      y={point.y - 10}
                      textAnchor="middle"
                      className="fill-ink text-[10px] font-semibold"
                    >
                      {point.averageRating!.toFixed(1)}
                    </text>
                  </>
                )}
                <text
                  x={point.x}
                  y={height - 10}
                  textAnchor="middle"
                  className="fill-muted text-[9px]"
                >
                  {point.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      )}
    </section>
  );
}

export function CfrDepartmentRatingChart({
  departmentRatings,
}: {
  departmentRatings: CfrDepartmentRating[];
}) {
  const rows = departmentRatings.slice(0, 7);

  return (
    <section className={`${cardClass} flex h-full min-h-[280px] min-w-0 flex-col overflow-hidden p-4 sm:p-5 lg:min-h-0`}>
      <h3 className="shrink-0 text-base font-semibold text-ink">Department-wise Rating</h3>
      {rows.length === 0 ? (
        <p className="mt-8 flex-1 text-center text-sm text-muted">No department ratings yet.</p>
      ) : (
        <ul className="mt-3 flex min-h-0 flex-1 flex-col justify-between gap-1 overflow-hidden">
          {rows.map((row) => (
            <li key={row.departmentId || row.departmentName} className="min-h-0">
              <Link
                href={allCfrsHref({ departmentId: row.departmentId })}
                className="grid grid-cols-[minmax(0,1fr)_56px] items-center gap-3 rounded-lg px-1 py-1 transition-colors hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:outline-none"
                title={`View CFRs for ${row.departmentName}`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium leading-5 text-ink">
                    {row.departmentName}
                  </p>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${Math.max(8, (row.averageRating / 5) * 100)}%` }}
                    />
                  </div>
                </div>
                <p className="text-right text-sm font-semibold tabular-nums text-ink">
                  {row.averageRating.toFixed(1)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function CfrFeedbackStatusChart({
  kpis,
  compact = false,
}: {
  kpis: CfrKpis;
  compact?: boolean;
}) {
  const pending = kpis.sent;
  const received = kpis.submitted;
  const total = received + pending;
  const percent = total === 0 ? 0 : Math.round((received / total) * 100);
  const radius = compact ? 42 : 54;
  const stroke = compact ? 10 : 14;
  const circumference = 2 * Math.PI * radius;
  const receivedLength = total === 0 ? 0 : (received / total) * circumference;

  return (
    <section
      className={`${cardClass} flex h-full min-h-0 min-w-0 flex-col ${compact ? "px-4 py-3" : "p-4 sm:p-5"}`}
    >
      <h3 className={`shrink-0 font-semibold text-ink ${compact ? "text-sm" : "text-base"}`}>
        Feedback Status
      </h3>
      <div className={`flex flex-1 flex-col items-center justify-center ${compact ? "mt-1" : "mt-2"}`}>
        <Link
          href={allCfrsHref()}
          className="rounded-full focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:outline-none"
          title="View all CFRs"
        >
          <svg
            viewBox="0 0 140 140"
            className={compact ? "h-[4.75rem] w-[4.75rem]" : "h-40 w-40"}
            role="img"
          >
            <title>{`${percent}% of sent requests have received feedback`}</title>
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="#e4e4e7"
              strokeWidth={stroke}
            />
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="#0f766e"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${receivedLength} ${circumference}`}
              transform="rotate(-90 70 70)"
            />
            <text
              x="70"
              y="76"
              textAnchor="middle"
              className={`fill-ink font-semibold ${compact ? "text-lg" : "text-2xl"}`}
            >
              {percent}%
            </text>
          </svg>
        </Link>
        <div
          className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-1 ${
            compact ? "mt-1.5 text-xs" : "mt-3 text-sm"
          }`}
        >
          <Link
            href={allCfrsHref({ status: "SUBMITTED" })}
            className="text-muted transition-colors hover:text-ink"
            title="View received feedback"
          >
            Received: <span className="font-semibold text-ink">{received}</span>
          </Link>
          <Link
            href={allCfrsHref({ status: "SENT" })}
            className="text-muted transition-colors hover:text-ink"
            title="View pending feedback"
          >
            Pending: <span className="font-semibold text-ink">{pending}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
