"use client";

import { motion, AnimatePresence } from "framer-motion";
import { BookMarked, Plus, Search, Filter, Trash2, X } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import NotebookDetailPage from "./NotebookDetailPage";
import { notebookService, NotebookDTO } from "../services/notebookService";
import { Notify } from "notiflix";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { handleApiError } from "../utils/errorHandler";

const subjects = ["Tất cả", "SWP391", "SWT301", "SWR302", "PRN221", "PRJ301"];

import { useNavigate } from "react-router-dom";

export default function NotebooksPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("Tất cả");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSubjectId, setNewSubjectId] = useState("12"); // Default to SWR302

  const queryClient = useQueryClient();

  // 1. Fetch Notebooks
  const { data: notebooksData, isLoading } = useQuery({
    queryKey: ['notebooks'],
    queryFn: () => notebookService.getNotebooks()
  });

  const notebooksList = notebooksData?.data?.items || [];

  const filtered = useMemo(
    () =>
      notebooksList.filter(
        (n) =>
          (subject === "Tất cả" || n.subjectCode === subject) &&
          n.title.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, subject, notebooksList],
  );

  // 2. Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: { subjectId: number; title: string }) => 
      notebookService.createNotebook(data.subjectId, data.title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      setIsModalOpen(false);
      setNewTitle("");
      Notify.success("Tạo Notebook thành công");
    },
    onError: (e) => handleApiError(e, "Lỗi tạo Notebook")
  });

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    createMutation.mutate({ subjectId: Number(newSubjectId), title: newTitle });
  };

  // 3. Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => notebookService.deleteNotebook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      Notify.success("Đã xóa Notebook");
    },
    onError: (e) => handleApiError(e, "Lỗi xóa Notebook")
  });

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Bạn có chắc muốn xóa Notebook này? Toàn bộ tài liệu bên trong sẽ bị mất.")) return;
    deleteMutation.mutate(id);
  };



  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Notebooks</h1>
          <p className="text-muted-foreground mt-1">Sổ tay học tập, phân nhóm theo môn học.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 self-start md:self-auto"
        >
          <Plus size={16} /> Notebook mới
        </button>
      </div>

      <div className="surface-card p-4 flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm notebook..."
            className="w-full pl-10 pr-3 h-10 rounded-xl bg-muted/60 border border-transparent focus:bg-card focus:border-primary outline-none text-sm"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hidden">
          <Filter size={14} className="text-muted-foreground shrink-0" />
          {subjects.map((s) => (
            <button
              key={s}
              onClick={() => setSubject(s)}
              className={`px-3 h-9 rounded-full text-xs font-medium shrink-0 transition-colors ${
                subject === s ? "bg-ink text-cream" : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <div className="col-span-full py-12 text-center text-muted-foreground"><div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />Đang tải dữ liệu...</div>
          ) : filtered.length === 0 ? (
            <div className="col-span-full text-center py-16 text-muted-foreground">Không tìm thấy notebook nào.</div>
          ) : (
            filtered.map((nb, i) => (
              <motion.div
                key={nb.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ y: -4 }}
              >
                <div
                  onClick={() => navigate(`/notebooks/${nb.id}`)}
                  className="block surface-card p-5 transition-shadow h-full cursor-pointer hover:shadow-md hover:border-primary/30 relative group overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* Hàng 1: Icon & Nút Xóa */}
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="size-11 rounded-xl grid place-items-center"
                        style={{
                          background: `oklch(0.55 0.14 ${nb.color || "200"} / 0.15)`,
                          color: `oklch(0.45 0.14 ${nb.color || "200"})`,
                        }}
                      >
                        <BookMarked size={18} />
                      </div>
                      <button 
                        onClick={(e) => handleDelete(nb.id, e)}
                        className="p-1.5 rounded-lg bg-destructive/10 text-destructive opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 hover:bg-destructive hover:text-destructive-foreground pointer-events-none group-hover:pointer-events-auto"
                        title="Xóa Notebook"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    
                    {/* Hàng 2: Cụm Tags Phân Loại Song Song */}
                    <div className="flex items-center justify-between mb-3 text-[11px] font-semibold tracking-wide">
                      <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary uppercase">
                        {nb.id % 3 === 0 ? "Quiz" : nb.id % 3 === 1 ? "Documents" : "Flashcards"}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground uppercase">
                        {nb.subjectCode}
                      </span>
                    </div>
                    
                    {/* Hàng 3: Tiêu Đề */}
                    <div className="font-display text-lg font-semibold leading-snug mb-4">{nb.title}</div>
                  </div>
                  
                  {/* Khối Thống Kê & Ngày tháng dưới chân */}
                  <div className="space-y-2.5">
                    <div className="bg-muted/50 rounded-lg py-2 text-center">
                      <div className="text-sm font-bold">{nb.documentCount}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Tài liệu</div>
                    </div>
                    <div className="text-[11px] text-muted-foreground">Cập nhật: {new Date(nb.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Modal Tạo Notebook */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="surface-card w-full max-w-md rounded-2xl shadow-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-xl font-bold">Tạo Notebook mới</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tiêu đề Notebook</label>
                <input 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Nhập tên..."
                  className="w-full h-10 px-3 rounded-xl bg-card border border-border outline-none focus:border-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Môn học</label>
                <select 
                  value={newSubjectId}
                  onChange={(e) => setNewSubjectId(e.target.value)}
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
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newTitle.trim() || createMutation.isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  {createMutation.isPending ? "Đang tạo..." : "Tạo Notebook"}
                </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}