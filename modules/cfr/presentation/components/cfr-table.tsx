import type { CfrWithProject } from "../../domain/cfr.repository";

export interface CfrTableProps {
  cfrs: CfrWithProject[];
  onView: (cfr: CfrWithProject) => void;
}

export function CfrTable({ cfrs, onView }: CfrTableProps) {
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "bg-green-50 text-green-700 border-green-200 rounded-full px-2.5 py-0.5 text-xs font-semibold border";
      case "SENT":
        return "bg-blue-50 text-blue-700 border-blue-200 rounded-full px-2.5 py-0.5 text-xs font-semibold border";
      case "DRAFT":
      default:
        return "bg-amber-50 text-amber-700 border-amber-200 rounded-full px-2.5 py-0.5 text-xs font-semibold border";
    }
  };

  if (cfrs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-12 text-center">
        <p className="text-sm font-semibold text-slate-500">No CFRs found.</p>
        <p className="mt-1 text-xs text-slate-400">
          Try clearing filters or creating a new feedback review record.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-left text-sm text-slate-600">
        <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
          <tr>
            <th className="px-5 py-3.5">#</th>
            <th className="px-5 py-3.5">CFR ID</th>
            <th className="px-5 py-3.5">Project</th>
            <th className="px-5 py-3.5">Department / Vertical</th>
            <th className="px-5 py-3.5">Client</th>
            <th className="px-5 py-3.5">CFR Date</th>
            <th className="px-5 py-3.5">Overall Rating</th>
            <th className="px-5 py-3.5">Status</th>
            <th className="px-5 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {cfrs.map((cfr, index) => {
            const createdDate = new Date(cfr.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            });

            return (
              <tr
                key={cfr.id}
                className="hover:bg-slate-50/30 transition-colors"
              >
                {/* Row Number */}
                <td className="px-5 py-4 text-slate-400 font-medium">
                  {index + 1}
                </td>
                {/* CFR ID */}
                <td className="px-5 py-4 font-bold text-slate-900">
                  #{cfr.id}
                </td>
                {/* Project Name and Number */}
                <td className="px-5 py-4">
                  <div className="font-semibold text-slate-900">
                    {cfr.project.projectName}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    {cfr.projectNumber}
                  </div>
                </td>
                {/* Department */}
                <td className="px-5 py-4 text-slate-700">
                  {cfr.project.department.name}
                </td>
                {/* Client */}
                <td className="px-5 py-4 text-slate-700">
                  {cfr.client}
                </td>
                {/* CFR Date */}
                <td className="px-5 py-4 text-slate-500 font-medium">
                  {createdDate}
                </td>
                {/* Overall Rating */}
                <td className="px-5 py-4 font-bold text-slate-900">
                  {cfr.overallSatisfaction} / 5
                </td>
                {/* Status Badge */}
                <td className="px-5 py-4">
                  <span className={getStatusBadgeClass(cfr.status)}>
                    {cfr.status}
                  </span>
                </td>
                {/* Actions (View icon ONLY) */}
                <td className="px-5 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => onView(cfr)}
                    className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-[#185adb] shadow-sm transition-all"
                    title="View Scorecard"
                  >
                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
