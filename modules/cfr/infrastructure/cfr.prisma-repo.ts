import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type {
  CfrRepository,
  CfrFilterInput,
  CfrWithProject,
  CfrCreateInput,
  CfrFeedbackSubmitInput,
  CfrKpis,
  CfrDashboardOverview,
  CfrNotification,
} from "../domain/cfr.repository";
import { isFeedbackLinkExpired } from "../domain/cfr.repository";
import type { Department, Project, Cfr, Prisma } from "@/app/generated/prisma";

function averageCfrRating(cfr: {
  qualityRating: number | null;
  deliveryRating: number | null;
  communicationRating: number | null;
  technicalCompetence: number | null;
  overallSatisfaction: number | null;
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

function lastSixMonthBuckets() {
  const now = new Date();
  const months: { key: string; label: string }[] = [];
  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    months.push({
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: date.toLocaleDateString("en-US", { month: "short" }),
    });
  }
  return months;
}

const DEPARTMENT_ORDER = [
  "Digital Transformation",
  "Sustainability",
  "Marketing",
  "MUS",
  "Vidhai",
  "Finance",
];

export class PrismaCfrRepository implements CfrRepository {
  async getDepartments(): Promise<(Department & { projects: Project[] })[]> {
    const departments = await prisma.department.findMany({
      include: {
        projects: {
          orderBy: {
            projectName: "asc",
          },
        },
      },
    });

    return departments.sort((a, b) => {
      const aIndex = DEPARTMENT_ORDER.indexOf(a.name);
      const bIndex = DEPARTMENT_ORDER.indexOf(b.name);
      const aRank = aIndex === -1 ? DEPARTMENT_ORDER.length : aIndex;
      const bRank = bIndex === -1 ? DEPARTMENT_ORDER.length : bIndex;
      if (aRank !== bRank) {
        return aRank - bRank;
      }
      return a.name.localeCompare(b.name);
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
        documentNo: data.documentNo?.trim() || null,
        revNo: data.revNo?.trim() || null,
        revDate: data.revDate ?? null,
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

    await prisma.notification.create({
      data: {
        cfrId: submitted.id,
        title: "Customer feedback received",
        message: `${submitted.client} submitted a review for ${submitted.project.projectName}.`,
      },
    });

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
    const overview = await this.getDashboardOverview();
    return overview.kpis;
  }

  async getDashboardOverview(): Promise<CfrDashboardOverview> {
    const [statusCounts, submittedRows, recentFeedback] = await Promise.all([
      prisma.cfr.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.cfr.findMany({
        where: { status: "SUBMITTED" },
        select: {
          qualityRating: true,
          deliveryRating: true,
          communicationRating: true,
          technicalCompetence: true,
          overallSatisfaction: true,
          feedbackSubmittedAt: true,
          createdAt: true,
          project: {
            select: {
              department: {
                select: { name: true },
              },
            },
          },
        },
      }),
      prisma.cfr.findMany({
        where: { status: "SUBMITTED" },
        include: {
          project: {
            include: { department: true },
          },
        },
        orderBy: { feedbackSubmittedAt: "desc" },
        take: 5,
      }),
    ]);

    let total = 0;
    let submitted = 0;
    let sent = 0;
    for (const group of statusCounts) {
      total += group._count.id;
      if (group.status === "SUBMITTED") {
        submitted = group._count.id;
      } else if (group.status === "SENT") {
        sent = group._count.id;
      }
    }

    const scores = submittedRows
      .map((row) => averageCfrRating(row))
      .filter((score): score is number => score != null);
    const averageRating =
      scores.length === 0 ? 0 : scores.reduce((sum, score) => sum + score, 0) / scores.length;

    const buckets = lastSixMonthBuckets();
    const trendCounts = new Map(buckets.map((bucket) => [bucket.key, 0]));
    for (const row of submittedRows) {
      const submittedAt = row.feedbackSubmittedAt ?? row.createdAt;
      const key = `${submittedAt.getFullYear()}-${String(submittedAt.getMonth() + 1).padStart(2, "0")}`;
      if (trendCounts.has(key)) {
        trendCounts.set(key, (trendCounts.get(key) ?? 0) + 1);
      }
    }

    const departmentTotals = new Map<string, { sum: number; count: number }>();
    for (const row of submittedRows) {
      const score = averageCfrRating(row);
      if (score == null) {
        continue;
      }
      const name = row.project.department.name;
      const current = departmentTotals.get(name) ?? { sum: 0, count: 0 };
      departmentTotals.set(name, { sum: current.sum + score, count: current.count + 1 });
    }

    const departmentRatings = [...departmentTotals.entries()]
      .map(([departmentName, stats]) => ({
        departmentName,
        averageRating: parseFloat((stats.sum / stats.count).toFixed(1)),
        count: stats.count,
      }))
      .sort((a, b) => b.averageRating - a.averageRating || a.departmentName.localeCompare(b.departmentName));

    return {
      kpis: {
        total,
        submitted,
        sent,
        averageRating: parseFloat(averageRating.toFixed(1)),
      },
      trend: buckets.map((bucket) => ({
        month: bucket.label,
        count: trendCounts.get(bucket.key) ?? 0,
      })),
      departmentRatings,
      recentFeedback,
    };
  }

  async getNotifications(limit = 20): Promise<CfrNotification[]> {
    await this.backfillSubmittedNotifications();
    return prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async getUnreadNotificationCount(): Promise<number> {
    await this.backfillSubmittedNotifications();
    return prisma.notification.count({
      where: { readAt: null },
    });
  }

  private async backfillSubmittedNotifications(): Promise<void> {
    const missing = await prisma.cfr.findMany({
      where: {
        status: "SUBMITTED",
        notifications: { none: {} },
      },
      include: { project: true },
    });

    if (missing.length === 0) {
      return;
    }

    await prisma.notification.createMany({
      data: missing.map((cfr) => ({
        cfrId: cfr.id,
        title: "Customer feedback received",
        message: `${cfr.client} submitted a review for ${cfr.project.projectName}.`,
        createdAt: cfr.feedbackSubmittedAt ?? cfr.updatedAt,
      })),
    });
  }

  async markNotificationRead(id: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { id, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async markAllNotificationsRead(): Promise<void> {
    await prisma.notification.updateMany({
      where: { readAt: null },
      data: { readAt: new Date() },
    });
  }
}
