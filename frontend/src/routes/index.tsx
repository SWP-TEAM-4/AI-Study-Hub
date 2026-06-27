"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useRef, Suspense, lazy, useState } from "react";
import gsap from "gsap";
import {
  BookMarked,
  FileText,
  Bot,
  HardDrive,
  GraduationCap,
  BookOpen,
  TrendingUp,
  ArrowRight,
  Flame,
  Trophy,
} from "lucide-react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  Tooltip,
  Cell,
} from "recharts";
import { notebooks, notifications, leaderboard, decks } from "@/lib/mock-data";

type Notebook = {
  id: string;
  title: string;
  docs: number;
  cards: number;
  updated: string;
  color: string;
  quizzes?: number;
};

// 🎯 Khởi tạo tải chậm (Lazy loading) cho mô hình 3D để tối ưu hóa tốc độ render trang đầu tiên
const Spline = lazy(() => import("@splinetool/react-spline"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Stitch Learning Hub" },
      { name: "description", content: "Tổng quan notebook, tài liệu, AI và tiến độ học tập của bạn." },
    ],
  }),
  component: Dashboard,
});

const stats = [
  { label: "Notebook", value: 5, icon: BookMarked, tint: "165" },
  { label: "Tài liệu", value: 42, icon: FileText, tint: "200" },
  { label: "Lượt hỏi AI", value: 128, icon: Bot, tint: "35" },
  { label: "Dung lượng", value: "1.2 GB", icon: HardDrive, tint: "75" },
];

const weekActivity = [
  { d: "T2", v: 12 },
  { d: "T3", v: 18 },
  { d: "T4", v: 9 },
  { d: "T5", v: 24 },
  { d: "T6", v: 16 },
  { d: "T7", v: 28 },
  { d: "CN", v: 21 },
];

function CountUp({ value }: { value: string | number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = String(value);
    const num = parseFloat(target.replace(/[^0-9.]/g, ""));
    if (isNaN(num)) {
      el.textContent = target;
      return;
    }
    const suffix = target.replace(/[0-9.,\s]/g, "");
    const obj = { v: 0 };
    gsap.to(obj, {
      v: num,
      duration: 1.4,
      ease: "power2.out",
      onUpdate: () => {
        const formatted = num >= 100 ? Math.round(obj.v).toLocaleString() : obj.v.toFixed(1);
        el.textContent = formatted + suffix;
      },
    });
  }, [value]);
  return <span ref={ref}>0</span>;
}

