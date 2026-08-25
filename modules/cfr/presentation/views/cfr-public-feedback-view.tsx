"use client";

import { useState } from "react";
import type { CfrPublicFeedback } from "../../domain/cfr.repository";
import { submitPublicFeedbackAction } from "../server-actions/cfr-actions";
import { CFR_RATING_CRITERIA } from "../components/cfr-rating-criteria";
import { CfrRatingCriterion } from "../components/cfr-rating-criterion";

export interface CfrPublicFeedbackViewProps {
  token: string;
  feedback: CfrPublicFeedback;
}

function formatDate(value: Date | string): string {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function CfrFeedbackThankYou({ feedback }: { feedback: CfrPublicFeedback }) {
  return (
    <div className="mx-auto max-w-xl space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">
          Thank you for your feedback
        </h1>
        <p className="text-sm leading-6 text-slate-500">
          Your customer feedback review for{" "}
          <span className="font-semibold text-slate-800">{feedback.projectName}</span> has been
          submitted successfully. The project team will use your ratings and comments to improve
          delivery quality.
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Project</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">{feedback.projectName}</p>
        <p className="mt-1 text-xs font-mono text-slate-400">{feedback.projectNumber}</p>
        <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Review Period
        </p>
        <p className="mt-1 text-sm font-medium text-slate-700">{feedback.reviewPeriod}</p>
      </div>
      <p className="text-xs text-slate-400">You may now close this window.</p>
    </div>
  );
}

export function CfrPublicFeedbackView({ token, feedback }: CfrPublicFeedbackViewProps) {
  const [qualityRating, setQualityRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [technicalCompetence, setTechnicalCompetence] = useState(0);
  const [overallSatisfaction, setOverallSatisfaction] = useState(0);
  const [qualityRemarks, setQualityRemarks] = useState("");
  const [deliveryRemarks, setDeliveryRemarks] = useState("");
  const [communicationRemarks, setCommunicationRemarks] = useState("");
  const [technicalCompetenceRemarks, setTechnicalCompetenceRemarks] = useState("");
  const [overallSatisfactionRemarks, setOverallSatisfactionRemarks] = useState("");
  const [comments, setComments] = useState("");
  const [reviewedBy, setReviewedBy] = useState("");
  const [reviewedAt, setReviewedAt] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedFeedback, setSubmittedFeedback] = useState<CfrPublicFeedback | null>(
    feedback.submitted ? feedback : null
  );

  const ratings = {
    quality: { value: qualityRating, setValue: setQualityRating, remarks: qualityRemarks, setRemarks: setQualityRemarks, errorKey: "qualityRating" },
    delivery: { value: deliveryRating, setValue: setDeliveryRating, remarks: deliveryRemarks, setRemarks: setDeliveryRemarks, errorKey: "deliveryRating" },
    communication: { value: communicationRating, setValue: setCommunicationRating, remarks: communicationRemarks, setRemarks: setCommunicationRemarks, errorKey: "communicationRating" },
    technical: { value: technicalCompetence, setValue: setTechnicalCompetence, remarks: technicalCompetenceRemarks, setRemarks: setTechnicalCompetenceRemarks, errorKey: "technicalCompetence" },
    overall: { value: overallSatisfaction, setValue: setOverallSatisfaction, remarks: overallSatisfactionRemarks, setRemarks: setOverallSatisfactionRemarks, errorKey: "overallSatisfaction" },
  };

  if (submittedFeedback) {
    return <CfrFeedbackThankYou feedback={submittedFeedback} />;
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (qualityRating === 0) newErrors.qualityRating = "Quality is required";
    if (deliveryRating === 0) newErrors.deliveryRating = "Delivery is required";
    if (communicationRating === 0) newErrors.communicationRating = "Communication is required";
    if (technicalCompetence === 0) newErrors.technicalCompetence = "Technical Competence is required";
    if (overallSatisfaction === 0) newErrors.overallSatisfaction = "Overall Satisfaction is required";
    if (!reviewedBy.trim()) newErrors.reviewedBy = "Reviewed By is required";
    if (!reviewedAt) newErrors.reviewedAt = "Date is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await submitPublicFeedbackAction({
        token,
        qualityRating,
        deliveryRating,
        communicationRating,
        technicalCompetence,
        overallSatisfaction,
        qualityRemarks: qualityRemarks.trim() || null,
        deliveryRemarks: deliveryRemarks.trim() || null,
        communicationRemarks: communicationRemarks.trim() || null,
        technicalCompetenceRemarks: technicalCompetenceRemarks.trim() || null,
        overallSatisfactionRemarks: overallSatisfactionRemarks.trim() || null,
        comments: comments.trim() || null,
        reviewedBy: reviewedBy.trim(),
        reviewedAt,
      });
      setSubmittedFeedback(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit feedback";
      setErrors({ form: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Provide Feedback</h1>
        <p className="mt-1 text-sm text-slate-500">
          Please rate each criterion and add remarks. No login is required.
          {feedback.expiresAt && !feedback.expired && (
            <> This link expires on {new Date(feedback.expiresAt).toLocaleString()}.</>
          )}
        </p>
      </div>

      {errors.form && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {errors.form}
        </div>
      )}

      <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="border-b border-slate-100 pb-3 text-base font-bold text-slate-900">
          Project Details
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Project</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{feedback.projectName}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Project Number
            </p>
            <p className="mt-1 font-mono text-sm text-slate-700">{feedback.projectNumber}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Department
            </p>
            <p className="mt-1 text-sm text-slate-700">{feedback.departmentName}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Client</p>
            <p className="mt-1 text-sm text-slate-700">{feedback.client}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Review Period
            </p>
            <p className="mt-1 text-sm text-slate-700">{feedback.reviewPeriod}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Project Dates
            </p>
            <p className="mt-1 text-sm text-slate-700">
              {formatDate(feedback.projectStartDate)} – {formatDate(feedback.projectEndDate)}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="border-b border-slate-100 pb-3 text-base font-bold text-slate-900">
          Ratings
        </h3>
        <div className="space-y-5">
          {CFR_RATING_CRITERIA.map((criterion, index) => {
            const field = ratings[criterion.key];
            return (
              <CfrRatingCriterion
                key={criterion.key}
                index={index + 1}
                label={criterion.label}
                description={criterion.description}
                rating={field.value}
                remarks={field.remarks}
                onRatingChange={field.setValue}
                onRemarksChange={field.setRemarks}
                ratingError={errors[field.errorKey]}
                gradientId={`half-star-public-${criterion.key}`}
              />
            );
          })}
        </div>
      </div>

      <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="border-b border-slate-100 pb-3 text-base font-bold text-slate-900">
          Overall Comments / Area of Improvement
        </h3>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={4}
          placeholder="Share overall comments or areas of improvement..."
          className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none focus:border-[#1a3574]"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Reviewed By <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={reviewedBy}
              onChange={(e) => setReviewedBy(e.target.value)}
              placeholder="Name of the reviewer"
              className={`h-10 w-full rounded-lg border bg-white px-3.5 text-sm text-slate-800 outline-none focus:border-[#1a3574] ${
                errors.reviewedBy ? "border-red-500" : "border-slate-200"
              }`}
            />
            {errors.reviewedBy && (
              <span className="text-xs text-red-500">{errors.reviewedBy}</span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={reviewedAt}
              onChange={(e) => setReviewedAt(e.target.value)}
              className={`h-10 w-full rounded-lg border bg-white px-3.5 text-sm text-slate-800 outline-none focus:border-[#1a3574] ${
                errors.reviewedAt ? "border-red-500" : "border-slate-200"
              }`}
            />
            {errors.reviewedAt && (
              <span className="text-xs text-red-500">{errors.reviewedAt}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="h-10 rounded-lg bg-[#1a3574] px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#152e66] focus:outline-none disabled:opacity-60"
        >
          {isSubmitting ? "Submitting..." : "Submit Feedback"}
        </button>
      </div>
    </div>
  );
}

export function CfrExpiredFeedbackView() {
  return (
    <div className="mx-auto max-w-lg space-y-3 text-center">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">Feedback link expired</h1>
      <p className="text-sm leading-6 text-slate-500">
        This customer feedback link expired after 24 hours. Please contact your project lead to send
        a new request.
      </p>
    </div>
  );
}

export function CfrInvalidFeedbackView() {
  return (
    <div className="mx-auto max-w-lg space-y-3 text-center">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">Invalid feedback link</h1>
      <p className="text-sm leading-6 text-slate-500">
        This customer feedback link is invalid, expired, or is no longer available. Please contact
        your project lead if you still need to submit a review.
      </p>
    </div>
  );
}
