"use client";

import { mockRequest } from "../lib/mockApiEngine";
import { UserDTO, PaginatedResponse, FeedbackDTO, QuizDTO, TestDTO } from "./types";

// ==========================================
// 🔐 USER MANAGEMENT SERVICE
// ==========================================
export const userService = {
    async adminGetUsers(params?: { page?: number; size?: number; keyword?: string; sort?: string }) {
        const query = new URLSearchParams();
        if (params?.page !== undefined) query.append("page", params.page.toString());
        if (params?.size !== undefined) query.append("size", params.size.toString());
        if (params?.keyword) query.append("keyword", params.keyword);
        const endpoint = `/admin/users?${query.toString()}`;
        return mockRequest<PaginatedResponse<UserDTO>>(endpoint, { method: "GET" });
    },

    async adminToggleUserActive(id: number, isActive: boolean) {
        return mockRequest<UserDTO>(`/admin/users/${id}/active`, {
            method: "PATCH",
            body: JSON.stringify({ isActive })
        });
    },

    async adminUpdateUserRole(id: number, role: "STUDENT" | "REVIEWER" | "ADMIN") {
        return mockRequest<UserDTO>(`/admin/users/${id}/role`, {
            method: "PATCH",
            body: JSON.stringify({ role })
        });
    },

    async adminAssignBadgeToUser(userId: number, badgeId: number) {
        return mockRequest<any>(`/admin/users/${userId}/badges/${badgeId}`, {
            method: "POST"
        });
    }
};

// ==========================================
// 💬 SYSTEM FEEDBACK SERVICE
// ==========================================
export const feedbackService = {
    async adminGetFeedbacks(params?: { page?: number; size?: number }) {
        return mockRequest<PaginatedResponse<FeedbackDTO>>("/admin/feedbacks", { method: "GET" });
    },

    async adminUpdateFeedbackStatus(id: number, payload: { status: string; adminNote: string }) {
        return mockRequest<FeedbackDTO>(`/admin/feedbacks/${id}/status`, {
            method: "PATCH",
            body: JSON.stringify(payload)
        });
    }
};

// ==========================================
// 📝 QUIZ/PRACTICE MANAGEMENT SERVICE
// ==========================================
export const quizService = {
    async getList() {
        return mockRequest<QuizDTO[]>("/quizzes", { method: "GET" });
    },

    async generateAiQuiz(payload: { prompt: string }) {
        return mockRequest<QuizDTO>("/quizzes/generate", {
            method: "POST",
            body: JSON.stringify(payload)
        });
    },

    async startTest(quizId: number, mode: "ALL" | "SELECTED" | "RANDOM") {
        return mockRequest<TestDTO>(`/quizzes/${quizId}/tests`, {
            method: "POST",
            body: JSON.stringify({ mode })
        });
    }
};