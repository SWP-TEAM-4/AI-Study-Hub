"use client";

// ─── PHÂN HỆ USER & AUTH ─────────────────────────────────────────────────────
export interface UserDTO {
  id: number;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  currentSemesterId: number | null;
  comboId: number | null;
  role: "STUDENT" | "REVIEWER" | "ADMIN";
  reputationPoints: number;
  isActive: boolean;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  error?: any;
}

// ─── PHÂN HỆ ACADEMIC MASTER DATA ───────────────────────────────────────────
export interface ComboDTO {
  id: number;
  code: string;
  name: string;
  description: string;
}

export interface SubjectDTO {
  id: number;
  code: string;
  name: string;
  standardSemesterNumber: number;
}

export interface SemesterDTO {
  id: number;
  code: string;
  name: string;
}

// ─── PHÂN HỆ QUIZ & PRACTICE ────────────────────────────────────────────────
export interface QuizDTO {
  id: number;
  title: string;
  description: string;
  bestScore?: number;
  attempts?: number;
  level: "Easy" | "Medium" | "Hard";
  subject: string;
  questions: number;
}

export interface TestDTO {
  id: number;
  quizId: number;
  totalScore: number;
  status: "IN_PROGRESS" | "COMPLETED";
}

// ─── PHÂN HỆ SYSTEM METRICS & LOGS ──────────────────────────────────────────
export interface FeedbackDTO {
  id: number;
  userId: number;
  title: string;
  content: string;
  screenUrl: string | null;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  createdAt: string;
}

export interface ActivityLogDTO {
  id: number;
  actorId: number;
  action: string;
  targetType: string;
  targetId: number;
  metadata: {
    fileType?: string;
    [key: string]: any;
  };
  createdAt: string;
}

export interface AIUsageDTO {
  userId: number;
  period: string;
  chatRequests: number;
  quizGenerations: number;
  flashcardGenerations: number;
  estimatedTokens: number;
}