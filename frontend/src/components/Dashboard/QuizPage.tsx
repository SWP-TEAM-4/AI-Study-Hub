import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Search, Sparkles, Plus, RefreshCw,
  ChevronLeft, ChevronRight, Eye, Globe, Lock,
  Calendar, Tag, X, AlertCircle, Loader2,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import {
  searchMyQuizzes,
  createQuiz,
  deleteQuiz,
  type QuizItem,
  type QuizSearchParams,
  type Visibility,
  type MarketStatus,
} from "../../services/quizService";
import "./QuizPage.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function visibilityLabel(v: Visibility) {
  if (v === "PRIVATE")     return { label: "Riêng tư", icon: <Lock size={11} />, cls: "badge-private" };
  if (v === "PUBLIC_LINK") return { label: "Link public", icon: <Globe size={11} />, cls: "badge-public" };
  return                          { label: "Marketplace", icon: <Eye size={11} />,  cls: "badge-market" };
}

function marketLabel(m: MarketStatus) {
  const MAP: Record<MarketStatus, { label: string; cls: string }> = {
    NONE:     { label: "",          cls: "" },
    PENDING:  { label: "Chờ duyệt", cls: "mkt-pending" },
    APPROVED: { label: "Đã duyệt",  cls: "mkt-approved" },
    REJECTED: { label: "Từ chối",   cls: "mkt-rejected" },
  };
  return MAP[m];
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="qp-card qp-skeleton">
      <div className="sk-line sk-short" />
      <div className="sk-line sk-long" style={{ marginTop: 10 }} />
      <div className="sk-line sk-mid" style={{ marginTop: 6 }} />
      <div className="sk-line sk-short" style={{ marginTop: 14 }} />
    </div>
  );
}

// ─── Create Quiz Modal ────────────────────────────────────────────────────────

interface CreateModalProps {
  token: string;
  onClose: () => void;
  onCreated: () => void;
}

