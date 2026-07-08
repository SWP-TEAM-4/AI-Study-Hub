"use client";

import { useState, useEffect, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  BookMarked,
  FileText,
  Bot,
  GraduationCap,
  BookOpen,
  Users,
  Bell,
  User,
  Search,
  Plus,
  X,
  Shield,
  LayoutDashboard,
  MessageSquare,
  AlertTriangle,
  UserCheck,
  ArrowLeft,
  Globe,
  Menu,
  Moon,
  Sun,
  Award,
  ChevronLeft,
  ChevronRight,
  Upload,
  Compass,
  Library,
  FileStack,
  Gamepad2,
  Layers,
  Globe2,
  BellRing,
  CircleUserRound,
  ShieldCheck,
  Flag
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

const Spline = lazy(() => import("@splinetool/react-spline"));
import { FeedbackModal } from "../ui/FeedbackModal";
import { useAuthStore } from "../../store/useAuthStore";
import { useCapabilities } from "../../hooks/useCapabilities";


const nav = [
  { path: "/dashboard", labelKey: "appShell.nav.dashboard", icon: Compass },
  { path: "/notebooks", labelKey: "appShell.nav.notebooks", icon: Library },
  { path: "/documents", labelKey: "appShell.nav.documents", icon: FileStack },
  { path: "/quiz", labelKey: "appShell.nav.quiz", icon: Gamepad2 },
  { path: "/flashcards", labelKey: "appShell.nav.flashcards", icon: Layers },
  { path: "/community", labelKey: "appShell.nav.community", icon: Globe2 },
  { path: "/my-reports", labelKey: "appShell.nav.myReports", icon: Flag },
  { path: "/notifications", labelKey: "appShell.nav.notifications", icon: BellRing },
  { path: "/profile", labelKey: "appShell.nav.profile", icon: CircleUserRound },
  { path: "/admin", labelKey: "appShell.nav.admin", icon: ShieldCheck },
] as const;

const adminNav = [
  { id: "overview", labelKey: "appShell.adminNav.overview", icon: LayoutDashboard },
  { id: "users", labelKey: "appShell.adminNav.users", icon: Users },
  { id: "feedbacks", labelKey: "appShell.adminNav.feedbacks", icon: MessageSquare },
  { id: "logs", labelKey: "appShell.adminNav.logs", icon: FileText },
  { id: "academic", labelKey: "appShell.adminNav.academic", icon: GraduationCap },
  { id: "roles", labelKey: "appShell.adminNav.roles", icon: UserCheck },
  { id: "reports", labelKey: "appShell.adminNav.reports", icon: AlertTriangle },
  { id: "marketplace", labelKey: "appShell.adminNav.marketplace", icon: BookMarked },
  { id: "badges", labelKey: "appShell.adminNav.badges", icon: Award },
  { id: "system-configs", labelKey: "appShell.adminNav.systemConfigs", icon: Shield },
];

import { MobileBottomNav } from "./MobileBottomNav";
import { MobileHeader } from "./MobileHeader";

const ChameleonMascot = ({ color }: { color: string }) => (
  <svg width="48" height="48" viewBox="0 0 100 100" className="drop-shadow-lg scale-110 origin-bottom">
    {/* Banch */}
    <path d="M 10 75 Q 50 85 90 70" fill="none" stroke="#78350f" strokeWidth="6" strokeLinecap="round" />
    <path d="M 30 80 Q 40 90 50 85" fill="none" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
    
    {/* Curly Tail */}
    <path d="M 25 70 C 5 70 5 45 25 45 C 35 45 40 55 35 60 C 25 65 20 55 25 50" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" className="transition-colors duration-500" />
    
    {/* Body */}
    <path d="M 25 70 C 40 70 55 70 65 65 C 75 60 75 40 65 35 C 50 30 35 30 25 45 Z" fill={color} className="transition-colors duration-500" />
    
    {/* Head */}
    <path d="M 60 55 C 75 60 90 55 90 40 C 90 25 70 20 60 30 Z" fill={color} className="transition-colors duration-500" />
    
    {/* Eye */}
    <circle cx="75" cy="35" r="7" fill="white" />
    <circle cx="77" cy="35" r="3" fill="#0f172a" />
    
    {/* Spikes on back */}
    <path d="M 30 40 L 32 30 L 38 38 L 44 28 L 50 37 L 58 29 L 62 36" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="transition-colors duration-500" />
    
    {/* Little legs */}
    <path d="M 40 68 L 35 78 M 55 65 L 50 75" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" className="transition-colors duration-500" />
  </svg>
);

const colors = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#10b981", "#06b6d4", "#3b82f6", "#8b5cf6", "#d946ef", "#f43f5e"];
const getRandomColor = (path: string) => {
  // Use path length to deterministically pick a color so it's consistent
  return colors[path.length % colors.length];
};

const NavItem = ({ active, icon: Icon, label, onClick, pathOrId }: { active: boolean, icon: any, label: string, onClick: () => void, pathOrId: string }) => {
  const color = getRandomColor(pathOrId);
  return (
    <button
      onClick={onClick}
      className="relative flex items-center w-full px-3.5 py-2.5 mb-0.5 gap-3.5 rounded-xl text-[14px] font-bold transition-all group outline-none cursor-pointer overflow-visible"
    >
      {active && (
        <motion.span
          layoutId="nav-pill"
          className="absolute inset-0 rounded-xl shadow-inner shadow-black/20"
          style={{ backgroundColor: color }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      {!active && (
        <div className="absolute inset-0 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
      <Icon
        size={21}
        strokeWidth={active ? 2.5 : 2.5}
        className="relative z-10 transition-colors duration-200 shrink-0"
        style={{ color: active ? "#ffffff" : "rgba(138, 213, 179, 0.8)" }}
      />
      <span
        className={`relative z-10 transition-all duration-300 whitespace-nowrap overflow-hidden tracking-wide
          lg:w-0 lg:opacity-0 lg:group-hover/sidebar:w-auto lg:group-hover/sidebar:opacity-100 lg:group-hover/sidebar:ml-1
          w-auto opacity-100
          ${active ? "text-white" : "text-[#c2eadd] group-hover:text-white"}
        `}
      >
        {label}
      </span>
      {active && (
        <motion.div
          layoutId="chameleon"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 pointer-events-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] hidden lg:block lg:opacity-0 lg:group-hover/sidebar:opacity-100 transition-opacity duration-300"
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
        >
          <ChameleonMascot color={color} />
        </motion.div>
      )}
    </button>
  );
};

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith("/admin");
  const showSearchBar = location.pathname === "/dashboard" || isAdminPath;

  const [isSplineReady, setIsSplineReady] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayInitials, setDisplayInitials] = useState("AK");
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // Lấy user info từ zustand store
  const { user: authUser } = useAuthStore();
  const userRole = authUser?.role ?? "STUDENT";
  const { data: capabilities } = useCapabilities();
  const canModerateReports = Boolean(capabilities?.canModerateReports);
  const visibleAdminNav = userRole === "ADMIN" ? adminNav : adminNav.filter(item => item.id === "reports");

  // Mobile Drawer & Sidebar Toggle State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // We no longer use isSidebarCollapsed for desktop since it's hover based, but keep it for legacy compat if needed.
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark" || (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev: boolean) => {
      const nextTheme = !prev;
      localStorage.setItem("theme", nextTheme ? "dark" : "light");
      return nextTheme;
    });
  };

  const { t, i18n } = useTranslation();

  const [isChangingLanguage, setIsChangingLanguage] = useState(false);
  const [langTarget, setLangTarget] = useState("");

  const handleLanguageChange = () => {
    const nextLang = i18n.language === "vi" ? "en" : "vi";
    setLangTarget(nextLang);
    setIsChangingLanguage(true);
    setTimeout(() => {
      i18n.changeLanguage(nextLang);
      setIsChangingLanguage(false);
    }, 3000);
  };

  const activeAdminTab = location.pathname.startsWith('/admin/')
    ? location.pathname.split('/')[2]
    : "overview";

  const handleAdminTabClick = (id: string) => {
    navigate(`/admin/${id}`);
    setIsMobileMenuOpen(false); // Close mobile drawer when navigating
  };

  const syncProfileData = () => {
    if (typeof window !== "undefined") {
      const savedAvatar = localStorage.getItem("userAvatarUrl");
      const savedName = localStorage.getItem("userFullName");
      if (savedAvatar) setAvatarUrl(savedAvatar);
      if (savedName) {
        const words = savedName.trim().split(" ");
        const initials = words.length >= 2
          ? (words[0][0] + words[words.length - 1][0]).toUpperCase()
          : words[0].slice(0, 2).toUpperCase();
        setDisplayInitials(initials);
      }
    }
  };

  useEffect(() => {
    syncProfileData();
    const handleProfileUpdate = () => syncProfileData();
    window.addEventListener("profile-updated", handleProfileUpdate);
    return () => window.removeEventListener("profile-updated", handleProfileUpdate);
  }, []);

  // 🌟 Dynamic Document Title
  useEffect(() => {
    let title = "Mind Space";
    const currentNav = nav.find(n => n.path === location.pathname);
    if (currentNav) {
      title = `${t(currentNav.labelKey)} - Mind Space`;
    } else if (isAdminPath) {
      const currentAdminNav = adminNav.find(n => n.id === activeAdminTab);
      if (currentAdminNav) {
        title = `${t(currentAdminNav.labelKey)} - Admin Mind Space`;
      } else {
        title = "Admin - Mind Space";
      }
    } else if (location.pathname.startsWith('/notebooks/')) {
      title = `Notebook - Mind Space`;
    }
    document.title = title;
  }, [location.pathname, activeAdminTab, t, isAdminPath]);

  // 🌟 Auto Scroll to Top on Navigation
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const mainElement = document.getElementById("main-scroll-container");
    if (mainElement) {
      mainElement.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex bg-[#f8fafc] text-foreground antialiased selection:bg-[#8ad5b3]/30 font-quicksand">
      <style dangerouslySetInnerHTML={{
        __html: `
          @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;800;900&family=Quicksand:wght@400;600;700&display=swap');
          .font-nunito { font-family: 'Nunito', sans-serif; }
          .font-quicksand { font-family: 'Quicksand', sans-serif; }
          .chameleon-sidebar-nav::-webkit-scrollbar { display: none; }
          .chameleon-sidebar-nav { -ms-overflow-style: none; scrollbar-width: none; }
        `
      }} />
      <MobileHeader />
      <MobileBottomNav />

      {/* ── 1. SIDEBAR CỐ ĐỊNH PHÍA BÊN TRÁI & MOBILE DRAWER ── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Spacer giữ chỗ cho layout */}
      <div className="hidden lg:block shrink-0 w-[112px]" />

      <aside
        className={`fixed z-50 flex flex-col bg-[#0d4a22] text-[#e6f7ed] transition-all duration-400 ease-out group/sidebar peer/sidebar chameleon-sidebar shadow-[8px_0_24px_rgba(13,74,34,0.15)]
          top-0 left-0 h-screen w-64 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:top-1/2 lg:-translate-y-1/2 lg:left-6 lg:h-auto lg:py-4 lg:w-[80px] lg:hover:w-[280px] lg:rounded-2xl
        `}>

        <div className="py-4 flex items-center px-4.5 gap-3.5 relative shrink-0">
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute right-4 top-1/2 -translate-y-1/2 lg:hidden text-white/50 hover:text-white"
          >
            <X size={20} />
          </button>
          <div className="size-8 rounded-lg overflow-hidden shadow-sm shadow-primary/20 bg-neutral-800 flex items-center justify-center shrink-0">
            <img
              src="./public/images/MindSpace1.png"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 overflow-hidden whitespace-nowrap lg:opacity-0 lg:group-hover/sidebar:opacity-100 transition-opacity duration-300">
            <div className="text-base font-semibold leading-tight tracking-tight text-white">AI Study</div>
            <div className="text-xs opacity-70 font-medium text-[var(--color-cream)]">Learning Hub</div>
          </div>
        </div>

        <nav className="flex-1 py-2 space-y-0.5 overflow-y-auto chameleon-sidebar-nav px-3">
          {isAdminPath ? (
            <>
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl text-sm font-bold text-white bg-white/10 hover:bg-white/20 transition-all outline-none cursor-pointer"
              >
                <ArrowLeft size={18} /> {t("appShell.backToDashboard")}
              </button>
              <div className="h-px bg-white/10 my-3 mx-2" />
              {visibleAdminNav.map((item) => (
                <NavItem
                  key={item.id}
                  active={activeAdminTab === item.id}
                  icon={item.icon}
                  label={t(item.labelKey)}
                  onClick={() => handleAdminTabClick(item.id)}
                  pathOrId={item.id}
                />
              ))}
            </>
          ) : (
            <div className="space-y-4">
              {/* Menu Chính */}
              <div>
                <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-white/40 lg:opacity-0 lg:group-hover/sidebar:opacity-100 lg:h-0 lg:group-hover/sidebar:h-auto overflow-hidden transition-all duration-300">
                  Menu chính
                </div>
                {nav.slice(0, 6).map((item) => (
                  <NavItem
                    key={item.path}
                    active={location.pathname === item.path}
                    icon={item.icon}
                    label={t(item.labelKey)}
                    onClick={() => navigate(item.path)}
                    pathOrId={item.path}
                  />
                ))}
              </div>

              {/* Cá nhân */}
              <div>
                <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-white/40 lg:opacity-0 lg:group-hover/sidebar:opacity-100 lg:h-0 lg:group-hover/sidebar:h-auto overflow-hidden transition-all duration-300">
                  Cá nhân
                </div>
                {nav.slice(6, 9).map((item) => (
                  <NavItem
                    key={item.path}
                    active={location.pathname === item.path}
                    icon={item.icon}
                    label={t(item.labelKey)}
                    onClick={() => navigate(item.path)}
                    pathOrId={item.path}
                  />
                ))}
              </div>

              {/* Quản trị */}
              {userRole === "ADMIN" && (
                <div>
                  <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-white/40 lg:opacity-0 lg:group-hover/sidebar:opacity-100 lg:h-0 lg:group-hover/sidebar:h-auto overflow-hidden transition-all duration-300">
                    Quản trị
                  </div>
                  {nav.slice(9).map((item) => (
                    <NavItem
                      key={item.path}
                      active={location.pathname === item.path}
                      icon={item.icon}
                      label={t(item.labelKey)}
                      onClick={() => navigate(item.path)}
                      pathOrId={item.path}
                    />
                  ))}
                </div>
              )}

              {/* Kiểm duyệt */}
              {(userRole === "ADMIN" || capabilities?.canReviewMarketplace || canModerateReports) && (
                <div>
                  <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-white/40 lg:opacity-0 lg:group-hover/sidebar:opacity-100 lg:h-0 lg:group-hover/sidebar:h-auto overflow-hidden transition-all duration-300">
                    Kiểm duyệt
                  </div>
                  {(userRole === "ADMIN" || capabilities?.canReviewMarketplace) && (
                    <NavItem
                      active={location.pathname === "/reviewer"}
                      icon={ShieldCheck}
                      label={t("appShell.nav.reviewer", "Kiểm duyệt marketplace")}
                      onClick={() => navigate("/reviewer")}
                      pathOrId="/reviewer"
                    />
                  )}
                  {canModerateReports && (
                    <NavItem
                      active={location.pathname === "/admin/reports"}
                      icon={AlertTriangle}
                      label="Báo cáo vi phạm"
                      onClick={() => navigate("/admin/reports")}
                      pathOrId="/admin/reports"
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Nút Phản Hồi (Nằm dưới cùng Sidebar) */}
          <div className="mt-6">
            <NavItem
              active={false}
              icon={MessageSquare}
              label={t("appShell.sendFeedback", "Gửi phản hồi")}
              onClick={() => { setIsFeedbackOpen(true); setIsMobileMenuOpen(false); }}
              pathOrId="/feedback"
            />
          </div>
        </nav>
      </aside>

      {/* Backdrop overlay for desktop sidebar hover */}
      <div className="hidden lg:block fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px] transition-all duration-400 opacity-0 peer-hover/sidebar:opacity-100 pointer-events-none" />

      {/* ── 2. KHU VỰC HIỂN THỊ NỘI DUNG CHÍNH BÊN PHẢI ── */}
      <div className="flex-1 min-w-0 flex flex-col bg-transparent">

        <header className="sticky top-0 lg:top-4 z-30 lg:mb-4 transition-all duration-400 w-full max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8">
          <div className="backdrop-blur-xl bg-white/80 lg:border border-border/40 lg:shadow-sm lg:rounded-2xl flex items-center gap-3 px-4 lg:px-6 h-14 lg:h-16 justify-between border-b lg:border-b-0 lg:ml-[200px]">

            <div className="flex-1 min-w-[120px] max-w-2xl relative flex items-center gap-4">
              {/* Nút Hamburger cho phép Toggle Sidebar trên Desktop và Mobile */}
              <button
                onClick={() => {
                  if (window.innerWidth < 1024) setIsMobileMenuOpen(true);
                  else toggleSidebar();
                }}
                className="p-2 -ml-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors outline-none cursor-pointer lg:hidden"
                title="Toggle Menu"
              >
                <Menu size={20} />
              </button>

              {/* Thanh Tìm Kiếm Mới (Global Search) */}
              {showSearchBar && (
                <div className="hidden md:flex items-center w-full max-w-md bg-muted/40 hover:bg-muted/60 border border-border/50 text-muted-foreground rounded-full h-10 px-4 transition-all focus-within:ring-2 focus-within:ring-primary/40 focus-within:bg-background focus-within:shadow-md">
                  <Search size={16} className="mr-2 text-primary/70" />
                  <input
                    type="text"
                    placeholder={t("appShell.search", "Search in your workspace...")}
                    className="bg-transparent border-none outline-none w-full text-sm text-foreground placeholder:text-muted-foreground/60"
                  />
                  <div className="hidden lg:flex items-center gap-1 ml-2 opacity-60">
                    <kbd className="inline-flex items-center justify-center rounded-md border border-border/50 bg-background/50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-muted-foreground shadow-sm">Ctrl</kbd>
                    <span className="text-[10px]">+</span>
                    <kbd className="inline-flex items-center justify-center rounded-md border border-border/50 bg-background/50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-muted-foreground shadow-sm">K</kbd>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-4 relative">

              {/* CỤM 1: Cài đặt (Theme & Lang) */}
              <div className="hidden md:flex items-center gap-1 p-1.5 rounded-full bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow duration-300">
                <button
                  onClick={toggleDarkMode}
                  title="Toggle Theme"
                  className={`relative flex items-center w-16 h-8 rounded-full cursor-pointer transition-all duration-400 overflow-hidden select-none outline-none border-none ${
                    isDarkMode 
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50" 
                      : "bg-gradient-to-r from-amber-400 to-orange-400 shadow-lg shadow-amber-400/30 hover:shadow-amber-400/50"
                  }`}
                  style={{
                    justifyContent: isDarkMode ? "flex-end" : "flex-start"
                  }}
                >
                  {/* Sliding Handle with Icon */}
                  <motion.div
                    layout
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="relative z-10 w-7 h-7 rounded-full flex items-center justify-center shadow-lg bg-white/95 backdrop-blur-sm cursor-pointer"
                  >
                    {isDarkMode ? (
                      <Moon size={16} className="text-indigo-600" strokeWidth={2.5} />
                    ) : (
                      <Sun size={16} className="text-amber-600" strokeWidth={2.5} />
                    )}
                  </motion.div>
                </button>

                <div className="w-px h-4 bg-border/50 mx-1" />

                <button
                  onClick={handleLanguageChange}
                  title="Change Language"
                  className="flex items-center gap-1.5 px-2.5 h-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-background hover:shadow-sm active:scale-95 transition-all outline-none cursor-pointer text-xs font-bold"
                >
                  <Globe size={14} className={i18n.language === 'vi' ? 'text-blue-500' : 'text-rose-500'} />
                  <span>{i18n.language === 'vi' ? 'EN' : 'VI'}</span>
                </button>
              </div>

              {/* CỤM 3: Action & Profile */}
              <div className="flex items-center gap-3 sm:gap-4 pl-1 sm:pl-2 md:border-l md:border-border/50">
                <button
                  onClick={() => navigate("/documents")}
                  className="inline-flex items-center justify-center gap-1.5 px-0 sm:px-4 w-9 sm:w-auto h-9 rounded-full text-sm font-semibold glow-button active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Upload size={16} strokeWidth={2.5} /> <span className="hidden sm:inline">{t("appShell.upload")}</span>
                </button>

                <button
                  onClick={() => navigate("/profile")}
                  className="size-10 rounded-full bg-ink text-white grid place-items-center text-sm font-bold shadow-md hover:scale-105 transition-transform outline-none overflow-hidden border-2 border-primary/20 hover:border-primary/50 cursor-pointer ring-2 ring-transparent hover:ring-primary/10 ring-offset-2 ring-offset-background"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                  ) : (
                    displayInitials
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        <main id="main-scroll-container" className="flex-1 px-4 md:px-6 lg:px-8 pt-16 md:pt-6 pb-24 md:pb-6 min-w-0 overflow-x-hidden overflow-y-auto custom-scrollbar relative z-0">
          {/* Blurred Background Gradients */}
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            {/* Orb 1: Pastel Blue/Teal Glow */}
            <div className="absolute top-[10%] left-[5%] w-[35vw] h-[35vw] max-w-[400px] max-h-[400px] rounded-full bg-gradient-to-tr from-blue-300/25 to-[#89cff0]/20 blur-[80px] md:blur-[120px] dark:from-blue-950/20 dark:to-indigo-900/10" />
            
            {/* Orb 2: Mint Green Glow */}
            <div className="absolute top-[40%] right-[5%] w-[40vw] h-[40vw] max-w-[450px] max-h-[450px] rounded-full bg-gradient-to-br from-emerald-300/15 to-[#8ad5b3]/20 blur-[95px] md:blur-[130px] dark:from-emerald-950/20 dark:to-[#0d6683]/10" />
            
            {/* Orb 3: Peach/Rose Glow */}
            <div className="absolute bottom-[5%] left-[15%] w-[30vw] h-[30vw] max-w-[350px] max-h-[350px] rounded-full bg-gradient-to-tr from-rose-200/15 to-[#ffa07a]/20 blur-[80px] md:blur-[110px] dark:from-rose-950/15 dark:to-purple-900/10" />
          </div>

          <Suspense fallback={
            <div className="flex h-[50vh] items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          }>
            <Outlet />
          </Suspense>
        </main>
      </div>

      {/* MODALS */}
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />

      {/* LANGUAGE CHANGE OVERLAY */}
      <AnimatePresence>
        {isChangingLanguage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-md z-[9999] flex flex-col items-center justify-center gap-4"
          >
            <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-foreground font-semibold text-lg sm:text-xl tracking-wide"
            >
              {langTarget === "en" ? "Switching to English..." : "Đang chuyển sang Tiếng Việt..."}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}