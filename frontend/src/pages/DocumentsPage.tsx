"use client";

import { FolderOpen, Search, Upload, Plus, FileText, Download, Trash2, Globe, Tag, ExternalLink, X, Settings2, Share2, MoreVertical, CheckCircle2, Link, Copy, RefreshCw, Eye, Layers3, Loader2, AlertCircle, Grid, List, Pencil, Save } from "lucide-react";
import { useState, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ChunkDTO, DocumentDTO, ShareLinkDTO, TagDTO, documentService } from "../services/documentService";
import { Notify, Confirm } from "notiflix";
import CustomSelect from "../components/ui/CustomSelect";
import PublishModal from "../components/ui/PublishModal";
import { 
  useDocuments, 
  useUploadDocument, 
  useDeleteDocument 
} from "../hooks/useDocuments";
import { useSubjects } from "../hooks/useSubjects";
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

const statusBadgeStyles: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  PROCESSING: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  SUCCESS: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  FAILED: "bg-red-500/10 text-red-700 border-red-500/20",
  NONE: "bg-muted text-muted-foreground border-border/30",
  APPROVED: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  REJECTED: "bg-red-500/10 text-red-700 border-red-500/20",
};

const processingStatusLabels: Record<DocumentDTO["processingStatus"], string> = {
  PENDING: "Chờ chunking",
  PROCESSING: "Đang tạo chunks",
  SUCCESS: "Overview sẵn sàng",
  FAILED: "Chunking thất bại",
};

