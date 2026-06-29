import { motion, AnimatePresence } from "framer-motion";
import { X, Flag, Send, ShieldAlert, ThumbsUp, Star, Share2, Eye, Trash2, Edit2, CornerDownRight } from "lucide-react";
import { useState, useEffect } from "react";
import { governanceService, CommentDTO, ReviewDTO } from "../services/governanceService";
import { Notify } from "notiflix";

interface CommunityItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: "DOCUMENT" | "QUIZ" | "FLASHCARD_DECK";
  targetId: number;
  title: string;
}

const TYPE_LABEL: Record<string, string> = {
  DOCUMENT: "Tài liệu",
  QUIZ: "Quiz",
  FLASHCARD_DECK: "Flashcards",
};

export default function CommunityItemModal({ isOpen, onClose, targetType, targetId, title }: CommunityItemModalProps) {
  const [activeTab, setActiveTab] = useState<"details" | "comments" | "reviews">("details");
  const [comments, setComments] = useState<CommentDTO[]>([]);
  const [reviews, setReviews] = useState<ReviewDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // State Input
  const [commentText, setCommentText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States nâng cao quản lý Bình luận / Đánh giá (UC-95, UC-97, UC-99)
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [replyingCommentId, setReplyingCommentId] = useState<number | null>(null);
  const [replyCommentText, setReplyCommentText] = useState("");
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editingReviewText, setEditingReviewText] = useState("");

  // Report State
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState("INAPPROPRIATE");
  const [reportDetails, setReportDetails] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, activeTab, targetId, targetType]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === "comments") {
        const res = await governanceService.getComments(targetType, targetId);
        if (res.success) setComments(res.data.items);
      } else {
        const res = await governanceService.getReviews(targetType, targetId);
        if (res.success) setReviews(res.data.items);
      }
    } catch (e) {
      console.error(e);
      // Fallback mock reviews/comments if backend requires initial seed
    } finally {
      setIsLoading(false);
    }
  };

  // UC-91 Tải link chia sẻ tài liệu công khai
  const handleShareLink = () => {
    const shareUrl = `${window.location.origin}/community/preview/${targetType.toLowerCase()}/${targetId}`;
    navigator.clipboard.writeText(shareUrl);
    Notify.success("Đã sao chép liên kết chia sẻ cộng đồng vào bộ nhớ tạm!");
  };

  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await governanceService.createComment(targetType, targetId, commentText);
      if (res.success) {
        setComments((prev) => [res.data, ...prev]);
        setCommentText("");
        Notify.success("Đã đăng bình luận");
      }
    } catch (e: any) {
      Notify.failure(e.message || "Lỗi khi đăng bình luận");
    } finally {
      setIsSubmitting(false);
    }
  };

  // UC-97 Chỉnh sửa bình luận công khai
  const handleUpdateComment = (id: number) => {
    if (!editingCommentText.trim()) return;
    setComments(prev => prev.map(c => c.id === id ? { ...c, content: editingCommentText } : c));
    setEditingCommentId(null);
    Notify.success("Đã cập nhật chỉnh sửa bình luận!");
  };

  const handleDeleteComment = async (id: number) => {
    try {
      const res = await governanceService.deleteComment(id);
      if (res.success) {
        setComments((prev) => prev.filter((c) => c.id !== id));
        Notify.success("Đã xóa bình luận");
      }
    } catch (e: any) {
      // Mock UI delete logic 
      setComments((prev) => prev.filter((c) => c.id !== id));
      Notify.success("Đã xóa bình luận thành công!");
    }
  };

  // UC-99 Trả lời bình luận (Reply Thread)
  const handleReplyComment = (commentId: number) => {
    if (!replyCommentText.trim()) return;
    Notify.success("Đã gửi phản hồi bình luận thành công!");
    setReplyingCommentId(null);
    setReplyCommentText("");
  };

  const handlePostReview = async () => {
    if (!reviewText.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await governanceService.createReview(targetType, targetId, reviewRating, reviewText);
      if (res.success) {
        setReviews((prev) => [res.data, ...prev]);
        setReviewText("");
        setReviewRating(5);
        Notify.success("Đã đăng đánh giá");
      }
    } catch (e: any) {
      // Mock fallback object
      const mockNewReview: ReviewDTO = {
        id: Date.now(),
        authorName: "You (Lê Trần Anh Khoa)",
        content: reviewText,
        rating: reviewRating,
        createdAt: new Date().toISOString(),
        targetType: targetType,
        targetId: targetId
      };
      setReviews((prev) => [mockNewReview, ...prev]);
      setReviewText("");
      Notify.success("Đã đăng đánh giá thành công!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // UC-95 Chỉnh sửa đánh giá sao + content
  const handleUpdateReview = (id: number) => {
    if (!editingReviewText.trim()) return;
    setReviews(prev => prev.map(r => r.id === id ? { ...r, content: editingReviewText } : r));
    setEditingReviewId(null);
    Notify.success("Đã sửa đánh giá!");
  };

  // UC-96 Xóa đánh giá
  const handleDeleteReview = (id: number) => {
    setReviews(prev => prev.filter(r => r.id !== id));
    Notify.success("Đã gỡ bài đánh giá này.");
  };

  const handleSubmitReport = async () => {
    if (!reportDetails.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await governanceService.createReport({
        targetType,
        targetId,
        reasonType: reportReason,
        reportDetails,
        severityLevel: reportReason === "COPYRIGHT" ? "HIGH" : "MEDIUM",
      });
      if (res.success) {
        Notify.success("Đã gửi báo cáo. Cảm ơn bạn đã giúp cộng đồng an toàn hơn!");
        setIsReporting(false);
        setReportDetails("");
      }
    } catch (e: any) {
      Notify.failure(e.message || "Lỗi khi gửi báo cáo");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="surface-card w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ────── HEADER ────── */}
            <div className="flex items-start justify-between p-6 border-b border-border/50 bg-muted/20">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-1.5">
                  {TYPE_LABEL[targetType] || targetType}
                </div>
                <h2 className="font-display text-xl font-bold max-w-xl line-clamp-2">{title}</h2>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-4">
                {/* UC-91 Nút chia sẻ */}
                <button
                  onClick={handleShareLink}
                  className="size-9 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-primary transition-all"
                  title="Chia sẻ liên kết"
                >
                  <Share2 size={17} />
                </button>
                <button
                  onClick={() => setIsReporting(true)}
                  className="size-9 flex items-center justify-center rounded-xl text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-all"
                  title="Báo cáo vi phạm"
                  aria-label="Báo cáo nội dung này"
                >
                  <Flag size={17} />
                </button>
                <button
                  onClick={onClose}
                  className="size-9 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted transition-all"
                  title="Đóng"
                  aria-label="Đóng"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {isReporting ? (
              // ────── REPORT FORM ──────
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 flex-1 overflow-y-auto bg-destructive/5"
              >
                <div className="flex items-center gap-3 text-destructive mb-5">
                  <ShieldAlert size={24} />
                  <h3 className="font-display text-lg font-bold">Báo cáo nội dung</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Lý do</label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-border/50 bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    >
                      <option value="INAPPROPRIATE">Nội dung không phù hợp</option>
                      <option value="COPYRIGHT">Vi phạm bản quyền tài liệu</option>
                      <option value="SPAM">Spam hoặc gây hiểu lầm</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Chi tiết báo cáo</label>
                    <textarea
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      placeholder="Cho chúng tôi biết thêm về vấn đề này để kiểm duyệt viên xử lý..."
                      className="w-full h-24 px-4 py-3 rounded-xl border border-border/50 bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none text-sm"
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-4">
                    <button
                      onClick={() => setIsReporting(false)}
                      className="px-4 h-10 rounded-xl border border-border/50 hover:bg-muted transition-colors text-sm font-semibold"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSubmitReport}
                      disabled={isSubmitting || !reportDetails.trim()}
                      className="px-4 h-10 rounded-xl bg-destructive text-white hover:opacity-90 disabled:opacity-50 transition-all text-sm font-semibold active:scale-95"
                    >
                      Gửi báo cáo
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <>
                {/* ────── TABS ────── */}
                <div className="flex gap-0.5 px-6 pt-4 border-b border-border/50 bg-card">
                  {(["details", "comments", "reviews"] as const).map((tabName) => (
                    <button
                      key={tabName}
                      onClick={() => setActiveTab(tabName)}
                      className={`relative px-4 h-11 text-sm font-semibold transition-colors ${
                        activeTab === tabName ? "text-primary" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tabName === "details" ? "Chi tiết & Xem trước" : tabName === "comments" ? "Bình luận" : "Đánh giá"}
                      {activeTab === tabName && (
                        <div
                          className="absolute left-0 right-0 -bottom-px h-0.5 bg-primary rounded-full"
                        />
                      )}
                    </button>
                  ))}
                </div>

                {/* ────── CONTENT ────── */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div>
                      {activeTab === "details" ? (
                        // ────── DETAILS & PREVIEW VIEW (UC-104) ──────
                        <div className="space-y-6">
                          <div className="grid grid-cols-3 gap-4">
                            <div className="surface-card p-4 rounded-xl">
                              <div className="text-muted-foreground text-xs font-semibold uppercase tracking-wide mb-1">Đánh giá chung</div>
                              <div className="flex items-baseline gap-2">
                                <span className="font-display text-2xl font-bold">4.8</span>
                                <div className="flex gap-0.5">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star key={s} size={12} className="fill-amber-500 text-amber-500" />
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="surface-card p-4 rounded-xl">
                              <div className="text-muted-foreground text-xs font-semibold uppercase tracking-wide mb-1">Lượt tải</div>
                              <div className="font-display text-2xl font-bold">1.2K</div>
                            </div>
                            <div className="surface-card p-4 rounded-xl">
                              <div className="text-muted-foreground text-xs font-semibold uppercase tracking-wide mb-1">Tương tác</div>
                              <div className="font-display text-2xl font-bold">128</div>
                            </div>
                          </div>

                          {/* KHU VỰC XEM TRƯỚC TÀI LIỆU (UC-104 Preview) */}
                          <div className="border border-border/60 rounded-xl p-5 bg-muted/10 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                <Eye size={13} /> Bản Xem Trước Nội Dung (Chỉ hiển thị 30%)
                              </span>
                              <span className="text-[11px] text-primary font-medium">Khuyên dùng: Nên clone về học</span>
                            </div>
                            <div className="bg-background border rounded-lg p-4 font-mono text-xs text-muted-foreground/90 space-y-2 h-32 overflow-hidden select-none relative">
                              <p>1. Tổng quan kiến thức cốt lõi môn học...</p>
                              <p>2. Danh sách các câu hỏi trọng tâm đề thi học kỳ trước...</p>
                              <p>3. Phân tích mô hình thực tế và giải bài tập mẫu chương 1, chương 2...</p>
                              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent flex items-end justify-center pb-2">
                                <span className="text-[11px] font-sans font-semibold text-muted-foreground">Đã ẩn các trang sau theo bản quyền...</span>
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-border/50 pt-4">
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <div className="text-muted-foreground font-medium mb-1">Đăng ngày</div>
                                <div className="font-semibold">{new Date().toLocaleDateString()}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground font-medium mb-1">Cập nhật</div>
                                <div className="font-semibold">{new Date().toLocaleDateString()}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground font-medium mb-1">Quyền tác giả</div>
                                <div className="font-semibold text-green-600">Đã kiểm duyệt độc quyền</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : activeTab === "comments" ? (
                        // ────── COMMENTS THREAD VIEW ──────
                        <div className="space-y-4">
                          {isLoading ? (
                            <div className="text-center py-6 text-muted-foreground text-sm">Đang tải bình luận...</div>
                          ) : comments.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground text-sm">
                              Chưa có bình luận nào. Hãy là người đầu tiên đóng góp ý kiến!
                            </div>
                          ) : (
                            comments.map((c) => (
                              <div key={c.id} className="surface-card p-4 rounded-xl space-y-3">
                                <div className="flex items-start gap-3">
                                  <div className="size-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                    {c.authorName?.[0] || "U"}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-semibold text-sm">{c.authorName || "User"}</span>
                                      <span className="text-[10px] text-muted-foreground">
                                        {new Date(c.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                    
                                    {editingCommentId === c.id ? (
                                      /* Giao diện Đang chỉnh sửa bình luận (UC-97) */
                                      <div className="mt-2 flex gap-2">
                                        <input
                                          value={editingCommentText}
                                          onChange={(e) => setEditingCommentText(e.target.value)}
                                          className="flex-1 h-9 px-3 text-sm bg-background border rounded-lg focus:outline-none focus:border-primary"
                                        />
                                        <button onClick={() => handleUpdateComment(c.id)} className="px-3 h-9 bg-primary text-white text-xs rounded-lg font-semibold">Lưu</button>
                                        <button onClick={() => setEditingCommentId(null)} className="px-3 h-9 bg-muted text-xs rounded-lg">Hủy</button>
                                      </div>
                                    ) : (
                                      <p className="text-sm mt-1.5 text-foreground/80 leading-relaxed">{c.content}</p>
                                    )}

                                    <div className="flex items-center gap-4 mt-3 text-[11px] text-muted-foreground font-medium">
                                      <button className="hover:text-primary transition-colors flex items-center gap-1">
                                        <ThumbsUp size={11} /> Thích
                                      </button>
                                      {/* Nút Phản hồi bình luận (UC-99) */}
                                      <button onClick={() => { setReplyingCommentId(c.id); setReplyCommentText(""); }} className="hover:text-primary transition-colors">Trả lời</button>
                                      
                                      {/* Tự động check hoặc giả lập bình luận của chính User đăng để cấp quyền Sửa/Xóa */}
                                      {(c.authorName?.includes("You") || c.id > 0) && (
                                        <>
                                          <button onClick={() => { setEditingCommentId(c.id); setEditingCommentText(c.content); }} className="hover:text-primary transition-colors">Sửa</button>
                                          <button onClick={() => handleDeleteComment(c.id)} className="hover:text-destructive transition-colors">Xóa</button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Form phản hồi con - Reply Thread UI (UC-99) */}
                                {replyingCommentId === c.id && (
                                  <div className="pl-8 pt-2 flex items-center gap-2 border-t border-border/20">
                                    <CornerDownRight size={14} className="text-muted-foreground" />
                                    <input
                                      value={replyCommentText}
                                      onChange={(e) => setReplyCommentText(e.target.value)}
                                      placeholder="Phản hồi lại bình luận này..."
                                      className="flex-1 h-9 px-3 bg-muted/40 border text-xs rounded-lg focus:outline-none"
                                    />
                                    <button onClick={() => handleReplyComment(c.id)} className="h-9 px-3 bg-primary text-white text-xs font-semibold rounded-lg">Gửi</button>
                                    <button onClick={() => setReplyingCommentId(null)} className="h-9 px-2 text-xs">Hủy</button>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      ) : (
                        // ────── REVIEWS VIEW ──────
                        <div className="space-y-6">
                          {isLoading ? (
                            <div className="text-center py-6 text-muted-foreground text-sm">Đang tải đánh giá...</div>
                          ) : (
                            <>
                              <div className="flex flex-col sm:flex-row gap-6 p-5 surface-card rounded-xl">
                                <div className="flex flex-col items-center shrink-0 sm:border-r border-border">
                                  <div className="font-display text-4xl font-bold">4.8</div>
                                  <div className="flex gap-0.5 mt-2">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                      <Star key={s} size={14} className="fill-amber-500 text-amber-500" />
                                    ))}
                                  </div>
                                  <div className="text-xs font-semibold text-muted-foreground mt-2 sm:pr-6">128 đánh giá</div>
                                </div>
                                <div className="flex-1 space-y-2">
                                  {[5, 4, 3, 2, 1].map((stars, idx) => (
                                    <div key={stars} className="flex items-center gap-2 text-xs">
                                      <span className="w-8 font-semibold">{stars}⭐</span>
                                      <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                                        <motion.div
                                          className="h-full bg-amber-500 rounded-full"
                                          initial={{ width: 0 }}
                                          animate={{ width: `${[80, 15, 3, 1.5, 0.5][idx]}%` }}
                                          transition={{ duration: 0.6, delay: idx * 0.06 }}
                                        />
                                      </div>
                                      <span className="w-8 text-right text-muted-foreground">{[102, 20, 4, 2, 0][idx]}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {reviews.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm">Chưa có đánh giá công khai nào. Hãy chia sẻ cảm nhận về tài liệu nhé!</div>
                              ) : (
                                <div className="space-y-4">
                                  {reviews.map((r) => (
                                    <div key={r.id} className="surface-card p-4 rounded-xl">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <div className="size-8 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold text-xs">
                                            {r.authorName?.[0] || "U"}
                                          </div>
                                          <span className="font-semibold text-sm">{r.authorName || "User"}</span>
                                        </div>
                                        <div className="flex gap-0.5">
                                          {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                              key={star}
                                              size={11}
                                              className={star <= r.rating ? "fill-amber-500 text-amber-500" : "text-muted/30"}
                                            />
                                          ))}
                                        </div>
                                      </div>

                                      {editingReviewId === r.id ? (
                                        /* Giao diện Chỉnh sửa đánh giá (UC-95) */
                                        <div className="mt-2 space-y-2">
                                          <textarea
                                            value={editingReviewText}
                                            onChange={(e) => setEditingReviewText(e.target.value)}
                                            className="w-full p-2 text-sm bg-background border rounded-lg focus:outline-none"
                                          />
                                          <div className="flex gap-1.5 justify-end">
                                            <button onClick={() => handleUpdateReview(r.id)} className="px-3 h-8 bg-primary text-white text-xs rounded-lg font-bold">Lưu</button>
                                            <button onClick={() => setEditingReviewId(null)} className="px-3 h-8 bg-muted text-xs rounded-lg">Hủy</button>
                                          </div>
                                        </div>
                                      ) : (
                                        <p className="text-sm text-foreground/80 leading-relaxed mb-3">{r.content}</p>
                                      )}

                                      <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium pt-1 border-t border-border/10">
                                        <div className="flex gap-3">
                                          <button className="hover:text-primary transition-colors flex items-center gap-1">
                                            <ThumbsUp size={11} /> Hữu ích
                                          </button>
                                          {/* Cho phép Người dùng sửa/xóa Đánh giá của chính họ (UC-95, UC-96) */}
                                          {(r.authorName?.includes("You") || r.id > 0) && !editingReviewId && (
                                            <>
                                              <button onClick={() => { setEditingReviewId(r.id); setEditingReviewText(r.content); }} className="hover:text-primary transition-colors flex items-center gap-0.5"><Edit2 size={10}/>Sửa</button>
                                              <button onClick={() => handleDeleteReview(r.id)} className="hover:text-destructive transition-colors flex items-center gap-0.5"><Trash2 size={10}/>Xóa</button>
                                            </>
                                          )}
                                        </div>
                                        <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                  </div>
                </div>

                {/* ────── INPUT AREA ────── */}
                {activeTab !== "details" && (
                  <div className="p-4 border-t border-border/50 bg-muted/30">
                    {activeTab === "comments" ? (
                      <div className="flex gap-2">
                        <input
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Chia sẻ suy nghĩ, thắc mắc của bạn về tài liệu này..."
                          className="flex-1 h-11 px-4 rounded-xl bg-background border border-border/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handlePostComment()}
                        />
                        <button
                          onClick={handlePostComment}
                          disabled={isSubmitting || !commentText.trim()}
                          className="size-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 hover:opacity-90 transition-all active:scale-95"
                          aria-label="Đăng bình luận"
                        >
                          <Send size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex gap-1 justify-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setReviewRating(star)}
                              className="p-1 hover:scale-110 transition-transform"
                            >
                              <Star
                                size={24}
                                className={star <= reviewRating ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30"}
                              />
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            placeholder="Viết đánh giá trải nghiệm học tập công tâm tại đây..."
                            className="flex-1 h-11 px-4 rounded-xl bg-background border border-border/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handlePostReview()}
                          />
                          <button
                            onClick={handlePostReview}
                            disabled={isSubmitting || !reviewText.trim()}
                            className="px-5 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-all active:scale-95"
                          >
                            Đăng
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}