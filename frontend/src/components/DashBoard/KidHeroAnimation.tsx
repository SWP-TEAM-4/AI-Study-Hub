"use client";

import React from "react";
import { motion } from "framer-motion";

export function KidHeroAnimation() {
  // Lion bouncing animation
  const bounceVariants = {
    animate: {
      y: [0, -20, 0],
      transition: {
        duration: 2.2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  // Tail wag animation
  const tailVariants = {
    animate: {
      rotate: [-12, 12, -12],
      transition: {
        duration: 1.6,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  // Eyes blink animation
  const blinkVariants = {
    animate: {
      scaleY: [1, 0.1, 1],
      transition: {
        duration: 3.5,
        repeat: Infinity,
        ease: "easeInOut",
        repeatDelay: 2
      },
    },
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none pointer-events-none">
      {/* Background decorative circles */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.08 }}
        transition={{ duration: 1 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="w-64 h-64 rounded-full border-4 border-[#89cff0]" />
        <div className="absolute w-48 h-48 rounded-full border-2 border-[#89cff0]" />
      </motion.div>

      {/* Lion SVG */}
      <motion.div
        variants={bounceVariants}
        animate="animate"
        className="relative z-10"
      >
        <svg
          viewBox="0 0 300 300"
          className="w-64 h-64 drop-shadow-md"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Tail */}
          <motion.g
            variants={tailVariants}
            animate="animate"
            style={{ transformOrigin: "270px 180px" }}
          >
            <path
              d="M 270 180 Q 320 150 340 80"
              stroke="#d97706"
              strokeWidth="24"
              fill="none"
              strokeLinecap="round"
            />
            {/* Tail tuft */}
            <circle cx="340" cy="80" r="18" fill="#92400e" />
          </motion.g>

          {/* Body */}
          <ellipse cx="150" cy="180" rx="70" ry="80" fill="#f59e0b" />

          {/* Mane (big and round) */}
          <circle cx="150" cy="100" r="90" fill="#d97706" />

          {/* Head */}
          <circle cx="150" cy="90" r="55" fill="#fbbf24" />

          {/* Ears */}
          <circle cx="100" cy="40" r="20" fill="#d97706" />
          <circle cx="100" cy="40" r="12" fill="#fcd34d" />
          <circle cx="200" cy="40" r="20" fill="#d97706" />
          <circle cx="200" cy="40" r="12" fill="#fcd34d" />

          {/* Eyes */}
          <motion.g variants={blinkVariants} animate="animate" style={{ transformOrigin: "150px 75px" }}>
            <circle cx="120" cy="75" r="12" fill="white" />
            <circle cx="180" cy="75" r="12" fill="white" />
          </motion.g>

          {/* Pupils */}
          <circle cx="123" cy="78" r="7" fill="#1f2937" />
          <circle cx="183" cy="78" r="7" fill="#1f2937" />

          {/* Eye shine */}
          <circle cx="125" cy="76" r="3" fill="white" />
          <circle cx="185" cy="76" r="3" fill="white" />

          {/* Nose */}
          <ellipse cx="150" cy="100" rx="8" ry="6" fill="#92400e" />

          {/* Mouth */}
          <path
            d="M 150 100 Q 140 110 130 108 M 150 100 Q 160 110 170 108"
            stroke="#92400e"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />

          {/* Whiskers */}
          <line x1="60" y1="85" x2="95" y2="82" stroke="#92400e" strokeWidth="2" strokeLinecap="round" />
          <line x1="60" y1="95" x2="95" y2="95" stroke="#92400e" strokeWidth="2" strokeLinecap="round" />
          <line x1="60" y1="105" x2="95" y2="108" stroke="#92400e" strokeWidth="2" strokeLinecap="round" />

          <line x1="240" y1="85" x2="205" y2="82" stroke="#92400e" strokeWidth="2" strokeLinecap="round" />
          <line x1="240" y1="95" x2="205" y2="95" stroke="#92400e" strokeWidth="2" strokeLinecap="round" />
          <line x1="240" y1="105" x2="205" y2="108" stroke="#92400e" strokeWidth="2" strokeLinecap="round" />

          {/* Paws front */}
          <ellipse cx="120" cy="250" rx="18" ry="28" fill="#f59e0b" />
          <ellipse cx="180" cy="250" rx="18" ry="28" fill="#f59e0b" />

          {/* Paw pads */}
          <circle cx="120" cy="265" r="10" fill="#92400e" />
          <circle cx="180" cy="265" r="10" fill="#92400e" />

          {/* Mane details - added strokes for dimension */}
          <circle cx="150" cy="100" r="90" fill="none" stroke="#dc2626" strokeWidth="1" opacity="0.1" />
        </svg>
      </motion.div>
    </div>
  );
}
