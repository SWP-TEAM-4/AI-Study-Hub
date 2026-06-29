import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, FileText, Bot, BookOpen, GraduationCap, Plus, Edit2, Share2, Download, X } from "lucide-react";
import { documents, quizzes, decks } from "../lib/mock-data";
import { notebookService, NotebookDTO } from "../services/notebookService";
import { Notify } from "notiflix";
import NotebookChat, { NotebookChatRef } from "../components/Notebook/NotebookChat";
import DocumentViewerPane from "../components/Notebook/DocumentViewerPane";
import FloatingAIToolbar from "../components/Notebook/FloatingAIToolbar";

import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

export default function NotebookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const chatRef = useRef<NotebookChatRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  
  const { data: res, isLoading, error } = useQuery({
    queryKey: ['notebook', id],
    queryFn: () => notebookService.getNotebookDetails(Number(id)),
    enabled: !!id
  });

  const notebook = res?.data;

  const nbDocs = documents.slice(0, 4);
  
  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editSubjectId, setEditSubjectId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Document State
  const [activeDocument, setActiveDocument] = useState<typeof documents[0] | null>(null);

  // Initialize edit states when notebook is loaded
  useEffect(() => {
    if (notebook) {
      setEditTitle(notebook.title);
      setEditSubjectId(notebook.subjectId.toString());
    }
  }, [notebook]);

  // Scroll to top when opening a notebook
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const mainElement = document.getElementById("main-scroll-container");
    if (mainElement) {
      mainElement.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [id]);

  const handleUpdate = async () => {
    if (!editTitle.trim() || !notebook) return;
    setIsSubmitting(true);
    try {
      const res = await notebookService.updateNotebook(notebook.id, Number(editSubjectId), editTitle);
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ['notebook', id] });
        queryClient.invalidateQueries({ queryKey: ['notebooks'] });
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
    // Navigate to documents to use the full share feature
    navigate("/documents");
    Notify.info("Chuyển đến trang Quản lý Tài Liệu để tùy chỉnh cấu hình chia sẻ.");
  };

  const handleDocumentClick = (doc: typeof documents[0]) => {
    setActiveDocument(doc);
    // Notify.info("Đã mở tài liệu ở chế độ Split-Pane.");
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
        <p className="mt-4 text-muted-foreground text-sm font-medium">{t('pages.notebookDetail.loading', 'Đang tải Notebook...')}</p>
      </div>
    );
  }

  if (error || !notebook) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-7rem)] text-center">
        <Bot size={48} className="text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-xl font-bold text-foreground mb-2">{t('pages.notebookDetail.notFoundTitle', 'Không tìm thấy Notebook')}</h2>
        <p className="text-muted-foreground text-sm mb-6">{t('pages.notebookDetail.notFoundDesc', 'Notebook này không tồn tại hoặc bạn không có quyền truy cập.')}</p>
        <button onClick={() => navigate("/notebooks")} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
          {t('pages.notebookDetail.backToList', 'Quay lại danh sách')}
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex h-[calc(100vh-7rem)] overflow-hidden relative border border-border/50 rounded-2xl">
      {/* Toolbar Nổi */}
      <FloatingAIToolbar containerRef={containerRef} onAction={handleFloatingAction} />

      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <NotebookChat 
          ref={chatRef}
          notebookId={notebook.id}
          notebookTitle={notebook.title}
          notebookSubjectCode={notebook.subjectCode}
          onBack={() => navigate("/notebooks")}
          onRenameClick={() => setIsEditModalOpen(true)}
          onShareClick={handleShareClick}
          onDocumentClick={handleDocumentClick}
          documents={documents}
          quizzes={quizzes}
          decks={decks}
        />
      </div>



      {/* Modal Sửa Notebook */}
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
                  <option value="12">SWR302</option>
                  <option value="5">PRN221</option>
                  <option value="1">SWP391</option>
                  <option value="2">SWT301</option>
                  <option value="3">PRJ301</option>
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
