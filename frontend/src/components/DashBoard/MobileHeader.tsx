import { useState, useEffect } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Search, Bell, Sun, Moon } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCommandPalette } from "@/hooks/useCommandPalette";
import { useAuthStore } from "../../store/useAuthStore";
import { safeLocalStorage } from "../../utils/safeStorage";

export function MobileHeader() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { open: openCommandPalette } = useCommandPalette();
  const { user: authUser } = useAuthStore();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayInitials, setDisplayInitials] = useState("");

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 50) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return safeLocalStorage.getItem("theme") === "dark" || (!safeLocalStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
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
      safeLocalStorage.setItem("theme", nextTheme ? "dark" : "light");
      return nextTheme;
    });
  };

  const computeInitials = (name: string): string => {
    if (!name) return "";
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return "";
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const syncProfileData = (fallbackName?: string | null, fallbackAvatar?: string | null) => {
    if (typeof window === "undefined") return;
    const savedAvatar = safeLocalStorage.getItem("userAvatarUrl");
    const savedName = safeLocalStorage.getItem("userFullName");
    const finalAvatar = savedAvatar || fallbackAvatar || null;
    const finalName = savedName || fallbackName || "";
    setAvatarUrl(finalAvatar);
    setDisplayInitials(computeInitials(finalName));
  };

  useEffect(() => {
    syncProfileData();
    const handleProfileUpdate = () => syncProfileData();
    window.addEventListener("profile-updated", handleProfileUpdate);
    return () => window.removeEventListener("profile-updated", handleProfileUpdate);
  }, []);

  useEffect(() => {
    syncProfileData(authUser?.fullName, authUser?.avatarUrl);
  }, [authUser?.fullName, authUser?.avatarUrl]);

  // Determine title based on location
  let title = "Mind Space";
  if (location.pathname === "/dashboard") title = t("appShell.nav.dashboard", "Trang chủ");
  if (location.pathname === "/community") title = t("appShell.nav.community", "Cộng đồng");
  if (location.pathname === "/quiz") title = t("appShell.nav.quiz", "Câu hỏi");
  if (location.pathname === "/documents") title = t("appShell.nav.documents", "Tài liệu");
  if (location.pathname === "/profile") title = t("appShell.nav.profile", "Hồ sơ");
  if (location.pathname === "/notebooks") title = t("appShell.nav.notebooks", "Ghi chú");
  if (location.pathname.startsWith("/admin")) title = "Admin";

  return (
    <motion.header
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className="md:hidden fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/40 shadow-sm safe-top pt-[env(safe-area-inset-top)]"
    >
      <div className="flex items-center justify-between px-4 h-14">
        {/* Left: Title */}
        <h1 className="text-xl font-bold font-display tracking-tight text-foreground line-clamp-1 flex-1">
          {title}
        </h1>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={openCommandPalette}
            className="size-10 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted active:scale-95 transition-all"
          >
            <Search size={20} />
          </button>
          
          <button
            onClick={() => navigate("/notifications")}
            className="size-10 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted active:scale-95 transition-all relative"
          >
            <Bell size={20} />
            <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border border-background"></span>
          </button>

          <button
            onClick={toggleDarkMode}
            title="Toggle Theme"
            className={`relative flex items-center w-[64px] h-[26px] rounded-full p-[2.5px] cursor-pointer transition-all duration-300 overflow-hidden select-none outline-none border-none bg-transparent ${
              isDarkMode ? "justify-end" : "justify-start"
            }`}
          >
            {/* Background tracks cross-fade */}
            <img
              src="/images/light_theme_btn.png"
              className={`absolute inset-0 w-full h-full object-cover rounded-full transition-opacity duration-500 pointer-events-none ${
                isDarkMode ? "opacity-0" : "opacity-100"
              }`}
              alt="Light Theme Track"
            />
            <img
              src="/images/dark_theme_btn.png"
              className={`absolute inset-0 w-full h-full object-cover rounded-full transition-opacity duration-500 pointer-events-none ${
                isDarkMode ? "opacity-100" : "opacity-0"
              }`}
              alt="Dark Theme Track"
            />
            
            {/* Sliding Handle */}
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="relative z-10 w-5 h-5 rounded-full flex items-center justify-center shadow-md bg-white cursor-pointer"
            >
              {isDarkMode ? (
                <img 
                  src="/images/moon_square.png" 
                  alt="Moon" 
                  className="w-[80%] h-[80%] object-contain"
                />
              ) : (
                <img 
                  src="/images/sun_square.png" 
                  alt="Sun" 
                  className="w-[80%] h-[80%] object-contain"
                />
              )}
            </motion.div>
          </button>

          <button
            onClick={() => navigate("/profile")}
            className="ml-1 size-8 rounded-full overflow-hidden bg-ink text-cream font-bold text-xs flex items-center justify-center active:scale-95 transition-all shadow-sm border-2 border-primary/20"
          >
             {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                displayInitials
              )}
          </button>
        </div>
      </div>
    </motion.header>
  );
}
