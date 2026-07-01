import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, XCircle, Clock, Eye, Trash2, Globe, Lock, Search } from "lucide-react";
import { marketplaceService, AdminContentDTO } from "../services/marketplaceService";
import { Notify } from "notiflix";
import { useSubjects } from "../hooks/useSubjects";

export default function AdminMarketplaceTab() {
  const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");
  const [contents, setContents] = useState<AdminContentDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [policy, setPolicy] = useState({ subjectId: "", mode: "SINGLE_REVIEWER", requiredVotes: 1, approvalPercentage: 100 });
  const [savingPolicy, setSavingPolicy] = useState(false);
  const { subjects } = useSubjects();

  useEffect(() => {
    loadData();
  }, [activeTab, keyword]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === "pending") {
        const res = await marketplaceService.getAdminPending(0, 50, keyword);
        if (res.success) setContents(res.data.items);
      } else {
        const res = await marketplaceService.getAdminContents(0, 50, keyword);
        if (res.success) setContents(res.data.items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (type: string, id: number) => {
    try {
      const res = await marketplaceService.approveAdminContent(type, id, "Đã duyệt");
      if (res.success) {
        Notify.success("Đã phê duyệt nội dung lên Marketplace");
        setContents(prev => prev.filter(c => !(c.targetType === type && c.targetId === id)));
      }
    } catch (e: any) {
      Notify.failure(e.message || "Lỗi duyệt nội dung");
    }
  };

  const handleReject = async (type: string, id: number) => {
    try {
      const res = await marketplaceService.rejectAdminContent(type, id, "Không đạt tiêu chuẩn");
      if (res.success) {
        Notify.success("Đã từ chối nội dung");
        setContents(prev => prev.filter(c => !(c.targetType === type && c.targetId === id)));
      }
    } catch (e: any) {
      Notify.failure(e.message || "Lỗi từ chối nội dung");
    }
  };

  const handleDelete = async (type: string, id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa nội dung này khỏi hệ thống?")) return;
    try {
      const res = await marketplaceService.deleteAdminContent(type, id);
      if (res.success) {
        Notify.success("Đã xóa nội dung");
        setContents(prev => prev.filter(c => !(c.targetType === type && c.targetId === id)));
      }
    } catch (e: any) {
      Notify.failure(e.message || "Lỗi xóa nội dung");
    }
  };

  const handleUpdateVisibility = async (type: string, id: number, currentVis: string) => {
    const newVis = currentVis === "MARKETPLACE" ? "PRIVATE" : "MARKETPLACE";
    try {
      const res = await marketplaceService.updateVisibility(type, id, newVis);
      if (res.success) {
        Notify.success(`Đã đổi quyền truy cập thành ${newVis}`);
        setContents(prev => prev.map(c => c.targetType === type && c.targetId === id ? { ...c, visibility: newVis } : c));
      }
    } catch (e: any) {
      Notify.failure(e.message || "Lỗi cập nhật Visibility");
    }
  };

  const handleSavePolicy = async (event: React.FormEvent) => {
    event.preventDefault();
    const subjectId = Number(policy.subjectId);
    if (!Number.isInteger(subjectId) || subjectId <= 0) return Notify.failure("Subject ID không hợp lệ");
    setSavingPolicy(true);
    try {
      await marketplaceService.updateReviewPolicy(subjectId, {
        mode: policy.mode as "SINGLE_REVIEWER" | "QUORUM",
        requiredVotes: policy.mode === "SINGLE_REVIEWER" ? 1 : policy.requiredVotes,
        approvalPercentage: policy.mode === "SINGLE_REVIEWER" ? 100 : policy.approvalPercentage,
      });
      Notify.success("Đã cập nhật rule duyệt cho môn học");
    } catch (error: any) {
      Notify.failure(error.message || "Không thể cập nhật rule duyệt");
    } finally { setSavingPolicy(false); }
  };

  const handleLoadPolicy = async () => {
    const subjectId = Number(policy.subjectId);
    if (!Number.isInteger(subjectId) || subjectId <= 0) return Notify.failure("Subject ID không hợp lệ");
    setSavingPolicy(true);
    try {
      const response = await marketplaceService.getReviewPolicy(subjectId);
      setPolicy({
        subjectId: String(subjectId),
        mode: response.data.mode,
        requiredVotes: response.data.requiredVotes,
        approvalPercentage: response.data.approvalPercentage,
      });
      Notify.success(response.data.subjectOverride ? "Đã tải rule riêng của môn" : "Môn đang dùng rule mặc định");
    } catch (error: any) {
      Notify.failure(error.message || "Không thể tải rule duyệt");
    } finally { setSavingPolicy(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold">Chợ Nội Dung (Marketplace)</h2>
          <p className="text-sm text-muted-foreground mt-1">Duyệt bài và quản lý tất cả các tài liệu, flashcard, quiz trên hệ thống.</p>
        </div>
        <div className="flex p-1 bg-muted rounded-xl border border-border/50 self-start shrink-0">
          <button 
            onClick={() => setActiveTab("pending")} 
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "pending" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            Hàng chờ duyệt
          </button>
          <button 
            onClick={() => setActiveTab("all")} 
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "all" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            Tất cả nội dung
          </button>
        </div>
      </div>

      <div className="surface-card p-4 relative">
        <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm kiếm nội dung..."
          className="w-full pl-10 pr-3 h-10 rounded-xl bg-muted/60 border border-transparent focus:bg-card focus:border-primary outline-none text-sm"
        />
      </div>

      <form onSubmit={handleSavePolicy} className="surface-card grid gap-3 p-4 md:grid-cols-[1fr_1fr_1fr_1fr_auto_auto] md:items-end">
        <label className="text-xs font-semibold text-muted-foreground">Môn học<select required value={policy.subjectId} onChange={(e) => setPolicy({ ...policy, subjectId: e.target.value })} className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"><option value="">Chọn môn</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.code} — {subject.name}</option>)}</select></label>
        <label className="text-xs font-semibold text-muted-foreground">Cơ chế<select value={policy.mode} onChange={(e) => setPolicy({ ...policy, mode: e.target.value })} className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"><option value="SINGLE_REVIEWER">1 reviewer</option><option value="QUORUM">Vote quorum</option></select></label>
        <label className="text-xs font-semibold text-muted-foreground">Số vote<input type="number" min="2" disabled={policy.mode === "SINGLE_REVIEWER"} value={policy.requiredVotes} onChange={(e) => setPolicy({ ...policy, requiredVotes: Number(e.target.value) })} className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-sm disabled:opacity-40" /></label>
        <label className="text-xs font-semibold text-muted-foreground">Tỷ lệ approve %<input type="number" min="1" max="100" disabled={policy.mode === "SINGLE_REVIEWER"} value={policy.approvalPercentage} onChange={(e) => setPolicy({ ...policy, approvalPercentage: Number(e.target.value) })} className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-sm disabled:opacity-40" /></label>
        <button type="button" onClick={handleLoadPolicy} disabled={savingPolicy} className="h-10 rounded-xl border border-border px-4 text-sm font-bold disabled:opacity-50">Đọc rule</button>
        <button disabled={savingPolicy} className="h-10 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-50">Lưu rule</button>
      </form>

      <div className="surface-card rounded-2xl overflow-hidden border border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Nội dung</th>
                <th className="px-6 py-4 font-medium">Phân loại</th>
                <th className="px-6 py-4 font-medium">Trạng thái</th>
                <th className="px-6 py-4 font-medium text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              <AnimatePresence>
                {isLoading ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-muted-foreground"><div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />Đang tải dữ liệu...</td></tr>
                ) : contents.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">Không có nội dung nào.</td></tr>
                ) : (
                  contents.map((item) => (
                    <motion.tr 
                      key={`${item.targetType}_${item.targetId}`}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground">{item.title}</div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                          <span>{item.creatorName || "Ẩn danh"}</span>
                          {item.subjectId && <span>• Môn #{item.subjectId}</span>}
                          {item.submittedAt && <span>• Gửi: {new Date(item.submittedAt).toLocaleDateString()}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                          item.targetType === "DOCUMENT" ? "bg-blue-500/15 text-blue-500" :
                          item.targetType === "FLASHCARD_DECK" ? "bg-purple-500/15 text-purple-500" :
                          "bg-emerald-500/15 text-emerald-500"
                        }`}>
                          {item.targetType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                            item.marketStatus === "PENDING" ? "bg-warning/10 text-warning-foreground border-warning/20" :
                            item.marketStatus === "APPROVED" ? "bg-emerald-500/12 text-emerald-300 border border-emerald-500/25" :
                            item.marketStatus === "REJECTED" ? "bg-destructive/10 text-destructive border-destructive/20" :
                            "bg-muted text-muted-foreground border-border"
                          }`}>
                            {item.marketStatus === "PENDING" ? <Clock size={10} /> : item.marketStatus === "APPROVED" ? <ShieldCheck size={10} /> : <XCircle size={10} />}
                            {item.marketStatus || "NONE"}
                          </span>
                          {activeTab === "all" && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                              {item.visibility === "MARKETPLACE" ? <Globe size={10} className="text-primary" /> : <Lock size={10} />}
                              {item.visibility}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {activeTab === "pending" ? (
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleApprove(item.targetType, item.targetId)}
                              className="px-3 h-8 rounded-lg bg-success/15 text-success text-xs font-semibold hover:bg-success hover:text-success-foreground transition-colors flex items-center gap-1"
                            >
                              <ShieldCheck size={14} /> Duyệt
                            </button>
                            <button 
                              onClick={() => handleReject(item.targetType, item.targetId)}
                              className="px-3 h-8 rounded-lg bg-destructive/15 text-destructive text-xs font-semibold hover:bg-destructive hover:text-destructive-foreground transition-colors flex items-center gap-1"
                            >
                              <XCircle size={14} /> Từ chối
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleUpdateVisibility(item.targetType, item.targetId, item.visibility || "")}
                              className="size-8 rounded-lg bg-muted text-foreground flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors"
                              title={item.visibility === "MARKETPLACE" ? "Ẩn khỏi chợ" : "Đưa lên chợ"}
                            >
                              {item.visibility === "MARKETPLACE" ? <Lock size={14} /> : <Globe size={14} />}
                            </button>
                            <button 
                              onClick={() => handleDelete(item.targetType, item.targetId)}
                              className="size-8 rounded-lg bg-destructive/15 text-destructive flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                              title="Xóa nội dung"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
