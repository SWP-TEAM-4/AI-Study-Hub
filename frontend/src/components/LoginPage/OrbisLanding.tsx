"use client";

import { useState, useEffect, useRef } from "react";
import { Mail, Twitter, Github, ChevronRight, Volume2, VolumeX, Play, Pause, Sparkles, GraduationCap, Compass, Terminal, ArrowRightCircle } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "@studio-freight/lenis";
import TimeLineSection from "./LandingPage/TimeLineSection";

// 🌟 DÒNG IMPORT THẦN THÁNH: Kéo Footer từ bên ngoài vào đây
import { Footer } from "./Loader/Footer"; 

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
    phase: "Tuần 1 - Tuần 2: Khởi tạo & Nghiên cứu",
    title: "Phân tích yêu cầu & Thiết kế hệ thống",
    desc: "Định hình kiến trúc Mind Space. Thiết kế cơ sở dữ liệu, sơ đồ ERD và tích hợp luồng xử lý dữ liệu thông minh cho các phân hệ core."
  },
  {
    date: "26 May '26",
    phase: "Tuần 3 - Tuần 4: Phát triển Tính năng Cốt lõi",
    title: "Xây dựng lõi xử lý & Kết nối Mô hình AI",
    desc: "Triển khai hệ thống phân tích tài liệu và tạo bài học tự động. Tích hợp và tối ưu hóa các cổng API mã nguồn mở/đóng để xử lý prompt."
  },
  {
    date: "09 June '26",
    phase: "Tuần 5 - Tuần 6: Đánh giá Giữa kỳ & Tối ưu",
    title: "MIDTERM EVALUATION & OPTIMIZATION",
    desc: "Đánh giá chặng giữa, tối ưu hóa câu lệnh truy vấn và xử lý logic luồng bất đồng bộ. Hoàn thiện các cấu trúc nghiệp vụ cơ bản chuẩn bị cho giai đoạn mở rộng."
  },
  {
    date: "23 June '26",
    phase: "Tuần 7 - Tuần 8: Kiểm thử & Triển khai Thử nghiệm",
    title: "SYSTEM TESTING & STAGING",
    desc: "Triển khai quy trình Unit Test và Integration Test cho các module AI. Khắc phục lỗ hổng hệ thống và phát hành phiên bản thử nghiệm trên môi trường Staging."
  },
  {
    date: "04 July '26",
    phase: "Tuần 9 - Tuần 10: Hoàn thiện & Thuyết trình Dự án",
    title: "PRODUCTION READY & PRESENTATION",
    desc: "Đóng gói mã nguồn hoàn chỉnh, cấu hình Production. Chuẩn bị tài liệu kỹ thuật, slide báo cáo và tiến hành thuyết trình sản phẩm trước hội đồng."
  }
];

const REVEAL_TEXT = "The goal of Mind Space is to boost the joy of learning and enhance knowledge skills for students at FPT University — while gaining an intelligent overview of academic progress. Let's make studying a fun adventure!";
const ACCENT_WORDS = new Set(["Mind", "Space", "FPT", "University", "intelligent"]);

function SocialBtn({ Icon }: { Icon: typeof Mail }) {
  return (
    <button className="liquid-glass rounded-[1rem] w-14 h-14 flex items-center justify-center text-cream hover:bg-white/10 hover:text-neon transition-all duration-300 cursor-pointer">
      <Icon size={20} />
    </button>
  );
}

