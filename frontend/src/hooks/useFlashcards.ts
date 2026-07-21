import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { flashcardService, FlashcardDeckDTO, FlashcardDeckPayload } from "../services/flashcardService";
import { handleApiError } from "../utils/errorHandler";
import { Notify } from "notiflix";

// ─── QUERY KEYS ──────────────────────────────────────────────────────────────
export const flashcardKeys = {
  all: ["flashcards"] as const,
  decks: () => [...flashcardKeys.all, "decks"] as const,
  deck: (id: number) => [...flashcardKeys.all, "deck", id] as const,
};

// ─── FETCH MY DECKS ──────────────────────────────────────────────────────────
export function useFlashcardDecks() {
  return useQuery({
    queryKey: flashcardKeys.decks(),
    queryFn: () => flashcardService.getMyFlashcardDecks(0, 50),
    staleTime: 5 * 60 * 1000, // 5 phút cache
    select: (data) => data?.data?.items ?? [],
  });
}

// ─── GENERATE FLASHCARD DECK (AI) ────────────────────────────────────────────
export function useGenerateFlashcardDeck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { notebookId?: number; documentId?: number; numberOfCards: number }) =>
      flashcardService.generateFlashcardDeck(payload),
    onSuccess: (res) => {
      if (res.success && res.data) {
        queryClient.setQueryData(flashcardKeys.decks(), (old: any) => {
          if (!old?.data?.items) return old;
          return {
            ...old,
            data: {
              ...old.data,
              items: [res.data, ...old.data.items],
            },
          };
        });
        Notify.success("Đã sinh xong bộ Flashcard bằng AI!");
      }
    },
    onError: (e: any) => {
      Notify.failure(e.message || "Lỗi khi sinh Flashcard");
    },
  });
}

// ─── CREATE FLASHCARD DECK ───────────────────────────────────────────────────
export function useCreateFlashcardDeck(callbacks?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: FlashcardDeckPayload) =>
      flashcardService.createFlashcardDeck(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flashcardKeys.decks() });
      Notify.success("Tạo bộ Flashcard thành công!");
      callbacks?.onSuccess?.();
    },
    onError: (e) => handleApiError(e, "Lỗi tạo Flashcard Deck"),
  });
}

// ─── DELETE FLASHCARD DECK (HARD DELETE, NO UNDO) ────────────────────────────
export function useDeleteFlashcardDeck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => flashcardService.deleteFlashcardDeck(id),

    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: flashcardKeys.decks() });
      const previousDecks = queryClient.getQueryData(flashcardKeys.decks());

      queryClient.setQueryData(flashcardKeys.decks(), (old: any) => {
        if (!old?.data?.items) return old;
        return {
          ...old,
          data: {
            ...old.data,
            items: old.data.items.filter((d: FlashcardDeckDTO) => d.id !== id),
          },
        };
      });

      return { previousDecks };
    },

    onError: (err, _id, context) => {
      if (context?.previousDecks) {
        queryClient.setQueryData(flashcardKeys.decks(), context.previousDecks);
      }
      handleApiError(err, "Lỗi xóa Flashcard Deck");
    },

    onSuccess: () => {
      Notify.success("Đã xóa vĩnh viễn bộ Flashcard");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: flashcardKeys.decks() });
    },
  });
}
