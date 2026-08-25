export interface CfrRatingCriterionProps {
  index: number;
  label: string;
  description: string;
  rating: number;
  remarks: string;
  onRatingChange: (value: number) => void;
  onRemarksChange: (value: string) => void;
  ratingError?: string;
  gradientId: string;
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
  gradientId,
  required = true,
}: CfrRatingCriterionProps) {
  return (
    <div className="space-y-3 border-b border-slate-100 pb-5 last:border-b-0 last:pb-0">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400">{index}.</span>
          <span className="text-sm font-bold text-slate-900">{label}</span>
          {required && <span className="text-xs font-bold text-red-500">*</span>}
          {rating > 0 && (
            <span className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-500">
              {rating} Star{rating !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <p className="pl-5 text-[11px] leading-4 text-slate-400">{description}</p>
      </div>

      <div className="flex gap-1.5 pl-5">
        {[1, 2, 3, 4, 5].map((num) => (
          <div key={num} className="relative flex h-7 w-7 items-center justify-center">
            <svg
              className="h-7 w-7 text-amber-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
              style={{
                fill:
                  rating >= num
                    ? "#fbbf24"
                    : rating === num - 0.5
                      ? `url(#${gradientId})`
                      : "transparent",
              }}
            >
              <defs>
                <linearGradient id={gradientId}>
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
            <button
              type="button"
              onClick={() => onRatingChange(num - 0.5)}
              className="absolute top-0 left-0 z-10 h-full w-1/2 cursor-pointer focus:outline-none"
              title={`Rate ${num - 0.5}`}
            />
            <button
              type="button"
              onClick={() => onRatingChange(num)}
              className="absolute top-0 right-0 z-10 h-full w-1/2 cursor-pointer focus:outline-none"
              title={`Rate ${num}`}
            />
          </div>
        ))}
      </div>
      {ratingError && <p className="pl-5 text-xs text-red-500">{ratingError}</p>}

      <div className="pl-5">
        <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
          Remarks
        </label>
        <textarea
          rows={2}
          value={remarks}
          onChange={(e) => onRemarksChange(e.target.value)}
          placeholder={`Add remarks for ${label.toLowerCase()}...`}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none"
        />
      </div>
    </div>
  );
}
