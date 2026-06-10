"use client";

import {
  useState,
  useRef,
  useEffect,
  Suspense,
  lazy,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { BarChart, Bar, ResponsiveContainer, XAxis, Cell } from "recharts";
import {
  Home, FileText, Bot, GraduationCap, BookOpen,
  Bell, Gem, Coins, HardDrive, MessageSquare, Clock,
  Flame, Award, Heart, BookMarked, Library, ChevronRight, Trophy,
  Plus, Search, TrendingUp, TrendingDown, User, LogOut, X
} from "lucide-react";

import { FloatingDock } from "../ui/floating-dock";
import "./Dashboard.css";
import AIAssistant from "./AIAssistant";
import Documents from "./Documents";
import Profile from "./Profile/Profile";
import { AIChat } from "./AIChat/Aichat";
import NotificationsPage from "./NotificationsPage";
import QuizPage from "./QuizPage";
import FlashcardPage from "./FlashcardPage";
import { GooeyInput } from "../ui/gooey-input";
import { LeaderboardModal } from "./LeaderboardModal";
const Spline = lazy(() => import("@splinetool/react-spline"));

interface DashboardProps {
  onLogout: () => void;
}

const robotMind = new URL('../../assets/robot-mind.png', import.meta.url).href;
const robotFocus = new URL('../../assets/robot-focus.png', import.meta.url).href;

const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const sidebarVariants = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 70, damping: 18 },
  },
};

const headerVariants = {
  hidden: { opacity: 0, y: -30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 80, damping: 17 },
  },
};

// Hook count-up dùng cho các chỉ số thống kê
function useCountUp(ref: React.RefObject<any>, target: string, duration = 1.8) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const numStr = target.replace(/[^0-9.]/g, "");
    const endVal = parseFloat(numStr);
    if (isNaN(endVal)) {
      el.textContent = target;
      return;
    }

    const suffix = target.replace(/[0-9,.\s]/g, "");
    const hasCommas = target.includes(",");
    const decimals = numStr.includes(".") ? numStr.split(".")[1].length : 0;

    const obj = { val: 0 };
    gsap.to(obj, {
      val: endVal,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        let formatted = obj.val.toFixed(decimals);
        if (hasCommas) {
          formatted = Number(formatted).toLocaleString("en-US", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          });
        }
        el.textContent = formatted + suffix;
      },
    });
  }, [ref, target, duration]);
}

const navItems = [
  { icon: Home, label: "Home" },
  { icon: FileText, label: "Documents" },
  { icon: Bot, label: "AI Chat" },
  { icon: GraduationCap, label: "Courses" },
  { icon: BookOpen, label: "Quiz" },
  { icon: BookMarked, label: "Flashcards" },
];

