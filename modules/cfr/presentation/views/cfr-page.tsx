"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Department, Project } from "@/app/generated/prisma";
import type { CfrWithProject } from "../../domain/cfr.repository";

// Presentation Components
import { CfrFilters } from "../components/cfr-filters";
import { CfrTable } from "../components/cfr-table";
import { CfrViewDialog } from "../components/cfr-view-dialog";

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

  // Selected CFR for read-only view dialog
  const [selectedCfr, setSelectedCfr] = useState<CfrWithProject | null>(null);

  // Search parameters
  const selectedDepartmentId = searchParams.get("departmentId") || "";
  const selectedProjectId = searchParams.get("projectId") || "";
  const selectedStatus = searchParams.get("status") || "";
  const searchQuery = searchParams.get("search") || "";

  // Local search text for debouncing
  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Debounced search query URL update
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== searchQuery) {
        updateFilters({ search: localSearch, page: "1" }); // Reset to page 1 on new search
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [localSearch]);

  // Utility to update URL search parameters
  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === "") {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });

    // Reset project and page if department changes
    if ("departmentId" in updates) {
      params.delete("projectId");
      params.set("page", "1");
    }

    // Reset page if project or status changes
    if ("projectId" in updates || "status" in updates) {
      params.set("page", "1");
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setLocalSearch("");
    router.push(pathname);
  };

  // Pagination index calculations
  const startIdx = totalCount === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endIdx = Math.min(currentPage * limit, totalCount);
  const totalPages = Math.ceil(totalCount / limit);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  // Generate page numbers array
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header (Matching Ticket Header with count badge and create button) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2.5xl font-black text-slate-900 tracking-tight">All CFRs</h1>
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#185adb] px-1.5 text-xs font-black text-white">
            {totalCount}
          </span>
        </div>
        <Link
          href="/cfr/create"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-[#1a3574] px-5 text-sm font-bold text-white hover:bg-[#152e66] shadow-sm transition-colors"
        >
          Create CFR
        </Link>
      </div>

      {/* 1. Filters Card wrapper */}
      <CfrFilters
        departments={departments}
        selectedDepartmentId={selectedDepartmentId}
        selectedProjectId={selectedProjectId}
        selectedStatus={selectedStatus}
        searchQuery={localSearch}
        onDepartmentChange={(id) => updateFilters({ departmentId: id })}
        onProjectChange={(id) => updateFilters({ projectId: id })}
        onStatusChange={(status) => updateFilters({ status })}
        onSearchChange={setLocalSearch}
        onClearFilters={handleClearFilters}
      />

      {/* 2. Table & Pagination Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        {/* Table list */}
        <CfrTable cfrs={cfrs} onView={setSelectedCfr} />

        {/* Pagination Footer */}
        {totalCount > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 pt-4">
            {/* Range indicator text */}
            <div className="text-sm font-semibold text-slate-400">
              Showing {startIdx}–{endIdx} of {totalCount} CFRs
            </div>

            {/* Pagination Controls (Matching SolidPro style) */}
            <div className="flex items-center gap-3 self-end sm:self-auto">
              {/* Limit display selector */}
              <div className="relative">
                <select
                  value={limit}
                  disabled
                  className="h-9 rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-xs font-bold text-slate-700 outline-none appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 8px center",
                    backgroundSize: "12px",
                  }}
                >
                  <option value={limit}>{limit}</option>
                </select>
              </div>

              {/* Prev / Pages / Next */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={!hasPrev}
                  onClick={() => updateFilters({ page: String(currentPage - 1) })}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
                >
                  Previous
                </button>

                {pageNumbers.map((num) => {
                  const isCurrent = num === currentPage;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => updateFilters({ page: String(num) })}
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                        isCurrent
                          ? "bg-[#1a3574] text-white shadow-md shadow-[#1a3574]/20"
                          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
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
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CFR Details Scorecard Overlay Dialog Modal */}
      {selectedCfr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                CFR Detailed Scorecard
              </h3>
              <button
                onClick={() => setSelectedCfr(null)}
                className="text-slate-400 hover:text-slate-650"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <div className="mt-4 max-h-[75vh] overflow-y-auto pr-1">
              <CfrViewDialog cfr={selectedCfr} onClose={() => setSelectedCfr(null)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
