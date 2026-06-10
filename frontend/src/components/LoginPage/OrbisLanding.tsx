import { useState, useEffect, useRef } from "react";
import { Mail, Twitter, Github, ChevronRight, Volume2, VolumeX, Play, Pause } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "@studio-freight/lenis";
import TimeLineSection from "./LandingPage/TimeLineSection";
// ─── ASSETS ────────────────────────────────────────────────────────────────────
const HERO_VIDEO = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_045634_e1c98c76-1265-4f5c-882a-4276f2080894.mp4";
const ABOUT_VIDEO = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_151551_992053d1-3d3e-4b8c-abac-45f22158f411.mp4";
const CTA_VIDEO = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_055729_72d66327-b59e-4ae9-bb70-de6ccb5ecdb0.mp4";

const NFTS = [
  { src: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_053923_22c0a6a5-313c-474c-85ff-3b50d25e944a.mp4", score: "8.7/10" },
  { src: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_054411_511c1b7a-fb2f-42ef-bf6c-32c0b1a06e79.mp4", score: "9/10" },
  { src: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_055427_ac7035b5-9f3b-4289-86fc-941b2432317d.mp4", score: "8.2/10" },
  { src: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_053923_22c0a6a5-313c-474c-85ff-3b50d25e944a.mp4", score: "9.5/10" },
  { src: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_054411_511c1b7a-fb2f-42ef-bf6c-32c0b1a06e79.mp4", score: "8.9/10" },
  { src: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_055427_ac7035b5-9f3b-4289-86fc-941b2432317d.mp4", score: "9.2/10" },
];

const NAV_ITEMS = [
  { name: "HOMEPAGE", id: "homepage" },
  { name: "OBJECTIVES", id: "objectives" },
  { name: "TIMELINE", id: "timeline" },
  { name: "CREATORS", id: "creators" },
  { name: "OUR JOURNEY", id: "our-journey" },
];

const TIMELINE_DATA = [
  {
    date: "13 May '26",
    phase: "Phase 01: Project Kickoff",
    title: "REQUIREMENTS & SYSTEM ARCHITECTURE",
    desc: "Khởi động dự án, thiết lập kho lưu trữ mã nguồn chung. Phân tích chi tiết yêu cầu phần mềm, phác thảo sơ đồ ERD và thiết kế Wireframe ban đầu.",
  },
  {
    date: "26 May '26",
    phase: "Phase 02: Alpha Milestone",
    title: "CORE FUNCTIONALITY & INTEGRATION",
    desc: "Xây dựng các API cốt lõi và tích hợp hệ thống module logic. Cấu hình cơ sở dữ liệu nền tảng và kết nối kiểm thử dữ liệu mô phỏng theo thời gian thực.",
  },
  {
    date: "09 June '26",
    phase: "Phase 03: Midterm Progress",
    title: "MIDTERM EVALUATION & OPTIMIZATION",
    desc: "Đánh giá chặng giữa, tối ưu hóa câu lệnh truy vấn và xử lý logic luồng bất đồng bộ. Hoàn thiện các cấu trúc nghiệp vụ cơ bản chuẩn bị cho giai đoạn mở rộng.",
  },
  {
    date: "23 June '26",
    phase: "Phase 04: Beta Deployment",
    title: "SYSTEM TESTING & STAGING",
    desc: "Triển khai quy trình Unit Test và Integration Test. Khắc phục lỗ hổng hệ thống và phát hành phiên bản thử nghiệm trên môi trường Staging.",
  },
  {
    date: "04 July '26",
    phase: "Phase 05: Final Release",
    title: "PRODUCTION READY & PRESENTATION",
    desc: "Đóng gói mã nguồn hoàn chỉnh, cấu hình Production. Chuẩn bị tài liệu kỹ thuật, slide báo cáo tiếng Anh và nghiệm thu sản phẩm trước hội đồng.",
  },
];

const REVEAL_TEXT =
  "The goal of AI Study Hub is to boost the joy of learning and enhance knowledge skills for students at FPT University — while gaining an intelligent overview of academic progress. Let's make studying a fun adventure!";

const ACCENT_WORDS = new Set(["AI", "Study", "Hub", "FPT", "University", "intelligent"]);

// ─── SOCIAL BUTTON ─────────────────────────────────────────────────────────────
function SocialBtn({ Icon }: { Icon: typeof Mail }) {
  return (
    <button className="liquid-glass rounded-[1rem] w-14 h-14 flex items-center justify-center text-cream hover:bg-white/10 hover:text-neon transition-all duration-300">
      <Icon size={20} />
    </button>
  );
}

// ─── MARQUEE BANNER ────────────────────────────────────────────────────────────
function TopMarqueeBanner() {
  const text =
    "SYSTEM STATUS: OPERATIONAL [ALL SERVICES GREEN] • WELCOME TO MIND SPACE — NEXT-GEN KNOWLEDGE PLATFORM • INITIALIZING AI CO-PILOT INTEGRATION 24/7 • CONNECTING TO FUOVERFLOW KNOWLEDGE BASE • ENGINEERED BY SWP_TEAM_4 • REVEAL WHAT'S HIDDEN, DEFINE WHAT'S NEXT • ";
  return (
    <>
      <style>{`
        @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .marquee-track { display:flex; width:max-content; animation:marquee 200s linear infinite; }
        .marquee-track:hover { animation-play-state:paused; }
      `}</style>
      <div className="w-full bg-neon text-space py-4 overflow-hidden border-b border-white/10 z-50 relative select-none">
        <div className="marquee-track font-mono text-[11px] font-bold tracking-[0.15em] uppercase flex items-center gap-10">
          <span>{text.repeat(4)}</span>
          <span>{text.repeat(4)}</span>
        </div>
      </div>
    </>
  );
}

// ─── FOOTER (LESA-style) ───────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="relative bg-[#020514] overflow-hidden select-none">
      {/* subtle grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,255,204,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,204,1) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />
      {/* ── top content area ── */}
      <div className="relative z-10 max-w-[1200px] mx-auto px-5 sm:px-8 lg:px-14 pt-24 pb-16 flex flex-col items-center gap-12 text-center">
        {/* CTA text */}
        <h2 className="font-grotesk font-bold text-[28px] sm:text-[36px] lg:text-[44px] text-white leading-[1.2] max-w-[680px]">
          AI Study Hub is set to launch in{" "}
          <span className="text-neon">Fall 2026.</span>
          <br />
          Join the waitlist today.
        </h2>

        {/* Email input row */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-[520px]">
          <input
            type="email"
            placeholder="Your email address....."
            className="flex-1 bg-white/5 border border-white/15 rounded-[12px] px-5 py-3.5 text-cream font-mono text-[13px] placeholder:text-cream/30 focus:outline-none focus:border-neon/50 transition-colors"
          />
          <button className="group relative px-7 py-3.5 bg-neon text-space font-grotesk font-bold uppercase tracking-[0.12em] text-[12px] rounded-[12px] overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,204,0.35)] hover:scale-[1.02] whitespace-nowrap">
            Join the waitlist
          </button>
        </div>

        {/* Contact + social row */}
        <div className="flex items-center gap-6 flex-wrap justify-center">
          <a
            href="mailto:swpteam4@fpt.edu.vn"
            className="flex items-center gap-2 text-cream/50 hover:text-neon transition-colors font-mono text-[12px] uppercase tracking-wider"
          >
            <Mail size={14} />
            swpteam4@fpt.edu.vn
          </a>
          <span className="w-[1px] h-4 bg-white/15" />
          <div className="flex items-center gap-3">
            {[Twitter, Github, Mail].map((Icon, i) => (
              <button
                key={i}
                className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-cream/50 hover:text-neon hover:border-neon/40 transition-all duration-300"
              >
                <Icon size={15} />
              </button>
            ))}
          </div>
        </div>

        {/* Links */}
        <div className="flex items-center gap-6 flex-wrap justify-center">
          {["Privacy Policy", "Cookie Settings", "API Docs", "Github Repo"].map((link, i) => (
            <a
              key={i}
              href="#"
              className="font-mono text-[11px] uppercase tracking-widest text-cream/30 hover:text-cream/70 transition-colors"
            >
              {link}
            </a>
          ))}
        </div>

        {/* Divider */}
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Copyright row */}
        <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-3 text-[10px] font-mono uppercase tracking-widest text-cream/20">
          <span>© 2026 Mind Space. All rights reserved.</span>
          <span>Engineered by SWP_TEAM_4 · FPT University</span>
        </div>
      </div>

      {/* ── BIG WORDMARK (LESA-style) ── */}
      <div className="relative z-10 w-full overflow-hidden leading-none">
        {/* neon glow behind letters */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-neon/8 to-transparent pointer-events-none" />
        <p
          className="font-grotesk font-black uppercase text-center select-none"
          style={{
            fontSize: "clamp(80px, 18vw, 280px)",
            lineHeight: 0.88,
            letterSpacing: "-0.04em",
            color: "transparent",
            WebkitTextStroke: "1.5px rgba(245,242,234,0.10)",
            paddingBottom: "0.04em",
          }}
        >
          MIND SPACE
        </p>
      </div>
    </footer>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function OrbisLanding({ onLoginClick }: { onLoginClick: () => void }) {
  const [activeSection, setActiveSection] = useState("homepage");
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  const videoRefs = useRef<HTMLVideoElement[]>([]);
  const lenisRef = useRef<Lenis | null>(null);
  const isPlayingRef = useRef(isPlaying);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  // ── GSAP + Lenis setup ──────────────────────────────────────────────────────
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const scrollContainer = document.getElementById("orbis-scroll-wrapper");
    if (!scrollContainer) return;

    const lenis = new Lenis({
      wrapper: scrollContainer,
      content: scrollContainer,
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.defaults({ scroller: scrollContainer });

    // video play/pause on scroll
    const setupVideoTrigger = (selector: string) => {
      const section = document.querySelector(selector);
      const video = section?.querySelector("video");
      if (!video) return;
      ScrollTrigger.create({
        trigger: selector,
        start: "top bottom",
        end: "bottom top",
        onEnter: () => { if (isPlayingRef.current) video.play().catch(() => { }) },
        onLeave: () => video.pause(),
        onEnterBack: () => { if (isPlayingRef.current) video.play().catch(() => { }) },
        onLeaveBack: () => video.pause(),
      });
    };
    setupVideoTrigger("#homepage");
    setupVideoTrigger("#objectives");
    setupVideoTrigger("#our-journey");

    document.querySelectorAll(".nft-card-trigger").forEach((card) => {
      const vid = card.querySelector("video");
      if (!vid) return;
      ScrollTrigger.create({
        trigger: card,
        start: "top bottom",
        end: "bottom top",
        onEnter: () => { if (isPlayingRef.current) vid.play().catch(() => { }) },
        onLeave: () => vid.pause(),
        onEnterBack: () => { if (isPlayingRef.current) vid.play().catch(() => { }) },
        onLeaveBack: () => vid.pause(),
      });
    });

    // hero parallax
    gsap.to(".hero-video-parallax", {
      scrollTrigger: { trigger: "#homepage", start: "top top", end: "bottom top", scrub: true },
      yPercent: 20, ease: "none",
    });
    gsap.to(".hero-title-trigger", {
      scrollTrigger: { trigger: "#homepage", start: "top top", end: "bottom center", scrub: true },
      y: -120, opacity: 0.15,
    });
    gsap.to(".hero-subtitle-parallax", {
      scrollTrigger: { trigger: "#homepage", start: "top top", end: "bottom center", scrub: true },
      y: -180, rotate: -5,
    });

    // objectives video parallax
    gsap.to(".about-video-parallax", {
      scrollTrigger: { trigger: "#objectives", start: "top bottom", end: "bottom top", scrub: true },
      yPercent: 15, ease: "none",
    });

    // word reveal for objectives
    const revealEl = document.getElementById("objectives-reveal-text");
    if (revealEl) {
      const words = REVEAL_TEXT.split(" ");
      revealEl.innerHTML = words
        .map((w) => {
          const clean = w.replace(/[^a-zA-Z]/g, "");
          const accent = ACCENT_WORDS.has(clean);
          return `<span class="rv-word${accent ? " rv-accent" : ""}" style="display:inline;color:rgba(245,242,234,0.15);transition:color 0.35s ease;">${w} </span>`;
        })
        .join("");

      const plain = revealEl.querySelectorAll<HTMLElement>(".rv-word:not(.rv-accent)");
      const accents = revealEl.querySelectorAll<HTMLElement>(".rv-accent");

      ScrollTrigger.create({
        trigger: "#objectives",
        start: "top 75%",
        end: "bottom 15%",
        scrub: 0.6,
        onUpdate: (self) => {
          const p = self.progress;
          const limit = Math.floor(p * plain.length);
          plain.forEach((s, i) => {
            s.style.color = i < limit ? "#F5F2EA" : "rgba(245,242,234,0.15)";
          });
          accents.forEach((s) => {
            s.style.color = p > 0.06 ? "#00ffcc" : "rgba(0,255,204,0.18)";
          });
        },
      });
    }

    // timeline rows
    document.querySelectorAll(".timeline-row").forEach((row) => {
      const dateText = row.querySelector(".timeline-date-text");
      const statusLine = row.querySelector(".timeline-line");
      const card = row.querySelector(".timeline-content-card");

      const activate = () => {
        gsap.to(dateText, { color: "#F5F2EA", opacity: 1, scale: 1.05, duration: 0.3 });
        gsap.to(statusLine, { backgroundColor: "#00ffcc", scaleY: 1.1, duration: 0.4 });
        gsap.to(card, { borderColor: "rgba(0,255,204,0.3)", backgroundColor: "rgba(0,0,0,0.6)", duration: 0.4 });
      };
      const deactivate = () => {
        gsap.to(dateText, { color: "#F5F2EA", opacity: 0.2, scale: 1, duration: 0.3 });
        gsap.to(statusLine, { backgroundColor: "rgba(255,255,255,0.1)", scaleY: 1, duration: 0.4 });
        gsap.to(card, { borderColor: "rgba(255,255,255,0.05)", backgroundColor: "rgba(0,0,0,0.2)", duration: 0.4 });
      };

      ScrollTrigger.create({
        trigger: row,
        start: "top center+=80",
        end: "bottom center-=80",
        onEnter: activate, onLeave: deactivate,
        onEnterBack: activate, onLeaveBack: deactivate,
      });
    });

    // NFT card parallax
    document.querySelectorAll(".nft-card-trigger").forEach((card, i) => {
      const speed = (i % 3 + 1) * 30;
      gsap.fromTo(card,
        { y: speed * 1.5, rotateX: 10 },
        {
          scrollTrigger: { trigger: "#creators", start: "top bottom", end: "bottom top", scrub: 1 },
          y: -speed, rotateX: -5, ease: "power1.out",
        }
      );
    });

    // CTA video parallax
    gsap.to(".cta-video-parallax", {
      scrollTrigger: { trigger: "#our-journey", start: "top bottom", end: "bottom top", scrub: true },
      yPercent: 20, ease: "none",
    });

    return () => {
      lenis.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  // ── Active section tracker ──────────────────────────────────────────────────
  useEffect(() => {
    const sections = NAV_ITEMS.map((item) => document.getElementById(item.id));
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.id && setActiveSection(e.target.id)),
      { threshold: 0.3, rootMargin: "-10% 0px -40% 0px" }
    );
    sections.forEach((s) => s && observer.observe(s));
    return () => sections.forEach((s) => s && observer.unobserve(s));
  }, []);

  // ── Video controls ──────────────────────────────────────────────────────────
  const togglePlay = () => {
    videoRefs.current.forEach((v) => {
      if (!v) return;
      const { top, bottom } = v.getBoundingClientRect();
      const visible = top < window.innerHeight && bottom > 0;
      if (isPlaying) v.pause();
      else if (visible) v.play().catch(() => { });
    });
    setIsPlaying((p) => !p);
  };

  const toggleMute = () => {
    videoRefs.current.forEach((v) => { if (v) v.muted = !isMuted; });
    setIsMuted((m) => !m);
  };

  const registerVideoRef = (el: HTMLVideoElement | null) => {
    if (el && !videoRefs.current.includes(el)) videoRefs.current.push(el);
  };

  const handleNavScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el && lenisRef.current) {
      lenisRef.current.scrollTo(el, { offset: 0, duration: 1.2 });
      window.history.pushState(null, "", `#${id}`);
      setActiveSection(id);
    }
  };

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="bg-space text-cream font-mono select-none selection:bg-neon selection:text-space relative perspective-1000 overflow-hidden">
      <TopMarqueeBanner />

      {/* FLOATING VIDEO CONTROLLER */}
      <div className="fixed bottom-6 right-6 z-50 flex gap-2 bg-[#020a21]/80 backdrop-blur-md border border-white/10 p-1.5 rounded-full shadow-2xl">
        <button
          onClick={togglePlay}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isPlaying ? "text-cream hover:bg-white/15" : "bg-neon text-space"}`}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={15} /> : <Play size={15} />}
        </button>
        <button
          onClick={toggleMute}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${!isMuted ? "bg-purple-500 text-white" : "text-cream/60 hover:bg-white/15"}`}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>
      </div>

      {/* ── SECTION 1 · HERO ────────────────────────────────────────────────── */}
      <section id="homepage" className="relative w-full min-h-screen overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <video
            ref={registerVideoRef}
            preload="metadata" loop muted={isMuted} playsInline
            className="hero-video-parallax absolute inset-0 w-full h-[120%] object-cover brightness-[0.85] will-change-transform"
            src={HERO_VIDEO}
          />
        </div>

        <div className="relative max-w-[1831px] mx-auto px-5 sm:px-8 lg:px-14 py-6 min-h-screen flex flex-col z-10">
          {/* NAV */}
          <header className="flex items-center justify-between">
            <span className="font-grotesk text-[25px] uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-neon animate-pulse" />
              MIND SPACE
            </span>

            <nav className="hidden lg:block liquid-glass rounded-[28px] px-[52px] py-[24px] border border-white/5">
              <ul className="flex gap-10">
                {NAV_ITEMS.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => handleNavScroll(e, item.id)}
                      className={`font-grotesk text-[13px] uppercase tracking-wider transition-all relative py-1 block ${activeSection === item.id ? "text-neon" : "text-cream/60 hover:text-cream"
                        }`}
                    >
                      {item.name}
                      {activeSection === item.id && (
                        <span className="absolute bottom-0 left-0 w-full h-[2px] bg-neon rounded-full" />
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="hidden lg:flex flex-col gap-3">
              <SocialBtn Icon={Mail} />
              <SocialBtn Icon={Twitter} />
              <SocialBtn Icon={Github} />
            </div>
          </header>

          {/* HERO COPY */}
          <div className="flex-1 flex items-end pb-20 lg:pb-32 hero-title-trigger will-change-transform">
            <div className="relative lg:ml-32 max-w-[780px]">
              <h1 className="font-grotesk uppercase text-[40px] sm:text-[60px] md:text-[75px] lg:text-[90px] leading-[1.05] sm:leading-[1] tracking-tighter">
                Beyond earth
                <br />
                and ( its ) familiar boundaries
              </h1>
              <span className="hero-subtitle-parallax font-condiment text-neon text-[24px] sm:text-[32px] md:text-[40px] lg:text-[48px] absolute -right-2 lg:right-8 top-2 -rotate-1 opacity-90 mix-blend-exclusion will-change-transform">
                Nft collection
              </span>

              <div className="mt-10 flex justify-center">
                <button
                  onClick={onLoginClick}
                  className="group relative px-10 py-4 bg-transparent border border-neon text-neon font-grotesk uppercase tracking-[0.2em] text-xs overflow-hidden transition-all duration-300 hover:text-black hover:shadow-[0_0_25px_rgba(0,255,140,0.4)]"
                >
                  <span className="relative z-10 flex items-center gap-2 font-bold">
                    Get in touch
                    <ChevronRight size={14} className="group-hover:translate-x-1.5 transition-transform duration-300" />
                  </span>
                  <div className="absolute inset-0 bg-neon scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex lg:hidden justify-center gap-3 pb-10">
            <SocialBtn Icon={Mail} />
            <SocialBtn Icon={Twitter} />
            <SocialBtn Icon={Github} />
          </div>
        </div>
      </section>

      {/* ── SECTION 2 · OBJECTIVES (LESA-style word reveal) ─────────────────── */}
      <section id="objectives" className="relative w-full min-h-screen overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <video
            ref={registerVideoRef}
            preload="metadata"
            loop
            muted={isMuted}
            playsInline
            className="about-video-parallax absolute inset-0 w-full h-[120%] object-cover brightness-[0.7] will-change-transform"
            src={ABOUT_VIDEO}
          />
        </div>
        <div className="relative z-10 max-w-[1831px] mx-auto px-5 sm:px-8 lg:px-14 py-16 lg:py-24 min-h-screen flex flex-col justify-between gap-16">
          <div className="flex flex-col lg:flex-row justify-between gap-10">
            <div className="relative">
              <h2 className="font-grotesk uppercase text-[32px] sm:text-[44px] lg:text-[60px] leading-[1]">
                Hello!
                <br />
                I'm orbis
              </h2>
              <span className="font-condiment text-neon text-[36px] sm:text-[52px] lg:text-[68px] absolute -bottom-4 right-0 -rotate-3 mix-blend-exclusion">
                Orbis
              </span>
            </div>
            <p className="font-mono text-[14px] lg:text-[15px] uppercase text-cream/90 max-w-[320px] leading-relaxed border-l-2 border-neon pl-4">
              A digital object fixed beyond time and place. An exploration of distance, form, and
              silence in deep space exploration systems.
            </p>
          </div>
          <p
            id="objectives-reveal-text"
            className="text-center font-grotesk font-bold text-[28px] sm:text-[36px] lg:text-[48px] leading-[1.25] max-w-[900px]"
          ></p>

        </div>
      </section>

      {/* SECTION: SCROLL TIMELINE */}

      {/* <section id="timeline" className="relative w-full bg-[#050b1a] py-24 lg:py-36 border-t border-b border-white/5 overflow-hidden">
        <div className="max-w-[1831px] mx-auto px-5 sm:px-8 lg:px-14">
          <div className="mb-20">
            <h2 className="font-grotesk uppercase text-[32px] sm:text-[44px] lg:text-[60px] leading-[1]">
              DEVELOPMENT <br />
              <span className="font-condiment text-neon normal-case tracking-normal">Journey</span> Milestones
            </h2>
          </div>

          <div className="relative flex flex-col w-full">
            {TIMELINE_DATA.map((item, index) => (
              <div key={index} className="timeline-row grid grid-cols-12 gap-4 md:gap-8 min-h-[45vh] items-start relative py-6">
                <div className="col-span-12 md:col-span-4 flex items-center md:justify-end md:text-right sticky top-1/2">
                  <div className="timeline-date-text text-[32px] sm:text-[40px] lg:text-[52px] font-grotesk uppercase leading-none opacity-20 transition-all duration-300 text-cream whitespace-nowrap">
                    {item.date}
                  </div>
                </div>

                <div className="hidden md:col-span-1 md:flex justify-center h-full absolute left-1/3 transform -translate-x-1/2 top-0 bottom-0">
                  <div className="w-[1px] h-full bg-white/10 relative flex justify-center">
                    <div className="timeline-line absolute top-0 bottom-0 w-[2px] bg-white/10 scale-y-[0.3] origin-top transition-all duration-300" />
                    <div className="w-3 h-3 rounded-full bg-space border-2 border-white/30 absolute top-2 z-10 shadow-sm" />
                  </div>
                </div>

                <div className="col-span-12 md:col-span-7 md:pl-8">
                  <div className="timeline-content-card liquid-glass bg-black/20 border border-white/5 p-6 sm:p-8 rounded-[24px] transition-all duration-300 hover:border-white/10">
                    <span className="text-[11px] text-neon font-bold tracking-widest block mb-2 uppercase">
                      {item.phase}
                    </span>
                    <h3 className="font-grotesk text-lg sm:text-xl text-white mb-4 tracking-wide uppercase">
                      {item.title}
                    </h3>
                    <p className="text-[13px] text-cream/60 leading-relaxed font-sans font-light">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}
      <TimeLineSection TIMELINE_DATA={TIMELINE_DATA} />
      {/* ── SECTION 4 · CREATORS GRID ───────────────────────────────────────── */}
      <section id="creators" className="bg-space py-20 lg:py-28 overflow-hidden">
        <div className="max-w-[1831px] mx-auto px-5 sm:px-8 lg:px-14">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-10 mb-12">
            <h2 className="font-grotesk uppercase text-[32px] sm:text-[44px] lg:text-[60px] leading-[1]">
              Collection of
              <br />
              <span className="ml-12 md:ml-24 lg:ml-32 inline-block">
                <span className="font-condiment text-neon normal-case">Space</span> objects
              </span>
            </h2>
            <div className="flex flex-col items-end group cursor-pointer">
              <div className="flex items-end gap-3 font-grotesk uppercase">
                <span className="text-[32px] sm:text-[48px] lg:text-[60px] leading-none group-hover:text-neon transition-colors">SEE</span>
                <div className="flex flex-col leading-tight">
                  <span className="text-[20px] sm:text-[28px] lg:text-[36px]">ALL</span>
                  <span className="text-[20px] sm:text-[28px] lg:text-[36px] text-cream/50">CREATORS</span>
                </div>
              </div>
              <div className="bg-neon w-full h-[6px] lg:h-[10px] mt-3 group-hover:scale-x-105 transition-transform origin-right" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-10">
            {NFTS.map((n, index) => (
              <div
                key={`nft-${index}`}
                className="nft-card-trigger will-change-transform liquid-glass rounded-[32px] p-[18px] hover:bg-white/10 transition group"
              >
                <div className="relative w-full pb-[100%] rounded-[24px] overflow-hidden">
                  <video
                    ref={registerVideoRef}
                    preload="metadata" loop muted={isMuted} playsInline
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    src={n.src}
                  />
                  <div className="absolute left-3 right-3 bottom-3 liquid-glass rounded-[20px] px-5 py-4 flex items-center justify-between border border-white/5">
                    <div className="flex flex-col">
                      <span className="text-[11px] text-cream/70 font-mono uppercase">Rarity Score:</span>
                      <span className="text-[16px] font-grotesk text-neon">{n.score}</span>
                    </div>
                    <button className="w-12 h-12 rounded-full bg-gradient-to-br from-[#b724ff] to-[#7c3aed] shadow-lg shadow-purple-500/50 group-hover:scale-110 transition flex items-center justify-center text-white">
                      <ChevronRight size={22} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 5 · CTA ─────────────────────────────────────────────────── */}
      <section id="our-journey" className="relative w-full min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <video
            ref={registerVideoRef}
            preload="metadata" loop muted={isMuted} playsInline
            className="cta-video-parallax absolute inset-0 w-full h-[120%] object-cover brightness-[0.65] will-change-transform"
            src={CTA_VIDEO}
          />
        </div>
        <div className="relative z-10 w-full max-w-[1831px] mx-auto px-5 sm:px-8 lg:px-14 py-20 min-h-screen flex flex-col justify-between">
          <div className="w-full flex justify-end pt-[5%]">
            <div className="relative text-right max-w-[850px]">
              <span className="font-condiment text-neon text-[24px] sm:text-[48px] lg:text-[68px] absolute -top-8 -left-6 lg:-top-14 lg:-left-14 -rotate-3 mix-blend-exclusion">
                Go beyond
              </span>
              <h2 className="font-grotesk uppercase text-[20px] sm:text-[38px] lg:text-[60px] leading-[1.05] text-[#F5F2EA] tracking-tighter">
                <span className="block mb-4 lg:mb-8">JOIN US.</span>
                REVEAL WHAT'S HIDDEN.
                <br />DEFINE WHAT'S NEXT.
                <br />FOLLOW THE SIGNAL.
              </h2>
            </div>
          </div>

          <div className="flex justify-start pb-[5%]">
            <div className="liquid-glass rounded-[0.75rem] lg:rounded-[1.25rem] flex flex-col overflow-hidden border border-white/5">
              {[Mail, Twitter, Github].map((Icon, i) => (
                <button
                  key={i}
                  className={`flex items-center justify-center text-cream hover:bg-white/10 hover:text-neon transition w-[16vw] sm:w-[10rem] lg:w-[12rem] h-[14vw] sm:h-[3.5rem] lg:h-[4.5rem] ${i < 2 ? "border-b border-white/10" : ""}`}
                >
                  <Icon size={20} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}