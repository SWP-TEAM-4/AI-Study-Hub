// ─────────────────────────────────────────────────────────────────────────────
// quizHandlers.ts – Mock handlers cho Quiz API
// Endpoints: GET/POST /api/quizzes, GET/PUT/DELETE /api/quizzes/:id
// ─────────────────────────────────────────────────────────────────────────────

import { http, HttpResponse, delay } from "msw";
import { mockQuizzes, getNextQuizId } from "../data/mockQuizzes";
import type { MockQuiz } from "../data/mockQuizzes";
import type { Visibility, MarketStatus } from "../../services/quizService";

// ─── Helper: Kiểm tra Bearer token (mock) ────────────────────────────────────

function extractToken(request: Request): string | null {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

function unauthorizedResponse() {
  return HttpResponse.json(
    {
      success: false,
      message: "Phiên đăng nhập đã hết hạn",
      errorCode: "UNAUTHORIZED",
    },
    { status: 401 }
  );
}

// ─── Quiz Handlers ────────────────────────────────────────────────────────────

export const quizHandlers = [
  // ── GET /api/quizzes – Search + Pagination ──────────────────────────────────
  http.get("http://localhost:8080/api/quizzes", async ({ request }) => {
    await delay(350);

    if (!extractToken(request)) return unauthorizedResponse();

    const url = new URL(request.url);
    const keyword = url.searchParams.get("keyword")?.toLowerCase();
    const examType = url.searchParams.get("examType");
    const visibility = url.searchParams.get("visibility") as Visibility | null;
    const marketStatus = url.searchParams.get("marketStatus") as MarketStatus | null;
    const subjectId = url.searchParams.get("subjectId");
    const page = parseInt(url.searchParams.get("page") ?? "0", 10);
    const size = parseInt(url.searchParams.get("size") ?? "12", 10);
    const sort = url.searchParams.get("sort") ?? "createdAt,desc";

    // Filter
    let filtered = [...mockQuizzes];

    if (keyword) {
      filtered = filtered.filter(
        (q) =>
          q.title.toLowerCase().includes(keyword) ||
          (q.description?.toLowerCase().includes(keyword) ?? false) ||
          (q.subjectName?.toLowerCase().includes(keyword) ?? false)
      );
    }
    if (examType) {
      filtered = filtered.filter((q) => q.examType === examType);
    }
    if (visibility) {
      filtered = filtered.filter((q) => q.visibility === visibility);
    }
    if (marketStatus) {
      filtered = filtered.filter((q) => q.marketStatus === marketStatus);
    }
    if (subjectId) {
      filtered = filtered.filter((q) => q.subjectId === parseInt(subjectId, 10));
    }

    // Sort
    const [sortField, sortDir] = sort.split(",");
    filtered.sort((a, b) => {
      let valA: string | number = "";
      let valB: string | number = "";

      if (sortField === "createdAt") {
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
      } else if (sortField === "title") {
        valA = a.title.toLowerCase();
        valB = b.title.toLowerCase();
      } else if (sortField === "updatedAt") {
        valA = new Date(a.updatedAt).getTime();
        valB = new Date(b.updatedAt).getTime();
      }

      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    // Paginate
    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const items = filtered.slice(start, start + size);

    return HttpResponse.json(
      {
        success: true,
        message: "Thành công",
        data: {
          items,
          page,
          size,
          totalElements,
          totalPages,
        },
      },
      { status: 200 }
    );
  }),

  // ── GET /api/quizzes/:id – Get quiz by ID ──────────────────────────────────
  http.get(
    "http://localhost:8080/api/quizzes/:id",
    async ({ request, params }) => {
      await delay(250);

      if (!extractToken(request)) return unauthorizedResponse();

      const id = parseInt(params.id as string, 10);
      const quiz = mockQuizzes.find((q) => q.id === id);

      if (!quiz) {
        return HttpResponse.json(
          {
            success: false,
            message: "Không tìm thấy quiz này",
            errorCode: "QUIZ_NOT_FOUND",
          },
          { status: 404 }
        );
      }

      return HttpResponse.json(
        { success: true, message: "Thành công", data: quiz },
        { status: 200 }
      );
    }
  ),

  // ── POST /api/quizzes – Create quiz ─────────────────────────────────────────
  http.post("http://localhost:8080/api/quizzes", async ({ request }) => {
    await delay(400);

    if (!extractToken(request)) return unauthorizedResponse();

    const body = (await request.json()) as {
      title?: string;
      description?: string;
      notebookId?: number;
      subjectId?: number;
      academicTermId?: number;
      examType?: string;
      visibility?: Visibility;
    };

    if (!body.title?.trim()) {
      return HttpResponse.json(
        {
          success: false,
          message: "Tiêu đề không được để trống",
          errorCode: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const newQuiz: MockQuiz = {
      id: getNextQuizId(),
      notebookId: body.notebookId ?? null,
      notebookTitle: null,
      subjectId: body.subjectId ?? null,
      subjectName: null,
      creatorId: 1,
      creatorFullName: "Nguyen Van Anh",
      title: body.title.trim(),
      description: body.description?.trim() ?? null,
      academicTermId: body.academicTermId ?? null,
      academicTermName: null,
      examType: body.examType ?? null,
      visibility: body.visibility ?? "PRIVATE",
      marketStatus: body.visibility === "MARKETPLACE" ? "PENDING" : "NONE",
      downloadCount: 0,
      reviewCount: 0,
      acceptPercentage: null,
      aiVerdictNote: null,
      createdAt: now,
      updatedAt: now,
    };

    mockQuizzes.unshift(newQuiz); // Add to beginning

    return HttpResponse.json(
      { success: true, message: "Tạo quiz thành công", data: newQuiz },
      { status: 201 }
    );
  }),

  // ── PUT /api/quizzes/:id – Update quiz ──────────────────────────────────────
  http.put(
    "http://localhost:8080/api/quizzes/:id",
    async ({ request, params }) => {
      await delay(350);

      if (!extractToken(request)) return unauthorizedResponse();

      const id = parseInt(params.id as string, 10);
      const index = mockQuizzes.findIndex((q) => q.id === id);

      if (index === -1) {
        return HttpResponse.json(
          {
            success: false,
            message: "Không tìm thấy quiz này",
            errorCode: "QUIZ_NOT_FOUND",
          },
          { status: 404 }
        );
      }

      const body = (await request.json()) as {
        title?: string;
        description?: string;
        examType?: string;
        visibility?: Visibility;
      };

      // Merge updates
      const quiz = mockQuizzes[index];
      if (body.title !== undefined) quiz.title = body.title.trim();
      if (body.description !== undefined)
        quiz.description = body.description?.trim() ?? null;
      if (body.examType !== undefined) quiz.examType = body.examType;
      if (body.visibility !== undefined) {
        quiz.visibility = body.visibility;
        if (body.visibility === "MARKETPLACE" && quiz.marketStatus === "NONE") {
          quiz.marketStatus = "PENDING";
        }
      }
      quiz.updatedAt = new Date().toISOString();

      return HttpResponse.json(
        { success: true, message: "Cập nhật quiz thành công", data: quiz },
        { status: 200 }
      );
    }
  ),

  // ── DELETE /api/quizzes/:id – Delete quiz ───────────────────────────────────
  http.delete(
    "http://localhost:8080/api/quizzes/:id",
    async ({ request, params }) => {
      await delay(300);

      if (!extractToken(request)) return unauthorizedResponse();

      const id = parseInt(params.id as string, 10);
      const index = mockQuizzes.findIndex((q) => q.id === id);

      if (index === -1) {
        return HttpResponse.json(
          {
            success: false,
            message: "Không tìm thấy quiz này",
            errorCode: "QUIZ_NOT_FOUND",
          },
          { status: 404 }
        );
      }

      mockQuizzes.splice(index, 1);

      return HttpResponse.json(
        { success: true, message: "Xóa quiz thành công" },
        { status: 200 }
      );
    }
  ),
];
