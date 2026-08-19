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
  projectId: string;
  reviewPeriod: string;
  qualityRating: number;
  deliveryRating: number;
  communicationRating: number;
  technicalCompetence: number;
  overallSatisfaction: number;
  comments?: string | null;
  status?: CfrStatus;
}

export interface CfrUpdateInput extends Partial<CfrCreateInput> {}

export interface CfrKpis {
  total: number;
  submitted: number;
  draft: number;
  averageRating: number;
}

export interface CfrRepository {
  getDepartments(): Promise<(Department & { projects: Project[] })[]>;
  getCfrs(filters?: CfrFilterInput): Promise<CfrWithProject[]>;
  getCfrById(id: number): Promise<CfrWithProject | null>;
  createCfr(data: CfrCreateInput): Promise<Cfr>;
  updateCfr(id: number, data: CfrUpdateInput): Promise<Cfr>;
  deleteCfr(id: number): Promise<Cfr>;
  getKpis(): Promise<CfrKpis>;
}
