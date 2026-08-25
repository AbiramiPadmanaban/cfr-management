import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type {
  CfrRepository,
  CfrWithProject,
  CfrFilterInput,
  CfrCreateInput,
  CfrFeedbackSubmitInput,
  CfrKpis,
} from "../domain/cfr.repository";
import { isFeedbackLinkExpired } from "../domain/cfr.repository";
import type { Department, Project, Cfr, Prisma } from "@/app/generated/prisma";

export class PrismaCfrRepository implements CfrRepository {
  async getDepartments(): Promise<(Department & { projects: Project[] })[]> {
    return prisma.department.findMany({
      include: {
        projects: {
          orderBy: {
            projectName: "asc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  async getCfrs(
    filters?: CfrFilterInput,
    page?: number,
    limit?: number
  ): Promise<{ cfrs: CfrWithProject[]; totalCount: number }> {
    const where: Prisma.CfrWhereInput = {};

    if (filters) {
      const { departmentId, projectId, status, search } = filters;

      if (projectId) {
        where.projectId = projectId;
      } else if (departmentId) {
        where.project = {
          departmentId: departmentId,
        };
      }

      if (status) {
        where.status = status;
      }

      if (search && search.trim() !== "") {
        const trimmedSearch = search.trim();
        const searchInt = parseInt(trimmedSearch);

        where.OR = [
          ...(!isNaN(searchInt) ? [{ id: searchInt }] : []),
          {
            project: {
              projectName: {
                contains: trimmedSearch,
                mode: "insensitive" as const,
              },
            },
          },
          {
            client: {
              contains: trimmedSearch,
              mode: "insensitive" as const,
            },
          },
          {
            projectNumber: {
              contains: trimmedSearch,
              mode: "insensitive" as const,
            },
          },
        ];
      }
    }

    const totalCount = await prisma.cfr.count({ where });

    const queryOptions: Prisma.CfrFindManyArgs = {
      where,
      include: {
        project: {
          include: {
            department: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    };

    if (page !== undefined && limit !== undefined) {
      queryOptions.skip = (page - 1) * limit;
      queryOptions.take = limit;
    }

    const cfrs = (await prisma.cfr.findMany(queryOptions)) as CfrWithProject[];

    return { cfrs, totalCount };
  }

  async getCfrById(id: number): Promise<CfrWithProject | null> {
    return prisma.cfr.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            department: true,
          },
        },
      },
    }) as Promise<CfrWithProject | null>;
  }

  async createCfr(data: CfrCreateInput): Promise<Cfr> {
    let resolvedProjectId = data.projectId;

    if (!resolvedProjectId) {
      const existingProject = await prisma.project.findFirst({
        where: {
          departmentId: data.departmentId,
          projectName: {
            equals: data.projectName,
            mode: "insensitive",
          },
        },
      });

      if (existingProject) {
        resolvedProjectId = existingProject.id;
      }
    }

    const duplicateNumber = await prisma.project.findFirst({
      where: {
        projectNumber: {
          equals: data.projectNumber.trim(),
          mode: "insensitive",
        },
        ...(resolvedProjectId ? { id: { not: resolvedProjectId } } : {}),
      },
    });

    if (duplicateNumber) {
      throw new Error("Project number already exists");
    }

    if (!resolvedProjectId) {
      try {
        const newProject = await prisma.project.create({
          data: {
            departmentId: data.departmentId,
            projectName: data.projectName,
            projectNumber: data.projectNumber.trim(),
            clientName: data.client,
            projectStartDate: data.projectStartDate,
            projectEndDate: data.projectEndDate,
          },
        });
        resolvedProjectId = newProject.id;
      } catch (error) {
        const code =
          typeof error === "object" && error !== null && "code" in error
            ? String((error as { code: unknown }).code)
            : "";
        if (code === "P2002") {
          throw new Error("Project number already exists");
        }
        throw error;
      }
    }

    const isClientCompleted = data.status === "SUBMITTED";

    return prisma.cfr.create({
      data: {
        projectId: resolvedProjectId,
        reviewPeriod: data.reviewPeriod,
        qualityRating: isClientCompleted ? data.qualityRating : null,
        deliveryRating: isClientCompleted ? data.deliveryRating : null,
        communicationRating: isClientCompleted ? data.communicationRating : null,
        technicalCompetence: isClientCompleted ? data.technicalCompetence : null,
        overallSatisfaction: isClientCompleted ? data.overallSatisfaction : null,
        qualityRemarks: isClientCompleted ? data.qualityRemarks : null,
        deliveryRemarks: isClientCompleted ? data.deliveryRemarks : null,
        communicationRemarks: isClientCompleted ? data.communicationRemarks : null,
        technicalCompetenceRemarks: isClientCompleted ? data.technicalCompetenceRemarks : null,
        overallSatisfactionRemarks: isClientCompleted ? data.overallSatisfactionRemarks : null,
        comments: isClientCompleted ? data.comments : null,
        status: data.status,
        client: data.client,
        projectNumber: data.projectNumber.trim(),
        clientEmail: data.clientEmail,
        feedbackToken: data.status === "SENT" ? randomBytes(32).toString("hex") : null,
        feedbackSentAt: data.status === "SENT" ? new Date() : null,
      },
    });
  }

  async getCfrByFeedbackToken(token: string): Promise<CfrWithProject | null> {
    return prisma.cfr.findUnique({
      where: { feedbackToken: token },
      include: {
        project: {
          include: {
            department: true,
          },
        },
      },
    }) as Promise<CfrWithProject | null>;
  }

  async submitFeedback(
    token: string,
    data: CfrFeedbackSubmitInput
  ): Promise<CfrWithProject> {
    const existing = await this.getCfrByFeedbackToken(token);

    if (!existing) {
      throw new Error("Invalid or expired feedback link");
    }

    if (existing.status === "SUBMITTED") {
      throw new Error("Feedback has already been submitted");
    }

    if (existing.status !== "SENT") {
      throw new Error("This feedback request is not open for submission");
    }

    if (isFeedbackLinkExpired(existing.feedbackSentAt, existing.status)) {
      throw new Error("This feedback link has expired. Please ask your project lead to send a new request.");
    }

    const updated = await prisma.cfr.updateMany({
      where: {
        feedbackToken: token,
        status: "SENT",
      },
      data: {
        qualityRating: data.qualityRating,
        deliveryRating: data.deliveryRating,
        communicationRating: data.communicationRating,
        technicalCompetence: data.technicalCompetence,
        overallSatisfaction: data.overallSatisfaction,
        qualityRemarks: data.qualityRemarks,
        deliveryRemarks: data.deliveryRemarks,
        communicationRemarks: data.communicationRemarks,
        technicalCompetenceRemarks: data.technicalCompetenceRemarks,
        overallSatisfactionRemarks: data.overallSatisfactionRemarks,
        comments: data.comments,
        reviewedBy: data.reviewedBy,
        reviewedAt: data.reviewedAt,
        status: "SUBMITTED",
        feedbackSubmittedAt: new Date(),
      },
    });

    if (updated.count === 0) {
      throw new Error("Feedback has already been submitted");
    }

    const submitted = await this.getCfrByFeedbackToken(token);
    if (!submitted) {
      throw new Error("Failed to load submitted feedback");
    }

    return submitted;
  }

  async setActionNeeded(id: number, actionNeeded: boolean): Promise<CfrWithProject> {
    const existing = await this.getCfrById(id);
    if (!existing) {
      throw new Error("CFR not found");
    }
    if (existing.status !== "SUBMITTED") {
      throw new Error("Action needed can be set only after the client review is received");
    }

    await prisma.cfr.update({
      where: { id },
      data: { actionNeeded },
    });

    const updated = await this.getCfrById(id);
    if (!updated) {
      throw new Error("Failed to update action needed");
    }
    return updated;
  }

  async deleteCfr(id: number): Promise<void> {
    await prisma.cfr.delete({ where: { id } });
  }

  async getKpis(): Promise<CfrKpis> {
    const aggregate = await prisma.cfr.aggregate({
      _avg: {
        overallSatisfaction: true,
      },
      _count: {
        id: true,
      },
    });

    const statusCounts = await prisma.cfr.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    });

    const total = aggregate._count.id || 0;
    const averageRating = aggregate._avg.overallSatisfaction || 0;

    let submitted = 0;
    let sent = 0;

    for (const group of statusCounts) {
      if (group.status === "SUBMITTED") {
        submitted = group._count.id;
      } else if (group.status === "SENT") {
        sent = group._count.id;
      }
    }

    return {
      total,
      submitted,
      sent,
      averageRating: parseFloat(averageRating.toFixed(2)),
    };
  }
}
