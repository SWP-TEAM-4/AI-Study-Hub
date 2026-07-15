"use client";

import { useState, useEffect } from "react";
import {
  Flag,
  MessageSquare,
  Globe,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Search,
} from "lucide-react";
import { motion } from "framer-motion";
import { trackingService, MyReportDTO, MyFeedbackDTO, MySubmissionDTO } from "../services/trackingService";
import { Notify } from "notiflix";

type TabType = "reports" | "feedbacks" | "marketplace";

const TAB_CONFIG: { id: TabType; label: string; icon: typeof Flag }[] = [
  { id: "reports", label: "Báo cáo vi phạm", icon: Flag },
  { id: "feedbacks", label: "Góp ý hệ thống", icon: MessageSquare },
  { id: "marketplace", label: "Đã gửi Marketplace", icon: Globe },
];

const STATUS_BADGE: Record<string, { label: string; classes: string }> = {
  PENDING_ADMIN: { label: "Chờ xử lý", classes: "bg-warning/10 text-warning border-warning/20" },
  RESOLVED: { label: "Đã giải quyết", classes: "bg-success/10 text-success border-success/20" },
  REJECTED: { label: "Từ chối", classes: "bg-destructive/10 text-destructive border-destructive/20" },
  OPEN: { label: "Mới", classes: "bg-warning/10 text-warning border-warning/20" },
  IN_PROGRESS: { label: "Đang xử lý", classes: "bg-info/10 text-info border-info/20" },
  CLOSED: { label: "Đã đóng", classes: "bg-muted text-muted-foreground border-border" },
  PENDING: { label: "Chờ duyệt", classes: "bg-warning/10 text-warning border-warning/20" },
  APPROVED: { label: "Đã duyệt", classes: "bg-success/10 text-success border-success/20" },
};

