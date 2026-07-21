import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, BookOpen, CheckCircle2, Loader2, Send, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { SubjectDTO } from "../../services/academicService";
import CustomSelect from "./CustomSelect";

export interface MarketplacePublishValues {
  title: string;
  subjectId: number;
  description?: string;
  examType?: string;
  reviewNote: string;
}

export interface MarketplacePublishTarget {
  id: number;
  title: string;
  subjectId?: number | null;
  description?: string | null;
  examType?: string | null;
  itemCount: number;
  isResubmission?: boolean;
}

interface MarketplacePublishModalProps {
  isOpen: boolean;
  kind: "QUIZ" | "FLASHCARD_DECK";
  target: MarketplacePublishTarget | null;
  subjects: SubjectDTO[];
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: MarketplacePublishValues) => void | Promise<void>;
}

const labelClass = "mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground";
const inputClass = "h-11 w-full rounded-xl border border-border bg-muted/40 px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 hover:bg-muted/60 focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/10";

export default function MarketplacePublishModal({
  isOpen,
  kind,
  target,
  subjects,
  isSubmitting = false,
  onClose,
  onSubmit,
}: MarketplacePublishModalProps) {
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [description, setDescription] = useState("");
  const [examType, setExamType] = useState("PRACTICE");
  const [reviewNote, setReviewNote] = useState("");
  const [error, setError] = useState("");

  const isQuiz = kind === "QUIZ";
  const contentLabel = isQuiz ? "Quiz Bank" : "bộ Flashcard";
  const countLabel = isQuiz ? "câu hỏi" : "thẻ";

  useEffect(() => {
    if (!isOpen || !target) return;
    setTitle(target.title || "");
    setSubjectId(target.subjectId ? String(target.subjectId) : "");
    setDescription(target.description || "");
    setExamType(target.examType || "PRACTICE");
    setReviewNote("");
    setError("");
  }, [
    isOpen,
    target?.id,
    target?.title,
    target?.subjectId,
    target?.description,
    target?.examType,
  ]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose]);

  const missingFields = useMemo(() => {
    const fields: string[] = [];
    if (!title.trim()) fields.push("tên nội dung");
    if (!subjectId) fields.push("môn học");
    if (isQuiz && !description.trim()) fields.push("mô tả");
    if (isQuiz && !examType) fields.push("loại bài");
    if (!reviewNote.trim()) fields.push("lời nhắn kiểm duyệt");
    return fields;
  }, [description, examType, isQuiz, reviewNote, subjectId, title]);

  if (!isOpen || !target) return null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (target.itemCount <= 0) {
      setError(`${contentLabel} cần có ít nhất một ${countLabel} trước khi gửi duyệt.`);
      return;
    }
    if (missingFields.length > 0) {
      setError(`Vui lòng điền đầy đủ: ${missingFields.join(", ")}.`);
      return;
    }

    setError("");
    void onSubmit({
      title: title.trim(),
      subjectId: Number(subjectId),
      description: isQuiz ? description.trim() : undefined,
      examType: isQuiz ? examType : undefined,
      reviewNote: reviewNote.trim(),
    });
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
        <motion.button
          type="button"
          aria-label="Đóng hộp thoại"
          className="absolute inset-0 cursor-default bg-slate-950/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !isSubmitting && onClose()}
        />

        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="marketplace-publish-title"
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="surface-card relative flex max-h-[min(90vh,780px)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-border shadow-2xl"
        >
          <div className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-5 sm:px-6">
            <div className="flex min-w-0 items-start gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Send size={20} />
              </div>
              <div className="min-w-0">
                <h2 id="marketplace-publish-title" className="font-display text-xl font-bold text-foreground">
                  {target.isResubmission ? "Gửi kiểm duyệt lại" : "Đăng lên cộng đồng"}
                </h2>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  Kiểm tra thông tin và gửi lời nhắn để kiểm duyệt viên hiểu rõ nội dung.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="grid size-11 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              aria-label="Đóng"
            >
              <X size={19} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-muted/30 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <BookOpen size={18} className="shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">Nội dung gửi duyệt</p>
                    <p className="truncate text-sm font-semibold text-foreground">{target.title}</p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {target.itemCount} {countLabel}
                </span>
              </div>

              {target.itemCount <= 0 && (
                <div className="flex gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
                  <AlertCircle size={17} className="mt-0.5 shrink-0" />
                  <span>{contentLabel} cần có ít nhất một {countLabel} trước khi gửi duyệt.</span>
                </div>
              )}

              <div>
                <label htmlFor="publish-title" className={labelClass}>Tên {contentLabel} <span className="text-destructive">*</span></label>
                <input
                  id="publish-title"
                  value={title}
                  maxLength={255}
                  onChange={(event) => setTitle(event.target.value)}
                  className={inputClass}
                  placeholder={`Nhập tên ${contentLabel}`}
                />
                <p className="mt-1.5 text-right text-[11px] text-muted-foreground">{title.length}/255</p>
              </div>

              <div>
                <span className={labelClass}>Môn học <span className="text-destructive">*</span></span>
                <CustomSelect
                  value={subjectId}
                  onChange={setSubjectId}
                  searchable
                  searchPlaceholder="Tìm môn học..."
                  emptyText="Không tìm thấy môn học"
                  placeholder="Chọn môn học"
                  data={subjects.map((subject) => ({
                    label: `${subject.code} — ${subject.name}`,
                    value: String(subject.id),
                  }))}
                />
              </div>

              {isQuiz && (
                <>
                  <div>
                    <label htmlFor="publish-description" className={labelClass}>Mô tả <span className="text-destructive">*</span></label>
                    <textarea
                      id="publish-description"
                      value={description}
                      maxLength={2000}
                      rows={3}
                      onChange={(event) => setDescription(event.target.value)}
                      className="w-full resize-none rounded-xl border border-border bg-muted/40 px-3.5 py-3 text-sm leading-5 text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 hover:bg-muted/60 focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/10"
                      placeholder="Mô tả nội dung, phạm vi kiến thức và đối tượng phù hợp..."
                    />
                  </div>

                  <div>
                    <span className={labelClass}>Loại bài <span className="text-destructive">*</span></span>
                    <CustomSelect
                      value={examType}
                      onChange={setExamType}
                      data={[
                        { label: "Luyện tập", value: "PRACTICE" },
                        { label: "Quiz", value: "QUIZ" },
                        { label: "Giữa kỳ", value: "MIDTERM" },
                        { label: "Cuối kỳ", value: "FINAL" },
                      ]}
                    />
                  </div>
                </>
              )}

              <div>
                <label htmlFor="publish-review-note" className={labelClass}>Lời nhắn cho kiểm duyệt viên <span className="text-destructive">*</span></label>
                <textarea
                  id="publish-review-note"
                  autoFocus
                  value={reviewNote}
                  maxLength={1000}
                  rows={4}
                  onChange={(event) => setReviewNote(event.target.value)}
                  className="w-full resize-none rounded-xl border border-border bg-muted/40 px-3.5 py-3 text-sm leading-5 text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 hover:bg-muted/60 focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/10"
                  placeholder="Ví dụ: Nội dung dùng để ôn chương 3, đã kiểm tra đáp án và thuật ngữ chuyên ngành..."
                />
                <div className="mt-1.5 flex items-start justify-between gap-3 text-[11px] text-muted-foreground">
                  <span>Lời nhắn này chỉ phục vụ quá trình kiểm duyệt.</span>
                  <span className="shrink-0">{reviewNote.length}/1000</span>
                </div>
              </div>

              {error && (
                <div role="alert" className="flex gap-2 rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle size={17} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-border/70 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="min-h-11 rounded-xl bg-muted px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted/80 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting || target.itemCount <= 0}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={17} className="animate-spin" /> : <CheckCircle2 size={17} />}
                {isSubmitting ? "Đang gửi..." : target.isResubmission ? "Gửi duyệt lại" : "Gửi kiểm duyệt"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body,
  );
}
