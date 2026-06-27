"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Search, Download, MoreVertical, Tag, Share2, Copy, X, CheckCircle2, Link, RefreshCw, Trash2 } from "lucide-react";
import { useMemo, useRef, useState, useEffect } from "react";
import { documentService, DocumentDTO, ShareLinkDTO } from "../services/documentService";
import { Notify } from "notiflix";

// 🎯 BẢNG MÀU CHUẨN THƯƠNG HIỆU CHO TỪNG LOẠI FILE (HỖ TRỢ CẢ DARK MODE)
const typeStyles: Record<string, { activeBtn: string; badge: string }> = {
  all: {
    activeBtn: "bg-ink text-cream shadow-sm",
    badge: "bg-muted text-muted-foreground border-transparent",
  },
  pdf: {
    activeBtn: "bg-red-500 text-white shadow-md shadow-red-500/20 hover:bg-red-600",
    badge: "bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-500/20 dark:text-red-400",
  },
  docx: {
    activeBtn: "bg-blue-500 text-white shadow-md shadow-blue-500/20 hover:bg-blue-600",
    badge: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400",
  },
  pptx: {
    activeBtn: "bg-orange-500 text-white shadow-md shadow-orange-500/20 hover:bg-orange-600",
    badge: "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:bg-orange-500/20 dark:text-orange-400",
  },
  txt: {
    activeBtn: "bg-slate-600 text-white shadow-md shadow-slate-600/20 hover:bg-slate-700 dark:bg-slate-500",
    badge: "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:bg-slate-500/20 dark:text-slate-400",
  },
};

