import { ApiResponse, PaginatedResponse } from "./types";

// ─── DTOs ────────────────────────────────────────────────────────────────────

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
  visibility: "PRIVATE" | "WORKSPACE" | "MARKETPLACE";
  marketStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  downloadCount: number;
  reviewCount: number;
  acceptPercentage: number;
  createdAt: string;
  cards: FlashcardDTO[];
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

// ─── BASE REQUEST ────────────────────────────────────────────────────────────

const BASE_URL = "/api";

async function flashcardRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
      message: result.message || "Lỗi giao tiếp API Flashcard",
      errorCode: result.errorCode || "FC_ERROR"
    };
  }
  return result;
}

// ─── MOCK DATA FALLBACKS ─────────────────────────────────────────────────────

let mockFlashcards: FlashcardDTO[] = [
  { id: 1011, deckId: 1001, frontText: "SRS", backText: "Software Requirements Specification" },
  { id: 1012, deckId: 1001, frontText: "OOP", backText: "Object-Oriented Programming" },
  { id: 1013, deckId: 1001, frontText: "API", backText: "Application Programming Interface" },
  { id: 1014, deckId: 1002, frontText: "React", backText: "A JavaScript library for building user interfaces" },
  { id: 1015, deckId: 1002, frontText: "State", backText: "An object that holds some information that may change over the lifetime of the component" },
];

let mockDecks: FlashcardDeckDTO[] = [
  {
    id: 1001,
    userId: 1,
    notebookId: 101,
    subjectId: 12,
    title: "SWR302 Key Terms",
    visibility: "PRIVATE",
    marketStatus: "NONE",
    downloadCount: 0,
    reviewCount: 0,
    acceptPercentage: 0,
    createdAt: "2026-06-12T22:10:00",
    cards: mockFlashcards.filter(c => c.deckId === 1001)
  },
  {
    id: 1002,
    userId: 1,
    notebookId: 101,
    subjectId: null,
    title: "Frontend Development Basics",
    visibility: "MARKETPLACE",
    marketStatus: "APPROVED",
    downloadCount: 120,
    reviewCount: 45,
    acceptPercentage: 98,
    createdAt: "2026-05-10T10:00:00",
    cards: mockFlashcards.filter(c => c.deckId === 1002)
  }
];

// ─── SERVICE IMPLEMENTATION ──────────────────────────────────────────────────

