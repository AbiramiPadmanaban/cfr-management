import { prisma } from "@/lib/prisma";
import type {
  CfrRepository,
  CfrWithProject,
  CfrFilterInput,
  CfrCreateInput,
  CfrUpdateInput,
  CfrKpis,
} from "../domain/cfr.repository";
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

  async getCfrs(filters?: CfrFilterInput): Promise<CfrWithProject[]> {
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
            project: {
              clientName: {
                contains: trimmedSearch,
                mode: "insensitive" as const,
              },
            },
          },
        ];
      }
    }

    return prisma.cfr.findMany({
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
    }) as Promise<CfrWithProject[]>;
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
    return prisma.cfr.create({
      data: {
        projectId: data.projectId,
        reviewPeriod: data.reviewPeriod,
        qualityRating: data.qualityRating,
        deliveryRating: data.deliveryRating,
        communicationRating: data.communicationRating,
        technicalCompetence: data.technicalCompetence,
        overallSatisfaction: data.overallSatisfaction,
        comments: data.comments,
        status: data.status,
      },
    });
  }

  async updateCfr(id: number, data: CfrUpdateInput): Promise<Cfr> {
    return prisma.cfr.update({
      where: { id },
      data: {
        projectId: data.projectId,
        reviewPeriod: data.reviewPeriod,
        qualityRating: data.qualityRating,
        deliveryRating: data.deliveryRating,
        communicationRating: data.communicationRating,
        technicalCompetence: data.technicalCompetence,
        overallSatisfaction: data.overallSatisfaction,
        comments: data.comments,
        status: data.status,
      },
    });
  }

  async deleteCfr(id: number): Promise<Cfr> {
    return prisma.cfr.delete({
      where: { id },
    });
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
    let draft = 0;

    for (const group of statusCounts) {
      if (group.status === "SUBMITTED") {
        submitted = group._count.id;
      } else if (group.status === "DRAFT") {
        draft = group._count.id;
      }
    }

    return {
      total,
      submitted,
      draft,
      averageRating: parseFloat(averageRating.toFixed(2)),
    };
  }
}
