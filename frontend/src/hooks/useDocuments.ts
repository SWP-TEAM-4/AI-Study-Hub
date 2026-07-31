import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { documentService, DocumentDTO, DocumentSearchFilters } from "../services/documentService";
import { handleApiError } from "../utils/errorHandler";
import { Notify } from "notiflix";

// ─── QUERY KEYS ──────────────────────────────────────────────────────────────
export const documentKeys = {
  all: ["documents"] as const,
  workspace: (params?: { keyword?: string; filters?: DocumentSearchFilters }) => [...documentKeys.all, "workspace", params ?? {}] as const,
  shared: (token: string) => [...documentKeys.all, "shared", token] as const,
};

// ─── FETCH WORKSPACE DOCUMENTS ───────────────────────────────────────────────
export function useDocuments(params: { keyword?: string; filters?: DocumentSearchFilters } = {}) {
  return useQuery({
    queryKey: documentKeys.workspace(params),
    queryFn: () => documentService.getWorkspaceDocuments(0, 50, params.keyword ?? "", params.filters ?? {}),
    staleTime: 3 * 60 * 1000,
    refetchInterval: (query) => {
      const items = query.state.data?.data?.items ?? [];
      return items.some((document) => document.processingStatus === "PENDING" || document.processingStatus === "PROCESSING") ? 2000 : false;
    },
    refetchIntervalInBackground: true,
    select: (data) => data?.data?.items ?? [],
  });
}

// ─── UPLOAD DOCUMENT + BACKGROUND CHUNKING ───────────────────────────────────
export function useUploadDocument(callbacks?: { onSuccess?: (doc: DocumentDTO) => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const uploadRes = await documentService.uploadDocument(file);
      if (!uploadRes.success || !uploadRes.data) {
        throw new Error(uploadRes.message || "Upload tài liệu thất bại");
      }

      // Hiển thị document ở trạng thái PENDING/PROCESSING ngay trong danh sách.
      await queryClient.invalidateQueries({ queryKey: documentKeys.all });

      return uploadRes;
    },
    onSuccess: (res) => {
      if (res.success && res.data) {
        Notify.success("Tải lên thành công. AI đang xử lý chunks tự động.");
        callbacks?.onSuccess?.(res.data);
      }
    },
    onError: (e: any) => {
      Notify.failure("Tải lên thất bại: " + (e.message || "Unknown error"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}

// ─── DELETE DOCUMENT ─────────────────────────────────────────────────────────
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => documentService.deleteDocument(id),
    onSuccess: () => {
      Notify.success("Đã xóa tài liệu.");
    },
    onError: (err) => {
      handleApiError(err, "Lỗi xóa tài liệu");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}
