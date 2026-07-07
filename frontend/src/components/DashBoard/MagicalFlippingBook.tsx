import React from "react";

export function MagicalFlippingBook() {
  // Generate random particles properties
  const particles = Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    xOffset: `${(Math.random() - 0.5) * 80}px`,
    delay: `${Math.random() * 2}s`,
    duration: `${1.5 + Math.random() * 1.5}s`,
    size: `${2 + Math.random() * 4}px`,
    left: `${40 + Math.random() * 20}%`,
  }));

  return (
    <div className="relative w-[280px] h-[220px] flex items-center justify-center select-none" style={{ perspective: "1000px" }}>
      {/* Styles for the flip and floating gold particles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes flipPage {
          0% {
            transform: rotateY(0deg);
            z-index: 2;
          }
          40% {
            background-color: #ebdcb9;
          }
          100% {
            transform: rotateY(-180deg);
            z-index: 0;
          }
        }

        @keyframes sparkUp {
          0% {
            transform: translateY(0) scale(0.5) rotate(0deg);
            opacity: 0;
          }
          20% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-120px) translateX(var(--x-offset)) scale(1.5) rotate(360deg);
            opacity: 0;
          }
        }

        .flipping-page {
          animation: flipPage 3s infinite ease-in-out;
          transform-style: preserve-3d;
          transform-origin: left center;
        }

        .gold-spark {
          animation: sparkUp var(--duration) infinite linear;
          animation-delay: var(--delay);
        }
      `}} />

      {/* Floating Gold Dust Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="gold-spark absolute rounded-full bg-gradient-to-t from-[#d4af37] to-[#ffd700] blur-[0.5px] pointer-events-none z-20"
          style={{
            left: p.left,
            bottom: "60px",
            width: p.size,
            height: p.size,
            boxShadow: "0 0 8px #ffd700",
            "--x-offset": p.xOffset,
            "--delay": p.delay,
            "--duration": p.duration,
          } as React.CSSProperties}
        />
      ))}

      {/* The 3D Book Layout */}
      <div 
        className="relative w-[240px] h-[160px] transition-transform duration-500 hover:scale-[1.03]"
        style={{ transformStyle: "preserve-3d", transform: "rotateX(25deg) rotateY(-5deg)" }}
      >
        {/* Soft Shadow Underneath */}
        <div className="absolute inset-x-4 bottom-[-15px] h-6 bg-black/45 rounded-full blur-xl pointer-events-none" />

        {/* Left Side (Base Cover & Page) */}
        <div 
          className="absolute left-0 top-0 w-[120px] h-full bg-[#3c0000] border-l-4 border-t-2 border-b-2 border-[#d4af37]/50 rounded-l-md shadow-md"
          style={{ transformOrigin: "right center" }}
        >
          <div className="absolute inset-[3px] bg-[#fcfaf2] rounded-l-sm border border-[#e3d5ca] border-r-none p-3 text-right">
            <div className="w-full h-1 bg-[#d4af37]/20 rounded mb-2 ml-auto" style={{ width: "80%" }} />
            <div className="w-full h-1 bg-slate-300/40 rounded mb-1 ml-auto" style={{ width: "90%" }} />
            <div className="w-full h-1 bg-slate-300/40 rounded mb-1 ml-auto" style={{ width: "60%" }} />
            <div className="w-full h-1 bg-slate-300/40 rounded mb-1 ml-auto" style={{ width: "85%" }} />
            <div className="w-full h-1 bg-slate-300/40 rounded mb-1 ml-auto" style={{ width: "50%" }} />
          </div>
        </div>

        {/* Right Side (Base Cover & Page) */}
        <div 
          className="absolute right-0 top-0 w-[120px] h-full bg-[#3c0000] border-r-4 border-t-2 border-b-2 border-[#d4af37]/50 rounded-r-md shadow-md"
          style={{ transformOrigin: "left center" }}
        >
          <div className="absolute inset-[3px] bg-[#fcfaf2] rounded-r-sm border border-[#e3d5ca] border-l-none p-3">
            <div className="w-full h-1 bg-[#d4af37]/20 rounded mb-2" style={{ width: "50%" }} />
            <div className="w-full h-1 bg-slate-300/40 rounded mb-1" style={{ width: "70%" }} />
            <div className="w-full h-1 bg-slate-300/40 rounded mb-1" style={{ width: "85%" }} />
            <div className="w-full h-1 bg-slate-300/40 rounded mb-1" style={{ width: "60%" }} />
            <div className="w-full h-1 bg-slate-300/40 rounded mb-1" style={{ width: "40%" }} />
          </div>
        </div>

        {/* Center Spine */}
        <div className="absolute left-[118px] top-0 w-1 h-full bg-gradient-to-r from-black/20 via-[#d4af37] to-black/20 z-10" />

        {/* Flipping Page (Right to Left) */}
        <div className="flipping-page absolute left-[120px] top-[3px] w-[117px] h-[154px] bg-[#fbf8ed] border border-[#e3d5ca] border-l-none rounded-r-sm p-3 shadow-inner">
          {/* Front page of the flip (Facing Up) */}
          <div className="absolute inset-0 p-3 bg-[#fdfbf7] rounded-r-sm backface-hidden" style={{ backfaceVisibility: "hidden" }}>
            <div className="w-full h-1 bg-[#d4af37]/35 rounded mb-2" style={{ width: "65%" }} />
            <div className="w-full h-1 bg-slate-300/50 rounded mb-1" style={{ width: "80%" }} />
            <div className="w-full h-1 bg-slate-300/50 rounded mb-1" style={{ width: "60%" }} />
            <div className="w-full h-1 bg-slate-300/50 rounded mb-1" style={{ width: "75%" }} />
          </div>
          {/* Back page of the flip (Facing Down once flipped) */}
          <div 
            className="absolute inset-0 p-3 bg-[#fdfbf7] rounded-l-sm" 
            style={{ 
              backfaceVisibility: "hidden", 
              transform: "rotateY(180deg)",
              borderRadius: "2px 0 0 2px",
              borderRight: "none",
              borderLeft: "1px solid #e3d5ca"
            }}
          >
            <div className="w-full h-1 bg-[#d4af37]/35 rounded mb-2 ml-auto" style={{ width: "60%" }} />
            <div className="w-full h-1 bg-slate-300/50 rounded mb-1 ml-auto" style={{ width: "75%" }} />
            <div className="w-full h-1 bg-slate-300/50 rounded mb-1 ml-auto" style={{ width: "85%" }} />
            <div className="w-full h-1 bg-slate-300/50 rounded mb-1 ml-auto" style={{ width: "40%" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
