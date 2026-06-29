/**
 * Animation Presets — AI Study Hub
 * 
 * Tập hợp các preset animation được tối ưu hóa cho Production:
 * - Duration tối đa 0.4s (đủ đẹp, không gây cảm giác chờ đợi)
 * - Easing [0.16, 1, 0.3, 1] = easeOutExpo — cảm giác "nảy" tự nhiên
 * - Stagger để animate danh sách một cách mượt mà
 */

import type { Variants, Transition } from "framer-motion";

// ─── BASE TRANSITIONS ─────────────────────────────────────────────────────────

export const springTransition: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 30,
};

export const smoothTransition: Transition = {
  duration: 0.35,
  ease: [0.16, 1, 0.3, 1],
};

export const fastTransition: Transition = {
  duration: 0.2,
  ease: "easeOut",
};

// ─── PAGE-LEVEL ANIMATIONS ────────────────────────────────────────────────────

/** Dùng cho Page wrapper — fade + nhẹ nhàng trượt lên từ dưới */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const pageTransition: Transition = {
  duration: 0.35,
  ease: [0.16, 1, 0.3, 1],
};

// ─── CARD / LIST ITEM ANIMATIONS ─────────────────────────────────────────────

/** Dùng cho item trong danh sách — fade + nhẹ nhàng trượt lên */
export const fadeUp: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

/** Dùng khi mount một element đơn giản */
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/** Dùng cho Modal/Dialog — scale từ 95% lên 100% */
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

/** Dùng cho Dropdown/Popover */
export const dropDown: Variants = {
  initial: { opacity: 0, y: 6, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 6, scale: 0.97 },
};

// ─── STAGGER CONTAINER ────────────────────────────────────────────────────────

/**
 * Container với stagger — dùng để animate danh sách Card
 * Mỗi card con delay nhau 0.05s (50ms)
 */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

/**
 * Card item trong stagger container
 */
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

// ─── SLIDE ANIMATIONS ─────────────────────────────────────────────────────────

/** Dùng cho Sidebar drawer — trượt từ trái */
export const slideFromLeft: Variants = {
  initial: { x: "-100%", opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: "-100%", opacity: 0 },
};

/** Dùng cho Bottom sheet trên mobile — trượt từ dưới */
export const slideFromBottom: Variants = {
  initial: { y: "100%", opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: "100%", opacity: 0 },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Tạo delay cho một animation cụ thể
 * Ví dụ: { ...fadeUp, transition: withDelay(0.1) }
 */
export function withDelay(delay: number): Transition {
  return { ...smoothTransition, delay };
}

/**
 * Prop set đơn giản cho motion.div với fade + slide up
 * Dùng: <motion.div {...motionFadeUp(index)}>
 */
export function motionFadeUp(index = 0) {
  return {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      delay: index * 0.05,
    },
  };
}