export const flashcardService = {

  // ─── 1. QUẢN LÝ BỘ THẺ (DECKS) ───

  async getMyFlashcardDecks(page = 0, size = 10, keyword = ""): Promise<ApiResponse<PaginatedResponse<FlashcardDeckDTO>>> {
    try {
      return await flashcardRequest(`/flashcard-decks?page=${page}&size=${size}&keyword=${keyword}`, { method: "GET" });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        let items = mockDecks.filter(d => d.userId === 1);
        if (keyword) {
          items = items.filter(d => d.title.toLowerCase().includes(keyword.toLowerCase()));
        }
        res({ success: true, message: "Success", data: { items, page, size, totalElements: items.length, totalPages: 1 } });
      }, 300));
    }
  },

  async createFlashcardDeck(payload: Partial<FlashcardDeckDTO>): Promise<ApiResponse<FlashcardDeckDTO>> {
    try {
      return await flashcardRequest(`/flashcard-decks`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        const newDeck: FlashcardDeckDTO = {
          id: Date.now(),
          userId: 1,
          notebookId: payload.notebookId || null,
          subjectId: payload.subjectId || null,
          title: payload.title || "Untitled Deck",
          visibility: payload.visibility || "PRIVATE",
          marketStatus: "NONE",
          downloadCount: 0,
          reviewCount: 0,
          acceptPercentage: 0,
          createdAt: new Date().toISOString(),
          cards: []
        };
        mockDecks.unshift(newDeck);
        res({ success: true, message: "Success", data: newDeck });
      }, 400));
    }
  },

  async generateFlashcardDeck(payload: { notebookId?: number, documentId?: number, numberOfCards: number }): Promise<ApiResponse<FlashcardDeckDTO>> {
    try {
      return await flashcardRequest(`/flashcard-decks/generate`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        const newDeckId = Date.now();
        const newCards: FlashcardDTO[] = Array.from({ length: payload.numberOfCards }).map((_, i) => ({
          id: Date.now() + i,
          deckId: newDeckId,
          frontText: `AI Generated Concept ${i + 1}`,
          backText: `This is an automatically generated definition for concept ${i + 1} using AI.`
        }));
        mockFlashcards.push(...newCards);

        const newDeck: FlashcardDeckDTO = {
          id: newDeckId,
          userId: 1,
          notebookId: payload.notebookId || null,
          subjectId: null,
          title: `AI Generated Flashcards (${payload.numberOfCards} cards)`,
          visibility: "PRIVATE",
          marketStatus: "NONE",
          downloadCount: 0,
          reviewCount: 0,
          acceptPercentage: 0,
          createdAt: new Date().toISOString(),
          cards: newCards
        };
        mockDecks.unshift(newDeck);
        res({ success: true, message: "Success", data: newDeck });
      }, 1500)); // Simulate AI delay
    }
  },

  async getFlashcardDeckDetails(id: number): Promise<ApiResponse<FlashcardDeckDTO>> {
    try {
      return await flashcardRequest(`/flashcard-decks/${id}`, { method: "GET" });
    } catch (e) {
      return new Promise((res, rej) => setTimeout(() => {
        const deck = mockDecks.find(d => d.id === id);
        if (deck) res({ success: true, message: "Success", data: deck });
        else rej({ message: "Not found" });
      }, 200));
    }
  },

  async updateFlashcardDeck(id: number, payload: Partial<FlashcardDeckDTO>): Promise<ApiResponse<FlashcardDeckDTO>> {
    try {
      return await flashcardRequest(`/flashcard-decks/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
    } catch (e) {
      return new Promise((res, rej) => setTimeout(() => {
        const idx = mockDecks.findIndex(d => d.id === id);
        if (idx === -1) return rej({ message: "Not found" });
        mockDecks[idx] = { ...mockDecks[idx], ...payload };
        res({ success: true, message: "Success", data: mockDecks[idx] });
      }, 300));
    }
  },

  async deleteFlashcardDeck(id: number): Promise<ApiResponse<{ deleted: boolean }>> {
    try {
      return await flashcardRequest(`/flashcard-decks/${id}`, { method: "DELETE" });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        mockDecks = mockDecks.filter(d => d.id !== id);
        mockFlashcards = mockFlashcards.filter(c => c.deckId !== id);
        res({ success: true, message: "Deleted successfully", data: { deleted: true } });
      }, 300));
    }
  },

  // ─── 2. QUẢN LÝ THẺ (CARDS) ───

  async addCardToDeck(deckId: number, frontText: string, backText: string): Promise<ApiResponse<FlashcardDeckDTO>> {
    try {
      return await flashcardRequest(`/flashcard-decks/${deckId}/cards`, {
        method: "POST",
        body: JSON.stringify({ frontText, backText })
      });
    } catch (e) {
      return new Promise((res, rej) => setTimeout(() => {
        const idx = mockDecks.findIndex(d => d.id === deckId);
        if (idx === -1) return rej({ message: "Deck not found" });
        const newCard = { id: Date.now(), deckId, frontText, backText };
        mockFlashcards.push(newCard);
        mockDecks[idx].cards.push(newCard);
        res({ success: true, message: "Success", data: mockDecks[idx] });
      }, 300));
    }
  },

  async updateCard(cardId: number, frontText: string, backText: string): Promise<ApiResponse<FlashcardDTO>> {
    try {
      return await flashcardRequest(`/flashcards/${cardId}`, {
        method: "PUT",
        body: JSON.stringify({ frontText, backText })
      });
    } catch (e) {
      return new Promise((res, rej) => setTimeout(() => {
        const cIdx = mockFlashcards.findIndex(c => c.id === cardId);
        if (cIdx === -1) return rej({ message: "Card not found" });
        mockFlashcards[cIdx] = { ...mockFlashcards[cIdx], frontText, backText };
        
        // Update in deck too
        const deck = mockDecks.find(d => d.id === mockFlashcards[cIdx].deckId);
        if (deck) {
          const dCardIdx = deck.cards.findIndex(c => c.id === cardId);
          if (dCardIdx !== -1) deck.cards[dCardIdx] = mockFlashcards[cIdx];
        }

        res({ success: true, message: "Success", data: mockFlashcards[cIdx] });
      }, 300));
    }
  },

  async deleteCard(cardId: number): Promise<ApiResponse<{ deleted: boolean }>> {
    try {
      return await flashcardRequest(`/flashcards/${cardId}`, { method: "DELETE" });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        const card = mockFlashcards.find(c => c.id === cardId);
        if (card) {
          const deck = mockDecks.find(d => d.id === card.deckId);
          if (deck) {
            deck.cards = deck.cards.filter(c => c.id !== cardId);
          }
        }
        mockFlashcards = mockFlashcards.filter(c => c.id !== cardId);
        res({ success: true, message: "Deleted successfully", data: { deleted: true } });
      }, 300));
    }
  },

  // ─── 3. ÔN TẬP (SPACED REPETITION) ───

  async getFlashcardDeckProgress(deckId: number): Promise<ApiResponse<FlashcardProgressDTO>> {
    try {
      return await flashcardRequest(`/flashcard-decks/${deckId}/progress`, { method: "GET" });
    } catch (e) {
      return new Promise((res, rej) => setTimeout(() => {
        const deck = mockDecks.find(d => d.id === deckId);
        if (!deck) return rej({ message: "Not found" });
        res({
          success: true, message: "Success", data: {
            deckId,
            reviewedCards: Math.floor(deck.cards.length / 2),
            totalCards: deck.cards.length,
            rememberedRate: 75
          }
        });
      }, 200));
    }
  },

  async getFlashcardsDue(): Promise<ApiResponse<FlashcardDTO[]>> {
    try {
      return await flashcardRequest(`/flashcards/due`, { method: "GET" });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        // Mock returning a subset of all cards as "due"
        res({ success: true, message: "Success", data: mockFlashcards.slice(0, 3) });
      }, 300));
    }
  },

  async reviewFlashcard(cardId: number, isKnown: boolean): Promise<ApiResponse<ReviewCardResponseDTO>> {
    try {
      return await flashcardRequest(`/flashcards/${cardId}/review`, {
        method: "POST",
        body: JSON.stringify({ isKnown })
      });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        res({
          success: true, message: "Success", data: {
            flashcardId: cardId,
            boxLevel: isKnown ? 2 : 0,
            lastReviewed: new Date().toISOString(),
            nextReviewAt: new Date(Date.now() + (isKnown ? 86400000 * 2 : 3600000)).toISOString()
          }
        });
      }, 100));
    }
  },

  // ─── 4. MARKETPLACE CỘNG ĐỒNG ───

  async getMarketplaceFlashcardDecks(page = 0, size = 10, keyword = ""): Promise<ApiResponse<PaginatedResponse<MarketplaceFlashcardDeckDTO>>> {
    try {
      return await flashcardRequest(`/marketplace/flashcard-decks?page=${page}&size=${size}&keyword=${keyword}`, { method: "GET" });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        let docs = mockDecks.filter(d => d.visibility === "MARKETPLACE" && d.marketStatus === "APPROVED");
        if (keyword) {
          docs = docs.filter(d => d.title.toLowerCase().includes(keyword.toLowerCase()));
        }
        const mapped = docs.map(d => ({
          targetType: "FLASHCARD_DECK" as const,
          targetId: d.id,
          title: d.title,
          subjectId: d.subjectId,
          creatorName: "Mock User",
          downloadCount: d.downloadCount,
          reviewCount: d.reviewCount,
          acceptPercentage: d.acceptPercentage,
          marketStatus: "APPROVED" as const,
          visibility: "MARKETPLACE" as const
        }));
        res({ success: true, message: "Success", data: { items: mapped, page, size, totalElements: mapped.length, totalPages: 1 } });
      }, 300));
    }
  },

  async submitToMarketplace(id: number): Promise<ApiResponse<FlashcardDeckDTO>> {
    try {
      return await flashcardRequest(`/marketplace/flashcard-decks/${id}/submit`, {
        method: "POST",
        body: JSON.stringify({ note: "Submit for marketplace review" })
      });
    } catch (e) {
      return new Promise((res, rej) => setTimeout(() => {
        const docIndex = mockDecks.findIndex(d => d.id === id);
        if (docIndex === -1) return rej({ message: "Not found" });
        mockDecks[docIndex] = { ...mockDecks[docIndex], visibility: "MARKETPLACE", marketStatus: "PENDING" };
        res({ success: true, message: "Submitted successfully", data: mockDecks[docIndex] });
      }, 400));
    }
  },

  async cloneMarketplaceDeck(id: number, targetNotebookId?: number): Promise<ApiResponse<FlashcardDeckDTO>> {
    try {
      return await flashcardRequest(`/marketplace/flashcard-decks/${id}/clone`, {
        method: "POST",
        body: JSON.stringify({ targetNotebookId })
      });
    } catch (e) {
      return new Promise((res, rej) => setTimeout(() => {
        const doc = mockDecks.find(d => d.id === id);
        if (!doc) return rej({ message: "Not found" });
        const newDeckId = Date.now();
        const clonedCards = doc.cards.map(c => ({ ...c, id: Date.now() + Math.random(), deckId: newDeckId }));
        const cloned: FlashcardDeckDTO = {
          ...doc,
          id: newDeckId,
          userId: 1,
          notebookId: targetNotebookId || null,
          visibility: "PRIVATE",
          marketStatus: "NONE",
          cards: clonedCards
        };
        mockDecks.unshift(cloned);
        mockFlashcards.push(...clonedCards);
        res({ success: true, message: "Cloned successfully", data: cloned });
      }, 400));
    }
  },

  async reviewMarketplaceDeck(id: number, payload: { voteResult: "APPROVED" | "REJECTED"; reviewNote?: string }): Promise<ApiResponse<any>> {
    try {
      return await flashcardRequest(`/admin/marketplace/flashcard-decks/${id}/review`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
    } catch (e) {
      return new Promise((res, rej) => setTimeout(() => {
        const docIndex = mockDecks.findIndex(d => d.id === id);
        if (docIndex === -1) return rej({ message: "Not found" });
        mockDecks[docIndex] = { ...mockDecks[docIndex], marketStatus: payload.voteResult };
        res({
          success: true, message: "Success", data: {
            id: Date.now(), reviewerId: 99, targetType: "FLASHCARD_DECK", targetId: id, voteResult: payload.voteResult, createdAt: new Date().toISOString()
          }
        });
      }, 400));
    }
  }

};
