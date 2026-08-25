"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Department, Project } from "@/app/generated/prisma";
import { createCfrAction } from "../server-actions/cfr-actions";

export interface CfrCreateViewProps {
  departments: (Department & { projects: Project[] })[];
}

export function CfrCreateView({ departments }: CfrCreateViewProps) {
  const router = useRouter();

  const [departmentId, setDepartmentId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [projectNameText, setProjectNameText] = useState("");
  const [client, setClient] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [projectNumber, setProjectNumber] = useState("");
  const [projectStartDate, setProjectStartDate] = useState<Date | null>(null);
  const [projectEndDate, setProjectEndDate] = useState<Date | null>(null);
  const [reviewPeriod, setReviewPeriod] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearError = (key: string) => {
    setErrors((prev) => {
      if (!prev[key]) {
        return prev;
      }
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const isProjectNumberTaken = (value: string, currentProjectId: string) => {
    const needle = value.trim().toLowerCase();
    if (!needle) {
      return false;
    }
    return departments.some((dept) =>
      dept.projects.some(
        (project) =>
          project.projectNumber.toLowerCase() === needle && project.id !== currentProjectId
      )
    );
  };

  const parseLocalDate = (value: string): Date | null => {
    if (!value) {
      return null;
    }
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) {
      return null;
    }
    return new Date(year, month - 1, day);
  };

  const handleDepartmentChange = (id: string) => {
    setDepartmentId(id);
    setProjectId("");
    setProjectNameText("");
    setClient("");
    setClientEmail("");
    setProjectNumber("");
    setProjectStartDate(null);
    setProjectEndDate(null);
    clearError("department");
  };

  const handleProjectTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setProjectNameText(val);
    clearError("project");

    const activeDept = departments.find((d) => d.id === departmentId);
    const proj = activeDept?.projects.find(
      (p) => p.projectName.toLowerCase() === val.trim().toLowerCase()
    );

    if (proj) {
      setProjectId(proj.id);
      setClient(proj.clientName);
      setProjectNumber(proj.projectNumber);
      setProjectStartDate(new Date(proj.projectStartDate));
      setProjectEndDate(new Date(proj.projectEndDate));
      clearError("client");
      clearError("projectNumber");
      clearError("projectStartDate");
      clearError("projectEndDate");
    } else {
      setProjectId("");
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!departmentId) newErrors.department = "Department is required";
    if (!projectNameText.trim()) newErrors.project = "Project Name is required";
    if (!client.trim()) newErrors.client = "Client is required";
    if (!clientEmail.trim()) newErrors.clientEmail = "Client email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail.trim())) {
      newErrors.clientEmail = "Enter a valid client email address";
    }
    if (!projectNumber.trim()) newErrors.projectNumber = "Project Number is required";
    else if (isProjectNumberTaken(projectNumber, projectId)) {
      newErrors.projectNumber = "Project number already exists";
    }
    if (!reviewPeriod.trim()) newErrors.reviewPeriod = "Review period is required";
    if (!projectStartDate) newErrors.projectStartDate = "Project Start Date is required";
    if (!projectEndDate) newErrors.projectEndDate = "Project End Date is required";

    if (projectStartDate && projectEndDate && projectEndDate < projectStartDate) {
      newErrors.projectEndDate = "End Date must be on or after Start Date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendToClient = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    let resolvedProjectId = projectId;
    const activeDept = departments.find((d) => d.id === departmentId);
    if (!resolvedProjectId && activeDept) {
      const match = activeDept.projects.find(
        (p) => p.projectName.toLowerCase() === projectNameText.trim().toLowerCase()
      );
      if (match) {
        resolvedProjectId = match.id;
      }
    }

    try {
      await createCfrAction({
        projectId: resolvedProjectId || null,
        departmentId,
        projectName: projectNameText.trim(),
        reviewPeriod,
        status: "SENT",
        client,
        clientEmail: clientEmail.trim(),
        projectNumber,
        projectStartDate: projectStartDate?.toISOString() || "",
        projectEndDate: projectEndDate?.toISOString() || "",
      });

      router.push("/cfr/all");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send CFR";
      if (msg.toLowerCase().includes("already exists")) {
        setErrors({ projectNumber: "Project number already exists" });
      } else {
        setErrors({ form: msg });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateToInput = (date: Date | null) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fieldClass = (hasError: boolean) =>
    `h-11 w-full rounded-lg border bg-white px-3.5 text-sm text-slate-800 outline-none focus:border-[#1a3574] ${
      hasError ? "border-red-500" : "border-slate-200"
    }`;

  const labelClass = "text-xs font-semibold text-slate-600";

  return (
    <div className="flex min-h-full w-full flex-col">
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Create CFR</h1>
        <button
          type="button"
          onClick={sendToClient}
          disabled={isSubmitting}
          className="h-11 rounded-lg bg-[#1a3574] px-8 text-sm font-semibold text-white transition-colors hover:bg-[#152e66] focus:outline-none disabled:opacity-60"
        >
          {isSubmitting ? "Sending..." : "Send to Client"}
        </button>
      </div>

      {errors.form && (
        <div className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {errors.form}
        </div>
      )}

      <div className="mt-6 flex-1 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="grid grid-cols-1 content-start gap-x-10 gap-y-6 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Department / Vertical</label>
          <select
            value={departmentId}
            onChange={(e) => handleDepartmentChange(e.target.value)}
            className={`${fieldClass(Boolean(errors.department))} appearance-none`}
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
              backgroundSize: "16px",
            }}
          >
            <option value="">Select Department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          {errors.department && <span className="text-xs text-red-500">{errors.department}</span>}
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass}>Project Name</label>
          <input
            type="text"
            value={projectNameText}
            onChange={handleProjectTextChange}
            disabled={!departmentId}
            placeholder={departmentId ? "Enter project name..." : "Select department first..."}
            className={`${fieldClass(Boolean(errors.project))} disabled:opacity-50`}
          />
          {errors.project && <span className="text-xs text-red-500">{errors.project}</span>}
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass}>Client Name</label>
          <input
            type="text"
            value={client}
            onChange={(e) => setClient(e.target.value)}
            placeholder="Enter Client name..."
            className={fieldClass(Boolean(errors.client))}
          />
          {errors.client && <span className="text-xs text-red-500">{errors.client}</span>}
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass}>Client Email</label>
          <input
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder="client@company.com"
            className={fieldClass(Boolean(errors.clientEmail))}
          />
          {errors.clientEmail && <span className="text-xs text-red-500">{errors.clientEmail}</span>}
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass}>Project Number</label>
          <input
            type="text"
            value={projectNumber}
            onChange={(e) => setProjectNumber(e.target.value)}
            placeholder="Enter Project Number..."
            className={fieldClass(Boolean(errors.projectNumber))}
          />
          {errors.projectNumber && (
            <span className="text-xs text-red-500">{errors.projectNumber}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass}>Review Period</label>
          <input
            type="text"
            value={reviewPeriod}
            onChange={(e) => setReviewPeriod(e.target.value)}
            placeholder="e.g. Q1 2026"
            className={fieldClass(Boolean(errors.reviewPeriod))}
          />
          {errors.reviewPeriod && (
            <span className="text-xs text-red-500">{errors.reviewPeriod}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass}>Project Start Date</label>
          <input
            type="date"
            value={formatDateToInput(projectStartDate)}
            onChange={(e) => setProjectStartDate(e.target.value ? new Date(e.target.value) : null)}
            className={fieldClass(Boolean(errors.projectStartDate))}
          />
          {errors.projectStartDate && (
            <span className="text-xs text-red-500">{errors.projectStartDate}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass}>Project End Date</label>
          <input
            type="date"
            value={formatDateToInput(projectEndDate)}
            onChange={(e) => setProjectEndDate(e.target.value ? new Date(e.target.value) : null)}
            className={fieldClass(Boolean(errors.projectEndDate))}
          />
          {errors.projectEndDate && (
            <span className="text-xs text-red-500">{errors.projectEndDate}</span>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
