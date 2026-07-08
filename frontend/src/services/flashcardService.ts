import { ApiResponse, PaginatedResponse } from "./types";

const BASE_URL = "/api";

type Visibility = "PRIVATE" | "WORKSPACE" | "MARKETPLACE";
type MarketStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

export interface FlashcardDTO {
  id: number;
  deckId: number;
  frontText: string;
  backText: string;
}

export interface FlashcardDeckDTO {
  id: number;
  userId: number;
  notebookId: number | null;
  subjectId: number | null;
  title: string;
  visibility: Visibility;
  marketStatus: MarketStatus;
  downloadCount: number;
  reviewCount: number;
  acceptPercentage: number;
<<<<<<< HEAD
  clonedFromId?: number | null;
=======
<<<<<<< HEAD
  clonedFromId?: number | null;
=======
  clonedFromId: number | null;
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
  createdAt: string;
  cards: FlashcardDTO[];
}

export interface FlashcardDeckPayload {
  title: string;
  notebookId?: number | null;
  subjectId?: number | null;
  visibility?: Visibility;
}

export interface FlashcardProgressDTO {
  deckId: number;
  reviewedCards: number;
  totalCards: number;
  rememberedRate: number;
}

export interface ReviewCardResponseDTO {
  flashcardId: number;
  boxLevel: number;
  lastReviewed: string;
  nextReviewAt: string;
}

export interface MarketplaceFlashcardDeckDTO {
  targetType: "FLASHCARD_DECK";
  targetId: number;
  title: string;
  subjectId: number | null;
  creatorName: string;
  downloadCount: number;
  reviewCount: number;
  acceptPercentage: number;
  marketStatus: "APPROVED";
  visibility: "MARKETPLACE";
}

<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
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

async function flashcardRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
  const result = text ? JSON.parse(text) : {};

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      localStorage.removeItem("auth-storage");
      window.location.href = "/";
<<<<<<< HEAD
    }
=======
=======
export interface CreateFlashcardDeckRequest {
  title: string;
  notebookId?: number;
  subjectId?: number;
  visibility?: "PRIVATE" | "WORKSPACE" | "MARKETPLACE";
}

// ─── BASE REQUEST ────────────────────────────────────────────────────────────

const BASE_URL = "/api";

