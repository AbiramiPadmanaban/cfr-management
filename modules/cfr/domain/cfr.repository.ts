import type { Cfr, Project, Department, CfrStatus } from "@/app/generated/prisma";

export interface CfrWithProject extends Cfr {
  project: Project & {
    department: Department;
  };
}

export interface CfrFilterInput {
  departmentId?: string;
  projectId?: string;
  status?: CfrStatus;
  search?: string;
}

export interface CfrCreateInput {
  projectId?: string | null;
  departmentId: string;
  projectName: string;
  projectStartDate: Date;
  projectEndDate: Date;
  reviewPeriod: string;
  qualityRating: number;
  deliveryRating: number;
  communicationRating: number;
  technicalCompetence: number;
  overallSatisfaction: number;
  comments?: string | null;
  status?: CfrStatus;
  client: string;
  projectNumber: string;
}

export interface CfrKpis {
  total: number;
  submitted: number;
  draft: number;
  averageRating: number;
}

export interface CfrRepository {
  getDepartments(): Promise<(Department & { projects: Project[] })[]>;
  getCfrs(
    filters?: CfrFilterInput,
    page?: number,
    limit?: number
  ): Promise<{ cfrs: CfrWithProject[]; totalCount: number }>;
  getCfrById(id: number): Promise<CfrWithProject | null>;
  createCfr(data: CfrCreateInput): Promise<Cfr>;
  getKpis(): Promise<CfrKpis>;
}
