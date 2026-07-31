import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Pencil, Plus, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { SemesterDTO, SubjectDTO } from "../../services/academicService";
import { NotebookDTO } from "../../services/notebookService";
import { QuizDTO, QuizPayload } from "../../services/quizService";
import CustomSelect from "../ui/CustomSelect";

export type QuizEditorMode = "create" | "edit" | "rename";

interface QuizEditorModalProps {
  isOpen: boolean;
  mode: QuizEditorMode;
  quiz?: QuizDTO | null;
  subjects: SubjectDTO[];
  semesters: SemesterDTO[];
  notebooks: NotebookDTO[];
  isLoadingOptions?: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: QuizPayload) => void | Promise<void>;
}

interface QuizFormState {
  title: string;
  description: string;
  subjectId: string;
  academicTermId: string;
  notebookId: string;
  examType: string;
}

const emptyForm: QuizFormState = {
  title: "",
  description: "",
  subjectId: "",
  academicTermId: "",
  notebookId: "",
  examType: "PRACTICE",
};

function toFormState(quiz?: QuizDTO | null): QuizFormState {
  if (!quiz) return emptyForm;

  return {
    title: quiz.title ?? "",
    description: quiz.description ?? "",
    subjectId: quiz.subjectId ? String(quiz.subjectId) : "",
    academicTermId: quiz.academicTermId ? String(quiz.academicTermId) : "",
    notebookId: quiz.notebookId ? String(quiz.notebookId) : "",
    examType: quiz.examType || "PRACTICE",
  };
}

function optionalNumber(value: string) {
  return value ? Number(value) : null;
}

const fieldLabelClass = "mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground";
const inputClass = "h-11 w-full rounded-xl border border-border bg-muted/40 px-3.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/70 hover:bg-muted/60 focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/10";

