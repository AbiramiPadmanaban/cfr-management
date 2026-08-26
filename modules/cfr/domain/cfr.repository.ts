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
  qualityRating?: number | null;
  deliveryRating?: number | null;
  communicationRating?: number | null;
  technicalCompetence?: number | null;
  overallSatisfaction?: number | null;
  qualityRemarks?: string | null;
  deliveryRemarks?: string | null;
  communicationRemarks?: string | null;
  technicalCompetenceRemarks?: string | null;
  overallSatisfactionRemarks?: string | null;
  comments?: string | null;
  status?: CfrStatus;
  client: string;
  projectNumber: string;
  clientEmail: string;
  documentNo?: string | null;
  revNo?: string | null;
  revDate?: Date | null;
}

export interface CfrFeedbackSubmitInput {
  qualityRating: number;
  deliveryRating: number;
  communicationRating: number;
  technicalCompetence: number;
  overallSatisfaction: number;
  qualityRemarks?: string | null;
  deliveryRemarks?: string | null;
  communicationRemarks?: string | null;
  technicalCompetenceRemarks?: string | null;
  overallSatisfactionRemarks?: string | null;
  comments?: string | null;
  reviewedBy: string;
  reviewedAt: Date;
}

export interface CfrPublicFeedback {
  projectName: string;
  projectNumber: string;
  client: string;
  clientEmail: string;
  projectStartDate: Date;
  projectEndDate: Date;
  status: CfrStatus;
  submitted: boolean;
  expired: boolean;
  expiresAt: Date | null;
}

export const FEEDBACK_LINK_TTL_MS = 24 * 60 * 60 * 1000;

export function getFeedbackExpiryDate(sentAt: Date | null | undefined): Date | null {
  if (!sentAt) {
    return null;
  }
  return new Date(new Date(sentAt).getTime() + FEEDBACK_LINK_TTL_MS);
}

export function isFeedbackLinkExpired(
  sentAt: Date | null | undefined,
  status: CfrStatus
): boolean {
  if (status === "SUBMITTED") {
    return false;
  }
  const expiresAt = getFeedbackExpiryDate(sentAt);
  if (!expiresAt) {
    return true;
  }
  return Date.now() > expiresAt.getTime();
}

export interface CfrKpis {
  total: number;
  submitted: number;
  sent: number;
  averageRating: number;
}

export interface CfrNotification {
  id: string;
  cfrId: number;
  title: string;
  message: string;
  readAt: Date | null;
  createdAt: Date;
}

export interface CfrRepository {
  getDepartments(): Promise<(Department & { projects: Project[] })[]>;
  getCfrs(
    filters?: CfrFilterInput,
    page?: number,
    limit?: number
  ): Promise<{ cfrs: CfrWithProject[]; totalCount: number }>;
  getCfrById(id: number): Promise<CfrWithProject | null>;
  getCfrByFeedbackToken(token: string): Promise<CfrWithProject | null>;
  createCfr(data: CfrCreateInput): Promise<Cfr>;
  submitFeedback(token: string, data: CfrFeedbackSubmitInput): Promise<CfrWithProject>;
  setActionNeeded(id: number, actionNeeded: boolean): Promise<CfrWithProject>;
  deleteCfr(id: number): Promise<void>;
  getKpis(): Promise<CfrKpis>;
  getNotifications(limit?: number): Promise<CfrNotification[]>;
  getUnreadNotificationCount(): Promise<number>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(): Promise<void>;
}
