import { ApiResponse, PaginatedResponse } from "./types";

const BASE_URL = "/api";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function qRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token.replace(/['"]+/g, "")}`);
  }

  const method = (options.method || "GET").toUpperCase() as HttpMethod;
  if (!headers.has("Content-Type") && method !== "GET" && method !== "DELETE") {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const text = await response.text();
  const result = text ? JSON.parse(text) : {};

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
      message: result.message || "Lỗi giao tiếp API Quiz",
      errorCode: result.errorCode || "QUIZ_ERROR",
    };
  }

  return result;
}

function toQuery(params: Record<string, string | number | undefined | null>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export interface QuizDTO {
  id: number;
<<<<<<< HEAD
  notebookId?: number | null;
  notebookTitle?: string | null;
  subjectId?: number | null;
  subjectName?: string | null;
  creatorId?: number;
  creatorFullName?: string | null;
  title: string;
  description?: string | null;
  academicTermId?: number | null;
  academicTermName?: string | null;
  examType?: string | null;
  visibility?: "PRIVATE" | "WORKSPACE" | "MARKETPLACE";
  marketStatus?: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  downloadCount?: number;
  reviewCount?: number;
  acceptPercentage?: number;
  aiVerdictNote?: string | null;
  clonedFromId?: number | null;
  createdAt?: string;
  updatedAt?: string;

  subject?: string;
  level?: string;
  questions?: number;
  bestScore?: number;
  attempts?: number;
=======
  notebookId: number | null;
  notebookTitle: string | null;
  subjectId: number | null;
  subjectName: string | null;
  creatorId: number;
  creatorFullName: string | null;
  title: string;
  description: string | null;
  academicTermId: number | null;
  academicTermName: string | null;
  examType: string | null;
  visibility: "PRIVATE" | "WORKSPACE" | "MARKETPLACE";
  marketStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  downloadCount: number;
  reviewCount: number;
  acceptPercentage: number;
  aiVerdictNote: string | null;
  clonedFromId: number | null;
  createdAt: string;
  updatedAt: string;
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
}

export interface QuizPayload {
  title: string;
  description?: string | null;
  notebookId?: number | null;
  subjectId?: number | null;
  academicTermId?: number | null;
  examType?: string | null;
  visibility?: "PRIVATE" | "WORKSPACE" | "MARKETPLACE";
}

export interface OptionDTO {
  id?: number;
  questionId?: number;
  optionText: string;
  isCorrect?: boolean;
}

export interface QuestionDTO {
  id: number;
  quizId?: number;
  questionText: string;
  questionType: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "FILL_IN_THE_BLANK" | string;
  explanation?: string | null;
  options: OptionDTO[];
  userProgress?: {
    selectedOptionId?: number;
    userAnswerText?: string;
  } | null;
}

export interface QuestionPayload {
  questionText: string;
  questionType: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "FILL_IN_THE_BLANK" | string;
  explanation?: string | null;
  options: OptionDTO[];
}

export interface StartTestPayload {
  title?: string;
  duration?: number;
  quizSelectionMode?: "ALL" | "SELECTED" | "RANDOM";
  selectionMode?: "ALL" | "SELECTED" | "RANDOM";
  questionIds?: number[];
  randomCount?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
}

export interface TestDTO {
  id: number;
  quizId: number;
  quizTitle?: string;
  userId: number;
  title: string;
  duration: number;
  selectionMode: "ALL" | "SELECTED" | "RANDOM" | string;
  status: "IN_PROGRESS" | "COMPLETED";
  totalQuestions?: number;
  totalScore?: number;
  questions?: QuestionDTO[];
  correctAnswers?: number;
  items?: TestResultItemDTO[];
  createdAt?: string;
}

export interface TestResultItemDTO {
  questionId: number;
  isCorrect: boolean;
  selectedOptionId?: number | null;
  userAnswerText?: string | null;
  explanation?: string | null;
}

<<<<<<< HEAD
export interface UserTestHistoryDTO {
  id: number;
  quizId: number;
  userId: number;
  title: string;
  totalScore?: number;
  duration?: number;
  status: "IN_PROGRESS" | "COMPLETED";
  createdAt?: string;
}
=======
let mockQuizzes: QuizDTO[] = [
  { id: 801, notebookId: null, notebookTitle: "", subjectId: null, subjectName: "SWP391", creatorId: 1, creatorFullName: "You", title: "Kiến trúc ứng dụng web Java", description: "Ôn tập Servlet/JSP", academicTermId: null, academicTermName: "", examType: "MIDTERM", visibility: "PRIVATE", marketStatus: "NONE", downloadCount: 0, reviewCount: 0, acceptPercentage: 0, aiVerdictNote: null, clonedFromId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 802, notebookId: null, notebookTitle: "", subjectId: null, subjectName: "SWR302", creatorId: 1, creatorFullName: "You", title: "Lập trình điều khiển mạch ESP32", description: "Sensor & IoT logic", academicTermId: null, academicTermName: "", examType: "FINAL", visibility: "PRIVATE", marketStatus: "NONE", downloadCount: 0, reviewCount: 0, acceptPercentage: 0, aiVerdictNote: null, clonedFromId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b

function normalizeQuiz(quiz: QuizDTO): QuizDTO {
  return {
    ...quiz,
    subject: quiz.subjectName || (quiz.subjectId ? `Môn #${quiz.subjectId}` : "Tự do"),
    level: quiz.examType || "Medium",
    bestScore: quiz.bestScore ?? 0,
    attempts: quiz.attempts ?? quiz.reviewCount ?? 0,
  };
}

function normalizeTest(test: TestDTO): TestDTO {
  return {
    ...test,
    selectionMode: test.selectionMode,
    questions: test.questions?.map((question) => ({
      ...question,
      options: question.options?.map((option) => ({ ...option, questionId: question.id })) ?? [],
    })),
  };
}

function normalizeStartPayload(payload: StartTestPayload): Omit<StartTestPayload, "selectionMode"> {
  const quizSelectionMode = payload.quizSelectionMode || payload.selectionMode || "ALL";
  return {
    title: payload.title,
    duration: payload.duration,
    quizSelectionMode,
    questionIds: payload.questionIds,
    randomCount: payload.randomCount,
    shuffleQuestions: payload.shuffleQuestions ?? true,
    shuffleOptions: payload.shuffleOptions ?? true,
  };
}

export const quizService = {
  async getQuizzes(params: {
    page?: number;
    size?: number;
    keyword?: string;
    subjectId?: number;
    notebookId?: number;
    academicTermId?: number;
    examType?: string;
    visibility?: string;
    marketStatus?: string;
    sort?: string;
  } = {}): Promise<ApiResponse<PaginatedResponse<QuizDTO>>> {
    const res = await qRequest<ApiResponse<PaginatedResponse<QuizDTO>>>(
      `/quizzes${toQuery({ page: 0, size: 50, sort: "createdAt,desc", ...params })}`,
    );
    return {
      ...res,
      data: {
        ...res.data,
        items: res.data.items.map(normalizeQuiz),
      },
    };
  },

  async createQuiz(payload: QuizPayload): Promise<ApiResponse<QuizDTO>> {
    const res = await qRequest<ApiResponse<QuizDTO>>("/quizzes", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return { ...res, data: normalizeQuiz(res.data) };
  },

  async generateAiQuiz(payload: any): Promise<ApiResponse<QuizDTO>> {
    const res = await qRequest<ApiResponse<QuizDTO>>("/quizzes/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return { ...res, data: normalizeQuiz(res.data) };
  },

  async getQuizDetails(id: number): Promise<ApiResponse<QuizDTO>> {
    const res = await qRequest<ApiResponse<QuizDTO>>(`/quizzes/${id}`);
    return { ...res, data: normalizeQuiz(res.data) };
  },

<<<<<<< HEAD
  async updateQuiz(id: number, payload: QuizPayload): Promise<ApiResponse<QuizDTO>> {
    const res = await qRequest<ApiResponse<QuizDTO>>(`/quizzes/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return { ...res, data: normalizeQuiz(res.data) };
=======
  // ─── 2. QUIZ MANAGEMENT (CRUD QUIZ) ────────────────────────────────────────

  async getQuizzes(params?: {
    keyword?: string;
    subjectId?: number;
    notebookId?: number;
    academicTermId?: number;
    examType?: string;
    visibility?: string;
    marketStatus?: string;
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<ApiResponse<PaginatedResponse<QuizDTO>>> {
    try {
      const query = new URLSearchParams();
      if (params?.keyword) query.set("keyword", params.keyword);
      if (params?.subjectId != null) query.set("subjectId", String(params.subjectId));
      if (params?.notebookId != null) query.set("notebookId", String(params.notebookId));
      if (params?.academicTermId != null) query.set("academicTermId", String(params.academicTermId));
      if (params?.examType) query.set("examType", params.examType);
      if (params?.visibility) query.set("visibility", params.visibility);
      if (params?.marketStatus) query.set("marketStatus", params.marketStatus);
      query.set("page", String(params?.page ?? 0));
      query.set("size", String(params?.size ?? 10));
      query.set("sort", params?.sort ?? "createdAt,desc");
      const res = await qRequest<ApiResponse<PaginatedResponse<QuizDTO>>>(`/quizzes?${query.toString()}`);
      if (!res.data || !res.data.items || res.data.items.length === 0) {
        return {
          success: true, message: "Success (Mock)",
          data: { items: mockQuizzes, page: params?.page ?? 0, size: params?.size ?? 10, totalElements: mockQuizzes.length, totalPages: 1 }
        };
      }
      return res;
    } catch {
      return new Promise((res) => setTimeout(() => {
        res({
          success: true,
          message: "Success",
          data: { items: mockQuizzes, page: params?.page ?? 0, size: params?.size ?? 10, totalElements: mockQuizzes.length, totalPages: 1 }
        });
      }, 400));
    }
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
  },

  async deleteQuiz(id: number): Promise<ApiResponse<void>> {
    return qRequest<ApiResponse<void>>(`/quizzes/${id}`, { method: "DELETE" });
  },

  async getQuizQuestions(quizId: number): Promise<ApiResponse<QuestionDTO[]>> {
    const res = await qRequest<ApiResponse<QuestionDTO[]>>(`/quizzes/${quizId}/questions`);
    return {
      ...res,
      data: res.data.map((question) => ({
        ...question,
        options: question.options?.map((option) => ({ ...option, questionId: question.id })) ?? [],
      })),
    };
  },

  async addQuestionToQuiz(quizId: number, payload: QuestionPayload): Promise<ApiResponse<QuestionDTO>> {
    return qRequest<ApiResponse<QuestionDTO>>(`/quizzes/${quizId}/questions`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateQuestion(questionId: number, payload: QuestionPayload): Promise<ApiResponse<QuestionDTO>> {
    return qRequest<ApiResponse<QuestionDTO>>(`/questions/${questionId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async deleteQuestion(questionId: number): Promise<ApiResponse<void>> {
    return qRequest<ApiResponse<void>>(`/questions/${questionId}`, { method: "DELETE" });
  },

  async startTest(quizId: number, payload: StartTestPayload): Promise<ApiResponse<TestDTO>> {
    const res = await qRequest<ApiResponse<TestDTO>>(`/quizzes/${quizId}/tests`, {
      method: "POST",
      body: JSON.stringify(normalizeStartPayload(payload)),
    });
    return { ...res, data: normalizeTest(res.data) };
  },

  async getTestDetails(testId: number): Promise<ApiResponse<TestDTO>> {
    const res = await qRequest<ApiResponse<TestDTO>>(`/tests/${testId}`);
    return { ...res, data: normalizeTest(res.data) };
  },

  async saveTestAnswer(
    testId: number,
    payload: { questionId: number; selectedOptionId?: number; userAnswerText?: string },
  ) {
    return qRequest(`/tests/${testId}/answers`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async submitTest(testId: number, payload: { confirmSubmit: boolean }): Promise<ApiResponse<TestDTO>> {
    return qRequest<ApiResponse<TestDTO>>(`/tests/${testId}/submit`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getTestResult(testId: number): Promise<ApiResponse<TestDTO>> {
    return qRequest<ApiResponse<TestDTO>>(`/tests/${testId}/result`);
  },

  async getQuizTestHistory(
    quizId: number,
    params: { page?: number; size?: number; keyword?: string; status?: string; sort?: string } = {},
  ): Promise<ApiResponse<PaginatedResponse<UserTestHistoryDTO>>> {
    return qRequest<ApiResponse<PaginatedResponse<UserTestHistoryDTO>>>(
      `/quizzes/${quizId}/tests${toQuery({ page: 0, size: 10, sort: "newest", ...params })}`,
    );
  },

  async submitQuizToMarketplace(id: number, note = "Submit for marketplace review"): Promise<ApiResponse<QuizDTO>> {
    const res = await qRequest<ApiResponse<QuizDTO>>(`/marketplace/quizzes/${id}/submit`, {
      method: "POST",
      body: JSON.stringify({ note }),
    });
    return { ...res, data: normalizeQuiz(res.data) };
  },

  async getMarketplaceQuizzes(params: { page?: number; size?: number; keyword?: string; subjectId?: number } = {}) {
    return qRequest(`/marketplace/quizzes${toQuery({ page: 0, size: 20, ...params })}`);
  },

  async cloneQuiz(id: number, targetNotebookId?: number) {
    return qRequest(`/marketplace/quizzes/${id}/clone`, {
      method: "POST",
      body: JSON.stringify({ targetNotebookId }),
    });
  },
};
