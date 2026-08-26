import type { CfrDepartmentRating, CfrKpis, CfrTrendPoint } from "../../domain/cfr.repository";
import { cardClass } from "./cfr-ui";

export function CfrFeedbackTrendChart({ trend }: { trend: CfrTrendPoint[] }) {
  const width = 560;
  const height = 220;
  const padding = { top: 18, right: 16, bottom: 36, left: 36 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const maxCount = Math.max(1, ...trend.map((point) => point.count));
  const points = trend.map((point, index) => {
    const x =
      padding.left + (trend.length === 1 ? innerWidth / 2 : (index / (trend.length - 1)) * innerWidth);
    const y = padding.top + innerHeight - (point.count / maxCount) * innerHeight;
    return { ...point, x, y };
  });
  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${padding.left},${padding.top + innerHeight} ${polyline} ${padding.left + innerWidth},${padding.top + innerHeight}`;
  const yTicks = [0, Math.ceil(maxCount / 2), maxCount];

  return (
    <section className={`${cardClass} flex h-full min-h-[320px] flex-col p-5 sm:p-6`}>
      <h3 className="text-base font-semibold text-ink">Feedback Received Trend</h3>
      {trend.every((point) => point.count === 0) ? (
        <p className="mt-16 flex-1 text-center text-sm text-muted">No submitted feedback in the last 6 months.</p>
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 h-[220px] w-full" role="img">
          <title>Feedback received over the last 6 months</title>
          {yTicks.map((tick) => {
            const y = padding.top + innerHeight - (tick / maxCount) * innerHeight;
            return (
              <g key={tick}>
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                  stroke="#e4e4e7"
                  strokeDasharray="4 4"
                />
                <text x={padding.left - 8} y={y + 4} textAnchor="end" className="fill-muted text-[11px]">
                  {tick}
                </text>
              </g>
            );
          })}
          <polygon points={area} fill="#0f766e" fillOpacity="0.08" />
          <polyline
            points={polyline}
            fill="none"
            stroke="#0f766e"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {points.map((point) => (
            <g key={point.month}>
              <circle cx={point.x} cy={point.y} r="4" fill="#0f766e" />
              <text x={point.x} y={height - 12} textAnchor="middle" className="fill-muted text-[11px]">
                {point.month}
              </text>
            </g>
          ))}
        </svg>
      )}
    </section>
  );
}

export function CfrDepartmentRatingChart({
  departmentRatings,
}: {
  departmentRatings: CfrDepartmentRating[];
}) {
  return (
    <section className={`${cardClass} flex h-full min-h-[320px] flex-col p-5 sm:p-6`}>
      <h3 className="text-base font-semibold text-ink">Department-wise Rating</h3>
      {departmentRatings.length === 0 ? (
        <p className="mt-16 flex-1 text-center text-sm text-muted">No department ratings yet.</p>
      ) : (
        <ul className="mt-5 space-y-4">
          {departmentRatings.map((row) => (
            <li key={row.departmentName} className="grid grid-cols-[minmax(0,1fr)_72px] items-center gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{row.departmentName}</p>
                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${Math.max(8, (row.averageRating / 5) * 100)}%` }}
                  />
                </div>
              </div>
              <p className="text-right text-sm font-semibold tabular-nums text-ink">
                {row.averageRating.toFixed(1)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function CfrFeedbackStatusChart({ kpis }: { kpis: CfrKpis }) {
  const pending = kpis.sent;
  const received = kpis.submitted;
  const total = received + pending;
  const percent = total === 0 ? 0 : Math.round((received / total) * 100);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const receivedLength = total === 0 ? 0 : (received / total) * circumference;

  return (
    <section className={`${cardClass} flex h-full min-h-[320px] flex-col p-5 sm:p-6`}>
      <h3 className="text-base font-semibold text-ink">Feedback Status</h3>
      <div className="mt-4 flex flex-col items-center">
        <svg viewBox="0 0 140 140" className="h-44 w-44" role="img">
          <title>{`${percent}% of sent requests have received feedback`}</title>
          <circle cx="70" cy="70" r={radius} fill="none" stroke="#e4e4e7" strokeWidth="14" />
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="#0f766e"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${receivedLength} ${circumference}`}
            transform="rotate(-90 70 70)"
          />
          <text x="70" y="76" textAnchor="middle" className="fill-ink text-2xl font-semibold">
            {percent}%
          </text>
        </svg>
        <div className="mt-4 flex items-center gap-6 text-sm">
          <p className="text-muted">
            Received: <span className="font-semibold text-ink">{received}</span>
          </p>
          <p className="text-muted">
            Pending: <span className="font-semibold text-ink">{pending}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
