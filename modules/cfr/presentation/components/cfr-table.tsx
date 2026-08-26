import { Eye } from "lucide-react";
import type { CfrWithProject } from "../../domain/cfr.repository";
import { CfrActionNeededMarks, formatCfrDate } from "./cfr-action-needed";
import { CfrStatusBadge } from "./cfr-status-badge";
import { CfrDownloadButton } from "./cfr-download-button";
import { getCfrAverageRating } from "./cfr-rating-criteria";
import { iconButtonClass } from "./cfr-ui";

export interface CfrTableProps {
  cfrs: CfrWithProject[];
  onView: (cfr: CfrWithProject) => void;
}

export function CfrTable({ cfrs, onView }: CfrTableProps) {
  if (cfrs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-zinc-50 py-14 text-center">
        <p className="text-sm font-semibold text-ink">No CFRs found.</p>
        <p className="mt-1 text-sm text-muted">
          Try clearing filters or creating a new feedback request.
        </p>
      </div>
    );
  }

  return (
    <table className="w-full table-fixed border-collapse text-left text-sm">
      <thead>
        <tr className="text-[11px] font-medium tracking-[0.14em] text-muted uppercase">
          <th className="w-8 px-2 py-3 font-medium">#</th>
          <th className="px-2 py-3 font-medium">Project</th>
          <th className="w-[11%] px-2 py-3 font-medium">Department</th>
          <th className="w-[9%] px-2 py-3 font-medium">Client</th>
          <th className="w-[9%] px-2 py-3 font-medium">Created</th>
          <th className="w-[11%] px-2 py-3 font-medium">Overall Rating</th>
          <th className="w-[9%] px-2 py-3 font-medium">Status</th>
          <th className="w-[10%] px-2 py-3 font-medium">Date Received</th>
          <th className="w-[8%] px-2 py-3 font-medium">By</th>
          <th className="w-[9%] px-2 py-3 font-medium">Action Needed</th>
          <th className="w-[88px] px-2 py-3 text-right font-medium">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {cfrs.map((cfr, index) => {
          const created = new Date(cfr.createdAt);
          const createdDate = `${String(created.getDate()).padStart(2, "0")}/${String(
            created.getMonth() + 1
          ).padStart(2, "0")}/${created.getFullYear()}`;

          const averageRating = getCfrAverageRating(cfr);

          return (
            <tr key={cfr.id} className="transition-colors duration-150 hover:bg-zinc-50/80">
              <td className="px-2 py-3.5 font-medium text-zinc-400">{index + 1}</td>
              <td className="px-2 py-3.5">
                <div className="truncate font-medium text-ink" title={cfr.project.projectName}>
                  {cfr.project.projectName}
                </div>
                <div className="mt-0.5 truncate font-mono text-xs text-muted">{cfr.projectNumber}</div>
              </td>
              <td className="truncate px-2 py-3.5 text-ink">{cfr.project.department.name}</td>
              <td className="truncate px-2 py-3.5 text-ink">{cfr.client}</td>
              <td className="px-2 py-3.5 whitespace-nowrap text-muted">{createdDate}</td>
              <td className="px-2 py-3.5 font-semibold whitespace-nowrap text-ink">
                {averageRating != null ? `${averageRating.toFixed(1)} / 5` : "Pending"}
              </td>
              <td className="px-2 py-3.5">
                <CfrStatusBadge status={cfr.status} />
              </td>
              <td className="px-2 py-3.5 whitespace-nowrap text-muted">
                {cfr.status === "SUBMITTED" ? formatCfrDate(cfr.feedbackSubmittedAt) : "—"}
              </td>
              <td className="truncate px-2 py-3.5 text-ink">
                {cfr.status === "SUBMITTED" ? cfr.reviewedBy || "—" : "—"}
              </td>
              <td className="px-2 py-3.5">
                <CfrActionNeededMarks
                  cfrId={cfr.id}
                  received={cfr.status === "SUBMITTED"}
                  actionNeeded={cfr.actionNeeded}
                />
              </td>
              <td className="px-2 py-3.5">
                <div className="flex items-center justify-end gap-1.5">
                  <CfrDownloadButton cfr={cfr} />
                  <button
                    type="button"
                    onClick={() => onView(cfr)}
                    className={iconButtonClass}
                    title="View scorecard"
                    aria-label={`View ${cfr.project.projectName}`}
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
