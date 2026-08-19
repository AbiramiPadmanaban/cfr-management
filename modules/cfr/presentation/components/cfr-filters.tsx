import type { Department, Project } from "@/app/generated/prisma";

export interface CfrFiltersProps {
  departments: (Department & { projects: Project[] })[];
  selectedDepartmentId: string;
  selectedProjectId: string;
  selectedStatus: string;
  searchQuery: string;
  onDepartmentChange: (id: string) => void;
  onProjectChange: (id: string) => void;
  onStatusChange: (status: string) => void;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
}

export function CfrFilters({
  departments,
  selectedDepartmentId,
  selectedProjectId,
  selectedStatus,
  searchQuery,
  onDepartmentChange,
  onProjectChange,
  onStatusChange,
  onSearchChange,
  onClearFilters,
}: CfrFiltersProps) {
  // Find projects for the selected department
  const activeDepartment = departments.find((d) => d.id === selectedDepartmentId);
  const projects = activeDepartment ? activeDepartment.projects : [];

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-5 items-end">
        {/* Search */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
            Search
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ID, project or client name..."
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-700"
          />
        </div>

        {/* Department */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
            Department
          </label>
          <select
            value={selectedDepartmentId}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-700"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Project */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
            Project
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => onProjectChange(e.target.value)}
            disabled={!selectedDepartmentId}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:bg-white focus:outline-none disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-700"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectName}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
            Status
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-700"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="SUBMITTED">Submitted</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        <button
          type="button"
          onClick={onClearFilters}
          className="flex h-10 w-full items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-850"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
}
