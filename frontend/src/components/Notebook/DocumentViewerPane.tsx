import { useQuery } from "@tanstack/react-query";
import { Download, ExternalLink, FileText, Loader2, RefreshCw, X } from "lucide-react";
import { Notify } from "notiflix";
import { useEffect, useMemo, useRef, useState } from "react";
import { DocumentDTO, documentService } from "../../services/documentService";

export interface DocumentViewerPaneProps {
  document: DocumentDTO;
  selectedChunkIndex?: number | null;
  selectedSourcePage?: number | null;
  selectedExcerpt?: string | null;
  onClose: () => void;
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentViewerPane({
  document,
  selectedChunkIndex = null,
  selectedSourcePage = null,
  selectedExcerpt = null,
  onClose,
}: DocumentViewerPaneProps) {
  const [fileAction, setFileAction] = useState<"open" | "download" | null>(null);
  const chunkRefs = useRef<Record<number, HTMLElement | null>>({});

  const chunksQuery = useQuery({
    queryKey: ["documents", "chunks", document.id],
    queryFn: () => documentService.getDocumentChunks(document.id),
    select: (response) => response.data ?? [],
    retry: false,
  });

  const chunks = chunksQuery.data ?? [];
  const highlightedChunk = useMemo(() => {
    if (selectedChunkIndex !== null && selectedChunkIndex !== undefined) {
      const byIndex = chunks.find((chunk) => chunk.chunkIndex === selectedChunkIndex);
      if (byIndex) return byIndex;
    }
    if (selectedSourcePage !== null && selectedSourcePage !== undefined) {
      return chunks.find((chunk) => chunk.sourcePage === selectedSourcePage) ?? null;
    }
    return null;
  }, [chunks, selectedChunkIndex, selectedSourcePage]);

  useEffect(() => {
    if (!highlightedChunk) return;
    const timer = window.setTimeout(() => {
      chunkRefs.current[highlightedChunk.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [highlightedChunk?.id]);

  const openOriginalFile = async () => {
    if (fileAction) return;
    setFileAction("open");
    try {
      const download = await documentService.downloadDocument(document.id, document.title, document.fileType);
      const anchor = window.document.createElement("a");
      anchor.href = download.blobUrl;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(download.blobUrl), 60_000);
    } catch (error: any) {
      Notify.failure(error?.message || "Không thể mở file gốc.");
    } finally {
      setFileAction(null);
    }
  };

  const downloadOriginalFile = async () => {
    if (fileAction) return;
    setFileAction("download");
    try {
      const download = await documentService.downloadDocument(document.id, document.title, document.fileType);
      const anchor = window.document.createElement("a");
      anchor.href = download.blobUrl;
      anchor.download = download.fileName;
      window.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(download.blobUrl), 2_000);
    } catch (error: any) {
      Notify.failure(error?.message || "Không thể tải file gốc.");
    } finally {
      setFileAction(null);
    }
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
          <button onClick={openOriginalFile} disabled={Boolean(fileAction)} className="size-8 rounded-lg hover:bg-muted grid place-items-center text-muted-foreground disabled:opacity-40" title="Mở file gốc">
            {fileAction === "open" ? <Loader2 size={15} className="animate-spin" /> : <ExternalLink size={15} />}
          </button>
          <button onClick={downloadOriginalFile} disabled={Boolean(fileAction)} className="size-8 rounded-lg hover:bg-muted grid place-items-center text-muted-foreground disabled:opacity-40" title="Tải xuống">
            {fileAction === "download" ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
          </button>
          <button onClick={onClose} className="size-8 rounded-lg hover:bg-destructive/10 hover:text-destructive grid place-items-center text-muted-foreground" title="Đóng">
            <X size={17} />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden bg-muted/20">
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
            <article className="max-w-3xl mx-auto bg-card border border-border/50 rounded-2xl shadow-sm p-4 md:p-6 space-y-3">
              {highlightedChunk && (
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-3 py-2 text-xs text-emerald-700">
                  Đang tô xanh nguồn: đoạn {highlightedChunk.chunkIndex + 1}
                  {highlightedChunk.sourcePage ? ` · trang ${highlightedChunk.sourcePage}` : ""}
                  {selectedExcerpt ? <span className="block mt-1 line-clamp-2 text-emerald-700/80">{selectedExcerpt}</span> : null}
                </div>
              )}
              {selectedChunkIndex !== null && !highlightedChunk && (
                <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2 text-xs text-amber-700">
                  Không tìm thấy chunk #{selectedChunkIndex + 1} trong tài liệu hiện tại. Có thể tài liệu đã được xử lý lại sau khi phiên chat được tạo.
                </div>
              )}
              {chunks.map((chunk) => {
                const isHighlighted = highlightedChunk?.id === chunk.id;
                return (
                  <section
                    key={chunk.id}
                    ref={(element) => {
                      chunkRefs.current[chunk.id] = element;
                    }}
                    className={`scroll-mt-6 rounded-xl border px-3.5 py-3.5 transition-colors ${
                      isHighlighted
                        ? "border-emerald-500/60 bg-emerald-500/[0.10] ring-2 ring-emerald-500/20 shadow-sm"
                        : "border-transparent border-b-border/40 last:border-b-transparent"
                    }`}
                  >
                    <div className={`text-[11px] font-semibold uppercase tracking-wide mb-2 ${isHighlighted ? "text-emerald-700" : "text-muted-foreground"}`}>
                      Đoạn {chunk.chunkIndex + 1}{chunk.sourcePage ? ` · Trang ${chunk.sourcePage}` : ""}{chunk.sourceSection ? ` · ${chunk.sourceSection}` : ""}
                    </div>
                    <p className="text-sm leading-7 whitespace-pre-wrap">{chunk.textContent}</p>
                  </section>
                );
              })}
            </article>
          )}
        </div>
      </div>
    </section>
  );
}