async function flashcardRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const headers = new Headers(options.headers);
    if (token) {
      const cleanToken = token.replace(/['"]+/g, '');
      headers.set("Authorization", `Bearer ${cleanToken}`);
    }
    if (!headers.has("Content-Type") && options.method !== "GET" && options.method !== "DELETE") {
      headers.set("Content-Type", "application/json");
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
    }

<<<<<<< HEAD
  if (!response.ok) {
    throw {
      status: response.status,
      message: result.message || "Lỗi giao tiếp API Flashcard",
      errorCode: result.errorCode || "FC_ERROR",
    };
  }

  return result;
}

function normalizeDeck(deck: FlashcardDeckDTO): FlashcardDeckDTO {
  return {
    ...deck,
    cards: deck.cards ?? [],
    visibility: deck.visibility ?? "PRIVATE",
    marketStatus: deck.marketStatus ?? "NONE",
    downloadCount: deck.downloadCount ?? 0,
    reviewCount: deck.reviewCount ?? 0,
    acceptPercentage: deck.acceptPercentage ?? 0,
  };
}

export const flashcardService = {
  async getMyFlashcardDecks(
    page = 0,
    size = 10,
    keyword = "",
    filters: { subjectId?: number; visibility?: string; marketStatus?: string; sort?: string } = {},
  ): Promise<ApiResponse<PaginatedResponse<FlashcardDeckDTO>>> {
    const res = await flashcardRequest<ApiResponse<PaginatedResponse<FlashcardDeckDTO>>>(
      `/flashcard-decks${toQuery({ page, size, keyword, sort: "createdAt,desc", ...filters })}`,
    );
    return {
      ...res,
      data: {
        ...res.data,
        items: res.data.items.map(normalizeDeck),
      },
    };
  },

  async createFlashcardDeck(payload: FlashcardDeckPayload): Promise<ApiResponse<FlashcardDeckDTO>> {
    const res = await flashcardRequest<ApiResponse<FlashcardDeckDTO>>("/flashcard-decks", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return { ...res, data: normalizeDeck(res.data) };
  },

  async generateFlashcardDeck(payload: {
    notebookId?: number;
    documentId?: number;
    numberOfCards: number;
  }): Promise<ApiResponse<FlashcardDeckDTO>> {
    const res = await flashcardRequest<ApiResponse<FlashcardDeckDTO>>("/flashcard-decks/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return { ...res, data: normalizeDeck(res.data) };
  },

  async getFlashcardDeckDetails(id: number): Promise<ApiResponse<FlashcardDeckDTO>> {
    const res = await flashcardRequest<ApiResponse<FlashcardDeckDTO>>(`/flashcard-decks/${id}`);
    return { ...res, data: normalizeDeck(res.data) };
  },

  async updateFlashcardDeck(id: number, payload: FlashcardDeckPayload): Promise<ApiResponse<FlashcardDeckDTO>> {
    const res = await flashcardRequest<ApiResponse<FlashcardDeckDTO>>(`/flashcard-decks/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return { ...res, data: normalizeDeck(res.data) };
  },

  async deleteFlashcardDeck(id: number): Promise<ApiResponse<{ deleted: boolean }>> {
    return flashcardRequest<ApiResponse<{ deleted: boolean }>>(`/flashcard-decks/${id}`, { method: "DELETE" });
  },

  async addCardToDeck(deckId: number, frontText: string, backText: string): Promise<ApiResponse<FlashcardDeckDTO>> {
    const res = await flashcardRequest<ApiResponse<FlashcardDeckDTO>>(`/flashcard-decks/${deckId}/cards`, {
      method: "POST",
      body: JSON.stringify({ frontText, backText }),
    });
    return { ...res, data: normalizeDeck(res.data) };
  },

  async updateCard(cardId: number, frontText: string, backText: string): Promise<ApiResponse<FlashcardDTO>> {
    return flashcardRequest<ApiResponse<FlashcardDTO>>(`/flashcards/${cardId}`, {
      method: "PUT",
      body: JSON.stringify({ frontText, backText }),
    });
  },

  async deleteCard(cardId: number): Promise<ApiResponse<{ deleted: boolean }>> {
    return flashcardRequest<ApiResponse<{ deleted: boolean }>>(`/flashcards/${cardId}`, { method: "DELETE" });
  },

  async getFlashcardDeckProgress(deckId: number): Promise<ApiResponse<FlashcardProgressDTO>> {
    return flashcardRequest<ApiResponse<FlashcardProgressDTO>>(`/flashcard-decks/${deckId}/progress`);
  },

  async getFlashcardsDue(deckId?: number): Promise<ApiResponse<FlashcardDTO[]>> {
    return flashcardRequest<ApiResponse<FlashcardDTO[]>>(`/flashcards/due${toQuery({ deckId })}`);
  },

  async reviewFlashcard(cardId: number, remembered: boolean): Promise<ApiResponse<ReviewCardResponseDTO>> {
    return flashcardRequest<ApiResponse<ReviewCardResponseDTO>>(`/flashcards/${cardId}/review`, {
      method: "POST",
      body: JSON.stringify({ result: remembered ? "REMEMBERED" : "FORGOT" }),
    });
  },

  async getMarketplaceFlashcardDecks(
    page = 0,
    size = 10,
    keyword = "",
  ): Promise<ApiResponse<PaginatedResponse<MarketplaceFlashcardDeckDTO>>> {
    return flashcardRequest<ApiResponse<PaginatedResponse<MarketplaceFlashcardDeckDTO>>>(
      `/marketplace/flashcard-decks${toQuery({ page, size, keyword })}`,
    );
  },

  async submitToMarketplace(
    id: number,
    note = "Submit for marketplace review",
  ): Promise<ApiResponse<FlashcardDeckDTO>> {
    const res = await flashcardRequest<ApiResponse<FlashcardDeckDTO>>(`/marketplace/flashcard-decks/${id}/submit`, {
      method: "POST",
      body: JSON.stringify({ note }),
    });
    return { ...res, data: normalizeDeck(res.data) };
  },

  async cloneMarketplaceDeck(id: number, targetNotebookId?: number): Promise<ApiResponse<FlashcardDeckDTO>> {
    const res = await flashcardRequest<ApiResponse<FlashcardDeckDTO>>(`/marketplace/flashcard-decks/${id}/clone`, {
      method: "POST",
      body: JSON.stringify({ targetNotebookId }),
    });
    return { ...res, data: normalizeDeck(res.data) };
  },

  async reviewMarketplaceDeck(
    id: number,
    payload: { voteResult: "APPROVED" | "REJECTED"; reviewNote?: string },
  ): Promise<ApiResponse<any>> {
    return flashcardRequest(`/reviewer/marketplace/FLASHCARD_DECK/${id}/vote`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
=======
    const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
    const text = await response.text();
    let result: any = {};
    if (text && text.trim().length > 0) {
      try { result = JSON.parse(text); } catch { result = { message: text.substring(0, 200) }; }
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
        message: result.message || "Lỗi giao tiếp API Flashcard",
        errorCode: result.errorCode || "FC_ERROR"
      };
    }
    return result;
  } catch (err: any) {
    if (err && typeof err.status === "number") throw err;
    throw { status: 500, message: err?.message || "Không thể kết nối đến máy chủ" };
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
  }

<<<<<<< HEAD
  if (!response.ok) {
    throw {
      status: response.status,
      message: result.message || "Lỗi giao tiếp API Flashcard",
      errorCode: result.errorCode || "FC_ERROR",
    };
  }

  return result;
}

function normalizeDeck(deck: FlashcardDeckDTO): FlashcardDeckDTO {
  return {
    ...deck,
    cards: deck.cards ?? [],
    visibility: deck.visibility ?? "PRIVATE",
    marketStatus: deck.marketStatus ?? "NONE",
    downloadCount: deck.downloadCount ?? 0,
    reviewCount: deck.reviewCount ?? 0,
    acceptPercentage: deck.acceptPercentage ?? 0,
  };
}

export const flashcardService = {
  async getMyFlashcardDecks(
    page = 0,
    size = 10,
    keyword = "",
    filters: { subjectId?: number; visibility?: string; marketStatus?: string; sort?: string } = {},
  ): Promise<ApiResponse<PaginatedResponse<FlashcardDeckDTO>>> {
    const res = await flashcardRequest<ApiResponse<PaginatedResponse<FlashcardDeckDTO>>>(
      `/flashcard-decks${toQuery({ page, size, keyword, sort: "createdAt,desc", ...filters })}`,
    );
    return {
      ...res,
      data: {
        ...res.data,
        items: res.data.items.map(normalizeDeck),
      },
    };
  },

  async createFlashcardDeck(payload: FlashcardDeckPayload): Promise<ApiResponse<FlashcardDeckDTO>> {
    const res = await flashcardRequest<ApiResponse<FlashcardDeckDTO>>("/flashcard-decks", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return { ...res, data: normalizeDeck(res.data) };
  },

  async generateFlashcardDeck(payload: {
    notebookId?: number;
    documentId?: number;
    numberOfCards: number;
  }): Promise<ApiResponse<FlashcardDeckDTO>> {
    const res = await flashcardRequest<ApiResponse<FlashcardDeckDTO>>("/flashcard-decks/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return { ...res, data: normalizeDeck(res.data) };
  },

  async getFlashcardDeckDetails(id: number): Promise<ApiResponse<FlashcardDeckDTO>> {
    const res = await flashcardRequest<ApiResponse<FlashcardDeckDTO>>(`/flashcard-decks/${id}`);
    return { ...res, data: normalizeDeck(res.data) };
  },

  async updateFlashcardDeck(id: number, payload: FlashcardDeckPayload): Promise<ApiResponse<FlashcardDeckDTO>> {
    const res = await flashcardRequest<ApiResponse<FlashcardDeckDTO>>(`/flashcard-decks/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return { ...res, data: normalizeDeck(res.data) };
  },

  async deleteFlashcardDeck(id: number): Promise<ApiResponse<{ deleted: boolean }>> {
    return flashcardRequest<ApiResponse<{ deleted: boolean }>>(`/flashcard-decks/${id}`, { method: "DELETE" });
  },

  async addCardToDeck(deckId: number, frontText: string, backText: string): Promise<ApiResponse<FlashcardDeckDTO>> {
    const res = await flashcardRequest<ApiResponse<FlashcardDeckDTO>>(`/flashcard-decks/${deckId}/cards`, {
      method: "POST",
      body: JSON.stringify({ frontText, backText }),
    });
    return { ...res, data: normalizeDeck(res.data) };
  },

  async updateCard(cardId: number, frontText: string, backText: string): Promise<ApiResponse<FlashcardDTO>> {
    return flashcardRequest<ApiResponse<FlashcardDTO>>(`/flashcards/${cardId}`, {
      method: "PUT",
      body: JSON.stringify({ frontText, backText }),
    });
  },

  async deleteCard(cardId: number): Promise<ApiResponse<{ deleted: boolean }>> {
    return flashcardRequest<ApiResponse<{ deleted: boolean }>>(`/flashcards/${cardId}`, { method: "DELETE" });
  },

  async getFlashcardDeckProgress(deckId: number): Promise<ApiResponse<FlashcardProgressDTO>> {
    return flashcardRequest<ApiResponse<FlashcardProgressDTO>>(`/flashcard-decks/${deckId}/progress`);
  },

  async getFlashcardsDue(deckId?: number): Promise<ApiResponse<FlashcardDTO[]>> {
    return flashcardRequest<ApiResponse<FlashcardDTO[]>>(`/flashcards/due${toQuery({ deckId })}`);
  },

  async reviewFlashcard(cardId: number, remembered: boolean): Promise<ApiResponse<ReviewCardResponseDTO>> {
    return flashcardRequest<ApiResponse<ReviewCardResponseDTO>>(`/flashcards/${cardId}/review`, {
      method: "POST",
      body: JSON.stringify({ result: remembered ? "REMEMBERED" : "FORGOT" }),
    });
  },

  async getMarketplaceFlashcardDecks(
    page = 0,
    size = 10,
    keyword = "",
  ): Promise<ApiResponse<PaginatedResponse<MarketplaceFlashcardDeckDTO>>> {
    return flashcardRequest<ApiResponse<PaginatedResponse<MarketplaceFlashcardDeckDTO>>>(
      `/marketplace/flashcard-decks${toQuery({ page, size, keyword })}`,
    );
  },

  async submitToMarketplace(
    id: number,
    note = "Submit for marketplace review",
  ): Promise<ApiResponse<FlashcardDeckDTO>> {
    const res = await flashcardRequest<ApiResponse<FlashcardDeckDTO>>(`/marketplace/flashcard-decks/${id}/submit`, {
      method: "POST",
      body: JSON.stringify({ note }),
    });
    return { ...res, data: normalizeDeck(res.data) };
  },

  async cloneMarketplaceDeck(id: number, targetNotebookId?: number): Promise<ApiResponse<FlashcardDeckDTO>> {
    const res = await flashcardRequest<ApiResponse<FlashcardDeckDTO>>(`/marketplace/flashcard-decks/${id}/clone`, {
      method: "POST",
      body: JSON.stringify({ targetNotebookId }),
    });
    return { ...res, data: normalizeDeck(res.data) };
  },

  async reviewMarketplaceDeck(
    id: number,
    payload: { voteResult: "APPROVED" | "REJECTED"; reviewNote?: string },
  ): Promise<ApiResponse<any>> {
    return flashcardRequest(`/reviewer/marketplace/FLASHCARD_DECK/${id}/vote`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
=======
// ─── SERVICE IMPLEMENTATION ──────────────────────────────────────────────────

export const flashcardService = {

  // ─── 1. QUẢN LÝ BỘ THẺ (DECKS) ───

  async getMyFlashcardDecks(params: {
    keyword?: string;
    subjectId?: number;
    visibility?: string;
    marketStatus?: string;
    page?: number;
    size?: number;
    sort?: string;
  } = {}): Promise<ApiResponse<PaginatedResponse<FlashcardDeckDTO>>> {
    const query = new URLSearchParams();
    if (params.keyword) query.append("keyword", params.keyword);
    if (params.subjectId !== undefined) query.append("subjectId", String(params.subjectId));
    if (params.visibility) query.append("visibility", params.visibility);
    if (params.marketStatus) query.append("marketStatus", params.marketStatus);
    query.append("page", String(params.page ?? 0));
    query.append("size", String(params.size ?? 10));
    query.append("sort", params.sort ?? "createdAt,desc");

    return await flashcardRequest<ApiResponse<PaginatedResponse<FlashcardDeckDTO>>>(`/flashcard-decks?${query.toString()}`, { method: "GET" });
  },

  async createFlashcardDeck(payload: CreateFlashcardDeckRequest): Promise<ApiResponse<FlashcardDeckDTO>> {
    return await flashcardRequest(`/flashcard-decks`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  async generateFlashcardDeck(payload: { notebookId?: number; documentId?: number; numberOfCards: number }): Promise<ApiResponse<FlashcardDeckDTO>> {
    return await flashcardRequest(`/flashcard-decks/generate`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  async getFlashcardDeckDetails(id: number): Promise<ApiResponse<FlashcardDeckDTO>> {
    return await flashcardRequest(`/flashcard-decks/${id}`, { method: "GET" });
  },

  async updateFlashcardDeck(id: number, payload: { title?: string; notebookId?: number; subjectId?: number; visibility?: string }): Promise<ApiResponse<FlashcardDeckDTO>> {
    return await flashcardRequest(`/flashcard-decks/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  },

  async deleteFlashcardDeck(id: number): Promise<ApiResponse<any>> {
    return await flashcardRequest(`/flashcard-decks/${id}`, { method: "DELETE" });
  },

  // ─── 2. QUẢN LÝ THẺ CHI TIẾT (CARDS) ───

  async addCardToDeck(deckId: number, frontText: string, backText: string): Promise<ApiResponse<FlashcardDeckDTO>> {
    return await flashcardRequest(`/flashcard-decks/${deckId}/cards`, {
      method: "POST",
      body: JSON.stringify({ frontText, backText })
    });
  },

  async updateCard(cardId: number, frontText: string, backText: string): Promise<ApiResponse<FlashcardDTO>> {
    return await flashcardRequest(`/flashcards/${cardId}`, {
      method: "PUT",
      body: JSON.stringify({ frontText, backText })
    });
  },

  async deleteCard(cardId: number): Promise<ApiResponse<any>> {
    return await flashcardRequest(`/flashcards/${cardId}`, { method: "DELETE" });
  },

  // ─── 3. TIẾN ĐỘ & ÔN TẬP (SPACED REPETITION) ───

  async getFlashcardDeckProgress(deckId: number, subjectId?: number): Promise<ApiResponse<FlashcardProgressDTO>> {
    const url = subjectId ? `/flashcard-decks/${deckId}/progress?subjectId=${subjectId}` : `/flashcard-decks/${deckId}/progress`;
    return await flashcardRequest<ApiResponse<FlashcardProgressDTO>>(url, { method: "GET" });
  },

  async getFlashcardsDue(deckId?: number): Promise<ApiResponse<FlashcardDTO[]>> {
    const url = deckId ? `/flashcards/due?deckId=${deckId}` : `/flashcards/due`;
    return await flashcardRequest<ApiResponse<FlashcardDTO[]>>(url, { method: "GET" });
  },

  async reviewFlashcard(cardId: number, isKnown: boolean): Promise<ApiResponse<ReviewCardResponseDTO>> {
    // Chuẩn hóa Request Body theo Swagger: { "result": "REMEMBERED" }
    return await flashcardRequest(`/flashcards/${cardId}/review`, {
      method: "POST",
      body: JSON.stringify({
        result: isKnown ? "REMEMBERED" : "AGAIN"
      })
    });
  },

  // ─── 4. MARKETPLACE FLASHCARD DECKS ───

  async getMarketplaceFlashcardDecks(page = 0, size = 10, keyword = ""): Promise<ApiResponse<PaginatedResponse<FlashcardDeckDTO>>> {
    const query = new URLSearchParams();
    if (keyword) query.set("keyword", keyword);
    query.set("page", String(page));
    query.set("size", String(size));
    query.set("sort", "createdAt,desc");
    return await flashcardRequest<ApiResponse<PaginatedResponse<FlashcardDeckDTO>>>(`/marketplace/flashcard-decks?${query.toString()}`, { method: "GET" });
  },

  async cloneMarketplaceDeck(id: number, targetNotebookId?: number): Promise<ApiResponse<FlashcardDeckDTO>> {
    return await flashcardRequest(`/marketplace/flashcard-decks/${id}/clone`, {
      method: "POST",
      body: JSON.stringify({ targetNotebookId })
    });
  },

  async submitToMarketplace(id: number): Promise<ApiResponse<FlashcardDeckDTO>> {
    return await flashcardRequest(`/marketplace/flashcard-decks/${id}/submit`, {
      method: "POST",
      body: JSON.stringify({ note: "Submit for marketplace review" })
    });
  },

  async reviewMarketplaceDeck(id: number, payload: { voteResult: "APPROVED" | "REJECTED"; reviewNote?: string }): Promise<ApiResponse<any>> {
    return await flashcardRequest(`/admin/marketplace/flashcard-decks/${id}/review`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }
};
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