function CreateQuizModal({ token, onClose, onCreated }: CreateModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [examType, setExamType] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("PRIVATE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("Tiêu đề không được để trống!"); return; }
    setLoading(true); setError("");
    try {
      await createQuiz(token, { title: title.trim(), description: description.trim() || undefined, examType: examType.trim() || undefined, visibility });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tạo quiz thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div className="qp-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        className="qp-modal"
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="qp-modal-header">
          <div className="qp-modal-icon"><Plus size={18} /></div>
          <div>
            <h3>Tạo Quiz mới</h3>
            <p>Tạo đề thi cá nhân của bạn</p>
          </div>
          <button className="qp-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleCreate} className="qp-modal-body">
          <label>
            Tiêu đề <span className="required">*</span>
            <input
              value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: SWP391 — Midterm Review"
              maxLength={255}
            />
          </label>

          <label>
            Mô tả
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn về quiz..."
              rows={3}
            />
          </label>

          <div className="qp-modal-row">
            <label>
              Loại đề thi
              <input value={examType} onChange={(e) => setExamType(e.target.value)} placeholder="Midterm, Final, Lab..." />
            </label>
            <label>
              Hiển thị
              <select value={visibility} onChange={(e) => setVisibility(e.target.value as Visibility)}>
                <option value="PRIVATE">🔒 Riêng tư</option>
                <option value="PUBLIC_LINK">🔗 Link public</option>
                <option value="MARKETPLACE">🛒 Marketplace</option>
              </select>
            </label>
          </div>

          {error && (
            <div className="qp-modal-error">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div className="qp-modal-footer">
            <button type="button" className="qp-btn-secondary" onClick={onClose}>Huỷ</button>
            <button type="submit" className="qp-btn-primary" disabled={loading}>
              {loading ? <><Loader2 size={14} className="spin" /> Đang tạo...</> : <><Plus size={14} /> Tạo Quiz</>}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Main QuizPage ────────────────────────────────────────────────────────────

const PAGE_SIZE = 12;
const SORT_OPTIONS = [
  { label: "Mới nhất", value: "createdAt,desc" },
  { label: "Cũ nhất", value: "createdAt,asc" },
  { label: "Tên A→Z", value: "title,asc" },
  { label: "Tên Z→A", value: "title,desc" },
];

export default function QuizPage() {
  const { accessToken } = useAuthStore();

  // ── Search & filter state ─────────────────────────────────────────────────
  const [keyword, setKeyword]         = useState("");
  const [examType, setExamType]       = useState("");
  const [visibility, setVisibility]   = useState<Visibility | "">("");
  const [marketStatus, setMarketStatus] = useState<MarketStatus | "">("");
  const [sort, setSort]               = useState("createdAt,desc");
  const [page, setPage]               = useState(0);

  const debouncedKeyword = useDebounce(keyword, 450);

  // ── Data state ────────────────────────────────────────────────────────────
  const [items, setItems]             = useState<QuizItem[]>([]);
  const [totalPages, setTotalPages]   = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");

  // ── Modal ─────────────────────────────────────────────────────────────────
  const [showCreate, setShowCreate]   = useState(false);

  // ── Delete confirm ────────────────────────────────────────────────────────
  const [deletingId, setDeletingId]   = useState<number | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchQuizzes = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true); setError("");
    const params: QuizSearchParams = {
      keyword: debouncedKeyword || undefined,
      examType: examType || undefined,
      visibility: (visibility || undefined) as Visibility | undefined,
      marketStatus: (marketStatus || undefined) as MarketStatus | undefined,
      page, size: PAGE_SIZE, sort,
    };
    try {
      const data = await searchMyQuizzes(accessToken, params);
      setItems(data.items);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tải dữ liệu thất bại.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, debouncedKeyword, examType, visibility, marketStatus, sort, page]);

  // Reset page when filters change
  const prevFilters = useRef({ debouncedKeyword, examType, visibility, marketStatus, sort });
  useEffect(() => {
    const pf = prevFilters.current;
    if (
      pf.debouncedKeyword !== debouncedKeyword ||
      pf.examType !== examType ||
      pf.visibility !== visibility ||
      pf.marketStatus !== marketStatus ||
      pf.sort !== sort
    ) {
      setPage(0);
      prevFilters.current = { debouncedKeyword, examType, visibility, marketStatus, sort };
    }
  }, [debouncedKeyword, examType, visibility, marketStatus, sort]);

  useEffect(() => { fetchQuizzes(); }, [fetchQuizzes]);

  const handleDeleteConfirm = async (id: number) => {
    if (!accessToken) return;
    try {
      await deleteQuiz(accessToken, id);
      setDeletingId(null);
      fetchQuizzes();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xóa thất bại.");
    }
  };

  const hasActiveFilter = !!(keyword || examType || visibility || marketStatus);

  return (
    <motion.div className="qp-wrap" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

      {/* ── Header ── */}
      <div className="qp-head">
        <div className="qp-title">
          <div className="qp-icon"><BookOpen size={18} /></div>
          <div>
            <h2>Quiz Bank</h2>
            <p>Ngân hàng đề thi cá nhân của bạn</p>
          </div>
        </div>
        <div className="qp-head-actions">
          <div className="qp-pill">
            <Sparkles size={13} />
            {loading ? "..." : totalElements} quizzes
          </div>
          <button className="qp-btn-create" onClick={() => setShowCreate(true)}>
            <Plus size={15} /> Tạo Quiz
          </button>
        </div>
      </div>

      {/* ── Search + Filters ── */}
      <div className="qp-filters">
        <div className="qp-search">
          <Search size={15} />
          <input
            id="quiz-search-input"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo tiêu đề, mô tả..."
          />
          {keyword && (
            <button className="qp-clear" onClick={() => setKeyword("")}><X size={13} /></button>
          )}
        </div>

        <div className="qp-filter-row">
          <div className="qp-select-wrap">
            <Tag size={13} />
            <select value={examType} onChange={(e) => setExamType(e.target.value)} id="quiz-examtype-filter">
              <option value="">Tất cả loại</option>
              <option value="Midterm">Midterm</option>
              <option value="Final">Final</option>
              <option value="Lab">Lab</option>
              <option value="Practice">Practice</option>
            </select>
          </div>

          <div className="qp-select-wrap">
            <Eye size={13} />
            <select value={visibility} onChange={(e) => setVisibility(e.target.value as Visibility | "")} id="quiz-visibility-filter">
              <option value="">Tất cả hiển thị</option>
              <option value="PRIVATE">🔒 Riêng tư</option>
              <option value="PUBLIC_LINK">🔗 Public link</option>
              <option value="MARKETPLACE">🛒 Marketplace</option>
            </select>
          </div>

          <div className="qp-select-wrap">
            <RefreshCw size={13} />
            <select value={sort} onChange={(e) => setSort(e.target.value)} id="quiz-sort-select">
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {hasActiveFilter && (
            <button
              className="qp-clear-filters"
              onClick={() => { setKeyword(""); setExamType(""); setVisibility(""); setMarketStatus(""); }}
            >
              <X size={12} /> Xoá bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* ── Error banner ── */}
      <AnimatePresence>
        {error && (
          <motion.div className="qp-error" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <AlertCircle size={15} /> {error}
            <button onClick={fetchQuizzes}><RefreshCw size={13} /> Thử lại</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Grid ── */}
      <div className="qp-grid">
        <AnimatePresence mode="popLayout">
          {loading
            ? Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={`sk-${i}`} />)
            : items.map((q) => {
                const vis = visibilityLabel(q.visibility);
                const mkt = marketLabel(q.marketStatus);
                return (
                  <motion.div
                    key={q.id}
                    className="qp-card"
                    layout
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ y: -4, transition: { duration: 0.18 } }}
                    transition={{ duration: 0.22 }}
                  >
                    {/* Card Top */}
                    <div className="qp-card-top">
                      <div className="qp-badges">
                        {q.subjectName && (
                          <span className="badge-subject">{q.subjectName}</span>
                        )}
                        {q.examType && (
                          <span className="badge-exam">{q.examType}</span>
                        )}
                      </div>
                      <span className={`badge-vis ${vis.cls}`}>{vis.icon} {vis.label}</span>
                    </div>

                    {/* Title */}
                    <div className="qp-card-title">{q.title}</div>

                    {/* Description */}
                    {q.description && (
                      <div className="qp-card-desc">{q.description}</div>
                    )}

                    {/* Meta */}
                    <div className="qp-meta-row">
                      <span className="qp-meta-item">
                        <Calendar size={11} />
                        {formatDate(q.createdAt)}
                      </span>
                      {q.notebookTitle && (
                        <span className="qp-meta-item">
                          📓 {q.notebookTitle}
                        </span>
                      )}
                      {mkt.label && (
                        <span className={`badge-mkt ${mkt.cls}`}>{mkt.label}</span>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="qp-stats">
                      <span>⬇️ {q.downloadCount}</span>
                      <span>⭐ {q.reviewCount}</span>
                      {q.acceptPercentage != null && (
                        <span>✅ {Number(q.acceptPercentage).toFixed(0)}%</span>
                      )}
                    </div>

                    {/* Footer actions */}
                    <div className="qp-footer">
                      <button className="qp-btn-action" type="button">
                        Xem Quiz
                      </button>
                      <button
                        className="qp-btn-danger"
                        type="button"
                        onClick={() => setDeletingId(q.id)}
                      >
                        Xóa
                      </button>
                    </div>

                    {/* Delete confirm overlay */}
                    <AnimatePresence>
                      {deletingId === q.id && (
                        <motion.div
                          className="qp-delete-overlay"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <p>Xác nhận xóa quiz này?</p>
                          <div className="qp-delete-actions">
                            <button onClick={() => setDeletingId(null)}>Huỷ</button>
                            <button className="danger" onClick={() => handleDeleteConfirm(q.id)}>Xóa</button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
        </AnimatePresence>
      </div>

      {/* ── Empty state ── */}
      {!loading && items.length === 0 && !error && (
        <motion.div className="qp-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <BookOpen size={40} strokeWidth={1.2} />
          <p>{hasActiveFilter ? "Không tìm thấy quiz nào với bộ lọc này." : "Bạn chưa có quiz nào. Hãy tạo quiz đầu tiên!"}</p>
          {!hasActiveFilter && (
            <button className="qp-btn-create" onClick={() => setShowCreate(true)}>
              <Plus size={14} /> Tạo Quiz đầu tiên
            </button>
          )}
        </motion.div>
      )}

      {/* ── Pagination ── */}
      {!loading && totalPages > 1 && (
        <div className="qp-pagination">
          <button
            className="qp-page-btn"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i).map((i) => (
            <button
              key={i}
              className={`qp-page-btn ${i === page ? "active" : ""}`}
              onClick={() => setPage(i)}
            >
              {i + 1}
            </button>
          ))}

          <button
            className="qp-page-btn"
            disabled={page === totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight size={16} />
          </button>

          <span className="qp-page-info">
            Trang {page + 1} / {totalPages} ({totalElements} quiz)
          </span>
        </div>
      )}

      {/* ── Create Quiz Modal ── */}
      <AnimatePresence>
        {showCreate && (
          <CreateQuizModal
            token={accessToken!}
            onClose={() => setShowCreate(false)}
            onCreated={fetchQuizzes}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
