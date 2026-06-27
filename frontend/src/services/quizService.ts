import { PaginatedResponse } from "./types";

const BASE_URL = "/api";

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errorCode?: string;
}

async function qRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && options.method !== "GET" && options.method !== "DELETE") {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const text = await response.text();
  const result = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw {
      status: response.status,
      message: result.message || "Lỗi giao tiếp API Quiz",
      errorCode: result.errorCode || "QUIZ_ERROR"
    };
  }
  return result;
}

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface QuizDTO {
  id: number;
  notebookId?: number;
  subjectId?: number;
  title: string;
  description?: string;
  academicTermId?: number;
  examType?: string;
  visibility?: string;
  marketStatus?: string;
  downloadCount?: number;
  reviewCount?: number;
  acceptPercentage?: number;
  createdAt?: string;

  // Frontend bổ sung
  subject?: string;
  level?: string;
  questions?: number;
  bestScore?: number;
  attempts?: number;
}

export interface OptionDTO {
  id: number;
  questionId: number;
  optionText: string;
  isCorrect?: boolean;
}

export interface QuestionDTO {
  id: number;
  quizId?: number;
  questionText: string;
  questionType: string;
  explanation?: string;
  options: OptionDTO[];
}

export interface TestDTO {
  id: number;
  quizId: number;
  userId: number;
  title: string;
  duration: number;
  selectionMode: string;
  status: "IN_PROGRESS" | "COMPLETED";
  totalQuestions?: number;
  totalScore?: number;
  questions?: QuestionDTO[]; // Trả về lúc IN_PROGRESS
  correctAnswers?: number;
  items?: any[]; // Trả về lúc COMPLETED (result items)
  createdAt?: string;
}

// ─── MOCK DATA FALLBACKS ─────────────────────────────────────────────────────

let mockQuizzes: QuizDTO[] = [
  { id: 801, title: "Kiến trúc ứng dụng web Java", description: "Ôn tập Servlet/JSP", subject: "SWP391", level: "Medium", questions: 10, bestScore: 85, attempts: 2 },
  { id: 802, title: "Lập trình điều khiển mạch ESP32", description: "Sensor & IoT logic", subject: "SWR302", level: "Hard", questions: 8, bestScore: 0, attempts: 0 }
];

let mockTestResult: TestDTO | null = null;
let mockQuestions: QuestionDTO[] = [
  {
    id: 811,
    questionText: "Yêu cầu phần mềm tốt cần có đặc điểm nào?",
    questionType: "SINGLE_CHOICE",
    explanation: "Yêu cầu nên rõ ràng, đầy đủ, nhất quán và kiểm thử được.",
    options: [
      { id: 821, questionId: 811, optionText: "Rõ ràng và kiểm thử được", isCorrect: true },
      { id: 822, questionId: 811, optionText: "Càng mơ hồ càng tốt", isCorrect: false },
      { id: 823, questionId: 811, optionText: "Chỉ cần Dev hiểu là đủ", isCorrect: false },
      { id: 824, questionId: 811, optionText: "Không cần tài liệu", isCorrect: false }
    ]
  },
  {
    id: 812,
    questionText: "Mô hình MVC gồm các thành phần nào?",
    questionType: "SINGLE_CHOICE",
    explanation: "Model-View-Controller.",
    options: [
      { id: 825, questionId: 812, optionText: "Model-View-Controller", isCorrect: true },
      { id: 826, questionId: 812, optionText: "Micro-View-Component", isCorrect: false },
      { id: 827, questionId: 812, optionText: "Module-View-Class", isCorrect: false }
    ]
  }
];

