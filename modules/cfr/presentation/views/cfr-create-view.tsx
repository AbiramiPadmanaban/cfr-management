"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Department, Project, CfrStatus } from "@/app/generated/prisma";
import { createCfrAction } from "../server-actions/cfr-actions";

export interface CfrCreateViewProps {
  departments: (Department & { projects: Project[] })[];
}

export function CfrCreateView({ departments }: CfrCreateViewProps) {
  const router = useRouter();

  // Form Fields State
  const [departmentId, setDepartmentId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [projectNameText, setProjectNameText] = useState("");
  const [client, setClient] = useState("");
  const [projectNumber, setProjectNumber] = useState("");
  const [projectStartDate, setProjectStartDate] = useState<Date | null>(null);
  const [projectEndDate, setProjectEndDate] = useState<Date | null>(null);
  const [reviewPeriod, setReviewPeriod] = useState("");

  const [qualityRating, setQualityRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [technicalCompetence, setTechnicalCompetence] = useState(0);
  const [overallSatisfaction, setOverallSatisfaction] = useState(0);

  const [comments, setComments] = useState("");

  // UI States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute Word & Character Counter
  const wordCount = comments.trim() === "" ? 0 : comments.trim().split(/\s+/).length;
  const charCount = comments.length;

  const handleDepartmentChange = (id: string) => {
    setDepartmentId(id);
    setProjectId("");
    setProjectNameText("");
    setClient("");
    setProjectNumber("");
    setProjectStartDate(null);
    setProjectEndDate(null);
  };

  const handleProjectTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setProjectNameText(val);

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
    } else {
      setProjectId("");
    }
  };

  const activeDepartment = departments.find((d) => d.id === departmentId);
  const projects = activeDepartment ? activeDepartment.projects : [];

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!departmentId) newErrors.department = "Department is required";
    if (!projectNameText.trim()) newErrors.project = "Project Name is required";
    if (!client.trim()) newErrors.client = "Client override is required";
    if (!projectNumber.trim()) newErrors.projectNumber = "Project number override is required";
    if (!reviewPeriod.trim()) newErrors.reviewPeriod = "Review period is required";
    if (!projectStartDate) newErrors.projectStartDate = "Project Start Date is required";
    if (!projectEndDate) newErrors.projectEndDate = "Project End Date is required";

    if (projectStartDate && projectEndDate && projectEndDate < projectStartDate) {
      newErrors.projectEndDate = "End Date must be on or after Start Date";
    }

    if (qualityRating === 0) newErrors.qualityRating = "Quality of Work is required";
    if (deliveryRating === 0) newErrors.deliveryRating = "Delivery Timeliness is required";
    if (communicationRating === 0) newErrors.communicationRating = "Communication Quality is required";
    if (technicalCompetence === 0) newErrors.technicalCompetence = "Technical Competence is required";
    if (overallSatisfaction === 0) newErrors.overallSatisfaction = "Overall Satisfaction is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveCfr = async (targetStatus: CfrStatus) => {
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    // Resolve projectId based on project text
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
        qualityRating,
        deliveryRating,
        communicationRating,
        technicalCompetence,
        overallSatisfaction,
        comments: comments.trim() ? comments : null,
        status: targetStatus,
        client,
        projectNumber,
        projectStartDate: projectStartDate?.toISOString() || "",
        projectEndDate: projectEndDate?.toISOString() || "",
      });

      router.push("/cfr/all");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save CFR";
      setErrors({ form: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format Date to YYYY-MM-DD for input type="date" value
  const formatDateToInput = (date: Date | null) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Enterprise Gold Star Outline Selector
  const renderRatingStars = (
    label: string,
    currentVal: number,
    setter: (val: number) => void,
    error?: string
  ) => {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">{label}</span>
          <span className="text-red-500 font-bold text-xs">*</span>
          {currentVal > 0 && (
            <span className="text-[10px] font-bold text-amber-500 bg-amber-55 px-1.5 py-0.5 rounded-md border border-amber-200">
              {currentVal} Star{currentVal !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((num) => {
            return (
              <div key={num} className="relative h-7.5 w-7.5 flex items-center justify-center">
                {/* SVG star icon */}
                <svg
                  className={`h-7.5 w-7.5 text-amber-400 ${
                    currentVal >= num
                      ? "fill-amber-400"
                      : currentVal === num - 0.5
                      ? "fill-[url(#half-star-gradient)]"
                      : "fill-transparent"
                  }`}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <defs>
                    <linearGradient id="half-star-gradient">
                      <stop offset="50%" stopColor="#fbbf24" />
                      <stop offset="50%" stopColor="transparent" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.969 0 1.371 1.24.588 1.81l-3.97 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.888a1 1 0 00-1.176 0l-3.97 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.97-2.888c-.784-.57-.38-1.81.588-1.81h4.906a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>

                {/* Left half clickable area overlay */}
                <button
                  type="button"
                  onClick={() => setter(num - 0.5)}
                  className="absolute left-0 top-0 w-1/2 h-full cursor-pointer focus:outline-none z-10"
                  title={`Rate ${num - 0.5}`}
                />

                {/* Right half clickable area overlay */}
                <button
                  type="button"
                  onClick={() => setter(num)}
                  className="absolute right-0 top-0 w-1/2 h-full cursor-pointer focus:outline-none z-10"
                  title={`Rate ${num}`}
                />
              </div>
            );
          })}
        </div>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* Page Title */}
      <h1 className="text-2.5xl font-black text-slate-900 tracking-tight">Create CFR</h1>

      {errors.form && (
        <div className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700 border border-red-200">
          {errors.form}
        </div>
      )}

      {/* Card 1: CFR Context */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-base font-bold text-slate-900">CFR Context</h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Department */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Department / Vertical
            </label>
            <select
              value={departmentId}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              className={`h-10 w-full rounded-lg border bg-white px-3.5 text-sm text-slate-800 focus:border-slate-400 focus:outline-none appearance-none ${
                errors.department ? "border-red-500" : "border-slate-200"
              }`}
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
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

          {/* Project Name (Plain text field) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Project Name
            </label>
            <input
              type="text"
              value={projectNameText}
              onChange={handleProjectTextChange}
              disabled={!departmentId}
              placeholder={departmentId ? "Enter project name..." : "Select department first..."}
              className={`h-10 w-full rounded-lg border bg-white px-3.5 text-sm text-slate-800 focus:border-slate-400 focus:outline-none disabled:opacity-50 ${
                errors.project ? "border-red-500" : "border-slate-200"
              }`}
            />
            {errors.project && <span className="text-xs text-red-500">{errors.project}</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Client Name (Editable Override) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Client Name
            </label>
            <input
              type="text"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="Auto-filled from project..."
              className={`h-10 w-full rounded-lg border bg-white px-3.5 text-sm text-slate-800 focus:border-slate-400 focus:outline-none ${
                errors.client ? "border-red-500" : "border-slate-200"
              }`}
            />
            {errors.client && <span className="text-xs text-red-500">{errors.client}</span>}
          </div>

          {/* Project Number (Editable Override) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Project Number
            </label>
            <input
              type="text"
              value={projectNumber}
              onChange={(e) => setProjectNumber(e.target.value)}
              placeholder="Auto-filled from project..."
              className={`h-10 w-full rounded-lg border bg-white px-3.5 text-sm text-slate-800 focus:border-slate-400 focus:outline-none ${
                errors.projectNumber ? "border-red-500" : "border-slate-200"
              }`}
            />
            {errors.projectNumber && <span className="text-xs text-red-500">{errors.projectNumber}</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Project Start Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Project Start Date
            </label>
            <input
              type="date"
              value={formatDateToInput(projectStartDate)}
              onChange={(e) => setProjectStartDate(e.target.value ? new Date(e.target.value) : null)}
              className={`h-10 w-full rounded-lg border bg-white px-3.5 text-sm text-slate-800 focus:border-slate-400 focus:outline-none ${
                errors.projectStartDate ? "border-red-500" : "border-slate-200"
              }`}
            />
            {errors.projectStartDate && <span className="text-xs text-red-500">{errors.projectStartDate}</span>}
          </div>

          {/* Project End Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Project End Date
            </label>
            <input
              type="date"
              value={formatDateToInput(projectEndDate)}
              onChange={(e) => setProjectEndDate(e.target.value ? new Date(e.target.value) : null)}
              className={`h-10 w-full rounded-lg border bg-white px-3.5 text-sm text-slate-800 focus:border-slate-400 focus:outline-none ${
                errors.projectEndDate ? "border-red-500" : "border-slate-200"
              }`}
            />
            {errors.projectEndDate && <span className="text-xs text-red-500">{errors.projectEndDate}</span>}
          </div>

          {/* Review Period */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Review Period
            </label>
            <input
              type="text"
              value={reviewPeriod}
              onChange={(e) => setReviewPeriod(e.target.value)}
              placeholder="e.g. Q1 2026"
              className={`h-10 w-full rounded-lg border bg-white px-3.5 text-sm text-slate-800 focus:border-slate-400 focus:outline-none ${
                errors.reviewPeriod ? "border-red-500" : "border-slate-200"
              }`}
            />
            {errors.reviewPeriod && <span className="text-xs text-red-500">{errors.reviewPeriod}</span>}
          </div>
        </div>
      </div>

      {/* Card 2: Ratings */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.969 0 1.371 1.24.588 1.81l-3.97 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.888a1 1 0 00-1.176 0l-3.97 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.97-2.888c-.784-.57-.38-1.81.588-1.81h4.906a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <h3 className="text-base font-bold text-slate-900">Customer Feedback</h3>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
          {renderRatingStars("Quality of Work", qualityRating, setQualityRating, errors.qualityRating)}
          {renderRatingStars("Delivery Timeliness", deliveryRating, setDeliveryRating, errors.deliveryRating)}
          {renderRatingStars("Communication Quality", communicationRating, setCommunicationRating, errors.communicationRating)}
          {renderRatingStars("Technical Competence", technicalCompetence, setTechnicalCompetence, errors.technicalCompetence)}
          {renderRatingStars("Overall Satisfaction", overallSatisfaction, setOverallSatisfaction, errors.overallSatisfaction)}
        </div>
      </div>

      {/* Card 3: Comments */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="text-base font-bold text-slate-900 flex-1">Overall Comments / Area of Improvement</h3>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Words: <span className="text-slate-800 font-mono">{wordCount}</span> / 
            Chars: <span className="text-slate-800 font-mono">{charCount}</span>
          </div>
        </div>

        <div>
          <textarea
            rows={5}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Provide comments or summary feedback points..."
            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Submission Actions */}
      <div className="flex justify-end gap-3.5 border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={() => saveCfr("DRAFT")}
          disabled={isSubmitting}
          className="h-10 rounded-lg border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none"
        >
          Save as Draft
        </button>
        <button
          type="button"
          onClick={() => saveCfr("SUBMITTED")}
          disabled={isSubmitting}
          className="h-10 rounded-lg bg-[#1a3574] px-6 text-sm font-semibold text-white hover:bg-[#152e66] transition-colors focus:outline-none shadow-sm"
        >
          {isSubmitting ? "Saving..." : "Save as Submitted"}
        </button>
      </div>
    </div>
  );
}
