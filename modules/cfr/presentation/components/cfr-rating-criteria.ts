export interface CfrRatingCriterion {
  key: "quality" | "delivery" | "communication" | "technical" | "overall";
  label: string;
  description: string;
  ratingField:
    | "qualityRating"
    | "deliveryRating"
    | "communicationRating"
    | "technicalCompetence"
    | "overallSatisfaction";
  remarksField:
    | "qualityRemarks"
    | "deliveryRemarks"
    | "communicationRemarks"
    | "technicalCompetenceRemarks"
    | "overallSatisfactionRemarks";
}

export const CFR_RATING_CRITERIA: CfrRatingCriterion[] = [
  {
    key: "quality",
    label: "Quality of Work",
    description:
      "Accuracy and completeness of the deliverables with adherence to the respective quality standards",
    ratingField: "qualityRating",
    remarksField: "qualityRemarks",
  },
  {
    key: "delivery",
    label: "Delivery Timeliness",
    description:
      "Meeting the delivery requirements as per the scope and timeline of the task executed",
    ratingField: "deliveryRating",
    remarksField: "deliveryRemarks",
  },
  {
    key: "communication",
    label: "Communication Quality",
    description:
      "Communication and responsiveness with the stakeholders to meet the expectations",
    ratingField: "communicationRating",
    remarksField: "communicationRemarks",
  },
  {
    key: "technical",
    label: "Technical Competence",
    description: "Technical skills and Knowledge of the team to execute the task",
    ratingField: "technicalCompetence",
    remarksField: "technicalCompetenceRemarks",
  },
  {
    key: "overall",
    label: "Overall Satisfaction",
    description: "Overall satisfaction with the project and Solidpro services as a whole",
    ratingField: "overallSatisfaction",
    remarksField: "overallSatisfactionRemarks",
  },
];

export function joinCfrRemarks(remarks: {
  qualityRemarks?: string | null;
  deliveryRemarks?: string | null;
  communicationRemarks?: string | null;
  technicalCompetenceRemarks?: string | null;
  overallSatisfactionRemarks?: string | null;
}): string | null {
  const parts = CFR_RATING_CRITERIA.map((criterion) => {
    const value = remarks[criterion.remarksField]?.trim();
    return value ? `${criterion.label}: ${value}` : null;
  }).filter((value): value is string => value != null);

  return parts.length > 0 ? parts.join("\n\n") : null;
}

export function toWholeRating(rating: number): number {
  const rounded = Math.round(rating);
  if (rounded >= 5) return 5;
  if (rounded <= 1) return 1;
  return rounded;
}

export function getCfrAverageRating(cfr: {
  qualityRating?: number | null;
  deliveryRating?: number | null;
  communicationRating?: number | null;
  technicalCompetence?: number | null;
  overallSatisfaction?: number | null;
}): number | null {
  const ratings = [
    cfr.qualityRating,
    cfr.deliveryRating,
    cfr.communicationRating,
    cfr.technicalCompetence,
    cfr.overallSatisfaction,
  ].filter((rating): rating is number => rating != null);

  if (ratings.length === 0) {
    return null;
  }

  return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
}
