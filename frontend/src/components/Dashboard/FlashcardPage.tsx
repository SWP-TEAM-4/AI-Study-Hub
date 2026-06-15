// ─────────────────────────────────────────────────────────────────────────────
// FlashcardPage.tsx – Trang quản lý Flashcard Decks
// ─────────────────────────────────────────────────────────────────────────────
// 📌 THAY ĐỔI:
//   - XÓA: Mock data cứng (hardcoded decks array)
//   - XÓA: useMemo filter đơn giản
//   - THÊM: Import flashcardService → gọi API qua MSW
//   - THÊM: Search + Filter (visibility, sort) + Debounce
//   - THÊM: Create / Edit modal (tạo + sửa deck)
//   - THÊM: Delete confirm overlay
//   - THÊM: Pagination
//   - THÊM: Skeleton loading + Error banner + Empty state nâng cấp
// ─────────────────────────────────────────────────────────────────────────────

// ──── [CŨ] Import cơ bản ────────────────────────────────────────────────────
// import { useMemo, useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { BookHeart, Search, Sparkles } from "lucide-react";
// import "./FlashcardPage.css";

// ──── [MỚI] Import đầy đủ + flashcardService ────────────────────────────────
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookHeart, Search, Sparkles, Plus, RefreshCw,
  ChevronLeft, ChevronRight, Eye, Globe, Lock,
  Calendar, X, AlertCircle, Loader2, Pencil,
} from "lucide-react";
import {
  searchMyDecks,
  createDeck,
  updateDeck,
  deleteDeck,
  type FlashcardDeck,
  type FlashcardSearchParams,
  type Visibility,
  type MarketStatus,
} from "../../services/flashcardService";
import "./FlashcardPage.css";

// ──── [CŨ] Type cứng trong component ────────────────────────────────────────
// type Deck = {
//   id: string;
//   title: string;
//   subject: string;
//   cards: number;
//   updated: string;
// };

// ──── [CŨ] Mock data hardcoded ──────────────────────────────────────────────
// const decks: Deck[] = [
//   { id: "d1", title: "SWP391 — Flash Deck", subject: "SWP391", cards: 24, updated: "Hôm qua" },
//   { id: "d2", title: "SWT301 — Concepts", subject: "SWT301", cards: 18, updated: "2 ngày trước" },
//   { id: "d3", title: "SWR302 — Exam Prep", subject: "SWR302", cards: 32, updated: "3 ngày trước" },
// ];
// 📌 → Types giờ import từ flashcardService.ts (FlashcardDeck, Visibility, MarketStatus)
// 📌 → Data giờ load từ API: searchMyDecks() → MSW trả mock data

// ──── [MỚI] Helpers ─────────────────────────────────────────────────────────

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
  if (v === "PRIVATE") return { label: "Riêng tư", icon: <Lock size={11} />, cls: "badge-private" };
  if (v === "PUBLIC_LINK") return { label: "Link public", icon: <Globe size={11} />, cls: "badge-public" };
  return { label: "Marketplace", icon: <Eye size={11} />, cls: "badge-market" };
}

function marketLabel(m: MarketStatus) {
  const MAP: Record<MarketStatus, { label: string; cls: string }> = {
    NONE: { label: "", cls: "" },
    PENDING: { label: "Chờ duyệt", cls: "mkt-pending" },
    APPROVED: { label: "Đã duyệt", cls: "mkt-approved" },
    REJECTED: { label: "Từ chối", cls: "mkt-rejected" },
  };
  return MAP[m];
}

// ──── [MỚI] Skeleton Card — hiệu ứng shimmer khi loading ────────────────────

function SkeletonCard() {
  return (
    <div className="fp-card fp-skeleton">
      <div className="sk-line sk-short" />
      <div className="sk-line sk-long" style={{ marginTop: 10 }} />
      <div className="sk-line sk-mid" style={{ marginTop: 6 }} />
      <div className="sk-line sk-short" style={{ marginTop: 14 }} />
    </div>
  );
}

// ──── [MỚI] Create / Edit Deck Modal ─────────────────────────────────────────

interface DeckModalProps {
  editDeck?: FlashcardDeck | null; // null = create mode
  onClose: () => void;
  onSaved: () => void;
}

