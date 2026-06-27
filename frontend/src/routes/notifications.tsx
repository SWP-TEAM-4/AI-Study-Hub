import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, Search, Bot, Trophy, ShoppingBag, MessageCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { notifications as initial } from "@/lib/mock-data";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Thông báo — Stitch" },
      { name: "description", content: "Tất cả thông báo: AI, hệ thống, marketplace, cộng đồng." },
    ],
  }),
  component: NotificationsPage,
});

const iconMap = {
  ai: { Icon: Bot, tint: "165" },
  system: { Icon: Trophy, tint: "35" },
  market: { Icon: ShoppingBag, tint: "200" },
  social: { Icon: MessageCircle, tint: "250" },
} as const;

function NotificationsPage() {
  const [list, setList] = useState(initial);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => list.filter((n) => n.text.toLowerCase().includes(q.toLowerCase())), [list, q]);
  const unread = list.filter((n) => n.unread).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="text-primary" /> Thông báo
          </h1>
          <p className="text-muted-foreground mt-1">
            {unread > 0 ? `${unread} chưa đọc` : "Tất cả đã đọc"}
          </p>
        </div>
        <button
          disabled={unread === 0}
          onClick={() => setList((p) => p.map((n) => ({ ...n, unread: false })))}
          className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40"
        >
          <CheckCheck size={16} /> Đọc tất cả
        </button>
      </div>

      <div className="surface-card p-3 relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm thông báo..."
          className="w-full pl-10 pr-3 h-10 rounded-xl bg-muted/60 border border-transparent focus:bg-card focus:border-primary outline-none text-sm"
        />
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {filtered.map((n) => {
            const meta = iconMap[n.kind];
            const Icon = meta.Icon;
            return (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onClick={() => setList((p) => p.map((x) => (x.id === n.id ? { ...x, unread: false } : x)))}
                className={`surface-card p-4 flex gap-3 cursor-pointer ${n.unread ? "border-primary/40" : ""}`}
              >
                <div
                  className="size-10 shrink-0 rounded-xl grid place-items-center"
                  style={{ background: `oklch(0.55 0.14 ${meta.tint} / 0.15)`, color: `oklch(0.45 0.14 ${meta.tint})` }}
                >
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm leading-snug">{n.text}</div>
                  <div className="text-xs text-muted-foreground mt-1">{n.time}</div>
                </div>
                {n.unread && <span className="size-2 mt-2 rounded-full bg-primary shrink-0" />}
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">Không có thông báo.</div>
        )}
      </div>
    </div>
  );
}
