"use client";

import { FolderOpen, Search, Upload, Plus, FileText, Download, Trash2, Globe, Tag, ExternalLink, X, Settings2, Share2, MoreVertical, CheckCircle2, Link, Copy, RefreshCw } from "lucide-react";
import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { DocumentDTO, ShareLinkDTO, documentService } from "../services/documentService";
import { Notify, Confirm } from "notiflix";
import CustomSelect from "../components/ui/CustomSelect";
import PublishModal from "../components/ui/PublishModal";
import AiProcessModal from "../components/ui/AiProcessModal";
import { 
  useDocuments, 
  useUploadDocument, 
  useDeleteDocument 
} from "../hooks/useDocuments";
import { motionFadeUp } from "../lib/motion";

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
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("all");
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [filterSubject, setFilterSubject] = useState("all");
  const [filterVisibility, setFilterVisibility] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Fetch using Custom Hook
  const { data: list = [], isLoading } = useDocuments({
    keyword: q,
    subjectId: filterSubject !== "all" ? Number(filterSubject) : undefined,
    visibility: filterVisibility !== "all" ? filterVisibility : undefined,
    processingStatus: filterStatus !== "all" ? filterStatus : undefined,
    sort: sortBy === "newest" ? "createdAt,desc" : sortBy === "oldest" ? "createdAt,asc" : undefined,
  });
  const deleteMutation = useDeleteDocument();

  // Upload using Custom Hook
  const uploadMutation = useUploadDocument();
  const isUploading = uploadMutation.isPending;

  // Mock functions for missing features
  const handleEdit = (id: number) => Notify.info("Tính năng Sửa đang được phát triển!");
  const handlePublish = (id: number) => {
    const doc = list.find(x => x.id === id);
    if (doc) setPublishModalDoc(doc);
  };
  const handleAddTag = (id: number) => Notify.info("Chức năng gắn Tag đang chờ API backend.");
  
  const handleDeleteDoc = (id: number) => {
    deleteMutation.mutate(id);
  };

  // Share Modal State
  const [shareModalDoc, setShareModalDoc] = useState<DocumentDTO | null>(null);
  const [publishModalDoc, setPublishModalDoc] = useState<DocumentDTO | null>(null);
  const [shareInfo, setShareInfo] = useState<ShareLinkDTO | null>(null);
  const [isShareLoading, setIsShareLoading] = useState(false);
  const [shareForm, setShareForm] = useState({ allowDownload: true, expiresAt: "" });

  // AI Process State
  const [aiProcessFiles, setAiProcessFiles] = useState<FileList | null>(null);

  {/* 🌟 HÀM DÙNG CHUNG: Xử lý vòng lặp upload danh sách File nhận vào */}
  const processFilesUpload = async (files: FileList) => {
    if (files.length === 0) return;
    setAiProcessFiles(files);
  };

  const executeActualUpload = async () => {
    if (!aiProcessFiles) return;
    const files = aiProcessFiles;
    setAiProcessFiles(null);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await uploadMutation.mutateAsync(file);
      }
    } catch (err: any) {
      // Error handled by hook
    } finally {
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
    () => {
      let result = list.filter((x) => {
        const matchSearch = (x.title || "").toLowerCase().includes((q || "").toLowerCase()) || (x.subjectId || "").toString().includes((q || "").toLowerCase());
        const matchSubject = filterSubject === "all" || x.subjectId === Number(filterSubject);
        const matchVis = filterVisibility === "all" || x.visibility === filterVisibility;
        const matchStatus = filterStatus === "all" || true;
        return matchSearch && matchSubject && matchVis && matchStatus;
      });

      if (sortBy === "newest") {
        result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      } else if (sortBy === "oldest") {
        result.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
      } else if (sortBy === "az") {
        result.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
      }
      return result;
    },
    [list, q, filterSubject, filterVisibility, filterStatus, sortBy],
  );

  // ── Share Logic ──
  const openShareModal = async (doc: DocumentDTO) => {
    setShareModalDoc(doc);
    setShareInfo(null);
    setIsShareLoading(true);
    setShareForm({ allowDownload: true, expiresAt: "" });
    try {
      const res = await documentService.getShareLinkStatus(doc.id);
      if (res.success && res.data && res.data.documentVisibility === "PUBLIC_LINK") {
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('pages.documents.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('pages.documents.desc')}</p>
        </div>
       
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
        <input id="file-upload" ref={inputRef} type="file" multiple className="hidden" onChange={handleFileUpload} />
        <div className="size-14 mx-auto mb-3 rounded-2xl bg-primary/10 text-primary grid place-items-center">
          {isUploading ? (
            <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload size={24} />
          )}
        </div>
        <div className="font-display text-lg font-semibold">
          {isUploading ? t('pages.documents.uploading') : t('pages.documents.dragDrop')}
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          {t('pages.documents.maxSize')}
        </div>
      </motion.div>

      {/* Filter Toolbar */}
      <div className="surface-card p-3 rounded-2xl flex flex-col lg:flex-row gap-3 items-center border border-border relative z-30">
        <div className="flex-1 relative flex items-center w-full">
          <Search className="absolute left-4 text-muted-foreground" size={16} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('pages.documents.search')}
            className="w-full pl-10 pr-4 h-11 bg-muted/50 border border-transparent focus:border-primary focus:bg-card outline-none transition-all text-sm rounded-xl"
          />
        </div>
        
        <div className="flex flex-wrap md:flex-nowrap gap-3 w-full lg:w-auto">
          <CustomSelect
            value={filterSubject}
            onChange={setFilterSubject}
            className="flex-1 md:flex-none w-full md:w-[170px]"
            data={[
              { label: t("filters.allSubjects"), value: "all" },
              {
                label: "Semester 5",
                options: [
                  { label: "SWP391", value: "SWP391" },
                  { label: "SWT301", value: "SWT301" },
                  { label: "SWR302", value: "SWR302" }
                ]
              },
              {
                label: "Semester 4",
                options: [
                  { label: "PRN221", value: "PRN221" },
                  { label: "PRJ301", value: "PRJ301" }
                ]
              }
            ]}
          />
          <CustomSelect
            value={filterVisibility}
            onChange={setFilterVisibility}
            className="flex-1 md:flex-none w-full md:w-[170px]"
            data={[
              { label: t("filters.allVisibility"), value: "all" },
              { label: t("filters.private"), value: "PRIVATE" },
              { label: t("filters.workspace"), value: "WORKSPACE" },
              { label: t("filters.marketplace"), value: "MARKETPLACE" }
            ]}
          />
          <CustomSelect
            value={filterStatus}
            onChange={setFilterStatus}
            className="flex-1 md:flex-none w-full md:w-[170px]"
            data={[
              { label: t("filters.allStatus"), value: "all" },
              { label: t("filters.pending"), value: "PENDING" },
              { label: t("filters.approved"), value: "APPROVED" },
              { label: t("filters.rejected"), value: "REJECTED" }
            ]}
          />
          <CustomSelect
            value={sortBy}
            onChange={setSortBy}
            className="flex-1 md:flex-none w-full md:w-[140px]"
            data={[
              { label: t('pages.documents.sortNewest'), value: "newest" },
              { label: t('pages.documents.sortOldest'), value: "oldest" },
              { label: t("filters.sortAZ"), value: "az" }
            ]}
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5 mt-4">
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

      {/* Table List */}
      <div className="surface-card !overflow-visible border border-border/40 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground tracking-wider border-b border-border/50">
            <tr>
              <th className="text-left px-5 py-3.5">{t('pages.documents.table.document')}</th>
              <th className="text-left px-5 py-3.5 hidden md:table-cell">{t('pages.documents.table.subject')}</th>
              <th className="text-left px-5 py-3.5 hidden lg:table-cell">{t('pages.documents.table.tags')}</th>
              <th className="text-left px-5 py-3.5 hidden sm:table-cell">{t('pages.documents.table.size')}</th>
              <th className="text-left px-5 py-3.5 hidden lg:table-cell">{t('pages.documents.table.downloads')}</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skel-${i}`}>
                  <td className="px-5 py-3 relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent z-10" />
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-xl bg-muted" />
                      <div>
                        <div className="h-4 w-32 bg-muted rounded mb-1" />
                        <div className="h-3 w-20 bg-muted/50 rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell"><div className="h-4 w-16 bg-muted rounded" /></td>
                  <td className="px-5 py-3 hidden lg:table-cell"><div className="h-4 w-12 bg-muted rounded" /></td>
                  <td className="px-5 py-3 hidden sm:table-cell"><div className="h-4 w-10 bg-muted rounded" /></td>
                  <td className="px-5 py-3 hidden lg:table-cell"><div className="h-4 w-6 bg-muted rounded" /></td>
                  <td className="px-5 py-3 text-right"><div className="h-8 w-8 bg-muted rounded-lg inline-block" /></td>
                </tr>
              ))
            ) : filtered.map((d, i) => (
              <motion.tr
                key={d.id}
                {...motionFadeUp(i)}
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
                    {/* Action Dropdown (Mocked) */}
                    <div className="relative group/menu">
                      <button className="size-8 rounded-lg hover:bg-muted grid place-items-center text-muted-foreground hover:text-foreground transition-colors outline-none">
                        <MoreVertical size={14} />
                      </button>
                      <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-border shadow-lg rounded-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-50 overflow-hidden" onClick={e => e.stopPropagation()}>
                        <button onClick={() => handleEdit(d.id)} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50">
                          <FileText size={14} /> {t('pages.documents.table.editDesc')}
                        </button>
                        <button onClick={() => handleAddTag(d.id)} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50">
                          <Tag size={14} /> {t('pages.documents.table.addTag')}
                        </button>
                        <button onClick={() => handlePublish(d.id)} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-primary hover:bg-primary/10">
                          <Globe size={14} /> {t('pages.documents.table.publish')}
                        </button>
                        <button onClick={() => handleDeleteDoc(d.id)} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 border-t border-border/50">
                          <Trash2 size={14} /> Xóa tài liệu
                        </button>
                      </div>
                    </div>
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

      {/* PUBLISH TO COMMUNITY MODAL */}
      <PublishModal 
        isOpen={!!publishModalDoc}
        onClose={() => setPublishModalDoc(null)}
        documentTitle={publishModalDoc?.title || ""}
        documentId={publishModalDoc?.id || ""}
      />

      {/* AI PROCESSING MODAL */}
      <AiProcessModal 
        isOpen={!!aiProcessFiles}
        fileName={aiProcessFiles?.length === 1 ? aiProcessFiles[0].name : `${aiProcessFiles?.length} tài liệu`}
        onComplete={executeActualUpload}
      />

    </div>
  );
}