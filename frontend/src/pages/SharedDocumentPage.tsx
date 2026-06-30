import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Lock, Clock, User, AlertTriangle, HardDrive } from "lucide-react";
import { useTranslation } from "react-i18next";
import { documentService, SharedDocumentDTO } from "../services/documentService";

interface SharedDocumentPageProps {
  shareToken: string;
}

export default function SharedDocumentPage({ shareToken }: SharedDocumentPageProps) {
  const { t } = useTranslation();
  const [doc, setDoc] = useState<SharedDocumentDTO | null>(null);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const res = await documentService.getPublicSharedDocument(shareToken);
        if (res.success) {
          setDoc(res.data);
        }
      } catch (err: any) {
        setError({
          message: err.message || "Không thể tải tài liệu. Liên kết có thể không tồn tại hoặc đã bị thu hồi.",
          code: err.errorCode
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoc();
  }, [shareToken]);

  const handleDownload = async () => {
    if (!doc?.allowDownload) return;
    setIsDownloading(true);
    try {
      const res = await documentService.downloadSharedDocument(shareToken);
      if (res.success && res.data.downloadUrl) {
        const a = document.createElement("a");
        a.href = res.data.downloadUrl;
        a.download = res.data.fileName || "document";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err: any) {
      alert("Lỗi tải file: " + (err.message || "Unknown error"));
    } finally {
      setIsDownloading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (isLoading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-space text-cream app-shell-font">
        <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-sm font-medium tracking-widest text-muted-foreground uppercase animate-pulse">
          {t('pages.sharedDocument.connecting', 'Đang kết nối vệ tinh...')}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-space text-cream app-shell-font relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 size-[400px] bg-destructive/10 blur-[100px] rounded-full pointer-events-none" />
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="surface-card max-w-md w-full p-8 text-center relative z-10 border border-destructive/20">
          <div className="size-20 mx-auto bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6">
            {error.code === "SHARE_LINK_EXPIRED" ? <Clock size={32} /> : <AlertTriangle size={32} />}
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">{t('pages.sharedDocument.accessDenied', 'Truy cập bị từ chối')}</h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-8">{error.message}</p>
          <button onClick={() => window.location.href = "/"} className="h-12 px-8 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold transition-colors">
            {t('pages.sharedDocument.backToHome', 'Quay về Trang chủ')}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-space text-cream app-shell-font relative overflow-hidden p-4">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-neon/10 blur-[100px] rounded-full pointer-events-none" />

      <motion.div initial={{ y: 30, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="w-full max-w-2xl relative z-10">
        <div className="surface-card p-1 rounded-3xl border border-white/5 bg-black/40 backdrop-blur-2xl shadow-2xl">
          {/* Header Area */}
          <div className="p-8 pb-6 border-b border-white/5 relative overflow-hidden rounded-t-3xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-50" />
            <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="size-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
                <FileText size={36} className="text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-1 rounded-md bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/30">
                    {doc?.fileType || "DOCUMENT"}
                  </span>
                  {doc?.subjectId && (
                    <span className="px-2.5 py-1 rounded-md bg-muted border border-border/50 text-muted-foreground text-[10px] font-bold uppercase">
                      Môn #{doc.subjectId}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground truncate w-full" title={doc?.title}>
                  {doc?.title}
                </h1>
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5"><User size={14} /> Tài liệu chia sẻ công khai</div>
                  <div className="flex items-center gap-1.5"><HardDrive size={14} /> {formatSize(doc?.fileSize || 0)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Body Area */}
          <div className="p-8">
            <div className="bg-muted/40 rounded-2xl p-5 border border-border/50 mb-8">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{t('pages.sharedDocument.descriptionTitle', 'Mô tả tài liệu')}</h4>
              <p className="text-sm text-foreground/90 leading-relaxed font-medium">
                {doc?.description || t('pages.sharedDocument.noDescription', 'Tài liệu không có lời tựa mô tả đính kèm.')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
              {doc?.allowDownload ? (
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="flex-1 w-full h-14 rounded-xl bg-primary text-primary-foreground font-bold text-base hover:brightness-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(var(--primary),0.3)] flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
                >
                  {isDownloading ? (
                    <><div className="size-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> {t('pages.sharedDocument.preparing', 'Đang chuẩn bị...')}</>
                  ) : (
                    <><Download size={20} /> {t('pages.sharedDocument.download')}</>
                  )}
                </button>
              ) : (
                <div className="flex-1 w-full h-14 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive font-bold text-base flex items-center justify-center gap-2 cursor-not-allowed">
                  <Lock size={20} /> {t('pages.sharedDocument.downloadDisabled', 'Tải xuống bị vô hiệu hóa')}
                </div>
              )}
            </div>

            {/* Expiry Warning */}
            {doc?.expiresAt && (
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-warning font-medium">
                <Clock size={14} />
                Liên kết này sẽ tự hủy vào: {new Date(doc.expiresAt).toLocaleString("vi-VN")}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
