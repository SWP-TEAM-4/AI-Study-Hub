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
    select: (data) => data?.data?.items ?? [],
  });
}

// ─── UPLOAD DOCUMENT + CHUNKING ──────────────────────────────────────────────
export function useUploadDocument(callbacks?: { onSuccess?: (doc: DocumentDTO) => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const uploadRes = await documentService.uploadDocument(file);
      if (!uploadRes.success || !uploadRes.data) {
        throw new Error(uploadRes.message || "Upload tài liệu thất bại");
      }

      const processRes = await documentService.processDocumentChunks(uploadRes.data.id, {
        chunkSize: 800,
        overlap: 120,
      });
      if (!processRes.success) {
        throw new Error(processRes.message || "Upload thành công nhưng xử lý chunk thất bại");
      }

      return uploadRes;
    },
    onSuccess: (res) => {
      if (res.success && res.data) {
        Notify.success("Tải lên và xử lý AI chunks thành công!");
        callbacks?.onSuccess?.(res.data);
      }
    },
    onError: (e: any) => {
      Notify.failure("Tải lên/xử lý thất bại: " + (e.message || "Unknown error"));
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
