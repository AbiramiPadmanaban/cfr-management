import type { ReactNode } from "react";
import type { CfrWithProject } from "../../domain/cfr.repository";
import { CFR_RATING_CRITERIA, getCfrAverageRating, toWholeRating } from "./cfr-rating-criteria";
import { CfrActionNeededMarks, formatCfrDate } from "./cfr-action-needed";

export interface CfrViewDialogProps {
  cfr: CfrWithProject;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <span className="block text-[11px] font-medium tracking-[0.12em] text-muted uppercase">
        {label}
      </span>
      <div className="mt-1 text-sm font-medium text-ink">{children}</div>
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  const filled = Math.round(rating);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`h-4 w-4 ${star <= filled ? "text-accent" : "text-zinc-200"}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function CfrViewDialog({ cfr }: CfrViewDialogProps) {
  const formatShort = (value: Date | string) => {
    const date = new Date(value);
    return `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const calculatedAvg = getCfrAverageRating(cfr);
  const hasRatings = calculatedAvg != null;
  const received = cfr.status === "SUBMITTED";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-zinc-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-medium tracking-[0.14em] text-muted uppercase">
            Overall Rating
          </p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-ink">
            {calculatedAvg != null ? `${calculatedAvg.toFixed(1)} / 5` : "—"}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          {calculatedAvg != null ? <Stars rating={calculatedAvg} /> : null}
          <p className="text-xs text-muted">Average of all 5 criteria</p>
        </div>
      </div>

      <section className="rounded-2xl border border-line p-4">
        <h4 className="text-sm font-semibold text-ink">Project Information</h4>
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
          <Field label="Department">{cfr.project.department.name}</Field>
          <Field label="Project">{cfr.project.projectName}</Field>
          <Field label="Client">{cfr.client}</Field>
          <Field label="Project Number">
            <span className="font-mono">{cfr.projectNumber}</span>
          </Field>
          <Field label="Start Date">{formatShort(cfr.project.projectStartDate)}</Field>
          <Field label="End Date">{formatShort(cfr.project.projectEndDate)}</Field>
          <Field label="Review Period">{cfr.reviewPeriod}</Field>
          <Field label="Client Email">{cfr.clientEmail}</Field>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-ink">Ratings</h4>
          <span className="text-xs text-muted">
            {hasRatings ? "Across all 5 parameters" : "Waiting for client ratings"}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CFR_RATING_CRITERIA.map((criterion) => {
            const rating = cfr[criterion.ratingField];
            const whole = rating != null ? toWholeRating(rating) : null;
            return (
              <div key={criterion.key} className="rounded-2xl border border-line p-4">
                <p className="text-sm font-semibold text-ink">{criterion.label}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{criterion.description}</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  {whole != null ? (
                    <>
                      <Stars rating={whole} />
                      <span className="text-sm font-semibold text-ink">{whole} / 5</span>
                    </>
                  ) : (
                    <span className="text-xs font-medium text-zinc-400">Pending</span>
                  )}
                </div>
                {cfr[criterion.remarksField] && (
                  <p className="mt-3 rounded-xl bg-zinc-50 px-3 py-2 text-xs text-muted">
                    {cfr[criterion.remarksField]}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-line p-4">
        <h4 className="text-sm font-semibold text-ink">Comments</h4>
        <p className="mt-2 rounded-xl bg-zinc-50 px-3 py-3 text-sm leading-6 text-ink">
          {cfr.comments || "No comments provided."}
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Reviewed By">{cfr.reviewedBy || "—"}</Field>
          <Field label="Date">{formatCfrDate(cfr.reviewedAt)}</Field>
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-4">
        <h4 className="text-sm font-semibold text-ink">Request Information</h4>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Created">{formatShort(cfr.createdAt)}</Field>
          <Field label="Date Received">
            {received ? formatCfrDate(cfr.feedbackSubmittedAt) : "—"}
          </Field>
          <Field label="Status">{cfr.status}</Field>
          <div className="sm:col-span-3">
            <span className="block text-[11px] font-medium tracking-[0.12em] text-muted uppercase">
              Action needs to be taken
            </span>
            <div className="mt-1.5">
              <CfrActionNeededMarks
                cfrId={cfr.id}
                received={received}
                actionNeeded={cfr.actionNeeded}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
