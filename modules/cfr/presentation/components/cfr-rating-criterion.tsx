"use client";

import { useState } from "react";

export interface CfrRatingCriterionProps {
  index: number;
  label: string;
  description: string;
  rating: number;
  remarks: string;
  onRatingChange: (value: number) => void;
  onRemarksChange: (value: string) => void;
  ratingError?: string;
  required?: boolean;
}

export function CfrRatingCriterion({
  index,
  label,
  description,
  rating,
  remarks,
  onRatingChange,
  onRemarksChange,
  ratingError,
  required = true,
}: CfrRatingCriterionProps) {
  const [hovered, setHovered] = useState(0);
  const displayed = hovered || rating;

  return (
    <div className="rounded-2xl border border-line bg-white p-4 sm:p-5">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-50 text-[11px] font-semibold text-accent">
            {index}
          </span>
          <span className="text-sm font-semibold text-ink">{label}</span>
          {required && <span className="text-xs font-semibold text-red-500">*</span>}
          {rating > 0 && (
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent">
              {rating} / 5
            </span>
          )}
        </div>
        <p className="pl-8 text-xs leading-5 text-muted">{description}</p>
      </div>

      <div
        className="mt-4 flex gap-1 pl-8"
        onMouseLeave={() => setHovered(0)}
      >
        {[1, 2, 3, 4, 5].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onRatingChange(num)}
            onMouseEnter={() => setHovered(num)}
            onFocus={() => setHovered(num)}
            onBlur={() => setHovered(0)}
            title={`Rate ${num}`}
            aria-label={`Rate ${label} ${num} stars`}
            className="flex h-9 w-9 items-center justify-center rounded-md transition-transform duration-150 hover:scale-110 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <svg
              className={`h-7 w-7 transition-colors duration-150 ${
                displayed >= num ? "text-accent" : "text-zinc-200"
              }`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.969 0 1.371 1.24.588 1.81l-3.97 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.888a1 1 0 00-1.176 0l-3.97 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.97-2.888c-.784-.57-.38-1.81.588-1.81h4.906a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
        ))}
      </div>
      {ratingError && <p className="mt-2 pl-8 text-xs text-red-500">{ratingError}</p>}

      <div className="mt-4 pl-0 sm:pl-8">
        <label className="mb-1.5 block text-[11px] font-medium tracking-[0.12em] text-muted uppercase">
          Remarks
        </label>
        <textarea
          rows={2}
          value={remarks}
          onChange={(e) => onRemarksChange(e.target.value)}
          placeholder={`Add remarks for ${label.toLowerCase()}...`}
          className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-all duration-150 placeholder:text-zinc-400 focus:border-accent focus:ring-2 focus:ring-accent/15"
        />
      </div>
    </div>
  );
}
