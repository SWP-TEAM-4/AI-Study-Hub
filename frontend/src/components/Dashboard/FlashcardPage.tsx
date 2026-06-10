import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookHeart, Search, Sparkles } from "lucide-react";
import "./FlashcardPage.css";

type Deck = {
  id: string;
  title: string;
  subject: string;
  cards: number;
  updated: string;
};

const decks: Deck[] = [
  { id: "d1", title: "SWP391 — Flash Deck", subject: "SWP391", cards: 24, updated: "Hôm qua" },
  { id: "d2", title: "SWT301 — Concepts", subject: "SWT301", cards: 18, updated: "2 ngày trước" },
  { id: "d3", title: "SWR302 — Exam Prep", subject: "SWR302", cards: 32, updated: "3 ngày trước" },
];

export default function FlashcardPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return decks;
    return decks.filter((d) => d.title.toLowerCase().includes(q) || d.subject.toLowerCase().includes(q));
  }, [query]);

  return (
    <motion.div className="fp-wrap" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="fp-head">
        <div className="fp-title">
          <div className="fp-icon"><BookHeart size={18} /></div>
          <div>
            <h2>Flashcards</h2>
            <p>Danh sách decks (mock) — có animation và UI sẵn.</p>
          </div>
        </div>
        <div className="fp-pill"><Sparkles size={14} /> {decks.length} decks</div>
      </div>

      <div className="fp-search">
        <Search size={16} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm theo tiêu đề hoặc môn..." />
      </div>

      <div className="fp-grid">
        <AnimatePresence>
          {filtered.map((d) => (
            <motion.div key={d.id} className="fp-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} whileHover={{ y: -3 }}>
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
      </div>

      {filtered.length === 0 && <div className="fp-empty">Không tìm thấy deck nào.</div>}
    </motion.div>
  );
}

