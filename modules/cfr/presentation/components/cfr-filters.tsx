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
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by project or client"
            className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none"
          />
        </div>

        {/* Department Select */}
        <div className="relative w-full sm:w-48">
          <select
            value={selectedDepartmentId}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-800 focus:border-slate-400 focus:outline-none appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
              backgroundSize: "16px",
            }}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Project Select */}
        <div className="relative w-full sm:w-48">
          <select
            value={selectedProjectId}
            onChange={(e) => onProjectChange(e.target.value)}
            disabled={!selectedDepartmentId}
            className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-800 focus:border-slate-400 focus:outline-none appearance-none disabled:opacity-50"
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
              backgroundSize: "16px",
            }}
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectName}
              </option>
            ))}
          </select>
        </div>

        {/* Status Select */}
        <div className="relative w-full sm:w-44">
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-800 focus:border-slate-400 focus:outline-none appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
              backgroundSize: "16px",
            }}
          >
            <option value="">All Statuses</option>
            <option value="SENT">Sent</option>
            <option value="SUBMITTED">Submitted</option>
          </select>
        </div>

        {/* Reset Filters Button */}
        <button
          type="button"
          onClick={onClearFilters}
          className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
}
