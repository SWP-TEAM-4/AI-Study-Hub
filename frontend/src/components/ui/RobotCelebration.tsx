"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RobotMascot, MascotState } from "@/components/ui/RobotMascot";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const CELEBRATIONS: {
  id: MascotState;
  label: string;
  emoji: string;
  title: string;
  subtitle: string;
  accent: string;
  bg: string;
  glow: string;
}[] = [
  {
    id: "celebrate",
    label: "Victory Dance",
    emoji: "\uD83C\uDF89",
    title: "Xuất sắc!",
    subtitle: "Bạn đã hoàn thành bài quiz với kết quả hoàn hảo!",
    accent: "#FFD700",
    bg: "linear-gradient(135deg, #1a1200 0%, #2d2000 50%, #1a1200 100%)",
    glow: "rgba(255,215,0,0.25)",
  },
  {
    id: "streak",
    label: "Streak Fire",
    emoji: "\uD83D\uDD25",
    title: "7 ngày liên tiếp!",
    subtitle: "Chuỗi học không bị gián đoạn của bạn đang bùng cháy!",
    accent: "#FF6B2B",
    bg: "linear-gradient(135deg, #200800 0%, #3d1000 50%, #200800 100%)",
    glow: "rgba(255,107,43,0.25)",
  },
  {
    id: "trophy",
    label: "Trophy Raise",
    emoji: "\uD83C\uDFC6",
    title: "Lên cấp độ mới!",
    subtitle: "Bạn đã chinh phục toàn bộ nội dung chương này!",
    accent: "#FFD700",
    bg: "linear-gradient(135deg, #141400 0%, #252500 50%, #141400 100%)",
    glow: "rgba(255,220,0,0.25)",
  },
  {
    id: "stars",
    label: "Star Shower",
    emoji: "\u2B50",
    title: "Điểm tuyệt đối!",
    subtitle: "Chưa từng có ai đạt điểm cao như bạn trước đây!",
    accent: "#9C6EFF",
    bg: "linear-gradient(135deg, #0d0022 0%, #180040 50%, #0d0022 100%)",
    glow: "rgba(156,110,255,0.25)",
  },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export function RobotCelebration() {
  const [active, setActive] = useState<MascotState>("celebrate");
  const [key, setKey] = useState(0);

  const current = CELEBRATIONS.find((c) => c.id === active)!;

  const handleSelect = (id: MascotState) => {
    setActive(id);
    setKey((k) => k + 1);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-8">

      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold font-display">Robot Celebration Animations</h2>
        <p className="text-sm text-muted-foreground">Chọn trạng thái để xem animation</p>
      </div>

      {/* Selector tabs */}
      <div className="flex flex-wrap justify-center gap-3">
        {CELEBRATIONS.map((c) => (
          <button
            key={c.id}
            onClick={() => handleSelect(c.id)}
            className="relative px-5 h-11 rounded-2xl text-sm font-semibold transition-all outline-none cursor-pointer border"
            style={{
              background: active === c.id ? c.accent : "transparent",
              color: active === c.id ? "#000" : c.accent,
              borderColor: c.accent,
              boxShadow: active === c.id ? `0 0 20px ${c.glow}` : "none",
            }}
          >
            <span className="mr-1.5">{c.emoji}</span>
            {c.label}
          </button>
        ))}
      </div>

      {/* Main stage */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-3xl overflow-hidden border"
          style={{
            background: current.bg,
            borderColor: `${current.accent}30`,
            boxShadow: `0 0 60px ${current.glow}, 0 0 120px ${current.glow}40`,
            minHeight: 380,
          }}
        >
          {/* Background grid dots */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle, ${current.accent} 1px, transparent 1px)`,
              backgroundSize: "28px 28px",
            }}
          />

          {/* Content */}
          <div className="relative flex flex-col md:flex-row items-center justify-center gap-8 p-8 md:p-12">

            {/* Robot */}
            <div className="flex-shrink-0">
              <RobotMascot
                key={key}
                state={active}
                size={200}
                loop={true}
                className="drop-shadow-2xl"
              />
            </div>

            {/* Text info */}
            <div className="text-center md:text-left space-y-4 max-w-xs">
              {/* Emoji badge */}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 350, damping: 20, delay: 0.2 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl text-4xl"
                style={{ background: `${current.accent}20`, border: `2px solid ${current.accent}40` }}
              >
                {current.emoji}
              </motion.div>

              {/* Title */}
              <motion.h3
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
                className="text-3xl font-bold"
                style={{ color: current.accent }}
              >
                {current.title}
              </motion.h3>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.32, duration: 0.4 }}
                className="text-base text-white/70 leading-relaxed"
              >
                {current.subtitle}
              </motion.p>

              {/* Replay button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                onClick={() => setKey((k) => k + 1)}
                className="mt-2 inline-flex items-center gap-2 px-5 h-10 rounded-xl text-sm font-semibold transition-all outline-none cursor-pointer"
                style={{
                  background: `${current.accent}20`,
                  color: current.accent,
                  border: `1.5px solid ${current.accent}50`,
                }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                \u21BA Phát lại
              </motion.button>
            </div>
          </div>

          {/* Bottom label */}
          <div
            className="absolute bottom-4 right-4 text-xs font-mono opacity-40"
            style={{ color: current.accent }}
          >
            state="{active}"
          </div>
        </motion.div>
      </AnimatePresence>

      {/* All 4 mini previews */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {CELEBRATIONS.map((c) => (
          <motion.button
            key={c.id}
            onClick={() => handleSelect(c.id)}
            whileHover={{ scale: 1.04, y: -4 }}
            whileTap={{ scale: 0.97 }}
            className="relative rounded-2xl p-4 flex flex-col items-center gap-3 border transition-all outline-none cursor-pointer"
            style={{
              background: active === c.id ? `${c.accent}12` : "var(--color-card)",
              borderColor: active === c.id ? `${c.accent}60` : "var(--color-border)",
              boxShadow: active === c.id ? `0 0 20px ${c.glow}` : "none",
            }}
          >
            {/* Mini robot */}
            <RobotMascot
              state={active === c.id ? c.id : "idle"}
              size={80}
              loop={true}
            />
            <div>
              <div className="text-xs font-semibold text-center" style={{ color: c.accent }}>
                {c.emoji} {c.label}
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
