import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShieldCheck, XCircle, Clock, CheckCircle2, EyeOff, Eye } from "lucide-react";
import { governanceService, ReportDTO } from "../services/governanceService";
import { Notify } from "notiflix";

export default function AdminReportsTab() {
  const [reports, setReports] = useState<ReportDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    loadReports();
  }, [statusFilter]);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const res = await governanceService.getAdminReports(0, 50, statusFilter);
      if (res.success) setReports(res.data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async (id: number) => {
    try {
      const res = await governanceService.resolveReport(id, "Admin đã giải quyết.");
      if (res.success) {
        Notify.success("Đã duyệt báo cáo (Resolve).");
        setReports(prev => prev.map(r => r.id === id ? res.data : r));
      }
    } catch (e: any) {
      Notify.failure(e.message || "Lỗi xử lý báo cáo");
    }
  };

  const handleReject = async (id: number) => {
    try {
      const res = await governanceService.rejectReport(id, "Admin từ chối báo cáo này.");
      if (res.success) {
        Notify.success("Đã từ chối báo cáo (Reject).");
        setReports(prev => prev.map(r => r.id === id ? res.data : r));
      }
    } catch (e: any) {
      Notify.failure(e.message || "Lỗi xử lý báo cáo");
    }
  };

  const handleHideContent = async (targetType: string, targetId: number) => {
    try {
      const res = await governanceService.hideContent(targetType, targetId, "Vi phạm nội quy nền tảng");
      if (res.success) {
        Notify.warning(`Đã ẨN nội dung ${targetType} #${targetId}`);
      }
    } catch (e: any) {
      Notify.failure(e.message || "Lỗi ẩn nội dung");
    }
  };

  const handleRestoreContent = async (targetType: string, targetId: number) => {
    try {
      const res = await governanceService.restoreContent(targetType, targetId, "Khôi phục sau khi kháng cáo");
      if (res.success) {
        Notify.info(`Đã KHÔI PHỤC nội dung ${targetType} #${targetId}`);
      }
    } catch (e: any) {
      Notify.failure(e.message || "Lỗi khôi phục nội dung");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">Quản lý Báo cáo vi phạm (Reports)</h2>
        <select 
          className="h-10 px-3 rounded-xl bg-muted text-sm border-none outline-none focus:ring-2 focus:ring-primary/20"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="PENDING_ADMIN">Chờ xử lý</option>
          <option value="RESOLVED">Đã giải quyết</option>
          <option value="REJECTED">Đã từ chối</option>
        </select>
      </div>

      <div className="surface-card rounded-2xl overflow-hidden border border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Báo cáo</th>
                <th className="px-6 py-4 font-medium">Đối tượng</th>
                <th className="px-6 py-4 font-medium">Mức độ</th>
                <th className="px-6 py-4 font-medium">Trạng thái</th>
                <th className="px-6 py-4 font-medium text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground"><div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />Đang tải dữ liệu...</td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">Không có dữ liệu báo cáo nào.</td></tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium">Lý do: {report.reasonType}</div>
                      <div className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate">{report.reportDetails}</div>
                      <div className="text-[10px] text-muted-foreground mt-1">Người báo cáo: User #{report.reporterId} • {new Date(report.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-muted">
                        {report.targetType} #{report.targetId}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${report.severityLevel === 'HIGH' ? 'bg-destructive/15 text-destructive' : report.severityLevel === 'MEDIUM' ? 'bg-warning/20 text-warning-foreground' : 'bg-muted text-foreground'}`}>
                        {report.severityLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                        report.status === "PENDING_ADMIN" ? "bg-warning/10 text-warning-foreground border-warning/20" :
                        report.status === "RESOLVED" ? "bg-emerald-500/12 text-emerald-300 border border-emerald-500/25" :
                        "bg-destructive/10 text-destructive border-destructive/20"
                      }`}>
                        {report.status === "PENDING_ADMIN" ? <Clock size={12} /> : report.status === "RESOLVED" ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {report.status === "PENDING_ADMIN" && (
                          <>
                            <button 
                              onClick={() => handleResolve(report.id)}
                              className="size-8 rounded-lg bg-success/15 text-success flex items-center justify-center hover:bg-success hover:text-success-foreground transition-colors"
                              title="Đã giải quyết (Xóa vi phạm)"
                            >
                              <ShieldCheck size={16} />
                            </button>
                            <button 
                              onClick={() => handleReject(report.id)}
                              className="size-8 rounded-lg bg-destructive/15 text-destructive flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                              title="Từ chối (Báo cáo sai)"
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => handleHideContent(report.targetType, report.targetId)}
                          className="size-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center hover:bg-warning hover:text-warning-foreground transition-colors"
                          title="Ẩn nội dung này"
                        >
                          <EyeOff size={16} />
                        </button>
                        <button 
                          onClick={() => handleRestoreContent(report.targetType, report.targetId)}
                          className="size-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                          title="Khôi phục nội dung"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
