"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Department, Project } from "@/app/generated/prisma";
import type { CfrWithProject } from "../../domain/cfr.repository";
import { getCfrByIdAction } from "../server-actions/cfr-actions";
import { CfrFilters } from "../components/cfr-filters";
import { CfrTable } from "../components/cfr-table";
import { CfrViewDialog, CfrOverallRatingCard } from "../components/cfr-view-dialog";
import { CfrModal } from "../components/cfr-modal";
import { CfrStatusBadge } from "../components/cfr-status-badge";
import { cardClass } from "../components/cfr-ui";

export interface CfrPageViewProps {
  departments: (Department & { projects: Project[] })[];
  cfrs: CfrWithProject[];
  totalCount: number;
  currentPage: number;
  limit: number;
}

export function CfrPageView({
  departments,
  cfrs,
  totalCount,
  currentPage,
  limit,
}: CfrPageViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedCfr, setSelectedCfr] = useState<CfrWithProject | null>(null);

  const selectedDepartmentId = searchParams.get("departmentId") || "";
  const selectedProjectId = searchParams.get("projectId") || "";
  const selectedStatus = searchParams.get("status") || "";
  const selectedDateFrom = searchParams.get("dateFrom") || "";
  const selectedDateTo = searchParams.get("dateTo") || "";
  const searchQuery = searchParams.get("search") || "";
  const viewCfrId = searchParams.get("view");

  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== searchQuery) {
        updateFilters({ search: localSearch, page: "1" });
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [localSearch]);

  useEffect(() => {
    if (!viewCfrId) {
      return;
    }

    const id = Number.parseInt(viewCfrId, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return;
    }

    const fromTable = cfrs.find((cfr) => cfr.id === id);
    if (fromTable) {
      setSelectedCfr(fromTable);
      return;
    }

    let cancelled = false;
    void getCfrByIdAction(id).then((cfr) => {
      if (!cancelled && cfr) {
        setSelectedCfr(cfr);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [viewCfrId, cfrs]);

  const clearViewParam = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("view");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const handleCloseView = () => {
    setSelectedCfr(null);
    if (viewCfrId) {
      clearViewParam();
    }
  };

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === "") {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });

    if ("departmentId" in updates) {
      const nextDepartmentId = updates.departmentId ?? "";
      if (nextDepartmentId) {
        const currentProjectId = params.get("projectId");
        const department = departments.find((d) => d.id === nextDepartmentId);
        const projectStillValid = department?.projects.some((p) => p.id === currentProjectId);
        if (!projectStillValid) {
          params.delete("projectId");
        }
      }
      params.set("page", "1");
    }

    if (
      "projectId" in updates ||
      "status" in updates ||
      "dateFrom" in updates ||
      "dateTo" in updates
    ) {
      params.set("page", "1");
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setLocalSearch("");
    router.push(pathname);
  };

  const startIdx = totalCount === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endIdx = Math.min(currentPage * limit, totalCount);
  const totalPages = Math.ceil(totalCount / limit);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex w-full min-w-0 flex-1 flex-col gap-6">
      <div className="shrink-0">
        <h2 className="text-2xl font-semibold tracking-tight text-ink">
          Customer Feedback Reviews
        </h2>
        <p className="mt-1 text-sm text-muted">View and manage all customer feedback requests.</p>
      </div>

      <div className="shrink-0">
        <CfrFilters
          departments={departments}
          selectedDepartmentId={selectedDepartmentId}
          selectedProjectId={selectedProjectId}
          selectedStatus={selectedStatus}
          selectedDateFrom={selectedDateFrom}
          selectedDateTo={selectedDateTo}
          searchQuery={localSearch}
          onDepartmentChange={(id) => updateFilters({ departmentId: id })}
          onProjectChange={(id) => updateFilters({ projectId: id })}
          onStatusChange={(status) => updateFilters({ status })}
          onDateRangeChange={(dateFrom, dateTo) => updateFilters({ dateFrom, dateTo })}
          onSearchChange={setLocalSearch}
          onClearFilters={handleClearFilters}
        />
      </div>

      <div className={`flex flex-1 flex-col p-4 sm:p-6 ${cardClass}`}>
        <CfrTable cfrs={cfrs} onView={setSelectedCfr} />

        {totalCount > 0 && (
          <div className="mt-auto flex shrink-0 flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted">
              Showing {startIdx}–{endIdx} of {totalCount}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto">
              <button
                type="button"
                disabled={!hasPrev}
                onClick={() => updateFilters({ page: String(currentPage - 1) })}
                className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-line bg-white px-3 text-xs font-medium text-ink transition-colors duration-150 hover:bg-zinc-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Previous
              </button>

              {pageNumbers.map((num) => {
                const isCurrent = num === currentPage;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => updateFilters({ page: String(num) })}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold transition-all duration-150 ${
                      isCurrent
                        ? "bg-accent text-white"
                        : "border border-line bg-white text-ink hover:bg-zinc-50"
                    }`}
                  >
                    {num}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={!hasNext}
                onClick={() => updateFilters({ page: String(currentPage + 1) })}
                className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-line bg-white px-3 text-xs font-medium text-ink transition-colors duration-150 hover:bg-zinc-50 disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedCfr && (
        <CfrModal
          title={`CFR-${selectedCfr.id}`}
          subtitle={selectedCfr.project.projectName}
          badge={<CfrStatusBadge status={selectedCfr.status} />}
          headerAside={<CfrOverallRatingCard cfr={selectedCfr} />}
          onClose={handleCloseView}
        >
          <CfrViewDialog cfr={selectedCfr} />
        </CfrModal>
      )}
    </div>
  );
}
