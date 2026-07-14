import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  Bot, BookOpen, Trophy, Sparkles, ArrowRight, Play,
  Github, Linkedin, Mail, Clock, CheckCircle2,
  Loader2, Menu, X, Brain, Rocket, GraduationCap,
  Code2, Palette, Server, TestTube, Zap, Heart,
  ChevronRight, Star, Users, MessageCircle, Gamepad2,
  FileText, PenTool
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

// ─── Utility ──────────────────────────────────────────────────────────────────
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// ─── Global Styles ────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap');

  .font-display { font-family: 'Outfit', sans-serif; }
  .font-body { font-family: 'Inter', sans-serif; }

  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
  @keyframes wiggle { 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(6deg)} 75%{transform:rotate(-6deg)} }
  @keyframes blob { 0%,100%{border-radius:60% 40% 30% 70%/60% 30% 70% 40%} 50%{border-radius:30% 60% 70% 40%/50% 60% 30% 60%} }
  @keyframes gradient-shift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
  @keyframes confetti-fall { 0%{transform:translateY(-10px) rotate(0deg);opacity:1} 100%{transform:translateY(30px) rotate(360deg);opacity:0} }
  @keyframes pulse-ring { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(1.5);opacity:0} }
  @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  @keyframes bounce-soft { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }

  .animate-float { animation: float 5s ease-in-out infinite; }
  .animate-wiggle { animation: wiggle 3s ease-in-out infinite; }
  .animate-blob { animation: blob 8s ease-in-out infinite; }
  .animate-bounce-soft { animation: bounce-soft 2s ease-in-out infinite; }

  .gradient-text-cartoon {
    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #4ECDC4 60%, #7B61FF 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .shimmer-text {
    background: linear-gradient(90deg, #FF6B6B, #FFD93D, #4ECDC4, #7B61FF, #FF6B6B);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 4s ease-in-out infinite;
  }

  .card-cartoon {
    background: #FFFFFF;
    border: 3px solid #F0EDE6;
    border-radius: 28px;
    transition: all 0.4s cubic-bezier(0.4,0,0.2,1);
  }
  .card-cartoon:hover {
    border-color: #FFD93D;
    transform: translateY(-8px);
    box-shadow: 0 20px 50px rgba(255,217,61,0.15), 0 8px 24px rgba(0,0,0,0.06);
  }

  .btn-cartoon {
    border-radius: 100px;
    font-weight: 800;
    letter-spacing: 0.01em;
    transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
    position: relative;
    overflow: hidden;
  }
  .btn-cartoon::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    opacity: 0;
    transition: opacity 0.3s;
    background: linear-gradient(135deg, rgba(255,255,255,0.3), transparent);
  }
  .btn-cartoon:hover::after { opacity: 1; }

  .animated-underline { position:relative; display:inline-block; }
  .animated-underline::after {
    content:''; position:absolute; bottom:-3px; left:0; width:0; height:3px;
    border-radius:10px; background:linear-gradient(90deg,#FFD93D,#FF6B6B);
    transition:width 0.3s ease;
  }
  .animated-underline:hover::after { width:100%; }

  .timeline-line-bg {
    background: linear-gradient(180deg, #FFD93D 0%, #FF6B6B 30%, #7B61FF 60%, #4ECDC4 100%);
  }

  .paw-pattern {
    background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3Ccircle cx='22' cy='22' r='2.5'/%3E%3Ccircle cx='38' cy='22' r='2.5'/%3E%3Ccircle cx='20' cy='32' r='2.5'/%3E%3Ccircle cx='40' cy='32' r='2.5'/%3E%3C/g%3E%3C/svg%3E");
  }
`;

// ─── Data ─────────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    emoji: "🤖", icon: Bot,
    title: "AI Chatbot Thông Minh",
    desc: "Bạn đồng hành 24/7, trả lời mọi câu hỏi từ bài tập đến lý thuyết. Tạo quiz và flashcard tự động!",
    color: "#FF6B6B", bg: "#FFF0F0",
  },
  {
    emoji: "🏆", icon: Trophy,
    title: "Gamification Siêu Vui",
    desc: "Thu thập huy hiệu, leo bảng xếp hạng, giữ streak mỗi ngày. Học mà như chơi game!",
    color: "#7B61FF", bg: "#F3F0FF",
  },
  {
    emoji: "📚", icon: BookOpen,
    title: "Kho Tài Liệu Thông Minh",
    desc: "Upload tài liệu, AI tự tạo tóm tắt và mind map. Chia sẻ với bạn bè dễ dàng!",
    color: "#4ECDC4", bg: "#EEFCFB",
  },
];

const TIMELINE_DATA = [
  { phase: "01", title: "Nghiên cứu & Thiết kế", desc: "Phân tích yêu cầu, khảo sát người dùng, thiết kế UI/UX prototype", status: "completed" as const, icon: Palette, emoji: "🎨" },
  { phase: "02", title: "Xây dựng Frontend", desc: "Code giao diện React responsive, animations mượt mà, dark/light mode", status: "completed" as const, icon: Code2, emoji: "💻" },
  { phase: "03", title: "Tích hợp Backend & AI", desc: "Kết nối Spring Boot API, tích hợp GPT cho chatbot & quiz generator", status: "active" as const, icon: Server, emoji: "⚙️" },
  { phase: "04", title: "Testing & QA", desc: "Kiểm thử toàn diện, UAT với sinh viên FPT, fix bugs & optimize", status: "upcoming" as const, icon: TestTube, emoji: "🧪" },
  { phase: "05", title: "Ra mắt & Tối ưu", desc: "Deploy production, thu thập feedback, liên tục cải tiến trải nghiệm", status: "upcoming" as const, icon: Rocket, emoji: "🚀" },
];

const TEAM_DATA = [
  { name: "Nguyễn Văn An", role: "Project Leader", bio: "Fullstack dev, đam mê AI & UX", initials: "AN", color: "#FF6B6B", emoji: "🦊" },
  { name: "Trần Minh Khoa", role: "Backend Dev", bio: "Spring Boot expert, API wizard", initials: "MK", color: "#FFD93D", emoji: "🐻" },
  { name: "Lê Thị Hương", role: "Frontend Dev", bio: "React queen, animation lover", initials: "TH", color: "#4ECDC4", emoji: "🐱" },
  { name: "Phạm Đức Dũng", role: "AI Engineer", bio: "NLP nerd, chatbot builder", initials: "DD", color: "#7B61FF", emoji: "🐼" },
  { name: "Hoàng Thanh Mai", role: "UI/UX Designer", bio: "Pixel-perfect, user-first", initials: "TM", color: "#FF6B35", emoji: "🐰" },
  { name: "Võ Quốc Bảo", role: "QA Engineer", bio: "Bug hunter, quality guardian", initials: "QB", color: "#2D3A8C", emoji: "🦖" },
];

const NAV = [
  { label: "Giới thiệu", id: "purpose" },
  { label: "Lộ trình", id: "timeline" },
  { label: "Đội ngũ", id: "team" },
  { label: "Tham gia", id: "cta" },
];

// ─── Animation helpers ────────────────────────────────────────────────────────
const ease4 = [0.16, 1, 0.3, 1] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, y: 35 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.65, delay: i * 0.12, ease: ease4 },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.08 } },
};

const popIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: ease4 } },
};

// ─── Small UI pieces ─────────────────────────────────────────────────────────
function Sticker({ emoji, className, delay = 0 }: { emoji: string; className?: string; delay?: number }) {
  return (
    <motion.span
      className={cn("absolute select-none pointer-events-none text-2xl md:text-3xl", className)}
      animate={{ y: [0, -8, 0], rotate: [0, 8, -8, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay }}
    >
      {emoji}
    </motion.span>
  );
}

function Blob({ color, className, size = 280 }: { color: string; className?: string; size?: number }) {
  return (
    <div
      className={cn("absolute rounded-full animate-blob pointer-events-none", className)}
      style={{ width: size, height: size, background: color, opacity: 0.12, filter: "blur(70px)" }}
    />
  );
}

function SectionHeading({ tag, title, gradient = false }: { tag: string; title: string; gradient?: boolean }) {
  const ref = useRef(null);
  const vis = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} initial="hidden" animate={vis ? "visible" : "hidden"} variants={stagger} className="text-center mb-14 md:mb-20">
      <motion.p variants={fadeUp} className="font-display text-sm font-bold tracking-widest uppercase mb-3" style={{ color: "#FF6B35" }}>
        {tag}
      </motion.p>
      <motion.h2 variants={fadeUp} custom={1} className={cn("font-display text-3xl md:text-5xl lg:text-[3.4rem] font-black tracking-tight leading-[1.12]", gradient ? "gradient-text-cartoon" : "text-[#1A1A2E]")}>
        {title}
      </motion.h2>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export default function CorporateLanding({ onLoginClick }: { onLoginClick: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [tlActive, setTlActive] = useState(-1);
  const footerRef = useRef<HTMLElement>(null);
  const tlRef = useRef<HTMLDivElement>(null);
  const tlLineRef = useRef<HTMLDivElement>(null);

  // Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), wheelMultiplier: 1.1 });
    function raf(time: number) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  // Scroll → navbar bg
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // GSAP: timeline progress + card reveals
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (tlLineRef.current) {
        gsap.fromTo(tlLineRef.current, { scaleY: 0 }, {
          scaleY: 1, ease: "none",
          scrollTrigger: { trigger: tlRef.current, start: "top 70%", end: "bottom 55%", scrub: 1 },
        });
      }
      document.querySelectorAll(".tl-card").forEach((el, i) => {
        gsap.fromTo(el,
          { opacity: 0, x: i % 2 === 0 ? -50 : 50, y: 15 },
          { opacity: 1, x: 0, y: 0, duration: 0.75, ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 82%", toggleActions: "play none none reverse", onEnter: () => setTlActive(i) },
          }
        );
      });
    });
    return () => ctx.revert();
  }, []);

  // GSAP: footer stagger
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!footerRef.current) return;
      gsap.fromTo(footerRef.current.querySelectorAll(".ft-item"),
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, stagger: 0.04, duration: 0.45, ease: "power2.out",
          scrollTrigger: { trigger: footerRef.current, start: "top 82%", toggleActions: "play none none reverse" },
        }
      );
    });
    return () => ctx.revert();
  }, []);

  const goTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  }, []);

  return (
    <div className="font-body relative overflow-x-hidden" style={{ background: "#FFFEF7", color: "#1A1A2E" }}>
      <style>{STYLES}</style>

      {/* ═══════════════ NAVBAR ═══════════════ */}
      <motion.nav
        initial={{ y: -80 }} animate={{ y: 0 }} transition={{ duration: 0.5, ease: ease4 }}
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-400",
          scrolled ? "bg-white/85 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.06)] border-b border-amber-100/60" : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-5 h-16 md:h-[72px] flex items-center justify-between">
          <button onClick={() => goTo("hero")} className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FFD93D] to-[#FF6B6B] flex items-center justify-center shadow-lg shadow-amber-200/50 group-hover:scale-110 transition-transform">
              <Brain size={20} className="text-white" />
            </div>
            <span className="font-display text-lg font-black tracking-tight">
              AI Study <span className="gradient-text-cartoon">Hub</span>
            </span>
          </button>

          <div className="hidden md:flex items-center gap-7">
            {NAV.map((n) => (
              <button key={n.id} onClick={() => goTo(n.id)} className="animated-underline font-display text-[13px] font-bold text-gray-500 hover:text-[#1A1A2E] transition-colors">
                {n.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={onLoginClick}
              className="hidden md:flex btn-cartoon items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#FFD93D] to-[#FF6B6B] text-white font-display text-sm shadow-lg shadow-amber-200/30">
              Đăng nhập <ArrowRight size={15} />
            </motion.button>
            <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-white/95 backdrop-blur-xl border-t border-amber-100 overflow-hidden">
              <div className="px-5 py-5 flex flex-col gap-3">
                {NAV.map((n) => (
                  <button key={n.id} onClick={() => goTo(n.id)} className="font-display font-bold text-sm text-gray-600 text-left py-2">{n.label}</button>
                ))}
                <motion.button whileTap={{ scale: 0.95 }} onClick={onLoginClick}
                  className="mt-2 btn-cartoon flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#FFD93D] to-[#FF6B6B] text-white font-display font-bold text-sm">
                  Đăng nhập <ArrowRight size={15} />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ═══════════════ HERO ═══════════════ */}
      <section id="hero" className="relative min-h-screen flex items-center pt-20 md:pt-0 overflow-hidden">
        <Blob color="#FFD93D" className="top-[5%] left-[-8%]" size={450} />
        <Blob color="#FF6B6B" className="bottom-[10%] right-[-5%]" size={380} />
        <Blob color="#4ECDC4" className="top-[40%] right-[20%]" size={300} />

        <Sticker emoji="⭐" className="top-[12%] left-[6%]" />
        <Sticker emoji="📖" className="top-[18%] right-[10%]" delay={0.8} />
        <Sticker emoji="🎯" className="bottom-[18%] left-[4%]" delay={1.6} />
        <Sticker emoji="💡" className="bottom-[25%] right-[6%]" delay={2.4} />
        <Sticker emoji="🐾" className="top-[50%] left-[12%]" delay={3} />

        <div className="max-w-7xl mx-auto w-full px-5 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center relative z-10">
          {/* Text */}
          <motion.div initial="hidden" animate="visible" variants={stagger} className="text-center lg:text-left order-2 lg:order-1">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border-2 border-amber-200 mb-6">
              <span className="text-base">🎓</span>
              <span className="font-display text-xs font-bold text-amber-700 tracking-wide">Dành cho sinh viên FPT University</span>
            </motion.div>

            <motion.h1 variants={fadeUp} custom={1} className="font-display text-[2.6rem] sm:text-5xl md:text-6xl lg:text-[4.2rem] font-black leading-[1.08] tracking-tight mb-5">
              <span className="gradient-text-cartoon">AI Study Hub</span>
              <br />
              <span>Học vui, hiểu sâu,</span>
              <br />
              <span>nhớ lâu! </span>
              <motion.span animate={{ rotate: [0, 14, -14, 0] }} transition={{ duration: 2, repeat: Infinity }} className="inline-block">✨</motion.span>
            </motion.h1>

            <motion.p variants={fadeUp} custom={2} className="font-body text-base md:text-[17px] text-gray-500 leading-relaxed max-w-lg mx-auto lg:mx-0 mb-8">
              Nền tảng học tập thông minh tích hợp AI — chatbot giải đáp 24/7, quiz tự động từ tài liệu, flashcards thông minh và hệ thống gamification giúp bạn học hiệu quả mỗi ngày!
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <motion.button whileHover={{ scale: 1.06, boxShadow: "0 16px 40px rgba(255,107,107,0.25)" }} whileTap={{ scale: 0.94 }} onClick={onLoginClick}
                className="btn-cartoon flex items-center justify-center gap-2.5 px-8 py-4 bg-gradient-to-r from-[#FF6B6B] to-[#FF6B35] text-white font-display font-black text-[15px] shadow-xl shadow-red-200/30">
                Khám phá ngay 🚀
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => goTo("purpose")}
                className="btn-cartoon flex items-center justify-center gap-2 px-8 py-4 bg-white border-[3px] border-gray-200 text-gray-600 font-display font-bold text-[15px] hover:border-[#FFD93D] hover:text-amber-600 transition-colors">
                <Play size={15} className="fill-current" /> Tìm hiểu thêm
              </motion.button>
            </motion.div>

            <motion.div variants={fadeUp} custom={4} className="flex gap-8 mt-10 justify-center lg:justify-start">
              {[
                { val: "10K+", lbl: "Sinh viên", emoji: "👩‍🎓" },
                { val: "500+", lbl: "Tài liệu", emoji: "📄" },
                { val: "4.9★", lbl: "Đánh giá", emoji: "⭐" },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <div className="font-display text-xl md:text-2xl font-black gradient-text-cartoon">{s.val}</div>
                  <div className="font-body text-[11px] text-gray-400 font-medium mt-1">{s.emoji} {s.lbl}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.25, ease: ease4 }}
            className="relative order-1 lg:order-2 flex justify-center"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#FFD93D]/20 via-[#FF6B6B]/10 to-[#4ECDC4]/15 rounded-[48px] blur-3xl scale-110" />

            <motion.div animate={{ y: [-10, 10, -10] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="relative z-10 w-full max-w-[520px]">
              <img src="/images/section1.png" alt="Cute cartoon animals studying together" className="w-full h-auto drop-shadow-2xl" loading="eager" />
            </motion.div>

            {/* Floating badge cards */}
            <motion.div animate={{ y: [-6, 6, -6], x: [-4, 4, -4] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[8%] -left-2 md:left-2 bg-white rounded-2xl px-4 py-3 shadow-xl border-2 border-amber-100 z-20">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔥</span>
                <div>
                  <div className="font-display text-xs font-black text-gray-800">Streak: 15 ngày</div>
                  <div className="text-[10px] text-gray-400 font-medium">Siêu chăm chỉ!</div>
                </div>
              </div>
            </motion.div>

            <motion.div animate={{ y: [6, -6, 6], x: [3, -3, 3] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
              className="absolute bottom-[12%] -right-2 md:right-2 bg-white rounded-2xl px-4 py-3 shadow-xl border-2 border-purple-100 z-20">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏆</span>
                <div>
                  <div className="font-display text-xs font-black text-gray-800">Top #3</div>
                  <div className="text-[10px] text-gray-400 font-medium">Leaderboard</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        <motion.div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-1.5"
          animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <span className="text-[11px] text-gray-400 font-medium font-display">Cuộn xuống nào!</span>
          <ChevronRight size={14} className="text-gray-400 rotate-90" />
        </motion.div>
      </section>

      {/* ═══════════════ PURPOSE / FEATURES ═══════════════ */}
      <section id="purpose" className="py-24 md:py-32 px-5 relative paw-pattern overflow-hidden">
        <Blob color="#7B61FF" className="top-0 right-[-8%]" size={350} />
        <Blob color="#FFD93D" className="bottom-0 left-[-5%]" size={280} />

        <div className="max-w-7xl mx-auto relative z-10">
          <SectionHeading tag="Tại sao chọn chúng tôi" title="Tại sao AI Study Hub? 🤔" gradient />

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {FEATURES.map((f, i) => (
              <motion.div key={i} variants={fadeUp} custom={i}>
                <div className="card-cartoon p-8 md:p-9 h-full relative overflow-hidden group">
                  <div className="absolute top-0 left-0 right-0 h-[5px] rounded-t-[25px]" style={{ background: f.color }} />

                  <div className="flex items-center gap-3 mb-5">
                    <motion.span className="text-4xl" animate={{ rotate: [0, 12, -12, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}>
                      {f.emoji}
                    </motion.span>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md" style={{ background: f.bg }}>
                      <f.icon size={22} style={{ color: f.color }} />
                    </div>
                  </div>

                  <h3 className="font-display text-xl font-black text-[#1A1A2E] mb-2.5 tracking-tight">{f.title}</h3>
                  <p className="font-body text-[13px] text-gray-500 leading-relaxed">{f.desc}</p>

                  <div className="mt-5 flex items-center gap-1.5 text-[13px] font-display font-bold opacity-0 group-hover:opacity-100 transition-all translate-x-0 group-hover:translate-x-1" style={{ color: f.color }}>
                    Xem thêm <ArrowRight size={13} />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ TIMELINE ═══════════════ */}
      <section id="timeline" className="py-24 md:py-32 px-5 relative" style={{ background: "linear-gradient(180deg, #FFFEF7 0%, #FFF8E7 50%, #FFFEF7 100%)" }}>
        <Sticker emoji="🗓️" className="top-[3%] right-[8%]" />
        <Sticker emoji="✅" className="bottom-[5%] left-[6%]" delay={1.5} />

        <div className="max-w-5xl mx-auto relative z-10">
          <SectionHeading tag="Lộ trình phát triển" title="Hành trình xây dựng 🛤️" gradient />

          <div ref={tlRef} className="relative">
            {/* Vertical line */}
            <div className="absolute left-7 md:left-1/2 md:-translate-x-1/2 top-0 bottom-0 w-[4px] bg-gray-200/60 rounded-full">
              <div ref={tlLineRef} className="w-full h-full timeline-line-bg rounded-full origin-top" />
            </div>

            <div className="space-y-10 md:space-y-14">
              {TIMELINE_DATA.map((item, i) => {
                const left = i % 2 === 0;
                const StatusIcon = item.status === "completed" ? CheckCircle2 : item.status === "active" ? Loader2 : Clock;
                const dotColor = item.status === "completed" ? "#4ECDC4" : item.status === "active" ? "#FFD93D" : "#E2E8F0";

                return (
                  <div key={i} className={cn("tl-card relative flex items-start gap-6 md:gap-0", left ? "md:flex-row" : "md:flex-row-reverse")}>
                    <div className={cn("flex-1 ml-16 md:ml-0", left ? "md:pr-14 md:text-right" : "md:pl-14 md:text-left")}>
                      <motion.div whileHover={{ y: -4 }} className={cn("card-cartoon p-6 md:p-7 inline-block w-full", tlActive >= i && "border-amber-200 shadow-lg")}>
                        <div className={cn("flex items-center gap-2.5 mb-2", left ? "md:justify-end" : "md:justify-start")}>
                          <span className="text-lg">{item.emoji}</span>
                          <span className="font-display text-xs font-bold tracking-widest uppercase gradient-text-cartoon">Phase {item.phase}</span>
                          <StatusIcon size={14} style={{ color: item.status === "active" ? "#FFD93D" : dotColor }} className={item.status === "active" ? "animate-spin" : ""} />
                        </div>
                        <h3 className="font-display text-lg font-black text-[#1A1A2E] tracking-tight mb-1.5">{item.title}</h3>
                        <p className="font-body text-[13px] text-gray-500 leading-relaxed">{item.desc}</p>
                      </motion.div>
                    </div>

                    {/* Dot */}
                    <div className="absolute left-7 md:left-1/2 md:-translate-x-1/2 -translate-x-1/2 w-14 h-14 rounded-full flex items-center justify-center z-10 border-4 border-white transition-all duration-500"
                      style={{ background: tlActive >= i ? `linear-gradient(135deg, #FFD93D, #FF6B6B)` : "#F1F5F9", boxShadow: tlActive >= i ? "0 6px 20px rgba(255,107,107,0.25)" : "none" }}>
                      <item.icon size={20} className={tlActive >= i ? "text-white" : "text-gray-400"} />
                    </div>

                    <div className="hidden md:block flex-1" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ TEAM ═══════════════ */}
      <section id="team" className="py-24 md:py-32 px-5 relative paw-pattern overflow-hidden">
        <Blob color="#4ECDC4" className="top-[8%] right-[-5%]" size={320} />
        <Blob color="#FF6B35" className="bottom-[8%] left-[-6%]" size={280} />
        <Sticker emoji="👨‍💻" className="top-[3%] left-[4%]" />
        <Sticker emoji="🎨" className="top-[5%] right-[7%]" delay={1} />
        <Sticker emoji="⚡" className="bottom-[8%] right-[4%]" delay={2} />

        <div className="max-w-7xl mx-auto relative z-10">
          <SectionHeading tag="Đội ngũ phát triển" title="Gặp gỡ team chúng tôi 👋" />

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-30px" }} variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
            {TEAM_DATA.map((m, i) => (
              <motion.div key={i} variants={popIn} className="group">
                <div className="card-cartoon p-8 h-full text-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.035] transition-opacity rounded-[25px]" style={{ background: m.color }} />

                  <motion.div whileHover={{ scale: 1.1, rotate: 5 }}
                    className="relative w-20 h-20 mx-auto mb-4 rounded-[22px] flex items-center justify-center text-white font-display text-lg font-black shadow-lg border-4 border-white"
                    style={{ background: `linear-gradient(135deg, ${m.color}, ${m.color}BB)`, boxShadow: `0 10px 28px ${m.color}28` }}>
                    <span className="absolute -top-2 -right-2 text-xl">{m.emoji}</span>
                    {m.initials}
                  </motion.div>

                  <h3 className="font-display text-lg font-black text-[#1A1A2E] tracking-tight mb-0.5">{m.name}</h3>
                  <p className="font-display text-[11px] font-bold uppercase tracking-widest mb-2.5" style={{ color: m.color }}>{m.role}</p>
                  <p className="font-body text-[13px] text-gray-500 leading-relaxed mb-5">{m.bio}</p>

                  <div className="flex justify-center gap-2.5 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                    {[Github, Linkedin].map((Icon, j) => (
                      <motion.button key={j} whileHover={{ scale: 1.18, rotate: j === 0 ? 6 : -6 }}
                        className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                        style={{ ["--hover-bg" as string]: j === 0 ? "#1A1A2E" : "#0A66C2" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = j === 0 ? "#1A1A2E" : "#0A66C2"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#F3F4F6"; }}>
                        <Icon size={15} />
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ CTA ═══════════════ */}
      <section id="cta" className="py-24 md:py-32 px-5 relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 35 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.7, ease: ease4 }}>
            <div className="relative rounded-[36px] overflow-hidden">
              {/* Animated gradient border */}
              <div className="absolute inset-0 rounded-[36px] p-[3px]"
                style={{ background: "linear-gradient(135deg, #FFD93D, #FF6B6B, #7B61FF, #4ECDC4, #FFD93D)", backgroundSize: "300% 300%", animation: "gradient-shift 5s ease infinite" }}>
                <div className="w-full h-full rounded-[33px]" style={{ background: "#FFFEF7" }} />
              </div>

              <div className="relative z-10 rounded-[33px] p-10 md:p-16 text-center" style={{ background: "linear-gradient(135deg, #FFFEF7, #FFF8E7)" }}>
                <Sticker emoji="🎓" className="top-5 left-7" />
                <Sticker emoji="🌟" className="top-7 right-9" delay={1} />
                <Sticker emoji="📖" className="bottom-5 left-10" delay={2} />
                <Sticker emoji="🐾" className="bottom-7 right-8" delay={3} />

                <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="relative z-10">
                  <motion.p variants={fadeUp} className="text-3xl mb-3">🎉</motion.p>
                  <motion.h2 variants={fadeUp} custom={1}
                    className="font-display text-3xl md:text-5xl lg:text-[3.4rem] font-black tracking-tight leading-[1.12] mb-5">
                    Sẵn sàng trở thành
                    <br />
                    <span className="shimmer-text">học viên thông minh?</span>
                  </motion.h2>
                  <motion.p variants={fadeUp} custom={2} className="font-body text-base text-gray-500 leading-relaxed max-w-xl mx-auto mb-10">
                    Hơn 10,000 sinh viên FPT đã tin tưởng sử dụng AI Study Hub. Tham gia ngay để khám phá cách học tập thú vị và hiệu quả hơn!
                  </motion.p>
                  <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4 justify-center">
                    <motion.button whileHover={{ scale: 1.06, boxShadow: "0 18px 45px rgba(255,107,107,0.28)" }} whileTap={{ scale: 0.94 }} onClick={onLoginClick}
                      className="btn-cartoon flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-[#FF6B6B] to-[#FF6B35] text-white font-display font-black text-base shadow-xl shadow-red-200/30">
                      Đăng ký ngay
                      <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 1.2, repeat: Infinity }}>
                        <ArrowRight size={19} />
                      </motion.span>
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      className="btn-cartoon flex items-center justify-center gap-2 px-10 py-5 bg-white border-[3px] border-gray-200 text-gray-600 font-display font-bold text-base hover:border-[#4ECDC4] hover:text-teal-600 transition-colors">
                      <MessageCircle size={17} /> Liên hệ
                    </motion.button>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer ref={footerRef} className="relative overflow-hidden text-white"
        style={{ background: "linear-gradient(135deg, #2D3A8C 0%, #1A1A4E 40%, #16213E 70%, #2D3A8C 100%)", backgroundSize: "200% 200%", animation: "gradient-shift 10s ease infinite" }}>
        {/* Wave */}
        <div className="absolute top-0 left-0 right-0 -translate-y-[98%]">
          <svg viewBox="0 0 1440 80" fill="none" className="w-full"><path d="M0 80L80 68C160 56 320 32 480 26C640 20 800 32 960 38C1120 44 1280 28 1360 20L1440 12V80H0Z" fill="#2D3A8C" /></svg>
        </div>

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[25%] left-[10%] w-56 h-56 rounded-full bg-[#FFD93D] opacity-[0.04] blur-[70px] animate-blob" />
          <div className="absolute bottom-[20%] right-[12%] w-44 h-44 rounded-full bg-[#FF6B6B] opacity-[0.05] blur-[60px] animate-blob" style={{ animationDelay: "3s" }} />
          <div className="absolute top-[50%] left-[45%] w-64 h-64 rounded-full bg-[#4ECDC4] opacity-[0.03] blur-[90px] animate-blob" style={{ animationDelay: "6s" }} />
        </div>

        <div className="max-w-7xl mx-auto px-5 pt-20 pb-10 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">
            <div className="lg:col-span-1">
              <div className="ft-item flex items-center gap-2.5 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FFD93D] to-[#FF6B6B] flex items-center justify-center shadow-lg">
                  <Brain size={20} className="text-white" />
                </div>
                <span className="font-display text-base font-black">AI Study Hub</span>
              </div>
              <p className="ft-item font-body text-[13px] text-white/35 leading-relaxed mb-5">
                Nền tảng học tập thông minh cho sinh viên FPT. Được xây dựng với ❤️ bởi team SWP391.
              </p>
              <div className="flex gap-2.5">
                {[Github, Linkedin, Mail].map((Icon, j) => (
                  <motion.button key={j} whileHover={{ scale: 1.15, rotate: 6 }}
                    className="ft-item w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.06] flex items-center justify-center text-white/35 hover:text-white hover:bg-white/10 transition-all">
                    <Icon size={16} />
                  </motion.button>
                ))}
              </div>
            </div>

            {[
              { title: "Sản phẩm", links: ["AI Chatbot", "Quiz Generator", "Flashcards", "Leaderboard", "Study Planner"] },
              { title: "Tài nguyên", links: ["Hướng dẫn", "Blog", "API Docs", "Changelog", "Roadmap"] },
              { title: "Liên hệ", links: ["Về chúng tôi", "Đội ngũ", "Email hỗ trợ", "Báo lỗi", "Đóng góp"] },
            ].map((col, ci) => (
              <div key={ci}>
                <h4 className="ft-item font-display text-[11px] font-black text-white/50 uppercase tracking-[0.14em] mb-4">{col.title}</h4>
                <div className="flex flex-col gap-2.5">
                  {col.links.map((l, li) => (
                    <span key={li} className="ft-item animated-underline font-body text-[13px] text-white/30 hover:text-white transition-colors cursor-pointer w-fit">{l}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-white/[0.06] pt-7 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="ft-item font-body text-[11px] text-white/20">
              © 2025 AI Study Hub — SWP391 Project. Made with <Heart size={11} className="inline text-[#FF6B6B]" /> at FPT University.
            </p>
            <div className="flex gap-5">
              {["Chính sách", "Điều khoản", "Cookie"].map((t, i) => (
                <span key={i} className="ft-item animated-underline font-body text-[11px] text-white/20 hover:text-white/50 cursor-pointer transition-colors">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}