function TopMarqueeBanner() {
  const marqueeItems = [
    { text: "WELCOME TO MIND SPACE — NEXT-GEN KNOWLEDGE PLATFORM", icon: <Sparkles size={13} className="text-space/80" /> },
    { text: "AN ALL-NEW STUDY EXPERIENCE IS WAITING FOR YOU", icon: <GraduationCap size={13} className="text-space/80" /> },
    { text: "EXPLORE, LEARN, AND DISCOVER TOGETHER", icon: <Compass size={13} className="text-space/80" /> },
    { text: "CHÀO MỪNG BẠN ĐẾN VỚI KHÔNG GIAN HỌC TẬP THẾ HỆ MỚI", icon: <GraduationCap size={13} className="text-space/80" /> },
    { text: "CÙNG CHÚNG TÔI KHÁM PHÁ VÀ ĐỊNH HÌNH TƯƠNG LAI", icon: <Sparkles size={13} className="text-space/80" /> },
    { text: "ENGINEERED BY SWP-TEAM-4", icon: <Terminal size={13} className="text-space/80" /> },
    { text: "ENTER THE HUB NOW!", icon: <ArrowRightCircle size={13} className="text-space/80" /> },
  ];

  const doubleItems = [...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems];

  return (
    <div className="w-full bg-neon text-space py-3.5 overflow-hidden border-b border-white/10 z-50 relative select-none flex items-center">
      <div
        className="flex whitespace-nowrap gap-10 pr-10 items-center uppercase text-[11px] tracking-[0.15em]"
        style={{
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 600,
          animation: "marquee 60s linear infinite",
          width: "max-content"
        }}
        onMouseEnter={(e) => (e.currentTarget.style.animationPlayState = "paused")}
        onMouseLeave={(e) => (e.currentTarget.style.animationPlayState = "running")}
      >
        {doubleItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-4 inline-flex">
            <span>{item.text}</span>
            <div className="flex items-center justify-center">{item.icon}</div>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

export default function OrbisLanding({ onLoginClick }: { onLoginClick: () => void }) {
  const [activeSection, setActiveSection] = useState("homepage");
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  const videoRefs = useRef<HTMLVideoElement[]>([]);
  const lenisRef = useRef<Lenis | null>(null);
  const isPlayingRef = useRef(isPlaying);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
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

    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
      window.scrollTo(0, 0);
    }

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.defaults({ scroller: scrollContainer });

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

    gsap.to(".about-video-parallax", {
      scrollTrigger: { trigger: "#objectives", start: "top bottom", end: "bottom top", scrub: true },
      yPercent: 15, ease: "none",
    });

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
        scroller: scrollContainer,
        scrub: 0.6,
        onUpdate: (self) => {
          const p = self.progress;
          const limit = Math.floor(p * plain.length);
          plain.forEach((s, i) => { s.style.color = i < limit ? "#F5F2EA" : "rgba(245,242,234,0.15)" });
          accents.forEach((s) => { s.style.color = p > 0.06 ? "#00ffcc" : "rgba(0,255,204,0.18)" });
        },
      });
    }

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

    document.querySelectorAll(".nft-card-trigger").forEach((card, i) => {
      const speed = (i % 3 + 1) * 30;
      gsap.fromTo(card,
        { y: speed * 1.5, rotateX: 10 },
        { scrollTrigger: { trigger: "#creators", start: "top bottom", end: "bottom top", scrub: 1 }, y: -speed, rotateX: -5, ease: "power1.out" }
      );
    });

    gsap.to(".cta-video-parallax", {
      scrollTrigger: { trigger: "#our-journey", start: "top bottom", end: "bottom top", scrub: true },
      yPercent: 20, ease: "none",
    });

    const refreshTimer = setTimeout(() => { ScrollTrigger.refresh() }, 200);

    return () => {
      clearTimeout(refreshTimer);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  useEffect(() => {
    const sections = NAV_ITEMS.map((item) => document.getElementById(item.id));
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.id && setActiveSection(e.target.id)),
      { threshold: 0.3, rootMargin: "-10% 0px -40% 0px" }
    );
    sections.forEach((s) => s && observer.observe(s));
    return () => sections.forEach((s) => s && observer.unobserve(s));
  }, []);

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

  return (
    <div id="orbis-scroll-wrapper" className="bg-space text-cream font-mono select-none selection:bg-neon selection:text-space relative perspective-1000 overflow-x-hidden overflow-y-auto h-screen w-screen no-scrollbar">
      <TopMarqueeBanner />

      {/* FLOATING VIDEO CONTROLLER */}
      <div className="fixed bottom-6 right-6 z-50 flex gap-2 bg-[#020a21]/80 backdrop-blur-md border border-white/10 p-1.5 rounded-full shadow-2xl">
        <button
          onClick={togglePlay}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${isPlaying ? "text-cream hover:bg-white/15" : "bg-neon text-space"}`}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={15} /> : <Play size={15} />}
        </button>
        <button
          onClick={toggleMute}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${!isMuted ? "bg-purple-500 text-white" : "text-cream/60 hover:bg-white/15"}`}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>
      </div>

      {/* ── SECTION 1 · HERO ── */}
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
                      className={`font-grotesk text-[13px] uppercase tracking-wider transition-all relative py-1 block ${activeSection === item.id ? "text-neon" : "text-cream/60 hover:text-cream"}`}
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

          <div className="flex-1 flex items-end pb-20 lg:pb-32 hero-title-trigger will-change-transform">
            <div className="relative lg:ml-32 max-w-[780px]">
              <h1 className="font-grotesk uppercase text-[40px] sm:text-[60px] md:text-[75px] lg:text-[90px] leading-[1.05] sm:leading-[1] tracking-tighter">
                Beyond earth and ( its ) familiar boundaries
              </h1>
              <span className="hero-subtitle-parallax font-condiment text-neon text-[24px] sm:text-[32px] md:text-[40px] lg:text-[48px] absolute -right-2 lg:right-8 top-2 -rotate-1 opacity-90 mix-blend-exclusion will-change-transform normal-case">
                Academic Odyssey
              </span>

              <div className="mt-10 flex justify-center">
                <button
                  onClick={onLoginClick}
                  className="group relative px-10 py-4 bg-transparent border border-neon text-neon font-grotesk uppercase tracking-[0.2em] text-xs overflow-hidden transition-all duration-300 hover:text-black hover:shadow-[0_0_25px_rgba(0,255,140,0.4)] cursor-pointer"
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

      {/* ── SECTION 2 · OBJECTIVES ── */}
      <section id="objectives" className="relative w-full min-h-screen overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <video
            ref={registerVideoRef}
            preload="metadata" loop muted={isMuted} playsInline
            className="about-video-parallax absolute inset-0 w-full h-[120%] object-cover brightness-[0.7] will-change-transform"
            src={ABOUT_VIDEO}
          />
        </div>

        <div className="relative z-10 max-w-[1831px] mx-auto px-5 sm:px-8 lg:px-14 py-16 lg:py-24 min-h-screen flex flex-col justify-between gap-16">
          <div className="flex flex-col gap-10 w-full">
            <div className="flex flex-col lg:flex-row justify-between items-start gap-10">
              <div className="relative select-none">
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, textTransform: 'uppercase', fontSize: 'clamp(36px, 5vw, 64px)', lineHeight: 0.95, letterSpacing: '-0.03em', color: '#ffffff', margin: 0 }}>
                  Hello!<br />I'm orbis
                </h2>
                <span className="font-condiment text-neon" style={{ fontSize: 'clamp(36px, 5vw, 68px)', position: 'absolute', bottom: '-16px', right: 0, transform: 'rotate(-3deg)', mixBlendMode: 'exclusion', pointerEvents: 'none' }}>
                  Orbis
                </span>
              </div>

              <p className="text-cream/80" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 'clamp(11px, 2vw, 13px)', textTransform: 'uppercase', maxWidth: '340px', lineHeight: 1.6, letterSpacing: '0.08em', borderLeft: '1px solid #00f2fe', paddingLeft: '20px', paddingTop: '4px', margin: 0, transition: 'all 0.3s ease' }} onMouseOver={(e) => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.borderLeftColor = '#00ffff'; }} onMouseOut={(e) => { e.currentTarget.style.color = 'rgba(245, 245, 220, 0.8)'; e.currentTarget.style.borderLeftColor = '#00f2fe'; }}>
                The goal of Mind Space is to boost the joy of learning and enhance knowledge skills for students at FPT University. Let's make studying a fun adventure!
              </p>
            </div>
          </div>

          <p id="objectives-reveal-text" className="text-center font-grotesk font-bold text-[28px] sm:text-[36px] lg:text-[48px] leading-[1.25] max-w-[900px] mx-auto" />
        </div>
      </section>

      {/* ── 🎯 SECTION 3 · SCROLL TIMELINE ── */}
      <div id="timeline" className="relative w-full">
        <TimeLineSection TIMELINE_DATA={TIMELINE_DATA} />
      </div>

      {/* ── SECTION 4 · CREATORS GRID ── */}
      <section id="creators" className="bg-space py-20 lg:py-28 overflow-hidden">
        <div className="max-w-[1831px] mx-auto px-5 sm:px-8 lg:px-14">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-10 mb-12">
            <h2 className="font-grotesk uppercase text-[32px] sm:text-[44px] lg:text-[60px] leading-[1]">
              Collection of <br />
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
              <div key={`nft-${index}`} className="nft-card-trigger will-change-transform liquid-glass rounded-[32px] p-[18px] hover:bg-white/10 transition group">
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
                    <button className="w-12 h-12 rounded-full bg-gradient-to-br from-[#b724ff] to-[#7c3aed] shadow-lg shadow-purple-500/50 group-hover:scale-110 transition flex items-center justify-center text-white cursor-pointer">
                      <ChevronRight size={22} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 5 · CTA ── */}
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
                <span className="block mb-4 lg:mb-8">JOIN US.</span>REVEAL WHAT'S HIDDEN.<br />DEFINE WHAT'S NEXT.<br />FOLLOW THE SIGNAL.
              </h2>
            </div>
          </div>

          <div className="flex justify-start pb-[5%]">
            <div className="liquid-glass rounded-[0.75rem] lg:rounded-[1.25rem] flex flex-col overflow-hidden border border-white/5">
              {[Mail, Twitter, Github].map((Icon, i) => (
                <button key={i} className={`flex items-center justify-center text-cream hover:bg-white/10 hover:text-neon transition w-[16vw] sm:w-[10rem] lg:w-[12rem] h-[14vw] sm:h-[3.5rem] lg:h-[4.5rem] cursor-pointer ${i < 2 ? "border-b border-white/10" : ""}`}>
                  <Icon size={20} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 🌟 GỌI COMPONENT FOOTER ĐÃ ĐƯỢC IMPORT TỪ FILE NGOÀI */}
      <Footer />
    </div>
  );
}