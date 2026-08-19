import type { CfrWithProject } from "../../domain/cfr.repository";

export interface CfrTableProps {
  cfrs: CfrWithProject[];
  onView: (cfr: CfrWithProject) => void;
  onEdit: (cfr: CfrWithProject) => void;
  onDelete: (id: number) => void;
}

export function CfrTable({ cfrs, onView, onEdit, onDelete }: CfrTableProps) {
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900";
      case "SENT":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900";
      case "DRAFT":
      default:
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900";
    }
  };

  if (cfrs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-white py-12 text-center dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">No CFRs found.</p>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          Try clearing filters or creating a new feedback review record.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse text-left text-sm text-zinc-500 dark:text-zinc-400">
          <thead className="bg-zinc-50 text-xs font-semibold text-zinc-700 uppercase tracking-wider border-b border-zinc-200 dark:bg-zinc-900/50 dark:text-zinc-300 dark:border-zinc-800">
            <tr>
              <th className="px-6 py-4 font-semibold">CFR ID</th>
              <th className="px-6 py-4 font-semibold">Department</th>
              <th className="px-6 py-4 font-semibold">Project</th>
              <th className="px-6 py-4 font-semibold">Client</th>
              <th className="px-6 py-4 font-semibold">Period</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Rating</th>
              <th className="px-6 py-4 font-semibold">Created Date</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {cfrs.map((cfr) => {
              const createdDate = new Date(cfr.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });

              return (
                <tr
                  key={cfr.id}
                  className="transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20"
                >
                  {/* CFR ID */}
                  <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-50">
                    #{cfr.id}
                  </td>
                  {/* Department */}
                  <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">
                    {cfr.project.department.name}
                  </td>
                  {/* Project */}
                  <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-50">
                    {cfr.project.projectName}
                    <div className="text-xs font-normal text-zinc-400 dark:text-zinc-500">
                      {cfr.project.projectNumber}
                    </div>
                  </td>
                  {/* Client */}
                  <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">
                    {cfr.project.clientName}
                  </td>
                  {/* Period */}
                  <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">
                    {cfr.reviewPeriod}
                  </td>
                  {/* Status */}
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(
                        cfr.status
                      )}`}
                    >
                      {cfr.status}
                    </span>
                  </td>
                  {/* Rating */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                        {cfr.overallSatisfaction}
                      </span>
                      <span className="text-xs text-zinc-400">/ 5</span>
                    </div>
                  </td>
                  {/* Created Date */}
                  <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                    {createdDate}
                  </td>
                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {/* View */}
                      <button
                        type="button"
                        onClick={() => onView(cfr)}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-550"
                      >
                        View
                      </button>
                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => onEdit(cfr)}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/20"
                      >
                        Edit
                      </button>
                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => onDelete(cfr.id)}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
