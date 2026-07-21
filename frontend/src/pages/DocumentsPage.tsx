"use client";

import {
  Folder,
  FolderOpen,
  ChevronRight,
  Search,
  Upload,
  Plus,
  FileText,
  Download,
  Trash2,
  Globe,
  Tag,
  ExternalLink,
  X,
  Settings2,
  Share2,
  MoreVertical,
  CheckCircle2,
  Link,
  Copy,
  RefreshCw,
  Eye,
  Layers3,
  Loader2,
  AlertCircle,
  List,
  Edit3,
  ChevronDown,
  FolderPlus,
  Move
} from "lucide-react";
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

// Định nghĩa cấu trúc dữ liệu Thư mục
interface FolderDTO {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
}

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
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const activeAdvancedFilters = [filterSubject, filterVisibility, filterStatus].filter((value) => value !== "all").length;

  // 📂 STATES QUẢN LÝ THƯ MỤC CHUYÊN SÂU
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<FolderDTO[]>([
    { id: "folder_1", name: "Toán Đại Số Lớp 10", parentId: null, createdAt: new Date().toISOString() },
    { id: "folder_2", name: "Ngữ Văn Tổng Hợp", parentId: null, createdAt: new Date().toISOString() },
    { id: "folder_3", name: "Đề Thi Thử Học Kỳ I", parentId: "folder_1", createdAt: new Date().toISOString() },
  ]);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [moveFileDoc, setMoveFileDoc] = useState<DocumentDTO | null>(null);

  // Lưu trữ cục bộ ánh xạ FolderId cho các File vì API gốc chưa hỗ trợ phân cấp thư mục
  const [fileFolderMap, setFileFolderMap] = useState<Record<number, string | null>>({});

  // State hỗ trợ tìm kiếm môn học ngay trong select
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const [subjectSearchQuery, setSubjectSearchQuery] = useState("");
  const subjectDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown khi click bên ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (subjectDropdownRef.current && !subjectDropdownRef.current.contains(event.target as Node)) {
        setIsSubjectDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { subjects, subjectMap } = useSubjects();
  const subjectFilterOptions = useMemo(
    () => subjects.map((subject) => ({ label: subject.code, value: String(subject.id) })),
    [subjects],
  );

  // Lọc danh sách môn học dựa trên input tìm kiếm của người dùng
  const filteredSubjectOptions = useMemo(() => {
    if (!subjectSearchQuery.trim()) return subjectFilterOptions;
    return subjectFilterOptions.filter(opt =>
      opt.label.toLowerCase().includes(subjectSearchQuery.toLowerCase())
    );
  }, [subjectFilterOptions, subjectSearchQuery]);

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

  // States phục vụ hiển thị & CHỈNH SỬA CHUNKS
  const [overviewDoc, setOverviewDoc] = useState<DocumentDTO | null>(null);
  const [overviewChunks, setOverviewChunks] = useState<ChunkDTO[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState("");
  const [editingChunkId, setEditingChunkId] = useState<number | null>(null);
  const [editingChunkText, setEditingChunkText] = useState<string>("");
  const [isSavingChunkId, setIsSavingChunkId] = useState<number | null>(null);

  const [tagModalDoc, setTagModalDoc] = useState<DocumentDTO | null>(null);
  const [availableTags, setAvailableTags] = useState<TagDTO[]>([]);
  const [documentTags, setDocumentTags] = useState<Record<number, TagDTO[]>>({});
  const [newTagName, setNewTagName] = useState("");
  const [isTagLoading, setIsTagLoading] = useState(false);

  const stats = useMemo(() => {
    const totalDocs = list.length;
    const totalSize = list.reduce((sum, doc) => sum + (doc.fileSize || 0), 0);
    const totalDownloads = list.reduce((sum, doc) => sum + (doc.downloadCount || 0), 0);
    return { totalDocs, totalSize, totalDownloads };
  }, [list]);

  // 🧭 LOGIC TẠO BREADCRUMBS ĐƯỜNG DẪN THƯ MỤC CHA-CON (Chống lỗi folders undefined)
  const breadcrumbs = useMemo(() => {
    const crumbs: FolderDTO[] = [];
    const safeFolders = Array.isArray(folders) ? folders : [];
    let currentId = currentFolderId;
    while (currentId) {
      const folder = safeFolders.find(f => f.id === currentId);
      if (folder) {
        crumbs.unshift(folder);
        currentId = folder.parentId;
      } else {
        break;
      }
    }
    return crumbs;
  }, [currentFolderId, folders]);

  // 🔍 LỌC DANH SÁCH THƯ MỤC THEO THƯ MỤC CHA HIỆN TẠI (Chống lỗi folders undefined)
  const currentFolders = useMemo(() => {
    if (q.trim()) return [];
    const safeFolders = Array.isArray(folders) ? folders : [];
    return safeFolders.filter(f => f.parentId === currentFolderId);
  }, [folders, currentFolderId, q]);

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

  // Hàm lưu nội dung Chunk đã chỉnh sửa xuống Cơ sở dữ liệu qua Service
  const handleSaveChunkText = async (chunkId: number) => {
    if (!overviewDoc) return;
    if (!editingChunkText.trim()) {
      Notify.failure("Nội dung đoạn trích xuất không được để trống.");
      return;
    }
    setIsSavingChunkId(chunkId);
    try {
      const response = await documentService.updateDocumentChunk(overviewDoc.id, chunkId, { textContent: editingChunkText });
      Notify.success("Cập nhật nội dung chunk thành công!");

      setOverviewChunks(prev => prev.map(c => c.id === chunkId ? response.data : c));
      setEditingChunkId(null);
    } catch (err: any) {
      Notify.failure("Lỗi không thể cập nhật nội dung: " + (err.message || "Lỗi hệ thống"));
    } finally {
      setIsSavingChunkId(null);
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

      let finalFileName = download.fileName || doc.title;
      if (doc.fileType.toLowerCase() === "pdf" && !finalFileName.toLowerCase().endsWith(".pdf")) {
        finalFileName += ".pdf";
      }

      anchor.setAttribute("download", finalFileName);
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(download.blobUrl), 1000);
    } catch (err: any) {
      Notify.failure("Không thể tải tài liệu: " + (err.message || "Kiểm tra lại kết nối mạng hoặc quyền truy cập"));
    } finally {
      setDownloadingId(null);
    }
  };

  const openOverview = async (doc: DocumentDTO) => {
    setOverviewDoc(doc);
    setOverviewChunks([]);
    setOverviewError("");
    setOverviewLoading(true);
    setEditingChunkId(null);
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

  const processFilesUpload = async (files: FileList) => {
    if (files.length === 0) return;
    try {
      for (let i = 0; i < files.length; i++) {
        const uploadedDoc = await uploadMutation.mutateAsync(files[i]);
        // Tự động gắn File vừa upload vào thư mục đang đứng hiện tại
        if (uploadedDoc && (uploadedDoc as any).id) {
          setFileFolderMap(prev => ({ ...prev, [(uploadedDoc as any).id]: currentFolderId }));
        }
      }
      Notify.success("Tải lên file thành công. Chờ chunking tự động!");
    } catch (err: any) {
      Notify.failure("Lỗi upload: " + (err.message || "Quá trình chunking file đang gặp lỗi xử lý định dạng. Đang fix!"));
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) await processFilesUpload(files);
  };

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

  // Lọc tập tin theo bộ lọc kết hợp cấu trúc thư mục phân cấp
  const filtered = useMemo(
    () => {
      let result = list.filter((x) => {
        // Nếu có từ khóa tìm kiếm, bỏ qua bộ lọc thư mục để tìm kiếm global.
        // Ngược lại, chỉ hiển thị file thuộc thư mục hiện tại.
        const fileFolder = fileFolderMap[x.id] ?? null;
        const matchFolder = q.trim() ? true : fileFolder === currentFolderId;

        const keyword = (q || "").toLowerCase();
        const matchSearch =
          (x.title || "").toLowerCase().includes(keyword) ||
          (x.description || "").toLowerCase().includes(keyword) ||
          (x.subjectId || "").toString().includes(keyword);
        const matchType = type === "all" || (x.fileType || "").toLowerCase() === type;
        const matchSubject = filterSubject === "all" || x.subjectId === Number(filterSubject);
        const matchVis = filterVisibility === "all" || x.visibility === filterVisibility;
        const matchStatus = filterStatus === "all" || x.processingStatus === filterStatus || x.marketStatus === filterStatus;
        return matchFolder && matchSearch && matchType && matchSubject && matchVis && matchStatus;
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
    [list, q, type, filterSubject, filterVisibility, filterStatus, sortBy, currentFolderId, fileFolderMap],
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

  // Logic tạo Folder mới
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      Notify.failure("Tên thư mục không được trống.");
      return;
    }
    const newFolder: FolderDTO = {
      id: "folder_" + Date.now(),
      name: newFolderName.trim(),
      parentId: currentFolderId,
      createdAt: new Date().toISOString()
    };
    setFolders(prev => [...prev, newFolder]);
    setNewFolderName("");
    setIsFolderModalOpen(false);
    Notify.success("Tạo thư mục mới thành công.");
  };

  // Logic xóa Thư mục
  const handleDeleteFolder = (folderId: string, folderName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Tránh kích hoạt sự kiện click vào folder
    Confirm.show(
      "Xóa thư mục",
      `Bạn chắc chắn muốn xóa thư mục "${folderName}"? Tập tin bên trong sẽ nằm ngoài thư mục gốc.`,
      "Xóa thư mục",
      "Hủy",
      () => {
        setFolders(prev => prev.filter(f => f.id !== folderId));
        // Giải phóng các file đang nằm trong folder bị xóa ra Root
        setFileFolderMap(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(fileId => {
            if (updated[Number(fileId)] === folderId) {
              updated[Number(fileId)] = null;
            }
          });
          return updated;
        });
        Notify.success("Đã xóa thư mục.");
      }
    );
  };

  // Di chuyển File vào Thư mục lựa chọn
  const handleMoveFile = (targetFolderId: string | null) => {
    if (!moveFileDoc) return;
    setFileFolderMap(prev => ({ ...prev, [moveFileDoc.id]: targetFolderId }));
    setMoveFileDoc(null);
    Notify.success("Đã di chuyển tập tin thành công.");
  };

  return (
    <div className="space-y-4 text-left">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">Tài Liệu Của Bạn</h1>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">Quản lý tài liệu học tập theo thư mục</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <button
            onClick={() => !isUploading && inputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
          >
            <Upload size={16} /> Tải lên
          </button>
          <button
            onClick={() => setIsFolderModalOpen(true)}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 px-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-amber-600 sm:flex-none"
          >
            <FolderPlus size={16} /> New Folder
          </button>
        </div>
      </div>

      <div className="surface-card grid grid-cols-3 divide-x divide-border/60 overflow-hidden rounded-xl border border-border/50">
        <div className="flex min-w-0 items-center gap-2 px-3 py-3 sm:px-4">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"><FileText size={16} /></div>
          <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Tài liệu</p><p className="text-lg font-black leading-tight text-foreground">{stats.totalDocs}</p></div>
        </div>
        <div className="flex min-w-0 items-center gap-2 px-3 py-3 sm:px-4">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400"><Layers3 size={16} /></div>
          <div className="min-w-0"><p className="truncate text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Dung lượng</p><p className="truncate text-lg font-black leading-tight text-foreground">{formatSize(stats.totalSize)}</p></div>
        </div>
        <div className="flex min-w-0 items-center gap-2 px-3 py-3 sm:px-4">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-rose-500/10 text-rose-500 dark:text-rose-400"><Download size={16} /></div>
          <div className="min-w-0"><p className="truncate text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Lượt tải</p><p className="text-lg font-black leading-tight text-foreground">{stats.totalDownloads}</p></div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleFileDrop}
        onClick={() => !isUploading && inputRef.current?.click()}
        className={`surface-card flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed px-4 py-3 transition-all sm:px-5 ${drag ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"} ${isUploading ? "pointer-events-none opacity-50" : ""}`}
      >
        <input id="file-upload" ref={inputRef} type="file" multiple className="hidden" onChange={handleFileUpload} />
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          {isUploading ? <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <Upload size={18} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{isUploading ? t('pages.documents.uploading') : t('pages.documents.dragDrop')}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{t('pages.documents.maxSize')}</p>
        </div>
        <span className="hidden text-xs font-semibold text-primary sm:block">Chọn tệp</span>
      </motion.div>

      <div className="surface-card relative z-30 space-y-3 rounded-xl border border-border p-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex flex-1 items-center">
            <Search className="absolute left-3 text-muted-foreground" size={16} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('pages.documents.search')}
              className="h-10 w-full rounded-lg border border-transparent bg-muted/50 pl-9 pr-3 text-sm outline-none transition-all focus:border-primary focus:bg-card"
            />
          </div>
          <div className="flex gap-2">
            <CustomSelect
              value={sortBy}
              onChange={setSortBy}
              className="min-w-0 flex-1 sm:w-[150px] sm:flex-none"
              data={[
                { label: t('pages.documents.sortNewest'), value: "newest" },
                { label: t('pages.documents.sortOldest'), value: "oldest" },
                { label: t("filters.sortAZ"), value: "az" }
              ]}
            />
            <button
              onClick={() => {
                setIsFiltersOpen((open) => !open);
                setIsSubjectDropdownOpen(false);
              }}
              className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition-colors ${isFiltersOpen || activeAdvancedFilters ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              aria-expanded={isFiltersOpen}
            >
              <Settings2 size={16} /> Bộ lọc
              {activeAdvancedFilters > 0 && <span className="grid size-4 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">{activeAdvancedFilters}</span>}
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto py-0.5 no-scrollbar">
          {["all", "pdf", "docx", "pptx", "txt"].map((fileType) => {
            const isActive = type === fileType;
            return <button key={fileType} onClick={() => setType(fileType)} className={`h-8 shrink-0 rounded-full px-3 text-[11px] font-semibold uppercase tracking-wider transition-all ${isActive ? typeStyles[fileType]?.activeBtn : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"}`}>{fileType === "all" ? "Tất cả" : fileType}</button>;
          })}
        </div>

        <AnimatePresence initial={false}>
          {isFiltersOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="grid gap-2 overflow-visible border-t border-border/60 pt-3 md:grid-cols-3">
              <div className="relative" ref={subjectDropdownRef}>
                <button
                  onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                  className="flex h-10 w-full items-center justify-between rounded-lg border border-transparent bg-muted/50 px-3 text-sm font-medium text-foreground transition-all hover:bg-muted"
                >
                  <span className="truncate">{filterSubject === "all" ? t("filters.allSubjects") : (subjectMap[Number(filterSubject)]?.code || filterSubject)}</span>
                  <ChevronDown size={16} className={`text-muted-foreground transition-transform ${isSubjectDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {isSubjectDropdownOpen && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute left-0 right-0 z-50 mt-1.5 flex max-h-64 flex-col space-y-2 overflow-hidden rounded-xl border border-border bg-card p-2 shadow-2xl">
                      <div className="relative flex shrink-0 items-center"><Search className="absolute left-3 text-muted-foreground" size={14} /><input type="text" value={subjectSearchQuery} onChange={(e) => setSubjectSearchQuery(e.target.value)} placeholder="Gõ tìm môn học..." className="h-8 w-full rounded-lg border border-border/60 bg-muted/40 pl-8 pr-3 text-xs outline-none transition-all focus:border-primary focus:bg-card" /></div>
                      <div className="custom-scrollbar flex-1 space-y-0.5 overflow-y-auto text-left">
                        <button onClick={() => { setFilterSubject("all"); setIsSubjectDropdownOpen(false); setSubjectSearchQuery(""); }} className={`w-full rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${filterSubject === "all" ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}>{t("filters.allSubjects")}</button>
                        {filteredSubjectOptions.length === 0 ? <div className="p-3 text-center text-[11px] text-muted-foreground">Không tìm thấy môn học</div> : filteredSubjectOptions.map((opt) => <button key={opt.value} onClick={() => { setFilterSubject(opt.value); setIsSubjectDropdownOpen(false); setSubjectSearchQuery(""); }} className={`block w-full truncate rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${filterSubject === opt.value ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}>{opt.label}</button>)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <CustomSelect value={filterVisibility} onChange={setFilterVisibility} className="w-full" data={[{ label: t("filters.allVisibility"), value: "all" }, { label: t("filters.private"), value: "PRIVATE" }, { label: "Public link", value: "PUBLIC_LINK" }, { label: t("filters.marketplace"), value: "MARKETPLACE" }]} />
              <CustomSelect value={filterStatus} onChange={setFilterStatus} className="w-full" data={[{ label: t("filters.allStatus"), value: "all" }, { label: "Chờ xử lý", value: "PENDING" }, { label: "Đang xử lý", value: "PROCESSING" }, { label: "Xử lý xong", value: "SUCCESS" }, { label: "Xử lý lỗi", value: "FAILED" }, { label: t("filters.approved"), value: "APPROVED" }, { label: t("filters.rejected"), value: "REJECTED" }]} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 🧭 GOOGLE DRIVE BREADCRUMBS NAVIGATION */}
      <div className="flex items-center gap-1.5 overflow-x-auto rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-xs no-scrollbar">
        <button
          onClick={() => setCurrentFolderId(null)}
          className={`flex items-center gap-1 font-bold transition-colors outline-none ${!currentFolderId ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          <FolderOpen size={16} /> Drive của tôi
        </button>
        {breadcrumbs.map((crumb) => (
          <div key={crumb.id} className="flex items-center gap-1.5 text-muted-foreground shrink-0">
            <ChevronRight size={14} className="text-muted-foreground/60" />
            <button
              onClick={() => setCurrentFolderId(crumb.id)}
              className="hover:text-foreground font-semibold max-w-[150px] truncate outline-none"
            >
              {crumb.name}
            </button>
          </div>
        ))}
      </div>

      {/* 📂 KHU VỰC THƯ MỤC CHỨA CÁC ĐỐI TƯỢNG (GRID DISPLAY) */}
      {currentFolders.length > 0 && (
        <div className="mt-1 space-y-2 animate-fade-in">
          <h3 className="pl-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Thư mục · {currentFolders.length}</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {currentFolders.map((folder) => (
              <div
                key={folder.id}
                onClick={() => setCurrentFolderId(folder.id)}
                className="surface-card group flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-border/50 p-3 transition-all hover:border-amber-500/40 hover:shadow-sm select-none"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 transition-all duration-300 group-hover:bg-amber-500 group-hover:text-white">
                    <Folder size={16} fill="currentColor" fillOpacity={0.2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold truncate text-foreground" title={folder.name}>
                      {folder.name}
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteFolder(folder.id, folder.name, e)}
                  className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-70 transition-all hover:bg-destructive/10 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                  title="Xóa thư mục"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents Render Container - Hiển thị dạng Danh sách/Bảng */}
      <div className="mt-4 w-full space-y-2 !overflow-visible">
        <h3 className="pl-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Tập tin tài liệu · {filtered.length}</h3>
        <div className="surface-card !overflow-visible border border-border/40 shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-border/50 bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2.5 text-left sm:px-4">{t('pages.documents.table.document')}</th>
                <th className="hidden px-3 py-2.5 text-left md:table-cell sm:px-4">{t('pages.documents.table.subject')}</th>
                <th className="hidden px-3 py-2.5 text-left lg:table-cell sm:px-4">{t('pages.documents.table.tags')}</th>
                <th className="hidden px-3 py-2.5 text-left sm:table-cell sm:px-4">{t('pages.documents.table.size')}</th>
                <th className="hidden px-3 py-2.5 text-left lg:table-cell sm:px-4">{t('pages.documents.table.downloads')}</th>
                <th className="px-3 py-2.5 sm:px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skel-${i}`}>
                    <td className="relative overflow-hidden px-3 py-2.5 sm:px-4">
                      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent z-10" />
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-muted" />
                        <div>
                          <div className="h-4 w-32 bg-muted rounded mb-1" />
                          <div className="h-3 w-20 bg-muted/50 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 sm:px-4 hidden md:table-cell"><div className="h-4 w-16 bg-muted rounded" /></td>
                    <td className="px-3 py-2.5 sm:px-4 hidden lg:table-cell"><div className="h-4 w-12 bg-muted rounded" /></td>
                    <td className="px-3 py-2.5 sm:px-4 hidden sm:table-cell"><div className="h-4 w-10 bg-muted rounded" /></td>
                    <td className="px-3 py-2.5 sm:px-4 hidden lg:table-cell"><div className="h-4 w-6 bg-muted rounded" /></td>
                    <td className="px-3 py-2.5 sm:px-4 text-right"><div className="h-8 w-8 bg-muted rounded-lg inline-block" /></td>
                  </tr>
                ))
              ) : filtered.map((d, i) => (
                <motion.tr
                  key={d.id}
                  {...motionFadeUp(i)}
                  className="hover:bg-muted/30 hover:z-40 hover:relative transition-colors group"
                >
                  <td className="px-3 py-2.5 sm:px-4">
                    <div className="flex items-center gap-3">
                      <div className={`grid size-8 place-items-center rounded-lg border text-[9px] font-extrabold uppercase transition-colors duration-300 ${typeStyles[d.fileType.toLowerCase()]?.badge || "bg-muted text-muted-foreground border-transparent"
                        }`}>
                        {d.fileType}
                      </div>
                      <div className="min-w-0 flex-1">
                        <button
                          onClick={() => openOverview(d)}
                          className="font-bold text-xs sm:text-sm truncate group-hover:text-primary cursor-pointer transition-colors block max-w-[200px] sm:max-w-[350px] md:max-w-[450px] text-left outline-none"
                          title={d.title}
                        >
                          {d.title}
                        </button>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span>{formatDate(d.createdAt)}</span>
                          {q.trim() && fileFolderMap[d.id] && (
                            <span className="inline-flex items-center gap-0.5 bg-amber-500/10 text-amber-600 px-1.5 py-0.2 rounded font-medium text-[10px]">
                              <Folder size={10} fill="currentColor" fillOpacity={0.2} />
                              {folders.find(f => f.id === fileFolderMap[d.id])?.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 sm:px-4 hidden md:table-cell">
                    {d.subjectId ? (
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-muted/80 border border-border/30 font-medium text-muted-foreground">{getSubjectLabel(d.subjectId)}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground font-mono">N/A</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 sm:px-4 hidden lg:table-cell">
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
                      <button onClick={() => openOverview(d)} className="mt-1.5 text-[10px] text-primary font-semibold hover:underline outline-none">
                        {chunkCounts[d.id] !== undefined ? `${chunkCounts[d.id]} chunks · ` : ""}Xem overview
                      </button>
                    )}
                    {d.processingStatus === "FAILED" && <div className="mt-1 text-[10px] text-destructive">Xử lý thất bại · Có thể chạy lại</div>}
                  </td>
                  <td className="px-3 py-2.5 sm:px-4 hidden sm:table-cell text-muted-foreground font-medium">{formatSize(d.fileSize)}</td>
                  <td className="px-3 py-2.5 sm:px-4 hidden lg:table-cell text-muted-foreground font-medium">{d.downloadCount}</td>
                  <td className="px-3 py-2.5 sm:px-4 text-right">
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
                          <button onClick={() => setMoveFileDoc(d)} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50">
                            <Move size={14} className="text-amber-500" /> Di chuyển thư mục
                          </button>
                          <button onClick={() => handleEdit(d)} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50">
                            <FileText size={14} /> {t('pages.documents.table.editDesc')}
                          </button>
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

        {/* Empty State */}
        {filtered.length === 0 && currentFolders.length === 0 && (
          <div className="surface-card mt-4 animate-fade-in rounded-xl border border-border/40 py-11 text-center text-muted-foreground">
            <FolderOpen size={36} className="mx-auto mb-3 opacity-30 text-amber-500" />
            <div className="font-medium">Thư mục trống hoặc dữ liệu không khớp</div>
            <div className="text-xs opacity-70 mt-0.5">Vui lòng tải tệp tin lên hoặc tạo thư mục con tại đây.</div>
          </div>
        )}
      </div>

      {/* 🚀 CREATE FOLDER MODAL */}
      <AnimatePresence>
        {isFolderModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsFolderModalOpen(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative surface-card w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-border/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2 text-foreground"><FolderPlus size={20} className="text-amber-500" /> Thư mục mới</h3>
                <button onClick={() => setIsFolderModalOpen(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Nhập tên thư mục..."
                className="w-full h-11 rounded-xl bg-muted/60 border border-border px-4 outline-none focus:border-primary text-sm font-medium"
                onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                autoFocus
              />
              <div className="mt-5 flex justify-end gap-2">
                <button onClick={() => setIsFolderModalOpen(false)} className="h-10 px-4 rounded-xl border border-border text-xs font-bold hover:bg-muted">Hủy</button>
                <button onClick={handleCreateFolder} className="h-10 px-5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:brightness-110">Tạo mới</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🚀 MOVE FILE MODAL (DI CHUYỂN THƯ MỤC - AN TOÀN CHỐNG CRASH) */}
      <AnimatePresence>
        {moveFileDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMoveFileDoc(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative surface-card w-full max-w-md rounded-2xl p-6 shadow-2xl border border-border/50 flex flex-col max-h-[80vh]">
              <div className="flex items-center justify-between mb-3 shrink-0">
                <h3 className="font-bold text-lg flex items-center gap-2"><Move size={18} className="text-primary" /> Di chuyển tập tin</h3>
                <button onClick={() => setMoveFileDoc(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <p className="text-xs text-muted-foreground truncate mb-4 shrink-0 bg-muted/50 p-2.5 rounded-xl border border-border/40">Tập tin: <span className="font-semibold text-foreground">{moveFileDoc?.title}</span></p>

              <div className="flex-1 overflow-y-auto custom-scrollbar border border-border/60 rounded-xl divide-y divide-border/40 max-h-60 bg-muted/20">
                {/* Lựa chọn đưa về gốc */}
                <button
                  onClick={() => handleMoveFile(null)}
                  className={`w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-3 hover:bg-primary/5 transition-colors ${moveFileDoc && fileFolderMap?.[moveFileDoc.id] === null ? "text-primary bg-primary/5 font-semibold" : "text-foreground"
                    }`}
                >
                  <FolderOpen size={16} className="text-muted-foreground shrink-0" />
                  <span>Drive của tôi (Thư mục gốc)</span>
                </button>

                {/* Xử lý an toàn khi folders chưa tải xong hoặc moveFileDoc bị null */}
                {(() => {
                  const safeFolders = Array.isArray(folders) ? folders : [];

                  if (safeFolders.length === 0 && !folders) {
                    return (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        Đang tải danh sách thư mục...
                      </div>
                    );
                  }

                  const folderMap = new Map<string | null, typeof safeFolders>();

                  const invalidTargetIds = new Set<string>();

                  safeFolders.forEach(folder => {
                    const pid = folder.parentId ?? null;
                    const effectivePid = (pid !== null && !safeFolders.some(f => f.id === pid)) ? null : pid;

                    if (!folderMap.has(effectivePid)) {
                      folderMap.set(effectivePid, []);
                    }
                    folderMap.get(effectivePid)!.push(folder);
                  });

                  const flattenTree = (parentId: string | null = null, depth = 0): Array<{ folder: typeof safeFolders[0], depth: number }> => {
                    let result: Array<{ folder: typeof safeFolders[0], depth: number }> = [];
                    const children = folderMap.get(parentId) || [];

                    children.forEach(child => {
                      result.push({ folder: child, depth });
                      result = result.concat(flattenTree(child.id, depth + 1));
                    });

                    return result;
                  };

                  const orderedFolders = flattenTree(null);

                  if (orderedFolders.length === 0) {
                    return (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        Không có thư mục nào khác.
                      </div>
                    );
                  }

                  return orderedFolders.map(({ folder, depth }) => {
                    const isSelected = Boolean(moveFileDoc && fileFolderMap?.[moveFileDoc.id] === folder.id);
                    const isDisabled = invalidTargetIds.has(folder.id);

                    return (
                      <button
                        key={folder.id}
                        disabled={isDisabled}
                        onClick={() => !isDisabled && handleMoveFile(folder.id)}
                        className={`w-full text-left py-2.5 pr-4 text-sm flex items-center justify-between transition-colors ${isDisabled
                          ? "opacity-40 cursor-not-allowed bg-muted/10"
                          : isSelected
                            ? "text-primary bg-primary/5 font-semibold"
                            : "text-foreground font-normal hover:bg-primary/5"
                          }`}
                        style={{ paddingLeft: `${16 + depth * 22}px` }}
                      >
                        <div className="flex items-center gap-2.5 truncate relative">
                          {depth > 0 && (
                            <span className="text-muted-foreground/40 font-mono text-xs select-none shrink-0 -ml-3.5 mr-1">
                              {depth === 1 ? "└─" : "└──"}
                            </span>
                          )}

                          <Folder
                            size={16}
                            className={depth === 0 ? "text-amber-500 shrink-0" : "text-amber-400 shrink-0"}
                            fill="currentColor"
                            fillOpacity={depth === 0 ? 0.2 : 0.08}
                          />

                          <span className="truncate">{folder.name}</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isDisabled && (
                            <span className="text-[10px] text-destructive bg-destructive/10 px-1.5 py-0.5 rounded border border-destructive/20">
                              Không thể chọn
                            </span>
                          )}

                          {depth > 0 && !isDisabled && (
                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/40">
                              Cấp {depth + 1}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                  <div className="font-bold truncate text-sm">{shareModalDoc.title}</div>
                  <div className="text-[11px] text-muted-foreground">{formatSize(shareModalDoc.fileSize)} • {shareModalDoc.fileType.toUpperCase()}</div>
                </div>
              </div>

              {isShareLoading ? (
                <div className="py-10 flex flex-col items-center justify-center text-muted-foreground">
                  <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                  <span className="text-xs font-mono uppercase tracking-widest">Đang tải cấu hình...</span>
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

      {/* DOCUMENT CHUNKS OVERVIEW MODAL */}
      <AnimatePresence>
        {overviewDoc && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={() => setOverviewDoc(null)} />
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
                  <button onClick={() => setOverviewDoc(null)} className="size-9 rounded-xl hover:bg-muted grid place-items-center"><X size={18} /></button>
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
                      {overviewChunks.map((chunk) => (
                        <article key={chunk.id} className="rounded-2xl border border-border/60 p-4 hover:border-primary/30 transition-colors bg-card text-left">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <div className="text-xs font-bold text-primary">Chunk #{chunk.chunkIndex + 1}</div>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-muted-foreground">
                                {chunk.sourcePage ? `Trang ${chunk.sourcePage}` : "Không rõ trang"}{chunk.sourceSection ? ` · ${chunk.sourceSection}` : ""} · {chunk.tokenEstimate || 0} tokens
                              </span>

                              {editingChunkId !== chunk.id && (
                                <button
                                  onClick={() => {
                                    setEditingChunkId(chunk.id);
                                    setEditingChunkText(chunk.textContent);
                                  }}
                                  className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1 font-semibold"
                                  title="Chỉnh sửa nội dung chunk này"
                                >
                                  <Edit3 size={12} /> Sửa
                                </button>
                              )}
                            </div>
                          </div>

                          {editingChunkId === chunk.id ? (
                            <div className="space-y-2 mt-2">
                              <textarea
                                value={editingChunkText}
                                onChange={(e) => setEditingChunkText(e.target.value)}
                                className="w-full min-h-[120px] p-3 text-sm border border-primary/50 focus:border-primary rounded-xl bg-muted/30 outline-none resize-y leading-6 text-foreground"
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => setEditingChunkId(null)}
                                  className="h-8 px-3 text-xs font-bold border border-border rounded-lg bg-card text-muted-foreground hover:bg-muted"
                                >
                                  Hủy
                                </button>
                                <button
                                  onClick={() => handleSaveChunkText(chunk.id)}
                                  disabled={isSavingChunkId === chunk.id}
                                  className="h-8 px-3 text-xs font-bold bg-primary text-primary-foreground rounded-lg hover:brightness-110 disabled:opacity-50 flex items-center gap-1"
                                >
                                  {isSavingChunkId === chunk.id && <Loader2 size={12} className="animate-spin" />}
                                  Lưu lại
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm leading-7 whitespace-pre-wrap text-foreground/90 break-words">{chunk.textContent}</p>
                          )}
                        </article>
                      ))}
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
