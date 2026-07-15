"use client";

import { ApiResponse, PaginatedResponse } from "./types";

export interface FeedbackDTO {
  id: number;
  userId: number;
  title: string;
  content: string;
  screenUrl: string | null;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  createdAt: string;
}

const BASE_URL = "/api";

async function feedbackRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const headers = new Headers(options.headers);
  if (token) {
    const cleanToken = token.replace(/['"]+/g, "");
    headers.set("Authorization", `Bearer ${cleanToken}`);
  }
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");

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
      message: result.message || "Lỗi xử lý Feedback",
      errorCode: result.errorCode,
    };
  }
  return result;
}

export const feedbackService = {
  async sendFeedback(payload: { title: string; content: string; screenUrl?: string }) {
    return await feedbackRequest<ApiResponse<FeedbackDTO>>("/feedbacks", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async adminGetFeedbacks(params?: {
    page?: number;
    size?: number;
    keyword?: string;
    status?: string;
    sort?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append("page", params.page.toString());
    if (params?.size !== undefined) query.append("size", params.size.toString());
    if (params?.keyword) query.append("keyword", params.keyword);
    if (params?.status) query.append("status", params.status);
    if (params?.sort) query.append("sort", params.sort);

    return await feedbackRequest<ApiResponse<PaginatedResponse<FeedbackDTO>>>(
      `/admin/feedbacks?${query.toString()}`
    );
  },

  async adminUpdateFeedbackStatus(
    id: number | string,
    payload: { status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"; adminNote?: string }
  ) {
    return await feedbackRequest<ApiResponse<FeedbackDTO>>(`/admin/feedbacks/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
};