function Sidebar({ active, setActive }: { active: number; setActive: (i: number) => void }) {
  return (
    <motion.div className="dh-sidebar" variants={sidebarVariants as any}>
      <div className="dh-logo" onClick={() => setActive(0)} style={{ cursor: "pointer" }}>AI</div>
      <nav className="dh-nav" style={{ position: "relative" }}>
        {navItems.map((it, i) => {
          const Icon = it.icon;
          return (
            <motion.button
              key={it.label}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActive(i)}
              className={`dh-nav-btn ${active === i ? "active" : ""}`}
              aria-label={it.label}
            >
              {active === i && (
                <motion.div
                  layoutId="activeNavIndicator"
                  className="dh-nav-indicator"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon size={20} style={{ position: "relative", zIndex: 2 }} />
            </motion.button>
          );
        })}
      </nav>
    </motion.div>
  );
}

const dropdownVariants = {
  hidden: { opacity: 0, y: -10, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.97 },
};

function Header({ onLogout, setActive }: { onLogout: () => void; setActive: (i: number) => void }) {
  const [showNoti, setShowNoti] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [notifications, setNotifications] = useState([
    { id: 1, text: "🤖 AI vừa tóm tắt xong tài liệu 'Calculus II'", time: "5 phút trước", unread: true },
    { id: 2, text: "🔥 Bạn vừa duy trì được Chuỗi học tập 5 ngày!", time: "2 giờ trước", unread: true },
    { id: 3, text: "🏆 Jack Nicklson vừa vượt qua bạn trên Leaderboard", time: "1 ngày trước", unread: false },
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  return (
    <motion.header className="dh-header" variants={headerVariants as any} style={{ position: "relative" }}>
      <h1 className="dh-title">
        Dashboard
        <small>Welcome back, Khoa — let's keep learning </small>
      </h1>

      <div
        className="dh-search-container"
        style={{
          marginLeft: "24px",
          marginRight: "auto",
          minWidth: "110px"

        }}
      >
        <GooeyInput
          placeholder="Tìm kiếm tài liệu, quiz, flashcard..."
          value={searchQuery}
          onValueChange={setSearchQuery}
          collapsedWidth={210}
          expandedWidth={380}
          expandedOffset={45}
        />
      </div>

      <div className="dh-header-right">
        <div className="dh-pill">
          <span className="dh-pill-item" style={{ color: "#ef4444", fontWeight: "bold" }}><Flame size={16} fill="#ef4444" /> 5 Days</span>
          <span className="dh-pill-item" style={{ color: "#0ea5e9" }}><Gem size={16} /> 144</span>
          <span className="dh-pill-item" style={{ color: "#f59e0b" }}><Coins size={16} /> 2,321</span>
        </div>

        <div style={{ position: "relative" }}>
          <button
            className="dh-bell"
            aria-label="Notifications"
            onClick={() => {
              setShowNoti(!showNoti);
              setShowAvatarMenu(false);
            }}
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="dh-noti-badge">{unreadCount}</span>}
          </button>

          <AnimatePresence>
            {showNoti && (
              <motion.div
                className="dh-dropdown dh-noti-dropdown"
                key="noti-dropdown"
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <div className="dh-dropdown-header">
                  <h3>Thông báo mới</h3>
                  {unreadCount > 0 && <button onClick={markAllAsRead}>Đọc tất cả</button>}
                </div>
                <div className="dh-dropdown-list">
                  {notifications.length === 0 ? (
                    <div className="dh-dropdown-empty">Không có thông báo nào</div>
                  ) : (
                    notifications.map((n: any) => (
                      <div key={n.id} className={`dh-noti-item ${n.unread ? "unread" : ""}`}>
                        <p className="dh-noti-text">{n.text}</p>
                        <span className="dh-noti-time">{n.time}</span>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ position: "relative" }}>
          <div
            className="dh-avatar"
            style={{ cursor: "pointer" }}
            onClick={() => {
              setShowAvatarMenu(!showAvatarMenu);
              setShowNoti(false);
            }}
          >
            M
          </div>

          <AnimatePresence>
            {showAvatarMenu && (
              <motion.div
                className="dh-dropdown dh-avatar-dropdown"
                key="avatar-dropdown"
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <div className="dh-user-info">
                  <strong>Anh Khoa</strong>
                  <span>anhkhoa@fpt.edu.vn</span>
                </div>
                <hr />

                <button
                  className="dh-dropdown-item"
                  style={{
                    display: "flex", alignItems: "center", gap: "8px", width: "100%",
                    background: "none", border: "none", padding: "10px 12px",
                    fontSize: "14px", color: "#334155", cursor: "pointer",
                    textAlign: "left", borderRadius: "6px"
                  }}
                  onClick={() => {
                    setActive(6);
                    setShowAvatarMenu(false);
                  }}
                >
                  <User size={16} />
                  <span>Thông tin tài khoản</span>
                </button>

                <button className="dh-logout-btn" onClick={onLogout}>
                  <LogOut size={16} />
                  <span>Đăng xuất</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
}

const statCards = [
  { label: "Tổng tài liệu", value: "128", icon: FileText, bg: "bg-blue" },
  { label: "Số môn học", value: "12", icon: BookOpen, bg: "bg-purple" },
  { label: "Dung lượng", value: "8.4GB", icon: HardDrive, bg: "bg-pink" },
  { label: "Lượt hỏi AI", value: "2,341", icon: MessageSquare, bg: "bg-yellow" },
  { label: "Tài liệu gần đây", value: "14", icon: Clock, bg: "bg-mint" },
];

function StatCard({ card }: { card: typeof statCards[number] }) {
  const valRef = useRef<HTMLDivElement>(null);
  const Icon = card.icon;
  useCountUp(valRef, card.value);

  return (
    <motion.div whileHover={{ y: -6 }} className={`dh-stat ${card.bg}`}>
      <div className="dh-stat-icon"><Icon size={18} /></div>
      <div className="dh-stat-label">{card.label}</div>
      <div className="dh-stat-value" ref={valRef}>0</div>
    </motion.div>
  );
}

function DashboardCards() {
  return (
    <motion.div
      className="dh-stats"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      {statCards.map((c) => (
        <StatCard key={c.label} card={c} />
      ))}
    </motion.div>
  );
}

interface RobotProps {
  tag: string; name: string; desc: string;
  image: string; splineUrl?: string; bg: string;
  gems: number; coins: number; floatDelay?: number;
}

function RobotCard({ tag, name, desc, image, splineUrl, bg, gems, coins, floatDelay = 0 }: RobotProps) {
  const [splineLoaded, setSplineLoaded] = useState(false);
  const showSpline = !!splineUrl;

  return (
    <div className={`dh-robot ${bg}`}>
      <div className="dh-robot-badges">
        <span className="dh-chip" style={{ color: "#0ea5e9" }}><Gem size={12} /> +{gems}</span>
        <span className="dh-chip" style={{ color: "#f59e0b" }}><Coins size={12} /> +{coins}</span>
      </div>
      <div className="dh-robot-fire"><Flame size={16} color="#f97316" /></div>
      <div className="dh-robot-body">
        {showSpline ? (
          <div className="dh-robot-spline-wrapper">
            {!splineLoaded && (
              <div className="dh-spline-loader">
                <div className="dh-spinner" />
                <span>Loading 3D...</span>
              </div>
            )}
            <Suspense fallback={null}>
              <Spline
                scene={splineUrl}
                onLoad={() => setSplineLoaded(true)}
                style={{
                  width: 130, height: 130,
                  opacity: splineLoaded ? 1 : 0,
                  transition: "opacity 0.4s ease",
                }}
              />
            </Suspense>
          </div>
        ) : (
          <motion.img
            src={image} alt={name} className="dh-robot-img" loading="lazy"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: floatDelay }}
          />
        )}
        <div className="dh-robot-text">
          <div className="dh-robot-tag">{tag}</div>
          <h3 className="dh-robot-name">{name}</h3>
          <p className="dh-robot-desc">{desc}</p>
        </div>
      </div>
    </div>
  );
}

const chartData = [
  { m: "Sep", v: 22 }, { m: "Sep", v: 28 }, { m: "Oct", v: 24 }, { m: "Oct", v: 30 },
  { m: "Nov", v: 36 }, { m: "Nov", v: 32 }, { m: "Dec", v: 42 }, { m: "Dec", v: 48 },
  { m: "Jan", v: 52 }, { m: "Jan", v: 58 }, { m: "Feb", v: 62 }, { m: "Feb", v: 70 },
];

function StudyProgress() {
  return (
    <motion.div
      className="dh-panel"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      style={{ background: "linear-gradient(180deg,#f5faff 0%, #fff 100%)" }}
    >
      <div className="dh-chart-head">
        <div>
          <h3 className="dh-panel-title" style={{ marginBottom: 8 }}>Study Success</h3>
          <div className="dh-chart-meta">
            <span className="pct">78%</span>
            <span className="delta"><TrendingUp size={10} style={{ marginRight: 2 }} />+2.3%</span>
          </div>
        </div>
        <button className="dh-learnmore">Learn more</button>
      </div>
      <div style={{ height: 150 }}>
        <ResponsiveContainer>
          <BarChart data={chartData} barCategoryGap={4}>
            <XAxis dataKey="m" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <Bar dataKey="v" radius={[6, 6, 6, 6]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={i >= chartData.length - 3 ? "#1e3a5f" : "#cbd5e1"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

const badges = [
  { label: "Book Explorer", icon: BookMarked, bg: "var(--pink)", color: "#be185d" },
  { label: "Heart of Reader", icon: Heart, bg: "var(--blue)", color: "#0369a1" },
  { label: "Rainbow Reader", icon: Award, bg: "var(--coral)", color: "#c2410c" },
  { label: "Reading Passion", icon: Library, bg: "var(--mint)", color: "#15803d" },
];

const challenges = [
  { title: "Deep Focus", sub: "Extra challenge", icon: GraduationCap, bg: "bg-blue", reward: 250, gems: 0 },
  { title: "Day 10/32", sub: "Daily challenge", icon: Trophy, bg: "bg-yellow", reward: 200, gems: 5 },
  { title: "Java Master", sub: "Course challenge", icon: Flame, bg: "bg-coral", reward: 320, gems: 0 },
];

function AIUsagePanel() {
  return (
    <motion.div
      className="dh-panel"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="dh-panel-head">
        <h3 className="dh-panel-title">Badges <span className="dh-count">8</span></h3>
        <span className="dh-link">View all <ChevronRight size={14} /></span>
      </div>
      <div className="dh-badges-row" style={{ marginBottom: 24 }}>
        {badges.map((b) => {
          const Icon = b.icon;
          return (
            <motion.div key={b.label} whileHover={{ y: -4 }} className="dh-badge">
              <div className="dh-badge-circle" style={{ background: b.bg, color: b.color }}>
                <Icon size={22} />
              </div>
              <span>{b.label}</span>
            </motion.div>
          );
        })}
      </div>
      <div className="dh-panel-head">
        <h3 className="dh-panel-title">Challenges <span className="dh-count">12</span></h3>
        <span className="dh-link">View all <ChevronRight size={14} /></span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {challenges.map((c) => {
          const Icon = c.icon;
          return (
            <motion.div key={c.title} whileHover={{ x: 4 }} className={`dh-challenge ${c.bg}`}>
              <div className="dh-challenge-icon"><Icon size={20} /></div>
              <div className="dh-challenge-body">
                <div className="dh-challenge-title">{c.title}</div>
                <div className="dh-challenge-sub">{c.sub}</div>
              </div>
              <div className="dh-challenge-rewards">
                {c.gems > 0 && <span className="dh-chip" style={{ color: "#0ea5e9" }}><Gem size={11} /> +{c.gems}</span>}
                <span className="dh-chip" style={{ color: "#f59e0b" }}><Coins size={11} /> +{c.reward}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

const categories = [
  { label: "Ethics", emoji: "🛡️", bg: "bg-coral" },
  { label: "Technology", emoji: "⚙️", bg: "bg-purple" },
  { label: "History", emoji: "🌍", bg: "bg-mint" },
  { label: "Science", emoji: "🔬", bg: "bg-blue" },
];

const docs = [
  { title: "Neural Networks — Lecture 04.pdf", sub: "Deep Learning", color: "#0369a1", bg: "var(--blue)" },
  { title: "World History Notes Chapter 12.pdf", sub: "History", color: "#15803d", bg: "var(--mint)" },
  { title: "Ethics in AI — Research Paper.pdf", sub: "Philosophy", color: "#c2410c", bg: "var(--coral)" },
  { title: "Calculus II Final Cheatsheet.pdf", sub: "Mathematics", color: "#be185d", bg: "var(--pink)" },
];

function RecentDocuments() {
  return (
    <motion.div
      className="dh-panel"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="dh-panel-head">
        <h3 className="dh-panel-title">Select Category <span className="dh-count">34</span></h3>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="dh-icon-btn"><Plus size={16} /></button>
          <button className="dh-icon-btn"><Search size={16} /></button>
        </div>
      </div>
      <div className="dh-cats">
        {categories.map((c) => (
          <motion.div key={c.label} whileHover={{ y: -3 }} className={`dh-cat ${c.bg}`}>
            <span className="dh-cat-emoji">{c.emoji}</span>
            <span>{c.label}</span>
          </motion.div>
        ))}
      </div>
      <h3 className="dh-panel-title" style={{ marginBottom: 10 }}>Recent Documents</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {docs.map((d) => (
          <div key={d.title} className="dh-doc">
            <div className="dh-doc-icon" style={{ background: d.bg, color: d.color }}>
              <FileText size={20} />
            </div>
            <div className="dh-doc-body">
              <div className="dh-doc-title">{d.title}</div>
              <div className="dh-doc-sub">
                <span>{d.sub}</span> · <span>2h ago</span>
                <span className="dh-doc-ai-badge">AI Summarized</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

const top3 = [
  { name: "Jack Nicklson", score: "48,105", color: "#0ea5e9", initial: "J" },
  { name: "Brody Bellson", score: "65,322", color: "#16a34a", initial: "B" },
  { name: "Timoty Bell", score: "21,780", color: "#ef4444", initial: "T" },
];

const rest = [
  { rank: 4, name: "Brody Bennet", pts: "19,231", trend: "up" as const },
  { rank: 5, name: "Anna Doe", pts: "15,322", trend: "down" as const },
  { rank: 6, name: "Sam Kim", pts: "15,101", trend: "up" as const },
  { rank: 7, name: "Lia Park", pts: "13,899", trend: "down" as const },
  { rank: 8, name: "Theo Vance", pts: "12,456", trend: "down" as const },
];

function Leaderboard() {
  return (
    <motion.div
      className="dh-leader-panel"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="dh-leader-rays" />
      <h2 className="dh-leader-title">Leaderboard</h2>
      <div className="dh-podium">
        <div className="dh-podium-col">
          <div className="dh-podium-avatar" style={{ borderColor: top3[0].color, background: "#d9ecff" }}>{top3[0].initial}</div>
          <div className="dh-podium-name">{top3[0].name}</div>
          <div className="dh-podium-score" style={{ borderColor: top3[0].color, color: top3[0].color }}><Gem size={10} />{top3[0].score}</div>
          <div className="dh-podium-block silver">#2</div>
        </div>
        <div className="dh-podium-col">
          <div className="dh-podium-avatar" style={{ borderColor: top3[1].color, background: "#ddf9d8", width: 64, height: 64 }}>{top3[1].initial}</div>
          <div className="dh-podium-name">{top3[1].name}</div>
          <div className="dh-podium-score" style={{ borderColor: top3[1].color, color: top3[1].color }}><Gem size={10} />{top3[1].score}</div>
          <div className="dh-podium-block gold">#1</div>
        </div>
        <div className="dh-podium-col">
          <div className="dh-podium-avatar" style={{ borderColor: top3[2].color, background: "#ffddf2" }}>{top3[2].initial}</div>
          <div className="dh-podium-name">{top3[2].name}</div>
          <div className="dh-podium-score" style={{ borderColor: top3[2].color, color: top3[2].color }}><Gem size={10} />{top3[2].score}</div>
          <div className="dh-podium-block bronze">#3</div>
        </div>
      </div>
      <div className="dh-leader-list">
        {rest.map((r) => (
          <div key={r.rank} className="dh-leader-row">
            <span className="dh-leader-rank">#{r.rank}</span>
            <div className="dh-leader-avatar">{r.name[0]}</div>
            <div style={{ flex: 1 }}>
              <div className="dh-leader-name">{r.name}</div>
              <span className="dh-leader-pts"><Gem size={10} color="#0ea5e9" />{r.pts}</span>
            </div>
            <span className={`dh-leader-trend ${r.trend}`}>
              {r.trend === "up" ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
function HomeContent({ onLogout, setActive }: { onLogout: () => void; setActive: (i: number) => void }) {
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  return (
    <>
      <Header onLogout={onLogout} setActive={setActive} />
      <DashboardCards />

      <div style={{ height: 24 }} />

      <div className="dh-grid">
        <div className="dh-col-left">
          <motion.div
            className="dh-robots"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <RobotCard
              tag="Mind Unlocked"
              name="Mind Explorer"
              desc="A deep dive into thoughts, emotions and AI-assisted learning."
              image={robotMind}
              splineUrl=""
              bg="bg-yellow"
              gems={5}
              coins={145}
            />
            <RobotCard
              tag="Focus Boost"
              name="Deep Focus AI"
              desc="Personalized concentration coaching for long study sessions."
              image={robotFocus}
              splineUrl=""
              bg="bg-blue"
              gems={0}
              coins={0}
              floatDelay={0.6}
            />
          </motion.div>

          <div className="dh-two-col">
            <StudyProgress />
            <AIUsagePanel />
          </div>

          <RecentDocuments />
        </div>

        <div className="dh-col-right" onClick={() => setIsLeaderboardOpen(true)} style={{ cursor: "pointer" }}>
          <Leaderboard />
        </div>
      </div>

      {/* Modal Leaderboard */}
      <LeaderboardModal isOpen={isLeaderboardOpen} onClose={() => setIsLeaderboardOpen(false)}>
        <Leaderboard />
      </LeaderboardModal>
    </>
  );
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [active, setActive] = useState(0);

  const dockItems = [
    { title: "Home", icon: <Home />, onClick: () => setActive(0) },
    { title: "Documents", icon: <FileText />, onClick: () => setActive(1) }, // Lưu ý vị trí này
    { title: "AI Chat", icon: <Bot />, onClick: () => setActive(2) },
    { title: "Courses", icon: <GraduationCap />, onClick: () => setActive(3) },
    { title: "Quiz", icon: <BookOpen />, onClick: () => setActive(4) },      // Vị trí này
    { title: "Flashcards", icon: <BookMarked />, onClick: () => setActive(5) },
  ];
  const renderByActive = () => {
    switch (active) {
      case 0: return <HomeContent onLogout={onLogout} setActive={setActive} />;
      case 1: return <Documents />;
      case 2: return <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}><AIChat /></div>;
      case 3: return <NotificationsPage />;
      case 4: return <QuizPage />;
      case 5: return <FlashcardPage />;
      case 6: return <Profile onBack={() => setActive(0)} />;
      default: return <div style={{ padding: "32px", textAlign: "center" }}><h2>Coming soon</h2></div>;
    }
  };

  return (
    <div className="dh-root">
      <motion.div
        className="dh-shell"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        style={{ paddingLeft: "24px", paddingRight: "24px" }} // Bỏ padding dành cho sidebar
      >
        <main className="dh-main" aria-live="polite">
          {renderByActive()}
        </main>
      </motion.div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <FloatingDock items={dockItems} />
      </div>

      {active !== 2 && active !== 4 && active !== 5 && active !== 6 && <AIAssistant />}
    </div>
  );
}