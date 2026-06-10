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
    return <div>Loading timeline...</div>;
  } const auroraRef = useRef<HTMLImageElement>(null);
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
      
      {/* ==================================================== */}

      <div className="relative z-10 max-w-[1831px] mx-auto px-5 sm:px-8 lg:px-14">
        <div className="mb-20">
          <h2 className="font-grotesk uppercase text-[32px] sm:text-[44px] lg:text-[60px] leading-[1] text-white">
            DEVELOPMENT <br />
            <span className="font-condiment text-neon normal-case tracking-normal">
              Journey
            </span>{' '}
            Milestones
          </h2>
        </div>

        <div className="relative flex flex-col w-full">
          {TIMELINE_DATA.map((item, index) => (
            <div
              key={index}
              className="timeline-row grid grid-cols-12 gap-4 md:gap-8 min-h-[45vh] items-start relative py-6"
            >
              {/* DATE */}
              <div className="col-span-12 md:col-span-4 flex items-center md:justify-end md:text-right sticky top-1/2">
                <div className="timeline-date-text text-[32px] sm:text-[40px] lg:text-[52px] font-grotesk uppercase leading-none opacity-20 transition-all duration-300 text-cream whitespace-nowrap">
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
                <div className="timeline-content-card bg-black/20 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-[24px] transition-all duration-300 hover:border-cyan-300/20 hover:bg-black/30">
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
    </section>
  );
}