import React from "react";
import { ArrowUpRight, Bell, BookMarked, Clock, Download, FileText, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { notebookService } from "../../services/notebookService";
import { notificationService } from "../../services/notificationService";
import { documentService } from "../../services/documentService";

const notebookColors = [
  { bg: "bg-blue-500/12", icon: "text-blue-400" },
  { bg: "bg-violet-500/12", icon: "text-violet-400" },
  { bg: "bg-emerald-500/12", icon: "text-emerald-400" },
  { bg: "bg-amber-500/12", icon: "text-amber-400" },
];

function relativeTime(value: string) {
  const date = new Date(value);
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
  if (minutes < 60) return `${minutes} phút trước`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} giờ trước`;
  return date.toLocaleDateString();
}

export const DashboardRecentNotebooks = React.memo(function DashboardRecentNotebooks() {
  const navigate = useNavigate();
  const dataQuery = useQuery({
    queryKey: ["dashboardRecentData"],
    queryFn: async () => {
      const [notebooks, notifications, documents] = await Promise.all([
        notebookService.getNotebooks(0, 4),
        notificationService.getMyNotifications({ page: 0, size: 3, sort: "newest" }),
        documentService.getTopCommunityDocuments(),
      ]);
      return {
        notebooks: notebooks.data.items.slice(0, 4),
        notifications: notifications.data.items,
        documents: documents.data.items.slice(0, 3),
      };
    },
    staleTime: 60_000,
  });

  if (dataQuery.isLoading) return <div className="grid gap-5 lg:grid-cols-3"><div className="surface-card h-72 animate-pulse lg:col-span-2" /><div className="surface-card h-72 animate-pulse" /></div>;
  if (dataQuery.isError || !dataQuery.data) return <div className="surface-card p-8 text-center text-slate-300"><p>Không thể tải dữ liệu dashboard.</p><button onClick={() => dataQuery.refetch()} className="mt-2 text-primary">Thử lại</button></div>;

  const { notebooks, notifications, documents } = dataQuery.data;
  return (
    <div className="space-y-6">
      <section className="grid gap-5 lg:grid-cols-3" aria-label="Notebook và thông báo">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
          <Header title="Notebook gần đây" action="Xem tất cả" onClick={() => navigate("/notebooks")} />
          {notebooks.length === 0 ? <Empty text="Bạn chưa có notebook nào." /> : (
            <div className="grid gap-3 sm:grid-cols-2">
              {notebooks.map((notebook, index) => {
                const color = notebookColors[index % notebookColors.length];
                return (
                  <button key={notebook.id} onClick={() => navigate(`/notebooks/${notebook.id}`)} className="group w-full rounded-xl border border-border/70 bg-card p-4 text-left transition hover:border-primary/40 hover:bg-muted/20">
                    <div className={`mb-3 grid size-10 place-items-center rounded-lg ${color.bg}`}><BookMarked size={18} className={color.icon} /></div>
                    <div className="truncate text-sm font-semibold text-foreground">{notebook.title}</div>
                    <div className="mt-1 text-xs font-medium text-muted-foreground">{notebook.documentCount} tài liệu · {notebook.subjectCode || "Chưa gán môn"}</div>
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-6 text-left shadow-sm">
          <Header title="Thông báo mới" action="Tất cả" icon={<Bell size={17} className="text-primary" />} onClick={() => navigate("/notifications")} />
          {notifications.length === 0 ? <Empty text="Bạn chưa có thông báo nào." /> : (
            <ul className="space-y-4">
              {notifications.map((notification) => (
                <li key={notification.id} className="flex items-start gap-3">
                  <span className={`mt-2 size-2 shrink-0 rounded-full ${notification.isRead ? "bg-slate-500" : "bg-primary"}`} />
                  <button onClick={() => navigate("/notifications")} className="min-w-0 flex-1 text-left">
                    <p className="truncate text-xs font-bold text-foreground">{notification.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{notification.content}</p>
                    <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-muted-foreground"><Clock size={9} />{relativeTime(notification.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </section>

      <section aria-label="Tài liệu cộng đồng nổi bật">
        <div className="mb-4 flex items-center justify-between"><div><h3 className="flex items-center gap-2 text-base font-bold text-foreground"><Users size={17} className="text-primary" />Tài liệu cộng đồng nổi bật</h3><p className="mt-0.5 text-xs text-muted-foreground">Dữ liệu xếp hạng trực tiếp từ cộng đồng</p></div><button onClick={() => navigate("/community")} className="inline-flex items-center gap-1 text-xs font-bold text-primary">Xem tất cả <ArrowUpRight size={11} /></button></div>
        {documents.length === 0 ? <Empty text="Chưa có tài liệu cộng đồng nổi bật." /> : (
          <div className="grid gap-4 md:grid-cols-3">
            {documents.map((document) => (
              <button key={document.id} onClick={() => navigate("/community")} className="group rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 to-primary/5 p-5 text-left transition hover:-translate-y-0.5">
                <div className="mb-3 flex items-start gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/12"><FileText size={19} className="text-primary" /></div><div className="min-w-0"><h4 className="line-clamp-2 text-sm font-bold text-foreground">{document.title}</h4><span className="text-[10px] font-medium text-muted-foreground">{document.fileType || "Tài liệu"}</span></div></div>
                <p className="mb-4 line-clamp-2 text-xs text-muted-foreground">{document.description || "Không có mô tả."}</p>
                <div className="flex items-center justify-between border-t border-border/40 pt-3 text-[10px] font-semibold text-muted-foreground"><span className="inline-flex items-center gap-1"><Download size={10} />{document.downloadCount} lượt tải</span><span>{relativeTime(document.createdAt)}</span></div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
});

function Header({ title, action, onClick, icon }: { title: string; action: string; onClick: () => void; icon?: React.ReactNode }) {
  return <div className="mb-5 flex items-center justify-between"><h3 className="flex items-center gap-2 text-base font-bold text-foreground">{icon}{title}</h3><button onClick={onClick} className="inline-flex items-center gap-1 text-xs font-bold text-primary">{action} <ArrowUpRight size={11} /></button></div>;
}

function Empty({ text }: { text: string }) {
  return <div className="grid min-h-28 place-items-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">{text}</div>;
}
