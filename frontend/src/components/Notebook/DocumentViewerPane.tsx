import { useQuery } from "@tanstack/react-query";
import { Download, ExternalLink, FileText, Loader2, RefreshCw, X } from "lucide-react";
import { Notify } from "notiflix";
import { DocumentDTO, documentService } from "../../services/documentService";

export interface DocumentViewerPaneProps {
  document: DocumentDTO;
  onClose: () => void;
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function resolveFileUrl(fileUrl: string | null) {
  if (!fileUrl) return null;
  try {
    return new URL(fileUrl, window.location.origin).toString();
  } catch {
    return fileUrl;
  }
}

export default function DocumentViewerPane({ document, onClose }: DocumentViewerPaneProps) {
  const chunksQuery = useQuery({
    queryKey: ["documents", "chunks", document.id],
    queryFn: () => documentService.getDocumentChunks(document.id),
    select: (response) => response.data ?? [],
    retry: false,
  });

  const fileUrl = resolveFileUrl(document.fileUrl);
  const isPdf = document.fileType.toLowerCase() === "pdf";
  const chunks = chunksQuery.data ?? [];

  const openFile = () => {
    if (!fileUrl) {
      Notify.failure("Backend chưa trả fileUrl cho tài liệu này.");
      return;
    }
    window.open(fileUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="flex-1 min-w-0 flex flex-col border-r border-border/50 bg-background/50 h-full overflow-hidden">
      <header className="flex items-center justify-between gap-3 p-3 border-b border-border/50 bg-muted/10 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-8 shrink-0 rounded-lg bg-card border border-border/50 grid place-items-center text-primary shadow-sm">
            <FileText size={16} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate" title={document.title}>{document.title}</h3>
            <p className="text-[11px] text-muted-foreground uppercase">
              {document.fileType} · {formatBytes(document.fileSize)} · {document.processingStatus}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => chunksQuery.refetch()} className="size-8 rounded-lg hover:bg-muted grid place-items-center text-muted-foreground" title="Tải lại nội dung đã trích xuất">
            <RefreshCw size={15} className={chunksQuery.isFetching ? "animate-spin" : ""} />
          </button>
          <button onClick={openFile} disabled={!fileUrl} className="size-8 rounded-lg hover:bg-muted grid place-items-center text-muted-foreground disabled:opacity-40" title="Mở file gốc">
            <ExternalLink size={15} />
          </button>
          <button onClick={openFile} disabled={!fileUrl} className="size-8 rounded-lg hover:bg-muted grid place-items-center text-muted-foreground disabled:opacity-40" title="Tải xuống">
            <Download size={15} />
          </button>
          <button onClick={onClose} className="size-8 rounded-lg hover:bg-destructive/10 hover:text-destructive grid place-items-center text-muted-foreground" title="Đóng">
            <X size={17} />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden bg-muted/20">
        {isPdf && fileUrl ? (
          <iframe src={fileUrl} title={document.title} className="w-full h-full border-0 bg-white" />
        ) : (
          <div className="h-full overflow-y-auto custom-scrollbar p-5">
            {chunksQuery.isLoading ? (
              <div className="h-full grid place-items-center text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><Loader2 size={17} className="animate-spin" /> Đang tải nội dung đã trích xuất...</div>
              </div>
            ) : chunksQuery.isError ? (
              <div className="h-full grid place-items-center text-center text-sm text-muted-foreground">
                <div>
                  <FileText size={32} className="mx-auto mb-3 opacity-40" />
                  <p>Không thể tải chunks của tài liệu.</p>
                  <button onClick={() => chunksQuery.refetch()} className="mt-3 text-primary font-semibold">Thử lại</button>
                </div>
              </div>
            ) : chunks.length === 0 ? (
              <div className="h-full grid place-items-center text-center text-sm text-muted-foreground">
                <div><FileText size={32} className="mx-auto mb-3 opacity-40" /><p>Tài liệu chưa có nội dung đã trích xuất.</p></div>
              </div>
            ) : (
              <article className="max-w-3xl mx-auto bg-card border border-border/50 rounded-2xl shadow-sm p-6 space-y-5">
                {chunks.map((chunk) => (
                  <section key={chunk.id} className="border-b border-border/40 pb-5 last:border-0 last:pb-0">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                      Đoạn {chunk.chunkIndex + 1}{chunk.sourcePage ? ` · Trang ${chunk.sourcePage}` : ""}{chunk.sourceSection ? ` · ${chunk.sourceSection}` : ""}
                    </div>
                    <p className="text-sm leading-7 whitespace-pre-wrap">{chunk.textContent}</p>
                  </section>
                ))}
              </article>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
