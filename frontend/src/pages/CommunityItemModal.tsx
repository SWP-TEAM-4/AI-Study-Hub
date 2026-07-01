import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Download, Eye, Flag, Send, Star, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Notify } from "notiflix";
import { governanceService, type ReviewDTO } from "../services/governanceService";
import type { MarketplaceItemDTO } from "../services/communityMarketplaceService";

interface CommunityItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MarketplaceItemDTO;
  subjectLabel?: string;
  onClone: (item: MarketplaceItemDTO) => void;
}

const TYPE_LABEL: Record<string, string> = {
  DOCUMENT: "Tài liệu",
  QUIZ: "Quiz",
  FLASHCARD_DECK: "Flashcards",
};

const REPORT_REASONS = [
  { label: "Nội dung không phù hợp", value: "INAPPROPRIATE" },
  { label: "Vi phạm bản quyền", value: "COPYRIGHT" },
  { label: "Spam hoặc gây hiểu lầm", value: "SPAM" },
  { label: "Khác", value: "OTHER" },
];

function formatNumber(value?: number | null) {
  return Number(value ?? 0).toLocaleString("vi-VN");
}

function ratingFromAcceptPercentage(value?: number | string | null) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  return Math.min(5, numeric / 20);
}

export default function CommunityItemModal({
  isOpen,
  onClose,
  item,
  subjectLabel,
  onClone,
}: CommunityItemModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "reviews" | "report">("overview");
  const [reviews, setReviews] = useState<ReviewDTO[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reportReason, setReportReason] = useState("INAPPROPRIATE");
  const [reportDetails, setReportDetails] = useState("");

  const rating = useMemo(() => ratingFromAcceptPercentage(item.acceptPercentage), [item.acceptPercentage]);
  const reviewAverage = reviews.length
    ? reviews.reduce((sum, review) => sum + Number(review.rating ?? 0), 0) / reviews.length
    : rating;

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab("overview");
  }, [isOpen, item.targetType, item.targetId]);

  useEffect(() => {
    if (!isOpen || activeTab !== "reviews") return;

    let mounted = true;
    async function loadReviews() {
      setIsLoadingReviews(true);
      try {
        const response = await governanceService.getReviews(item.targetType, item.targetId, 0, 20);
        if (mounted) setReviews(response.data.items ?? []);
      } catch (err: any) {
        Notify.failure(err?.message || "Không tải được đánh giá.");
      } finally {
        if (mounted) setIsLoadingReviews(false);
      }
    }

    loadReviews();
    return () => {
      mounted = false;
    };
  }, [activeTab, isOpen, item.targetType, item.targetId]);

  const submitReview = async () => {
    if (!reviewText.trim()) return;
    setIsSubmitting(true);
    try {
      const response = await governanceService.createReview(item.targetType, item.targetId, reviewRating, reviewText.trim());
      setReviews((current) => [response.data, ...current]);
      setReviewText("");
      setReviewRating(5);
      Notify.success("Đã đăng đánh giá.");
    } catch (err: any) {
      Notify.failure(err?.message || "Đăng đánh giá thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteReview = async (reviewId: number) => {
    setIsSubmitting(true);
    try {
      await governanceService.deleteReview(reviewId);
      setReviews((current) => current.filter((review) => review.id !== reviewId));
      Notify.success("Đã xóa đánh giá.");
    } catch (err: any) {
      Notify.failure(err?.message || "Xóa đánh giá thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitReport = async () => {
    if (!reportDetails.trim()) return;
    setIsSubmitting(true);
    try {
      await governanceService.createReport({
        targetType: item.targetType,
        targetId: item.targetId,
        reasonType: reportReason,
        reportDetails: reportDetails.trim(),
        severityLevel: reportReason === "COPYRIGHT" ? "HIGH" : "MEDIUM",
      });
      setReportDetails("");
      setReportReason("INAPPROPRIATE");
      Notify.success("Đã gửi báo cáo nội dung.");
      onClose();
    } catch (err: any) {
      Notify.failure(err?.message || "Gửi báo cáo thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="surface-card flex max-h-[86vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-border/50 bg-muted/20 p-6">
              <div className="min-w-0">
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                  {TYPE_LABEL[item.targetType]} · nguồn #{item.targetId}
                </div>
                <h2 className="font-display line-clamp-2 max-w-xl text-xl font-bold">{item.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {subjectLabel || "Chưa gắn môn"} · {item.creatorName || "Ẩn danh"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="ml-4 flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-muted"
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-0.5 border-b border-border/50 bg-card px-6 pt-4">
              {[
                ["overview", "Overview"],
                ["reviews", "Đánh giá"],
                ["report", "Báo cáo"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setActiveTab(value as typeof activeTab)}
                  className={`relative h-11 px-4 text-sm font-semibold transition-colors ${
                    activeTab === value ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                  {activeTab === value && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === "overview" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="surface-card rounded-xl p-4">
                      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rating</div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-2xl font-bold">{reviewAverage ? reviewAverage.toFixed(1) : "N/A"}</span>
                        <Star size={15} className={reviewAverage ? "fill-amber-500 text-amber-500" : "text-muted-foreground"} />
                      </div>
                    </div>
                    <div className="surface-card rounded-xl p-4">
                      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lượt clone</div>
                      <div className="font-display text-2xl font-bold">{formatNumber(item.downloadCount)}</div>
                    </div>
                    <div className="surface-card rounded-xl p-4">
                      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Đánh giá</div>
                      <div className="font-display text-2xl font-bold">{formatNumber(item.reviewCount)}</div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-muted/10 p-5">
                    <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <Eye size={14} /> Overview marketplace
                    </div>
                    <div className="grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <div className="text-xs font-medium text-muted-foreground">Loại nội dung</div>
                        <div className="font-semibold">{TYPE_LABEL[item.targetType]}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground">Trạng thái</div>
                        <div className="font-semibold text-green-600">{item.marketStatus || "APPROVED"}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground">Subject ID</div>
                        <div className="font-semibold">{item.subjectId ?? "Chưa gắn"}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground">Clone source ID</div>
                        <div className="font-semibold">{item.clonedFromId ?? item.targetId}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => onClone(item)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-95"
                    >
                      <Download size={15} /> Clone về workspace
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("report")}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-muted-foreground transition-all hover:bg-muted hover:text-destructive"
                    >
                      <Flag size={15} /> Báo cáo
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "reviews" && (
                <div className="space-y-5">
                  <div className="surface-card rounded-xl p-4">
                    <div className="mb-3 flex justify-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} type="button" onClick={() => setReviewRating(star)} className="p-1 transition-transform hover:scale-110">
                          <Star size={24} className={star <= reviewRating ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30"} />
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={reviewText}
                        onChange={(event) => setReviewText(event.target.value)}
                        placeholder="Viết đánh giá cho nội dung này..."
                        className="h-11 flex-1 rounded-xl border border-border/50 bg-background px-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        onKeyDown={(event) => event.key === "Enter" && submitReview()}
                      />
                      <button
                        onClick={submitReview}
                        disabled={isSubmitting || !reviewText.trim()}
                        className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
                        aria-label="Đăng đánh giá"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>

                  {isLoadingReviews ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">Đang tải đánh giá...</div>
                  ) : reviews.length === 0 ? (
                    <div className="rounded-xl border border-border/50 bg-muted/20 py-10 text-center text-sm text-muted-foreground">
                      Chưa có đánh giá nào.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reviews.map((review) => (
                        <div key={review.id} className="surface-card rounded-xl p-4">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold">{review.reviewerName || review.authorName || "Người dùng"}</div>
                              <div className="text-[11px] text-muted-foreground">{new Date(review.createdAt).toLocaleDateString("vi-VN")}</div>
                            </div>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} size={12} className={star <= review.rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30"} />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm leading-relaxed text-foreground/80">{review.content}</p>
                          <div className="mt-3 flex justify-end border-t border-border/20 pt-2">
                            <button
                              type="button"
                              onClick={() => deleteReview(review.id)}
                              disabled={isSubmitting}
                              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-destructive disabled:opacity-40"
                            >
                              <Trash2 size={12} /> Xóa đánh giá của tôi
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "report" && (
                <div className="space-y-4 rounded-xl border border-destructive/20 bg-destructive/5 p-5">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertTriangle size={22} />
                    <h3 className="font-display text-lg font-bold">Báo cáo nội dung</h3>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold">Lý do</label>
                    <select
                      value={reportReason}
                      onChange={(event) => setReportReason(event.target.value)}
                      className="h-11 w-full rounded-xl border border-border/50 bg-background px-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      {REPORT_REASONS.map((reason) => (
                        <option key={reason.value} value={reason.value}>
                          {reason.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold">Chi tiết báo cáo</label>
                    <textarea
                      value={reportDetails}
                      onChange={(event) => setReportDetails(event.target.value)}
                      placeholder="Mô tả vấn đề để kiểm duyệt viên xử lý..."
                      className="h-28 w-full resize-none rounded-xl border border-border/50 bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setActiveTab("overview")} className="h-10 rounded-xl border border-border px-4 text-sm font-semibold hover:bg-muted">
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={submitReport}
                      disabled={isSubmitting || !reportDetails.trim()}
                      className="h-10 rounded-xl bg-destructive px-4 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                    >
                      Gửi báo cáo
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
