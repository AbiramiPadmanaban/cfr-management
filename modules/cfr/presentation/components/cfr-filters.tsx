import { Search } from "lucide-react";
import type { Department, Project } from "@/app/generated/prisma";
import { cardClass, fieldClass, selectChevron } from "./cfr-ui";

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
  const activeDepartment = departments.find((d) => d.id === selectedDepartmentId);
  const projects = activeDepartment ? activeDepartment.projects : [];
  const hasActiveFilters = Boolean(
    searchQuery || selectedDepartmentId || selectedProjectId || selectedStatus
  );

  return (
    <div className={`${cardClass} p-4 sm:p-5`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-400"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by project or client"
            className={`${fieldClass()} pl-10`}
            aria-label="Search by project or client"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select
            value={selectedDepartmentId}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className={`${fieldClass()} appearance-none pr-10`}
            style={selectChevron}
            aria-label="Department"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={selectedProjectId}
            onChange={(e) => onProjectChange(e.target.value)}
            disabled={!selectedDepartmentId}
            className={`${fieldClass()} appearance-none pr-10`}
            style={selectChevron}
            aria-label="Project"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectName}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className={`${fieldClass()} appearance-none pr-10`}
            style={selectChevron}
            aria-label="Status"
          >
            <option value="">All Statuses</option>
            <option value="SENT">Sent</option>
            <option value="SUBMITTED">Submitted</option>
          </select>

          <button
            type="button"
            onClick={onClearFilters}
            disabled={!hasActiveFilters}
            className="h-11 rounded-xl border border-line bg-white px-4 text-sm font-medium text-muted transition-colors duration-150 hover:bg-zinc-50 hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:opacity-40"
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
}