export const quizService = {

  // ─── 1. MARKETPLACE & ADMIN QUIZ ──────────────────────────────────────────

  async reviewQuiz(id: number, voteResult: string, reviewNote: string) {
    try {
      return await qRequest(`/admin/marketplace/quizzes/${id}/review`, {
        method: "POST", body: JSON.stringify({ voteResult, reviewNote })
      });
    } catch {
      return new Promise((res) => setTimeout(() => res({ success: true, message: "Success" }), 300));
    }
  },

  async getMarketplaceQuizzes() {
    try {
      return await qRequest(`/marketplace/quizzes`);
    } catch {
      return new Promise((res) => setTimeout(() => res({ success: true, data: { items: mockQuizzes } }), 300));
    }
  },

  async cloneQuiz(id: number, targetNotebookId: number) {
    try {
      return await qRequest(`/marketplace/quizzes/${id}/clone`, {
        method: "POST", body: JSON.stringify({ targetNotebookId })
      });
    } catch {
      return new Promise((res) => setTimeout(() => res({ success: true, message: "Cloned successfully" }), 300));
    }
  },

  async submitQuizToMarketplace(id: number) {
    try {
      return await qRequest(`/marketplace/quizzes/${id}/submit`, { method: "POST" });
    } catch {
      return new Promise((res) => setTimeout(() => res({ success: true, message: "Success" }), 300));
    }
  },

  // ─── 2. QUIZ MANAGEMENT (CRUD QUIZ) ────────────────────────────────────────

  async getQuizzes(): Promise<ApiResponse<PaginatedResponse<QuizDTO>>> {
    try {
      return await qRequest(`/quizzes`);
    } catch {
      return new Promise((res) => setTimeout(() => {
        res({
          success: true,
          message: "Success",
          data: { items: mockQuizzes, page: 0, size: 10, totalElements: mockQuizzes.length, totalPages: 1 }
        });
      }, 400));
    }
  },

  async createQuiz(payload: any) {
    try {
      return await qRequest(`/quizzes`, { method: "POST", body: JSON.stringify(payload) });
    } catch {
      return new Promise((res) => setTimeout(() => res({ success: true, data: { id: Date.now(), ...payload } }), 300));
    }
  },

  async generateAiQuiz(payload: any) {
    try {
      return await qRequest(`/quizzes/generate`, { method: "POST", body: JSON.stringify(payload) });
    } catch {
      return new Promise((res) => setTimeout(() => res({ success: true, data: { id: Date.now(), ...payload } }), 1000));
    }
  },

  async getQuizDetails(id: number) {
    try {
      return await qRequest(`/quizzes/${id}`);
    } catch {
      return new Promise((res) => setTimeout(() => res({ success: true, data: mockQuizzes.find(q => q.id === id) || mockQuizzes[0] }), 200));
    }
  },

  async updateQuiz(id: number, payload: any) {
    try {
      return await qRequest(`/quizzes/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    } catch {
      return new Promise((res) => setTimeout(() => res({ success: true, data: { id, ...payload } }), 300));
    }
  },

  async deleteQuiz(id: number) {
    try {
      return await qRequest(`/quizzes/${id}`, { method: "DELETE" });
    } catch {
      return new Promise((res) => setTimeout(() => {
        mockQuizzes = mockQuizzes.filter(q => q.id !== id);
        res({ success: true });
      }, 300));
    }
  },

  // ─── 3. QUESTIONS & OPTIONS MANAGEMENT ─────────────────────────────────────

  async getQuizQuestions(quizId: number) {
    try {
      return await qRequest(`/quizzes/${quizId}/questions`);
    } catch {
      return new Promise((res) => setTimeout(() => res({ success: true, data: mockQuestions }), 200));
    }
  },

  async addQuestionToQuiz(quizId: number, payload: any) {
    try {
      return await qRequest(`/quizzes/${quizId}/questions`, { method: "POST", body: JSON.stringify(payload) });
    } catch {
      return new Promise((res) => setTimeout(() => res({ success: true, data: { id: Date.now(), quizId, ...payload } }), 300));
    }
  },

  async updateQuestion(questionId: number, payload: any) {
    try {
      return await qRequest(`/questions/${questionId}`, { method: "PUT", body: JSON.stringify(payload) });
    } catch {
      return new Promise((res) => setTimeout(() => res({ success: true, data: { id: questionId, ...payload } }), 300));
    }
  },

  async deleteQuestion(questionId: number) {
    try {
      return await qRequest(`/questions/${questionId}`, { method: "DELETE" });
    } catch {
      return new Promise((res) => setTimeout(() => res({ success: true }), 300));
    }
  },

  async addOptionToQuestion(questionId: number, payload: any) {
    try {
      return await qRequest(`/questions/${questionId}/options`, { method: "POST", body: JSON.stringify(payload) });
    } catch {
      return new Promise((res) => setTimeout(() => res({ success: true, data: { id: Date.now(), questionId, ...payload } }), 300));
    }
  },

  async updateOption(optionId: number, payload: any) {
    try {
      return await qRequest(`/options/${optionId}`, { method: "PUT", body: JSON.stringify(payload) });
    } catch {
      return new Promise((res) => setTimeout(() => res({ success: true, data: { id: optionId, ...payload } }), 300));
    }
  },

  async deleteOption(optionId: number) {
    try {
      return await qRequest(`/options/${optionId}`, { method: "DELETE" });
    } catch {
      return new Promise((res) => setTimeout(() => res({ success: true }), 300));
    }
  },

  // ─── 4. TEST EXECUTION (LUỒNG LÀM BÀI) ─────────────────────────────────────

  async startTest(quizId: number, payload: any): Promise<ApiResponse<TestDTO>> {
    try {
      return await qRequest(`/quizzes/${quizId}/tests`, { method: "POST", body: JSON.stringify(payload) });
    } catch {
      return new Promise((res) => setTimeout(() => {
        const testObj: TestDTO = {
          id: Date.now(),
          quizId,
          userId: 1,
          title: "Attempt - " + quizId,
          duration: payload.duration || 30,
          selectionMode: payload.selectionMode || "ALL",
          status: "IN_PROGRESS",
          totalQuestions: mockQuestions.length,
          questions: mockQuestions.map(q => ({
            ...q,
            options: q.options.map(o => ({ id: o.id, questionId: o.questionId, optionText: o.optionText })) // Hide isCorrect
          }))
        };
        mockTestResult = testObj;
        res({ success: true, message: "Test created", data: testObj });
      }, 500));
    }
  },

  async getTestDetails(testId: number) {
    try {
      return await qRequest(`/tests/${testId}`);
    } catch {
      return new Promise((res) => setTimeout(() => res({ success: true, data: mockTestResult }), 200));
    }
  },

  async saveTestAnswer(testId: number, payload: { questionId: number; selectedOptionId: number; userAnswerText?: string }) {
    try {
      return await qRequest(`/tests/${testId}/answers`, { method: "POST", body: JSON.stringify(payload) });
    } catch {
      // Logic mock không thực sự lưu db, chỉ trả về OK
      return new Promise((res) => setTimeout(() => res({
        success: true,
        data: { testId, questionId: payload.questionId, isCorrect: Math.random() > 0.5, answeredAt: new Date().toISOString() }
      }), 100));
    }
  },

  async submitTest(testId: number, payload: { confirmSubmit: boolean }): Promise<ApiResponse<TestDTO>> {
    try {
      return await qRequest(`/tests/${testId}/submit`, { method: "POST", body: JSON.stringify(payload) });
    } catch {
      return new Promise((res) => setTimeout(() => {
        if (mockTestResult) {
          mockTestResult.status = "COMPLETED";
          mockTestResult.totalScore = 8.5;
          mockTestResult.correctAnswers = 1;
        }
        res({
          success: true, message: "Test submitted", data: {
            testId,
            quizId: mockTestResult?.quizId || 801,
            totalScore: 8.5,
            correctAnswers: 1,
            totalQuestions: mockQuestions.length,
            status: "COMPLETED"
          } as unknown as TestDTO
        });
      }, 600));
    }
  },

  async getTestResult(testId: number): Promise<ApiResponse<TestDTO>> {
    try {
      return await qRequest(`/tests/${testId}/result`);
    } catch {
      return new Promise((res) => setTimeout(() => {
        res({
          success: true,
          message: "Success",
          data: {
            testId,
            quizId: mockTestResult?.quizId || 801,
            userId: 1,
            title: "Result",
            duration: 30,
            selectionMode: "ALL",
            totalScore: 8.5,
            correctAnswers: 1,
            totalQuestions: mockQuestions.length,
            status: "COMPLETED",
            items: mockQuestions.map((q, idx) => ({
              questionId: q.id,
              isCorrect: idx === 0, // Mock câu 1 đúng, câu 2 sai
              selectedOptionId: q.options[0].id,
              explanation: q.explanation
            }))
          } as unknown as TestDTO
        });
      }, 300));
    }
  }

};