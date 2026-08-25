"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PrismaCfrRepository } from "../../infrastructure/cfr.prisma-repo";
import type { CfrFilterInput, CfrCreateInput } from "../../domain/cfr.repository";

const cfrRepo = new PrismaCfrRepository();

const cfrInputSchema = z.object({
  projectId: z.string().nullable().optional(),
  departmentId: z.string().min(1, "Department is required"),
  projectName: z.string().min(1, "Project Name is required"),
  reviewPeriod: z.string().min(1, "Review period is required"),
  qualityRating: z.coerce.number().min(1).max(5),
  deliveryRating: z.coerce.number().min(1).max(5),
  communicationRating: z.coerce.number().min(1).max(5),
  technicalCompetence: z.coerce.number().min(1).max(5),
  overallSatisfaction: z.coerce.number().min(1).max(5),
  comments: z.string().nullable().optional(),
  status: z.enum(["DRAFT", "SENT", "SUBMITTED"] as const),
  client: z.string().min(1, "Client is required"),
  projectNumber: z.string().min(1, "Project Number is required"),
  projectStartDate: z.string().or(z.date()).transform((val) => new Date(val)),
  projectEndDate: z.string().or(z.date()).transform((val) => new Date(val)),
}).refine(
  (data) => data.projectEndDate >= data.projectStartDate,
  {
    message: "Project End Date must be on or after Project Start Date",
    path: ["projectEndDate"],
  }
);

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

export async function createCfrAction(data: Record<string, unknown>) {
  try {
    const validated = cfrInputSchema.parse(data);
    const result = await cfrRepo.createCfr(validated);
    revalidatePath("/cfr");
    return result;
  } catch (error) {
    console.error("Failed to create CFR:", error);
    if (error instanceof z.ZodError) {
      throw new Error(error.issues.map((issue) => issue.message).join(", "));
    }
    throw new Error("Failed to create CFR");
  }
}
