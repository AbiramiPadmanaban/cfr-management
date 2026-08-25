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
