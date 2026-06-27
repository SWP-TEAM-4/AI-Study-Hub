import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Users, Star, Download, Search, FileText, GraduationCap, BookOpen, Filter } from "lucide-react";
import { useMemo, useState } from "react";
import { marketItems } from "@/lib/mock-data";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Cộng đồng — Stitch" },
      { name: "description", content: "Marketplace tài liệu, quiz, flashcard công khai của cộng đồng." },
    ],
  }),
  component: CommunityPage,
});

const kindStyle: Record<string, { icon: typeof FileText; color: string; label: string }> = {
  doc: { icon: FileText, color: "165", label: "Tài liệu" },
  quiz: { icon: GraduationCap, color: "35", label: "Quiz" },
  deck: { icon: BookOpen, color: "250", label: "Flashcards" },
};

function CommunityPage() {
  const [tab, setTab] = useState<"all" | "doc" | "quiz" | "deck">("all");
  const [q, setQ] = useState("");

  const list = useMemo(
    () =>
      marketItems.filter((m) => (tab === "all" || m.kind === tab) && m.title.toLowerCase().includes(q.toLowerCase())),
    [tab, q],
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="surface-card gradient-hero p-6 lg:p-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          <Users size={12} /> Marketplace
        </div>
        <h1 className="mt-3 text-3xl font-bold">Học cùng cộng đồng</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl">
          Khám phá tài liệu, quiz và flashcard chất lượng được sinh viên khắp nơi đóng góp và duyệt.
        </p>
      </motion.div>

      <div className="surface-card p-4 flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo môn, từ khóa..."
            className="w-full pl-10 pr-3 h-10 rounded-xl bg-muted/60 border border-transparent focus:bg-card focus:border-primary outline-none text-sm"
          />
        </div>
        <div className="flex gap-2">
          <Filter size={14} className="text-muted-foreground self-center" />
          {(["all", "doc", "quiz", "deck"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 h-9 rounded-full text-xs font-medium ${
                tab === t ? "bg-ink text-cream" : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {t === "all" ? "Tất cả" : kindStyle[t].label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((m, i) => {
          const k = kindStyle[m.kind];
          const Icon = k.icon;
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -3 }}
              className="surface-card p-5 flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="size-11 rounded-2xl grid place-items-center"
                  style={{ background: `oklch(0.55 0.14 ${k.color} / 0.15)`, color: `oklch(0.45 0.14 ${k.color})` }}
                >
                  <Icon size={18} />
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-muted font-medium">{m.subject}</span>
              </div>
              <h3 className="font-display font-semibold leading-snug flex-1">{m.title}</h3>
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="size-6 rounded-full bg-ink text-cream grid place-items-center text-[10px] font-semibold">
                  {m.author
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <span>{m.author}</span>
              </div>
              <div className="mt-4 flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1 text-warning-foreground">
                    <Star size={12} className="fill-warning text-warning" /> {m.rating}
                  </span>
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Download size={12} /> {m.downloads.toLocaleString()}
                  </span>
                </div>
                <button className="px-3 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
                  Clone
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
