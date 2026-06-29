import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { marketplaceService } from "../services/marketplaceService";
import { documentService } from "../services/documentService";
import { flashcardService } from "../services/flashcardService";
import { Notify } from "notiflix";

// ─── QUERY KEYS ──────────────────────────────────────────────────────────────
export const communityKeys = {
  all: ["community"] as const,
  marketplace: (type: string, filters?: object) => [...communityKeys.all, "marketplace", type, filters] as const,
  leaderboard: () => [...communityKeys.all, "leaderboard"] as const,
};

// ─── FETCH MARKETPLACE ITEMS ─────────────────────────────────────────────────
export function useCommunityItems(type: "documents" | "flashcards", filters: {
  search?: string;
  semesterId?: string;
  subjectId?: string;
  page?: number;
} = {}) {
  return useQuery({
    queryKey: communityKeys.marketplace(type, filters),
    queryFn: async () => {
      if (type === "documents") {
        return documentService.getMarketplaceDocuments(
          filters.page ?? 0,
          20,
          filters.search ?? ""
        );
      } else {
        return flashcardService.getMarketplaceFlashcardDecks(
          filters.page ?? 0,
          20,
          filters.search ?? ""
        );
      }
    },
    staleTime: 2 * 60 * 1000, // 2 phút cache — Community hay thay đổi hơn
    placeholderData: (prev) => prev, // giữ data cũ khi đang tải trang mới (tránh flash)
  });
}

// ─── CLONE MARKETPLACE ITEM ──────────────────────────────────────────────────
export function useCloneItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ type, id }: { type: "documents" | "flashcards"; id: number }) => {
      if (type === "documents") {
        return documentService.cloneMarketplaceDocument(id);
      } else {
        return flashcardService.cloneMarketplaceDeck(id);
      }
    },
    onSuccess: (_res, variables) => {
      const typeName = variables.type === "documents" ? "Tài liệu" : "Flashcard";
      Notify.success(`${typeName} đã được sao chép vào Workspace của bạn!`);
      // Invalidate personal lists để hiển thị item mới
      queryClient.invalidateQueries({ queryKey: ["notebooks"] });
      queryClient.invalidateQueries({ queryKey: ["flashcards"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (e: any) => {
      Notify.failure(e.message || "Lỗi khi clone");
    },
  });
}
