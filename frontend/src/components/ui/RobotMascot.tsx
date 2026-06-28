"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

// ─── TYPES ────────────────────────────────────────────────────────────────────
export type MascotState =
  | "idle"
  | "celebrate"
  | "streak"
  | "trophy"
  | "stars";

interface RobotMascotProps {
  state?: MascotState;
  size?: number;
  loop?: boolean;
  onAnimationComplete?: () => void;
  className?: string;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ["#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#FF922B", "#CC5DE8", "#20C997"];
const STAR_COLORS = ["#FFD700", "#FFF3BF", "#FFE066", "#FCC419"];

function randBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

// ─── CONFETTI PARTICLE ────────────────────────────────────────────────────────
function ConfettiParticle({ index }: { index: number }) {
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const startX = randBetween(-60, 60);
  const endX = startX + randBetween(-80, 80);
  const endY = randBetween(80, 180);
  const rotate = randBetween(-360, 360);
  const size = randBetween(6, 12);
  const delay = randBetween(0, 0.4);
  const isRect = Math.random() > 0.5;

  return (
    <motion.div
      initial={{ x: startX, y: 0, opacity: 1, rotate: 0, scale: 1 }}
      animate={{
        x: endX,
        y: endY,
        opacity: [1, 1, 0],
        rotate,
        scale: [1, 0.8, 0.5],
      }}
      transition={{ duration: 1.2, delay, ease: [0.2, 0, 0.8, 1] }}
      style={{
        position: "absolute",
        top: "30%",
        left: "50%",
        width: isRect ? size : size * 0.7,
        height: isRect ? size * 0.5 : size * 0.7,
        borderRadius: isRect ? 2 : "50%",
        background: color,
        zIndex: 10,
        pointerEvents: "none",
      }}
    />
  );
}

// ─── STAR PARTICLE ────────────────────────────────────────────────────────────
function StarParticle({ index }: { index: number }) {
  const angle = (index / 8) * Math.PI * 2 + randBetween(-0.3, 0.3);
  const dist = randBetween(55, 100);
  const endX = Math.cos(angle) * dist;
  const endY = Math.sin(angle) * dist;
  const size = randBetween(10, 20);
  const color = STAR_COLORS[index % STAR_COLORS.length];
  const delay = index * 0.05;

  return (
    <motion.div
      initial={{ x: 0, y: 0, opacity: 0, scale: 0, rotate: 0 }}
      animate={{
        x: [0, endX * 0.6, endX],
        y: [0, endY * 0.6, endY],
        opacity: [0, 1, 1, 0],
        scale: [0, 1.3, 1, 0.3],
        rotate: [0, 180, 360],
      }}
      transition={{ duration: 1.0, delay, ease: "easeOut" }}
      style={{
        position: "absolute",
        top: "35%",
        left: "50%",
        width: size,
        height: size,
        zIndex: 10,
        pointerEvents: "none",
        color,
        fontSize: size,
        lineHeight: 1,
        transformOrigin: "center",
        marginLeft: -size / 2,
        marginTop: -size / 2,
      }}
    >
      {"\u2605"}
    </motion.div>
  );
}

// ─── FIRE PARTICLE ────────────────────────────────────────────────────────────
function FireParticle({ index }: { index: number }) {
  const x = randBetween(-30, 30);
  const size = randBetween(12, 22);
  const delay = randBetween(0, 0.6);
  const emojis = ["\uD83D\uDD25", "\u2728", "\uD83D\uDCAB"];
  const emoji = emojis[index % emojis.length];

  return (
    <motion.div
      initial={{ x, y: 20, opacity: 0, scale: 0 }}
      animate={{
        x: [x, x + randBetween(-20, 20)],
        y: [20, -60, -120],
        opacity: [0, 1, 1, 0],
        scale: [0, 1.2, 0.8, 0],
      }}
      transition={{
        duration: 1.4,
        delay,
        repeat: Infinity,
        repeatDelay: randBetween(0.2, 0.8),
        ease: "easeOut",
      }}
      style={{
        position: "absolute",
        bottom: "20%",
        left: "50%",
        fontSize: size,
        zIndex: 10,
        pointerEvents: "none",
        marginLeft: -size / 2,
      }}
    >
      {emoji}
    </motion.div>
  );
}

// ─── STUDENT MASCOT (Replaces Robot) ──────────────────────────────────────────
export function RobotMascot({
  state = "idle",
  size = 220,
  loop = false,
  onAnimationComplete,
  className = "",
}: RobotMascotProps) {
  const [blinkCycle, setBlinkCycle] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    const blink = () => {
      const delay = randBetween(2500, 4500);
      return setTimeout(() => {
        setBlinkCycle(true);
        setTimeout(() => setBlinkCycle(false), 150);
        blink();
      }, delay);
    };
    const t = blink();
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (state !== "idle") {
      setShowParticles(false);
      const t = setTimeout(() => setShowParticles(true), 100);
      return () => clearTimeout(t);
    }
    setShowParticles(false);
  }, [state]);

  // ── ANIMATIONS ──────────────────────────────────────────
  const containerAnimation =
    state === "idle"
      ? { y: [0, -4, 0] }
      : state === "celebrate"
      ? { y: [0, -20, 0, -10, 0] }
      : state === "streak"
      ? { y: [0, -6, 0], scale: [1, 1.05, 1] }
      : state === "trophy"
      ? { y: [0, -10, 0] }
      : { scale: [1, 1.05, 1], y: [0, -4, 0] };

  const containerTransition =
    state === "idle"
      ? { duration: 3, repeat: Infinity, ease: "easeInOut" }
      : state === "celebrate"
      ? { duration: 0.65, repeat: loop ? Infinity : 3, ease: [0.36, 0, 0.66, -0.4, 1] }
      : state === "streak"
      ? { duration: 0.8, repeat: Infinity, ease: "easeInOut" }
      : state === "trophy"
      ? { duration: 1.2, repeat: loop ? Infinity : 2, ease: "easeInOut" }
      : { duration: 1.5, repeat: loop ? Infinity : 2, ease: "easeInOut" };

  const leftArmAnim =
    state === "idle"
      ? { rotate: [25, 30, 25] }
      : state === "celebrate"
      ? { rotate: [-120, -110, -120], x: -5, y: -15 }
      : state === "streak"
      ? { rotate: [-20, -10, -20], x: -5 }
      : state === "trophy"
      ? { rotate: [-140], x: -10, y: -25 }
      : state === "stars"
      ? { rotate: [-120, -110, -120], x: -5, y: -15 }
      : { rotate: 25 };

  const leftArmTransition =
    state === "idle"
      ? { duration: 0.8, repeat: Infinity, ease: "easeInOut" }
      : state === "celebrate"
      ? { duration: 0.5, repeat: Infinity, ease: "easeInOut" }
      : state === "streak"
      ? { duration: 0.4, repeat: Infinity }
      : { duration: 1 };

  const rightArmAnim =
    state === "idle"
      ? { rotate: [-25, -30, -25] }
      : state === "celebrate"
      ? { rotate: [120, 110, 120], x: 5, y: -15 }
      : state === "streak"
      ? { rotate: [20, 10, 20], x: 5 }
      : state === "trophy"
      ? { rotate: [-20] } // Right arm stays down
      : state === "stars"
      ? { rotate: [120, 110, 120], x: 5, y: -15 }
      : { rotate: -25 };

  const rightArmTransition =
    state === "idle"
      ? { duration: 0.9, delay: 0.1, repeat: Infinity, ease: "easeInOut" }
      : state === "celebrate"
      ? { duration: 0.5, delay: 0.1, repeat: Infinity, ease: "easeInOut" }
      : state === "streak"
      ? { duration: 0.4, delay: 0.1, repeat: Infinity }
      : { duration: 1 };

  const headAnim = 
    state === "idle" 
      ? { y: [0, 4, 0] } 
      : state === "celebrate" 
      ? { y: [-8, 0, -8], rotate: [-4, 4, -4] } 
      : state === "streak"
      ? { y: [-2, 2, -2] }
      : state === "trophy"
      ? { y: [-4, 0, -4] }
      : { y: [0, -5, 0] };
      
  const headTransition = 
    state === "idle" ? { duration: 3, repeat: Infinity, ease: "easeInOut" }
    : state === "celebrate" ? { duration: 0.65, repeat: Infinity, ease: "easeInOut" }
    : state === "streak" ? { duration: 0.4, repeat: Infinity }
    : { duration: 1.5, repeat: Infinity };

  // ── VISUAL DETAILS ───────────────────────────────────────
  const mouthPath =
    state === "idle"
      ? "M 92 105 Q 100 112 108 105"
      : state === "celebrate" || state === "trophy" || state === "stars"
      ? "M 90 102 Q 100 120 110 102"
      : "M 92 108 Q 100 115 108 108";

  const glassesFill = 
     state === "streak" ? "rgba(255, 107, 43, 0.4)" 
     : state === "stars" ? "rgba(156, 110, 255, 0.4)"
     : "rgba(255, 255, 255, 0.15)";
     
  const glowColor =
    state === "celebrate" || state === "trophy"
      ? "#FFD700"
      : state === "streak"
      ? "#FF6B2B"
      : state === "stars"
      ? "#9C6EFF"
      : "transparent";

  return (
    <div
      className={`relative select-none ${className}`}
      style={{ width: size, height: size * 1.3 }}
    >
      {/* ── PARTICLES ── */}
      <AnimatePresence>
        {showParticles && state === "celebrate" && (
          <div key="confetti" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {Array.from({ length: 16 }).map((_, i) => (
              <ConfettiParticle key={i} index={i} />
            ))}
          </div>
        )}
        {showParticles && state === "stars" && (
          <div key="stars" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <StarParticle key={i} index={i} />
            ))}
          </div>
        )}
        {showParticles && state === "streak" && (
          <div key="fire" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <FireParticle key={i} index={i} />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* ── SVG BOY MASCOT ── */}
      <svg
        viewBox="0 0 200 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%", overflow: "visible" }}
      >
        <defs>
          <linearGradient id="hoodieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF8364" />
            <stop offset="100%" stopColor="#FF6B4A" />
          </linearGradient>
          <linearGradient id="laptopGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFB3A1" />
            <stop offset="100%" stopColor="#F9A88F" />
          </linearGradient>
          <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FDE3D2" />
            <stop offset="100%" stopColor="#FCD3B6" />
          </linearGradient>
          <filter id="boy-shadow">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#000" floodOpacity="0.15" />
          </filter>
        </defs>

        <motion.g
          animate={containerAnimation}
          transition={containerTransition as any}
          style={{ originX: "100px", originY: "240px" }}
          onAnimationComplete={onAnimationComplete}
        >
          {/* Ground Shadow */}
          <motion.ellipse 
            cx="100" cy="265" 
            rx="75" ry="12" 
            fill="rgba(0,0,0,0.08)" 
            animate={{ rx: state === "celebrate" ? [75, 60, 75] : 75, opacity: state === "celebrate" ? [0.08, 0.04, 0.08] : 0.08 }}
            transition={{ duration: 0.65, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* LEGS (Crossed) */}
          <g transform="translate(0, 10)">
            {/* Left Knee/Leg */}
            <rect x="35" y="210" width="75" height="40" rx="20" fill="#2C3135" />
            {/* Right Knee/Leg */}
            <rect x="90" y="210" width="75" height="40" rx="20" fill="#353A3E" />
            
            {/* Left Shoe (tucked) */}
            <ellipse cx="85" cy="242" rx="16" ry="12" fill="#E5E7EB" />
            {/* Right Shoe (front) */}
            <ellipse cx="115" cy="242" rx="16" ry="12" fill="#FFFFFF" />
            
            {/* Shoe details (soles) */}
            <path d="M 72 248 Q 85 254 98 248" fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 102 248 Q 115 254 128 248" fill="none" stroke="#E5E7EB" strokeWidth="2.5" strokeLinecap="round" />
          </g>

          {/* TORSO & LAPTOP */}
          <g filter="url(#boy-shadow)">
            {/* Hood Back */}
            <path d="M 50 120 C 50 85, 150 85, 150 120 C 145 145, 55 145, 50 120 Z" fill="#E65A40" />

            {/* Hoodie Body */}
            <path d="M 65 110 C 65 95, 135 95, 135 110 L 148 220 C 148 235, 52 235, 52 220 Z" fill="url(#hoodieGrad)" />

            {/* Drawstrings */}
            <path d="M 90 125 Q 86 145 90 155" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 110 125 Q 114 145 110 155" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />

            {/* Laptop */}
            <motion.g animate={state === "celebrate" || state === "stars" ? { y: [0, -8, 0] } : { y: 0 }} transition={{ duration: 0.65, repeat: Infinity, ease: "easeInOut" }}>
              <rect x="45" y="155" width="110" height="70" rx="8" fill="url(#laptopGrad)" />
              <rect x="45" y="225" width="110" height="6" rx="3" fill="#E8967D" />
              <circle cx="100" cy="190" r="10" fill="#FFFFFF" opacity="0.25" />
            </motion.g>

            {/* Left Arm */}
            <motion.g animate={leftArmAnim} transition={leftArmTransition as any} style={{ originX: "65px", originY: "135px" } as React.CSSProperties}>
              {/* Sleeve */}
              <rect x="48" y="125" width="26" height="65" rx="13" fill="url(#hoodieGrad)" />
              {/* Hand */}
              <circle cx="61" cy="190" r="10" fill="url(#skinGrad)" />
              {/* Trophy */}
              <AnimatePresence>
                {state === "trophy" && (
                  <motion.text initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} x="61" y="165" fontSize="32" textAnchor="middle" style={{ originX: "61px", originY: "150px" } as React.CSSProperties}>
                    🏆
                  </motion.text>
                )}
              </AnimatePresence>
            </motion.g>

            {/* Right Arm */}
            <motion.g animate={rightArmAnim} transition={rightArmTransition as any} style={{ originX: "135px", originY: "135px" } as React.CSSProperties}>
              {/* Sleeve */}
              <rect x="126" y="125" width="26" height="65" rx="13" fill="url(#hoodieGrad)" />
              {/* Hand */}
              <circle cx="139" cy="190" r="10" fill="url(#skinGrad)" />
            </motion.g>
          </g>

          {/* HEAD */}
          <motion.g animate={headAnim} transition={headTransition as any} style={{ originX: "100px", originY: "115px" } as React.CSSProperties}>
            {/* Neck */}
            <rect x="91" y="100" width="18" height="25" fill="#ECA285" />
            <path d="M 91 105 Q 100 115 109 105 L 109 110 Q 100 120 91 110 Z" fill="#D38A6E" />
            
            {/* Face */}
            <rect x="52" y="32" width="96" height="82" rx="41" fill="url(#skinGrad)" />
            
            {/* Ears */}
            <circle cx="48" cy="74" r="12" fill="#ECA285" />
            <circle cx="152" cy="74" r="12" fill="#ECA285" />
            <circle cx="46" cy="74" r="5" fill="#D38A6E" opacity="0.4" />
            <circle cx="154" cy="74" r="5" fill="#D38A6E" opacity="0.4" />

            {/* Blush */}
            <ellipse cx="68" cy="85" rx="9" ry="5" fill="#FF9E80" opacity="0.6" />
            <ellipse cx="132" cy="85" rx="9" ry="5" fill="#FF9E80" opacity="0.6" />

            {/* Mouth */}
            <motion.path 
              d={mouthPath} 
              fill={state === "celebrate" || state === "trophy" || state === "stars" ? "#2C3135" : "none"} 
              stroke="#2C3135" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
            />
            {/* Tongue */}
            <AnimatePresence>
              {(state === "celebrate" || state === "trophy" || state === "stars") && (
                <motion.path initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} d="M 94 110 Q 100 120 106 110 Z" fill="#FF8A80" />
              )}
            </AnimatePresence>

            {/* Eyes */}
            <AnimatePresence>
               {state === "stars" ? (
                  <>
                    <motion.text key="lst" x="74" y="80" fontSize="18" fill="#2C3135" textAnchor="middle" animate={{ rotate: [0, 360] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} style={{ originX: "74px", originY: "74px" } as React.CSSProperties}>✦</motion.text>
                    <motion.text key="rst" x="126" y="80" fontSize="18" fill="#2C3135" textAnchor="middle" animate={{ rotate: [0, 360] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} style={{ originX: "126px", originY: "74px" } as React.CSSProperties}>✦</motion.text>
                  </>
               ) : (
                  <motion.g key="normal-eyes" animate={{ scaleY: blinkCycle ? 0.1 : 1 }} style={{ originY: "74px" } as React.CSSProperties}>
                    <circle cx="74" cy="74" r="6" fill="#2C3135" />
                    <circle cx="126" cy="74" r="6" fill="#2C3135" />
                    <circle cx="72" cy="72" r="2" fill="#FFFFFF" />
                    <circle cx="124" cy="72" r="2" fill="#FFFFFF" />
                  </motion.g>
               )}
            </AnimatePresence>

            {/* Glasses */}
            <circle cx="74" cy="74" r="19" fill={glassesFill} stroke="#2C3135" strokeWidth="4" />
            <circle cx="126" cy="74" r="19" fill={glassesFill} stroke="#2C3135" strokeWidth="4" />
            <path d="M 93 72 L 107 72" stroke="#2C3135" strokeWidth="4" strokeLinecap="round" />
            <path d="M 55 72 L 46 68" stroke="#2C3135" strokeWidth="4" strokeLinecap="round" />
            <path d="M 145 72 L 154 68" stroke="#2C3135" strokeWidth="4" strokeLinecap="round" />

            {/* Hair */}
            {/* Back base */}
            <path d="M 50 50 C 50 15, 150 15, 150 50 C 158 65, 152 85, 145 85 C 145 65, 130 35, 100 35 C 70 35, 55 65, 55 85 C 48 85, 42 65, 50 50 Z" fill="#2C3135" />
            {/* Front Bangs */}
            <path d="M 45 45 C 70 -5, 130 -5, 155 45 C 148 20, 100 10, 95 38 C 90 55, 105 65, 80 65 C 62 65, 55 52, 45 45 Z" fill="#353A3E" />
            {/* Top Highlight */}
            <path d="M 65 22 C 80 12, 110 12, 130 22 C 110 18, 80 18, 65 22 Z" fill="#4B5258" opacity="0.7" />
          </motion.g>

        </motion.g>

        {/* GLOW (when celebrating) */}
        <AnimatePresence>
          {state !== "idle" && (
            <motion.ellipse
              key="glow"
              initial={{ opacity: 0, rx: 40 }}
              animate={{ opacity: [0.15, 0.35, 0.15], rx: [60, 80, 60] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              cx="100" cy="270" ry="12"
              fill={glowColor}
            />
          )}
        </AnimatePresence>
      </svg>
    </div>
  );
}
