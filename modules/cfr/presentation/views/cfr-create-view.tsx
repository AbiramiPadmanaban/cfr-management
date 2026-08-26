"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, Lock, Mail, Send } from "lucide-react";
import type { Department, Project } from "@/app/generated/prisma";
import { createCfrAction } from "../server-actions/cfr-actions";
import { CFR_RATING_CRITERIA } from "../components/cfr-rating-criteria";
import {
  cardClass,
  fieldClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
  selectChevron,
} from "../components/cfr-ui";

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

  return (
    <div className="cfr-fade-up mx-auto flex w-full max-w-5xl flex-col pb-24">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-ink">
          Create Customer Feedback Review
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Capture the project context and send a secure 24-hour feedback link to the customer.
        </p>
      </div>

      {errors.form && (
        <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errors.form}
        </div>
      )}

      <section className={`${cardClass} mt-6 p-5 sm:p-6`}>
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-ink">Project Context</h3>
            <p className="mt-0.5 text-sm text-muted">
              These details appear on the customer feedback form and in the request email.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              Department / Vertical <span className="text-red-500">*</span>
            </label>
            <select
              value={departmentId}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              className={`${fieldClass(Boolean(errors.department))} appearance-none`}
              style={selectChevron}
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

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={projectNameText}
              onChange={handleProjectTextChange}
              disabled={!departmentId}
              placeholder={departmentId ? "Enter project name..." : "Select department first..."}
              className={fieldClass(Boolean(errors.project))}
            />
            {errors.project && <span className="text-xs text-red-500">{errors.project}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              Client Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={client}
              onChange={(e) => {
                setClient(e.target.value);
                clearError("client");
              }}
              placeholder="Enter client name..."
              className={fieldClass(Boolean(errors.client))}
            />
            {errors.client && <span className="text-xs text-red-500">{errors.client}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              Client Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => {
                setClientEmail(e.target.value);
                clearError("clientEmail");
              }}
              placeholder="client@company.com"
              className={fieldClass(Boolean(errors.clientEmail))}
            />
            {errors.clientEmail && (
              <span className="text-xs text-red-500">{errors.clientEmail}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              Project Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={projectNumber}
              onChange={(e) => {
                const value = e.target.value;
                setProjectNumber(value);
                if (isProjectNumberTaken(value, projectId)) {
                  setErrors((prev) => ({
                    ...prev,
                    projectNumber: "Project number already exists",
                  }));
                } else {
                  clearError("projectNumber");
                }
              }}
              placeholder="Enter project number..."
              className={fieldClass(Boolean(errors.projectNumber))}
            />
            {errors.projectNumber && (
              <span className="text-xs text-red-500">{errors.projectNumber}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              Review Period <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={reviewPeriod}
              onChange={(e) => {
                setReviewPeriod(e.target.value);
                clearError("reviewPeriod");
              }}
              placeholder="e.g. Q1 2026"
              className={fieldClass(Boolean(errors.reviewPeriod))}
            />
            {errors.reviewPeriod && (
              <span className="text-xs text-red-500">{errors.reviewPeriod}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              Project Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formatDateToInput(projectStartDate)}
              onChange={(e) => {
                setProjectStartDate(parseLocalDate(e.target.value));
                clearError("projectStartDate");
              }}
              className={fieldClass(Boolean(errors.projectStartDate))}
            />
            {errors.projectStartDate && (
              <span className="text-xs text-red-500">{errors.projectStartDate}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>
              Project End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formatDateToInput(projectEndDate)}
              onChange={(e) => {
                setProjectEndDate(parseLocalDate(e.target.value));
                clearError("projectEndDate");
              }}
              className={fieldClass(Boolean(errors.projectEndDate))}
            />
            {errors.projectEndDate && (
              <span className="text-xs text-red-500">{errors.projectEndDate}</span>
            )}
          </div>
        </div>
      </section>

      <section className={`${cardClass} mt-5 p-5 sm:p-6`}>
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-warning">
            <Lock className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-ink">Feedback Ratings</h3>
            <p className="mt-0.5 text-sm text-muted">
              The customer will complete these ratings through the secure feedback link.
            </p>
          </div>
        </div>
        <div className="divide-y divide-line rounded-xl border border-line">
          {CFR_RATING_CRITERIA.map((criterion, index) => (
            <div key={criterion.key} className="flex gap-3 px-4 py-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-50 text-[11px] font-semibold text-accent">
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-ink">{criterion.label}</p>
                <p className="mt-0.5 text-xs leading-5 text-muted">{criterion.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={`${cardClass} mt-5 p-5 sm:p-6`}>
        <div className="mb-3 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet">
            <Mail className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-ink">Comments</h3>
            <p className="mt-0.5 text-sm text-muted">
              Overall comments and areas of improvement are collected from the customer after they
              submit feedback.
            </p>
          </div>
        </div>
        <div className="rounded-xl bg-zinc-50 px-4 py-3 text-sm leading-6 text-muted">
            {clientEmail.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail.trim())
              ? `A secure 24-hour link will be emailed to ${clientEmail.trim()}.`
              : "Enter a client email above to send a secure 24-hour feedback link."}
        </div>
      </section>

      <div className="sticky bottom-0 z-10 mt-6 -mx-4 border-t border-line bg-background/95 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:bg-white sm:px-5">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/cfr" className={secondaryButtonClass}>
            Cancel
          </Link>
          <button
            type="button"
            onClick={sendToClient}
            disabled={isSubmitting}
            className={primaryButtonClass}
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            {isSubmitting ? "Sending..." : "Send Feedback Request"}
          </button>
        </div>
      </div>
    </div>
  );
}
