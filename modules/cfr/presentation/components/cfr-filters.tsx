import { RotateCcw, Search } from "lucide-react";
import type { Department, Project } from "@/app/generated/prisma";
import { CfrDateRangePicker } from "./cfr-date-range-picker";
import { cardClass, fieldClass, selectChevron } from "./cfr-ui";

export interface CfrFiltersProps {
  departments: (Department & { projects: Project[] })[];
  selectedDepartmentId: string;
  selectedProjectId: string;
  selectedStatus: string;
  selectedDateFrom: string;
  selectedDateTo: string;
  searchQuery: string;
  onDepartmentChange: (id: string) => void;
  onProjectChange: (id: string) => void;
  onStatusChange: (status: string) => void;
  onDateRangeChange: (dateFrom: string, dateTo: string) => void;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
}

export function CfrFilters({
  departments,
  selectedDepartmentId,
  selectedProjectId,
  selectedStatus,
  selectedDateFrom,
  selectedDateTo,
  searchQuery,
  onDepartmentChange,
  onProjectChange,
  onStatusChange,
  onDateRangeChange,
  onSearchChange,
  onClearFilters,
}: CfrFiltersProps) {
  const projects = selectedDepartmentId
    ? (departments.find((d) => d.id === selectedDepartmentId)?.projects ?? [])
    : departments
        .flatMap((d) => d.projects)
        .slice()
        .sort((a, b) => a.projectName.localeCompare(b.projectName));

  const hasActiveFilters = Boolean(
    searchQuery ||
      selectedDepartmentId ||
      selectedProjectId ||
      selectedStatus ||
      selectedDateFrom ||
      selectedDateTo
  );

  return (
    <div className={`${cardClass} p-4 sm:p-5`}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 basis-[220px]">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 z-10 h-4 w-4 -translate-y-1/2 text-zinc-400"
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

        <select
          value={selectedDepartmentId}
          onChange={(e) => onDepartmentChange(e.target.value)}
          className={`${fieldClass()} min-w-[160px] flex-1 basis-[160px] appearance-none pr-10`}
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
          className={`${fieldClass()} min-w-[160px] flex-1 basis-[160px] appearance-none pr-10`}
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
          className={`${fieldClass()} min-w-[140px] flex-1 basis-[140px] appearance-none pr-10`}
          style={selectChevron}
          aria-label="Status"
        >
          <option value="">All Statuses</option>
          <option value="SENT">Sent</option>
          <option value="SUBMITTED">Submitted</option>
        </select>

        <div className="min-w-[220px] flex-1 basis-[220px]">
          <CfrDateRangePicker
            dateFrom={selectedDateFrom}
            dateTo={selectedDateTo}
            onChange={onDateRangeChange}
          />
        </div>

        <button
          type="button"
          onClick={onClearFilters}
          disabled={!hasActiveFilters}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-accent/25 bg-accent-soft px-4 text-sm font-semibold whitespace-nowrap text-accent shadow-sm transition-all duration-150 hover:border-accent/40 hover:bg-accent hover:text-white focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:border-line disabled:bg-zinc-100 disabled:text-zinc-400 disabled:shadow-none"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Reset Filters
        </button>
      </div>
    </div>
  );
}
