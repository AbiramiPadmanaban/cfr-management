"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PrismaCfrRepository } from "../../infrastructure/cfr.prisma-repo";
import { buildFeedbackUrl, sendClientFeedbackEmail } from "@/lib/email";
import {
  getFeedbackExpiryDate,
  isFeedbackLinkExpired,
  type CfrFilterInput,
  type CfrPublicFeedback,
} from "../../domain/cfr.repository";
import { joinCfrRemarks } from "../components/cfr-rating-criteria";

const cfrRepo = new PrismaCfrRepository();

const ratingSchema = z.number().int().min(1).max(5);
const optionalRatingSchema = ratingSchema.nullable().optional();

const cfrInputSchema = z
  .object({
    projectId: z.string().nullable().optional(),
    departmentId: z.string().min(1, "Department is required"),
    projectName: z.string().min(1, "Project Name is required"),
    reviewPeriod: z.string().min(1, "Review period is required"),
    qualityRating: optionalRatingSchema,
    deliveryRating: optionalRatingSchema,
    communicationRating: optionalRatingSchema,
    technicalCompetence: optionalRatingSchema,
    overallSatisfaction: optionalRatingSchema,
    comments: z.string().nullable().optional(),
    qualityRemarks: z.string().nullable().optional(),
    deliveryRemarks: z.string().nullable().optional(),
    communicationRemarks: z.string().nullable().optional(),
    technicalCompetenceRemarks: z.string().nullable().optional(),
    overallSatisfactionRemarks: z.string().nullable().optional(),
    status: z.enum(["DRAFT", "SENT", "SUBMITTED"] as const),
    client: z.string().min(1, "Client is required"),
    projectNumber: z.string().min(1, "Project Number is required"),
    clientEmail: z
      .string()
      .trim()
      .min(1, "Client email is required")
      .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), "A valid client email is required"),
    projectStartDate: z.string().or(z.date()).transform((val) => new Date(val)),
    projectEndDate: z.string().or(z.date()).transform((val) => new Date(val)),
    documentNo: z
      .string()
      .trim()
      .optional()
      .nullable()
      .transform((value) => value || null),
    revNo: z
      .string()
      .trim()
      .optional()
      .nullable()
      .transform((value) => value || null),
    revDate: z
      .union([z.string(), z.date(), z.null()])
      .optional()
      .transform((value) => {
        if (value == null || value === "") {
          return null;
        }
        const date = value instanceof Date ? value : new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
      }),
  })
  .refine((data) => data.projectEndDate >= data.projectStartDate, {
    message: "Project End Date must be on or after Project Start Date",
    path: ["projectEndDate"],
  });

const optionalRemarksSchema = z.string().nullable().optional();

const feedbackSubmitSchema = z.object({
  token: z.string().min(16, "Invalid feedback link"),
  qualityRating: ratingSchema,
  deliveryRating: ratingSchema,
  communicationRating: ratingSchema,
  technicalCompetence: ratingSchema,
  overallSatisfaction: ratingSchema,
  qualityRemarks: optionalRemarksSchema,
  deliveryRemarks: optionalRemarksSchema,
  communicationRemarks: optionalRemarksSchema,
  technicalCompetenceRemarks: optionalRemarksSchema,
  overallSatisfactionRemarks: optionalRemarksSchema,
  comments: optionalRemarksSchema,
  reviewedBy: z.string().trim().min(1, "Reviewed By is required"),
  reviewedAt: z
    .string()
    .min(1, "Review date is required")
    .or(z.date())
    .transform((val) => new Date(val)),
});

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

export async function getDepartmentsAction() {
  try {
    return await cfrRepo.getDepartments();
  } catch (error) {
    console.error("Failed to fetch departments:", error);
    throw new Error("Failed to fetch departments");
  }
}

export async function getCfrsAction(filters?: CfrFilterInput, page?: number, limit?: number) {
  try {
    return await cfrRepo.getCfrs(filters, page, limit);
  } catch (error) {
    console.error("Failed to fetch CFRs:", error);
    throw new Error("Failed to fetch CFRs");
  }
}

export async function getKpisAction() {
  try {
    return await cfrRepo.getKpis();
  } catch (error) {
    console.error("Failed to fetch KPIs:", error);
    throw new Error("Failed to fetch KPIs");
  }
}

export async function getDashboardOverviewAction() {
  try {
    return await cfrRepo.getDashboardOverview();
  } catch (error) {
    console.error("Failed to fetch dashboard overview:", error);
    throw new Error("Failed to fetch dashboard overview");
  }
}

