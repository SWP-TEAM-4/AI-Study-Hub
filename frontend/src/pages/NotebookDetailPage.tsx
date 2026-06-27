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

export default function NotebookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const chatRef = useRef<NotebookChatRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
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

  // Document & Drawer State
  const [isDocsDrawerOpen, setIsDocsDrawerOpen] = useState(false);
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
    setIsDocsDrawerOpen(false);
    Notify.info("Đã mở tài liệu ở chế độ Split-Pane.");
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
        <p className="mt-4 text-muted-foreground text-sm font-medium">Đang tải Notebook...</p>
      </div>
    );
  }

  if (error || !notebook) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-7rem)] text-center">
        <Bot size={48} className="text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-xl font-bold text-foreground mb-2">Không tìm thấy Notebook</h2>
        <p className="text-muted-foreground text-sm mb-6">Notebook này không tồn tại hoặc bạn không có quyền truy cập.</p>
        <button onClick={() => navigate("/notebooks")} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex h-[calc(100vh-7rem)] overflow-hidden relative border border-border/50 rounded-2xl">
      {/* Cửa sổ Tài liệu (Split-pane) */}
      <AnimatePresence>
        {activeDocument && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "50%", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="h-full overflow-hidden shrink-0 border-r border-border/50 hidden md:block relative"
          >
            <DocumentViewerPane 
              documentTitle={activeDocument.title} 
              onClose={() => setActiveDocument(null)} 
            />
          </motion.div>
        )}
      </AnimatePresence>

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
          onViewDocumentsClick={() => setIsDocsDrawerOpen(true)}
        />
      </div>

      {/* Docs Drawer */}
      <AnimatePresence>
        {isDocsDrawerOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={() => setIsDocsDrawerOpen(false)}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm z-40" 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDocsDrawerOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute top-0 right-0 bottom-0 w-full sm:w-[360px] bg-card border-l border-border/50 shadow-2xl z-50 flex flex-col dark:premium-sidebar"
          >
            <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/20">
              <h3 className="font-display font-semibold flex items-center gap-2 text-sm text-foreground">
                <FileText size={16} className="text-primary" /> Thông tin Notebook
              </h3>
              <button onClick={() => setIsDocsDrawerOpen(false)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 no-scrollbar">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold">{notebook.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
                    {notebook.subjectCode || "N/A"}
                  </span>
                  <span className="text-xs text-muted-foreground">Cập nhật {new Date(notebook.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Tài liệu đính kèm</h3>
                  <button onClick={() => navigate("/documents")} className="text-xs text-primary hover:underline">Tất cả →</button>
                </div>
                <ul className="divide-y divide-border/50 border border-border/50 rounded-xl overflow-hidden bg-muted/10">
                  {nbDocs.map((d) => (
                    <li key={d.id} onClick={() => handleDocumentClick(d)} className="p-3 flex items-center gap-3 hover:bg-muted/50 cursor-pointer transition-colors">
                      <div className="size-8 shrink-0 rounded-lg bg-background border border-border/50 grid place-items-center text-[10px] font-bold uppercase text-muted-foreground shadow-sm">
                        {d.type}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-foreground truncate">{d.title}</div>
                        <div className="text-[11px] text-muted-foreground">{d.size} · {d.uploaded}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-3">Quiz & Flashcards</h3>
                <div className="grid grid-cols-2 gap-3">
                  {quizzes.slice(0, 1).map((q) => (
                    <button key={q.id} onClick={() => navigate("/quiz")} className="text-left p-3 rounded-xl bg-muted/30 hover:bg-muted border border-border/50 transition-all">
                      <GraduationCap size={16} className="text-primary mb-1.5" />
                      <div className="text-[13px] font-medium truncate">{q.title}</div>
                      <div className="text-[11px] text-muted-foreground">{q.questions} câu</div>
                    </button>
                  ))}
                  {decks.slice(0, 1).map((d) => (
                    <button key={d.id} onClick={() => navigate("/flashcards")} className="text-left p-3 rounded-xl bg-muted/30 hover:bg-muted border border-border/50 transition-all">
                      <BookOpen size={16} className="text-coral mb-1.5" />
                      <div className="text-[13px] font-medium truncate">{d.title}</div>
                      <div className="text-[11px] text-muted-foreground">{d.cards} thẻ</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
