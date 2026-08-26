"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import type { CfrPublicFeedback } from "../../domain/cfr.repository";
import { submitPublicFeedbackAction } from "../server-actions/cfr-actions";
import { CFR_RATING_CRITERIA } from "../components/cfr-rating-criteria";
import { CfrRatingCriterion } from "../components/cfr-rating-criterion";
import {
  cardClass,
  fieldClass,
  primaryButtonClass,
  secondaryButtonClass,
  textareaClass,
} from "../components/cfr-ui";

export interface CfrPublicFeedbackViewProps {
  token: string;
  feedback: CfrPublicFeedback;
}

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const STEPS = [
  { step: 1, title: "Project", hint: "Confirm the request" },
  { step: 2, title: "Ratings", hint: "Score each criterion" },
  { step: 3, title: "Comments", hint: "Share final notes" },
];

function formatDate(value: Date | string): string {
  const date = new Date(value);
  return `${MONTH_SHORT[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function formatDateTime(value: Date | string): string {
  const date = new Date(value);
  const hours24 = date.getHours();
  const hours12 = hours24 % 12 || 12;
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const ampm = hours24 >= 12 ? "pm" : "am";
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}, ${hours12}:${minutes}:${seconds} ${ampm}`;
}

function todayDateInputValue(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function wordCount(value: string): number {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function CfrFeedbackThankYou({ feedback }: { feedback: CfrPublicFeedback }) {
  return (
    <div className="cfr-fade-up mx-auto flex w-full max-w-xl flex-1 flex-col justify-center space-y-6 px-4 py-10 text-center sm:px-8">
      <div className="cfr-check-pop mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-success">
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path
            className="cfr-check-draw"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          Thank You for Your Valuable Feedback!
        </h1>
        <p className="text-sm leading-6 text-muted">
          Your feedback for <span className="font-semibold text-ink">{feedback.projectName}</span> has
          been submitted successfully. Your ratings and comments will help our project team
          continuously improve the quality of our services.
        </p>
      </div>
      <p className="text-xs text-zinc-400">You may now close this window.</p>
    </div>
  );
}

function FeedbackStepper({ current }: { current: number }) {
  return (
    <ol className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {STEPS.map((item) => {
        const complete = current > item.step;
        const active = current === item.step;
        return (
          <li
            key={item.step}
            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
              active ? "border-accent/20 bg-accent-soft" : "border-line bg-white"
            }`}
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                complete
                  ? "bg-accent text-white"
                  : active
                    ? "bg-accent text-white"
                    : "bg-zinc-50 text-muted"
              }`}
            >
              {complete ? <Check className="h-4 w-4" aria-hidden="true" /> : item.step}
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">{item.title}</p>
              <p className="text-xs text-muted">{item.hint}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function CfrPublicFeedbackView({ token, feedback }: CfrPublicFeedbackViewProps) {
  const [step, setStep] = useState(1);
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
  const reviewedAt = todayDateInputValue();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedFeedback, setSubmittedFeedback] = useState<CfrPublicFeedback | null>(
    feedback.submitted ? feedback : null
  );

  const ratings = {
    quality: {
      value: qualityRating,
      setValue: setQualityRating,
      remarks: qualityRemarks,
      setRemarks: setQualityRemarks,
      errorKey: "qualityRating",
    },
    delivery: {
      value: deliveryRating,
      setValue: setDeliveryRating,
      remarks: deliveryRemarks,
      setRemarks: setDeliveryRemarks,
      errorKey: "deliveryRating",
    },
    communication: {
      value: communicationRating,
      setValue: setCommunicationRating,
      remarks: communicationRemarks,
      setRemarks: setCommunicationRemarks,
      errorKey: "communicationRating",
    },
    technical: {
      value: technicalCompetence,
      setValue: setTechnicalCompetence,
      remarks: technicalCompetenceRemarks,
      setRemarks: setTechnicalCompetenceRemarks,
      errorKey: "technicalCompetence",
    },
    overall: {
      value: overallSatisfaction,
      setValue: setOverallSatisfaction,
      remarks: overallSatisfactionRemarks,
      setRemarks: setOverallSatisfactionRemarks,
      errorKey: "overallSatisfaction",
    },
  };

  if (submittedFeedback) {
    return <CfrFeedbackThankYou feedback={submittedFeedback} />;
  }

  const validateRatings = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (qualityRating === 0) newErrors.qualityRating = "Quality is required";
    if (deliveryRating === 0) newErrors.deliveryRating = "Delivery is required";
    if (communicationRating === 0) newErrors.communicationRating = "Communication is required";
    if (technicalCompetence === 0) newErrors.technicalCompetence = "Technical Competence is required";
    if (overallSatisfaction === 0) newErrors.overallSatisfaction = "Overall Satisfaction is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateComments = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!reviewedBy.trim()) newErrors.reviewedBy = "Reviewed By is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goNext = () => {
    if (step === 1) {
      setErrors({});
      setStep(2);
      return;
    }
    if (step === 2 && validateRatings()) {
      setErrors({});
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    if (!validateRatings()) {
      setStep(2);
      return;
    }
    if (!validateComments()) {
      return;
    }

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
        reviewedAt: todayDateInputValue(),
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
    <div className="cfr-fade-up mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-8 sm:py-10">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Share Your Feedback</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Your feedback helps us understand your experience and continuously improve our services.
          {feedback.expiresAt && !feedback.expired && (
            <> This link expires on {formatDateTime(feedback.expiresAt)}.</>
          )}
        </p>
      </div>

      <FeedbackStepper current={step} />

      {errors.form && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
          {errors.form}
        </div>
      )}

      {step === 1 && (
        <div className={`${cardClass} space-y-4 p-5 text-sm sm:p-6`}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-[11px] font-medium tracking-[0.12em] text-zinc-400 uppercase">
                Project name
              </p>
              <p className="mt-1 font-semibold text-ink">{feedback.projectName}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium tracking-[0.12em] text-zinc-400 uppercase">
                Project number
              </p>
              <p className="mt-1 font-mono text-ink">{feedback.projectNumber}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium tracking-[0.12em] text-zinc-400 uppercase">
                Project dates
              </p>
              <p className="mt-1 text-ink">
                {formatDate(feedback.projectStartDate)} – {formatDate(feedback.projectEndDate)}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-[11px] font-medium tracking-[0.12em] text-zinc-400 uppercase">
                Client name
              </p>
              <p className="mt-1 text-ink">{feedback.client}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium tracking-[0.12em] text-zinc-400 uppercase">
                Email
              </p>
              <p className="mt-1 break-all text-ink">{feedback.clientEmail}</p>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-ink">Ratings</h3>
            <p className="mt-1 text-sm text-muted">Please rate each criterion and add remarks.</p>
          </div>
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
              />
            );
          })}
        </div>
      )}

      {step === 3 && (
        <div className={`space-y-5 ${cardClass} p-5 sm:p-6`}>
          <h3 className="text-base font-semibold text-ink">
            Overall Comments / Area of Improvement
          </h3>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={5}
            placeholder="Share overall comments or areas of improvement..."
            className={textareaClass}
          />
          <div className="flex justify-between text-xs text-zinc-400">
            <span>{wordCount(comments)} words</span>
            <span>{comments.length} characters</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">
                Reviewed By <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={reviewedBy}
                onChange={(e) => setReviewedBy(e.target.value)}
                placeholder="Name of the reviewer"
                className={fieldClass(Boolean(errors.reviewedBy))}
              />
              {errors.reviewedBy && (
                <span className="text-xs text-red-500">{errors.reviewedBy}</span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">
                Date
              </label>
              <input
                type="date"
                value={reviewedAt}
                readOnly
                tabIndex={-1}
                className="pointer-events-none h-11 w-full cursor-not-allowed rounded-xl border border-line bg-zinc-50 px-3.5 text-sm text-muted"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {step > 1 ? (
          <button type="button" onClick={() => setStep((value) => value - 1)} className={secondaryButtonClass}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </button>
        ) : (
          <span />
        )}
        {step < 3 ? (
          <button type="button" onClick={goNext} className={primaryButtonClass}>
            Continue
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={primaryButtonClass}
          >
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </button>
        )}
      </div>
    </div>
  );
}

export function CfrExpiredFeedbackView() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div className="cfr-fade-up max-w-lg space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Feedback link expired</h1>
        <p className="text-sm leading-6 text-muted">
          This customer feedback link expired after 24 hours. Please contact the administrator to send
          a new request.
        </p>
      </div>
    </div>
  );
}

export function CfrInvalidFeedbackView() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div className="cfr-fade-up max-w-lg space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Invalid feedback link</h1>
        <p className="text-sm leading-6 text-muted">
          This customer feedback link is invalid, expired, or is no longer available. Please contact
          the administrator if you still need to submit a review.
        </p>
      </div>
    </div>
  );
}
