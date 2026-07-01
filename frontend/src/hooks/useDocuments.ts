import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { documentService, DocumentDTO } from "../services/documentService";
import { handleApiError } from "../utils/errorHandler";
import { Notify } from "notiflix";

// ─── QUERY KEYS ──────────────────────────────────────────────────────────────
export const documentKeys = {
  all: ["documents"] as const,
  workspace: () => [...documentKeys.all, "workspace"] as const,
  shared: (token: string) => [...documentKeys.all, "shared", token] as const,
};

// ─── FETCH WORKSPACE DOCUMENTS ───────────────────────────────────────────────
export function useDocuments(filters?: {
  keyword?: string;
  subjectId?: number;
  fileType?: string;
  visibility?: string;
  processingStatus?: string;
  sort?: string;
}) {
  const keyword = filters?.keyword ?? "";
  const subjectId = filters?.subjectId;
  const fileType = filters?.fileType;
  const visibility = filters?.visibility;
  const processingStatus = filters?.processingStatus;
  const sort = filters?.sort;

  return useQuery({
    queryKey: [...documentKeys.workspace(), "filters", { keyword, subjectId, fileType, visibility, processingStatus, sort }],
    queryFn: () => documentService.getWorkspaceDocuments(0, 50, keyword, {
      subjectId,
      fileType,
      visibility,
      processingStatus,
      sort
    }),
    staleTime: 3 * 60 * 1000, // 3 phút cache
    select: (data) => data?.data?.items ?? [],
  });
}

// ─── UPLOAD DOCUMENT ─────────────────────────────────────────────────────────
export function useUploadDocument(callbacks?: { onSuccess?: (doc: DocumentDTO) => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => documentService.uploadDocument(file),
    onSuccess: (res) => {
      if (res.success && res.data) {
        // Prepend document mới vào list ngay lập tức (Optimistic-style)
        queryClient.setQueryData(documentKeys.workspace(), (old: any) => {
          if (!old?.data?.items) return old;
          return {
            ...old,
            data: {
              ...old.data,
              items: [res.data, ...old.data.items],
            },
          };
        });
        Notify.success(`Tải lên thành công!`);
        callbacks?.onSuccess?.(res.data);
      }
    },
    onError: (e: any) => {
      Notify.failure("Tải lên thất bại: " + (e.message || "Unknown error"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.workspace() });
    },
  });
}

// ─── DELETE DOCUMENT (OPTIMISTIC + RESTORE ON ERROR) ─────────────────────────
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return documentService.deleteDocument(id);
    },

    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: documentKeys.workspace() });
      const previousDocs = queryClient.getQueryData(documentKeys.workspace());

      queryClient.setQueryData(documentKeys.workspace(), (old: any) => {
        if (!old?.data?.items) return old;
        return {
          ...old,
          data: {
            ...old.data,
            items: old.data.items.filter((d: DocumentDTO) => d.id !== id),
          },
        };
      });

      import("sonner").then(({ toast }) => {
        toast("Đã xóa tài liệu", {
          description: "Tài liệu đã được chuyển vào thùng rác.",
          action: {
            label: "Hoàn tác",
            onClick: () => {
              queryClient.setQueryData(documentKeys.workspace(), previousDocs);
            }
          }
        });
      });

      return { previousDocs };
    },

    onError: (err, _id, context) => {
      if (context?.previousDocs) {
        queryClient.setQueryData(documentKeys.workspace(), context.previousDocs);
      }
      handleApiError(err, "Lỗi xóa tài liệu");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.workspace() });
    },
  });
}
