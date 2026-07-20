import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, FileText, Plus, Search, X } from "lucide-react";
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

export default function NotebookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const notebookId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const chatRef = useRef<NotebookChatRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const { subjects, subjectMap } = useSubjects();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editSubjectId, setEditSubjectId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [attachKeyword, setAttachKeyword] = useState("");
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
    select: (data) => data?.data?.items ?? [],
  });

  const workspaceDocumentsQuery = useQuery({
    queryKey: workspaceDocumentKey(attachKeyword),
    queryFn: () => documentService.getWorkspaceDocuments(0, 50, attachKeyword),
    enabled: isAttachModalOpen,
    select: (data) => data?.data?.items ?? [],
  });

  const notebookDocuments = notebookDocumentsQuery.data ?? [];
  const attachedDocumentIds = useMemo(() => new Set(notebookDocuments.map((doc) => Number(doc.id))), [notebookDocuments]);
  const attachableDocuments = useMemo(
    () => (workspaceDocumentsQuery.data ?? []).filter((doc) => !attachedDocumentIds.has(Number(doc.id))),
    [workspaceDocumentsQuery.data, attachedDocumentIds],
  );

  const attachDocumentMutation = useMutation({
    mutationFn: (documentId: number) => documentService.addDocumentToNotebook(notebookId, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notebookDocumentKey(notebookId) });
      queryClient.invalidateQueries({ queryKey: ["documents", "workspace"] });
      queryClient.invalidateQueries({ queryKey: ["notebooks"] });
      Notify.success("Đã gắn tài liệu vào notebook");
    },
    onError: (e: any) => Notify.failure(e?.message || "Lỗi gắn tài liệu vào notebook"),
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

  useEffect(() => {
    if (notebook) {
      setEditTitle(notebook.title);
      setEditSubjectId(notebook.subjectId.toString());
    }
  }, [notebook]);

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="surface-card w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl p-6 flex flex-col"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-display text-xl font-bold">Gắn tài liệu có sẵn</h3>
                <p className="text-xs text-muted-foreground mt-1">Chọn tài liệu trong workspace để đưa vào ngữ cảnh AI của notebook.</p>
              </div>
              <button onClick={() => setIsAttachModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={attachKeyword}
                onChange={(e) => setAttachKeyword(e.target.value)}
                placeholder="Tìm tài liệu theo tiêu đề..."
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-muted/50 border border-border outline-none focus:border-primary text-sm"
              />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
              {workspaceDocumentsQuery.isLoading ? (
                [1, 2, 3].map((item) => <div key={item} className="h-16 rounded-xl bg-muted/40 animate-pulse border border-border/30" />)
              ) : attachableDocuments.length > 0 ? (
                attachableDocuments.map((doc) => (
                  <div key={doc.id} className="p-3 rounded-xl border border-border/50 bg-muted/20 flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-background border border-border/50 grid place-items-center text-[10px] font-bold uppercase text-muted-foreground">
                      {doc.fileType || "FILE"}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-sm font-semibold truncate">{doc.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatBytes(doc.fileSize)} • {doc.processingStatus || "UNKNOWN"}
                      </div>
                    </div>
                    <button
                      onClick={() => attachDocumentMutation.mutate(Number(doc.id))}
                      disabled={attachDocumentMutation.isPending}
                      className="inline-flex items-center gap-1.5 px-3 h-9 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 disabled:opacity-50"
                    >
                      <Plus size={14} /> Gắn
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-sm text-muted-foreground border border-dashed border-border rounded-2xl">
                  <FileText size={28} className="mx-auto mb-2 opacity-50" />
                  Không còn tài liệu nào để gắn.
                </div>
              )}
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
