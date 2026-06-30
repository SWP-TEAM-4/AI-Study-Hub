import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Share2, Sparkles, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Notify } from "notiflix";
import { documentService } from "../../services/documentService";

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  documentId: number | string;
  onPublished?: () => void;
}

export default function PublishModal({ isOpen, onClose, documentTitle, documentId, onPublished }: PublishModalProps) {
  const { t } = useTranslation();
  const [semester, setSemester] = useState("S7");
  const [subject, setSubject] = useState("SWP391");
  const [description, setDescription] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  if (!isOpen) return null;

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      Notify.failure(t("components.publishModal.errorEmpty", "Vui lòng nhập mô tả ngắn cho tài liệu"));
      return;
    }

    setIsPublishing(true);
    try {
      await documentService.submitToMarketplace(Number(documentId), `${semester} - ${subject}: ${description.trim()}`);
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
                <span className="font-medium text-sm truncate">{documentTitle}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {t("components.publishModal.semester", "Học kỳ")}
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary rounded-xl px-3 py-2.5 outline-none text-sm font-medium text-foreground dark:bg-[#1a1a1a]"
                >
                  <option value="S1">{t("filters.semester1")}</option>
                  <option value="S2">{t("filters.semester2")}</option>
                  <option value="S3">{t("filters.semester3")}</option>
                  <option value="S4">{t("filters.semester4")}</option>
                  <option value="S5">{t("filters.semester5")}</option>
                  <option value="S6">{t("filters.semester6")}</option>
                  <option value="S7">{t("filters.semester7")}</option>
                  <option value="S8">{t("filters.semester8")}</option>
                  <option value="S9">{t("filters.semester9")}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {t("components.publishModal.subject", "Môn học")}
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary rounded-xl px-3 py-2.5 outline-none text-sm font-medium text-foreground dark:bg-[#1a1a1a]"
                >
                  <option value="SWP391">SWP391</option>
                  <option value="PRN212">PRN212</option>
                  <option value="MAD101">MAD101</option>
                  <option value="PRO192">PRO192</option>
                  <option value="DBI202">DBI202</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {t("components.publishModal.description", "Mô tả (bắt buộc)")}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("components.publishModal.placeholder", "Giới thiệu sơ qua về tài liệu này...")}
                className="w-full bg-background border border-border focus:border-primary rounded-xl px-4 py-3 outline-none text-sm min-h-[100px] resize-none text-foreground placeholder:text-muted-foreground dark:bg-[#1a1a1a]"
              />
            </div>

            <button
              type="submit"
              disabled={isPublishing}
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