const DocumentCard = ({ doc, subjectMap, getSubjectLabel, documentTags, reprocessingId, deletingChunksId, processingStatusLabels, getStatusClass, chunkCounts, openOverview, openShareModal, handleDownload, downloadingId, handleEdit, openTagModal, handleReprocess, handleDeleteChunks, handlePublish, handleDeleteDoc, formatSize, formatDate, t }: any) => {
  const isReprocessing = reprocessingId === doc.id;
  const isDownloading = downloadingId === doc.id;
  
  // Extension specific theme colors
  const ext = doc.fileType.toLowerCase();
  const themesMap: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    pdf: { bg: "dark:bg-red-500/5", border: "dark:border-red-500/20", text: "text-red-500", glow: "rgba(239, 68, 68, 0.15)" },
    docx: { bg: "dark:bg-blue-500/5", border: "dark:border-blue-500/20", text: "text-blue-500", glow: "rgba(59, 130, 246, 0.15)" },
    pptx: { bg: "dark:bg-orange-500/5", border: "dark:border-orange-500/20", text: "text-orange-500", glow: "rgba(249, 115, 22, 0.15)" },
    txt: { bg: "dark:bg-slate-500/5", border: "dark:border-slate-500/20", text: "text-slate-400", glow: "rgba(100, 116, 139, 0.15)" }
  };
  const docTheme = themesMap[ext] || { bg: "dark:bg-indigo-500/5", border: "dark:border-indigo-500/20", text: "text-indigo-400", glow: "rgba(99, 102, 241, 0.15)" };

  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0 }
      }}
      className={`surface-card p-5 rounded-2xl border relative flex flex-col justify-between group hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_${docTheme.glow}] hover:-translate-y-1 transition-all duration-300 ${docTheme.bg} ${docTheme.border}`}
      style={{ willChange: "transform" }}
    >
      <div>
        {/* Card Header (File Type Badge & Options button) */}
        <div className="flex items-center justify-between mb-4">
          <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg border tracking-wider select-none ${docTheme.text} ${docTheme.border} bg-white dark:bg-black/20`}>
            {doc.fileType}
          </span>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => openShareModal(doc)} 
              className="size-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 grid place-items-center text-primary transition-colors outline-none" 
              title="Chia sẻ"
            >
              <Share2 size={14} />
            </button>
            <div className="relative group/menu">
              <button className="size-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 grid place-items-center text-muted-foreground hover:text-foreground transition-colors outline-none">
                <MoreVertical size={14} />
              </button>
              <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border shadow-lg rounded-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-50 overflow-hidden" onClick={e => e.stopPropagation()}>
                <button onClick={() => handleEdit(doc)} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50">
                  <FileText size={14} /> {t('pages.documents.table.editDesc')}
                </button>
                {doc.processingStatus === "SUCCESS" && (
                  <button onClick={() => openOverview(doc)} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50">
                    <Pencil size={14} /> Sửa text AI
                  </button>
                )}
                <button onClick={() => openTagModal(doc)} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50">
                  <Tag size={14} /> {t('pages.documents.table.addTag')}
                </button>
                <button onClick={() => handleReprocess(doc)} disabled={isReprocessing} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50 disabled:opacity-60">
                  <RefreshCw size={14} className={isReprocessing ? "animate-spin" : ""} /> Xử lý AI chunks
                </button>
                <button onClick={() => handleDeleteChunks(doc)} disabled={deletingChunksId === doc.id} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50 disabled:opacity-60">
                  <Trash2 size={14} /> Xóa AI chunks
                </button>
                <button onClick={() => handlePublish(doc.id)} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-primary hover:bg-primary/10">
                  <Globe size={14} /> {t('pages.documents.table.publish')}
                </button>
                <button onClick={() => handleDeleteDoc(doc.id)} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 border-t border-border/50">
                  <Trash2 size={14} /> Xóa tài liệu
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Title & Date */}
        <button 
          onClick={() => openOverview(doc)} 
          className="font-extrabold text-foreground text-base tracking-tight font-serif line-clamp-2 text-left mb-1 hover:text-primary cursor-pointer transition-colors"
        >
          {doc.title}
        </button>
        <span className="text-[11px] font-bold text-muted-foreground block mb-3">
          {formatDate(doc.createdAt)}
        </span>

        {/* Tags & Metadata badges */}
        <div className="flex flex-wrap gap-1 mb-4">
          {doc.subjectId ? (
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted/80 border border-border/30 font-medium text-muted-foreground">
              {getSubjectLabel(doc.subjectId)}
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground font-mono">N/A</span>
          )}

          {(documentTags[doc.id] ?? []).map((tag: any) => (
            <span 
              key={tag.id} 
              className="inline-flex text-[10px] px-2 py-0.5 rounded-md font-medium border" 
              style={{ color: tag.color, borderColor: `${tag.color}55`, backgroundColor: `${tag.color}14` }}
            >
              {tag.name}
            </span>
          ))}

          <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-medium border ${getStatusClass(isReprocessing ? "PROCESSING" : doc.processingStatus)}`}>
            {(doc.processingStatus === "PROCESSING" || doc.processingStatus === "PENDING" || isReprocessing) && <Loader2 size={10} className="animate-spin" />}
            {processingStatusLabels[isReprocessing ? "PROCESSING" : doc.processingStatus]}
          </span>
          {doc.marketStatus !== "NONE" && (
            <span className={`inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-md font-medium border ${getStatusClass(doc.marketStatus)}`}>
              {doc.marketStatus}
            </span>
          )}
        </div>

        {/* Reprocessing Progress */}
        {(doc.processingStatus === "PENDING" || doc.processingStatus === "PROCESSING" || isReprocessing) && (
          <div className="mb-4 h-1 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full w-1/2 rounded-full bg-primary animate-pulse" />
          </div>
        )}
      </div>

      {/* Card Footer (Actions & Size) */}
      <div className="mt-4 pt-4 border-t border-border/40 flex items-center justify-between text-xs font-bold text-muted-foreground">
        <div>
          <span>{formatSize(doc.fileSize)}</span>
          <span className="mx-2">•</span>
          <span>{doc.downloadCount || 0} tải</span>
        </div>
        <div className="flex items-center gap-2">
          {doc.processingStatus === "SUCCESS" && (
            <button 
              onClick={() => openOverview(doc)} 
              className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-semibold"
            >
              Overview
            </button>
          )}
          <button 
            onClick={() => handleDownload(doc)} 
            disabled={isDownloading} 
            className="size-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 grid place-items-center text-muted-foreground hover:text-foreground transition-colors outline-none disabled:opacity-50 border border-border"
          >
            {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          </button>
        </div>
      </div>
    </motion.div>
  );
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

  const { subjects, subjectMap } = useSubjects();
  const subjectFilterOptions = useMemo(
    () => subjects.map((subject) => ({ label: subject.code, value: String(subject.id) })),
    [subjects],
  );
  const getSubjectLabel = (subjectId: number | null) => {
    if (!subjectId) return "N/A";
    const subject = subjectMap[subjectId];
    return subject ? subject.code : `Môn #${subjectId}`;
  };

  const documentQueryParams = useMemo(() => {
    const processingStatuses = ["PENDING", "PROCESSING", "SUCCESS", "FAILED"] as const;
    const sortMap: Record<string, string> = {
      newest: "createdAt,desc",
      oldest: "createdAt,asc",
      az: "title,asc",
    };

    return {
      keyword: q,
      filters: {
        subjectId: filterSubject === "all" ? undefined : Number(filterSubject),
        fileType: type === "all" ? undefined : type,
        visibility: filterVisibility === "all" ? undefined : filterVisibility as DocumentDTO["visibility"],
        processingStatus: processingStatuses.includes(filterStatus as any) ? filterStatus as DocumentDTO["processingStatus"] : undefined,
        sort: sortMap[sortBy] ?? "createdAt,desc",
      },
    };
  }, [q, type, filterSubject, filterVisibility, filterStatus, sortBy]);

  // Fetch using Custom Hook
  const { data: list = [], isLoading, refetch } = useDocuments(documentQueryParams);
  const deleteMutation = useDeleteDocument();

  // Upload using Custom Hook
  const uploadMutation = useUploadDocument();
  const isUploading = uploadMutation.isPending;

  const [editModalDoc, setEditModalDoc] = useState<DocumentDTO | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string;
    description: string;
    subjectId: string;
    visibility: DocumentDTO["visibility"];
  }>({ title: "", description: "", subjectId: "", visibility: "PRIVATE" });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [reprocessingId, setReprocessingId] = useState<number | null>(null);
  const [deletingChunksId, setDeletingChunksId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [chunkCounts, setChunkCounts] = useState<Record<number, number>>({});
  const [overviewDoc, setOverviewDoc] = useState<DocumentDTO | null>(null);
  const [overviewChunks, setOverviewChunks] = useState<ChunkDTO[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState("");
  const [editingChunkId, setEditingChunkId] = useState<number | null>(null);
  const [editingChunkText, setEditingChunkText] = useState("");
  const [savingChunkId, setSavingChunkId] = useState<number | null>(null);
  const [tagModalDoc, setTagModalDoc] = useState<DocumentDTO | null>(null);
  const [availableTags, setAvailableTags] = useState<TagDTO[]>([]);
  const [documentTags, setDocumentTags] = useState<Record<number, TagDTO[]>>({});
  const [newTagName, setNewTagName] = useState("");
  const [isTagLoading, setIsTagLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const stats = useMemo(() => {
    const totalDocs = list.length;
    const totalSize = list.reduce((sum, doc) => sum + (doc.fileSize || 0), 0);
    const totalDownloads = list.reduce((sum, doc) => sum + (doc.downloadCount || 0), 0);
    return { totalDocs, totalSize, totalDownloads };
  }, [list]);

  const handleEdit = (doc: DocumentDTO) => {
    setEditModalDoc(doc);
    setEditForm({
      title: doc.title || "",
      description: doc.description || "",
      subjectId: doc.subjectId ? String(doc.subjectId) : "",
      visibility: doc.visibility || "PRIVATE",
    });
  };

  const handleSaveEdit = async () => {
    if (!editModalDoc) return;
    if (!editForm.title.trim()) {
      Notify.failure("Tên tài liệu không được để trống.");
      return;
    }

    setIsSavingEdit(true);
    try {
      await documentService.updateDocument(editModalDoc.id, {
        title: editForm.title.trim(),
        description: editForm.description.trim() || undefined,
        subjectId: editForm.subjectId ? Number(editForm.subjectId) : undefined,
        visibility: editForm.visibility,
      });
      Notify.success("Đã cập nhật tài liệu.");
      setEditModalDoc(null);
      await refetch();
    } catch (err: any) {
      Notify.failure("Cập nhật thất bại: " + (err.message || "Unknown error"));
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handlePublish = (id: number) => {
    const doc = list.find(x => x.id === id);
    if (doc) setPublishModalDoc(doc);
  };

  const openTagModal = async (doc: DocumentDTO) => {
    setTagModalDoc(doc);
    setNewTagName("");
    setIsTagLoading(true);
    try {
      const [allResponse, currentResponse] = await Promise.all([
        documentService.getAllTags(),
        documentService.getDocumentTags(doc.id),
      ]);
      setAvailableTags((allResponse.data as any)?.items || []);
      setDocumentTags((current) => ({ ...current, [doc.id]: currentResponse.data?.items || [] }));
    } catch (err: any) {
      Notify.failure("Không thể tải tag: " + (err.message || "Unknown error"));
    } finally {
      setIsTagLoading(false);
    }
  };

  const toggleTag = async (tag: TagDTO) => {
    if (!tagModalDoc) return;
    const currentTags = documentTags[tagModalDoc.id] ?? [];
    const isAttached = currentTags.some((item) => item.id === tag.id);
    setIsTagLoading(true);
    try {
      if (isAttached) {
        await documentService.removeTagFromDocument(tagModalDoc.id, tag.id);
      } else {
        await documentService.addTagToDocument(tagModalDoc.id, tag.id);
      }
      setDocumentTags((current) => ({
        ...current,
        [tagModalDoc.id]: isAttached ? currentTags.filter((item) => item.id !== tag.id) : [...currentTags, tag],
      }));
    } catch (err: any) {
      Notify.failure("Không thể cập nhật tag: " + (err.message || "Unknown error"));
    } finally {
      setIsTagLoading(false);
    }
  };

  const createAndAttachTag = async () => {
    if (!tagModalDoc || !newTagName.trim()) return;
    setIsTagLoading(true);
    try {
      const created = await documentService.createTag({ name: newTagName.trim(), type: "CUSTOM", color: "#0f9f7a" });
      await documentService.addTagToDocument(tagModalDoc.id, created.data.id);
      setAvailableTags((tags) => [...tags, created.data]);
      setDocumentTags((current) => ({ ...current, [tagModalDoc.id]: [...(current[tagModalDoc.id] ?? []), created.data] }));
      setNewTagName("");
      Notify.success("Đã tạo và gắn tag.");
    } catch (err: any) {
      Notify.failure("Không thể tạo tag: " + (err.message || "Unknown error"));
    } finally {
      setIsTagLoading(false);
    }
  };
  
  const handleDeleteDoc = (id: number) => {
    Confirm.show(
      "Xóa tài liệu",
      "Bạn chắc chắn muốn xóa tài liệu này? Hành động này sẽ gọi API xóa thật trên backend.",
      "Xóa",
      "Hủy",
      () => deleteMutation.mutate(id),
    );
  };

  const handleDownload = async (doc: DocumentDTO) => {
    setDownloadingId(doc.id);
    try {
      const download = await documentService.downloadDocument(doc.id, doc.title, doc.fileType);
      const anchor = document.createElement("a");
      anchor.href = download.blobUrl;
      anchor.download = download.fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(download.blobUrl), 1000);
    } catch (err: any) {
      Notify.failure("Không thể tải tài liệu: " + (err.message || "Unknown error"));
    } finally {
      setDownloadingId(null);
    }
  };

  const openOverview = async (doc: DocumentDTO) => {
    setOverviewDoc(doc);
    setOverviewChunks([]);
    setOverviewError("");
    setEditingChunkId(null);
    setEditingChunkText("");
    setOverviewLoading(true);
    try {
      const [detailResponse, chunksResponse] = await Promise.all([
        documentService.getDocumentDetails(doc.id),
        documentService.getDocumentChunks(doc.id),
      ]);
      setOverviewDoc(detailResponse.data);
      setOverviewChunks(chunksResponse.data ?? []);
      setChunkCounts((counts) => ({ ...counts, [doc.id]: chunksResponse.data?.length ?? 0 }));
    } catch (err: any) {
      setOverviewError(err.message || "Không thể tải nội dung chunks");
    } finally {
      setOverviewLoading(false);
    }
  };

  const closeOverview = () => {
    setOverviewDoc(null);
    setOverviewError("");
    setEditingChunkId(null);
    setEditingChunkText("");
  };

  const startEditingChunk = (chunk: ChunkDTO) => {
    setEditingChunkId(chunk.id);
    setEditingChunkText(chunk.textContent || "");
  };

  const cancelEditingChunk = () => {
    setEditingChunkId(null);
    setEditingChunkText("");
  };

  const handleSaveChunkText = async (chunk: ChunkDTO) => {
    if (!overviewDoc) return;

    const nextText = editingChunkText.trim();
    if (!nextText) {
      Notify.failure("Nội dung chunk không được để trống.");
      return;
    }

    if (nextText === (chunk.textContent || "").trim()) {
      cancelEditingChunk();
      return;
    }

    setSavingChunkId(chunk.id);
    try {
      const response = await documentService.updateDocumentChunk(overviewDoc.id, chunk.id, {
        textContent: nextText,
      });

      if (response.data) {
        setOverviewChunks((chunks) => chunks.map((item) => item.id === chunk.id ? response.data : item));
      }

      Notify.success("Đã cập nhật text chunk và embedding.");
      cancelEditingChunk();
    } catch (err: any) {
      Notify.failure("Không thể cập nhật text chunk: " + (err.message || "Unknown error"));
    } finally {
      setSavingChunkId(null);
    }
  };

  useEffect(() => {
    if (!overviewDoc) return;
    const latest = list.find((document) => document.id === overviewDoc.id);
    if (!latest || latest.processingStatus === overviewDoc.processingStatus) return;
    if (latest.processingStatus === "SUCCESS") {
      openOverview(latest);
    } else {
      setOverviewDoc(latest);
    }
  }, [list]);

  const handleReprocess = async (doc: DocumentDTO) => {
    setReprocessingId(doc.id);
    try {
      const response = await documentService.processDocumentChunks(doc.id, { chunkSize: 800, overlap: 120 });
      setChunkCounts((counts) => ({ ...counts, [doc.id]: response.data.chunkCount }));
      Notify.success("Đã gửi lại yêu cầu xử lý AI chunks.");
      await refetch();
    } catch (err: any) {
      Notify.failure("Không thể xử lý lại tài liệu: " + (err.message || "Unknown error"));
    } finally {
      setReprocessingId(null);
    }
  };

  // Share Modal State
  const [shareModalDoc, setShareModalDoc] = useState<DocumentDTO | null>(null);
  const [publishModalDoc, setPublishModalDoc] = useState<DocumentDTO | null>(null);
  const [shareInfo, setShareInfo] = useState<ShareLinkDTO | null>(null);
  const [isShareLoading, setIsShareLoading] = useState(false);
  const [shareForm, setShareForm] = useState({ allowPreview: true, allowDownload: true, expiresAt: "" });

  {/* Xử lý upload thật theo từng file; trạng thái lấy trực tiếp từ mutation/API. */}
  const processFilesUpload = async (files: FileList) => {
    if (files.length === 0) return;
    try {
      for (let i = 0; i < files.length; i++) {
        await uploadMutation.mutateAsync(files[i]);
      }
    } catch {
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

  const handleDeleteChunks = (doc: DocumentDTO) => {
    Confirm.show(
      "Xóa dữ liệu AI",
      `Xóa toàn bộ chunks đã trích xuất của “${doc.title}”? Bạn có thể xử lý lại sau.`,
      "Xóa chunks",
      "Hủy",
      async () => {
        setDeletingChunksId(doc.id);
        try {
          await documentService.deleteDocumentChunks(doc.id);
          setChunkCounts((counts) => ({ ...counts, [doc.id]: 0 }));
          Notify.success("Đã xóa dữ liệu AI chunks.");
          await refetch();
        } catch (err: any) {
          Notify.failure("Không thể xóa chunks: " + (err.message || "Unknown error"));
        } finally {
          setDeletingChunksId(null);
        }
      },
    );
  };

  const getStatusClass = (status: string) => statusBadgeStyles[status] || statusBadgeStyles.NONE;

  const filtered = useMemo(
    () => {
      let result = list.filter((x) => {
        const keyword = (q || "").toLowerCase();
        const matchSearch =
          (x.title || "").toLowerCase().includes(keyword) ||
          (x.description || "").toLowerCase().includes(keyword) ||
          (x.subjectId || "").toString().includes(keyword);
        const matchType = type === "all" || (x.fileType || "").toLowerCase() === type;
        const matchSubject = filterSubject === "all" || x.subjectId === Number(filterSubject);
        const matchVis = filterVisibility === "all" || x.visibility === filterVisibility;
        const matchStatus = filterStatus === "all" || x.processingStatus === filterStatus || x.marketStatus === filterStatus;
        return matchSearch && matchType && matchSubject && matchVis && matchStatus;
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
    [list, q, type, filterSubject, filterVisibility, filterStatus, sortBy],
  );

  // ── Share Logic ──
  const openShareModal = async (doc: DocumentDTO) => {
    setShareModalDoc(doc);
    setShareInfo(null);
    setIsShareLoading(true);
    setShareForm({ allowPreview: true, allowDownload: true, expiresAt: "" });
    try {
      const res = await documentService.getShareLinkStatus(doc.id);
      if (res.success && res.data && res.data.isEnabled) {
        setShareInfo(res.data);
        setShareForm({
          allowPreview: res.data.allowPreview,
          allowDownload: res.data.allowDownload,
          expiresAt: res.data.expiresAt ? new Date(res.data.expiresAt).toISOString().slice(0, 16) : ""
        });
      }
    } catch (e: any) {
      if (e.errorCode !== "SHARE_LINK_NOT_FOUND" && e.errorCode !== "DOCUMENT_SHARE_LINK_NOT_FOUND") {
        Notify.failure("Lỗi tải thông tin chia sẻ.");
      }
    } finally {
      setIsShareLoading(false);
    }
  };

  const handleCreateShareLink = async () => {
    if (!shareModalDoc) return;
    if (!shareForm.allowPreview && !shareForm.allowDownload) return Notify.warning("Phải bật ít nhất quyền xem trước hoặc tải file.");
    setIsShareLoading(true);
    try {
      const res = await documentService.createShareLink(shareModalDoc.id, {
        allowPreview: shareForm.allowPreview,
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

  const handleUpdateShareLink = async () => {
    if (!shareModalDoc) return;
    if (!shareForm.allowPreview && !shareForm.allowDownload) return Notify.warning("Phải bật ít nhất quyền xem trước hoặc tải file.");
    setIsShareLoading(true);
    try {
      const res = await documentService.updateShareLink(shareModalDoc.id, {
        allowPreview: shareForm.allowPreview,
        allowDownload: shareForm.allowDownload,
        expiresAt: shareForm.expiresAt ? new Date(shareForm.expiresAt).toISOString() : null,
      });
      if (res.success) {
        setShareInfo(res.data);
        Notify.success("Đã lưu cấu hình chia sẻ!");
      }
    } catch (e: any) {
      Notify.failure("Không thể cập nhật link: " + e.message);
    } finally {
      setIsShareLoading(false);
    }
  };

  const handleRegenerateShareLink = async () => {
    if (!shareModalDoc) return;
    if (!shareForm.allowPreview && !shareForm.allowDownload) return Notify.warning("Phải bật ít nhất quyền xem trước hoặc tải file.");
    setIsShareLoading(true);
    try {
      await documentService.revokeShareLink(shareModalDoc.id);
      const res = await documentService.createShareLink(shareModalDoc.id, {
        allowPreview: shareForm.allowPreview,
        allowDownload: shareForm.allowDownload,
        expiresAt: shareForm.expiresAt ? new Date(shareForm.expiresAt).toISOString() : null,
      });
      if (res.success) {
        setShareInfo(res.data);
        Notify.success("Đã tạo link mới.");
      }
    } catch (e: any) {
      Notify.failure("Không thể tạo link mới: " + e.message);
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

  const copyShareLink = async () => {
    if (!shareInfo?.shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareInfo.shareUrl);
      Notify.success("Đã sao chép link chia sẻ");
    } catch {
      Notify.failure("Trình duyệt không cho phép sao chép tự động. Hãy chọn link và copy thủ công.");
    }
  };

  const openSharedPage = () => {
    if (shareInfo?.shareUrl) window.open(shareInfo.shareUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6">
      {/* Load Elegant Cursive & Calligraphy Font dynamically */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
        .font-cursive {
          font-family: 'Dancing Script', cursive !important;
        }
      `}} />

      {/* Compact Title Header with View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-pink-500 to-indigo-600 dark:from-cyan-400 dark:via-pink-400 dark:to-indigo-400 font-cursive tracking-wide pb-1 drop-shadow-sm">
            Tài Liệu Của Bé
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Quản lý và ôn tập tài liệu học tập của bé</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button 
            onClick={() => setViewMode("grid")}
            className={`p-2.5 rounded-xl border transition-all ${viewMode === "grid" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"}`}
            title="Dạng thẻ"
          >
            <Grid size={18} />
          </button>
          <button 
            onClick={() => setViewMode("list")}
            className={`p-2.5 rounded-xl border transition-all ${viewMode === "list" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"}`}
            title="Dạng bảng"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* QuickStats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 w-full relative z-10">
         <div className="surface-card p-5 rounded-2xl flex items-center gap-4 hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
               <FileText size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tổng tài liệu</p>
              <h4 className="text-2xl font-black text-foreground mt-0.5">{stats.totalDocs}</h4>
            </div>
         </div>
         <div className="surface-card p-5 rounded-2xl flex items-center gap-4 hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-14 h-14 bg-teal-50 dark:bg-teal-500/10 rounded-xl border border-teal-100 dark:border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0 group-hover:scale-110 group-hover:bg-teal-500 group-hover:text-white transition-all duration-300">
               <Layers3 size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Dung lượng sử dụng</p>
              <h4 className="text-2xl font-black text-foreground mt-0.5">{formatSize(stats.totalSize)}</h4>
            </div>
         </div>
         <div className="surface-card p-5 rounded-2xl flex items-center gap-4 hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-14 h-14 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-100 dark:border-rose-500/20 flex items-center justify-center text-rose-500 dark:text-rose-400 shrink-0 group-hover:scale-110 group-hover:bg-rose-500 group-hover:text-white transition-all duration-300">
               <Download size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tổng lượt tải</p>
              <h4 className="text-2xl font-black text-foreground mt-0.5">{stats.totalDownloads}</h4>
            </div>
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
              { label: "Môn học", options: subjectFilterOptions },
            ]}
          />
          <CustomSelect
            value={filterVisibility}
            onChange={setFilterVisibility}
            className="flex-1 md:flex-none w-full md:w-[170px]"
            data={[
              { label: t("filters.allVisibility"), value: "all" },
              { label: t("filters.private"), value: "PRIVATE" },
              { label: "Public link", value: "PUBLIC_LINK" },
              { label: t("filters.marketplace"), value: "MARKETPLACE" }
            ]}
          />
          <CustomSelect
            value={filterStatus}
            onChange={setFilterStatus}
            className="flex-1 md:flex-none w-full md:w-[170px]"
            data={[
              { label: t("filters.allStatus"), value: "all" },
              { label: "Chờ xử lý", value: "PENDING" },
              { label: "Đang xử lý", value: "PROCESSING" },
              { label: "Xử lý xong", value: "SUCCESS" },
              { label: "Xử lý lỗi", value: "FAILED" },
              { label: t("filters.approved"), value: "APPROVED" },
              { label: t("filters.rejected"), value: "REJECTED" },
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

      {/* Documents Render Container */}
      <div className="w-full !overflow-visible">
        {viewMode === "grid" ? (
          isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={`skel-card-${i}`} className="surface-card p-5 rounded-2xl border border-border/40 relative h-[210px] animate-pulse">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-6 w-12 bg-muted rounded" />
                    <div className="h-6 w-6 bg-muted rounded-full" />
                  </div>
                  <div className="h-5 w-4/5 bg-muted rounded mb-2" />
                  <div className="h-4 w-1/4 bg-muted rounded mb-4" />
                  <div className="flex gap-2">
                    <div className="h-5 w-16 bg-muted rounded" />
                    <div className="h-5 w-20 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div 
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.05 }
                }
              }}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full"
            >
              {filtered.map((d) => (
                <DocumentCard
                  key={d.id}
                  doc={d}
                  subjectMap={subjectMap}
                  getSubjectLabel={getSubjectLabel}
                  documentTags={documentTags}
                  reprocessingId={reprocessingId}
                  processingStatusLabels={processingStatusLabels}
                  getStatusClass={getStatusClass}
                  chunkCounts={chunkCounts}
                  openOverview={openOverview}
                  openShareModal={openShareModal}
                  handleDownload={handleDownload}
                  downloadingId={downloadingId}
                  handleEdit={handleEdit}
                  openTagModal={openTagModal}
                  handleReprocess={handleReprocess}
                  handleDeleteChunks={handleDeleteChunks}
                  handlePublish={handlePublish}
                  handleDeleteDoc={handleDeleteDoc}
                  formatSize={formatSize}
                  formatDate={formatDate}
                  t={t}
                />
              ))}
            </motion.div>
          )
        ) : (
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
                          <button onClick={() => openOverview(d)} className="font-medium truncate group-hover:text-primary cursor-pointer transition-colors block max-w-full text-left" title="Xem overview tài liệu">{d.title}</button>
                          <div className="text-xs text-muted-foreground mt-0.5">{formatDate(d.createdAt)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      {d.subjectId ? (
                        <span className="text-xs px-2.5 py-1 rounded-lg bg-muted/80 border border-border/30 font-medium text-muted-foreground">{getSubjectLabel(d.subjectId)}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground font-mono">N/A</span>
                      )}
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell">
                      <div className="flex gap-1 flex-wrap">
                        {(documentTags[d.id] ?? []).map((tag) => (
                          <span key={tag.id} className="inline-flex text-[10px] px-2 py-0.5 rounded-md font-medium border" style={{ color: tag.color, borderColor: `${tag.color}55`, backgroundColor: `${tag.color}14` }}>
                            {tag.name}
                          </span>
                        ))}
                        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-medium border ${getStatusClass(reprocessingId === d.id ? "PROCESSING" : d.processingStatus)}`}>
                          {(d.processingStatus === "PROCESSING" || d.processingStatus === "PENDING" || reprocessingId === d.id) && <Loader2 size={10} className="animate-spin" />}
                          {processingStatusLabels[reprocessingId === d.id ? "PROCESSING" : d.processingStatus]}
                        </span>
                        {d.marketStatus !== "NONE" && (
                          <span className={`inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-md font-medium border ${getStatusClass(d.marketStatus)}`}>
                            {d.marketStatus}
                          </span>
                        )}
                      </div>
                      {(d.processingStatus === "PENDING" || d.processingStatus === "PROCESSING" || reprocessingId === d.id) && (
                        <div className="mt-2 h-1 w-24 rounded-full bg-muted overflow-hidden">
                          <div className="h-full w-1/2 rounded-full bg-primary animate-pulse" />
                        </div>
                      )}
                      {d.processingStatus === "SUCCESS" && (
                        <button onClick={() => openOverview(d)} className="mt-1.5 text-[10px] text-primary font-semibold hover:underline">
                          {chunkCounts[d.id] !== undefined ? `${chunkCounts[d.id]} chunks · ` : ""}Xem overview
                        </button>
                      )}
                      {d.processingStatus === "FAILED" && <div className="mt-1 text-[10px] text-destructive">Xử lý thất bại · Có thể chạy lại</div>}
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell text-muted-foreground font-medium">{formatSize(d.fileSize)}</td>
                    <td className="px-5 py-3 hidden lg:table-cell text-muted-foreground font-medium">{d.downloadCount}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button onClick={() => openShareModal(d)} className="size-8 rounded-lg hover:bg-muted grid place-items-center text-primary hover:text-primary transition-colors outline-none" title="Chia sẻ">
                          <Share2 size={14} />
                        </button>
                        <button onClick={() => openOverview(d)} className="size-8 rounded-lg hover:bg-muted grid place-items-center text-muted-foreground hover:text-primary transition-colors outline-none" title="Xem overview chunks">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => handleDownload(d)} disabled={downloadingId === d.id} className="size-8 rounded-lg hover:bg-muted grid place-items-center text-muted-foreground hover:text-foreground transition-colors outline-none disabled:opacity-50" title="Tải xuống">
                          {downloadingId === d.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                        </button>
                        <div className="relative group/menu">
                          <button className="size-8 rounded-lg hover:bg-muted grid place-items-center text-muted-foreground hover:text-foreground transition-colors outline-none">
                            <MoreVertical size={14} />
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border shadow-lg rounded-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-50 overflow-hidden" onClick={e => e.stopPropagation()}>
                            <button onClick={() => handleEdit(d)} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50">
                              <FileText size={14} /> {t('pages.documents.table.editDesc')}
                            </button>
                            {d.processingStatus === "SUCCESS" && (
                              <button onClick={() => openOverview(d)} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50">
                                <Pencil size={14} /> Sửa text AI
                              </button>
                            )}
                            <button onClick={() => openTagModal(d)} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50">
                              <Tag size={14} /> {t('pages.documents.table.addTag')}
                            </button>
                            <button onClick={() => handleReprocess(d)} disabled={reprocessingId === d.id} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50 disabled:opacity-60">
                              <RefreshCw size={14} className={reprocessingId === d.id ? "animate-spin" : ""} /> Xử lý AI chunks
                            </button>
                            <button onClick={() => handleDeleteChunks(d)} disabled={deletingChunksId === d.id} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50 disabled:opacity-60">
                              <Trash2 size={14} /> Xóa AI chunks
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
          </div>
        )}
        
        {/* Empty State */}
        {filtered.length === 0 && (
          <div className="py-16 text-center text-muted-foreground animate-fade-in surface-card border border-border/40 mt-6 rounded-2xl">
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
                      <div className="flex-1 min-w-0 h-10 bg-muted/60 rounded-xl border border-border/50 px-3 flex items-center overflow-hidden">
                        <Link size={14} className="text-muted-foreground mr-2 shrink-0" />
                        <input readOnly value={shareInfo.shareUrl} onFocus={(event) => event.currentTarget.select()} className="w-full bg-transparent text-xs font-mono text-foreground outline-none" aria-label="Liên kết chia sẻ công khai" />
                      </div>
                      <button onClick={copyShareLink} className="h-10 px-3 bg-primary text-primary-foreground rounded-xl flex items-center gap-2 text-xs font-bold hover:bg-primary/90 transition-colors shrink-0">
                        <Copy size={14} /> Copy
                      </button>
                      <button onClick={openSharedPage} className="size-10 rounded-xl border border-border bg-card grid place-items-center text-muted-foreground hover:text-primary shrink-0" title="Mở trang chia sẻ">
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Cho phép xem trước</label>
                      <select value={shareForm.allowPreview ? "yes" : "no"} onChange={(e) => setShareForm({ ...shareForm, allowPreview: e.target.value === "yes" })} className="w-full h-10 bg-muted/60 border border-border/50 rounded-xl px-3 text-sm font-medium outline-none focus:border-primary">
                        <option value="yes">Bật</option>
                        <option value="no">Tắt</option>
                      </select>
                    </div>
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
                      <button onClick={handleRegenerateShareLink} className="size-10 rounded-xl bg-muted grid place-items-center text-muted-foreground hover:text-foreground transition-colors" title="Đổi Link mới (Hủy link cũ)">
                        <RefreshCw size={14} />
                      </button>
                      <button onClick={handleUpdateShareLink} className="h-10 px-5 rounded-xl bg-card border border-border text-xs font-bold hover:bg-muted transition-colors">
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

      {/* DOCUMENT CHUNKS OVERVIEW */}
      <AnimatePresence>
        {overviewDoc && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={closeOverview} />
            <motion.div initial={{ opacity: 0, scale: 0.97, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 10 }} className="relative surface-card w-full max-w-5xl max-h-[90vh] rounded-3xl border border-border shadow-2xl flex flex-col overflow-hidden">
              <header className="p-5 border-b border-border/60 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="size-11 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0"><Layers3 size={20} /></div>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-[0.18em] font-bold text-primary">Document overview</div>
                    <h2 className="text-xl font-bold truncate mt-1">{overviewDoc.title}</h2>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="uppercase">{overviewDoc.fileType}</span><span>•</span><span>{formatSize(overviewDoc.fileSize)}</span><span>•</span>
                      <span className={overviewDoc.processingStatus === "SUCCESS" ? "text-emerald-600" : overviewDoc.processingStatus === "FAILED" ? "text-destructive" : "text-primary"}>{overviewDoc.processingStatus}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleDownload(overviewDoc)} disabled={downloadingId === overviewDoc.id} className="h-9 px-3 rounded-xl border border-border text-xs font-semibold flex items-center gap-1.5 hover:border-primary disabled:opacity-50">{downloadingId === overviewDoc.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}Tải file</button>
                  <button onClick={closeOverview} className="size-9 rounded-xl hover:bg-muted grid place-items-center"><X size={18} /></button>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                {overviewLoading ? (
                  <div className="py-24 flex flex-col items-center text-muted-foreground"><Loader2 size={30} className="animate-spin text-primary mb-3" /><div className="font-semibold text-sm">Đang tải và tổng hợp chunks...</div></div>
                ) : overviewError ? (
                  <div className="py-20 text-center"><AlertCircle size={32} className="mx-auto text-destructive mb-3" /><div className="font-semibold">Không thể tải overview</div><p className="text-sm text-muted-foreground mt-1">{overviewError}</p><button onClick={() => openOverview(overviewDoc)} className="mt-4 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold">Thử lại</button></div>
                ) : overviewDoc.processingStatus === "PENDING" || overviewDoc.processingStatus === "PROCESSING" ? (
                  <div className="py-20 max-w-md mx-auto text-center"><Loader2 size={34} className="animate-spin text-primary mx-auto mb-4" /><h3 className="font-bold">Tài liệu đang được chunking</h3><p className="text-sm text-muted-foreground mt-2">Danh sách sẽ tự cập nhật mỗi 2 giây. Overview khả dụng ngay khi backend xử lý xong.</p><div className="h-2 bg-muted rounded-full mt-5 overflow-hidden"><div className="h-full w-1/2 bg-primary rounded-full animate-pulse" /></div></div>
                ) : overviewChunks.length === 0 ? (
                  <div className="py-20 text-center"><Layers3 size={34} className="mx-auto text-muted-foreground/40 mb-3" /><h3 className="font-semibold">Chưa có chunks</h3><p className="text-sm text-muted-foreground mt-1">Hãy chạy xử lý AI chunks để tạo overview.</p><button onClick={async () => { await handleReprocess(overviewDoc); await openOverview(overviewDoc); }} className="mt-4 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"><RefreshCw size={14} className="inline mr-2" />Bắt đầu xử lý</button></div>
                ) : (
                  <div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                      <div className="rounded-2xl border border-border/60 p-4"><div className="text-[10px] uppercase text-muted-foreground font-bold">Tổng chunks</div><div className="text-2xl font-bold mt-1">{overviewChunks.length}</div></div>
                      <div className="rounded-2xl border border-border/60 p-4"><div className="text-[10px] uppercase text-muted-foreground font-bold">Token ước tính</div><div className="text-2xl font-bold mt-1">{overviewChunks.reduce((sum, chunk) => sum + (chunk.tokenEstimate || 0), 0).toLocaleString()}</div></div>
                      <div className="rounded-2xl border border-border/60 p-4"><div className="text-[10px] uppercase text-muted-foreground font-bold">Số trang nguồn</div><div className="text-2xl font-bold mt-1">{new Set(overviewChunks.map((chunk) => chunk.sourcePage).filter(Boolean)).size || "—"}</div></div>
                      <div className="rounded-2xl border border-border/60 p-4"><div className="text-[10px] uppercase text-muted-foreground font-bold">Ký tự</div><div className="text-2xl font-bold mt-1">{overviewChunks.reduce((sum, chunk) => sum + chunk.textContent.length, 0).toLocaleString()}</div></div>
                    </div>
                    {overviewDoc.description && <div className="rounded-2xl bg-muted/30 border border-border/50 p-4 mb-5"><div className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Mô tả</div><p className="text-sm leading-6">{overviewDoc.description}</p></div>}
                    <div className="space-y-3">
                      {overviewChunks.map((chunk) => {
                        const isEditingChunk = editingChunkId === chunk.id;
                        const isSavingChunk = savingChunkId === chunk.id;
                        return (
                          <article key={chunk.id} className={`rounded-2xl border p-4 transition-colors ${isEditingChunk ? "border-primary/50 bg-primary/5" : "border-border/60 hover:border-primary/30"}`}>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                              <div className="text-xs font-bold text-primary">Chunk #{chunk.chunkIndex + 1}</div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-[10px] text-muted-foreground">
                                  {chunk.sourcePage ? `Trang ${chunk.sourcePage}` : "Không rõ trang"}{chunk.sourceSection ? ` · ${chunk.sourceSection}` : ""} · {chunk.tokenEstimate || 0} tokens
                                </div>
                                {!isEditingChunk ? (
                                  <button
                                    onClick={() => startEditingChunk(chunk)}
                                    className="h-8 px-3 rounded-lg border border-border text-[11px] font-bold text-muted-foreground hover:text-primary hover:border-primary/40 flex items-center gap-1.5 transition-colors"
                                    title="Sửa text đã chunking"
                                  >
                                    <Pencil size={13} /> Sửa text
                                  </button>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleSaveChunkText(chunk)}
                                      disabled={isSavingChunk || !editingChunkText.trim()}
                                      className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-[11px] font-bold hover:brightness-110 disabled:opacity-60 flex items-center gap-1.5 transition-all"
                                    >
                                      {isSavingChunk ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Lưu
                                    </button>
                                    <button
                                      onClick={cancelEditingChunk}
                                      disabled={isSavingChunk}
                                      className="h-8 px-3 rounded-lg border border-border text-[11px] font-bold text-muted-foreground hover:text-foreground disabled:opacity-60 flex items-center gap-1.5 transition-colors"
                                    >
                                      <X size={13} /> Hủy
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                            {isEditingChunk ? (
                              <div className="space-y-2">
                                <textarea
                                  value={editingChunkText}
                                  onChange={(event) => setEditingChunkText(event.target.value)}
                                  onKeyDown={(event) => {
                                    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                                      event.preventDefault();
                                      handleSaveChunkText(chunk);
                                    }
                                  }}
                                  disabled={isSavingChunk}
                                  className="w-full min-h-[180px] rounded-xl bg-card border border-border px-4 py-3 text-sm leading-7 outline-none resize-y focus:border-primary disabled:opacity-60"
                                  placeholder="Nội dung chunk đã trích xuất"
                                />
                                <div className="text-[10px] text-muted-foreground font-medium">
                                  {editingChunkText.trim().length.toLocaleString()} ký tự sau khi lưu
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm leading-7 whitespace-pre-wrap text-foreground/90">{chunk.textContent}</p>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT DOCUMENT MODAL */}
      <AnimatePresence>
        {editModalDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setEditModalDoc(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative surface-card w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-border/50"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold font-display text-lg">Sửa tài liệu</h3>
                  <p className="text-xs text-muted-foreground mt-1">Cập nhật metadata qua API backend.</p>
                </div>
                <button onClick={() => setEditModalDoc(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tên tài liệu</label>
                  <input
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full h-11 rounded-xl bg-muted/50 border border-border px-4 outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mô tả</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full min-h-[96px] rounded-xl bg-muted/50 border border-border px-4 py-3 outline-none focus:border-primary resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Môn học</label>
                    <select
                      value={editForm.subjectId}
                      onChange={(e) => setEditForm({ ...editForm, subjectId: e.target.value })}
                      className="w-full h-11 rounded-xl bg-muted/50 border border-border px-3 outline-none focus:border-primary"
                    >
                      <option value="">Không chọn</option>
                      {subjectFilterOptions.map((subject) => (
                        <option key={subject.value} value={subject.value}>{subject.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Hiển thị</label>
                    <select
                      value={editForm.visibility}
                      onChange={(e) => setEditForm({ ...editForm, visibility: e.target.value as DocumentDTO["visibility"] })}
                      className="w-full h-11 rounded-xl bg-muted/50 border border-border px-3 outline-none focus:border-primary"
                    >
                      <option value="PRIVATE">PRIVATE</option>
                      <option value="PUBLIC_LINK">PUBLIC_LINK</option>
                      <option value="MARKETPLACE">MARKETPLACE</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button onClick={() => setEditModalDoc(null)} className="h-10 px-4 rounded-xl border border-border hover:bg-muted text-sm font-bold transition-colors">
                  Hủy
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit}
                  className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:brightness-110 disabled:opacity-60 transition-all flex items-center gap-2"
                >
                  {isSavingEdit && <div className="size-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />}
                  Lưu thay đổi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* TAG MANAGEMENT MODAL */}
      <AnimatePresence>
        {tagModalDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setTagModalDoc(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="relative surface-card w-full max-w-md rounded-2xl p-6 shadow-2xl border border-border/50">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-display text-xl font-bold">Quản lý tag</h3>
                <button onClick={() => setTagModalDoc(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <p className="text-sm text-muted-foreground truncate mb-5">{tagModalDoc.title}</p>
              <div className="flex gap-2 mb-4">
                <input value={newTagName} onChange={(event) => setNewTagName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && createAndAttachTag()} placeholder="Tên tag mới" className="flex-1 h-10 px-3 rounded-xl bg-muted/40 border border-border outline-none focus:border-primary text-sm" />
                <button onClick={createAndAttachTag} disabled={isTagLoading || !newTagName.trim()} className="px-4 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"><Plus size={15} /></button>
              </div>
              <div className="min-h-24 max-h-64 overflow-y-auto custom-scrollbar flex flex-wrap content-start gap-2">
                {isTagLoading && availableTags.length === 0 ? (
                  <div className="w-full py-8 text-center text-sm text-muted-foreground">Đang tải tag...</div>
                ) : availableTags.length === 0 ? (
                  <div className="w-full py-8 text-center text-sm text-muted-foreground">Chưa có tag. Hãy tạo tag đầu tiên.</div>
                ) : availableTags.map((tag) => {
                  const attached = (documentTags[tagModalDoc.id] ?? []).some((item) => item.id === tag.id);
                  return (
                    <button key={tag.id} onClick={() => toggleTag(tag)} disabled={isTagLoading} className={`inline-flex items-center gap-1.5 px-3 h-9 rounded-xl border text-sm font-medium transition-opacity disabled:opacity-50 ${attached ? "ring-2 ring-primary/30" : "opacity-70 hover:opacity-100"}`} style={{ color: tag.color, borderColor: `${tag.color}66`, backgroundColor: `${tag.color}14` }}>
                      {attached && <CheckCircle2 size={14} />} {tag.name}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* PUBLISH TO COMMUNITY MODAL */}
      <PublishModal 
        isOpen={!!publishModalDoc}
        onClose={() => setPublishModalDoc(null)}
        document={publishModalDoc}
        subjects={subjects}
        onPublished={() => refetch()}
      />

    </div>
  );
}




