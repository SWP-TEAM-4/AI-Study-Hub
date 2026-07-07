"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Star, Download, Share2, Flag,
  FileText, GraduationCap, BookOpen, CheckCircle2,
  MessageSquare, Eye, ShieldAlert, Send, Trash2,
  Edit2, CornerDownRight, ThumbsUp, User, Loader2,
  X, Calendar, Copy, Bookmark
} from "lucide-react";
import { Notify } from "notiflix";
import { governanceService, CommentDTO } from "../services/governanceService";
import { ReviewsSection } from "../components/ui/ReviewsSection";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CommunityTargetType = "DOCUMENT" | "QUIZ" | "FLASHCARD_DECK";

export interface CommunityDetailItem {
  id: number;
  type: CommunityTargetType;
  title: string;
  author: string;
  subject: string;
  semester?: string;
  rating: string | number;
  downloads: number;
  isVerified?: boolean;
  kind: "doc" | "quiz" | "deck";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<CommunityTargetType, { label: string; icon: typeof FileText; color: string; gradient: string }> = {
  DOCUMENT: {
    label: "Tài liệu",
    icon: FileText,
    color: "text-amber-600",
    gradient: "from-amber-500/10 to-orange-500/5",
  },
  QUIZ: {
    label: "Quiz",
    icon: GraduationCap,
    color: "text-green-500",
    gradient: "from-green-500/10 to-emerald-500/5",
  },
  FLASHCARD_DECK: {
    label: "Flashcards",
    icon: BookOpen,
    color: "text-blue-500",
    gradient: "from-blue-500/10 to-indigo-500/5",
  },
};

// ─── Comment Card ─────────────────────────────────────────────────────────────

function CommentCard({
  comment,
  currentUserId,
  onDelete,
  onEdit,
  onReply,
}: {
  comment: CommentDTO;
  currentUserId?: number;
  onDelete: (id: number) => void;
  onEdit: (comment: CommentDTO) => void;
  onReply: (id: number) => void;
}) {
  const isOwner = currentUserId === comment.authorId;
  const ago = (() => {
    const diff = Date.now() - new Date(comment.createdAt).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "Vừa xong";
    if (m < 60) return `${m} phút trước`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} giờ trước`;
    return `${Math.floor(h / 24)} ngày trước`;
  })();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="p-4 rounded-2xl border border-border/50 bg-card/50 space-y-2 hover:bg-card transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="shrink-0 w-9 h-9 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
            <User size={15} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-foreground">{comment.authorName || "Ẩn danh"}</span>
              <span className="text-[11px] text-muted-foreground/60">{ago}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{comment.content}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onReply(comment.id)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            title="Trả lời"
          >
            <CornerDownRight size={13} />
          </button>
          {isOwner && (
            <>
              <button
                onClick={() => onEdit(comment)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                title="Sửa"
              >
                <Edit2 size={13} />
              </button>
              <button
                onClick={() => onDelete(comment.id)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Xóa"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-10 space-y-2 border-l-2 border-border/40 pl-3">
          {comment.replies.map((reply: any) => (
            <div key={reply.id} className="text-sm text-muted-foreground p-2 rounded-xl bg-muted/30">
              <span className="font-semibold text-foreground text-xs">{reply.authorName}</span>
              <span className="text-muted-foreground/40 text-xs ml-2">· trả lời</span>
              <p className="mt-0.5">{reply.content}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Comments Section ─────────────────────────────────────────────────────────

function CommentsSection({
  targetType,
  targetId,
}: {
  targetType: CommunityTargetType;
  targetId: number;
}) {
  const [comments, setComments] = useState<CommentDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState<CommentDTO | null>(null);
  const [editText, setEditText] = useState("");
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const res = await governanceService.getComments(targetType, targetId);
        if (res.success) setComments(res.data.items);
      } catch { }
      finally { setIsLoading(false); }
    })();
  }, [targetType, targetId]);

  const handlePost = async () => {
    if (!commentText.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await governanceService.createComment(targetType, targetId, commentText);
      if (res.success) {
        setComments(prev => [res.data, ...prev]);
        setCommentText("");
        Notify.success("Đã đăng bình luận!");
      }
    } catch (e: any) { Notify.failure(e.message || "Lỗi khi đăng bình luận"); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    try { await governanceService.deleteComment(id); } catch { }
    setComments(prev => prev.filter(c => c.id !== id));
    Notify.success("Đã xóa bình luận.");
  };

  const handleEdit = (comment: CommentDTO) => {
    setEditingComment(comment);
    setEditText(comment.content);
  };

  const handleEditSave = () => {
    if (!editingComment || !editText.trim()) return;
    setComments(prev => prev.map(c => c.id === editingComment.id ? { ...c, content: editText } : c));
    setEditingComment(null);
    Notify.success("Đã cập nhật bình luận!");
  };

  const handleReply = (id: number) => {
    setReplyingId(prev => prev === id ? null : id);
    setReplyText("");
  };

  const handlePostReply = (commentId: number) => {
    if (!replyText.trim()) return;
    Notify.success("Đã gửi phản hồi!");
    setReplyingId(null);
    setReplyText("");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <MessageSquare size={20} className="text-primary" />
        <h2 className="text-lg font-bold">Bình luận</h2>
        {comments.length > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
            {comments.length}
          </span>
        )}
      </div>

      {/* Write comment */}
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
          <User size={15} className="text-primary" />
        </div>
        <div className="flex-1 space-y-2">
          <textarea
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder="Viết bình luận của bạn..."
            rows={2}
            className="w-full p-3 rounded-xl bg-muted/40 border border-transparent focus:border-primary focus:bg-card outline-none transition-all text-sm resize-none"
          />
          <div className="flex justify-end">
            <button
              onClick={handlePost}
              disabled={isSubmitting || !commentText.trim()}
              className="inline-flex items-center gap-2 px-4 h-9 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 active:scale-95 transition-all"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Đăng
            </button>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      <AnimatePresence>
        {editingComment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setEditingComment(null)}
          >
            <motion.div
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.92 }}
              className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold">Sửa bình luận</h3>
                <button onClick={() => setEditingComment(null)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X size={16} /></button>
              </div>
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                rows={4}
                className="w-full p-3 rounded-xl bg-muted/40 border border-transparent focus:border-primary outline-none text-sm resize-none"
              />
              <div className="flex justify-end gap-3">
                <button onClick={() => setEditingComment(null)} className="h-9 px-4 rounded-xl bg-muted text-sm">Huỷ</button>
                <button onClick={handleEditSave} className="h-9 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">Lưu</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground text-sm">
            <Loader2 size={16} className="animate-spin text-primary" /> Đang tải bình luận...
          </div>
        ) : comments.length === 0 ? (
          <div className="py-10 text-center">
            <MessageSquare size={34} className="mx-auto mb-3 text-muted-foreground/25" />
            <p className="text-sm text-muted-foreground">Chưa có bình luận. Hãy là người đầu tiên!</p>
          </div>
        ) : (
          <AnimatePresence>
            {comments.map(comment => (
              <div key={comment.id}>
                <CommentCard
                  comment={comment}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onReply={handleReply}
                />
                {/* Reply box */}
                <AnimatePresence>
                  {replyingId === comment.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="ml-12 mt-2 flex gap-2 overflow-hidden"
                    >
                      <input
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Trả lời bình luận..."
                        className="flex-1 h-9 px-3 rounded-xl bg-muted/40 border border-transparent focus:border-primary outline-none text-sm"
                      />
                      <button
                        onClick={() => handlePostReply(comment.id)}
                        className="h-9 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
                      >
                        Gửi
                      </button>
                      <button
                        onClick={() => setReplyingId(null)}
                        className="h-9 px-3 rounded-xl bg-muted text-xs"
                      >
                        Huỷ
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

// ─── Report Panel ─────────────────────────────────────────────────────────────

function ReportPanel({
  targetType,
  targetId,
  onClose,
}: {
  targetType: CommunityTargetType;
  targetId: number;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("INAPPROPRIATE");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!details.trim()) return Notify.warning("Vui lòng nhập chi tiết báo cáo.");
    setIsSubmitting(true);
    try {
      await governanceService.createReport({
        targetType, targetId,
        reasonType: reason,
        reportDetails: details,
        severityLevel: reason === "COPYRIGHT" ? "HIGH" : "MEDIUM",
      });
      Notify.success("Đã gửi báo cáo. Cảm ơn bạn!");
      onClose();
    } catch (e: any) {
      Notify.failure(e.message || "Lỗi khi gửi báo cáo");
    } finally { setIsSubmitting(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9 }}
        className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-destructive">
            <ShieldAlert size={20} />
            <h3 className="font-bold">Báo cáo nội dung</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X size={16} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Lý do báo cáo</label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-border/50 bg-background focus:border-primary outline-none text-sm"
            >
              <option value="INAPPROPRIATE">Nội dung không phù hợp</option>
              <option value="COPYRIGHT">Vi phạm bản quyền</option>
              <option value="SPAM">Spam hoặc gây hiểu lầm</option>
              <option value="OTHER">Khác</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Chi tiết</label>
            <textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Mô tả chi tiết vấn đề..."
              rows={3}
              className="w-full p-3 rounded-xl border border-border/50 bg-background focus:border-primary outline-none text-sm resize-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="h-9 px-4 rounded-xl bg-muted text-sm">Huỷ</button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !details.trim()}
            className="inline-flex items-center gap-2 h-9 px-5 rounded-xl bg-destructive text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 size={13} className="animate-spin" />}
            Gửi báo cáo
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

type Tab = "overview" | "comments" | "reviews";

interface CommunityDetailPageProps {
  item: CommunityDetailItem;
  onBack: () => void;
}

export default function CommunityDetailPage({ item, onBack }: CommunityDetailPageProps) {
  const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.DOCUMENT;
  const Icon = cfg.icon;
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showReport, setShowReport] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const tabs: { key: Tab; label: string; icon: typeof MessageSquare }[] = [
    { key: "overview", label: "Tổng quan", icon: Eye },
    { key: "comments", label: "Bình luận", icon: MessageSquare },
    { key: "reviews", label: "Đánh giá", icon: Star },
  ];

  const handleShare = () => {
    const url = `${window.location.origin}/community/preview/${item.type.toLowerCase()}/${item.id}`;
    navigator.clipboard.writeText(url);
    Notify.success("Đã sao chép liên kết chia sẻ!");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* Back */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
        Quay lại cộng đồng
      </button>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${cfg.gradient} border border-border/60 p-6 md:p-8 shadow-xl`}>
        {/* Decorative background blobs */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-56 h-56 rounded-full bg-white/3 blur-2xl pointer-events-none" />

        <div className="relative">
          {/* Badge row */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/60 border border-border/50 text-sm font-semibold ${cfg.color} backdrop-blur-sm`}>
              <Icon size={14} />
              {cfg.label}
            </div>
            {item.isVerified && (
              <span className="inline-flex items-center gap-1 text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full text-xs font-semibold">
                <CheckCircle2 size={12} /> Đã xác minh
              </span>
            )}
            {item.subject && (
              <span className="px-2.5 py-1 rounded-full bg-muted/80 text-muted-foreground text-xs font-medium border border-border/40">
                {item.subject}
              </span>
            )}
            {item.semester && (
              <span className="px-2.5 py-1 rounded-full bg-muted/80 text-muted-foreground text-xs font-medium border border-border/40">
                {item.semester}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-snug max-w-3xl">
            {item.title}
          </h1>

          {/* Author & meta */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-full bg-gradient-to-br from-primary/60 to-primary text-white flex items-center justify-center text-[10px] font-bold">
                {item.author?.split(" ").map(p => p[0]).slice(0, 2).join("") || "??"}
              </div>
              <span className="font-medium text-foreground/80">{item.author || "Ẩn danh"}</span>
            </div>
            <span className="flex items-center gap-1 text-amber-500 font-semibold">
              <Star size={13} className="fill-current" />
              {item.rating}
            </span>
            <span className="flex items-center gap-1">
              <Download size={13} />
              {(item.downloads as any)?.toLocaleString?.() || item.downloads} lượt tải
            </span>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-3 items-center">
            <button
              onClick={() => Notify.success(`Đang tải "${item.title}"...`)}
              className="inline-flex items-center gap-2 px-5 h-10 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/20"
            >
              <Download size={15} /> Tải về
            </button>
            <button
              onClick={() => Notify.success("Đã thêm vào bộ sưu tập của bạn!")}
              className="inline-flex items-center gap-2 px-5 h-10 rounded-2xl bg-muted text-foreground font-semibold text-sm hover:bg-muted/80 transition-colors border border-border/50"
            >
              <Copy size={14} /> Clone
            </button>

            {/* Right side actions */}
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => { setIsSaved(p => !p); Notify.success(isSaved ? "Đã xóa khỏi yêu thích" : "Đã lưu vào yêu thích!"); }}
                className={`size-9 rounded-xl flex items-center justify-center border transition-all ${isSaved ? "bg-amber-500/15 text-amber-500 border-amber-500/30" : "bg-muted/60 text-muted-foreground border-border/40 hover:bg-muted"}`}
                title="Lưu yêu thích"
              >
                <Bookmark size={15} className={isSaved ? "fill-current" : ""} />
              </button>
              <button
                onClick={handleShare}
                className="size-9 rounded-xl bg-muted/60 text-muted-foreground border border-border/40 hover:bg-muted flex items-center justify-center transition-all"
                title="Chia sẻ"
              >
                <Share2 size={15} />
              </button>
              <button
                onClick={() => setShowReport(true)}
                className="size-9 rounded-xl bg-muted/60 text-destructive/70 border border-border/40 hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-all"
                title="Báo cáo vi phạm"
              >
                <Flag size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 p-1 bg-muted/40 border border-border/40 rounded-2xl w-fit">
        {tabs.map(({ key, label, icon: TabIcon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`relative inline-flex items-center gap-1.5 px-4 h-9 rounded-xl text-sm font-medium transition-all ${
              activeTab === key ? "text-foreground" : "text-muted-foreground hover:text-foreground/70"
            }`}
          >
            {activeTab === key && (
              <motion.div
                layoutId="community-detail-tab"
                className="absolute inset-0 bg-card border border-border/60 rounded-xl shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <TabIcon size={14} className="relative z-10" />
            <span className="relative z-10">{label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ──────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Lượt tải", value: (item.downloads as any)?.toLocaleString?.() || item.downloads, icon: Download, color: "text-blue-400" },
                  { label: "Đánh giá TB", value: item.rating, icon: Star, color: "text-amber-400" },
                  { label: "Loại", value: cfg.label, icon: Icon, color: cfg.color },
                  { label: "Môn học", value: item.subject || "Chung", icon: GraduationCap, color: "text-emerald-400" },
                ].map(({ label, value, icon: StatIcon, color }) => (
                  <div key={label} className="p-4 rounded-2xl bg-card border border-border/40 text-center">
                    <StatIcon size={18} className={`${color} mx-auto mb-2`} />
                    <div className="font-bold text-foreground">{value}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div className="p-5 rounded-2xl bg-muted/20 border border-border/40 space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Eye size={15} className="text-primary" /> Mô tả
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Tài nguyên <strong className="text-foreground">{item.title}</strong> thuộc loại{" "}
                  <strong className="text-foreground">{cfg.label}</strong> được đăng tải bởi cộng đồng học tập.
                  Tài nguyên này đã được tải xuống{" "}
                  <strong className="text-foreground">{(item.downloads as any)?.toLocaleString?.() || item.downloads}</strong> lần
                  và nhận được đánh giá trung bình{" "}
                  <strong className="text-amber-500">⭐ {item.rating}</strong>.
                </p>
                {item.isVerified && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/8 border border-blue-500/15 text-sm text-blue-400">
                    <CheckCircle2 size={15} className="shrink-0" />
                    Nội dung đã được kiểm duyệt và xác nhận chất lượng bởi đội ngũ AI Study Hub.
                  </div>
                )}
              </div>

              {/* Quick prompt to navigate to other tabs */}
              <div className="flex gap-3">
                <button
                  onClick={() => setActiveTab("comments")}
                  className="flex-1 p-4 rounded-2xl border border-border/40 bg-card hover:bg-muted/30 transition-colors text-left group"
                >
                  <MessageSquare size={18} className="text-primary mb-2" />
                  <p className="font-semibold text-sm">Bình luận</p>
                  <p className="text-xs text-muted-foreground mt-0.5 group-hover:text-foreground/70 transition-colors">
                    Thảo luận và chia sẻ cảm nhận
                  </p>
                </button>
                <button
                  onClick={() => setActiveTab("reviews")}
                  className="flex-1 p-4 rounded-2xl border border-border/40 bg-card hover:bg-muted/30 transition-colors text-left group"
                >
                  <Star size={18} className="text-amber-400 mb-2" />
                  <p className="font-semibold text-sm">Đánh giá sao</p>
                  <p className="text-xs text-muted-foreground mt-0.5 group-hover:text-foreground/70 transition-colors">
                    Xem và gửi đánh giá rating
                  </p>
                </button>
              </div>
            </div>
          )}

          {activeTab === "comments" && (
            <CommentsSection targetType={item.type} targetId={item.id} />
          )}

          {activeTab === "reviews" && (
            <ReviewsSection targetType={item.type} targetId={item.id} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Report panel */}
      <AnimatePresence>
        {showReport && (
          <ReportPanel
            targetType={item.type}
            targetId={item.id}
            onClose={() => setShowReport(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
