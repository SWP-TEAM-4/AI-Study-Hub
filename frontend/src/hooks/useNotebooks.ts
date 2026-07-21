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
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: (failureCount, error: any) => {
      const status = error?.status ?? error?.response?.status;
      if (status === 401 || status === 403 || status === 404) return false;
      return failureCount < 2;
    },
    onError: (error: any) => {
      const status = error?.status ?? error?.response?.status;
      if (status === 401 || status === 403) return;
      Notify.failure(error?.message || "Không thể tải danh sách Notebook");
    },
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
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: notebookKeys.list() });
      queryClient.invalidateQueries({ queryKey: notebookKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ["notebook", variables.id] });
      Notify.success("Cập nhật Notebook thành công");
      callbacks?.onSuccess?.();
    },
    onError: (e) => handleApiError(e, "Lỗi cập nhật Notebook"),
  });
}

// ─── DELETE NOTEBOOK ─────────────────────────────────────────────────────────
export function useDeleteNotebook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notebookService.deleteNotebook(id),

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

      return { previousNotebooks };
    },

    onSuccess: () => {
      Notify.success("Xóa Notebook thành công");
    },

    onError: (err, _id, context) => {
      if (context?.previousNotebooks) {
        queryClient.setQueryData(notebookKeys.list(), context.previousNotebooks);
      }
      handleApiError(err, "Lỗi xóa Notebook");
    },

    onSettled: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: notebookKeys.list() });
      }, 1000);
    },
  });
}
