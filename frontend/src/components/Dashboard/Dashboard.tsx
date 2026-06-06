import "./Dashboard.css";
import AIAssistant from "./AIAssistant";
import Documents from "./Documents";
import Profile from "./Profile/Profile"; // 🎯 Import component Profile
// 🎯 Import component AIChat
import { AIChat } from "./AIChat/Aichat";
import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, ResponsiveContainer, XAxis, Cell } from "recharts";
import {
  Home, FileText, Bot, GraduationCap, Settings, LogOut,
  Bell, Gem, Coins, BookOpen, HardDrive, MessageSquare, Clock,
  Flame, Award, Heart, BookMarked, Library, ChevronRight, Trophy,
  Plus, Search, TrendingUp, TrendingDown, User
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";

interface DashboardProps {
  onLogout: () => void;
}

const robotMind = new URL('../../assets/robot-mind.png', import.meta.url).href;
const robotFocus = new URL('../../assets/robot-focus.png', import.meta.url).href;

/* ==========================================================================
   ✨ CONFIG ANIMATION VARIANTS FOR LAYOUT SHELL
   ========================================================================== */
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

/* ---------- SIDEBAR ---------- */
const navItems = [
  { icon: Home, label: "Home" },
  { icon: FileText, label: "Documents" },
  { icon: Bot, label: "AI Chat" },
  { icon: GraduationCap, label: "Courses" },
];

function Sidebar({ active, setActive }: { active: number; setActive: (i: number) => void }) {
  return (
    <motion.div className="dh-sidebar" variants={sidebarVariants as any}>
      <div className="dh-logo" onClick={() => setActive(0)} style={{ cursor: "pointer" }}>AI</div>
      <nav className="dh-nav">
        {navItems.map((it, i) => {
          const Icon = it.icon;
          return (
            <motion.button
              key={it.label}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActive(i)}
              className={`dh-nav-btn ${active === i ? "active" : ""}`}
              aria-label={it.label}
            >
              <Icon size={20} />
            </motion.button>
          );
        })}
      </nav>
      {/* 🛠️ CODER FIX: Đã loại bỏ hoàn toàn nút Settings cơ đơn ở góc dưới này để làm sạch diện tích Sidebar */}
    </motion.div>
  );
}

/* ---------- HEADER WITH DROPDOWNS ---------- */
function Header({ onLogout, setActive }: { onLogout: () => void; setActive: (i: number) => void }) {
  const [showNoti, setShowNoti] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);

  // ── Lấy thông tin user thực từ authStore ──────────────────────────────
  const { user } = useAuthStore();
  const displayName = user?.fullName ?? "Người dùng";
  const displayEmail = user?.email ?? "";
  // Lấy chữ cái đầu của tên để hiển thị avatar
  const avatarInitial = displayName.trim().charAt(0).toUpperCase();

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
        <small>Chào mừng trở lại, {displayName} — hãy tiếp tục học nhé ✨</small>
      </h1>

      <div className="dh-header-right">
        {/* 🚀 UX FEATURE ENHANCEMENT: Thêm ngọn lửa Streak (Chuỗi học tập) vào thanh điểm số */}
        <div className="dh-pill">
          <span className="dh-pill-item" style={{ color: "#ef4444", fontWeight: "bold" }}><Flame size={16} fill="#ef4444" /> 5 Days</span>
          <span className="dh-pill-item" style={{ color: "#0ea5e9" }}><Gem size={16} /> 144</span>
          <span className="dh-pill-item" style={{ color: "#f59e0b" }}><Coins size={16} /> 2,321</span>
        </div>

        {/* --- NÚT NOTIFICATION --- */}
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

          {showNoti && (
            <div className="dh-dropdown dh-noti-dropdown">
              <div className="dh-dropdown-header">
                <h3>Thông báo mới</h3>
                {unreadCount > 0 && <button onClick={markAllAsRead}>Đọc tất cả</button>}
              </div>
              <div className="dh-dropdown-list">
                {notifications.length === 0 ? (
                  <div className="dh-dropdown-empty">Không có thông báo nào</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`dh-noti-item ${n.unread ? "unread" : ""}`}>
                      <p className="dh-noti-text">{n.text}</p>
                      <span className="dh-noti-time">{n.time}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* --- NÚT AVATAR – Hiển thị chữ cái đầu tên user --- */}
        <div style={{ position: "relative" }}>
          <div
            className="dh-avatar"
            style={{ cursor: "pointer" }}
            onClick={() => {
              setShowAvatarMenu(!showAvatarMenu);
              setShowNoti(false);
            }}
          >
            {avatarInitial}
          </div>

          {showAvatarMenu && (
            <div className="dh-dropdown dh-avatar-dropdown">
              <div className="dh-user-info">
                <strong>{displayName}</strong>
                <span>{displayEmail}</span>
              </div>
              <hr />

              {/* Nút thông tin tài khoản */}
              <button
                className="dh-dropdown-item"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  background: "none",
                  border: "none",
                  padding: "10px 12px",
                  fontSize: "14px",
                  color: "#334155",
                  cursor: "pointer",
                  textAlign: "left",
                  borderRadius: "6px"
                }}
                onClick={() => {
                  setActive(4);
                  setShowAvatarMenu(false);
                }}
              >
                <User size={16} />
                <span>Thông tin tài khoản</span>
              </button>

              {/* 🛠️ CODER MOVE: Đã chuyển đổi nút Cài đặt hệ thống lên đây */}
              <button
                className="dh-dropdown-item"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  background: "none",
                  border: "none",
                  padding: "10px 12px",
                  fontSize: "14px",
                  color: "#334155",
                  cursor: "pointer",
                  textAlign: "left",
                  borderRadius: "6px"
                }}
                onClick={() => {
                  setActive(5); // Chuyển đổi trạng thái màn hình sang tab Cài đặt (index 5)
                  setShowAvatarMenu(false);
                }}
              >
                <Settings size={16} />
                <span>Cài đặt cấu hình</span>
              </button>

              <button className="dh-logout-btn" onClick={onLogout}>
                <LogOut size={16} />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
}

