"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState, Suspense, lazy } from "react";
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
  X,
  Medal,
  Crown,
  TrendingDown,
  Gem
} from "lucide-react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  Tooltip,
  Cell,
} from "recharts";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { notebooks, notifications, leaderboard, decks } from "../lib/mock-data";

const Spline = lazy(() => import("@splinetool/react-spline"));

// Removed DashboardPageProps

// stats array is moved inside the component to use `t`

const weekActivity = [
  { d: "T2", v: 12 },
  { d: "T3", v: 18 },
  { d: "T4", v: 9 },
  { d: "T5", v: 24 },
  { d: "T6", v: 16 },
  { d: "T7", v: 28 },
  { d: "CN", v: 21 },
];

// Giả lập dữ liệu mở rộng cho 3 mục đóng góp bên trong Hộp thoại Popup công thần
const mockContributions = {
  weekly: [
    { rank: 1, name: "Ngô Nhựt Minh", points: 65322, avatar: "NM", trending: "up" },
    { rank: 2, name: "Lê Trần Anh Khoa", points: 48105, avatar: "AK", trending: "up" },
    { rank: 3, name: "Trần Bích Trâm", points: 21780, avatar: "BT", trending: "down" },
    { rank: 4, name: "Brody Bennet", points: 19231, avatar: "B", trending: "up" },
    { rank: 5, name: "Anna Doe", points: 15322, avatar: "A", trending: "down" },
    { rank: 6, name: "Sam Kim", points: 15101, avatar: "S", trending: "up" },
    { rank: 7, name: "Lia Park", points: 12344, avatar: "L", trending: "down" },
  ],
  monthly: [
    { rank: 1, name: "Ngô Nhựt Minh", points: 98000, avatar: "NM", trending: "up" },
    { rank: 2, name: "Lê Trần Anh Khoa", points: 84000, avatar: "AK", trending: "up" },
    { rank: 3, name: "Trần Bích Trâm", points: 72000, avatar: "BT", trending: "up" },
    { rank: 4, name: "Brody Bennet", points: 59231, avatar: "B", trending: "up" },
    { rank: 5, name: "Anna Doe", points: 45322, avatar: "A", trending: "down" },
    { rank: 6, name: "Sam Kim", points: 35101, avatar: "S", trending: "down" },
    { rank: 7, name: "Lia Park", points: 22344, avatar: "L", trending: "down" },
  ],
  allTime: [
    { rank: 1, name: "Trần Bích Trâm", points: 452000, avatar: "BT", trending: "up" },
    { rank: 2, name: "Ngô Nhựt Minh", points: 418000, avatar: "NM", trending: "up" },
    { rank: 3, name: "Lê Trần Anh Khoa", points: 395000, avatar: "AK", trending: "up" },
    { rank: 4, name: "Brody Bennet", points: 219231, avatar: "B", trending: "down" },
    { rank: 5, name: "Anna Doe", points: 185322, avatar: "A", trending: "up" },
    { rank: 6, name: "Sam Kim", points: 165101, avatar: "S", trending: "up" },
    { rank: 7, name: "Lia Park", points: 142344, avatar: "L", trending: "down" },
  ]
};

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

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSplineReady, setIsSplineReady] = useState(false);

  // ── 🛠️ STATE ĐIỀU KHIỂN ĐÓNG MỞ MODAL & CHỌN 1 TRONG 3 MỤC ĐÓNG GÓP ──
  const [isContributorOpen, setIsContributorOpen] = useState(false);
  const [activeContribTab, setActiveContributorTab] = useState<"weekly" | "monthly" | "allTime">("weekly");

  const stats = [
    { label: t("dashboard.stats.notebook"), value: 5, icon: BookMarked, tint: "165" },
    { label: t("dashboard.stats.document"), value: 42, icon: FileText, tint: "200" },
    { label: t("dashboard.stats.aiQuery"), value: 128, icon: Bot, tint: "35" },
    { label: t("dashboard.stats.storage"), value: "1.2 GB", icon: HardDrive, tint: "75" },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Banner Chào mừng */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface-card gradient-hero p-6 lg:p-8 flex flex-col md:flex-row gap-6 items-center overflow-hidden relative min-h-[240px]"
      >
        <div className="flex-1 min-w-0 z-10 relative pointer-events-auto md:pr-[160px] text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Flame size={12} fill="currentColor" /> {t("dashboard.hero.streak")}
          </div>
          <h1 className="mt-3 text-3xl lg:text-4xl font-bold">
            {t("dashboard.hero.greeting")}
          </h1>
          <p className="mt-2 text-muted-foreground max-w-xl">
            {t("dashboard.hero.desc1")}<strong className="text-foreground font-semibold">3 quiz</strong>{t("dashboard.hero.desc2")}
            <strong className="text-foreground font-semibold">12 flashcard</strong>{t("dashboard.hero.desc3")}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={() => navigate("/chat")}
              className="inline-flex items-center gap-1.5 px-5 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 shadow-sm transition-all cursor-pointer"
            >
              <Bot size={16} /> {t("dashboard.hero.askAI")}
            </button>
            <button
              onClick={() => navigate("/notebooks")}
              className="inline-flex items-center gap-1.5 px-5 h-10 rounded-full bg-card border border-border text-sm font-medium hover:bg-muted shadow-sm transition-colors cursor-pointer"
            >
              {t("dashboard.hero.openNotebook")} <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <div className="absolute inset-0 w-full h-full z-0 pointer-events-auto select-none overflow-hidden">
          {!isSplineReady && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin opacity-40" />
            </div>
          )}

          <Suspense fallback={null}>
            <Spline
              scene="/robot-companion.splinecode"
              onLoad={(splineApp) => {
                setIsSplineReady(true);
                splineApp.setVariable("RobotSpeed", 9.5);
              }}
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
              <div className="text-2xl font-bold font-display text-left">
                <CountUp value={s.value} />
              </div>
              <div className="text-sm text-muted-foreground mt-0.5 text-left">{s.label}</div>
            </motion.div>
          );
        })}
      </section>

      {/* Chart + leaderboard */}
      <section className="grid lg:grid-cols-3 gap-4">
        <div className="surface-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="text-left">
              <h3 className="font-display text-lg font-semibold">{t("dashboard.chart.title")}</h3>
              <p className="text-xs text-muted-foreground">{t("dashboard.chart.subtitle")}</p>
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

        <div className="surface-card p-5 pb-0 relative overflow-hidden" style={{ backgroundColor: "#fffaf0" }}>
          {/* Sunburst Background */}
          <div className="absolute top-0 left-0 right-0 h-full pointer-events-none opacity-[0.35]" style={{ background: "repeating-conic-gradient(from 0deg at 50% 100%, transparent 0deg 15deg, #fcd34d 15deg 30deg)" }} />

          <div className="flex items-center justify-between mb-2 relative z-10">
            <h3 className="font-display text-[17px] font-bold text-slate-800">{t("dashboard.leaderboard.title")}</h3>
            <button
              onClick={() => setIsContributorOpen(true)}
              className="text-xs text-emerald-600 font-bold hover:underline inline-flex items-center gap-1.5 cursor-pointer bg-white/50 px-2 py-1 rounded-md"
            >
              <Trophy size={14} className="text-coral" /> {t("dashboard.leaderboard.details")}
            </button>
          </div>

          <div className="relative pt-6 pb-0 flex items-end justify-center gap-2 z-10 min-h-[180px] cursor-pointer" onClick={() => setIsContributorOpen(true)}>
            {/* Rank 2 */}
            {mockContributions.weekly[1] && (() => {
              const u = mockContributions.weekly[1];
              return (
                <div className="flex-1 flex flex-col items-center">
                  <div className="size-10 rounded-full border-[2px] border-[#3b82f6] bg-white text-[#3b82f6] flex items-center justify-center text-sm font-black shadow-sm z-10 mb-1.5">
                    {u.avatar}
                  </div>
                  <div className="w-full px-0.5 mb-1">
                    <div className="text-[10px] font-bold text-slate-800 text-center leading-tight truncate">{u.name.split(" ").slice(-2).join(" ")}</div>
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold mb-2 whitespace-nowrap">
                    {u.points.toLocaleString()} {t("dashboard.leaderboard.pts")}
                  </div>
                  {/* Bục #2 */}
                  <div className="w-full h-[85px] bg-[#f5b675] rounded-t-xl flex justify-center pt-2 shadow-[inset_0_4px_6px_rgba(255,255,255,0.4)] transition-transform hover:-translate-y-1">
                    <span className="text-white/90 font-black text-xl drop-shadow-sm">#2</span>
                  </div>
                </div>
              )
            })()}

            {/* Rank 1 */}
            {mockContributions.weekly[0] && (() => {
              const u = mockContributions.weekly[0];
              return (
                <div className="flex-[1.2] flex flex-col items-center">
                  <div className="size-[50px] rounded-full border-[2px] border-[#22c55e] bg-white text-[#22c55e] flex items-center justify-center text-lg font-black shadow-md z-10 mb-1.5 relative">
                    {u.avatar}
                  </div>
                  <div className="w-full px-0.5 mb-1">
                    <div className="text-[11px] font-bold text-slate-800 text-center leading-tight truncate">{u.name.split(" ").slice(-2).join(" ")}</div>
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold mb-2 whitespace-nowrap">
                    {u.points.toLocaleString()} {t("dashboard.leaderboard.pts")}
                  </div>
                  {/* Bục #1 */}
                  <div className="w-full h-[115px] bg-[#9bd16f] rounded-t-xl flex justify-center pt-2 shadow-[inset_0_4px_6px_rgba(255,255,255,0.4)] transition-transform hover:-translate-y-1">
                    <span className="text-white font-black text-[26px] leading-none drop-shadow-sm">#1</span>
                  </div>
                </div>
              )
            })()}

            {/* Rank 3 */}
            {mockContributions.weekly[2] && (() => {
              const u = mockContributions.weekly[2];
              return (
                <div className="flex-1 flex flex-col items-center">
                  <div className="size-10 rounded-full border-[2px] border-[#ef4444] bg-white text-[#ef4444] flex items-center justify-center text-sm font-black shadow-sm z-10 mb-1.5">
                    {u.avatar}
                  </div>
                  <div className="w-full px-0.5 mb-1">
                    <div className="text-[10px] font-bold text-slate-800 text-center leading-tight truncate">{u.name.split(" ").slice(-2).join(" ")}</div>
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold mb-2 whitespace-nowrap">
                    {u.points.toLocaleString()} {t("dashboard.leaderboard.pts")}
                  </div>
                  {/* Bục #3 */}
                  <div className="w-full h-[75px] bg-[#ec8c8b] rounded-t-xl flex justify-center pt-1.5 shadow-[inset_0_4px_6px_rgba(255,255,255,0.4)] transition-transform hover:-translate-y-1">
                    <span className="text-white/90 font-black text-xl drop-shadow-sm">#3</span>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      </section>

      {/* Notebooks + notifications */}
      <section className="grid lg:grid-cols-3 gap-4">
        <div className="surface-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold">{t("dashboard.notebooks.recent")}</h3>
            <button onClick={() => navigate("/notebooks")} className="text-sm text-primary font-medium cursor-pointer">
              {t("dashboard.notebooks.viewAll")}
            </button>
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
                <div onClick={() => navigate("/notebooks")} className="block p-4 rounded-xl border border-border hover:border-primary/40 hover:shadow-md transition-all bg-card cursor-pointer text-left">
                  <div
                    className="size-9 rounded-lg mb-3 grid place-items-center"
                    style={{ background: `oklch(0.55 0.14 ${nb.color} / 0.15)`, color: `oklch(0.45 0.14 ${nb.color})` }}
                  >
                    <BookMarked size={16} />
                  </div>
                  <div className="font-medium truncate">{nb.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {nb.docs} {t("dashboard.notebooks.docs")} · {nb.cards} {t("dashboard.notebooks.cards")} · {nb.updated}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="surface-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold">{t("dashboard.notifications.new")}</h3>
            <button onClick={() => navigate("/notifications")} className="text-sm text-primary font-medium cursor-pointer">
              {t("dashboard.notifications.viewAll")}
            </button>
          </div>
          <ul className="space-y-3 text-left">
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
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="surface-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold flex items-center gap-2">
              <GraduationCap size={18} className="text-primary" /> {t("dashboard.quiz.todo")}
            </h3>
            <button onClick={() => navigate("/quiz")} className="text-sm text-primary font-medium cursor-pointer">
              {t("dashboard.quiz.viewAll")}
            </button>
          </div>
          <div className="space-y-2 text-left">
            {notebooks.slice(0, 3).map((nb) => (
              <div key={nb.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <div>
                  <div className="text-sm font-medium">{nb.title}</div>
                  <div className="text-xs text-muted-foreground">{nb.quizzes} {t("dashboard.quiz.quizzes")} · {t("dashboard.quiz.level")} Medium</div>
                </div>
                <button
                  onClick={() => navigate("/quiz")}
                  className="px-3 h-8 inline-flex items-center rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer"
                >
                  {t("dashboard.quiz.doTest")}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold flex items-center gap-2">
              <BookOpen size={18} className="text-coral" /> {t("dashboard.flashcards.new")}
            </h3>
            <button onClick={() => navigate("/flashcards")} className="text-sm text-primary font-medium cursor-pointer">
              {t("dashboard.flashcards.viewAll")}
            </button>
          </div>
          <div className="space-y-2 text-left">
            {decks.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <div>
                  <div className="text-sm font-medium">{d.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {d.mastered}/{d.cards} {t("dashboard.flashcards.mastered")} · {d.updated}
                  </div>
                </div>
                <button
                  onClick={() => navigate("/flashcards")}
                  className="px-3 h-8 inline-flex items-center rounded-lg bg-coral text-white text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer"
                >
                  {t("dashboard.flashcards.study")}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 🏆 POPUP BẢNG VÀNG ĐÓNG GÓP 3 MỤC CHÍNH GIỮA MÀN HÌNH ── */}
      <AnimatePresence>
        {isContributorOpen && (
          <>
            {/* Lớp phủ mờ nền */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsContributorOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 cursor-default"
            />

            {/* Thùng chứa Modal */}
            <div className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none">
              <motion.div
                initial={{ scale: 0.96, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0, y: 15 }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
                className="pointer-events-auto w-full max-w-md bg-[#fffaf0] border border-slate-200 shadow-2xl rounded-3xl flex flex-col max-h-[85vh] overflow-hidden text-left relative"
              >
                {/* Sunburst Background */}
                <div className="absolute top-0 left-0 right-0 h-[450px] pointer-events-none opacity-[0.35]" style={{ background: "repeating-conic-gradient(from 0deg at 50% 100%, transparent 0deg 15deg, #fcd34d 15deg 30deg)" }} />

                {/* Close Button */}
                <button
                  onClick={() => setIsContributorOpen(false)}
                  className="absolute -right-1 -top-1 md:right-4 md:top-4 z-50 grid h-8 w-8 place-items-center rounded-full bg-white text-slate-600 shadow-md transition hover:text-slate-900 hover:scale-105 cursor-pointer border border-slate-100"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>

                <div className="pt-6 px-6 pb-2 relative z-20">
                  <h2 className="text-[26px] font-black text-slate-900 tracking-tight">Leaderboard</h2>
                </div>

                {/* Tabs */}
                <div className="flex p-1.5 bg-white/60 backdrop-blur-md rounded-xl mx-5 mt-1 border border-slate-200/50 gap-1 shrink-0 z-20 relative shadow-sm">
                  {[
                    { id: "weekly", label: t("dashboard.leaderboard.weekly") },
                    { id: "monthly", label: t("dashboard.leaderboard.monthly") },
                    { id: "allTime", label: t("dashboard.leaderboard.allTime") }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveContributorTab(tab.id as any)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${activeContribTab === tab.id
                        ? "bg-white text-slate-900 shadow-sm border border-slate-100/50"
                        : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {/* Podium Section */}
                  <div className="relative pt-6 pb-0 flex items-end justify-center gap-2 px-4 z-10 min-h-[250px]">
                    {/* Rank 2 */}
                    {mockContributions[activeContribTab][1] && (() => {
                      const u = mockContributions[activeContribTab][1];
                      return (
                        <div className="flex-1 flex flex-col items-center">
                          <div className="size-14 rounded-full border-[3px] border-[#3b82f6] bg-white text-[#3b82f6] flex items-center justify-center text-xl font-black shadow-md z-10 mb-2">
                            {u.avatar}
                          </div>
                          <div className="w-full px-0.5 mb-1.5">
                            <div className="text-[11px] font-bold text-slate-800 text-center leading-tight line-clamp-2">{u.name}</div>
                          </div>
                          <div className="flex items-center gap-1 bg-white border border-[#3b82f6] text-[#3b82f6] px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm mb-3 z-10 whitespace-nowrap">
                            <Gem size={10} className="fill-[#3b82f6]" /> {u.points.toLocaleString()}
                          </div>
                          <div className="w-full h-[95px] bg-[#f5b675] rounded-t-2xl flex justify-center pt-3 shadow-[inset_0_4px_6px_rgba(255,255,255,0.4)]">
                            <span className="text-white/90 font-black text-3xl drop-shadow-sm">#2</span>
                          </div>
                        </div>
                      )
                    })()}

                    {/* Rank 1 */}
                    {mockContributions[activeContribTab][0] && (() => {
                      const u = mockContributions[activeContribTab][0];
                      return (
                        <div className="flex-[1.2] flex flex-col items-center">
                          <div className="size-[68px] rounded-full border-[3px] border-[#22c55e] bg-white text-[#22c55e] flex items-center justify-center text-2xl font-black shadow-md z-10 mb-2 relative">
                            {u.avatar}
                          </div>
                          <div className="w-full px-0.5 mb-1.5">
                            <div className="text-[12px] font-bold text-slate-800 text-center leading-tight line-clamp-2">{u.name}</div>
                          </div>
                          <div className="flex items-center gap-1 bg-white border border-[#22c55e] text-[#22c55e] px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-sm mb-3 z-10 whitespace-nowrap">
                            <Gem size={10} className="fill-[#22c55e]" /> {u.points.toLocaleString()}
                          </div>
                          <div className="w-full h-[140px] bg-[#9bd16f] rounded-t-2xl flex justify-center pt-4 shadow-[inset_0_4px_6px_rgba(255,255,255,0.4)]">
                            <span className="text-white font-black text-[40px] leading-none drop-shadow-sm">#1</span>
                          </div>
                        </div>
                      )
                    })()}

                    {/* Rank 3 */}
                    {mockContributions[activeContribTab][2] && (() => {
                      const u = mockContributions[activeContribTab][2];
                      return (
                        <div className="flex-1 flex flex-col items-center">
                          <div className="size-14 rounded-full border-[3px] border-[#ef4444] bg-white text-[#ef4444] flex items-center justify-center text-xl font-black shadow-md z-10 mb-2">
                            {u.avatar}
                          </div>
                          <div className="w-full px-0.5 mb-1.5">
                            <div className="text-[11px] font-bold text-slate-800 text-center leading-tight line-clamp-2">{u.name}</div>
                          </div>
                          <div className="flex items-center gap-1 bg-white border border-[#ef4444] text-[#ef4444] px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm mb-3 z-10 whitespace-nowrap">
                            <Gem size={10} className="fill-[#ef4444]" /> {u.points.toLocaleString()}
                          </div>
                          <div className="w-full h-[80px] bg-[#ec8c8b] rounded-t-2xl flex justify-center pt-2 shadow-[inset_0_4px_6px_rgba(255,255,255,0.4)]">
                            <span className="text-white/90 font-black text-3xl drop-shadow-sm">#3</span>
                          </div>
                        </div>
                      )
                    })()}
                  </div>

                  {/* List Section for #4, #5... */}
                  <div className="px-5 pb-6 space-y-3 relative z-10">
                    {mockContributions[activeContribTab].slice(3).map((u) => (
                      <div key={u.rank} className="flex items-center gap-3.5 bg-white py-2.5 px-4 rounded-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100 transition-transform hover:scale-[1.02]">
                        <span className="text-sm font-black text-slate-700 w-5">#{u.rank}</span>
                        <div className="size-10 shrink-0 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center text-sm font-black shadow-sm">
                          {u.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-slate-800 truncate">{u.name}</div>
                          <div className="flex items-center gap-1 text-[#3b82f6] text-[11px] font-bold mt-0.5">
                            <Gem size={11} className="fill-[#3b82f6]/20" /> {u.points.toLocaleString()}
                          </div>
                        </div>
                        <div className="shrink-0">
                          {u.trending === "up" ? (
                            <TrendingUp size={20} className="text-[#22c55e]" strokeWidth={2.5} />
                          ) : (
                            <TrendingDown size={20} className="text-[#ef4444]" strokeWidth={2.5} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}