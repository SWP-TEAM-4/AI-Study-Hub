// ─────────────────────────────────────────────────────────────────────────────
// flashcardService.ts  –  Kết nối với Backend Flashcard API
// Base URL: http://localhost:8080/api
// Owner: BE3 – Controller: FlashcardDeckController, FlashcardController
// ─────────────────────────────────────────────────────────────────────────────
//
// 📌 API endpoints (từ ai_study_hub_full_api_contract.html):
//   GET    /api/flashcard-decks                  → List decks (phân trang)
//   POST   /api/flashcard-decks                  → Tạo deck mới
//   GET    /api/flashcard-decks/{id}             → Chi tiết deck + cards
//   PUT    /api/flashcard-decks/{id}             → Cập nhật deck
//   DELETE /api/flashcard-decks/{id}             → Xóa deck
//   POST   /api/flashcard-decks/{deckId}/cards   → Thêm card vào deck
//   DELETE /api/flashcards/{cardId}              → Xóa card
//   PUT    /api/flashcards/{cardId}              → Sửa card
//
// 📌 MSW đã mock sẵn 16 endpoints → gọi fetch() là chạy!
// ─────────────────────────────────────────────────────────────────────────────

import type { ApiResponse } from "./authService";

const BASE_URL = "http://localhost:8080/api";

// ─── TypeScript Interfaces (copy từ API contract response) ────────────────────

/** Flashcard card — 1 thẻ nhớ trong deck */
export interface FlashcardCard {
  id: number;
  deckId: number;
  frontText: string;
  backText: string;
}

/** Flashcard deck — 1 bộ thẻ nhớ */
export interface FlashcardDeck {
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
  createdAt: string;
  cards: FlashcardCard[];
}


/** Visibility types — giống quiz */
export type Visibility = "PRIVATE" | "PUBLIC_LINK" | "MARKETPLACE";

/** Market status types — giống quiz */
export type MarketStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

/** Pagination wrapper */
export interface PaginatedData<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/** Search params cho list decks */
export interface FlashcardSearchParams {
  keyword?: string;
  visibility?: Visibility;
  page?: number;
  size?: number;
  sort?: string;
}

/** Request tạo/cập nhật deck */
export interface FlashcardDeckRequest {
  title: string;
  notebookId?: number | null;
  subjectId?: number | null;
  visibility?: Visibility;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleFlashcardError(
  response: Response,
  fallback: string
): Promise<never> {
  let body: ApiResponse<unknown> | null = null;
  try {
    body = await response.json();
  } catch {
    // body không phải JSON
  }
  throw new Error(body?.message || fallback);
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * GET /api/flashcard-decks
 * Lấy danh sách flashcard decks (có phân trang).
 */
export async function searchMyDecks(
  params: FlashcardSearchParams = {}
): Promise<PaginatedData<FlashcardDeck>> {
  const qs = new URLSearchParams();
  if (params.keyword) qs.set("keyword", params.keyword);
  if (params.visibility) qs.set("visibility", params.visibility);
  if (params.page !== undefined) qs.set("page", String(params.page));
  if (params.size !== undefined) qs.set("size", String(params.size));
  if (params.sort) qs.set("sort", params.sort);

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/flashcard-decks?${qs}`, {
      headers: getAuthHeaders(),
    });
  } catch {
    throw new Error("Không thể kết nối đến server.");
  }

  if (!response.ok) {
    await handleFlashcardError(response, "Lấy danh sách deck thất bại.");
  }

  const body: ApiResponse<PaginatedData<FlashcardDeck>> = await response.json();
  return body.data!;
}

/**
 * GET /api/flashcard-decks/:id
 * Xem chi tiết deck + danh sách cards.
 */
export async function getDeckById(id: number): Promise<FlashcardDeck> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/flashcard-decks/${id}`, {
      headers: getAuthHeaders(),
    });
  } catch {
    throw new Error("Không thể kết nối đến server.");
  }

  if (!response.ok) {
    await handleFlashcardError(response, "Không tìm thấy deck.");
  }

  const body: ApiResponse<FlashcardDeck> = await response.json();
  return body.data!;
}

/**
 * POST /api/flashcard-decks
 * Tạo deck mới.
 */
export async function createDeck(
  request: FlashcardDeckRequest
): Promise<FlashcardDeck> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/flashcard-decks`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    });
  } catch {
    throw new Error("Không thể kết nối đến server.");
  }

  if (!response.ok) {
    await handleFlashcardError(response, "Tạo deck thất bại.");
  }

  const body: ApiResponse<FlashcardDeck> = await response.json();
  return body.data!;
}

/**
 * PUT /api/flashcard-decks/:id
 * Cập nhật deck.
 */
export async function updateDeck(
  id: number,
  request: FlashcardDeckRequest
): Promise<FlashcardDeck> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/flashcard-decks/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    });
  } catch {
    throw new Error("Không thể kết nối đến server.");
  }

  if (!response.ok) {
    await handleFlashcardError(response, "Cập nhật deck thất bại.");
  }

  const body: ApiResponse<FlashcardDeck> = await response.json();
  return body.data!;
}

/**
 * DELETE /api/flashcard-decks/:id
 * Xóa deck.
 */
export async function deleteDeck(id: number): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/flashcard-decks/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  } catch {
    throw new Error("Không thể kết nối đến server.");
  }

  if (!response.ok) {
    await handleFlashcardError(response, "Xóa deck thất bại.");
  }
}

/**
 * POST /api/flashcard-decks/:deckId/cards
 * Thêm card mới vào deck.
 */
export async function addCardToDeck(
  deckId: number,
  frontText: string,
  backText: string
): Promise<FlashcardDeck> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/flashcard-decks/${deckId}/cards`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ frontText, backText }),
    });
  } catch {
    throw new Error("Không thể kết nối đến server.");
  }

  if (!response.ok) {
    await handleFlashcardError(response, "Thêm card thất bại.");
  }

  const body: ApiResponse<FlashcardDeck> = await response.json();
  return body.data!;
}

/**
 * DELETE /api/flashcards/:cardId
 * Xóa 1 card.
 */
export async function deleteCard(cardId: number): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/flashcards/${cardId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  } catch {
    throw new Error("Không thể kết nối đến server.");
  }

  if (!response.ok) {
    await handleFlashcardError(response, "Xóa card thất bại.");
  }
}