export default function QuizEditorModal({
  isOpen,
  mode,
  quiz,
  subjects,
  semesters,
  notebooks,
  isLoadingOptions = false,
  isSubmitting = false,
  onClose,
  onSubmit,
}: QuizEditorModalProps) {
  const [form, setForm] = useState<QuizFormState>(emptyForm);

  useEffect(() => {
    if (isOpen) setForm(toFormState(quiz));
  }, [isOpen, quiz, mode]);

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

  const isRename = mode === "rename";
  const title = mode === "create" ? "Tạo Quiz Bank" : mode === "rename" ? "Đổi tên Quiz Bank" : "Chỉnh sửa Quiz Bank";
  const description = mode === "create"
    ? "Tạo một ngân hàng câu hỏi mới để luyện tập và theo dõi kết quả."
    : mode === "rename"
      ? "Tên mới sẽ được cập nhật, các thông tin còn lại được giữ nguyên."
      : "Cập nhật thông tin phân loại mà không ảnh hưởng câu hỏi và lịch sử làm bài.";

  const Icon = mode === "create" ? Plus : Pencil;
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = form.title.trim();
    if (!trimmedTitle || isSubmitting) return;

    void onSubmit({
      title: trimmedTitle,
      description: form.description.trim() || null,
      notebookId: optionalNumber(form.notebookId),
      subjectId: optionalNumber(form.subjectId),
      academicTermId: optionalNumber(form.academicTermId),
      examType: form.examType || "PRACTICE",
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
          <motion.button
            type="button"
            aria-label="Đóng hộp thoại"
            className="absolute inset-0 cursor-default bg-slate-950/45 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isSubmitting && onClose()}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="quiz-editor-title"
            initial={{ opacity: 0, scale: 0.97, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            className="surface-card relative flex max-h-[min(88vh,760px)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-border shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-5 sm:px-6">
              <div className="flex min-w-0 items-start gap-3">
                <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Icon size={20} strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <h2 id="quiz-editor-title" className="font-display text-xl font-bold text-foreground">{title}</h2>
                  <p className="mt-1 max-w-lg text-sm leading-5 text-muted-foreground">{description}</p>
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
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
                <div className="space-y-5">
                  <div>
                    <label htmlFor="quiz-title" className={fieldLabelClass}>Tên Quiz Bank <span className="text-destructive">*</span></label>
                    <input
                      id="quiz-title"
                      autoFocus
                      maxLength={255}
                      value={form.title}
                      onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                      placeholder="Ví dụ: Ôn tập Spring Boot"
                      className={inputClass}
                    />
                    <div className="mt-1.5 text-right text-[11px] text-muted-foreground">{form.title.length}/255</div>
                  </div>

                  {!isRename && (
                    <>
                      <div>
                        <label htmlFor="quiz-description" className={fieldLabelClass}>Mô tả</label>
                        <textarea
                          id="quiz-description"
                          rows={3}
                          value={form.description}
                          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                          placeholder="Nội dung chính hoặc mục tiêu của Quiz Bank..."
                          className="w-full resize-none rounded-xl border border-border bg-muted/40 px-3.5 py-3 text-sm leading-5 text-foreground outline-none transition-all placeholder:text-muted-foreground/70 hover:bg-muted/60 focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/10"
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <span className={fieldLabelClass}>Môn học</span>
                          <CustomSelect
                            value={form.subjectId}
                            onChange={(value) => setForm((current) => ({ ...current, subjectId: value }))}
                            placeholder="Không gắn môn học"
                            data={[
                              { label: "Không gắn môn học", value: "" },
                              ...subjects.map((subject) => ({ label: `${subject.code} — ${subject.name}`, value: String(subject.id) })),
                            ]}
                          />
                        </div>
                        <div>
                          <span className={fieldLabelClass}>Học kỳ</span>
                          <CustomSelect
                            value={form.academicTermId}
                            onChange={(value) => setForm((current) => ({ ...current, academicTermId: value }))}
                            placeholder="Không gắn học kỳ"
                            data={[
                              { label: "Không gắn học kỳ", value: "" },
                              ...semesters.map((semester) => ({ label: `${semester.code} — ${semester.name}`, value: String(semester.id) })),
                            ]}
                          />
                        </div>
                      </div>

                      <div>
                        <span className={fieldLabelClass}>Notebook nguồn</span>
                        <CustomSelect
                          value={form.notebookId}
                          onChange={(value) => setForm((current) => ({ ...current, notebookId: value }))}
                          placeholder="Không gắn Notebook"
                          data={[
                            { label: "Không gắn Notebook", value: "" },
                            ...notebooks.map((notebook) => ({
                              label: `${notebook.title}${notebook.subjectCode ? ` · ${notebook.subjectCode}` : ""}`,
                              value: String(notebook.id),
                            })),
                          ]}
                        />
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <BookOpen size={13} /> Chỉ liên kết để phân loại, không thay đổi chức năng lấy câu hỏi từ Notebook.
                        </p>
                      </div>

                      <div className="grid gap-4">
                        <div>
                          <span className={fieldLabelClass}>Loại bài</span>
                          <CustomSelect
                            value={form.examType}
                            onChange={(value) => setForm((current) => ({ ...current, examType: value }))}
                            data={[
                              { label: "Luyện tập", value: "PRACTICE" },
                              { label: "Quiz", value: "QUIZ" },
                              { label: "Giữa kỳ", value: "MIDTERM" },
                              { label: "Cuối kỳ", value: "FINAL" },
                            ]}
                          />
                        </div>
                      </div>

                      {isLoadingOptions && (
                        <p className="text-xs text-muted-foreground">Đang tải danh mục Notebook và học kỳ...</p>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-border/70 bg-card/90 px-5 py-4 backdrop-blur sm:px-6">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="h-11 rounded-xl px-5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!form.title.trim() || isSubmitting}
                  className="inline-flex h-11 min-w-32 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting && <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
                  {isSubmitting ? "Đang lưu..." : mode === "create" ? "Tạo Quiz Bank" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
