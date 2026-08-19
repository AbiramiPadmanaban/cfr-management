"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { Department, Project, CfrStatus } from "@/app/generated/prisma";
import type { CfrWithProject, CfrKpis, CfrCreateInput } from "../../domain/cfr.repository";

// Presentation Components
import { CfrKpiCards } from "../components/cfr-kpi-cards";
import { CfrFilters } from "../components/cfr-filters";
import { CfrTable } from "../components/cfr-table";
import { CfrForm } from "../components/cfr-form";
import { CfrViewDialog } from "../components/cfr-view-dialog";
import { CfrDeleteDialog } from "../components/cfr-delete-dialog";

// Actions
import {
  createCfrAction,
  updateCfrAction,
  deleteCfrAction,
} from "../server-actions/cfr-actions";

export interface CfrPageViewProps {
  departments: (Department & { projects: Project[] })[];
  cfrs: CfrWithProject[];
  kpis: CfrKpis;
}

export function CfrPageView({ departments, cfrs, kpis }: CfrPageViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Dialog/modal states
  const [activeModal, setActiveModal] = useState<null | "create" | "edit" | "view" | "delete">(null);
  const [selectedCfr, setSelectedCfr] = useState<CfrWithProject | null>(null);

  // Notification feedback state
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Read search parameters from URL
  const selectedDepartmentId = searchParams.get("departmentId") || "";
  const selectedProjectId = searchParams.get("projectId") || "";
  const selectedStatus = searchParams.get("status") || "";
  const searchQuery = searchParams.get("search") || "";

  // Local search input state (for debouncing)
  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Debounced search query URL update
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== searchQuery) {
        updateFilters({ search: localSearch });
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

    // Reset project if department changes
    if ("departmentId" in updates) {
      params.delete("projectId");
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  // Show a notification banner that auto-dismisses
  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Modal actions
  const openCreateModal = () => {
    setSelectedCfr(null);
    setActiveModal("create");
  };

  const openViewModal = (cfr: CfrWithProject) => {
    setSelectedCfr(cfr);
    setActiveModal("view");
  };

  const openEditModal = (cfr: CfrWithProject) => {
    setSelectedCfr(cfr);
    setActiveModal("edit");
  };

  const openDeleteModal = (id: number) => {
    const cfr = cfrs.find((c) => c.id === id) || null;
    setSelectedCfr(cfr);
    setActiveModal("delete");
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedCfr(null);
  };

  // Save (Create/Update) handler
  const handleSave = async (data: CfrCreateInput) => {
    if (activeModal === "create") {
      await createCfrAction(data);
      showNotification("CFR created successfully!");
    } else if (activeModal === "edit" && selectedCfr) {
      await updateCfrAction(selectedCfr.id, data);
      showNotification("CFR updated successfully!");
    }
    closeModal();
  };

  // Delete handler
  const handleDelete = async () => {
    if (selectedCfr) {
      await deleteCfrAction(selectedCfr.id);
      showNotification("CFR deleted successfully!");
    }
    closeModal();
  };

  // Clear all filters
  const handleClearFilters = () => {
    setLocalSearch("");
    router.push(pathname);
  };

  return (
    <div className="flex-1 bg-zinc-50/50 p-6 dark:bg-zinc-900/10">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* Toast Notification Banner */}
        {notification && (
          <div className={`fixed top-5 right-5 z-55 flex items-center gap-2 rounded-xl border p-4 shadow-lg animate-in fade-in slide-in-from-top-4 duration-200 ${
            notification.type === "success" 
              ? "bg-green-50 text-green-800 border-green-200 dark:bg-green-950/90 dark:text-green-300 dark:border-green-850" 
              : "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/90 dark:text-red-300 dark:border-red-850"
          }`}>
            <span className="text-sm font-semibold">{notification.message}</span>
          </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-5 dark:border-zinc-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Customer Feedback Review
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Manage and track project satisfaction feedback reviews from clients.
            </p>
          </div>
          <div>
            <button
              onClick={openCreateModal}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800 focus:outline-none dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              + Create CFR
            </button>
          </div>
        </div>

        {/* KPI Scorecard Cards */}
        <CfrKpiCards kpis={kpis} />

        {/* Search and Filters Section */}
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

        {/* Data Table */}
        <CfrTable
          cfrs={cfrs}
          onView={openViewModal}
          onEdit={openEditModal}
          onDelete={openDeleteModal}
        />

        {/* Custom Overlay Dialog Modal */}
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
            <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950 animate-in zoom-in-95 duration-150">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-zinc-150 dark:border-zinc-850">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  {activeModal === "create" && "Create Customer Feedback Review"}
                  {activeModal === "edit" && "Edit Customer Feedback Review"}
                  {activeModal === "view" && "CFR Detailed Scorecard"}
                  {activeModal === "delete" && "Confirm Deletion"}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200"
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

              {/* Modal Content Scrollable Area */}
              <div className="mt-4 max-h-[75vh] overflow-y-auto pr-1">
                {activeModal === "create" && (
                  <CfrForm
                    departments={departments}
                    onSave={handleSave}
                    onCancel={closeModal}
                  />
                )}
                {activeModal === "edit" && selectedCfr && (
                  <CfrForm
                    departments={departments}
                    cfr={selectedCfr}
                    onSave={handleSave}
                    onCancel={closeModal}
                  />
                )}
                {activeModal === "view" && selectedCfr && (
                  <CfrViewDialog cfr={selectedCfr} onClose={closeModal} />
                )}
                {activeModal === "delete" && selectedCfr && (
                  <CfrDeleteDialog
                    id={selectedCfr.id}
                    onConfirm={handleDelete}
                    onCancel={closeModal}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
