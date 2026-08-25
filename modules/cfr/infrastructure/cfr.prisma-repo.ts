import { prisma } from "@/lib/prisma";
import type {
  CfrRepository,
  CfrWithProject,
  CfrFilterInput,
  CfrCreateInput,
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
      // Find project by department and projectName (case-insensitive)
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
      } else {
        // Create new project
        const newProject = await prisma.project.create({
          data: {
            departmentId: data.departmentId,
            projectName: data.projectName,
            projectNumber: data.projectNumber,
            clientName: data.client,
            projectStartDate: data.projectStartDate,
            projectEndDate: data.projectEndDate,
          },
        });
        resolvedProjectId = newProject.id;
      }
    }

    return prisma.cfr.create({
      data: {
        projectId: resolvedProjectId,
        reviewPeriod: data.reviewPeriod,
        qualityRating: data.qualityRating,
        deliveryRating: data.deliveryRating,
        communicationRating: data.communicationRating,
        technicalCompetence: data.technicalCompetence,
        overallSatisfaction: data.overallSatisfaction,
        comments: data.comments,
        status: data.status,
        client: data.client,
        projectNumber: data.projectNumber,
      },
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
