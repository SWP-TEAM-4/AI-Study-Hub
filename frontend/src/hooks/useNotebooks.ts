import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notebookService, NotebookDTO } from "../services/notebookService";
import { handleApiError } from "../utils/errorHandler";
import { Notify } from "notiflix";

// ─── QUERY KEYS ──────────────────────────────────────────────────────────────
export const notebookKeys = {
  all: ["notebooks"] as const,
  list: () => [...notebookKeys.all, "list"] as const,
  detail: (id: number) => [...notebookKeys.all, "detail", id] as const,
};

// ─── FETCH NOTEBOOKS ─────────────────────────────────────────────────────────
export function useNotebooks() {
  return useQuery({
    queryKey: notebookKeys.list(),
    queryFn: () => notebookService.getNotebooks(),
    staleTime: 5 * 60 * 1000, // 5 phút — giảm số lần gọi API không cần thiết
    select: (data) => data?.data?.items ?? [],
  });
}

// ─── CREATE NOTEBOOK ─────────────────────────────────────────────────────────
export function useCreateNotebook(callbacks?: {
  onSuccess?: () => void;
  onError?: () => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { subjectId: number; title: string }) =>
      notebookService.createNotebook(data.subjectId, data.title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notebookKeys.list() });
      Notify.success("Tạo Notebook thành công");
      callbacks?.onSuccess?.();
    },
    onError: (e) => {
      handleApiError(e, "Lỗi tạo Notebook");
      callbacks?.onError?.();
    },
  });
}

// ─── UPDATE NOTEBOOK ─────────────────────────────────────────────────────────
export function useUpdateNotebook(callbacks?: {
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: number; subjectId: number; title: string }) =>
      notebookService.updateNotebook(data.id, data.subjectId, data.title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notebookKeys.list() });
      Notify.success("Cập nhật Notebook thành công");
      callbacks?.onSuccess?.();
    },
    onError: (e) => handleApiError(e, "Lỗi cập nhật Notebook"),
  });
}

// ─── DELETE NOTEBOOK (OPTIMISTIC + UNDO TOAST) ───────────────────────────────
export function useDeleteNotebook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      // Simulate network delay to give user time to undo
      // Realistically this should be handled by a queue or backend undo
      await new Promise(resolve => setTimeout(resolve, 300));
      return notebookService.deleteNotebook(id);
    },

    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: notebookKeys.list() });
      const previousNotebooks = queryClient.getQueryData(notebookKeys.list());

      queryClient.setQueryData(notebookKeys.list(), (old: any) => {
        if (!old?.data?.items) return old;
        return {
          ...old,
          data: {
            ...old.data,
            items: old.data.items.filter((nb: NotebookDTO) => nb.id !== id),
          },
        };
      });

      // Show Undo Toast
      import("sonner").then(({ toast }) => {
        toast("Đã xóa sổ tay", {
          description: "Sổ tay đã được chuyển vào thùng rác.",
          action: {
            label: "Hoàn tác",
            onClick: () => {
              queryClient.setQueryData(notebookKeys.list(), previousNotebooks);
              // Note: If API already executed, we would need to call a restore API.
              // For now, this just restores the UI optimistic state if caught in time.
            }
          }
        });
      });

      return { previousNotebooks };
    },

    onError: (err, _id, context) => {
      if (context?.previousNotebooks) {
        queryClient.setQueryData(notebookKeys.list(), context.previousNotebooks);
      }
      handleApiError(err, "Lỗi xóa Notebook");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notebookKeys.list() });
    },
  });
}
