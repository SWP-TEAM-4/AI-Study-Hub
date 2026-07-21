import { ApiResponse, PaginatedResponse } from "./types";

const BASE_URL = "/api";

export type ReputationEventType =
  | "CONTENT_APPROVED_DOCUMENT"
  | "CONTENT_APPROVED_QUIZ"
  | "CONTENT_APPROVED_FLASHCARD_DECK"
  | "MARKETPLACE_CLONE_RECEIVED"
  | "CONTENT_DOWNLOAD_MILESTONE"
  | "COMMUNITY_REVIEW_GOOD"
  | "COMMUNITY_REVIEW_BAD"
  | "REVIEWER_MARKETPLACE_VOTE"
  | "REVIEWER_DECISION_ALIGNED"
  | "CONTENT_REPORT_ACCEPTED"
  | "CONTENT_REPORT_REJECTED"
  | "CONTENT_REPORT_OWNER_PENALTY"
  | "CONTENT_HIDDEN_PENALTY";

export type NominationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type NominationType = "MONTHLY_TOP_CONTRIBUTOR" | "REVIEWER_UNLOCK";
export type CommunityRoleType = "REVIEWER" | "SUBJECT_MODERATOR" | "CONTENT_MODERATOR" | "MARKETPLACE_REVIEWER";
export type CommunityScopeType = "GLOBAL" | "SUBJECT";
export type ReputationLeaderboardKind = "contributors" | "reviewers";

