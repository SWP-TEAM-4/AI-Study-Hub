import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, BookMarked, GraduationCap, BookOpen, Menu, FileText, Users, Search, User, Bell, LogOut, X, Globe, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useCommandPalette } from "@/hooks/useCommandPalette";
import { useState } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { useCapabilities } from "../../hooks/useCapabilities";

export function MobileBottomNav() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { toggle: toggleSearch } = useCommandPalette();
  const { logout, user } = useAuthStore();
  const userRole = user?.role ?? "STUDENT";
  const { data: capabilities } = useCapabilities();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [langTarget, setLangTarget] = useState("vi");

  const handleLogout = () => {
    logout();
    setIsMoreOpen(false);
    navigate("/", { replace: true });
  };

  const handleMoreItemClick = (action: string | (() => void)) => {
    setIsMoreOpen(false);
    if (typeof action === "function") {
      action();
    } else {
      navigate(action);
    }
  };

  const toggleLanguage = () => {
    const nextLang = i18n.language === "vi" ? "en" : "vi";
    setIsMoreOpen(false);
    
    // Dispatch custom event to AppShell
    window.dispatchEvent(new CustomEvent("language-change-start", { detail: nextLang }));
    
    setTimeout(() => {
      i18n.changeLanguage(nextLang);
      window.dispatchEvent(new Event("language-change-end"));
    }, 3000);
  };

  return (
    <>
      {/* MORE MENU DRAWER */}
      <AnimatePresence>
        {isMoreOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border rounded-t-3xl p-6 md:hidden pb-12"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-foreground">Menu</h3>
                <button
                  onClick={() => setIsMoreOpen(false)}
                  className="size-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => handleMoreItemClick("/documents")}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted text-sm font-semibold text-foreground transition-colors"
                >
                  <FileText size={18} className="text-primary" />
                  <span>{t('nav.documents', 'Tài liệu')}</span>
                </button>

                <button
                  onClick={() => handleMoreItemClick("/community")}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted text-sm font-semibold text-foreground transition-colors"
                >
                  <Users size={18} className="text-primary" />
                  <span>{t('nav.community', 'Cộng đồng')}</span>
                </button>

                <button
                  onClick={() => handleMoreItemClick(toggleSearch)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted text-sm font-semibold text-foreground transition-colors"
                >
                  <Search size={18} className="text-primary" />
                  <span>Tìm kiếm</span>
                </button>

                <button
                  onClick={() => handleMoreItemClick("/profile")}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted text-sm font-semibold text-foreground transition-colors"
                >
                  <User size={18} className="text-primary" />
                  <span>{t('nav.profile', 'Hồ sơ')}</span>
                </button>

                <button
                  onClick={() => handleMoreItemClick("/notifications")}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted text-sm font-semibold text-foreground transition-colors"
                >
                  <Bell size={18} className="text-primary" />
                  <span>Thông báo</span>
                </button>

                {/* Kiểm duyệt marketplace */}
                {(userRole === "ADMIN" || capabilities?.canReviewMarketplace) && (
                  <button
                    onClick={() => handleMoreItemClick("/reviewer")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted text-sm font-semibold text-foreground transition-colors"
                  >
                    <ShieldCheck size={18} className="text-primary" />
                    <span>{t('appShell.nav.reviewer', 'Kiểm duyệt marketplace')}</span>
                  </button>
                )}

                {/* Kiểm duyệt report cộng đồng */}
                {capabilities?.canModerateReports && (
                  <button
                    onClick={() => handleMoreItemClick("/admin/reports")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted text-sm font-semibold text-foreground transition-colors"
                  >
                    <ShieldCheck size={18} className="text-primary" />
                    <span>Báo cáo vi phạm</span>
                  </button>
                )}

                {/* Language Switcher */}
                <button
                  onClick={toggleLanguage}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted text-sm font-semibold text-foreground transition-colors"
                >
                  <Globe size={18} className="text-primary" />
                  <span>{i18n.language === "vi" ? "Switch to English" : "Chuyển sang Tiếng Việt"}</span>
                </button>

                <div className="h-px bg-border/60 my-2" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-destructive/10 text-sm font-semibold text-destructive transition-colors"
                >
                  <LogOut size={18} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>


      {/* BOTTOM NAV BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-t border-border/50 pb-safe">
        <div className="flex items-center justify-between h-16 px-4 relative">
          
          {/* Left Items: 1st (Home), 2nd (Quiz) */}
          <div className="flex items-center justify-start gap-4 flex-1">
            {/* Home */}
            <Link to="/dashboard" className="outline-none h-14">
              <div className="flex flex-col items-center justify-center w-14 h-full gap-0.5 text-muted-foreground hover:text-foreground transition-colors">
                <Home size={20} className={location.pathname === "/dashboard" ? "text-primary" : ""} />
                <span className={`text-[9px] font-medium ${location.pathname === "/dashboard" ? "text-primary font-bold" : ""}`}>
                  {t('nav.home', 'Home')}
                </span>
              </div>
            </Link>

            {/* Quiz */}
            <Link to="/quiz" className="outline-none h-14">
              <div className="flex flex-col items-center justify-center w-14 h-full gap-0.5 text-muted-foreground hover:text-foreground transition-colors">
                <GraduationCap size={20} className={location.pathname === "/quiz" ? "text-primary" : ""} />
                <span className={`text-[9px] font-medium ${location.pathname === "/quiz" ? "text-primary font-bold" : ""}`}>
                  {t('nav.quiz', 'Quiz')}
                </span>
              </div>
            </Link>
          </div>

          {/* Center Large FAB: Notebooks (To nhất) */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-5 z-50">
            <Link 
              to="/notebooks" 
              className={`size-14 rounded-full flex flex-col items-center justify-center shadow-lg transition-transform active:scale-95 ${
                location.pathname === "/notebooks" 
                  ? "bg-primary text-primary-foreground shadow-primary/30" 
                  : "bg-card text-foreground border border-border hover:border-primary/50 shadow-black/10"
              }`}
            >
              <BookMarked size={24} />
              <span className="text-[8px] font-bold mt-0.5">{t('nav.notebooks', 'Sổ tay')}</span>
            </Link>
          </div>

          {/* Right Items: 4th (Flashcards), 5th (Menu) */}
          <div className="flex items-center justify-end gap-4 flex-1">
            {/* Flashcards */}
            <Link to="/flashcards" className="outline-none h-14">
              <div className="flex flex-col items-center justify-center w-14 h-full gap-0.5 text-muted-foreground hover:text-foreground transition-colors">
                <BookOpen size={20} className={location.pathname === "/flashcards" ? "text-primary" : ""} />
                <span className={`text-[9px] font-medium ${location.pathname === "/flashcards" ? "text-primary font-bold" : ""}`}>
                  {t('nav.flashcards', 'Thẻ')}
                </span>
              </div>
            </Link>

            {/* Menu More Tab */}
            <button onClick={() => setIsMoreOpen(true)} className="outline-none h-14">
              <div className="flex flex-col items-center justify-center w-14 h-full gap-0.5 text-muted-foreground hover:text-foreground transition-colors">
                <Menu size={20} className={isMoreOpen ? "text-primary" : ""} />
                <span className={`text-[9px] font-medium ${isMoreOpen ? "text-primary font-bold" : ""}`}>
                  Menu
                </span>
              </div>
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
