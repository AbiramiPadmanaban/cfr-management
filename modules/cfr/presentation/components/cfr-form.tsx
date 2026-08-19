"use client";

import { useState, useEffect } from "react";
import type { Department, Project, CfrStatus } from "@/app/generated/prisma";
import type { CfrWithProject, CfrCreateInput } from "../../domain/cfr.repository";


export interface CfrFormProps {
  departments: (Department & { projects: Project[] })[];
  cfr?: CfrWithProject;
  onSave: (data: CfrCreateInput) => Promise<void>;
  onCancel: () => void;
}

export function CfrForm({ departments, cfr, onSave, onCancel }: CfrFormProps) {
  // Form states
  const [departmentId, setDepartmentId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [reviewPeriod, setReviewPeriod] = useState("");
  const [qualityRating, setQualityRating] = useState(5);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [communicationRating, setCommunicationRating] = useState(5);
  const [technicalCompetence, setTechnicalCompetence] = useState(5);
  const [overallSatisfaction, setOverallSatisfaction] = useState(5);
  const [comments, setComments] = useState("");
  const [status, setStatus] = useState<CfrStatus>("DRAFT");

  // Read-only project details
  const [clientName, setClientName] = useState("");
  const [projectNumber, setProjectNumber] = useState("");

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize values if editing
  useEffect(() => {
    if (cfr) {
      setDepartmentId(cfr.project.departmentId);
      setProjectId(cfr.projectId);
      setReviewPeriod(cfr.reviewPeriod);
      setQualityRating(cfr.qualityRating);
      setDeliveryRating(cfr.deliveryRating);
      setCommunicationRating(cfr.communicationRating);
      setTechnicalCompetence(cfr.technicalCompetence);
      setOverallSatisfaction(cfr.overallSatisfaction);
      setComments(cfr.comments || "");
      setStatus(cfr.status);
      setClientName(cfr.project.clientName);
      setProjectNumber(cfr.project.projectNumber);
    }
  }, [cfr]);

  // Handle department change
  const handleDepartmentChange = (id: string) => {
    setDepartmentId(id);
    setProjectId("");
    setClientName("");
    setProjectNumber("");
  };

  // Handle project change
  const handleProjectChange = (id: string) => {
    setProjectId(id);
    if (!id) {
      setClientName("");
      setProjectNumber("");
      return;
    }

    const dept = departments.find((d) => d.id === departmentId);
    const proj = dept?.projects.find((p) => p.id === id);
    if (proj) {
      setClientName(proj.clientName);
      setProjectNumber(proj.projectNumber);
    }
  };

  // Find projects for the active department
  const activeDepartment = departments.find((d) => d.id === departmentId);
  const projects = activeDepartment ? activeDepartment.projects : [];

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!departmentId) newErrors.department = "Department is required";
    if (!projectId) newErrors.project = "Project is required";
    if (!reviewPeriod.trim()) newErrors.reviewPeriod = "Review period is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        projectId,
        reviewPeriod,
        qualityRating,
        deliveryRating,
        communicationRating,
        technicalCompetence,
        overallSatisfaction,
        comments: comments.trim() ? comments : null,
        status,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      setErrors({ form: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errors.form && (
        <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900">
          {errors.form}
        </div>
      )}

      {/* Grid: Department & Project */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
            Department
          </label>
          <select
            value={departmentId}
            onChange={(e) => handleDepartmentChange(e.target.value)}
            disabled={!!cfr}
            className={`w-full rounded-lg border bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-700 ${
              errors.department ? "border-red-500 focus:border-red-500" : "border-zinc-200"
            }`}
          >
            <option value="">Select Department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          {errors.department && (
            <span className="text-xs text-red-600 dark:text-red-400">{errors.department}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
            Project
          </label>
          <select
            value={projectId}
            onChange={(e) => handleProjectChange(e.target.value)}
            disabled={!departmentId || !!cfr}
            className={`w-full rounded-lg border bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-700 ${
              errors.project ? "border-red-500 focus:border-red-500" : "border-zinc-200"
            }`}
          >
            <option value="">Select Project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectName}
              </option>
            ))}
          </select>
          {errors.project && (
            <span className="text-xs text-red-600 dark:text-red-400">{errors.project}</span>
          )}
        </div>
      </div>

      {/* Grid: Read-Only Client Name & Project Number */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Client Name (Auto)
          </label>
          <input
            type="text"
            value={clientName}
            disabled
            className="w-full rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-500 outline-none dark:border-zinc-850 dark:bg-zinc-900/60 dark:text-zinc-400"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Project Number (Auto)
          </label>
          <input
            type="text"
            value={projectNumber}
            disabled
            className="w-full rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-500 outline-none dark:border-zinc-850 dark:bg-zinc-900/60 dark:text-zinc-400"
          />
        </div>
      </div>

      {/* Grid: Review Period & Status */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
            Review Period
          </label>
          <input
            type="text"
            value={reviewPeriod}
            onChange={(e) => setReviewPeriod(e.target.value)}
            placeholder="e.g. Q1 2026, Jan 2026"
            className={`w-full rounded-lg border bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-700 ${
              errors.reviewPeriod ? "border-red-500 focus:border-red-500" : "border-zinc-200"
            }`}
          />
          {errors.reviewPeriod && (
            <span className="text-xs text-red-600 dark:text-red-400">{errors.reviewPeriod}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as CfrStatus)}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-700"
          >
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="SUBMITTED">Submitted</option>
          </select>
        </div>
      </div>

      {/* Ratings Section */}
      <div className="rounded-xl border border-zinc-150 bg-zinc-50/50 p-4 space-y-4 dark:border-zinc-850 dark:bg-zinc-900/20">
        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
          Ratings (1 - 5 Scale)
        </h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {/* Quality */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-600 dark:text-zinc-400">Quality Rating</label>
            <select
              value={qualityRating}
              onChange={(e) => setQualityRating(Number(e.target.value))}
              className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} Star{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Delivery */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-600 dark:text-zinc-400">Delivery Rating</label>
            <select
              value={deliveryRating}
              onChange={(e) => setDeliveryRating(Number(e.target.value))}
              className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} Star{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Communication */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-600 dark:text-zinc-400">Communication</label>
            <select
              value={communicationRating}
              onChange={(e) => setCommunicationRating(Number(e.target.value))}
              className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} Star{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Technical Competence */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-600 dark:text-zinc-400">Technical Competence</label>
            <select
              value={technicalCompetence}
              onChange={(e) => setTechnicalCompetence(Number(e.target.value))}
              className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} Star{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Overall Satisfaction */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-600 dark:text-zinc-400 font-semibold text-blue-600 dark:text-blue-400">
              Overall Satisfaction
            </label>
            <select
              value={overallSatisfaction}
              onChange={(e) => setOverallSatisfaction(Number(e.target.value))}
              className="rounded-lg border border-blue-200 bg-blue-50/50 px-2.5 py-1.5 text-sm font-semibold text-zinc-900 focus:outline-none dark:border-blue-900 dark:bg-blue-950/20 dark:text-zinc-50"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} Star{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Comments */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
          Comments
        </label>
        <textarea
          rows={3}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Client comments and key takeaways..."
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-700"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 border-t border-zinc-150 pt-4 dark:border-zinc-800">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-lg border border-zinc-250 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-850"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 focus:outline-none dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isSubmitting ? "Saving..." : "Save CFR"}
        </button>
      </div>
    </form>
  );
}
