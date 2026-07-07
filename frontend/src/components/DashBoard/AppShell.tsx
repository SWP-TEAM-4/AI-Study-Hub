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

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith("/admin");
  const showSearchBar = location.pathname === "/dashboard" || isAdminPath;

  const [isSplineReady, setIsSplineReady] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayInitials, setDisplayInitials] = useState("AK");
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // Lấy user info từ zustand store (không parse localStorage thủ công)
  const { user: authUser } = useAuthStore();
  const userRole = authUser?.role ?? "STUDENT";
  const { data: capabilities } = useCapabilities();
  const canModerateReports = Boolean(capabilities?.canModerateReports);
  const visibleAdminNav = userRole === "ADMIN" ? adminNav : adminNav.filter(item => item.id === "reports");

  // Mobile Drawer & Sidebar Toggle State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebarCollapsed") === "true";
    }
    return false;
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebarCollapsed", String(next));
      return next;
    });
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
    <div className="min-h-screen flex bg-background text-foreground antialiased selection:bg-primary/20 app-shell-font">
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

      {/* Spacer giữ chỗ cho layout, sẽ giãn ra cùng lúc với Sidebar để đẩy nội dung sang phải */}
      <div className={`hidden lg:block shrink-0 transition-all duration-300 ${isSidebarCollapsed ? "w-0" : "w-64"}`} />

      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 shrink-0 flex-col bg-[var(--color-ink)] text-[var(--color-cream)] border-r border-white/5 transition-transform duration-300 ease-in-out flex ${isMobileMenuOpen ? "translate-x-0" : (isSidebarCollapsed ? "-translate-x-full" : "translate-x-0")
          }`}>

        <div className="py-6 flex items-center px-6 gap-3 border-b border-white/5 relative">
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute right-4 top-1/2 -translate-y-1/2 lg:hidden text-white/50 hover:text-white"
          >
            <X size={20} />
          </button>
          <div className="size-9 rounded-xl overflow-hidden shadow-sm shadow-primary/20 bg-neutral-800 flex items-center justify-center shrink-0">
            <img
              src="./public/images/MindSpace1.png"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 overflow-hidden whitespace-nowrap">
            <div className="text-base font-semibold leading-tight tracking-tight text-white">AI Study</div>
            <div className="text-xs opacity-70 font-medium text-[var(--color-cream)]">Learning Hub</div>
          </div>
        </div>

        <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto custom-scrollbar px-3">
          {isAdminPath ? (
            <>
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl text-sm font-bold text-white bg-white/10 hover:bg-white/20 transition-all outline-none cursor-pointer"
              >
                <ArrowLeft size={18} /> {t("appShell.backToDashboard")}
              </button>
              <div className="h-px bg-white/10 my-3 mx-2" />
              {visibleAdminNav.map((item) => {
                const active = activeAdminTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleAdminTabClick(item.id)}
                    className="relative flex items-center w-full px-3 py-2.5 mb-0.5 gap-3 rounded-xl text-sm transition-all group outline-none cursor-pointer"
                  >
                    {active && (
                      <motion.span
                        layoutId="admin-nav-pill"
                        className="absolute inset-0 rounded-xl bg-white/10"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <Icon
                      size={18}
                      className="relative z-10 transition-colors duration-200 shrink-0"
                      style={{
                        color: active ? "var(--color-primary)" : "rgba(245,242,234,0.6)"
                      }}
                    />
                    <span
                      className={`relative z-10 transition-colors duration-200 whitespace-nowrap overflow-hidden ${active ? "font-semibold text-white" : "text-[var(--color-cream)] opacity-60 group-hover:opacity-100"
                        }`}
                    >
                      {t(item.labelKey)}
                    </span>
                  </button>
                );
              })}
            </>
          ) : (
            <div className="space-y-6">
              {/* Menu Chính */}
              <div>
                <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
                  Menu chính
                </div>
                {nav.slice(0, 6).map((item) => {
                  const active = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className="relative flex items-center w-full px-3 py-2.5 mb-0.5 gap-3 rounded-xl text-sm transition-all group outline-none cursor-pointer"
                    >
                      {active && (
                        <motion.span
                          layoutId="nav-pill"
                          className="absolute inset-0 rounded-xl bg-white/10"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <Icon
                        size={18}
                        className="relative z-10 transition-colors duration-200 shrink-0"
                        style={{
                          color: active ? "var(--color-primary)" : "rgba(245,242,234,0.6)"
                        }}
                      />
                      <span
                        className={`relative z-10 transition-colors duration-200 whitespace-nowrap overflow-hidden ${active ? "font-semibold text-white" : "text-[var(--color-cream)] opacity-60 group-hover:opacity-100"
                          }`}
                      >
                        {t(item.labelKey)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Cá nhân */}
              <div>
                <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
                  Cá nhân
                </div>
                {nav.slice(6, 9).map((item) => {
                  const active = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className="relative flex items-center w-full px-3 py-2.5 mb-0.5 gap-3 rounded-xl text-sm transition-all group outline-none cursor-pointer"
                    >
                      {active && (
                        <motion.span
                          layoutId="nav-pill"
                          className="absolute inset-0 rounded-xl bg-white/10"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <Icon
                        size={18}
                        className="relative z-10 transition-colors duration-200 shrink-0"
                        style={{
                          color: active ? "var(--color-primary)" : "rgba(245,242,234,0.6)"
                        }}
                      />
                      <span
                        className={`relative z-10 transition-colors duration-200 whitespace-nowrap overflow-hidden ${active ? "font-semibold text-white" : "text-[var(--color-cream)] opacity-60 group-hover:opacity-100"
                          }`}
                      >
                        {t(item.labelKey)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Quản trị */}
              {userRole === "ADMIN" && (
                <div>
                  <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
                    Quản trị
                  </div>
                  {nav.slice(9).map((item) => {
                    const active = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className="relative flex items-center w-full px-3 py-2.5 mb-0.5 gap-3 rounded-xl text-sm transition-all group outline-none cursor-pointer"
                      >
                        {active && (
                          <motion.span
                            layoutId="nav-pill"
                            className="absolute inset-0 rounded-xl bg-white/10"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                        <Icon
                          size={18}
                          className="relative z-10 transition-colors duration-200 shrink-0"
                          style={{
                            color: active ? "var(--color-primary)" : "rgba(245,242,234,0.6)"
                          }}
                        />
                        <span
                          className={`relative z-10 transition-colors duration-200 whitespace-nowrap overflow-hidden ${active ? "font-semibold text-white" : "text-[var(--color-cream)] opacity-60 group-hover:opacity-100"
                            }`}
                        >
                          {t(item.labelKey)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Kiểm duyệt */}
              {(userRole === "ADMIN" || capabilities?.canReviewMarketplace || canModerateReports) && (
                <div>
                  <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
                    Kiểm duyệt
                  </div>
                  {(userRole === "ADMIN" || capabilities?.canReviewMarketplace) && (
                    <button
                      onClick={() => navigate("/reviewer")}
                      className="relative flex items-center w-full px-3 py-2.5 mb-0.5 gap-3 rounded-xl text-sm transition-all group outline-none cursor-pointer"
                    >
                      {location.pathname === "/reviewer" && (
                        <motion.span
                          layoutId="nav-pill"
                          className="absolute inset-0 rounded-xl bg-white/10"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <ShieldCheck
                        size={18}
                        className="relative z-10 transition-colors duration-200 shrink-0"
                        style={{
                          color: location.pathname === "/reviewer" ? "var(--color-primary)" : "rgba(245,242,234,0.6)"
                        }}
                      />
                      <span
                        className={`relative z-10 transition-colors duration-200 whitespace-nowrap overflow-hidden ${location.pathname === "/reviewer" ? "font-semibold text-white" : "text-[var(--color-cream)] opacity-60 group-hover:opacity-100"
                          }`}
                      >
                        {t("appShell.nav.reviewer", "Kiểm duyệt marketplace")}
                      </span>
                    </button>
                  )}
                  {canModerateReports && (
                    <button
                      onClick={() => navigate("/admin/reports")}
                      className="relative flex items-center w-full px-3 py-2.5 mb-0.5 gap-3 rounded-xl text-sm transition-all group outline-none cursor-pointer"
                    >
                      {location.pathname === "/admin/reports" && (
                        <motion.span
                          layoutId="nav-pill"
                          className="absolute inset-0 rounded-xl bg-white/10"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <AlertTriangle
                        size={18}
                        className="relative z-10 transition-colors duration-200 shrink-0"
                        style={{
                          color: location.pathname === "/admin/reports" ? "var(--color-primary)" : "rgba(245,242,234,0.6)"
                        }}
                      />
                      <span
                        className={`relative z-10 transition-colors duration-200 whitespace-nowrap overflow-hidden ${location.pathname === "/admin/reports" ? "font-semibold text-white" : "text-[var(--color-cream)] opacity-60 group-hover:opacity-100"
                          }`}
                      >
                        Báo cáo vi phạm
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Nút Phản Hồi (Nằm dưới cùng Sidebar) */}
          <div className="mt-8 px-3">
            <button
              onClick={() => { setIsFeedbackOpen(true); setIsMobileMenuOpen(false); }}
              className="relative flex items-center w-full px-3 py-2.5 gap-3 rounded-xl text-sm transition-all group outline-none cursor-pointer bg-white/5 hover:bg-white/10 border border-white/5"
            >
              <MessageSquare
                size={18}
                className="relative z-10 transition-colors duration-200 shrink-0 text-orange-400"
              />
              <span className="relative z-10 font-semibold text-white/90 group-hover:text-white transition-colors duration-200">
                {t("appShell.sendFeedback", "Gửi phản hồi")}
              </span>
            </button>
          </div>
        </nav>
      </aside>

      {/* ── 2. KHU VỰC HIỂN THỊ NỘI DUNG CHÍNH BÊN PHẢI ── */}
      <div className="flex-1 min-w-0 flex flex-col bg-background/50">

        <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/60 border-b border-border/40 shadow-sm">
          <div className="flex items-center gap-3 px-6 lg:px-8 h-16 justify-between">

            <div className="flex-1 min-w-[120px] max-w-2xl relative flex items-center gap-4">
              {/* Nút Hamburger cho phép Toggle Sidebar trên Desktop và Mobile */}
              <button
                onClick={() => {
                  if (window.innerWidth < 1024) setIsMobileMenuOpen(true);
                  else toggleSidebar();
                }}
                className="p-2 -ml-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors outline-none cursor-pointer"
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