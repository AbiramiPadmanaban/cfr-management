import type { ReactNode } from "react";
import type { CfrWithProject } from "../../domain/cfr.repository";
import { CFR_RATING_CRITERIA } from "./cfr-rating-criteria";
import { CfrActionNeededMarks, formatCfrDate } from "./cfr-action-needed";

export interface CfrViewDialogProps {
  cfr: CfrWithProject;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <div className="mt-1 text-sm font-medium text-slate-800">{children}</div>
    </div>
  );
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "SUBMITTED":
      return "border-green-200 bg-green-50 text-green-700";
    case "SENT":
      return "border-blue-200 bg-blue-50 text-blue-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

export function CfrViewDialog({ cfr }: CfrViewDialogProps) {
  const createdDate = new Date(cfr.createdAt).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const startDateDisplay = new Date(cfr.project.projectStartDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const endDateDisplay = new Date(cfr.project.projectEndDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const ratingsList = [
    cfr.qualityRating,
    cfr.deliveryRating,
    cfr.communicationRating,
    cfr.technicalCompetence,
    cfr.overallSatisfaction,
  ].filter((rating): rating is number => rating != null);
  const ratingsSum = ratingsList.reduce((acc, curr) => acc + curr, 0);
  const calculatedAvg = ratingsList.length > 0 ? ratingsSum / ratingsList.length : null;
  const hasRatings = ratingsList.length > 0;
  const received = cfr.status === "SUBMITTED";

  const renderStars = (rating: number | null, gradientId: string) => {
    if (rating == null) {
      return <span className="text-xs font-semibold text-slate-400">Pending</span>;
    }
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              className={`h-4 w-4 text-amber-400 ${
                star <= rating
                  ? "fill-amber-400"
                  : star - 0.5 === rating
                    ? `fill-[url(#${gradientId})]`
                    : "fill-slate-200"
              }`}
              viewBox="0 0 20 20"
              stroke="currentColor"
              strokeWidth={0.5}
            >
              <defs>
                <linearGradient id={gradientId}>
                  <stop offset="50%" stopColor="#fbbf24" />
                  <stop offset="50%" stopColor="transparent" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <span className="text-sm font-bold text-slate-900">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-bold text-slate-900">{cfr.project.projectName}</p>
          <p className="mt-0.5 font-mono text-xs text-slate-400">{cfr.projectNumber}</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(
              cfr.status
            )}`}
          >
            {cfr.status}
          </span>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Average</p>
            <p className="text-lg font-black leading-none text-[#1a3574]">
              {calculatedAvg != null ? calculatedAvg.toFixed(1) : "—"}
              <span className="ml-0.5 text-xs font-semibold text-slate-400">/ 5</span>
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
          <Field label="CFR ID">
            <span className="font-mono">#{cfr.id}</span>
          </Field>
          <Field label="Department">{cfr.project.department.name}</Field>
          <Field label="Review Period">{cfr.reviewPeriod}</Field>
          <Field label="Client Name">{cfr.client}</Field>
          <Field label="Client Email">{cfr.clientEmail}</Field>
          <Field label="Project Start Date">{startDateDisplay}</Field>
          <Field label="Project End Date">{endDateDisplay}</Field>
          <Field label="Created At">{createdDate}</Field>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900">Ratings</h4>
          <span className="text-xs text-slate-400">
            {hasRatings ? "Across all 5 parameters" : "Waiting for client ratings"}
          </span>
        </div>
        <div className="divide-y divide-slate-100">
          {CFR_RATING_CRITERIA.map((criterion, index) => (
            <div key={criterion.key} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 sm:pr-6">
                <p className="text-sm font-semibold text-slate-800">
                  {index + 1}. {criterion.label}
                </p>
                <p className="mt-0.5 text-[11px] leading-4 text-slate-400">{criterion.description}</p>
                {cfr[criterion.remarksField] && (
                  <p className="mt-2 rounded-md bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">
                    {cfr[criterion.remarksField]}
                  </p>
                )}
              </div>
              <div className="shrink-0">
                {renderStars(cfr[criterion.ratingField], `half-star-dialog-${criterion.key}`)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h4 className="text-sm font-bold text-slate-900">Overall Comments / Area of Improvement</h4>
        <p className="mt-2 rounded-lg bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-700">
          {cfr.comments || "No comments provided."}
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Reviewed By">{cfr.reviewedBy || "—"}</Field>
          <Field label="Date">{formatCfrDate(cfr.reviewedAt)}</Field>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
        <h4 className="text-sm font-bold text-slate-700">For Internal Use</h4>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Date Received">
            {received ? formatCfrDate(cfr.feedbackSubmittedAt) : "—"}
          </Field>
          <Field label="By">{received ? cfr.reviewedBy || "—" : "—"}</Field>
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
      </div>
    </div>
  );
}
