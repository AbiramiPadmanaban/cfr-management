"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PrismaCfrRepository } from "../../infrastructure/cfr.prisma-repo";
import type { CfrFilterInput, CfrCreateInput, CfrUpdateInput } from "../../domain/cfr.repository";

const cfrRepo = new PrismaCfrRepository();

const cfrInputSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  reviewPeriod: z.string().min(1, "Review period is required"),
  qualityRating: z.coerce.number().int().min(1).max(5),
  deliveryRating: z.coerce.number().int().min(1).max(5),
  communicationRating: z.coerce.number().int().min(1).max(5),
  technicalCompetence: z.coerce.number().int().min(1).max(5),
  overallSatisfaction: z.coerce.number().int().min(1).max(5),
  comments: z.string().nullable().optional(),
  status: z.enum(["DRAFT", "SENT", "SUBMITTED"] as const),
});

export async function getDepartmentsAction() {
  try {
    return await cfrRepo.getDepartments();
  } catch (error) {
    console.error("Failed to fetch departments:", error);
    throw new Error("Failed to fetch departments");
  }
}

export async function getCfrsAction(filters?: CfrFilterInput) {
  try {
    return await cfrRepo.getCfrs(filters);
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

export async function createCfrAction(data: CfrCreateInput) {
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

export async function updateCfrAction(id: number, data: CfrUpdateInput) {
  try {
    const validated = cfrInputSchema.partial().parse(data);
    const result = await cfrRepo.updateCfr(id, validated);
    revalidatePath("/cfr");
    return result;
  } catch (error) {
    console.error("Failed to update CFR:", error);
    if (error instanceof z.ZodError) {
      throw new Error(error.issues.map((issue) => issue.message).join(", "));
    }
    throw new Error("Failed to update CFR");
  }
}

export async function deleteCfrAction(id: number) {
  try {
    const result = await cfrRepo.deleteCfr(id);
    revalidatePath("/cfr");
    return result;
  } catch (error) {
    console.error("Failed to delete CFR:", error);
    throw new Error("Failed to delete CFR");
  }
}