/* ---------- STAT CARDS ---------- */
const statCards = [
  { label: "Tổng tài liệu", value: "128", icon: FileText, bg: "bg-blue" },
  { label: "Số môn học", value: "12", icon: BookOpen, bg: "bg-purple" },
  { label: "Dung lượng", value: "8.4GB", icon: HardDrive, bg: "bg-pink" },
  { label: "Lượt hỏi AI", value: "2,341", icon: MessageSquare, bg: "bg-yellow" },
  { label: "Tài liệu gần đây", value: "14", icon: Clock, bg: "bg-mint" },
];

function DashboardCards() {
  return (
    <motion.div
      className="dh-stats"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      {statCards.map((c) => {
        const Icon = c.icon;
        return (
          <motion.div key={c.label} whileHover={{ y: -6 }} className={`dh-stat ${c.bg}`}>
            <div className="dh-stat-icon"><Icon size={18} /></div>
            <div className="dh-stat-label">{c.label}</div>
            <div className="dh-stat-value">{c.value}</div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

/* ---------- ROBOT CARD ---------- */
interface RobotProps {
  tag: string; name: string; desc: string; image: string; bg: string;
  gems: number; coins: number; floatDelay?: number;
}
function RobotCard({ tag, name, desc, image, bg, gems, coins, floatDelay = 0 }: RobotProps) {
  return (
    <div className={`dh-robot ${bg}`}>
      <div className="dh-robot-badges">
        <span className="dh-chip" style={{ color: "#0ea5e9" }}><Gem size={12} /> +{gems}</span>
        <span className="dh-chip" style={{ color: "#f59e0b" }}><Coins size={12} /> +{coins}</span>
      </div>
      <div className="dh-robot-fire"><Flame size={16} color="#f97316" /></div>
      <div className="dh-robot-body">
        <motion.img
          src={image}
          alt={name}
          className="dh-robot-img"
          loading="lazy"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: floatDelay }}
        />
        <div className="dh-robot-text">
          <div className="dh-robot-tag">{tag}</div>
          <h3 className="dh-robot-name">{name}</h3>
          <p className="dh-robot-desc">{desc}</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- STUDY PROGRESS ---------- */
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

/* ---------- AI USAGE / BADGES ---------- */
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

/* ---------- RECENT DOCUMENTS ---------- */
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

/* ---------- LEADERBOARD ---------- */
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

/* ---------- HOME CONTENT ---------- */
function HomeContent({ onLogout, setActive }: { onLogout: () => void; setActive: (i: number) => void }) {
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
              bg="bg-yellow"
              gems={5}
              coins={145}
            />
            <RobotCard
              tag="Focus Boost"
              name="Deep Focus AI"
              desc="Personalized concentration coaching for long study sessions."
              image={robotFocus}
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

        <div className="dh-col-right">
          <Leaderboard />
        </div>
      </div>
    </>
  );
}

/* ---------- MAIN DASHBOARD ---------- */
export default function Dashboard({ onLogout }: DashboardProps) {
  const [active, setActive] = useState(0);

  return (
    <div className="dh-root">
      <motion.div
        className="dh-shell"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        <Sidebar active={active} setActive={setActive} />

        <main className="dh-main">
          {active === 0 && <HomeContent onLogout={onLogout} setActive={setActive} />}
          {active === 1 && <Documents />}

          {active === 2 && (
            <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
              <AIChat />
            </div>
          )}

          {active === 3 && <div style={{ padding: "32px", textAlign: "center" }}><h2>Courses Coming Soon</h2></div>}

          {/* Màn hình Profile (Mục số 4) */}
          {active === 4 && <Profile onBack={() => setActive(0)} />}

          {/* 🚀 UX FEATURE ENHANCEMENT: Thêm Layout Màn hình Cài đặt Hệ thống (Mục số 5) */}
          {active === 5 && (
            <div style={{ padding: "32px", color: "#1e293b" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                <Settings size={28} className="text-slate-700" />
                <h2 style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>Cài đặt hệ thống</h2>
              </div>
              <p style={{ color: "#64748b", marginTop: "-16px", marginBottom: "32px" }}>Thay đổi cấu hình cá nhân hóa trải nghiệm học tập AI của bạn.</p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "500px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div>
                    <strong style={{ display: "block", fontSize: "15px" }}>Chế độ tối (Dark Mode)</strong>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>Tiết kiệm pin và bảo vệ mắt khi học ban đêm</span>
                  </div>
                  <input type="checkbox" style={{ width: "40px", height: "20px", cursor: "pointer" }} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div>
                    <strong style={{ display: "block", fontSize: "15px" }}>Nhận thông báo qua Email</strong>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>Báo cáo khi AI hoàn tất tóm tắt giáo trình lớn</span>
                  </div>
                  <input type="checkbox" defaultChecked style={{ width: "40px", height: "20px", cursor: "pointer" }} />
                </div>
              </div>
              
              <button 
                onClick={() => setActive(0)} 
                style={{ marginTop: "32px", padding: "10px 20px", background: "#1e3a5f", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "500" }}
              >
                Quay lại Trang chủ
              </button>
            </div>
          )}
        </main>
      </motion.div>

      {active !== 2 && active !== 4 && active !== 5 && <AIAssistant />}
    </div>
  );
}