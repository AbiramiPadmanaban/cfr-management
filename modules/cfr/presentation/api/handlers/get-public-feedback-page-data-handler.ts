import { cache } from "react";
import {
  getFeedbackExpiryDate,
  isFeedbackLinkExpired,
  type CfrPublicFeedback,
} from "../../../domain/cfr.repository";
import { PrismaCfrRepository } from "../../../infrastructure/cfr.prisma-repo";

function createCfrRepo() {
  return new PrismaCfrRepository();
}

function toPublicFeedback(cfr: {
  status: "DRAFT" | "SENT" | "SUBMITTED";
  client: string;
  clientEmail: string;
  projectNumber: string;
  feedbackSentAt?: Date | null;
  project: {
    projectName: string;
    projectStartDate: Date;
    projectEndDate: Date;
  };
}): CfrPublicFeedback {
  return {
    projectName: cfr.project.projectName,
    projectNumber: cfr.projectNumber,
    client: cfr.client,
    clientEmail: cfr.clientEmail,
    projectStartDate: cfr.project.projectStartDate,
    projectEndDate: cfr.project.projectEndDate,
    status: cfr.status,
    submitted: cfr.status === "SUBMITTED",
    expired: isFeedbackLinkExpired(cfr.feedbackSentAt, cfr.status),
    expiresAt: getFeedbackExpiryDate(cfr.feedbackSentAt),
  };
}

export type PublicFeedbackPageData =
  | { kind: "invalid" }
  | { kind: "expired"; feedback: CfrPublicFeedback }
  | { kind: "ready"; token: string; feedback: CfrPublicFeedback };

export const getPublicFeedbackPageDataHandler = cache(
  async (token: string): Promise<PublicFeedbackPageData> => {
    if (!token || token.length < 16) {
      return { kind: "invalid" };
    }

    const cfr = await createCfrRepo().getCfrByFeedbackToken(token);
    if (!cfr) {
      return { kind: "invalid" };
    }

    const feedback = toPublicFeedback(cfr);
    if (feedback.expired) {
      return { kind: "expired", feedback };
    }

    return { kind: "ready", token, feedback };
  }
);