export default function DocumentsPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string>("all");
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [docsList, setDocsList] = useState<DocumentDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Share Modal State
  const [shareModalDoc, setShareModalDoc] = useState<DocumentDTO | null>(null);
  const [shareInfo, setShareInfo] = useState<ShareLinkDTO | null>(null);
  const [isShareLoading, setIsShareLoading] = useState(false);
  const [shareForm, setShareForm] = useState({ allowDownload: true, expiresAt: "" });

  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = async () => {
    setIsLoading(true);
    try {
      const res = await documentService.getWorkspaceDocuments(0, 50);
      if (res.success) setDocsList(res.data.items);
    } catch (err: any) {
      Notify.failure("Lỗi tải tài liệu: " + (err.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  {/* 🌟 HÀM DÙNG CHUNG: Xử lý vòng lặp upload danh sách File nhận vào */}
  const processFilesUpload = async (files: FileList) => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await documentService.uploadDocument(file);
        if (res.success) {
          Notify.success(`Tải lên ${file.name} thành công`);
          setDocsList(prev => [res.data, ...prev]);
        }
      }
    } catch (err: any) {
      Notify.failure("Tải lên thất bại: " + (err.message || "Unknown error"));
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  {/* Xử lý khi chọn file bằng cửa sổ File Explorer (Click) */}
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) await processFilesUpload(files);
  };

  {/* 🌟 HÀM MỚI THÊM: Xử lý trích xuất danh sách file khi người dùng THẢ CHUỘT (Drop) */}
  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDrag(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFilesUpload(files);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const filtered = useMemo(
    () =>
      docsList.filter(
        (d) =>
          (type === "all" || d.fileType === type) &&
          (d.title.toLowerCase().includes(query.toLowerCase())),
      ),
    [docsList, query, type],
  );

  // ── Share Logic ──
  const openShareModal = async (doc: DocumentDTO) => {
    setShareModalDoc(doc);
    setShareInfo(null);
    setIsShareLoading(true);
    setShareForm({ allowDownload: true, expiresAt: "" });
    try {
      const res = await documentService.getShareLinkStatus(doc.id);
      if (res.success && res.data && res.data.visibility === "PUBLIC_LINK") {
        setShareInfo(res.data);
        setShareForm({
          allowDownload: res.data.allowDownload,
          expiresAt: res.data.expiresAt ? new Date(res.data.expiresAt).toISOString().slice(0, 16) : ""
        });
      }
    } catch (e: any) {
      if (e.errorCode !== "SHARE_LINK_NOT_FOUND") {
        Notify.failure("Lỗi tải thông tin chia sẻ.");
      }
    } finally {
      setIsShareLoading(false);
    }
  };

  const handleCreateShareLink = async () => {
    if (!shareModalDoc) return;
    setIsShareLoading(true);
    try {
      const res = await documentService.createShareLink(shareModalDoc.id, {
        allowDownload: shareForm.allowDownload,
        expiresAt: shareForm.expiresAt ? new Date(shareForm.expiresAt).toISOString() : null
      });
      if (res.success) {
        setShareInfo(res.data);
        Notify.success("Đã bật chia sẻ thành công!");
      }
    } catch (e: any) {
      Notify.failure("Không thể tạo link chia sẻ: " + e.message);
    } finally {
      setIsShareLoading(false);
    }
  };

  const handleUpdateShareLink = async (regenerateToken = false) => {
    if (!shareModalDoc) return;
    setIsShareLoading(true);
    try {
      const res = await documentService.updateShareLink(shareModalDoc.id, {
        allowDownload: shareForm.allowDownload,
        expiresAt: shareForm.expiresAt ? new Date(shareForm.expiresAt).toISOString() : null,
        regenerateToken
      });
      if (res.success) {
        setShareInfo(res.data);
        Notify.success(regenerateToken ? "Đã tạo link mới!" : "Đã lưu cấu hình chia sẻ!");
      }
    } catch (e: any) {
      Notify.failure("Không thể cập nhật link: " + e.message);
    } finally {
      setIsShareLoading(false);
    }
  };

  const handleRevokeShareLink = async () => {
    if (!shareModalDoc) return;
    setIsShareLoading(true);
    try {
      const res = await documentService.revokeShareLink(shareModalDoc.id);
      if (res.success) {
        setShareInfo(null);
        Notify.success("Đã tắt chia sẻ công khai.");
      }
    } catch (e: any) {
      Notify.failure("Không thể gỡ chia sẻ: " + e.message);
    } finally {
      setIsShareLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tài liệu</h1>
        <p className="text-muted-foreground mt-1">Tải lên, sắp xếp và tìm kiếm tài liệu học tập.</p>
      </div>

      {/* Uploader (Khung kéo thả) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}

        onDrop={handleFileDrop}
        onClick={() => !isUploading && inputRef.current?.click()}
        className={`surface-card border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
          drag ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50"
        } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
      >
        <input ref={inputRef} type="file" multiple className="hidden" onChange={handleFileUpload} />
        <div className="size-14 mx-auto mb-3 rounded-2xl bg-primary/10 text-primary grid place-items-center">
          {isUploading ? (
            <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload size={24} />
          )}
        </div>
        <div className="font-display text-lg font-semibold">
          {isUploading ? "Đang xử lý tải tài liệu lên..." : "Kéo & thả tài liệu vào đây"}
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          PDF, DOCX, PPTX, TXT · tối đa 50MB / file
        </div>
      </motion.div>

      {/* Filter Toolbar */}
      <div className="surface-card p-4 flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên, môn hoặc tag..."
            className="w-full pl-10 pr-3 h-10 rounded-xl bg-muted/60 border border-transparent focus:bg-card focus:border-primary outline-none text-sm transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
          {["all", "pdf", "docx", "pptx", "txt"].map((t) => {
            const isActive = type === t;
            return (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-4 h-9 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 outline-none ${
                  isActive 
                    ? typeStyles[t]?.activeBtn 
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {t === "all" ? "Tất cả" : t}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table List */}
      <div className="surface-card overflow-x-auto no-scrollbar border border-border/40 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground tracking-wider border-b border-border/50">
            <tr>
              <th className="text-left px-5 py-3.5">Tài liệu</th>
              <th className="text-left px-5 py-3.5 hidden md:table-cell">Môn</th>
              <th className="text-left px-5 py-3.5 hidden lg:table-cell">Tags</th>
              <th className="text-left px-5 py-3.5 hidden sm:table-cell">Dung lượng</th>
              <th className="text-left px-5 py-3.5 hidden lg:table-cell">Tải</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.map((d, i) => (
              <motion.tr
                key={d.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="hover:bg-muted/30 transition-colors group"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`size-9 rounded-xl grid place-items-center text-[10px] font-extrabold uppercase border transition-colors duration-300 ${
                      typeStyles[d.fileType.toLowerCase()]?.badge || "bg-muted text-muted-foreground border-transparent"
                    }`}>
                      {d.fileType}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate group-hover:text-primary cursor-pointer transition-colors">{d.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{formatDate(d.createdAt)}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 hidden md:table-cell">
                  {d.subjectId ? (
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-muted/80 border border-border/30 font-medium text-muted-foreground">Môn #{d.subjectId}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground font-mono">N/A</span>
                  )}
                </td>
                <td className="px-5 py-3 hidden lg:table-cell">
                  <div className="flex gap-1 flex-wrap">
                    <span className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-md bg-accent text-accent-foreground font-medium border border-border/10">
                      <Tag size={9} /> SYSTEM
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3 hidden sm:table-cell text-muted-foreground font-medium">{formatSize(d.fileSize)}</td>
                <td className="px-5 py-3 hidden lg:table-cell text-muted-foreground font-medium">{d.downloadCount}</td>
                <td className="px-5 py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    <button onClick={() => openShareModal(d)} className="size-8 rounded-lg hover:bg-muted grid place-items-center text-primary hover:text-primary transition-colors outline-none" title="Chia sẻ">
                      <Share2 size={14} />
                    </button>
                    <button className="size-8 rounded-lg hover:bg-muted grid place-items-center text-muted-foreground hover:text-foreground transition-colors outline-none">
                      <Download size={14} />
                    </button>
                    <button className="size-8 rounded-lg hover:bg-muted grid place-items-center text-muted-foreground hover:text-foreground transition-colors outline-none">
                      <MoreVertical size={14} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        
        {/* Empty State */}
        {filtered.length === 0 && (
          <div className="py-16 text-center text-muted-foreground animate-fade-in">
            <FileText size={36} className="mx-auto mb-3 opacity-30 text-primary" />
            <div className="font-medium">Không có tài liệu khớp tìm kiếm</div>
            <div className="text-xs opacity-70 mt-0.5">Vui lòng thử lại với từ khóa hoặc bộ lọc khác.</div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {shareModalDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShareModalDoc(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative surface-card w-full max-w-md rounded-2xl p-6 shadow-2xl border border-border/50">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-full bg-primary/10 text-primary grid place-items-center"><Share2 size={16} /></div>
                  <h3 className="font-bold font-display text-lg">Chia sẻ tài liệu</h3>
                </div>
                <button onClick={() => setShareModalDoc(null)} className="text-muted-foreground hover:text-foreground transition-colors"><X size={20} /></button>
              </div>

              <div className="mb-6 p-3 bg-muted/30 rounded-xl border border-border/50 flex items-center gap-3">
                <FileText size={20} className="text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium truncate text-sm">{shareModalDoc.title}</div>
                  <div className="text-[11px] text-muted-foreground">{formatSize(shareModalDoc.fileSize)} • {shareModalDoc.fileType.toUpperCase()}</div>
                </div>
              </div>

              {isShareLoading ? (
                <div className="py-10 flex flex-col items-center justify-center text-muted-foreground">
                  <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                  <span className="text-xs font-medium font-mono uppercase tracking-widest">Đang tải cấu hình...</span>
                </div>
              ) : shareInfo ? (
                <div className="space-y-5 animate-fade-in text-left">
                  <div className="p-4 bg-success/10 border border-success/20 rounded-xl flex items-start gap-3">
                    <CheckCircle2 className="text-success shrink-0 mt-0.5" size={18} />
                    <div>
                      <div className="font-bold text-success text-sm">Đang bật chia sẻ công khai</div>
                      <div className="text-xs text-success/80 mt-0.5">Bất kỳ ai có liên kết này đều có thể xem tài liệu.</div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Liên kết chia sẻ</label>
                    <div className="flex gap-2">
                      <div className="flex-1 h-10 bg-muted/60 rounded-xl border border-border/50 px-3 flex items-center overflow-hidden">
                        <Link size={14} className="text-muted-foreground mr-2 shrink-0" />
                        <span className="text-xs font-mono text-foreground truncate select-all">{shareInfo.shareUrl}</span>
                      </div>
                      <button onClick={() => { navigator.clipboard.writeText(shareInfo.shareUrl); Notify.success("Đã copy link"); }} className="h-10 px-3 bg-primary text-primary-foreground rounded-xl flex items-center gap-2 text-xs font-bold hover:bg-primary/90 transition-colors shrink-0">
                        <Copy size={14} /> Copy
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Cho phép tải file</label>
                      <select value={shareForm.allowDownload ? "yes" : "no"} onChange={(e) => setShareForm({ ...shareForm, allowDownload: e.target.value === "yes" })} className="w-full h-10 bg-muted/60 border border-border/50 rounded-xl px-3 text-sm font-medium outline-none focus:border-primary">
                        <option value="yes">Bật (Ai cũng tải được)</option>
                        <option value="no">Tắt (Chỉ xem online)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Hạn sử dụng</label>
                      <input type="datetime-local" value={shareForm.expiresAt} onChange={(e) => setShareForm({ ...shareForm, expiresAt: e.target.value })} className="w-full h-10 bg-muted/60 border border-border/50 rounded-xl px-3 text-sm font-medium outline-none focus:border-primary [color-scheme:dark]" />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/50 flex items-center justify-between gap-2 mt-6">
                    <button onClick={handleRevokeShareLink} className="h-10 px-4 rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2">
                      <Trash2 size={14} /> Gỡ Link
                    </button>
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdateShareLink(true)} className="size-10 rounded-xl bg-muted grid place-items-center text-muted-foreground hover:text-foreground transition-colors" title="Đổi Link mới (Hủy link cũ)">
                        <RefreshCw size={14} />
                      </button>
                      <button onClick={() => handleUpdateShareLink(false)} className="h-10 px-5 rounded-xl bg-card border border-border text-xs font-bold hover:bg-muted transition-colors">
                        Lưu Cấu Hình
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 animate-fade-in">
                  <div className="size-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <Share2 size={24} className="text-muted-foreground" />
                  </div>
                  <h4 className="font-bold text-foreground mb-1">Tài liệu đang riêng tư</h4>
                  <p className="text-xs text-muted-foreground mb-6 max-w-[250px] mx-auto">Tài liệu này chỉ mình bạn có thể xem. Hãy bật chia sẻ để cấp quyền truy cập công khai qua link.</p>
                  <button onClick={handleCreateShareLink} className="h-11 px-6 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 mx-auto">
                    <Link size={16} /> Bật Chia Sẻ Ngay
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}