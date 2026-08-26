"use server";

import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { z } from "zod";
import { PrismaCfrRepository } from "../../infrastructure/cfr.prisma-repo";
import { buildFeedbackUrl, sendClientFeedbackEmail } from "@/lib/email";
import { requireAuth } from "@/server/auth/require-auth";
import { sendFeedbackSubmissionReportEmail } from "../../application/send-feedback-submission-report";
import { buildCfrFeedbackPdf } from "../lib/cfr-feedback-pdf";
import {
  getFeedbackExpiryDate,
  isFeedbackLinkExpired,
  type CfrFilterInput,
  type CfrPublicFeedback,
} from "../../domain/cfr.repository";
import { joinCfrRemarks } from "../components/cfr-rating-criteria";

const cfrRepo = new PrismaCfrRepository();

function rethrowNavigationErrors(error: unknown): void {
  if (isRedirectError(error)) {
    throw error;
  }
}

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
    await requireAuth();
    return await cfrRepo.getDepartments();
  } catch (error) {
    rethrowNavigationErrors(error);
    console.error("Failed to fetch departments:", error);
    throw new Error("Failed to fetch departments");
  }
}

export async function getCfrsAction(filters?: CfrFilterInput, page?: number, limit?: number) {
  try {
    await requireAuth();
    return await cfrRepo.getCfrs(filters, page, limit);
  } catch (error) {
    rethrowNavigationErrors(error);
    console.error("Failed to fetch CFRs:", error);
    throw new Error("Failed to fetch CFRs");
  }
}

export async function getCfrByIdAction(id: number) {
  try {
    await requireAuth();
    if (!Number.isInteger(id) || id <= 0) {
      return null;
    }
    return await cfrRepo.getCfrById(id);
  } catch (error) {
    rethrowNavigationErrors(error);
    console.error("Failed to fetch CFR:", error);
    throw new Error("Failed to fetch CFR");
  }
}

export async function getKpisAction() {
  try {
    await requireAuth();
    return await cfrRepo.getKpis();
  } catch (error) {
    rethrowNavigationErrors(error);
    console.error("Failed to fetch KPIs:", error);
    throw new Error("Failed to fetch KPIs");
  }
}

export async function getDashboardOverviewAction() {
  try {
    await requireAuth();
    return await cfrRepo.getDashboardOverview();
  } catch (error) {
    rethrowNavigationErrors(error);
    console.error("Failed to fetch dashboard overview:", error);
    throw new Error("Failed to fetch dashboard overview");
  }
}

export async function createCfrAction(data: Record<string, unknown>) {
  try {
    const user = await requireAuth();
    const validated = cfrInputSchema.parse(data);
    const result = await cfrRepo.createCfr({
      ...validated,
      sentByEmail: validated.status === "SENT" ? user.email : null,
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
    revalidatePath("/cfr/create");
    revalidatePath("/cfr/all");
    return { id: result.id, status: result.status };
  } catch (error) {
    rethrowNavigationErrors(error);
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

    // Safe retry: if feedback was saved but the report email never sent, try once more.
    if (cfr.status === "SUBMITTED" && !cfr.submissionEmailSentAt) {
      void sendFeedbackSubmissionReportEmail(cfrRepo, cfr, buildCfrFeedbackPdf).then(
        (emailResult) => {
          if (emailResult.error) {
            console.error(
              `[CFR #${cfr.id}] Retry of submission report email failed:`,
              emailResult.error
            );
          }
        }
      );
    }

    return toPublicFeedback(cfr);
  } catch (error) {
    rethrowNavigationErrors(error);
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

    // Feedback is already saved. Email failures must not roll back submission.
    const emailResult = await sendFeedbackSubmissionReportEmail(
      cfrRepo,
      result,
      buildCfrFeedbackPdf
    );
    if (emailResult.error) {
      console.error(
        `[CFR #${result.id}] Feedback saved but submission report email was not sent:`,
        emailResult.error
      );
    }

    revalidatePath("/cfr");
    revalidatePath("/cfr/all");
    revalidatePath(`/feedback/${validated.token}`);
    return toPublicFeedback(result);
  } catch (error) {
    rethrowNavigationErrors(error);
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
    await requireAuth();
    const result = await cfrRepo.setActionNeeded(id, actionNeeded);
    revalidatePath("/cfr");
    revalidatePath("/cfr/all");
    return { id: result.id, actionNeeded: result.actionNeeded };
  } catch (error) {
    rethrowNavigationErrors(error);
    console.error("Failed to set action needed:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to set action needed");
  }
}

export async function getNotificationsAction() {
  try {
    await requireAuth();
    const [notifications, unreadCount] = await Promise.all([
      cfrRepo.getNotifications(20),
      cfrRepo.getUnreadNotificationCount(),
    ]);
    return { notifications, unreadCount };
  } catch (error) {
    rethrowNavigationErrors(error);
    console.error("Failed to fetch notifications:", error);
    throw new Error("Failed to fetch notifications");
  }
}

export async function markNotificationReadAction(id: string) {
  try {
    await requireAuth();
    await cfrRepo.markNotificationRead(id);
    return { ok: true };
  } catch (error) {
    rethrowNavigationErrors(error);
    console.error("Failed to mark notification as read:", error);
    throw new Error("Failed to mark notification as read");
  }
}

export async function markAllNotificationsReadAction() {
  try {
    await requireAuth();
    await cfrRepo.markAllNotificationsRead();
    return { ok: true };
  } catch (error) {
    rethrowNavigationErrors(error);
    console.error("Failed to mark notifications as read:", error);
    throw new Error("Failed to mark notifications as read");
  }
}
