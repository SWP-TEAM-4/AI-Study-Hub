import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { RiveConfetti } from "./RiveConfetti";

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
interface MascotCelebrationProps {
  size?: number;
  className?: string;
  /**
   * Đường dẫn tới file video WebM trong suốt.
   * Đặt file vào thư mục /public và truyền tên file vào đây.
   * Mặc định: "/mascot-celebrate.webm"
   * Fallback: nếu không có file webm, sẽ dùng ảnh PNG "/mascot-celebrate.png"
   */
  videoSrc?: string;
  imageSrc?: string;
}

export function MascotCelebration({
  size = 260,
  className = "",
  videoSrc = "/mascot-celebrate.webm",
  imageSrc = "/mascot-celebrate.png",
}: MascotCelebrationProps) {
  const [particleKey, setParticleKey] = useState(0);
  const [showParticles, setShowParticles] = useState(false);
  const [useVideo, setUseVideo] = useState(true);

  // Fire particles on mount and repeat every 2.8s
  useEffect(() => {
    const fire = () => {
      setShowParticles(false);
      setTimeout(() => {
        setParticleKey((k) => k + 1);
        setShowParticles(true);
      }, 50);
    };
    fire();
    const interval = setInterval(fire, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`relative select-none flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* ── PARTICLES ── */}
      {showParticles && <RiveConfetti />}

      {/* ── CHARACTER ── */}
      <motion.div
        initial={{ scale: 0, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        style={{ position: "relative", zIndex: 5 }}
      >
        {/* Float / bounce loop */}
        <motion.div
          animate={{ y: [0, -14, 0, -8, 0], rotate: [-1, 1, -1, 0.5, -1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
        >
          {/*
           * ── VIDEO (WebM với nền trong suốt) ──────────────────────────────
           * Khi bạn đã có file .webm trong suốt:
           *   1. Đặt file vào thư mục: frontend/public/mascot-celebrate.webm
           *   2. Component sẽ tự động dùng video thay cho ảnh PNG
           *
           * Để tạo file .webm trong suốt:
           *   - Tạo video bằng AI (Runway, Pika...) với nền xanh lá (green screen)
           *   - Xóa nền bằng Unscreen.com hoặc CapCut
           *   - Xuất file dưới định dạng WebM (alpha channel)
           */}
          {useVideo ? (
            <video
              autoPlay
              loop
              muted
              playsInline
              onError={() => setUseVideo(false)} // fallback to PNG nếu không có file webm
              style={{
                width: size * 0.95,
                height: size * 0.95,
                objectFit: "contain",
                display: "block",
                background: "transparent",
              }}
            >
              <source src={videoSrc} type="video/webm" />
            </video>
          ) : (
            /* ── FALLBACK: PNG (hiện tại đang dùng) ── */
            <img
              src={imageSrc}
              alt="Mascot celebrating"
              style={{
                width: size * 0.95,
                height: size * 0.95,
                objectFit: "contain",
                display: "block",
              }}
            />
          )}
        </motion.div>

        {/* Ground shadow */}
        <motion.div
          animate={{
            scaleX: [1, 0.75, 1, 0.85, 1],
            opacity: [0.15, 0.06, 0.15, 0.08, 0.15],
          }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: size * 0.55,
            height: 12,
            borderRadius: "50%",
            background: "rgba(0,0,0,0.18)",
            margin: "-6px auto 0",
            transformOrigin: "center",
          }}
        />
      </motion.div>

      {/* ── GLOW BEHIND CHARACTER ── */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: size * 0.7,
          height: size * 0.7,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,140,100,0.45) 0%, rgba(255,107,74,0.12) 60%, transparent 80%)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