function Dashboard() {
  // Trạng thái kiểm soát khi thực thể 3D Spline được tải xong hoàn toàn
  const [isSplineReady, setIsSplineReady] = useState(false);

  return (
    <div className="space-y-6">
      {/* ── HERO BANNER CHÀO MỪNG ── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface-card gradient-hero p-6 lg:p-8 flex flex-col lg:flex-row gap-6 items-center overflow-hidden relative"
      >
        <div className="flex-1 min-w-0 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Flame size={12} /> Chuỗi học 7 ngày liên tiếp
          </div>
          {/* 🎯 Đã loại bỏ hoàn toàn biểu tượng ngôi sao lấp lánh ở tiêu đề chính */}
          <h1 className="mt-3 text-3xl lg:text-4xl font-bold">
            Chào Khoa, hôm nay học gì nhỉ? <span className="text-primary"></span>
          </h1>
          <p className="mt-2 text-muted-foreground max-w-xl">
            Bạn còn <strong className="text-foreground font-semibold">3 quiz</strong> chưa hoàn thành và{" "}
            <strong className="text-foreground font-semibold">12 flashcard</strong> cần ôn lại trong tuần này.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              to="/chat"
              className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all shadow-sm shadow-primary/10"
            >
              <Bot size={16} /> Hỏi AI ngay
            </Link>
            <Link
              to="/notebooks"
              className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl bg-card border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              Mở Notebook <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* ── 🤖 KHỐI HIỂN THỊ ROBOT 3D CHUYỂN ĐỘNG TỰ ĐỘNG ── */}
        <div className="w-44 h-44 lg:w-52 lg:h-52 relative select-none pointer-events-none flex-shrink-0 z-0">
          {/* Vòng quay Loading mảnh xuất hiện trong lúc chờ nạp file .splinecode */}
          {!isSplineReady && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin opacity-40" />
            </div>
          )}
          
          <Suspense fallback={null}>
            <Spline
              // Trỏ trực tiếp vào file robot trong thư mục public/ của ông
              scene="/robot-companion.splinecode"
              onLoad={() => setIsSplineReady(true)}
              className={`w-full h-full scale-110 origin-center transition-all duration-700 ${
                isSplineReady ? "opacity-100 scale-125" : "opacity-0 scale-100"
              }`}
            />
          </Suspense>
        </div>
      </motion.section>

      {/* Stat tiles */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="surface-card p-5"
            >
              <div
                className="size-10 rounded-xl grid place-items-center mb-3"
                style={{ background: `oklch(0.55 0.14 ${s.tint} / 0.12)`, color: `oklch(0.45 0.14 ${s.tint})` }}
              >
                <Icon size={18} />
              </div>
              <div className="text-2xl font-bold font-display">
                <CountUp value={s.value} />
              </div>
              <div className="text-sm text-muted-foreground mt-0.5">{s.label}</div>
            </motion.div>
          );
        })}
      </section>

      {/* Chart + leaderboard */}
      <section className="grid lg:grid-cols-3 gap-4">
        <div className="surface-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-display text-lg font-semibold">Hoạt động học tuần này</h3>
              <p className="text-xs text-muted-foreground">Số lượt tương tác AI mỗi ngày</p>
            </div>
            <div className="inline-flex items-center gap-1 text-success text-sm font-medium">
              <TrendingUp size={14} /> +24%
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekActivity}>
                <XAxis dataKey="d" axisLine={false} tickLine={false} fontSize={12} stroke="oklch(0.5 0.02 250)" />
                <Tooltip
                  cursor={{ fill: "oklch(0.55 0.14 165 / 0.08)" }}
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="v" radius={[8, 8, 0, 0]}>
                  {weekActivity.map((_, i) => (
                    <Cell key={i} fill={i === 5 ? "oklch(0.55 0.14 165)" : "oklch(0.55 0.14 165 / 0.5)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg font-semibold">Top contributors</h3>
            <Trophy size={18} className="text-coral" />
          </div>
          <ul className="space-y-3">
            {leaderboard.map((u) => (
              <li key={u.rank} className="flex items-center gap-3">
                <div
                  className={`size-7 rounded-full grid place-items-center text-xs font-bold ${
                    u.rank === 1 ? "bg-coral text-white" : u.rank === 2 ? "bg-accent" : "bg-muted"
                  }`}
                >
                  {u.rank}
                </div>
                <div className="size-9 rounded-full bg-ink text-cream grid place-items-center text-xs font-semibold">
                  {u.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{u.name}</div>
                  <div className="text-xs text-muted-foreground">{u.points.toLocaleString()} pts</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Notebooks + flashcards + notis */}
      <section className="grid lg:grid-cols-3 gap-4">
        <div className="surface-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold">Notebook gần đây</h3>
            <Link to="/notebooks" className="text-sm text-primary font-medium">
              Xem tất cả →
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {notebooks.slice(0, 4).map((nb, i) => (
              <motion.div
                key={nb.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -2 }}
              >
                <Link
                  to="/notebooks/$id"
                  params={{ id: nb.id }}
                  className="block p-4 rounded-xl border border-border hover:border-primary/40 hover:shadow-md transition-all bg-card"
                >
                  <div
                    className="size-9 rounded-lg mb-3 grid place-items-center"
                    style={{ background: `oklch(0.55 0.14 ${nb.color} / 0.15)`, color: `oklch(0.45 0.14 ${nb.color})` }}
                  >
                    <BookMarked size={16} />
                  </div>
                  <div className="font-medium truncate">{nb.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {nb.docs} tài liệu · {nb.cards} thẻ · {nb.updated}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="surface-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold">Thông báo mới</h3>
            <Link to="/notifications" className="text-sm text-primary font-medium">
              Tất cả →
            </Link>
          </div>
          <ul className="space-y-3">
            {notifications.slice(0, 4).map((n) => (
              <li key={n.id} className="flex gap-3">
                <div className={`size-2 mt-2 rounded-full ${n.unread ? "bg-primary" : "bg-border"}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm leading-snug">{n.text}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{n.time}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Quiz + Flashcards */}
      <section className="grid lg:grid-cols-2 gap-4">
        <div className="surface-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold flex items-center gap-2">
              <GraduationCap size={18} className="text-primary" /> Quiz cần làm
            </h3>
            <Link to="/quiz" className="text-sm text-primary font-medium">
              Tất cả →
            </Link>
          </div>
          <div className="space-y-2">
            {notebooks.slice(0, 3).map((nb) => (
              <div key={nb.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <div>
                  <div className="text-sm font-medium">{nb.title}</div>
                  <div className="text-xs text-muted-foreground">{nb.quizzes} quiz · cấp độ Medium</div>
                </div>
                <Link
                  to="/quiz/$id"
                  params={{ id: "q1" }}
                  className="px-3 h-8 inline-flex items-center rounded-lg bg-primary text-primary-foreground text-xs font-medium"
                >
                  Làm bài
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold flex items-center gap-2">
              <BookOpen size={18} className="text-coral" /> Flashcard mới
            </h3>
            <Link to="/flashcards" className="text-sm text-primary font-medium">
              Tất cả →
            </Link>
          </div>
          <div className="space-y-2">
            {decks.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <div>
                  <div className="text-sm font-medium">{d.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {d.mastered}/{d.cards} đã thuộc · {d.updated}
                  </div>
                </div>
                <Link
                  to="/flashcards/$id"
                  params={{ id: d.id }}
                  className="px-3 h-8 inline-flex items-center rounded-lg bg-coral text-white text-xs font-medium"
                >
                  Học
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}