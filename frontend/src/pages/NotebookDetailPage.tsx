import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, CheckCircle2, FileText, Loader2, Plus, Search, Upload, X } from "lucide-react";
import { notebookService } from "../services/notebookService";
import { documentService, DocumentDTO } from "../services/documentService";
import { Notify } from "notiflix";
import NotebookChat, { NotebookChatRef } from "../components/Notebook/NotebookChat";
import FloatingAIToolbar from "../components/Notebook/FloatingAIToolbar";
import DocumentViewerPane from "../components/Notebook/DocumentViewerPane";

import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSubjects } from "../hooks/useSubjects";

const notebookDocumentKey = (notebookId: number) => ["notebook-documents", notebookId] as const;
const workspaceDocumentKey = (keyword: string) => ["documents", "workspace", "attach", keyword] as const;

function formatBytes(bytes?: number | null) {
  const value = Number(bytes || 0);
  if (!value) return "Unknown size";
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function extractDocumentItems(response?: unknown): DocumentDTO[] {
  const payload = (response as { data?: unknown } | undefined)?.data ?? response;
  if (Array.isArray(payload)) return payload as DocumentDTO[];

  const page = payload as { items?: unknown; content?: unknown; data?: unknown } | undefined;
  if (Array.isArray(page?.items)) return page.items as DocumentDTO[];
  if (Array.isArray(page?.content)) return page.content as DocumentDTO[];

  const nestedPage = page?.data as { items?: unknown; content?: unknown } | undefined;
  if (Array.isArray(nestedPage?.items)) return nestedPage.items as DocumentDTO[];
  if (Array.isArray(nestedPage?.content)) return nestedPage.content as DocumentDTO[];

  return [];
}

export default function NotebookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const notebookId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const chatRef = useRef<NotebookChatRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  const { subjects, subjectMap } = useSubjects();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editSubjectId, setEditSubjectId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [attachKeyword, setAttachKeyword] = useState("");
  const [uploadDrag, setUploadDrag] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState("");
  const [activeDocument, setActiveDocument] = useState<DocumentDTO | null>(null);

  const subjectOptions = useMemo(
    () => subjects.map((subject) => ({ label: subject.code, value: String(subject.id) })),
    [subjects],
  );
  const getSubjectLabel = (subjectId: number) => subjectMap[subjectId]?.code ?? `Môn #${subjectId}`;

  const { data: res, isLoading, error } = useQuery({
    queryKey: ["notebook", notebookId],
    queryFn: () => notebookService.getNotebookDetails(notebookId),
    enabled: Number.isFinite(notebookId),
  });

  const notebook = res?.data;

  const notebookDocumentsQuery = useQuery({
    queryKey: notebookDocumentKey(notebookId),
    queryFn: () => documentService.getNotebookDocuments(notebookId, 0, 50),
    enabled: Number.isFinite(notebookId),
    select: extractDocumentItems,
  });

  const normalizedAttachKeyword = attachKeyword.trim();
  const workspaceDocumentsQuery = useQuery({
    queryKey: workspaceDocumentKey(normalizedAttachKeyword),
    queryFn: () => documentService.getWorkspaceDocuments(0, 50, normalizedAttachKeyword),
    enabled: isAttachModalOpen,
    select: extractDocumentItems,
  });

  const notebookDocuments = notebookDocumentsQuery.data ?? [];
  const workspaceDocuments = workspaceDocumentsQuery.data ?? [];
  const attachedDocumentIds = useMemo(() => new Set(notebookDocuments.map((doc) => Number(doc.id))), [notebookDocuments]);
  const attachableDocumentCount = useMemo(
    () => workspaceDocuments.filter((doc) => !attachedDocumentIds.has(Number(doc.id))).length,
    [workspaceDocuments, attachedDocumentIds],
  );

  const attachDocumentMutation = useMutation({
    mutationFn: (documentId: number) => documentService.addDocumentToNotebook(notebookId, documentId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: notebookDocumentKey(notebookId) }),
        queryClient.invalidateQueries({ queryKey: ["documents", "workspace"] }),
        queryClient.invalidateQueries({ queryKey: ["notebooks"] }),
      ]);
      await Promise.all([
        notebookDocumentsQuery.refetch(),
        workspaceDocumentsQuery.refetch(),
      ]);
      Notify.success("Đã gắn tài liệu vào notebook");
    },
    onError: (e: any) => Notify.failure(e?.message || "Lỗi gắn tài liệu vào notebook"),
  });

  const uploadToNotebookMutation = useMutation({
    mutationFn: async (files: File[]) => {
      if (!notebook) throw new Error("Không tìm thấy notebook để gắn tài liệu");
      const uploaded: DocumentDTO[] = [];
      const chunkFailures: string[] = [];

      for (const file of files) {
        setUploadingFileName(file.name);
        const uploadResponse = await documentService.uploadDocument(file, notebook.subjectId, undefined, undefined, notebookId);
        if (!uploadResponse.success || !uploadResponse.data) {
          throw new Error(uploadResponse.message || `Không thể tải lên ${file.name}`);
        }

        uploaded.push(uploadResponse.data);
        await queryClient.invalidateQueries({ queryKey: notebookDocumentKey(notebookId) });

        try {
          const processResponse = await documentService.processDocumentChunks(uploadResponse.data.id, {
            chunkSize: 800,
            overlap: 120,
          });
          if (!processResponse.success) chunkFailures.push(uploadResponse.data.title);
        } catch {
          chunkFailures.push(uploadResponse.data.title);
        }
      }

      return { uploaded, chunkFailures };
    },
    onSuccess: async ({ uploaded, chunkFailures }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: notebookDocumentKey(notebookId) }),
        queryClient.invalidateQueries({ queryKey: ["documents", "workspace"] }),
        queryClient.invalidateQueries({ queryKey: ["notebooks"] }),
      ]);
      await Promise.all([
        notebookDocumentsQuery.refetch(),
        workspaceDocumentsQuery.refetch(),
      ]);

      if (chunkFailures.length > 0) {
        Notify.warning(`Đã tải/gắn ${uploaded.length} tài liệu, nhưng ${chunkFailures.length} tài liệu chưa xử lý AI chunks.`);
      } else {
        Notify.success(`Đã tải, gắn và xử lý ${uploaded.length} tài liệu vào notebook`);
      }
    },
    onError: (e: any) => Notify.failure(e?.message || "Không thể tải tài liệu vào notebook"),
    onSettled: () => {
      setUploadingFileName("");
      setUploadDrag(false);
      if (uploadInputRef.current) uploadInputRef.current.value = "";
    },
  });

  const detachDocumentMutation = useMutation({
    mutationFn: (documentId: number) => documentService.removeDocumentFromNotebook(notebookId, documentId),
    onSuccess: (_response, documentId) => {
      queryClient.invalidateQueries({ queryKey: notebookDocumentKey(notebookId) });
      queryClient.invalidateQueries({ queryKey: ["notebooks"] });
      if (activeDocument?.id === documentId) setActiveDocument(null);
      Notify.success("Đã gỡ tài liệu khỏi notebook");
    },
    onError: (e: any) => Notify.failure(e?.message || "Lỗi gỡ tài liệu khỏi notebook"),
  });

  const uploadFilesToNotebook = (fileList: FileList | File[] | null) => {
    const files = Array.from(fileList ?? []);
    if (files.length === 0 || uploadToNotebookMutation.isPending) return;
    uploadToNotebookMutation.mutate(files);
  };

  const handleNotebookUploadInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    uploadFilesToNotebook(event.target.files);
  };

  const handleNotebookUploadDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setUploadDrag(false);
    uploadFilesToNotebook(event.dataTransfer.files);
  };

  useEffect(() => {
    if (notebook) {
      setEditTitle(notebook.title);
      setEditSubjectId(notebook.subjectId.toString());
    }
  }, [notebook]);

  useEffect(() => {
    if (isAttachModalOpen) return;
    setAttachKeyword("");
    setUploadDrag(false);
    setUploadingFileName("");
    if (uploadInputRef.current) uploadInputRef.current.value = "";
  }, [isAttachModalOpen]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    const mainElement = document.getElementById("main-scroll-container");
    if (mainElement) {
      mainElement.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [id]);

  const handleUpdate = async () => {
    if (!editTitle.trim() || !notebook) return;
    setIsSubmitting(true);
    try {
      const res = await notebookService.updateNotebook(notebook.id, Number(editSubjectId), editTitle);
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["notebook", notebookId] });
        queryClient.invalidateQueries({ queryKey: ["notebooks"] });
        Notify.success("Cập nhật Notebook thành công");
        setIsEditModalOpen(false);
      }
    } catch (e: any) {
      Notify.failure(e.message || "Lỗi cập nhật Notebook");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShareClick = () => {
    navigate("/documents");
    Notify.info("Chuyển đến trang Quản lý Tài Liệu để tùy chỉnh cấu hình chia sẻ.");
  };

  const handleDocumentClick = (doc: DocumentDTO | null) => {
    setActiveDocument(doc);
  };

  const handleFloatingAction = (action: string, selectedText: string) => {
    if (!chatRef.current) return;

    let prompt = "";
    if (action === "Giải thích") {
      prompt = `Hãy giải thích chi tiết đoạn văn bản sau:\n\n"${selectedText}"`;
    } else if (action === "Tóm tắt") {
      prompt = `Hãy tóm tắt đoạn văn bản sau ngắn gọn dễ hiểu nhất:\n\n"${selectedText}"`;
    } else if (action === "Dịch") {
      prompt = `Hãy dịch đoạn văn bản sau sang tiếng Anh (hoặc sang tiếng Việt nếu đang là tiếng Anh):\n\n"${selectedText}"`;
    } else if (action === "Tạo Flashcard") {
      prompt = `Hãy tạo 1 thẻ Flashcard (Front/Back) từ kiến thức của đoạn văn bản sau:\n\n"${selectedText}"`;
    } else {
      prompt = `${action}:\n\n"${selectedText}"`;
    }

    chatRef.current.sendMessage(prompt);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-7rem)]">
        <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-muted-foreground text-sm font-medium">{t("pages.notebookDetail.loading", "Đang tải Notebook...")}</p>
      </div>
    );
  }

  if (error || !notebook) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-7rem)] text-center">
        <Bot size={48} className="text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-xl font-bold text-foreground mb-2">{t("pages.notebookDetail.notFoundTitle", "Không tìm thấy Notebook")}</h2>
        <p className="text-muted-foreground text-sm mb-6">{t("pages.notebookDetail.notFoundDesc", "Notebook này không tồn tại hoặc bạn không có quyền truy cập.")}</p>
        <button onClick={() => navigate("/notebooks")} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
          {t("pages.notebookDetail.backToList", "Quay lại danh sách")}
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex h-[calc(100vh-7rem)] overflow-hidden relative border border-border/50 rounded-2xl">
      <FloatingAIToolbar containerRef={containerRef} onAction={handleFloatingAction} />

      {activeDocument && (
        <DocumentViewerPane document={activeDocument} onClose={() => setActiveDocument(null)} />
      )}

      <div className={`${activeDocument ? "w-[42%] min-w-[360px]" : "flex-1"} flex flex-col min-w-0 h-full relative transition-[width]`}>
        <NotebookChat
          ref={chatRef}
          notebookId={notebook.id}
          notebookTitle={notebook.title}
          notebookSubjectCode={getSubjectLabel(notebook.subjectId)}
          notebookSubjectId={notebook.subjectId}
          onBack={() => navigate("/notebooks")}
          onRenameClick={() => setIsEditModalOpen(true)}
          onShareClick={handleShareClick}
          onDocumentClick={handleDocumentClick}
          onAttachDocumentClick={() => setIsAttachModalOpen(true)}
          onDetachDocument={(documentId) => detachDocumentMutation.mutate(documentId)}
          detachingDocumentId={detachDocumentMutation.isPending ? detachDocumentMutation.variables ?? null : null}
          documentsLoading={notebookDocumentsQuery.isLoading}
          documents={notebookDocuments}
          quizzes={[]}
          decks={[]}
          compact={!!activeDocument}
        />
      </div>

      {isAttachModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="surface-card w-full max-w-5xl h-[86vh] max-h-[760px] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="px-5 md:px-6 py-5 border-b border-border/60 flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.2em] font-extrabold text-primary">Notebook context</div>
                <h3 className="font-display text-2xl font-extrabold mt-1">Gắn tài liệu vào notebook</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Chọn tài liệu có sẵn hoặc tải file mới. Tài liệu upload sẽ được gắn ngay và xử lý AI chunks cho chat.
                </p>
              </div>
              <button onClick={() => setIsAttachModalOpen(false)} className="size-10 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground grid place-items-center transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4 p-4 md:p-5 flex-1 min-h-0 bg-muted/[0.12]">
              <section className="rounded-2xl border border-border/60 bg-card flex flex-col min-h-0 overflow-hidden">
                <div className="p-4 border-b border-border/60">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <h4 className="text-base font-extrabold">Tài liệu trong workspace</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {workspaceDocuments.length} kết quả · {attachableDocumentCount} có thể gắn
                      </p>
                    </div>
                    {workspaceDocumentsQuery.isFetching && <Loader2 size={18} className="animate-spin text-primary shrink-0" />}
                  </div>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={attachKeyword}
                      onChange={(e) => setAttachKeyword(e.target.value)}
                      placeholder="Tìm theo tiêu đề hoặc mô tả..."
                      className="w-full h-11 pl-10 pr-4 rounded-xl bg-muted/50 border border-border outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 text-sm font-medium transition-all"
                    />
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 space-y-2">
                  {workspaceDocumentsQuery.isLoading ? (
                    [1, 2, 3, 4].map((item) => (
                      <div key={item} className="h-20 rounded-xl bg-muted/50 animate-pulse border border-border/30" />
                    ))
                  ) : workspaceDocumentsQuery.isError ? (
                    <div className="h-full min-h-[260px] grid place-items-center text-center border border-dashed border-border rounded-2xl p-6">
                      <div>
                        <FileText size={30} className="mx-auto mb-3 text-muted-foreground opacity-60" />
                        <div className="text-sm font-bold">Không tải được danh sách tài liệu</div>
                        <button onClick={() => workspaceDocumentsQuery.refetch()} className="mt-3 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold">
                          Thử lại
                        </button>
                      </div>
                    </div>
                  ) : workspaceDocuments.length > 0 ? (
                    workspaceDocuments.map((doc) => {
                      const documentId = Number(doc.id);
                      const isAttached = attachedDocumentIds.has(documentId);
                      const isAttaching = attachDocumentMutation.isPending && attachDocumentMutation.variables === documentId;
                      return (
                        <div key={doc.id} className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                          isAttached ? "border-emerald-500/20 bg-emerald-500/[0.04]" : "border-border/50 bg-background hover:border-primary/30 hover:bg-primary/[0.02]"
                        }`}>
                          <div className="size-11 rounded-xl bg-muted border border-border/50 grid place-items-center text-[10px] font-extrabold uppercase text-muted-foreground shrink-0">
                            {doc.fileType || "FILE"}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="text-sm font-extrabold truncate">{doc.title}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {formatBytes(doc.fileSize)} · {doc.processingStatus || "UNKNOWN"}
                            </div>
                            {doc.description && <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{doc.description}</div>}
                          </div>
                          <button
                            onClick={() => attachDocumentMutation.mutate(documentId)}
                            disabled={isAttached || isAttaching || attachDocumentMutation.isPending}
                            className={`inline-flex items-center justify-center gap-1.5 px-3 h-9 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                              isAttached
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-primary text-primary-foreground hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                            }`}
                          >
                            {isAttaching ? <Loader2 size={14} className="animate-spin" /> : isAttached ? <CheckCircle2 size={14} /> : <Plus size={14} />}
                            {isAttached ? "Đã gắn" : "Gắn"}
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-full min-h-[260px] grid place-items-center text-center border border-dashed border-border rounded-2xl p-6">
                      <div>
                        <FileText size={30} className="mx-auto mb-3 text-muted-foreground opacity-60" />
                        <div className="text-sm font-bold">
                          {normalizedAttachKeyword ? "Không tìm thấy tài liệu phù hợp" : "Workspace chưa có tài liệu"}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {normalizedAttachKeyword ? "Thử từ khóa khác hoặc upload file mới ở khung bên phải." : "Upload trực tiếp tại đây để gắn vào notebook ngay."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-border/60 bg-card p-4 flex flex-col min-h-0">
                <div className="size-12 rounded-2xl bg-primary/10 text-primary grid place-items-center shadow-inner">
                  <Upload size={22} />
                </div>
                <h4 className="text-base font-extrabold mt-4">Tải document mới</h4>
                <p className="text-sm leading-6 text-muted-foreground mt-1">
                  File được lưu vào workspace, gắn vào notebook này và bắt đầu xử lý AI chunks.
                </p>

                <input
                  ref={uploadInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.pptx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain"
                  className="hidden"
                  onChange={handleNotebookUploadInput}
                />

                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    setUploadDrag(true);
                  }}
                  onDragLeave={() => setUploadDrag(false)}
                  onDrop={handleNotebookUploadDrop}
                  onClick={() => !uploadToNotebookMutation.isPending && uploadInputRef.current?.click()}
                  className={`mt-4 rounded-2xl border-2 border-dashed p-5 text-center cursor-pointer transition-all ${
                    uploadDrag ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50 hover:bg-muted/20"
                  } ${uploadToNotebookMutation.isPending ? "opacity-60 pointer-events-none" : ""}`}
                >
                  <div className="size-12 mx-auto rounded-2xl bg-muted text-primary grid place-items-center">
                    {uploadToNotebookMutation.isPending ? <Loader2 size={22} className="animate-spin" /> : <Upload size={22} />}
                  </div>
                  <div className="mt-3 text-sm font-extrabold">
                    {uploadToNotebookMutation.isPending ? "Đang tải và xử lý..." : "Chọn file hoặc kéo thả"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">PDF, DOCX, PPTX, TXT · tối đa 50MB</div>
                </div>

                {uploadToNotebookMutation.isPending && (
                  <div className="mt-3 rounded-xl border border-primary/20 bg-primary/[0.04] px-3 py-2.5 text-xs font-bold text-primary flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    <span className="truncate">{uploadingFileName || "Đang chuẩn bị file..."}</span>
                  </div>
                )}

                <div className="mt-auto pt-4 space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
                    <span>Môn học</span>
                    <span className="font-bold text-foreground">{getSubjectLabel(notebook.subjectId)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
                    <span>Notebook</span>
                    <span className="font-bold text-foreground truncate ml-3">{notebook.title}</span>
                  </div>
                </div>
              </section>
            </div>
          </motion.div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="surface-card w-full max-w-md rounded-2xl shadow-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-xl font-bold">Chỉnh sửa Notebook</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tiêu đề Notebook</label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Nhập tên..."
                  className="w-full h-10 px-3 rounded-xl bg-card border border-border outline-none focus:border-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Môn học</label>
                <select
                  value={editSubjectId}
                  onChange={(e) => setEditSubjectId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-card border border-border outline-none focus:border-primary text-sm"
                >
                  {subjectOptions.map((subject) => (
                    <option key={subject.value} value={subject.value}>{subject.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-8">
              <button onClick={() => setIsEditModalOpen(false)} className="px-4 h-10 rounded-xl text-sm font-medium hover:bg-muted transition-colors">
                Hủy
              </button>
              <button
                onClick={handleUpdate}
                disabled={isSubmitting || !editTitle.trim()}
                className="px-6 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
              >
                {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
