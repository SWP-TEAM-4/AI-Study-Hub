import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare, Star, Flag, Send, Trash2, ShieldAlert } from "lucide-react";
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

export default function CommunityItemModal({ isOpen, onClose, targetType, targetId, title }: CommunityItemModalProps) {
  const [activeTab, setActiveTab] = useState<"comments" | "reviews">("comments");
  const [comments, setComments] = useState<CommentDTO[]>([]);
  const [reviews, setReviews] = useState<ReviewDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Comment state
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Review state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  // Report state
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
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await governanceService.createComment(targetType, targetId, commentText);
      if (res.success) {
        setComments(prev => [res.data, ...prev]);
        setCommentText("");
        Notify.success("Đã đăng bình luận");
      }
    } catch (e: any) {
      Notify.failure(e.message || "Lỗi khi đăng bình luận");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostReview = async () => {
    if (!reviewText.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await governanceService.createReview(targetType, targetId, reviewRating, reviewText);
      if (res.success) {
        setReviews(prev => [res.data, ...prev]);
        setReviewText("");
        setReviewRating(5);
        Notify.success("Đã đăng đánh giá");
      }
    } catch (e: any) {
      Notify.failure(e.message || "Lỗi khi đăng đánh giá");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (id: number) => {
    try {
      const res = await governanceService.deleteComment(id);
      if (res.success) {
        setComments(prev => prev.filter(c => c.id !== id));
        Notify.success("Đã xóa bình luận");
      }
    } catch (e: any) {
      Notify.failure("Không thể xóa bình luận");
    }
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
        severityLevel: reportReason === "COPYRIGHT" ? "HIGH" : "MEDIUM"
      });
      if (res.success) {
        Notify.success("Báo cáo vi phạm đã được gửi tới Admin.");
        setIsReporting(false);
        setReportDetails("");
      }
    } catch (e: any) {
      Notify.failure(e.message || "Lỗi khi gửi báo cáo");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="surface-card w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
            <div>
              <div className="text-xs uppercase tracking-wider text-primary font-bold mb-1">{targetType} #{targetId}</div>
              <h2 className="font-display text-xl font-bold">{title}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsReporting(true)} className="size-9 flex items-center justify-center rounded-xl text-destructive hover:bg-destructive/15 transition-colors" title="Báo cáo vi phạm">
                <Flag size={18} />
              </button>
              <button onClick={onClose} className="size-9 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>

          {isReporting ? (
            <div className="p-6 flex-1 overflow-y-auto bg-destructive/5">
              <div className="flex items-center gap-3 text-destructive mb-4">
                <ShieldAlert size={24} />
                <h3 className="font-display font-bold text-lg">Báo cáo vi phạm nội dung</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">Chúng tôi rất nghiêm túc trong việc bảo vệ cộng đồng. Hãy cho chúng tôi biết vấn đề bạn gặp phải với nội dung này.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Lý do báo cáo</label>
                  <select 
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-card border border-border outline-none focus:border-primary text-sm"
                  >
                    <option value="INAPPROPRIATE">Nội dung không phù hợp / phản cảm</option>
                    <option value="COPYRIGHT">Vi phạm bản quyền</option>
                    <option value="SPAM">Spam / Quảng cáo rác</option>
                    <option value="WRONG_INFO">Thông tin sai lệch nghiêm trọng</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Chi tiết (Bắt buộc)</label>
                  <textarea 
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Mô tả rõ vấn đề để Admin có thể xử lý nhanh chóng..."
                    className="w-full h-32 p-3 rounded-xl bg-card border border-border outline-none focus:border-primary text-sm resize-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-destructive/20">
                  <button onClick={() => setIsReporting(false)} className="px-4 h-10 rounded-xl text-sm font-medium hover:bg-muted transition-colors">
                    Hủy bỏ
                  </button>
                  <button 
                    onClick={handleSubmitReport}
                    disabled={isSubmitting || !reportDetails.trim()}
                    className="px-6 h-10 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting ? "Đang gửi..." : "Gửi Báo cáo"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex px-5 border-b border-border">
                <button
                  onClick={() => setActiveTab("comments")}
                  className={`flex items-center gap-2 py-4 px-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "comments" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                >
                  <MessageSquare size={16} /> Bình luận
                </button>
                <button
                  onClick={() => setActiveTab("reviews")}
                  className={`flex items-center gap-2 py-4 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "reviews" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                >
                  <Star size={16} /> Đánh giá
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-muted/10 min-h-[300px]">
                {isLoading ? (
                  <div className="py-12 flex justify-center"><div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
                ) : activeTab === "comments" ? (
                  comments.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground text-sm">Chưa có bình luận nào. Hãy là người đầu tiên!</div>
                  ) : (
                    comments.map(c => (
                      <div key={c.id} className="flex gap-3 bg-card p-3 rounded-xl border border-border/50 shadow-sm">
                        <div className="size-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {c.authorName?.[0] || "U"}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm">{c.authorName || "User"}</span>
                            <span className="text-[10px] text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm mt-1 text-foreground/90">{c.content}</p>
                        </div>
                        {c.authorName?.includes("Bạn") && (
                          <button onClick={() => handleDeleteComment(c.id)} className="text-muted-foreground hover:text-destructive self-start p-1 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))
                  )
                ) : (
                  reviews.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground text-sm">Chưa có đánh giá nào. Hãy để lại nhận xét của bạn!</div>
                  ) : (
                    reviews.map(r => (
                      <div key={r.id} className="bg-card p-4 rounded-xl border border-border/50 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="size-6 rounded-full bg-warning/20 text-warning flex items-center justify-center font-bold text-[10px]">
                              {r.authorName?.[0] || "U"}
                            </div>
                            <span className="font-semibold text-sm">{r.authorName || "User"}</span>
                          </div>
                          <div className="flex items-center gap-1 text-warning">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star key={star} size={12} className={star <= r.rating ? "fill-warning" : "text-muted"} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-foreground/90">{r.content}</p>
                        <div className="text-[10px] text-muted-foreground mt-2 text-right">{new Date(r.createdAt).toLocaleDateString()}</div>
                      </div>
                    ))
                  )
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-border bg-card">
                {activeTab === "comments" ? (
                  <div className="flex gap-2">
                    <input 
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Viết bình luận..."
                      className="flex-1 h-10 px-4 rounded-full bg-muted/50 border border-transparent focus:bg-card focus:border-primary outline-none text-sm transition-colors"
                      onKeyDown={(e) => e.key === "Enter" && handlePostComment()}
                    />
                    <button 
                      onClick={handlePostComment}
                      disabled={isSubmitting || !commentText.trim()}
                      className="size-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 hover:bg-primary/90 transition-colors"
                    >
                      <Send size={16} className="-ml-0.5" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 justify-center">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} onClick={() => setReviewRating(star)} className="p-1 hover:scale-110 transition-transform">
                          <Star size={24} className={star <= reviewRating ? "fill-warning text-warning" : "text-muted-foreground/30"} />
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Đánh giá nội dung này..."
                        className="flex-1 h-10 px-4 rounded-full bg-muted/50 border border-transparent focus:bg-card focus:border-primary outline-none text-sm transition-colors"
                        onKeyDown={(e) => e.key === "Enter" && handlePostReview()}
                      />
                      <button 
                        onClick={handlePostReview}
                        disabled={isSubmitting || !reviewText.trim()}
                        className="px-4 h-10 rounded-full bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
                      >
                        Đánh giá
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
