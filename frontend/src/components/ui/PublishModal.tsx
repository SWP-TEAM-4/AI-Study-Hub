import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, Share2, Sparkles, BookOpen, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Notify } from "notiflix";
import { documentService, type DocumentDTO } from "../../services/documentService";
import type { SubjectDTO } from "../../services/academicService";

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentDTO | null;
  subjects: SubjectDTO[];
  onPublished?: () => void;
}

export default function PublishModal({ isOpen, onClose, document: targetDocument, subjects, onPublished }: PublishModalProps) {
  const { t } = useTranslation();
  const [subjectId, setSubjectId] = useState("");
  const [description, setDescription] = useState("");
  const [publishNote, setPublishNote] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSubjectId(targetDocument?.subjectId ? String(targetDocument.subjectId) : "");
    setDescription(targetDocument?.description || "");
    setPublishNote("");
  }, [targetDocument?.id, targetDocument?.subjectId, targetDocument?.description, isOpen]);

  const selectedSubject = useMemo(
    () => subjects.find((subject) => String(subject.id) === subjectId),
    [subjectId, subjects],
  );

  if (!isOpen) return null;

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDocument?.id) {
      Notify.failure("Không tìm thấy tài liệu cần chia sẻ.");
      return;
    }
    if (targetDocument.clonedFromId) {
      Notify.failure("Tài liệu clone từ cộng đồng không thể chia sẻ ngược lại Marketplace.");
      return;
    }
    if (targetDocument.processingStatus !== "SUCCESS") {
      Notify.failure("Tài liệu cần xử lý AI chunks thành công trước khi chia sẻ cộng đồng.");
      return;
    }
    if (!subjectId) {
      Notify.failure("Vui lòng chọn môn học cho tài liệu trước khi chia sẻ.");
      return;
    }
    if (!description.trim()) {
      Notify.failure(t("components.publishModal.errorEmpty", "Vui lòng nhập mô tả ngắn cho tài liệu"));
      return;
    }

    setIsPublishing(true);
    try {
      const normalizedDescription = description.trim();
      if (targetDocument.subjectId !== Number(subjectId) || (targetDocument.description || "") !== normalizedDescription) {
        await documentService.updateDocument(targetDocument.id, {
          title: targetDocument.title,
          subjectId: Number(subjectId),
          description: normalizedDescription,
        });
      }
      const note = publishNote.trim()
        ? publishNote.trim()
        : `${selectedSubject?.code || `Subject #${subjectId}`}: ${normalizedDescription}`;
      await documentService.submitToMarketplace(targetDocument.id, note);
      Notify.success(t("components.publishModal.success", "Tài liệu đã được gửi lên Marketplace để chờ duyệt!"));
      onPublished?.();
      onClose();
    } catch (err: any) {
      Notify.failure(err?.message || t("components.publishModal.error", "Chia sẻ thất bại!"));
    } finally {
      setIsPublishing(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-card border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between p-5 border-b border-border/50 bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 text-primary rounded-xl">
                <Share2 size={20} />
              </div>
              <h3 className="font-bold text-lg text-foreground">{t("components.publishModal.title", "Chia sẻ Cộng đồng")}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 p-2 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handlePublish} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {t("components.publishModal.document", "Tài liệu")}
              </label>
              <div className="w-full bg-muted/30 border border-border/50 rounded-xl px-4 py-3 flex items-center gap-3 text-foreground">
                <BookOpen size={16} className="text-primary" />
                <span className="font-medium text-sm truncate">{targetDocument?.title || ""}</span>
              </div>
            </div>

            {(targetDocument?.clonedFromId || targetDocument?.processingStatus !== "SUCCESS") && (
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs font-medium text-amber-700 flex gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>
                  {targetDocument?.clonedFromId
                    ? "Tài liệu clone từ Marketplace không được publish lại."
                    : "Tài liệu cần xử lý AI chunks thành công trước khi publish."}
                </span>
              </div>
            )}

            <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {t("components.publishModal.subject", "Môn học")}
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary rounded-xl px-3 py-2.5 outline-none text-sm font-medium text-foreground dark:bg-[#1a1a1a]"
                >
                  <option value="">Chọn môn học</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.code} - {subject.name}
                    </option>
                  ))}
                </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {t("components.publishModal.description", "Mô tả tài liệu (bắt buộc)")}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("components.publishModal.placeholder", "Giới thiệu sơ qua về tài liệu này...")}
                className="w-full bg-background border border-border focus:border-primary rounded-xl px-4 py-3 outline-none text-sm min-h-[100px] resize-none text-foreground placeholder:text-muted-foreground dark:bg-[#1a1a1a]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Ghi chú gửi kiểm duyệt viên
              </label>
              <textarea
                value={publishNote}
                onChange={(e) => setPublishNote(e.target.value)}
                placeholder="Có thể bỏ trống. Hệ thống sẽ tự dùng mô tả tài liệu làm ghi chú."
                className="w-full bg-background border border-border focus:border-primary rounded-xl px-4 py-3 outline-none text-sm min-h-[72px] resize-none text-foreground placeholder:text-muted-foreground dark:bg-[#1a1a1a]"
              />
            </div>

            <button
              type="submit"
              disabled={isPublishing || !targetDocument?.id || !!targetDocument?.clonedFromId || targetDocument?.processingStatus !== "SUCCESS"}
              className="w-full mt-2 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50"
            >
              {isPublishing ? (
                <>
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t("components.publishModal.processing", "Đang xử lý...")}
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  {t("components.publishModal.publish", "Chia sẻ ngay")}
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body,
  );
}
