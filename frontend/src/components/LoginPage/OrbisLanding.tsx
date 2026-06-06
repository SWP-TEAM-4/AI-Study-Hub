import { useState, useEffect, useRef } from "react";
import { Mail, Twitter, Github, ChevronRight, Volume2, VolumeX, Play, Pause } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "@studio-freight/lenis";

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
  { name: "CREATORS", id: "creators" },
  { name: "OUR JOURNEY", id: "our-journey" },
];

function SocialBtn({ Icon, className = "" }: { Icon: typeof Mail; className?: string }) {
  return (
    <button className={`liquid-glass rounded-[1rem] w-14 h-14 flex items-center justify-center text-cream hover:bg-white/10 hover:text-neon transition-all duration-300 ${className}`}>
      <Icon size={20} />
    </button>
  );
}

export default function OrbisLanding() {
  const [activeSection, setActiveSection] = useState("homepage");
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  const videoRefs = useRef<HTMLVideoElement[]>([]);
  const lenisRef = useRef<Lenis | null>(null);
  
  // Đồng bộ hóa trạng thái Play/Pause thực tế vào Ref để GSAP callback đọc thời gian thực
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

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
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    ScrollTrigger.defaults({ scroller: scrollContainer });

    // --- TỐI ƯU HÓA VIDEO BẰNG SCROLLTRIGGER (CHỈ PHÁT KHI TRÔNG THẤY) ---
    const setupVideoVisibilityControl = (triggerId: string) => {
      const section = document.querySelector(triggerId);
      const video = section?.querySelector("video");
      if (video) {
        ScrollTrigger.create({
          trigger: triggerId,
          start: "top bottom",
          end: "bottom top",
          onEnter: () => { if (isPlayingRef.current) video.play().catch(() => {}) },
          onLeave: () => video.pause(),
          onEnterBack: () => { if (isPlayingRef.current) video.play().catch(() => {}) },
          onLeaveBack: () => video.pause(),
        });
      }
    };

    // Áp dụng lazy play cho các section lớn
    setupVideoVisibilityControl("#homepage");
    setupVideoVisibilityControl("#objectives");
    setupVideoVisibilityControl("#our-journey");

    // Áp dụng lazy play riêng cho từng thẻ card NFT trong Grid để tránh nổ RAM
    document.querySelectorAll(".nft-card-trigger").forEach((card) => {
      const vid = card.querySelector("video");
      if (vid) {
        ScrollTrigger.create({
          trigger: card,
          start: "top bottom",
          end: "bottom top",
          onEnter: () => { if (isPlayingRef.current) vid.play().catch(() => {}) },
          onLeave: () => vid.pause(),
          onEnterBack: () => { if (isPlayingRef.current) vid.play().catch(() => {}) },
          onLeaveBack: () => vid.pause(),
        });
      }
    });

    // --- ANIMATION CREATIVE ---
    gsap.to(".hero-title-trigger", {
      scrollTrigger: {
        trigger: "#homepage",
        start: "top top",
        end: "bottom center",
        scrub: true,
      },
      y: -60,
      opacity: 0.15,
    });

    gsap.fromTo(".objective-card-trigger", 
      { opacity: 0, y: 40 },
      {
        scrollTrigger: {
          trigger: "#objectives",
          start: "top 80%",
          end: "top 40%",
          scrub: 1,
        },
        opacity: 1,
        y: 0,
        stagger: 0.08,
      }
    );

    gsap.fromTo(".nft-card-trigger", 
      { opacity: 0, y: 60, rotateX: 8 },
      {
        scrollTrigger: {
          trigger: "#creators",
          start: "top 85%",
          end: "top 45%",
          scrub: 1,
        },
        opacity: 1,
        y: 0,
        rotateX: 0,
        stagger: 0.1,
      }
    );

    return () => {
      lenis.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  useEffect(() => {
    const sections = NAV_ITEMS.map(item => document.getElementById(item.id));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target.id) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3, rootMargin: "-10% 0px -40% 0px" }
    );

    sections.forEach(sec => sec && observer.observe(sec));
    return () => sections.forEach(sec => sec && observer.unobserve(sec));
  }, []);

  const toggleMasterPlay = () => {
    videoRefs.current.forEach(v => {
      if (v) {
        // Chỉ kích hoạt tương tác cho các video đang hiển thị trong màn hình để tối ưu hiệu năng nút bấm
        const rect = v.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        if (isPlaying) {
          v.pause();
        } else if (isVisible) {
          v.play().catch(() => {});
        }
      }
    });
    setIsPlaying(!isPlaying);
  };

  const toggleMasterMute = () => {
    videoRefs.current.forEach(v => {
      if (v) v.muted = !isMuted;
    });
    setIsMuted(!isMuted);
  };

  const registerVideoRef = (el: HTMLVideoElement | null) => {
    if (el && !videoRefs.current.includes(el)) {
      videoRefs.current.push(el);
    }
  };

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element && lenisRef.current) {
      lenisRef.current.scrollTo(element, { offset: 0, duration: 1.2 });
      window.history.pushState(null, "", `#${id}`);
      setActiveSection(id);
    }
  };

  return (
    <div className="bg-space text-cream font-mono select-none selection:bg-neon selection:text-space relative perspective-1000 overflow-hidden">

      {/* FLOATING CONTROLLER */}
      <div className="fixed bottom-6 right-6 z-50 flex gap-2 bg-[#020a21]/80 backdrop-blur-md border border-white/10 p-1.5 rounded-full shadow-2xl">
        <button
          onClick={toggleMasterPlay}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'text-cream hover:bg-white/15' : 'bg-neon text-space'}`}
          title={isPlaying ? "Tạm dừng màn hình" : "Tiếp tục phát"}
        >
          {isPlaying ? <Pause size={15} /> : <Play size={15} />}
        </button>
        <button
          onClick={toggleMasterMute}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${!isMuted ? 'bg-purple-500 text-white' : 'text-cream/60 hover:bg-white/15'}`}
          title={isMuted ? "Bật âm thanh nền" : "Tắt tiếng"}
        >
          {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>
      </div>

      {/* SECTION 1 — HERO */}
      <section id="homepage" className="relative w-full min-h-screen overflow-hidden rounded-none">
        <video
          ref={registerVideoRef}
          preload="metadata"
          loop
          muted={isMuted}
          playsInline
          className="absolute inset-0 w-full h-full object-cover brightness-[0.85]"
          src={HERO_VIDEO}
        />
        <div className="relative max-w-[1831px] mx-auto px-5 sm:px-8 lg:px-14 py-6 min-h-screen flex flex-col">
          <header className="flex items-center justify-between">
            <span className="font-grotesk text-[16px] uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-neon animate-pulse"></span>
              AI Study Hub
            </span>
            <nav className="hidden lg:block liquid-glass rounded-[28px] px-[52px] py-[24px] border border-white/5">
              <ul className="flex gap-10">
                {NAV_ITEMS.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => handleScroll(e, item.id)}
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

          <div className="flex-1 flex items-end pb-20 lg:pb-32 hero-title-trigger will-change-transform">
            <div className="relative lg:ml-32 max-w-[780px]">
              <h1 className="font-grotesk uppercase text-[40px] sm:text-[60px] md:text-[75px] lg:text-[90px] leading-[1.05] sm:leading-[1] tracking-tighter">
                Beyond earth
                <br />
                and ( its ) familiar boundaries
              </h1>
              <span className="font-condiment text-neon text-[24px] sm:text-[32px] md:text-[40px] lg:text-[48px] absolute -right-2 lg:right-8 top-2 -rotate-1 opacity-90 mix-blend-exclusion">
                Nft collection
              </span>
            </div>
          </div>

          <div className="flex lg:hidden justify-center gap-3 pb-10">
            <SocialBtn Icon={Mail} />
            <SocialBtn Icon={Twitter} />
            <SocialBtn Icon={Github} />
          </div>
        </div>
      </section>

      {/* SECTION 2 — ABOUT */}
      <section id="objectives" className="relative w-full min-h-screen overflow-hidden">
        <video
          ref={registerVideoRef}
          preload="metadata"
          loop
          muted={isMuted}
          playsInline
          className="absolute inset-0 w-full h-full object-cover brightness-[0.7]"
          src={ABOUT_VIDEO}
        />
        <div className="relative max-w-[1831px] mx-auto px-5 sm:px-8 lg:px-14 py-16 lg:py-24 min-h-screen flex flex-col justify-between gap-16">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {[
              { num: "01 // CORE", title: "AUTONOMOUS LOGIC", desc: "Decentralized control mapping architecture across clusters." },
              { num: "02 // DATA", title: "SIGNAL CAPTURE", desc: "Telemetry ingestion loops recording multi-spectral object points." },
              { num: "03 // TIME", title: "CHRONO INDEX", desc: "Immutably locked timestamp vectors processing matrix transformations." },
              { num: "04 // ZONE", title: "SPACE METRICS", desc: "Geometric coordinates mapped over localized simulated environments." }
            ].map((box, i) => (
              <div key={i} className="objective-card-trigger will-change-transform bg-black/40 backdrop-blur-sm border border-white/5 p-6 rounded-2xl hover:border-white/20 transition-all duration-300">
                <div className="text-[11px] text-neon font-bold tracking-widest mb-3">{box.num}</div>
                <h4 className="font-grotesk text-sm text-white mb-2 tracking-wide">{box.title}</h4>
                <p className="text-[12px] text-cream/50 leading-relaxed uppercase">{box.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 — GRID */}
      <section id="creators" className="bg-space py-20 lg:py-28">
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {NFTS.map((n, index) => (
              <div
                key={`nft-item-${index}-${n.score}`}
                className="nft-card-trigger will-change-transform liquid-glass rounded-[32px] p-[18px] hover:bg-white/10 transition group"
              >
                <div className="relative w-full pb-[100%] rounded-[24px] overflow-hidden">
                  <video
                    ref={registerVideoRef}
                    preload="metadata"
                    loop
                    muted={isMuted}
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    src={n.src}
                  />
                  <div className="absolute left-3 right-3 bottom-3 liquid-glass rounded-[20px] px-5 py-4 flex items-center justify-between border border-white/5">
                    <div className="flex flex-col">
                      <span className="text-[11px] text-cream/70 font-mono uppercase">
                        Rarity Score:
                      </span>
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

      {/* SECTION 4 — CTA */}
      <section id="our-journey" className="relative w-full min-h-screen flex items-center overflow-hidden">
        <video
          ref={registerVideoRef}
          preload="metadata"
          loop
          muted={isMuted}
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0 brightness-[0.65]"
          src={CTA_VIDEO}
        />
        <div className="relative z-10 w-full max-w-[1831px] mx-auto px-5 sm:px-8 lg:px-14 py-20 min-h-screen flex flex-col justify-between">
          <div className="w-full flex justify-end pt-[5%]">
            <div className="relative text-right max-w-[850px]">
              <span className="font-condiment text-neon text-[24px] sm:text-[48px] lg:text-[68px] absolute -top-8 -left-6 lg:-top-14 lg:-left-14 -rotate-3 mix-blend-exclusion">
                Go beyond
              </span>
              <h2 className="font-grotesk uppercase text-[20px] sm:text-[38px] lg:text-[60px] leading-[1.05] text-[#F5F2EA] tracking-tighter">
                <span className="block mb-4 lg:mb-8">JOIN US.</span>
                REVEAL WHAT'S HIDDEN.
                <br />
                DEFINE WHAT'S NEXT.
                <br />
                FOLLOW THE SIGNAL.
              </h2>
            </div>
          </div>

          <div className="flex justify-start pb-[5%]">
            <div className="liquid-glass rounded-[0.75rem] lg:rounded-[1.25rem] flex flex-col overflow-hidden border border-white/5">
              {[Mail, Twitter, Github].map((Icon, i) => (
                <button
                  key={i}
                  className={`flex items-center justify-center text-cream hover:bg-white/10 hover:text-neon transition w-[16vw] sm:w-[10rem] lg:w-[12rem] h-[14vw] sm:h-[3.5rem] lg:h-[4.5rem] ${i < 2 ? "border-b border-white/10" : ""
                    }`}
                >
                  <Icon size={20} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <FooterOverride />
    </div>
  );
}

function FooterOverride() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toTimeString().split(" ")[0]);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="bg-[#020514] border-t border-white/10 text-cream pt-16 pb-8 px-5 sm:px-8 lg:px-14 relative overflow-hidden">
      <div className="max-w-[1831px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16 items-start">
        <div className="md:col-span-5 space-y-6">
          <div className="text-[28px] font-grotesk tracking-tighter uppercase text-white leading-none">
            ORBIS / SYSTEM <br />
            <span className="text-neon">INTERFACE ©2026</span>
          </div>

          <div className="text-[11px] text-cream/40 space-y-1 font-mono uppercase tracking-widest">
            <div>LOC: 10.8411° N, 106.8101° E</div>
            <div>SYS_STATUS: OPERATIONAL [NODE_08]</div>
            <div className="flex items-center gap-1.5">
              SYS_TIME: <span className="text-white font-bold font-mono">{time || "00:00:00"}</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-3 space-y-4">
          <div className="text-[11px] font-bold text-cream/30 tracking-widest uppercase">// INDEX</div>
          <ul className="space-y-2 text-xs font-mono uppercase">
            {["HOMEPAGE", "OBJECTIVES", "CREATORS", "OUR JOURNEY"].map((txt, index) => (
              <li key={index}>
                <a
                  href={`#${txt.toLowerCase().replace(" ", "-")}`}
                  className="text-cream/70 hover:text-neon transition-colors inline-block py-0.5"
                >
                  {txt}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="text-[11px] font-bold text-cream/30 tracking-widest uppercase">// NETWORKS</div>
          <ul className="space-y-2 text-xs font-mono uppercase">
            <li><a href="#" className="text-cream/70 hover:text-purple-400 transition-colors block">TWITTER/X</a></li>
            <li><a href="#" className="text-cream/70 hover:text-purple-400 transition-colors block">GITHUB_SRC</a></li>
            <li><a href="#" className="text-cream/70 hover:text-purple-400 transition-colors block">DISCORD_SRV</a></li>
          </ul>
        </div>

        <div className="md:col-span-2 space-y-4 md:text-right">
          <div className="text-[11px] font-bold text-cream/30 tracking-widest uppercase">// INGESTION</div>
          <p className="text-[11px] uppercase text-cream/50 leading-relaxed">
            BUILD FOR FLUID EXPERIENCE BY HUMAN ARCHITECTS. ALL METRICS EXTRACTED SECURELY.
          </p>
        </div>
      </div>

      <div className="w-full h-[1px] bg-white/5 my-12 max-w-[1831px] mx-auto" />

      <div className="max-w-[1831px] mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center text-[10px] text-cream/30 uppercase font-mono tracking-widest gap-4">
        <div>ORBIS INTERACTIVE PROTOCOL v4.1.0</div>
        <div>DESIGN PRIVACY INSURED BY CORE ENCRYPTIONS</div>
      </div>
    </footer>
  );
}