export async function createCfrAction(data: Record<string, unknown>) {
  try {
    const validated = cfrInputSchema.parse(data);
    const result = await cfrRepo.createCfr({
      ...validated,
      comments:
        validated.status === "SENT"
          ? null
          : validated.comments ?? joinCfrRemarks(validated),
    });

    if (validated.status === "SENT") {
      const withProject = await cfrRepo.getCfrById(result.id);
      if (!withProject || !result.feedbackToken) {
        await cfrRepo.deleteCfr(result.id);
        throw new Error("Failed to prepare the client feedback request");
      }

      try {
        await sendClientFeedbackEmail({
          to: withProject.clientEmail,
          clientName: withProject.client,
          projectName: withProject.project.projectName,
          projectNumber: withProject.projectNumber,
          feedbackUrl: buildFeedbackUrl(result.feedbackToken),
        });
      } catch (emailError) {
        await cfrRepo.deleteCfr(result.id);
        console.error("Failed to send client feedback email:", emailError);
        throw emailError instanceof Error
          ? emailError
          : new Error("Failed to send the feedback email. The request was not saved.");
      }
    }

    revalidatePath("/cfr");
    revalidatePath("/cfr/all");
    return { id: result.id, status: result.status };
  } catch (error) {
    console.error("Failed to create CFR:", error);
    if (error instanceof z.ZodError) {
      throw new Error(error.issues.map((issue) => issue.message).join(", "));
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to create CFR");
  }
}

export async function getPublicFeedbackAction(
  token: string
): Promise<CfrPublicFeedback | null> {
  try {
    if (!token || token.length < 16) {
      return null;
    }

    const cfr = await cfrRepo.getCfrByFeedbackToken(token);
    if (!cfr) {
      return null;
    }

    if (cfr.status !== "SENT" && cfr.status !== "SUBMITTED") {
      return null;
    }

    return toPublicFeedback(cfr);
  } catch (error) {
    console.error("Failed to load public feedback:", error);
    return null;
  }
}

export async function submitPublicFeedbackAction(data: Record<string, unknown>) {
  try {
    const validated = feedbackSubmitSchema.parse(data);
    const result = await cfrRepo.submitFeedback(validated.token, {
      qualityRating: validated.qualityRating,
      deliveryRating: validated.deliveryRating,
      communicationRating: validated.communicationRating,
      technicalCompetence: validated.technicalCompetence,
      overallSatisfaction: validated.overallSatisfaction,
      qualityRemarks: validated.qualityRemarks ?? null,
      deliveryRemarks: validated.deliveryRemarks ?? null,
      communicationRemarks: validated.communicationRemarks ?? null,
      technicalCompetenceRemarks: validated.technicalCompetenceRemarks ?? null,
      overallSatisfactionRemarks: validated.overallSatisfactionRemarks ?? null,
      comments: validated.comments?.trim() || null,
      reviewedBy: validated.reviewedBy,
      reviewedAt: validated.reviewedAt,
    });

    revalidatePath("/cfr");
    revalidatePath("/cfr/all");
    revalidatePath(`/feedback/${validated.token}`);
    return toPublicFeedback(result);
  } catch (error) {
    console.error("Failed to submit feedback:", error);
    if (error instanceof z.ZodError) {
      throw new Error(error.issues.map((issue) => issue.message).join(", "));
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to submit feedback");
  }
}

export async function setActionNeededAction(id: number, actionNeeded: boolean) {
  try {
    const result = await cfrRepo.setActionNeeded(id, actionNeeded);
    revalidatePath("/cfr");
    revalidatePath("/cfr/all");
    return { id: result.id, actionNeeded: result.actionNeeded };
  } catch (error) {
    console.error("Failed to set action needed:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to set action needed");
  }
}

export async function getNotificationsAction() {
  try {
    const [notifications, unreadCount] = await Promise.all([
      cfrRepo.getNotifications(20),
      cfrRepo.getUnreadNotificationCount(),
    ]);
    return { notifications, unreadCount };
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    throw new Error("Failed to fetch notifications");
  }
}

export async function markNotificationReadAction(id: string) {
  try {
    await cfrRepo.markNotificationRead(id);
    return { ok: true };
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    throw new Error("Failed to mark notification as read");
  }
}

export async function markAllNotificationsReadAction() {
  try {
    await cfrRepo.markAllNotificationsRead();
    return { ok: true };
  } catch (error) {
    console.error("Failed to mark notifications as read:", error);
    throw new Error("Failed to mark notifications as read");
  }
}