export default function MyReportsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("reports");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);

  // Data
  const [reports, setReports] = useState<MyReportDTO[]>([]);
  const [feedbacks, setFeedbacks] = useState<MyFeedbackDTO[]>([]);
  const [submissions, setSubmissions] = useState<MySubmissionDTO[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === "reports") {
        const res = await trackingService.getMyReports({ page, size: 10, keyword });
        if (res.success) {
          setReports(res.data.items);
          setTotalElements(res.data.totalElements);
        }
      } else if (activeTab === "feedbacks") {
        const res = await trackingService.getMyFeedbacks({ page, size: 10 });
        if (res.success) {
          setFeedbacks(res.data.items);
          setTotalElements(res.data.totalElements);
        }
      } else {
        const res = await trackingService.getMyMarketplaceSubmissions({ page, size: 10 });
        if (res.success) {
          setSubmissions(res.data.items);
          setTotalElements(res.data.totalElements);
        }
      }
    } catch (err: any) {
      Notify.failure(err.message || "Lỗi tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [activeTab, page]);

  const totalPages = Math.ceil(totalElements / 10);

  const renderStatus = (status: string) => {
    const cfg = STATUS_BADGE[status] || { label: status, classes: "bg-muted text-muted-foreground" };
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.classes}`}>
        {status === "PENDING_ADMIN" || status === "PENDING" ? <Clock size={12} /> :
         status === "RESOLVED" || status === "APPROVED" ? <CheckCircle2 size={12} /> :
         status === "REJECTED" ? <XCircle size={12} /> : <AlertTriangle size={12} />}
        {cfg.label}
      </span>
    );
  };

  const renderTable = () => {
    if (isLoading) {
      return (
        <tr>
          <td colSpan={4} className="px-6 py-16 text-center text-muted-foreground">
            <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Đang tải dữ liệu...
          </td>
        </tr>
      );
    }

    const items = activeTab === "reports" ? reports : activeTab === "feedbacks" ? feedbacks : submissions;
    if (items.length === 0) {
      return (
        <tr>
          <td colSpan={4} className="px-6 py-16 text-center text-muted-foreground">
            Chưa có dữ liệu nào.
          </td>
        </tr>
      );
    }

    return items.map((item: any, idx: number) => (
      <motion.tr
        key={item.id || idx}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.03 }}
        className="hover:bg-muted/20 transition-colors"
      >
        {activeTab === "reports" && (
          <>
            <td className="px-6 py-4">
              <div className="font-semibold text-foreground text-sm truncate max-w-[220px]">
                {item.targetTitle || `${item.targetType} #${item.targetId}`}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{item.reasonType} — {item.reportDetails?.substring(0, 60)}</div>
            </td>
            <td className="px-6 py-4">{renderStatus(item.status)}</td>
            <td className="px-6 py-4 text-sm text-muted-foreground">
              {item.adminNote ? <span className="italic">"{item.adminNote.substring(0, 40)}"</span> : <span className="text-muted-foreground/50">—</span>}
            </td>
            <td className="px-6 py-4 text-xs text-muted-foreground/70">{new Date(item.createdAt).toLocaleDateString("vi-VN")}</td>
          </>
        )}
        {activeTab === "feedbacks" && (
          <>
            <td className="px-6 py-4">
              <div className="font-semibold text-foreground text-sm">{item.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-[250px]">{item.content?.substring(0, 80)}</div>
            </td>
            <td className="px-6 py-4">{renderStatus(item.status)}</td>
            <td className="px-6 py-4 text-sm text-muted-foreground">{item.screenUrl || "—"}</td>
            <td className="px-6 py-4 text-xs text-muted-foreground/70">{new Date(item.createdAt).toLocaleDateString("vi-VN")}</td>
          </>
        )}
        {activeTab === "marketplace" && (
          <>
            <td className="px-6 py-4">
              <div className="font-semibold text-foreground text-sm">{item.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">#{item.targetType}</div>
            </td>
            <td className="px-6 py-4">{renderStatus(item.marketStatus || "PENDING")}</td>
            <td className="px-6 py-4 text-sm text-muted-foreground">{item.targetType}</td>
            <td className="px-6 py-4 text-xs text-muted-foreground/70">
              {new Date(item.submittedAt || item.createdAt).toLocaleDateString("vi-VN")}
            </td>
          </>
        )}
      </motion.tr>
    ));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 app-shell-font">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Đơn từ của tôi</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Theo dõi trạng thái các báo cáo vi phạm, góp ý hệ thống và nội dung đã gửi lên cộng đồng.
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex p-1 bg-muted/60 rounded-xl border border-border/50 w-fit">
        {TAB_CONFIG.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search bar */}
      {activeTab === "reports" && (
        <div className="surface-card p-3 flex items-center gap-3">
          <Search size={16} className="text-muted-foreground/60 ml-1" />
          <input
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(0); }}
            placeholder="Tìm kiếm báo cáo..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
          />
        </div>
      )}

      {/* Table */}
      <div className="surface-card rounded-2xl overflow-hidden border border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground border-b border-border/50">
              <tr>
                {activeTab === "reports" && (
                  <>
                    <th className="px-6 py-4 font-medium">Nội dung</th>
                    <th className="px-6 py-4 font-medium">Trạng thái</th>
                    <th className="px-6 py-4 font-medium">Phản hồi</th>
                    <th className="px-6 py-4 font-medium">Ngày gửi</th>
                  </>
                )}
                {activeTab === "feedbacks" && (
                  <>
                    <th className="px-6 py-4 font-medium">Tiêu đề</th>
                    <th className="px-6 py-4 font-medium">Trạng thái</th>
                    <th className="px-6 py-4 font-medium">Trang</th>
                    <th className="px-6 py-4 font-medium">Ngày gửi</th>
                  </>
                )}
                {activeTab === "marketplace" && (
                  <>
                    <th className="px-6 py-4 font-medium">Tên nội dung</th>
                    <th className="px-6 py-4 font-medium">Trạng thái</th>
                    <th className="px-6 py-4 font-medium">Loại</th>
                    <th className="px-6 py-4 font-medium">Ngày gửi</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">{renderTable()}</tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="px-3 h-8 rounded-lg bg-muted border border-border disabled:opacity-40 hover:bg-muted/80 transition-colors font-medium"
          >
            Trước
          </button>
          <span className="px-3 text-muted-foreground font-medium">
            Trang {page + 1} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 h-8 rounded-lg bg-muted border border-border disabled:opacity-40 hover:bg-muted/80 transition-colors font-medium"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}
