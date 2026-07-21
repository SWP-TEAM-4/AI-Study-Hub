import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import { ChunkDTO, documentService } from "../services/documentService";

export default function ReviewerDocumentPreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chunks, setChunks] = useState<ChunkDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    documentService.getDocumentChunks(Number(id))
      .then((res) => setChunks(res.data ?? []))
      .catch((err) => setError(err.message || "Không thể tải nội dung tài liệu."))
      .finally(() => setLoading(false));
  }, [id]);

  return <main className="max-w-4xl mx-auto p-6 space-y-5">
    <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft size={16} /> Quay lại kiểm duyệt</button>
    <header className="flex items-center gap-3 border-b border-border pb-4"><FileText className="text-primary" /><div><h1 className="text-xl font-bold">Nội dung tài liệu đã xử lý</h1><p className="text-sm text-muted-foreground">Bản xem chỉ gồm các đoạn chunking, không tải file gốc.</p></div></header>
    {loading ? <div className="py-20 grid place-items-center text-muted-foreground"><Loader2 className="animate-spin" /></div> : error ? <p className="text-destructive">{error}</p> : chunks.length === 0 ? <p className="text-muted-foreground">Tài liệu chưa có nội dung chunking.</p> : <article className="space-y-6">{chunks.map((chunk) => <section key={chunk.id} className="rounded-xl border border-border bg-card p-5"><p className="mb-2 text-xs font-semibold text-muted-foreground">ĐOẠN {chunk.chunkIndex + 1}{chunk.sourcePage ? ` · TRANG ${chunk.sourcePage}` : ""}</p><p className="whitespace-pre-wrap leading-7">{chunk.textContent}</p></section>)}</article>}
  </main>;
}
