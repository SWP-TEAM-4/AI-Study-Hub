"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, ThumbsUp, MessageSquare, Edit2, Trash2,
  Send, ChevronDown, User, AlertCircle, Loader2, X
} from "lucide-react";
import { Notify } from "notiflix";
import {
  reviewService,
  ReviewDTO,
  ReviewTargetType,
} from "../../services/reviewService";
import { useAuthStore } from "../../store/useAuthStore";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StarRating({
  value,
  onChange,
  readonly = false,
  size = 18,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: number;
}) {
  const [hovered, setHovered] = useState(0);
  const display = readonly ? value : (hovered || value);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`transition-transform ${!readonly ? "hover:scale-110 cursor-pointer" : "cursor-default"}`}
          disabled={readonly}
        >
          <Star
            size={size}
            fill={star <= display ? "#f59e0b" : "none"}
            className={star <= display ? "text-amber-400" : "text-muted-foreground/40"}
          />
        </button>
      ))}
    </div>
  );
}

function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-3 text-muted-foreground text-right">{label}</span>
      <Star size={11} fill="#f59e0b" className="text-amber-400 shrink-0" />
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-amber-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <span className="w-6 text-muted-foreground">{count}</span>
    </div>
  );
}

function ReviewCard({
  review,
  currentUserId,
  onEdit,
  onDelete,
}: {
  review: ReviewDTO;
  currentUserId?: number;
  onEdit: (review: ReviewDTO) => void;
  onDelete: (id: number) => void;
}) {
  const isOwner = currentUserId === review.reviewerId;
  const ago = (() => {
    const diff = Date.now() - new Date(review.createdAt).getTime();
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="p-4 rounded-2xl border border-border/50 bg-card/50 hover:bg-card transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Avatar */}
          <div className="shrink-0 w-9 h-9 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm overflow-hidden">
            {review.reviewerAvatarUrl ? (
              <img src={review.reviewerAvatarUrl} alt={review.reviewerName} className="w-full h-full object-cover" />
            ) : (
              <User size={16} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-foreground truncate">{review.reviewerName}</span>
              <StarRating value={review.rating} readonly size={12} />
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{review.content}</p>
            <span className="mt-1 text-[11px] text-muted-foreground/60">{ago}</span>
          </div>
        </div>
        {isOwner && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onEdit(review)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              title="Sửa"
            >
              <Edit2 size={13} />
            </button>
            <button
              onClick={() => onDelete(review.id)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Xóa"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface ReviewsSectionProps {
  targetType: ReviewTargetType;
  targetId: number;
}

export function ReviewsSection({ targetType, targetId }: ReviewsSectionProps) {
  const { user: authUser } = useAuthStore();

  const [reviews, setReviews] = useState<ReviewDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalElements, setTotalElements] = useState(0);

  // Form state
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit state
  const [editReview, setEditReview] = useState<ReviewDTO | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editContent, setEditContent] = useState("");

  const loadReviews = useCallback(async (p = 0, replace = true) => {
    setIsLoading(true);
    try {
      const res = (await reviewService.getReviews(targetType, targetId, p, 5)) as any;
      if (res.success) {
        const items = res.data.items;
        setReviews(prev => replace ? items : [...prev, ...items]);
        setHasMore(p + 1 < res.data.totalPages);
        setTotalElements(res.data.totalElements);
        setPage(p);
      }
    } catch (err: any) {
      Notify.failure(err.message || "Lỗi tải đánh giá");
    } finally {
      setIsLoading(false);
    }
  }, [targetType, targetId]);

  useEffect(() => {
    loadReviews(0, true);
  }, [loadReviews]);

  // Compute stats
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";
  const ratingCounts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length
  }));

  const handleSubmit = async () => {
    if (!content.trim()) return Notify.warning("Vui lòng nhập nội dung đánh giá.");
    if (!authUser) return Notify.warning("Bạn cần đăng nhập để đánh giá.");
    setIsSubmitting(true);
    try {
      const res = (await reviewService.createReview({ targetType, targetId, rating, content })) as any;
      if (res.success) {
        Notify.success("Đã gửi đánh giá thành công!");
        setContent("");
        setRating(5);
        await loadReviews(0, true);
      }
    } catch (err: any) {
      if (err?.status === 409) Notify.failure("Bạn đã đánh giá tài nguyên này rồi!");
      else Notify.failure(err.message || "Lỗi khi gửi đánh giá.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await reviewService.deleteReview(id);
      Notify.success("Đã xóa đánh giá.");
      setReviews(prev => prev.filter(r => r.id !== id));
      setTotalElements(prev => prev - 1);
    } catch (err: any) {
      Notify.failure(err.message || "Lỗi khi xóa.");
    }
  };

  const handleEditSave = async () => {
    if (!editReview) return;
    if (!editContent.trim()) return Notify.warning("Nội dung không được để trống.");
    setIsSubmitting(true);
    try {
      const res = (await reviewService.updateReview(editReview.id, {
        targetType, targetId,
        rating: editRating,
        content: editContent
      })) as any;
      if (res.success) {
        Notify.success("Đã cập nhật đánh giá!");
        setReviews(prev => prev.map(r => r.id === editReview.id ? res.data : r));
        setEditReview(null);
      }
    } catch (err: any) {
      Notify.failure(err.message || "Lỗi khi cập nhật.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageSquare size={20} className="text-primary" />
        <h2 className="text-lg font-bold">Đánh giá cộng đồng</h2>
        {totalElements > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
            {totalElements}
          </span>
        )}
      </div>

      {/* Stats Summary */}
      {reviews.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/15 flex flex-col sm:flex-row gap-6 items-center">
          <div className="text-center shrink-0">
            <div className="text-5xl font-black text-amber-400">{avgRating}</div>
            <StarRating value={Math.round(parseFloat(avgRating))} readonly size={16} />
            <div className="text-xs text-muted-foreground mt-1">{totalElements} đánh giá</div>
          </div>
          <div className="flex-1 w-full space-y-1.5">
            {ratingCounts.map(({ star, count }) => (
              <RatingBar key={star} label={`${star}`} count={count} total={reviews.length} />
            ))}
          </div>
        </div>
      )}

      {/* Write Review Form */}
      {authUser ? (
        <div className="p-5 rounded-2xl border border-border/60 bg-card space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
              <User size={14} />
            </div>
            <span className="font-semibold text-sm">{authUser.fullName || "Bạn"}</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Điểm đánh giá của bạn</p>
            <StarRating value={rating} onChange={setRating} size={24} />
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Chia sẻ cảm nhận của bạn về tài nguyên học tập này..."
            rows={3}
            className="w-full p-3 rounded-xl bg-muted/40 border border-transparent focus:border-primary focus:bg-card outline-none transition-all text-sm resize-none"
          />
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !content.trim()}
              className="inline-flex items-center gap-2 px-5 h-9 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Gửi đánh giá
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl border border-border/50 bg-muted/30 flex items-center gap-3 text-sm text-muted-foreground">
          <AlertCircle size={16} className="text-amber-400 shrink-0" />
          Đăng nhập để viết đánh giá cho tài nguyên này.
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editReview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setEditReview(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-5"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base">Sửa đánh giá</h3>
                <button onClick={() => setEditReview(null)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                  <X size={16} />
                </button>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Điểm mới</p>
                <StarRating value={editRating} onChange={setEditRating} size={24} />
              </div>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={4}
                className="w-full p-3 rounded-xl bg-muted/40 border border-transparent focus:border-primary focus:bg-card outline-none transition-all text-sm resize-none"
              />
              <div className="flex justify-end gap-3">
                <button onClick={() => setEditReview(null)} className="h-9 px-4 rounded-xl bg-muted text-foreground text-sm hover:bg-muted/80 transition-colors">
                  Huỷ
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 h-9 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : null}
                  Lưu
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reviews List */}
      <div className="space-y-3">
        {isLoading && reviews.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground text-sm">
            <Loader2 size={18} className="animate-spin text-primary" />
            Đang tải đánh giá...
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-10 text-center">
            <ThumbsUp size={36} className="mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
          </div>
        ) : (
          <AnimatePresence>
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                currentUserId={authUser?.userId ?? (authUser as any)?.id}
                onEdit={(r) => { setEditReview(r); setEditRating(r.rating); setEditContent(r.content); }}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        )}

        {hasMore && (
          <button
            onClick={() => loadReviews(page + 1, false)}
            disabled={isLoading}
            className="w-full h-10 rounded-xl border border-border/50 text-sm text-muted-foreground hover:bg-muted/40 transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <ChevronDown size={14} />}
            Xem thêm đánh giá
          </button>
        )}
      </div>
    </div>
  );
}
