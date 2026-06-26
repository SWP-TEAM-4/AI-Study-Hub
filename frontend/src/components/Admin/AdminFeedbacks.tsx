import { ExternalLink, MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { feedbackService } from "../../services/feedbackService";

const feedbackStatusBadge: Record<string, string> = {
  OPEN: "bg-red-500/15 text-red-500",
  IN_PROGRESS: "bg-warning/20 text-warning-foreground",
  RESOLVED: "bg-success/15 text-success",
  CLOSED: "bg-muted text-muted-foreground",
};

export default function AdminFeedbacks() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: feedbacksList = [], isLoading } = useQuery({
    queryKey: ["adminFeedbacks"],
    queryFn: async () => {
      const res = await feedbackService.adminGetFeedbacks({ page: 0, size: 20 });
      return res.data?.items || [];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" }) => {
      return feedbackService.adminUpdateFeedbackStatus(id, { status, adminNote: "Đã rà soát hệ thống" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminFeedbacks"] });
    },
    onError: () => {
      alert("Cập nhật trạng thái feedback thất bại");
    }
  });

  const handleFeedbackStatusUpdate = (id: number, newStatus: string) => {
    updateStatusMutation.mutate({ id, status: newStatus as any });
  };

  return (
    <div className="surface-card overflow-hidden bg-card">
      <div className="p-5 flex items-center justify-between border-b border-border bg-card">
        <div className="text-left">
          <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
            <MessageSquare size={18} className="text-coral" /> {t("admin.feedbacks.title")}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t("admin.feedbacks.subtitle")}</p>
        </div>
      </div>
      <table className="w-full text-sm text-left">
        <thead className="bg-muted/40 text-xs uppercase text-muted-foreground tracking-wider border-b border-border/50">
          <tr>
            <th className="px-5 py-3.5">{t("admin.feedbacks.content")}</th>
            <th className="px-5 py-3.5 hidden md:table-cell">{t("admin.feedbacks.screen")}</th>
            <th className="px-5 py-3.5">{t("admin.feedbacks.status")}</th>
            <th className="px-5 py-3.5 text-right">{t("admin.feedbacks.progress")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <tr key={i}>
                <td colSpan={4} className="px-5 py-4">
                  <div className="h-10 bg-muted animate-pulse rounded w-full"></div>
                </td>
              </tr>
            ))
          ) : feedbacksList.length === 0 ? (
            <tr><td colSpan={4} className="py-12 text-center text-muted-foreground font-medium text-xs">{t("admin.feedbacks.noData")}</td></tr>
          ) : (
            feedbacksList.map((f: any) => (
              <tr key={f.id} className="hover:bg-muted/10 transition-colors group">
                <td className="px-5 py-4">
                  <div className="font-semibold text-foreground text-sm">{f.title}</div>
                  <div className="text-xs text-muted-foreground mt-1 font-medium leading-relaxed max-w-md">{f.content}</div>
                  <span className="text-[10px] font-mono text-muted-foreground/60 block mt-1">{t("admin.feedbacks.ticket")} #FB{f.id}</span>
                </td>
                <td className="px-5 py-4 hidden md:table-cell">
                  {f.screenUrl ? (
                    <a href={f.screenUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary font-bold font-mono hover:underline">
                      {f.screenUrl} <ExternalLink size={11} />
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground font-mono">N/A</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <span className={`text-[9px] px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${feedbackStatusBadge[f.status] || "bg-muted text-muted-foreground"}`}>
                    {f.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <select value={f.status} onChange={(e) => handleFeedbackStatusUpdate(f.id, e.target.value)} disabled={updateStatusMutation.isPending} className="bg-muted text-foreground text-xs font-bold rounded-lg px-2.5 py-1.5 border border-border/60 focus:border-primary/50 outline-none cursor-pointer">
                    <option value="OPEN">OPEN (Mở mới)</option>
                    <option value="IN_PROGRESS">IN_PROGRESS (Đang sửa)</option>
                    <option value="RESOLVED">RESOLVED (Đã fix)</option>
                    <option value="CLOSED">CLOSED (Đóng hẳn)</option>
                  </select>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