export interface RewardRuleDTO {
  id: number;
  eventType: ReputationEventType;
  pointsDelta: number;
  enabled?: boolean | null;
  maxEventsPerUserPerPeriod?: number | null;
  thresholdValue?: number | null;
  minRating?: number | null;
  maxRating?: number | null;
  description?: string | null;
  updatedByUserId?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface RewardRuleRequest {
  pointsDelta: number;
  enabled?: boolean | null;
  maxEventsPerUserPerPeriod?: number | null;
  thresholdValue?: number | null;
  minRating?: number | null;
  maxRating?: number | null;
  description?: string | null;
}

export interface AiQuotaTierDTO {
  id: number;
  name: string;
  minReputationPoints: number;
  dailyChatLimit: number;
  monthlyChatLimit: number;
  dailySummaryLimit: number;
  monthlySummaryLimit: number;
  dailyGenerationLimit: number;
  monthlyGenerationLimit: number;
  enabled?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export type AiQuotaTierRequest = Omit<AiQuotaTierDTO, "id" | "createdAt" | "updatedAt">;

export interface AiQuotaStatusDTO {
  userId: number;
  reputationPoints: number;
  tier?: AiQuotaTierDTO | null;
  dailyChatUsed: number;
  monthlyChatUsed: number;
  dailySummaryUsed: number;
  monthlySummaryUsed: number;
  dailyGenerationUsed: number;
  monthlyGenerationUsed: number;
  chatAvailable?: boolean | null;
  summaryAvailable?: boolean | null;
  generationAvailable?: boolean | null;
}

export interface ReputationEventDTO {
  id: number;
  userId: number;
  subjectId?: number | null;
  eventType: ReputationEventType;
  targetType?: string | null;
  targetId?: number | null;
  sourceType?: string | null;
  sourceId?: number | null;
  pointsDelta: number;
  reason?: string | null;
  periodKey?: string | null;
  createdAt?: string | null;
}

export interface ReputationLeaderboardItemDTO {
  rank: number;
  userId: number;
  fullName: string;
  avatarUrl?: string | null;
  score: number;
  eventCount: number;
  badges?: Array<{
    id: number;
    name: string;
    description?: string | null;
    iconUrl?: string | null;
    createdAt?: string | null;
  }>;
}

export interface CommunityRoleNominationDTO {
  id: number;
  userId: number;
  userFullName?: string | null;
  subjectId?: number | null;
  subjectCode?: string | null;
  nominationType: NominationType;
  roleType: CommunityRoleType;
  scopeType: CommunityScopeType;
  scopeId?: number | null;
  periodKey?: string | null;
  score?: number | null;
  status: NominationStatus;
  reason?: string | null;
  effectiveStartAt?: string | null;
  effectiveEndAt?: string | null;
  reviewedByUserId?: number | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
  createdAt?: string | null;
}

export interface NominationQuery {
  userId?: number;
  subjectId?: number;
  status?: NominationStatus | "ALL";
  nominationType?: NominationType | "ALL";
  roleType?: CommunityRoleType | "ALL";
  periodKey?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface ReviewNominationRequest {
  reviewNote?: string | null;
  effectiveStartAt?: string | null;
  effectiveEndAt?: string | null;
}

async function reputationRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token.replace(/['"]+/g, "")}`);
  }

  const method = (options.method || "GET").toUpperCase();
  if (!headers.has("Content-Type") && method !== "GET" && method !== "DELETE") {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const text = await response.text();
  let result: any = {};
  if (text && text.trim().length > 0) {
    try {
      result = JSON.parse(text);
    } catch {
      result = { message: text.substring(0, 200) };
    }
  }

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      localStorage.removeItem("auth-storage");
      window.location.href = "/";
    }
    throw { status: 401, message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại." };
  }

  if (!response.ok) {
    throw {
      status: response.status,
      message: result.message || "Lỗi giao tiếp Reputation API",
      errorCode: result.errorCode || "REPUTATION_ERROR",
    };
  }

  return result as T;
}

function toQuery(params: Record<string, string | number | boolean | undefined | null>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "" && value !== "ALL") {
      query.set(key, String(value));
    }
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

export const reputationService = {
  getRewardRules() {
    return reputationRequest<ApiResponse<RewardRuleDTO[]>>("/admin/reward-rules", { method: "GET" });
  },

  updateRewardRule(eventType: ReputationEventType, payload: RewardRuleRequest) {
    return reputationRequest<ApiResponse<RewardRuleDTO>>(`/admin/reward-rules/${eventType}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  getAiQuotaTiers() {
    return reputationRequest<ApiResponse<AiQuotaTierDTO[]>>("/admin/ai-quota-tiers", { method: "GET" });
  },

  createAiQuotaTier(payload: AiQuotaTierRequest) {
    return reputationRequest<ApiResponse<AiQuotaTierDTO>>("/admin/ai-quota-tiers", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateAiQuotaTier(id: number, payload: AiQuotaTierRequest) {
    return reputationRequest<ApiResponse<AiQuotaTierDTO>>(`/admin/ai-quota-tiers/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  deleteAiQuotaTier(id: number) {
    return reputationRequest<ApiResponse<void>>(`/admin/ai-quota-tiers/${id}`, { method: "DELETE" });
  },

  getMyAiQuota() {
    return reputationRequest<ApiResponse<AiQuotaStatusDTO>>("/users/me/ai-quota", { method: "GET" });
  },

  getMyReputationEvents(page = 0, size = 10) {
    return reputationRequest<ApiResponse<PaginatedResponse<ReputationEventDTO>>>(
      `/users/me/reputation/events${toQuery({ page, size })}`,
      { method: "GET" },
    );
  },

  getReputationLeaderboard(
    kind: ReputationLeaderboardKind,
    params: { subjectId?: number; periodKey?: string; page?: number; size?: number } = {},
  ) {
    return reputationRequest<ApiResponse<PaginatedResponse<ReputationLeaderboardItemDTO>>>(
      `/community/leaderboard/reputation/${kind}${toQuery({
        subjectId: params.subjectId,
        periodKey: params.periodKey,
        page: params.page ?? 0,
        size: params.size ?? 20,
      })}`,
      { method: "GET" },
    );
  },

  getNominations(params: NominationQuery = {}) {
    return reputationRequest<ApiResponse<PaginatedResponse<CommunityRoleNominationDTO>>>(
      `/admin/community-role-nominations${toQuery({
        userId: params.userId,
        subjectId: params.subjectId,
        status: params.status,
        nominationType: params.nominationType,
        roleType: params.roleType,
        periodKey: params.periodKey,
        page: params.page ?? 0,
        size: params.size ?? 50,
        sort: params.sort ?? "newest",
      })}`,
      { method: "GET" },
    );
  },

  generateMonthlyNominations(periodKey?: string) {
    return reputationRequest<ApiResponse<CommunityRoleNominationDTO[]>>(
      `/admin/community-role-nominations/generate-monthly${toQuery({ periodKey })}`,
      { method: "POST" },
    );
  },

  nominateReviewer(payload: { userId: number; subjectId: number; reason: string }) {
    return reputationRequest<ApiResponse<CommunityRoleNominationDTO>>("/admin/community-role-nominations/reviewers", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  approveNomination(id: number, payload: ReviewNominationRequest = {}) {
    return reputationRequest<ApiResponse<CommunityRoleNominationDTO>>(`/admin/community-role-nominations/${id}/approve`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  rejectNomination(id: number, payload: ReviewNominationRequest = {}) {
    return reputationRequest<ApiResponse<CommunityRoleNominationDTO>>(`/admin/community-role-nominations/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
};
