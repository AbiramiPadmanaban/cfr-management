import type { CfrWithProject } from "../../domain/cfr.repository";

export interface CfrViewDialogProps {
  cfr: CfrWithProject;
  onClose: () => void;
}

export function CfrViewDialog({ cfr, onClose }: CfrViewDialogProps) {
  const createdDate = new Date(cfr.createdAt).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const updatedDate = new Date(cfr.updatedAt).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Calculate internal average of ratings (Quality, Delivery, Communication, Technical Competence, Overall Satisfaction)
  const ratingsList = [
    cfr.qualityRating,
    cfr.deliveryRating,
    cfr.communicationRating,
    cfr.technicalCompetence,
    cfr.overallSatisfaction,
  ];
  const ratingsSum = ratingsList.reduce((acc, curr) => acc + curr, 0);
  const calculatedAvg = ratingsSum / ratingsList.length;

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              className={`h-4 w-4 ${
                star <= rating
                  ? "text-amber-400 fill-amber-400"
                  : "text-zinc-200 fill-zinc-100 dark:text-zinc-800 dark:fill-zinc-900"
              }`}
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{rating}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Detail Fields Header Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
        <div>
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
            CFR ID
          </span>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            #{cfr.id}
          </span>
        </div>
        <div>
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
            Department
          </span>
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            {cfr.project.department.name}
          </span>
        </div>
        <div>
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
            Review Period
          </span>
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            {cfr.reviewPeriod}
          </span>
        </div>
        <div>
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
            Project
          </span>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {cfr.project.projectName}
          </span>
        </div>
        <div>
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
            Project Number
          </span>
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            {cfr.project.projectNumber}
          </span>
        </div>
        <div>
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
            Client Name
          </span>
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            {cfr.project.clientName}
          </span>
        </div>
        <div>
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
            Status
          </span>
          <span className="mt-1 inline-flex items-center rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            {cfr.status}
          </span>
        </div>
        <div>
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
            Created Date
          </span>
          <span className="text-xs text-zinc-650 dark:text-zinc-400">{createdDate}</span>
        </div>
        <div>
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
            Updated Date
          </span>
          <span className="text-xs text-zinc-650 dark:text-zinc-400">{updatedDate}</span>
        </div>
      </div>

      <hr className="border-zinc-200 dark:border-zinc-800" />

      {/* Ratings Section */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
          Ratings Scorecards
        </h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Individual Ratings */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Quality of Work</span>
              {renderStars(cfr.qualityRating)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Delivery Timeliness</span>
              {renderStars(cfr.deliveryRating)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Communication Quality</span>
              {renderStars(cfr.communicationRating)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Technical Competence</span>
              {renderStars(cfr.technicalCompetence)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Overall Satisfaction
              </span>
              {renderStars(cfr.overallSatisfaction)}
            </div>
          </div>

          {/* Average Dashboard widget */}
          <div className="flex flex-col items-center justify-center rounded-xl bg-zinc-50 p-6 text-center dark:bg-zinc-900/40 border border-zinc-150 dark:border-zinc-850">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Feedback Metric Average
            </span>
            <span className="mt-2 text-5xl font-black text-blue-600 dark:text-blue-400">
              {calculatedAvg.toFixed(1)}
            </span>
            <span className="mt-2 text-xs text-zinc-450 dark:text-zinc-500">
              Across all 5 parameters
            </span>
          </div>
        </div>
      </div>

      <hr className="border-zinc-200 dark:border-zinc-800" />

      {/* Comments */}
      <div>
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
          Client Comments
        </span>
        <div className="mt-1.5 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-800 italic dark:border-zinc-850 dark:bg-zinc-900/30 dark:text-zinc-300">
          {cfr.comments ? `"${cfr.comments}"` : "No comments provided."}
        </div>
      </div>

      {/* Close Button */}
      <div className="flex justify-end border-t border-zinc-150 pt-4 dark:border-zinc-800">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Close View
        </button>
      </div>
    </div>
  );
}
