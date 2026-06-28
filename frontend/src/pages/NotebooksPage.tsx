"use client";

import { motion, AnimatePresence } from "framer-motion";
import { BookMarked, Plus, Search, Filter, Trash2, X, MoreHorizontal, Edit, Globe, Tag } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import NotebookDetailPage from "./NotebookDetailPage";
import { notebookService, NotebookDTO } from "../services/notebookService";
import { Notify } from "notiflix";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { handleApiError } from "../utils/errorHandler";
import CustomSelect from "../components/ui/CustomSelect";

const subjects = ["Tất cả", "SWP391", "SWT301", "SWR302", "PRN221", "PRJ301"];

import { useNavigate } from "react-router-dom";

export default function NotebooksPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterVisibility, setFilterVisibility] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSubjectId, setNewSubjectId] = useState("12"); // Default to SWR302

  // Edit Modal State
  const [editModal, setEditModal] = useState({ isOpen: false, id: 0, title: "", subjectId: "12" });

  // Mock Actions
  const handleEdit = (nb: NotebookDTO) => {
    setEditModal({ isOpen: true, id: nb.id, title: nb.title, subjectId: String(nb.subjectId) });
  };
  const handlePublish = (id: number) => {
    Notify.success("Đã gửi lên cộng đồng! Trạng thái: Chờ duyệt.");
  };
  const handleAddTag = (id: number) => Notify.info("Chức năng gắn Tag đang chờ API backend.");

  const queryClient = useQueryClient();

  // 1. Fetch Notebooks
  const { data: notebooksData, isLoading } = useQuery({
    queryKey: ['notebooks'],
    queryFn: () => notebookService.getNotebooks()
  });

  const notebooksList = notebooksData?.data?.items || [];

  const filtered = useMemo(
    () => {
      let result = notebooksList.filter((x: any) => {
        const matchSearch = x.title.toLowerCase().includes(q.toLowerCase()) || (x.subjectCode || "").toLowerCase().includes(q.toLowerCase());
        const matchSubject = filterSubject === "all" || x.subjectCode === filterSubject;
        const matchVis = filterVisibility === "all" || x.visibility === filterVisibility;
        const matchStatus = filterStatus === "all" || x.status === filterStatus;
        return matchSearch && matchSubject && matchVis && matchStatus;
      });

      if (sortBy === "newest") {
        result.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      } else if (sortBy === "oldest") {
        result.sort((a: any, b: any) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
      } else if (sortBy === "az") {
        result.sort((a: any, b: any) => a.title.localeCompare(b.title));
      }
      return result;
    },
    [notebooksList, q, filterSubject, filterVisibility, filterStatus, sortBy],
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

  // 3. Update Mutation
  const updateMutation = useMutation({
    mutationFn: (data: { id: number; subjectId: number; title: string }) => 
      notebookService.updateNotebook(data.id, data.subjectId, data.title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      setEditModal({ isOpen: false, id: 0, title: "", subjectId: "12" });
      Notify.success("Cập nhật Notebook thành công");
    },
    onError: (e) => handleApiError(e, "Lỗi cập nhật Notebook")
  });

  const handleUpdate = () => {
    if (!editModal.title.trim()) return;
    updateMutation.mutate({ id: editModal.id, subjectId: Number(editModal.subjectId), title: editModal.title });
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

      <div className="surface-card p-3 rounded-2xl flex flex-col lg:flex-row gap-3 items-center border border-border relative z-30">
        <div className="flex-1 relative flex items-center w-full">
          <Search className="absolute left-4 text-muted-foreground" size={16} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm notebook..."
            className="w-full pl-10 pr-4 h-11 bg-muted/50 border border-transparent focus:border-primary focus:bg-card outline-none transition-all text-sm rounded-xl"
          />
        </div>
        
        <div className="flex flex-wrap md:flex-nowrap gap-3 w-full lg:w-auto">
          <CustomSelect
            value={filterSubject}
            onChange={setFilterSubject}
            className="flex-1 md:flex-none min-w-[140px]"
            data={[
              { label: "Tất cả môn học", value: "all" },
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
            className="flex-1 md:flex-none min-w-[140px]"
            data={[
              { label: "Tất cả hiển thị", value: "all" },
              { label: "Riêng tư", value: "PRIVATE" },
              { label: "Workspace", value: "WORKSPACE" },
              { label: "Marketplace", value: "MARKETPLACE" }
            ]}
          />
          <CustomSelect
            value={filterStatus}
            onChange={setFilterStatus}
            className="flex-1 md:flex-none min-w-[140px]"
            data={[
              { label: "Tất cả trạng thái duyệt", value: "all" },
              { label: "Chờ duyệt", value: "PENDING" },
              { label: "Đã duyệt", value: "APPROVED" },
              { label: "Từ chối", value: "REJECTED" }
            ]}
          />
          <CustomSelect
            value={sortBy}
            onChange={setSortBy}
            className="flex-1 md:flex-none min-w-[130px]"
            data={[
              { label: "Mới nhất", value: "newest" },
              { label: "Cũ nhất", value: "oldest" },
              { label: "A-Z", value: "az" }
            ]}
          />
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
                      
                      {/* Action Dropdown (Mocked) */}
                      <div className="relative group/menu">
                        <button className="text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-muted/50 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal size={16} />
                        </button>
                        <div className="absolute right-0 mt-1 w-40 bg-card border border-border shadow-lg rounded-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20 overflow-hidden" onClick={e => e.stopPropagation()}>
                          <button onClick={(e) => { e.stopPropagation(); handleEdit(nb); }} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50">
                            <Edit size={14} /> Sửa
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleAddTag(nb.id); }} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50">
                            <Tag size={14} /> Gắn thẻ
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handlePublish(nb.id); }} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-primary hover:bg-primary/10">
                            <Globe size={14} /> Đăng cộng đồng
                          </button>
                          <button onClick={(e) => handleDelete(nb.id, e)} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 border-t border-border/50">
                            <Trash2 size={14} /> Xóa
                          </button>
                        </div>
                      </div>
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

      {/* Modal Cập nhật Notebook */}
      {editModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="surface-card w-full max-w-md rounded-2xl shadow-2xl p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-xl font-bold">Cập nhật Notebook</h3>
              <button onClick={() => setEditModal(prev => ({ ...prev, isOpen: false }))} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Tên Notebook</label>
                <input 
                  autoFocus 
                  value={editModal.title} 
                  onChange={e => setEditModal(prev => ({ ...prev, title: e.target.value }))} 
                  placeholder="Nhập tên notebook..." 
                  className="w-full h-11 px-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:bg-card outline-none transition-all" 
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Môn học</label>
                <select 
                  value={editModal.subjectId} 
                  onChange={e => setEditModal(prev => ({ ...prev, subjectId: e.target.value }))}
                  className="w-full h-11 px-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:bg-card outline-none transition-all cursor-pointer"
                >
                  <optgroup label="Semester 5">
                    <option value="1">SWP391</option>
                    <option value="2">SWT301</option>
                    <option value="12">SWR302</option>
                  </optgroup>
                  <optgroup label="Semester 4">
                    <option value="5">PRN221</option>
                    <option value="3">PRJ301</option>
                  </optgroup>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setEditModal(prev => ({ ...prev, isOpen: false }))} className="px-4 h-10 rounded-xl bg-muted text-sm font-medium hover:bg-muted/80">Hủy</button>
              <button onClick={handleUpdate} disabled={updateMutation.isPending || !editModal.title.trim()} className="px-4 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
                {updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}