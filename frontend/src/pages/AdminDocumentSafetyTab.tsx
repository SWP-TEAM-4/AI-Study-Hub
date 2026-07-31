import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  X,
} from "lucide-react";
import { Notify } from "notiflix";
import {
  documentSafetyService,
  DocumentSafetyReviewDTO,
  DocumentSafetySettingsDTO,
} from "../services/documentSafetyService";

const statusOptions = [
  { value: "PENDING", label: "Chờ admin duyệt" },
  { value: "APPROVED", label: "Admin đã duyệt" },
  { value: "REJECTED", label: "Admin đã chặn" },
  { value: "ALL", label: "Tất cả" },
];

const severityOptions = ["ALL", "LOW", "MEDIUM", "HIGH", "CRITICAL"];

function severityClass(severity: string) {
  if (severity === "CRITICAL") return "bg-red-600 text-white";
  if (severity === "HIGH") return "bg-red-500/10 text-red-600 border-red-500/20";
  if (severity === "MEDIUM") return "bg-amber-500/10 text-amber-700 border-amber-500/20";
  if (severity === "LOW") return "bg-sky-500/10 text-sky-700 border-sky-500/20";
  return "bg-muted text-muted-foreground border-border";
}

function statusClass(status: string) {
  if (status === "APPROVED") return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";
  if (status === "REJECTED") return "bg-red-500/10 text-red-600 border-red-500/20";
  return "bg-amber-500/10 text-amber-700 border-amber-500/20";
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export default function AdminDocumentSafetyTab() {
  const [settings, setSettings] = useState<DocumentSafetySettingsDTO | null>(null);
  const [reviews, setReviews] = useState<DocumentSafetyReviewDTO[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState("PENDING");
  const [severity, setSeverity] = useState("ALL");
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState("newest");
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [reviewingId, setReviewingId] = useState<number | null>(null);

  const enabled = Boolean(settings?.enabled);
  const pendingCountLabel = useMemo(
    () => status === "PENDING" ? `${totalElements} hồ sơ đang chờ` : `${totalElements} hồ sơ`,
    [status, totalElements],
  );

  const loadSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const response = await documentSafetyService.getSettings();
      setSettings(response.data);
    } catch (error: any) {
      Notify.failure(error?.message || "Không thể tải cấu hình an toàn tài liệu");
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const loadReviews = async () => {
    setIsLoadingReviews(true);
    try {
      const response = await documentSafetyService.getReviews({
        page,
        size: 10,
        status,
        severity,
        keyword,
        sort,
      });
      setReviews(response.data.items || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalElements(response.data.totalElements || 0);
    } catch (error: any) {
      Notify.failure(error?.message || "Không thể tải hàng chờ kiểm duyệt tài liệu");
    } finally {
      setIsLoadingReviews(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    loadReviews();
  }, [page, status, severity, sort]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(0);
    loadReviews();
  };

  const toggleSafety = async () => {
    if (!settings || isToggling) return;
    setIsToggling(true);
    try {
      const response = await documentSafetyService.updateSettings(!settings.enabled);
      setSettings(response.data);
      Notify.success(response.data.enabled ? "Đã bật kiểm duyệt an toàn tài liệu" : "Đã tắt kiểm duyệt an toàn tài liệu");
    } catch (error: any) {
      Notify.failure(error?.message || "Không thể cập nhật cấu hình kiểm duyệt");
    } finally {
      setIsToggling(false);
    }
  };

  const decideReview = async (review: DocumentSafetyReviewDTO, action: "approve" | "reject") => {
    const promptTitle = action === "approve"
      ? "Ghi chú duyệt an toàn tài liệu:"
      : "Lý do chặn tài liệu:";
    const note = window.prompt(promptTitle, action === "approve" ? "False positive, admin approved." : "Confirmed unsafe by admin.");
    if (note === null) return;

    setReviewingId(review.id);
    try {
      const response = action === "approve"
        ? await documentSafetyService.approveReview(review.id, note)
        : await documentSafetyService.rejectReview(review.id, note);
      setReviews((items) => items.map((item) => item.id === review.id ? response.data : item));
      Notify.success(action === "approve" ? "Đã duyệt lại tài liệu" : "Đã xác nhận chặn tài liệu");
    } catch (error: any) {
      Notify.failure(error?.message || "Không thể cập nhật quyết định kiểm duyệt");
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-4">
        <div className="surface-card p-5 bg-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-extrabold text-primary">
                <ShieldAlert size={18} />
                An toàn tài liệu
              </div>
              <h2 className="font-display text-2xl font-extrabold mt-2">Hàng chờ AI safety review</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
                Các tài liệu bị Gemini gắn cờ khi chunking hoặc review chunk đã chỉnh sửa sẽ nằm ở đây để admin duyệt lại.
              </p>
            </div>
            <button
              onClick={() => {
                loadSettings();
                loadReviews();
              }}
              className="size-10 rounded-xl border border-border grid place-items-center hover:text-primary transition-colors shrink-0"
              title="Tải lại"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        <div className="surface-card p-5 bg-card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between xl:flex-col 2xl:flex-row">
            <div className="flex min-w-0 items-start gap-3">
              <div className={`size-11 rounded-xl grid place-items-center ${enabled ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}>
                {enabled ? <ShieldCheck size={22} /> : <ShieldOff size={22} />}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-extrabold">{enabled ? "Đang bật safety check" : "Đang tắt safety check"}</div>
                <div className="text-xs text-muted-foreground mt-0.5 break-all">
                  {isLoadingSettings ? "Đang tải cấu hình..." : settings?.configKey || "DOCUMENT_SAFETY_MODERATION_ENABLED"}
                </div>
              </div>
            </div>
            <button
              onClick={toggleSafety}
              disabled={!settings || isToggling}
              className={`h-9 w-full px-4 rounded-xl text-xs font-extrabold transition-all disabled:opacity-50 sm:w-auto xl:w-full 2xl:w-auto ${enabled ? "bg-red-500/10 text-red-600 hover:bg-red-500/15" : "bg-emerald-600 text-white hover:brightness-110"}`}
            >
              {isToggling ? "Đang lưu..." : enabled ? "Tắt" : "Bật"}
            </button>
          </div>
          <p className="text-xs leading-5 text-muted-foreground mt-3">
            Khi tắt, hệ thống bỏ qua bước AI safety review trong chunking/edit chunking; tài liệu vẫn cần xử lý chunks thành công.
          </p>
        </div>
      </div>

      <div className="surface-card p-4 bg-card">
        <form onSubmit={handleSearch} className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_160px_150px_130px] gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm theo tiêu đề, chủ sở hữu, lý do hoặc excerpt..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-muted/50 border border-border outline-none focus:border-primary text-sm"
            />
          </div>
          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(0); }} className="h-10 px-3 rounded-xl bg-muted border border-border text-sm font-semibold">
            {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select value={severity} onChange={(event) => { setSeverity(event.target.value); setPage(0); }} className="h-10 px-3 rounded-xl bg-muted border border-border text-sm font-semibold">
            {severityOptions.map((option) => <option key={option} value={option}>{option === "ALL" ? "Mọi mức độ" : option}</option>)}
          </select>
          <select value={sort} onChange={(event) => { setSort(event.target.value); setPage(0); }} className="h-10 px-3 rounded-xl bg-muted border border-border text-sm font-semibold">
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
          </select>
        </form>
      </div>

      <div className="surface-card overflow-hidden bg-card">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-bold flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-600" />
              Hồ sơ bị AI gắn cờ
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{pendingCountLabel}</p>
          </div>
          {isLoadingReviews && <Loader2 size={18} className="animate-spin text-primary" />}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[1080px]">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground border-b border-border/50">
              <tr>
                <th className="px-5 py-3.5">Tài liệu</th>
                <th className="px-5 py-3.5">AI verdict</th>
                <th className="px-5 py-3.5">Lý do</th>
                <th className="px-5 py-3.5">Excerpt</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoadingReviews ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan={5} className="px-5 py-4">
                      <div className="h-14 rounded-xl bg-muted animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                    Không có hồ sơ kiểm duyệt phù hợp.
                  </td>
                </tr>
              ) : reviews.map((review) => (
                <tr key={review.id} className="hover:bg-muted/10 transition-colors align-top">
                  <td className="px-5 py-4 max-w-[240px]">
                    <div className="font-extrabold text-foreground line-clamp-2">{review.documentTitle || "Tài liệu đã bị xóa"}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      Doc #{review.documentId || "-"} · Owner #{review.ownerUserId || "-"}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">{review.ownerName || "Không rõ chủ sở hữu"}</div>
                    <div className="text-[11px] text-muted-foreground mt-2">{formatDate(review.createdAt)}</div>
                  </td>
                  <td className="px-5 py-4 w-[210px]">
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-flex items-center px-2.5 h-7 rounded-lg border text-[11px] font-extrabold ${severityClass(review.violationSeverity)}`}>
                        {review.violationSeverity}
                      </span>
                      <span className={`inline-flex items-center px-2.5 h-7 rounded-lg border text-[11px] font-extrabold ${statusClass(review.reviewStatus)}`}>
                        {review.reviewStatus}
                      </span>
                    </div>
                    <div className="mt-2 text-[11px] text-muted-foreground">
                      {review.eventType} · {review.documentModerationStatus}
                    </div>
                    <div className="mt-2 text-[11px] text-muted-foreground">
                      Confidence: {review.confidence == null ? "-" : `${Math.round(review.confidence * 100)}%`}
                    </div>
                    {review.policyFlags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {review.policyFlags.slice(0, 3).map((flag) => (
                          <span key={flag} className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-mono text-muted-foreground">{flag}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 max-w-[260px]">
                    <div className="text-xs leading-5 text-foreground line-clamp-5">
                      {review.reason || review.moderationNote || "Không có lý do từ model."}
                    </div>
                    {review.reviewedNote && (
                      <div className="mt-2 text-[11px] leading-4 text-muted-foreground">
                        Admin note: {review.reviewedNote}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 max-w-[300px]">
                    <div className="text-xs leading-5 text-muted-foreground line-clamp-6">
                      {review.textExcerpt || "Không có excerpt."}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right w-[190px]">
                    {review.reviewStatus === "PENDING" ? (
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => decideReview(review, "approve")}
                          disabled={reviewingId === review.id}
                          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-emerald-600 text-white text-xs font-extrabold hover:brightness-110 disabled:opacity-50"
                        >
                          {reviewingId === review.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                          Duyệt
                        </button>
                        <button
                          onClick={() => decideReview(review, "reject")}
                          disabled={reviewingId === review.id}
                          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-red-500/10 text-red-600 text-xs font-extrabold hover:bg-red-500/15 disabled:opacity-50"
                        >
                          <X size={14} />
                          Chặn
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">{formatDate(review.reviewedAt)}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">Trang {page + 1} / {Math.max(totalPages, 1)}</span>
          <div className="flex gap-2">
            <button disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))} className="px-4 py-1.5 rounded-lg text-xs font-bold bg-muted text-foreground disabled:opacity-50 hover:bg-muted/80">Trước</button>
            <button disabled={page >= totalPages - 1} onClick={() => setPage((value) => value + 1)} className="px-4 py-1.5 rounded-lg text-xs font-bold bg-muted text-foreground disabled:opacity-50 hover:bg-muted/80">Sau</button>
          </div>
        </div>
      </div>
    </div>
  );
}