function DeckModal({ editDeck, onClose, onSaved }: DeckModalProps) {
  const isEdit = !!editDeck;
  const [title, setTitle] = useState(editDeck?.title ?? "");
  const [visibility, setVisibility] = useState<Visibility>(editDeck?.visibility ?? "PRIVATE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("Tiêu đề không được để trống!"); return; }
    setLoading(true); setError("");
    try {
      if (isEdit) {
        // PUT /api/flashcard-decks/:id → MSW trả mock response
        await updateDeck(editDeck!.id, { title: title.trim(), visibility });
      } else {
        // POST /api/flashcard-decks → MSW trả mock response
        await createDeck({ title: title.trim(), visibility });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Thao tác thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div className="fp-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        className="fp-modal"
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="fp-modal-header">
          <div className="fp-modal-icon">{isEdit ? <Pencil size={18} /> : <Plus size={18} />}</div>
          <div>
            <h3>{isEdit ? "Chỉnh sửa Deck" : "Tạo Deck mới"}</h3>
            <p>{isEdit ? "Cập nhật thông tin flashcard deck" : "Tạo bộ thẻ nhớ mới"}</p>
          </div>
          <button className="fp-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="fp-modal-body">
          <label>
            Tiêu đề <span className="required">*</span>
            <input
              value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: SWR302 Key Terms"
              maxLength={255}
            />
          </label>

          <label>
            Hiển thị
            <select value={visibility} onChange={(e) => setVisibility(e.target.value as Visibility)}>
              <option value="PRIVATE">🔒 Riêng tư</option>
              <option value="PUBLIC_LINK">🔗 Link public</option>
              <option value="MARKETPLACE">🛒 Marketplace</option>
            </select>
          </label>

          {error && (
            <div className="fp-modal-error">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div className="fp-modal-footer">
            <button type="button" className="fp-btn-secondary" onClick={onClose}>Huỷ</button>
            <button type="submit" className="fp-btn-primary" disabled={loading}>
              {loading ? <><Loader2 size={14} className="spin" /> Đang xử lý...</> : isEdit ? <><Pencil size={14} /> Lưu</> : <><Plus size={14} /> Tạo Deck</>}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ──── [MỚI] Config ───────────────────────────────────────────────────────────

const PAGE_SIZE = 12;
const SORT_OPTIONS = [
  { label: "Mới nhất", value: "createdAt,desc" },
  { label: "Cũ nhất", value: "createdAt,asc" },
  { label: "Tên A→Z", value: "title,asc" },
  { label: "Tên Z→A", value: "title,desc" },
];

// ──── [CŨ] Component cũ ─────────────────────────────────────────────────────
// export default function FlashcardPage() {
//   const [query, setQuery] = useState("");
//
//   const filtered = useMemo(() => {
//     const q = query.trim().toLowerCase();
//     if (!q) return decks;
//     return decks.filter((d) => d.title.toLowerCase().includes(q) || d.subject.toLowerCase().includes(q));
//   }, [query]);
//
//   return (
//     <motion.div className="fp-wrap" ...>
//       ...hardcoded render decks...
//     </motion.div>
//   );
// }

// ──── [MỚI] Component mới — gọi API qua flashcardService ────────────────────

export default function FlashcardPage() {
  // ── [MỚI] Search & filter state (thay cho query đơn giản) ─────────────────
  const [keyword, setKeyword] = useState("");
  const [visibility, setVisibility] = useState<Visibility | "">("");
  const [sort, setSort] = useState("createdAt,desc");
  const [page, setPage] = useState(0);

  const debouncedKeyword = useDebounce(keyword, 450);

  // ── [MỚI] Data state (thay cho decks array cứng) ──────────────────────────
  const [items, setItems] = useState<FlashcardDeck[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── [MỚI] Modals ─────────────────────────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false);
  const [editingDeck, setEditingDeck] = useState<FlashcardDeck | null>(null);

  // ── [MỚI] Delete confirm ─────────────────────────────────────────────────
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ── [MỚI] Fetch data từ API (thay cho useMemo filter cứng) ────────────────
  // Gọi GET /api/flashcard-decks → MSW generated handler trả mock data
  const fetchDecks = useCallback(async () => {
    setLoading(true); setError("");
    const params: FlashcardSearchParams = {
      keyword: debouncedKeyword || undefined,
      visibility: (visibility || undefined) as Visibility | undefined,
      page, size: PAGE_SIZE, sort,
    };
    try {
      const data = await searchMyDecks(params);
      setItems(data.items);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tải dữ liệu thất bại.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedKeyword, visibility, sort, page]);

  // [MỚI] Reset page khi filters thay đổi
  const prevFilters = useRef({ debouncedKeyword, visibility, sort });
  useEffect(() => {
    const pf = prevFilters.current;
    if (
      pf.debouncedKeyword !== debouncedKeyword ||
      pf.visibility !== visibility ||
      pf.sort !== sort
    ) {
      setPage(0);
      prevFilters.current = { debouncedKeyword, visibility, sort };
    }
  }, [debouncedKeyword, visibility, sort]);

  useEffect(() => { fetchDecks(); }, [fetchDecks]);

  // [MỚI] Delete handler — gọi DELETE /api/flashcard-decks/:id
  const handleDeleteConfirm = async (id: number) => {
    try {
      await deleteDeck(id);
      setDeletingId(null);
      fetchDecks();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xóa thất bại.");
    }
  };

  const hasActiveFilter = !!(keyword || visibility);

  return (
    <motion.div className="fp-wrap" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

      {/* ── Header ── */}
      <div className="fp-head">
        <div className="fp-title">
          <div className="fp-icon"><BookHeart size={18} /></div>
          <div>
            <h2>Flashcards</h2>
            {/* [CŨ] <p>Danh sách decks (mock) — có animation và UI sẵn.</p> */}
            {/* [MỚI] */}
            <p>Bộ thẻ nhớ cá nhân — ôn tập hiệu quả</p>
          </div>
        </div>
        {/* [CŨ] <div className="fp-pill"><Sparkles size={14} /> {decks.length} decks</div> */}
        {/* [MỚI] Head actions: pill + nút tạo mới */}
        <div className="fp-head-actions">
          <div className="fp-pill">
            <Sparkles size={13} />
            {loading ? "..." : totalElements} decks
          </div>
          <button className="fp-btn-create" onClick={() => setShowCreate(true)}>
            <Plus size={15} /> Tạo Deck
          </button>
        </div>
      </div>

      {/* ── [CŨ] Search đơn giản ── */}
      {/* <div className="fp-search">
        <Search size={16} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm theo tiêu đề hoặc môn..." />
      </div> */}

      {/* ── [MỚI] Search + Filters ── */}
      <div className="fp-filters">
        <div className="fp-search">
          <Search size={15} />
          <input
            id="flashcard-search-input"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo tiêu đề..."
          />
          {keyword && (
            <button className="fp-clear" onClick={() => setKeyword("")}><X size={13} /></button>
          )}
        </div>

        <div className="fp-filter-row">
          <div className="fp-select-wrap">
            <Eye size={13} />
            <select value={visibility} onChange={(e) => setVisibility(e.target.value as Visibility | "")} id="flashcard-visibility-filter">
              <option value="">Tất cả hiển thị</option>
              <option value="PRIVATE">🔒 Riêng tư</option>
              <option value="PUBLIC_LINK">🔗 Public link</option>
              <option value="MARKETPLACE">🛒 Marketplace</option>
            </select>
          </div>

          <div className="fp-select-wrap">
            <RefreshCw size={13} />
            <select value={sort} onChange={(e) => setSort(e.target.value)} id="flashcard-sort-select">
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {hasActiveFilter && (
            <button
              className="fp-clear-filters"
              onClick={() => { setKeyword(""); setVisibility(""); }}
            >
              <X size={12} /> Xoá bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* ── [MỚI] Error banner ── */}
      <AnimatePresence>
        {error && (
          <motion.div className="fp-error" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <AlertCircle size={15} /> {error}
            <button onClick={fetchDecks}><RefreshCw size={13} /> Thử lại</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── [CŨ] Grid cứng ── */}
      {/* <div className="fp-grid">
        <AnimatePresence>
          {filtered.map((d) => (
            <motion.div key={d.id} className="fp-card" ...>
              <div className="fp-top">
                <div>
                  <div className="fp-subject">{d.subject}</div>
                  <div className="fp-title-text">{d.title}</div>
                </div>
                <div className="fp-count">{d.cards} thẻ</div>
              </div>
              <div className="fp-meta">Cập nhật: {d.updated}</div>
              <div className="fp-footer">
                <button className="fp-btn" type="button">Học (mock)</button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div> */}

      {/* ── [MỚI] Grid — render từ API data ── */}
      <div className="fp-grid">
        <AnimatePresence mode="popLayout">
          {loading
            ? Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={`sk-${i}`} />)
            : items.map((deck) => {
              const vis = visibilityLabel(deck.visibility);
              const mkt = marketLabel(deck.marketStatus);
              const cardCount = deck.cards?.length ?? 0;
              return (
                <motion.div
                  key={deck.id}
                  className="fp-card"
                  layout
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -4, transition: { duration: 0.18 } }}
                  transition={{ duration: 0.22 }}
                >
                  {/* Card Top */}
                  <div className="fp-top">
                    <div className="fp-badges">
                      {deck.subjectId && (
                        <span className="badge-subject">Môn #{deck.subjectId}</span>
                      )}
                      <span className="fp-count">{cardCount} thẻ</span>
                    </div>
                    <span className={`badge-vis ${vis.cls}`}>{vis.icon} {vis.label}</span>
                  </div>

                  {/* Title */}
                  <div className="fp-title-text">{deck.title}</div>

                  {/* [MỚI] Meta row — ngày tạo + market status */}
                  <div className="fp-meta-row">
                    <span className="fp-meta-item">
                      <Calendar size={11} />
                      {formatDate(deck.createdAt)}
                    </span>
                    {mkt.label && (
                      <span className={`badge-mkt ${mkt.cls}`}>{mkt.label}</span>
                    )}
                  </div>

                  {/* [MỚI] Stats — downloads, reviews */}
                  <div className="fp-stats">
                    <span>⬇️ {deck.downloadCount}</span>
                    <span>⭐ {deck.reviewCount}</span>
                    {deck.acceptPercentage > 0 && (
                      <span>✅ {Number(deck.acceptPercentage).toFixed(0)}%</span>
                    )}
                  </div>

                  {/* [CŨ] Footer chỉ có 1 nút:
                      <div className="fp-footer">
                        <button className="fp-btn" type="button">Học (mock)</button>
                      </div>
                    */}
                  {/* [MỚI] Footer 3 nút: Học + Sửa + Xóa */}
                  <div className="fp-footer">
                    <button className="fp-btn" type="button">Học ngay</button>
                    <button className="fp-btn-edit" type="button" onClick={() => setEditingDeck(deck)}>
                      <Pencil size={13} /> Sửa
                    </button>
                    <button
                      className="fp-btn-danger"
                      type="button"
                      onClick={() => setDeletingId(deck.id)}
                    >
                      Xóa
                    </button>
                  </div>

                  {/* [MỚI] Delete confirm overlay */}
                  <AnimatePresence>
                    {deletingId === deck.id && (
                      <motion.div
                        className="fp-delete-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <p>Xác nhận xóa deck này?</p>
                        <div className="fp-delete-actions">
                          <button onClick={() => setDeletingId(null)}>Huỷ</button>
                          <button className="danger" onClick={() => handleDeleteConfirm(deck.id)}>Xóa</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
        </AnimatePresence>
      </div>

      {/* ── [CŨ] Empty đơn giản ── */}
      {/* {filtered.length === 0 && <div className="fp-empty">Không tìm thấy deck nào.</div>} */}

      {/* ── [MỚI] Empty state nâng cấp ── */}
      {!loading && items.length === 0 && !error && (
        <motion.div className="fp-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <BookHeart size={40} strokeWidth={1.2} />
          <p>{hasActiveFilter ? "Không tìm thấy deck nào với bộ lọc này." : "Bạn chưa có deck nào. Hãy tạo deck đầu tiên!"}</p>
          {!hasActiveFilter && (
            <button className="fp-btn-create" onClick={() => setShowCreate(true)}>
              <Plus size={14} /> Tạo Deck đầu tiên
            </button>
          )}
        </motion.div>
      )}

      {/* ── [MỚI] Pagination ── */}
      {!loading && totalPages > 1 && (
        <div className="fp-pagination">
          <button
            className="fp-page-btn"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i).map((i) => (
            <button
              key={i}
              className={`fp-page-btn ${i === page ? "active" : ""}`}
              onClick={() => setPage(i)}
            >
              {i + 1}
            </button>
          ))}

          <button
            className="fp-page-btn"
            disabled={page === totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight size={16} />
          </button>

          <span className="fp-page-info">
            Trang {page + 1} / {totalPages} ({totalElements} decks)
          </span>
        </div>
      )}

      {/* ── [MỚI] Create Deck Modal ── */}
      <AnimatePresence>
        {showCreate && (
          <DeckModal
            onClose={() => setShowCreate(false)}
            onSaved={fetchDecks}
          />
        )}
      </AnimatePresence>

      {/* ── [MỚI] Edit Deck Modal ── */}
      <AnimatePresence>
        {editingDeck && (
          <DeckModal
            editDeck={editingDeck}
            onClose={() => setEditingDeck(null)}
            onSaved={fetchDecks}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
