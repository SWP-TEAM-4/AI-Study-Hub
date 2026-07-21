import { ApiResponse, PaginatedResponse } from "./types";
import { safeLocalStorage } from "../utils/safeStorage";
import { safeParseJson } from "../utils/safeParseJson";

const BASE_URL = "/api";

type Visibility = "PRIVATE" | "PUBLIC_LINK" | "MARKETPLACE";
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
  clonedFromId?: number | null;
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
  const token = safeLocalStorage.getItem("auth_token");
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token.replace(/['\"]+/g, "")}`);
  }

  const method = (options.method || "GET").toUpperCase();
  if (!headers.has("Content-Type") && method !== "GET" && method !== "DELETE") {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const text = await response.text();
  let result: any = {};
  try {
    result = safeParseJson(text, {});
  } catch {
    throw {
      status: response.status,
      message: response.ok ? "Backend trả về JSON không hợp lệ" : (text || "Lỗi giao tiếp API Flashcard"),
      errorCode: "INVALID_RESPONSE",
    };
  }

  if (response.status === 401) {
    safeLocalStorage.removeItem("auth_token");
    safeLocalStorage.removeItem("auth_user");
    safeLocalStorage.removeItem("auth-storage");
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    throw { status: 401, message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại." };
  }

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
    note: string,
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
