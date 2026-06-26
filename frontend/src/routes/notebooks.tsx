import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { BookMarked, Plus, Search, Filter } from "lucide-react";
import { useMemo, useState } from "react";
import { notebooks } from "@/lib/mock-data";

export const Route = createFileRoute("/notebooks")({
  head: () => ({
    meta: [
      { title: "Notebooks — Stitch" },
      { name: "description", content: "Danh sách sổ tay học tập theo môn." },
    ],
  }),
  component: NotebooksPage,
});

const subjects = ["Tất cả", "SWP391", "SWT301", "SWR302", "PRN221", "PRJ301"];

function NotebooksPage() {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("Tất cả");

  const filtered = useMemo(
    () =>
      notebooks.filter(
        (n) =>
          (subject === "Tất cả" || n.subject === subject) &&
          n.title.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, subject],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Notebooks</h1>
          <p className="text-muted-foreground mt-1">Sổ tay học tập, phân nhóm theo môn học.</p>
        </div>
        <button className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 self-start md:self-auto">
          <Plus size={16} /> Notebook mới
        </button>
      </div>

      <div className="surface-card p-4 flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm notebook..."
            className="w-full pl-10 pr-3 h-10 rounded-xl bg-muted/60 border border-transparent focus:bg-card focus:border-primary outline-none text-sm"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hidden">
          <Filter size={14} className="text-muted-foreground shrink-0" />
          {subjects.map((s) => (
            <button
              key={s}
              onClick={() => setSubject(s)}
              className={`px-3 h-9 rounded-full text-xs font-medium shrink-0 transition-colors ${
                subject === s ? "bg-ink text-cream" : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((nb, i) => (
            <motion.div
              key={nb.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -4 }}
            >
              <Link
                to="/notebooks/$id"
                params={{ id: nb.id }}
                className="block surface-card p-5 hover:glow-ring transition-shadow h-full"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="size-12 rounded-2xl grid place-items-center"
                    style={{
                      background: `oklch(0.55 0.14 ${nb.color} / 0.15)`,
                      color: `oklch(0.45 0.14 ${nb.color})`,
                    }}
                  >
                    <BookMarked size={20} />
                  </div>
                  <span className="text-xs px-2 py-1 rounded-md bg-muted font-medium">{nb.subject}</span>
                </div>
                <div className="font-display text-lg font-semibold leading-snug">{nb.title}</div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-muted/50 rounded-lg py-2">
                    <div className="text-sm font-bold">{nb.docs}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Docs</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg py-2">
                    <div className="text-sm font-bold">{nb.cards}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Cards</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg py-2">
                    <div className="text-sm font-bold">{nb.quizzes}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Quiz</div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">Cập nhật: {nb.updated}</div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">Không tìm thấy notebook nào.</div>
      )}
    </div>
  );
}
