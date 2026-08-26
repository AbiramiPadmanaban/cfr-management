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
  CfrSatisfactionPoint,
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

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function roundRating(value: number): number {
  return parseFloat(value.toFixed(1));
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
      const { departmentId, projectId, status, search, dateFrom, dateTo } = filters;

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

      if (dateFrom || dateTo) {
        const createdAtFilter: Prisma.DateTimeFilter = {};
        if (dateFrom) {
          const from = new Date(`${dateFrom}T00:00:00.000`);
          if (!Number.isNaN(from.getTime())) {
            createdAtFilter.gte = from;
          }
        }
        if (dateTo) {
          const to = new Date(`${dateTo}T23:59:59.999`);
          if (!Number.isNaN(to.getTime())) {
            createdAtFilter.lte = to;
          }
        }
        if (createdAtFilter.gte || createdAtFilter.lte) {
          where.createdAt = createdAtFilter;
        }
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
        sentByEmail:
          data.status === "SENT" && data.sentByEmail?.trim()
            ? data.sentByEmail.trim().toLowerCase()
            : null,
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

  async claimSubmissionEmailSend(id: number): Promise<boolean> {
    const result = await prisma.cfr.updateMany({
      where: {
        id,
        status: "SUBMITTED",
        submissionEmailSentAt: null,
      },
      data: {
        submissionEmailSentAt: new Date(),
      },
    });
    return result.count === 1;
  }

  async releaseSubmissionEmailSend(id: number): Promise<void> {
    await prisma.cfr.updateMany({
      where: {
        id,
        status: "SUBMITTED",
      },
      data: {
        submissionEmailSentAt: null,
      },
    });
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
                select: { id: true, name: true },
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

    const monthlyTotals = new Map<string, { sum: number; count: number; year: number; month: number }>();
    const yearlyTotals = new Map<number, { sum: number; count: number }>();
    const yearSet = new Set<number>();

    for (const row of submittedRows) {
      const score = averageCfrRating(row);
      if (score == null) {
        continue;
      }
      const submittedAt = row.feedbackSubmittedAt ?? row.createdAt;
      const year = submittedAt.getFullYear();
      const month = submittedAt.getMonth() + 1;
      const monthKey = `${year}-${String(month).padStart(2, "0")}`;

      yearSet.add(year);

      const monthCurrent = monthlyTotals.get(monthKey) ?? { sum: 0, count: 0, year, month };
      monthlyTotals.set(monthKey, {
        sum: monthCurrent.sum + score,
        count: monthCurrent.count + 1,
        year,
        month,
      });

      const yearCurrent = yearlyTotals.get(year) ?? { sum: 0, count: 0 };
      yearlyTotals.set(year, {
        sum: yearCurrent.sum + score,
        count: yearCurrent.count + 1,
      });
    }

    const nowYear = new Date().getFullYear();
    yearSet.add(nowYear);
    const availableYears = [...yearSet].sort((a, b) => a - b);

    const monthly = availableYears.flatMap((year) =>
      MONTH_LABELS.map((label, index) => {
        const month = index + 1;
        const key = `${year}-${String(month).padStart(2, "0")}`;
        const stats = monthlyTotals.get(key);
        return {
          key,
          label,
          year,
          month,
          averageRating: stats ? roundRating(stats.sum / stats.count) : null,
        };
      })
    );

    const yearlyStart = availableYears[0] ?? nowYear;
    const yearlyEnd = Math.max(availableYears[availableYears.length - 1] ?? nowYear, nowYear);
    const yearly: CfrSatisfactionPoint[] = [];
    for (let year = yearlyStart; year <= yearlyEnd; year += 1) {
      const stats = yearlyTotals.get(year);
      yearly.push({
        key: String(year),
        label: String(year),
        year,
        averageRating: stats ? roundRating(stats.sum / stats.count) : null,
      });
    }

    const departmentTotals = new Map<
      string,
      { departmentId: string; departmentName: string; sum: number; count: number }
    >();
    for (const row of submittedRows) {
      const score = averageCfrRating(row);
      if (score == null) {
        continue;
      }
      const departmentId = row.project.department.id;
      const departmentName = row.project.department.name;
      const current = departmentTotals.get(departmentId) ?? {
        departmentId,
        departmentName,
        sum: 0,
        count: 0,
      };
      departmentTotals.set(departmentId, {
        departmentId,
        departmentName,
        sum: current.sum + score,
        count: current.count + 1,
      });
    }

    const departmentRatings = [...departmentTotals.values()]
      .map((stats) => ({
        departmentId: stats.departmentId,
        departmentName: stats.departmentName,
        averageRating: roundRating(stats.sum / stats.count),
        count: stats.count,
      }))
      .sort((a, b) => b.averageRating - a.averageRating || a.departmentName.localeCompare(b.departmentName));

    return {
      kpis: {
        total,
        submitted,
        sent,
        averageRating: roundRating(averageRating),
      },
      satisfactionTrend: {
        availableYears,
        monthly,
        yearly,
      },
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
