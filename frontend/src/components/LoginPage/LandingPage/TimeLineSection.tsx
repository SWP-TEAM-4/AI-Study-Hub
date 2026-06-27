import { gsap } from "gsap";
import { useEffect, useRef } from "react";

interface TimelineItem {
  date: string;
  phase: string;
  title: string;
  desc: string;
}

interface TimelineSectionProps {
  TIMELINE_DATA: TimelineItem[];
}

export default function TimelineSection({
  TIMELINE_DATA,
}: TimelineSectionProps) {
  if (!TIMELINE_DATA || TIMELINE_DATA.length === 0) {
    return <div className="text-white p-10">Loading timeline...</div>;
  }

  const auroraRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!auroraRef.current) return;

    gsap.to(auroraRef.current, {
      x: 150,
      y: 80,
      scale: 1.35,
      rotation: 8,
      duration: 18,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  }, []);

  return (
    <section className="relative overflow-hidden bg-[#020817] py-32">
      {/* ================= STYLE & FONT INJECTION ================= */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400&family=Montserrat:wght@700;900&family=Playfair+Display:ital,wght@1,500&display=swap');

        .font-tech-title { font-family: 'Montserrat', sans-serif; font-weight: 700; }
        .font-tech-giant { font-family: 'Montserrat', sans-serif; font-weight: 900; }
        .font-luxury-italic { font-family: 'Playfair Display', serif; font-style: italic; font-weight: 500; }
        .font-ui-body { font-family: 'Inter', sans-serif; }
      `}</style>

      {/* ================= AURORA BACKGROUND ================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
        <img
          ref={auroraRef}
          src="/images/aurora-bg.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlay để tối background */}
        <div className="absolute inset-0 bg-[#020817]/70" />
      </div>

      <div className="relative z-10 max-w-[1831px] mx-auto px-5 sm:px-8 lg:px-14">
        {/* SECTION TITLE */}
        <div className="mb-20">
          <h2 className="font-tech-title uppercase text-[32px] sm:text-[44px] lg:text-[56px] leading-[1.05] text-white tracking-tight">
            DEVELOPMENT <br />
            <span className="font-luxury-italic text-neon normal-case tracking-wide mr-2">
              Journey
            </span>
            Milestones
          </h2>
        </div>

        {/* TIMELINE LIST */}
        <div className="relative flex flex-col w-full">
          {TIMELINE_DATA.map((item, index) => (
            <div
              key={index}
              className="timeline-row grid grid-cols-12 gap-4 md:gap-8 min-h-[45vh] items-start relative py-6"
            >
              {/* DATE */}
              <div className="col-span-12 md:col-span-4 flex items-center md:justify-end md:text-right sticky top-1/2">
                <div className="timeline-date-text font-tech-giant text-[40px] sm:text-[55px] lg:text-[72px] uppercase leading-none opacity-15 transition-all duration-300 text-cream tracking-tighter whitespace-nowrap hover:opacity-40">
                  {item.date}
                </div>
              </div>

              {/* TIMELINE LINE */}
              <div className="hidden md:col-span-1 md:flex justify-center h-full absolute left-1/3 transform -translate-x-1/2 top-0 bottom-0">
                <div className="w-[1px] h-full bg-white/10 relative flex justify-center">
                  <div className="absolute inset-0 w-[2px] bg-cyan-400/50 blur-sm" />
                  <div className="timeline-line absolute top-0 bottom-0 w-[2px] bg-cyan-300/30 scale-y-[0.3] origin-top transition-all duration-300" />
                  <div className="w-3 h-3 rounded-full bg-[#020817] border-2 border-cyan-300/50 absolute top-2 z-10 shadow-[0_0_20px_rgba(34,211,238,0.7)]" />
                </div>
              </div>

              {/* CARD */}
              <div className="col-span-12 md:col-span-7 md:pl-8">
                <div className="timeline-content-card bg-black/20 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-[24px] transition-all duration-300 hover:border-cyan-300/30 hover:bg-black/40 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                  {/* PHASE TAG */}
                  <span className="font-tech-title text-[10px] sm:text-[11px] text-neon tracking-[0.2em] block mb-2 uppercase">
                    {item.phase}
                  </span>

                  {/* ITEM TITLE */}
                  <h3 className="font-tech-title text-base sm:text-lg text-white mb-3 tracking-wide uppercase">
                    {item.title}
                  </h3>

                  {/* ITEM DESCRIPTION */}
                  <p className="font-ui-body text-[13px] sm:text-[14px] text-cream/70 leading-relaxed font-light tracking-normal">
                    {item.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}