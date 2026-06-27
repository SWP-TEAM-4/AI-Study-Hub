import { FormEvent, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, X, Twitter, Github } from "lucide-react";
import PrivacyPolicy from "./PrivacyPolicy";
import CookieSettings from "./CookieSettings";

export function Footer() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showCookie, setShowCookie] = useState(false);
  const [email, setEmail] = useState("");

  // ─── 🌟 XỬ LÝ ĐỒNG BỘ URL THÔNG MINH ───
  const openPrivacy = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setShowPrivacy(true);
    // Thay đổi URL thành /privacy-policy mà không load lại trang
    window.history.pushState({ privacyOpen: true }, "", "/privacy-policy");
  };

  const closePrivacy = () => {
    setShowPrivacy(false);
    // Nếu URL vẫn đang là /privacy-policy thì trả nó về lịch sử trước đó (trang chủ)
    if (window.location.pathname === "/privacy-policy") {
      window.history.back();
    }
  };

  const openCookie = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setShowCookie(true);
    window.history.pushState({ cookieOpen: true }, "", "/cookie-settings");
  };

  const closeCookie = () => {
    setShowCookie(false);
    if (window.location.pathname === "/cookie-settings") {
      window.history.back();
    }
  };

  // Lắng nghe sự kiện người dùng bấm nút BACK/FORWARD của chính trình duyệt
  useEffect(() => {
    const handlePopState = () => {
      setShowPrivacy(window.location.pathname === "/privacy-policy");
      setShowCookie(window.location.pathname === "/cookie-settings");
    };

    if (window.location.pathname === "/privacy-policy") setShowPrivacy(true);
    if (window.location.pathname === "/cookie-settings") setShowCookie(true);

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
  // ─────────────────────────────────────────

  const handleJoinWaitlist = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) return;

    setShowSuccess(true);
    
    setTimeout(() => {
      setShowSuccess(false);
    }, 3500);
  };

  const antonStyle = { fontFamily: "'Anton', sans-serif", letterSpacing: "normal" };

  return (
    <footer className="relative bg-[#020514] overflow-hidden select-none">
      {/* Lưới Grid Neon Nền */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(rgba(0,255,204,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,204,1) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />
      
      <div className="relative z-10 max-w-[1200px] mx-auto px-5 sm:px-8 lg:px-14 pt-24 pb-16 flex flex-col items-center gap-12 text-center">
        {/* Tiêu đề chính */}
        <h2 
          style={antonStyle}
          className="text-[28px] sm:text-[36px] lg:text-[44px] text-white leading-[1.2] max-w-[680px]"
        >
          Mind Space is set to launch in <span className="text-neon">Fall 2026.</span><br />Join the waitlist today.
        </h2>

        {/* Form Đăng ký Waitlist */}
        <form onSubmit={handleJoinWaitlist} className="flex flex-col sm:flex-row gap-3 w-full max-w-[520px]">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address....."
            required
            style={antonStyle}
            className="flex-1 bg-white/5 border border-white/15 rounded-[12px] px-5 py-3.5 text-cream text-[14px] placeholder:text-cream/30 focus:outline-none focus:border-neon/50 transition-colors"
          />
          <button 
            type="submit"
            style={antonStyle}
            className="group relative px-7 py-3.5 bg-neon text-[#020514] text-[14px] rounded-[12px] overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,204,0.35)] hover:scale-[1.02] whitespace-nowrap cursor-pointer"
          >
            Join the waitlist
          </button>
        </form>

        {/* Khu vực Social & Links */}
        <div className="flex items-center gap-6 flex-wrap justify-center mt-4">
          <a
            href="mailto:swpteam4@fpt.edu.vn"
            style={antonStyle}
            className="flex items-center gap-2 text-cream/50 hover:text-neon transition-colors text-[13px]"
          >
            <Mail size={14} /> swpteam4@fpt.edu.vn
          </a>
          <span className="w-[1px] h-4 bg-white/15" />
          
          <div className="flex items-center gap-3">
            {[Twitter, Github, Mail].map((Icon, i) => (
              <button
                key={i}
                className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-cream/50 hover:text-neon hover:border-neon/40 transition-all duration-300 cursor-pointer"
              >
                <Icon size={15} />
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6 flex-wrap justify-center">
          {["Privacy Policy", "Cookie Settings", "API Docs", "Github Repo"].map((link, i) => {
            let targetUrl = "#";
            if (link === "Privacy Policy") targetUrl = "/privacy-policy";
            if (link === "Cookie Settings") targetUrl = "/cookie-settings";
            
            return (
              <a 
                key={i} 
                href={targetUrl} 
                onClick={(e) => {
                  if (link === "Privacy Policy") openPrivacy(e);
                  if (link === "Cookie Settings") openCookie(e);
                }}
                style={antonStyle}
                className="text-[12px] text-cream/30 hover:text-cream/70 transition-colors cursor-pointer"
              >
                {link}
              </a>
            );
          })}
        </div>

        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        
        {/* Bản quyền phía dưới */}
        <div 
          style={antonStyle}
          className="flex flex-col sm:flex-row justify-between items-center w-full gap-3 text-[11px] text-cream/20"
        >
          <span>© 2026 Mind Space. All rights reserved.</span>
          <span>Engineered by SWP_TEAM_4 · FPT University</span>
        </div>
      </div>

      {/* Chữ lớn MIND SPACE dưới cùng */}
       <div className="relative z-10 w-full overflow-hidden leading-none">

        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-neon/8 to-transparent pointer-events-none" />

        <p

          className="font-grotesk font-black uppercase text-center select-none"

          style={{

            fontSize: "clamp(80px, 18vw, 280px)",

            lineHeight: 1,

            letterSpacing: "-0.01em",

            color: "transparent",

            WebkitTextStroke: "1.5px rgba(245,242,234,0.10)",

            paddingBottom: "0.04em",

          }}

        >

          MIND SPACE

        </p>

      </div>

      {/* ── 🎯 POPUP THÔNG BÁO THÀNH CÔNG ── */}
      <AnimatePresence>
        {showSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSuccess(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-[380px] bg-[#070b1e] border border-neon/30 rounded-2xl p-8 text-center shadow-[0_0_50px_rgba(0,255,204,0.15)] overflow-hidden z-10"
            >
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 bg-neon/10 rounded-full blur-2xl pointer-events-none" />

              <button
                onClick={() => setShowSuccess(false)}
                className="absolute top-4 right-4 text-cream/40 hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="flex justify-center mb-5">
                <svg className="w-16 h-16 text-neon" viewBox="0 0 50 50">
                  <motion.circle
                    cx="25"
                    cy="25"
                    r="22"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, rotate: -90 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                  <motion.path
                    d="M15 26 L22 33 L35 17"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.4, delay: 0.4, ease: "easeInOut" }}
                  />
                </svg>
              </div>

              <h3 style={antonStyle} className="text-xl text-white uppercase tracking-wider mb-2">Success!</h3>
              <p style={antonStyle} className="text-sm text-cream/80 leading-relaxed">Đã tham gia danh sách chờ thành công.</p>
              <div style={antonStyle} className="mt-2 text-[12px] text-neon/60">{email}</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── 🎯 POPUP TRƯỢT TRANG PRIVACY POLICY TOÀN MÀN HÌNH (ĐÃ FIX URL & LENIS) ── */}
      <AnimatePresence>
        {showPrivacy && (
          <motion.div 
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "tween", duration: 0.4, ease: "easeInOut" }}
            className="fixed inset-0 z-50 h-screen w-screen overflow-y-auto bg-[#020514] no-scrollbar"
            data-lenis-prevent="true"
            style={{ touchAction: "pan-y" }}
          >
            {/* Truyền hàm closePrivacy vào onBackClick thay vì chỉ set trạng thái */}
            <PrivacyPolicy onBackClick={closePrivacy} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 🎯 POPUP TRƯỢT TRANG COOKIE SETTINGS TOÀN MÀN HÌNH ── */}
      <AnimatePresence>
        {showCookie && (
          <motion.div 
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "tween", duration: 0.4, ease: "easeInOut" }}
            className="fixed inset-0 z-50 h-screen w-screen overflow-y-auto bg-[#020514] no-scrollbar"
            data-lenis-prevent="true"
            style={{ touchAction: "pan-y" }}
          >
            <CookieSettings onBackClick={closeCookie} />
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  );
}