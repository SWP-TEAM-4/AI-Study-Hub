import { useRive, useStateMachineInput, Layout, Fit, Alignment } from "@rive-app/react-canvas";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { RiveConfetti } from "./RiveConfetti";

// ─── TYPES ────────────────────────────────────────────────────────────────────
export type MascotEmotion = "idle" | "celebrate" | "fail" | "thinking" | "streak";

interface RiveMascotProps {
  /**
   * Đường dẫn đến file .riv đặt trong /public
   * VD: "/mascot.riv"
   *
   * Cách có file .riv:
   * 1. Vào rive.app/community → tìm "celebration character" / "mascot"
   * 2. Download → đặt vào frontend/public/mascot.riv
   * 3. Truyền tên State Machine vào prop `stateMachineName`
   */
  src?: string;

  /**
   * Tên của State Machine trong Rive file
   * Bạn xem tên này trong Rive editor (tab Animate → State Machine)
   */
  stateMachineName?: string;

  /**
   * Tên các input trong State Machine:
   * - celebrateTrigger: Trigger kích hoạt animation ăn mừng
   * - failTrigger: Trigger kích hoạt animation thất bại
   * - idleInput: Boolean cho trạng thái đứng yên
   * - thinkingInput: Boolean cho trạng thái đang suy nghĩ
   */
  inputNames?: {
    celebrate?: string;
    fail?: string;
    idle?: string;
    thinking?: string;
    streak?: string;
  };

  emotion?: MascotEmotion;
  size?: number;
  className?: string;
  showParticles?: boolean;
  onAnimationComplete?: () => void;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export function RiveMascot({
  src = "/mascot.riv",
  stateMachineName = "State Machine 1",
  inputNames = {
    celebrate: "celebrate",
    fail: "fail",
    idle: "isIdle",
    thinking: "isThinking",
    streak: "streak",
  },
  emotion = "idle",
  size = 280,
  className = "",
  showParticles = true,
  onAnimationComplete,
}: RiveMascotProps) {
  const [particleKey, setParticleKey] = useState(0);
  const [showP, setShowP] = useState(false);

  // ── Rive setup ──────────────────────────────────────────
  const { rive, RiveComponent } = useRive({
    src,
    stateMachines: stateMachineName,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
    autoplay: true,
    onLoad: () => {
      // File loaded — apply initial emotion
      applyEmotion(emotion);
    },
  });

  // ── State machine inputs ─────────────────────────────────
  const celebrateInput  = useStateMachineInput(rive, stateMachineName, inputNames.celebrate  ?? "celebrate");
  const failInput       = useStateMachineInput(rive, stateMachineName, inputNames.fail       ?? "fail");
  const idleInput       = useStateMachineInput(rive, stateMachineName, inputNames.idle       ?? "isIdle");
  const thinkingInput   = useStateMachineInput(rive, stateMachineName, inputNames.thinking   ?? "isThinking");
  const streakInput     = useStateMachineInput(rive, stateMachineName, inputNames.streak     ?? "streak");

  // ── Apply emotion via State Machine ─────────────────────
  const applyEmotion = (e: MascotEmotion) => {
    // Reset booleans
    if (idleInput)    idleInput.value    = false;
    if (thinkingInput) thinkingInput.value = false;

    switch (e) {
      case "celebrate":
        celebrateInput?.fire(); // Trigger (one-shot)
        break;
      case "fail":
        failInput?.fire();
        break;
      case "streak":
        streakInput?.fire();
        break;
      case "thinking":
        if (thinkingInput) thinkingInput.value = true;
        break;
      case "idle":
      default:
        if (idleInput) idleInput.value = true;
        break;
    }
  };

  // ── React to emotion prop changes ────────────────────────
  useEffect(() => {
    if (!rive) return;
    applyEmotion(emotion);

    // Fire particles on celebrate / streak
    if (emotion === "celebrate" || emotion === "streak") {
      setShowP(false);
      const t = setTimeout(() => {
        setParticleKey((k) => k + 1);
        setShowP(true);
      }, 50);
      return () => clearTimeout(t);
    } else {
      setShowP(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emotion, rive]);

  // ── Repeat particles every 2.8s when celebrating ────────
  useEffect(() => {
    if (emotion !== "celebrate" && emotion !== "streak") return;
    const interval = setInterval(() => {
      setShowP(false);
      setTimeout(() => {
        setParticleKey((k) => k + 1);
        setShowP(true);
      }, 50);
    }, 2800);
    return () => clearInterval(interval);
  }, [emotion]);

  // ── Glow color per emotion ───────────────────────────────
  const glowColor =
    emotion === "celebrate" || emotion === "streak"
      ? "rgba(255,140,100,0.45)"
      : emotion === "thinking"
      ? "rgba(100,150,255,0.35)"
      : emotion === "fail"
      ? "rgba(255,80,80,0.3)"
      : "rgba(255,200,160,0.25)";

  return (
    <div
      className={`relative select-none flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* ── PARTICLES ── */}
      {showParticles && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <AnimatePresence>
            {showP && (emotion === "celebrate" || emotion === "streak") && (
              <motion.div key={`p-${particleKey}`} style={{ position: "absolute", inset: 0 }}>
                <RiveConfetti />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── GLOW ── */}
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: size * 0.72, height: size * 0.72,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 75%)`,
          zIndex: 1, pointerEvents: "none",
          transition: "background 0.5s ease",
        }}
      />

      {/* ── RIVE CANVAS ── */}
      <motion.div
        initial={{ scale: 0, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        style={{
          position: "relative", zIndex: 5,
          width: size, height: size,
        }}
        onAnimationComplete={onAnimationComplete}
      >
        {/* Float/bounce wrapper (CSS animation khi idle) */}
        <motion.div
          animate={
            emotion === "idle"
              ? { y: [0, -8, 0] }
              : emotion === "thinking"
              ? { y: [0, -4, 0] }
              : {} // Rive handles the rest
          }
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ width: "100%", height: "100%" }}
        >
          <RiveComponent
            style={{
              width: "100%",
              height: "100%",
              background: "transparent",
            }}
          />
        </motion.div>

        {/* Shadow */}
        <motion.div
          animate={{
            scaleX: emotion === "celebrate" ? [1, 0.75, 1] : 1,
            opacity: emotion === "celebrate" ? [0.15, 0.06, 0.15] : 0.12,
          }}
          transition={{ duration: 0.65, repeat: Infinity }}
          style={{
            width: size * 0.55, height: 10,
            borderRadius: "50%",
            background: "rgba(0,0,0,0.18)",
            margin: "-5px auto 0",
            transformOrigin: "center",
          }}
        />
      </motion.div>
    </div>
  );
}

// ─── FALLBACK COMPONENT (dùng PNG khi chưa có .riv file) ─────────────────────
/**
 * Component dùng tạm trong khi chưa có file .riv.
 * Khi đã có file .riv, thay bằng <RiveMascot /> ở trên.
 */
export { MascotCelebration } from "./MascotCelebration";
