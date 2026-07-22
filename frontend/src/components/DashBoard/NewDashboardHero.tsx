"use client";

import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { userService } from "../../services/userService";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { DotLottiePlayer } from "@dotlottie/react-player";
import "@dotlottie/react-player/dist/index.css";

export function NewDashboardHero() {
  const navigate = useNavigate();
  const [isMascotHovered, setIsMascotHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: dashboardData } = useQuery({
    queryKey: ["dashboardHero"],
    queryFn: async () => {
      const [profile, aiUsage, tests] = await Promise.all([
        userService.getMyProfile(),
        userService.getMyAIUsage(),
        userService.getMyTestHistory({ page: 0, size: 1, sort: "newest" }),
      ]);
      return {
        profile: profile.data,
        aiUsage: aiUsage.data,
        testCount: tests.data.totalElements
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const profile = dashboardData?.profile;
  const userName = profile?.fullName?.split(" ")?.pop() || "bạn";

  return (
    <section
      ref={sectionRef}
      style={{ willChange: "transform" }}
      className="relative px-8 py-10 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[360px]
      bg-white/40 dark:bg-white/[0.04]
      backdrop-blur-md
      border-4 border-[#89cff0] dark:border-[#34d399]/40
      rounded-[32px]
      shadow-[0_8px_32px_rgba(137,207,240,0.15)] dark:shadow-[0_8px_32px_rgba(52,211,153,0.08)]
      select-none overflow-hidden
    ">
      {/* Dashed stitched border inside to match onboarding tour */}
      <div className="absolute inset-1.5 border-4 border-dashed border-[#89cff0]/30 dark:border-[#34d399]/20 rounded-[24px] pointer-events-none z-0" />

      {/* Subtle inner glow ring */}
      <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-white/60 via-transparent to-transparent dark:from-white/5 dark:via-transparent dark:to-transparent pointer-events-none z-0" />

      {/* Red Bookmark Ribbon (Aligned to grid boundary) */}
      <div
        className="absolute top-0 right-[42%] w-10 h-32 bg-gradient-to-b from-red-400 to-rose-500 shadow-md pointer-events-none z-0 hidden lg:block"
        style={{
          clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 50% 85%, 0% 100%)",
        }}
      />

      {/* Floating particles decoration */}
      <motion.div
        className="absolute top-20 left-[10%] w-2 h-2 rounded-full bg-[#89cff0]/50 dark:bg-[#34d399]/50"
        animate={{
          y: [0, -20, 0],
          opacity: [0.3, 0.8, 0.3],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-40 left-[25%] w-3 h-3 rounded-full bg-purple-300/40 dark:bg-purple-500/40"
        animate={{
          y: [0, -15, 0],
          opacity: [0.2, 0.6, 0.2],
          scale: [1, 1.3, 1],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
      <motion.div
        className="absolute bottom-32 right-[15%] w-2 h-2 rounded-full bg-emerald-300/50 dark:bg-emerald-500/50"
        animate={{
          y: [0, -25, 0],
          opacity: [0.4, 0.9, 0.4],
          scale: [1, 1.4, 1],
        }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <div className="relative z-10 lg:col-span-7 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Welcome Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 leading-tight font-serif">
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "backOut" }}
              className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-[#0d6683] to-slate-900 dark:from-white dark:via-[#34d399] dark:to-white drop-shadow-sm dark:drop-shadow-[0_2px_10px_rgba(52,211,153,0.3)]"
              style={{ backgroundSize: "200% auto" }}
            >
              Chào <span className="font-quicksand tracking-tight">{userName}</span>!
            </motion.span>
          </h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-muted-foreground dark:text-slate-200 text-lg md:text-xl max-w-xl leading-relaxed font-medium mb-8 drop-shadow-sm"
          >
            Hôm nay mình cùng khám phá những bài học thú vị nhé. Học mà chơi, chơi mà học là cách tốt nhất!
          </motion.p>
        </motion.div>

        {/* Squishy 3D Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="relative z-10 flex flex-wrap gap-5"
        >
          <motion.button
            onClick={() => navigate("/quiz")}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95, y: 2 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="group relative px-8 py-4 rounded-full font-bold text-[#0a4b61] dark:text-white bg-[#89cff0] dark:bg-gradient-to-r dark:from-indigo-500 dark:to-purple-600 border-b-4 border-[#0d6683] dark:border-indigo-800 hover:bg-[#a6dcf8] dark:hover:from-indigo-400 dark:hover:to-purple-500 active:translate-y-[2px] active:border-b-[2px] shadow-[0_6px_0_rgba(13,102,131,0.25)] dark:shadow-[0_0_25px_rgba(99,102,241,0.6)] hover:shadow-[0_8px_0_rgba(13,102,131,0.25)] dark:hover:shadow-[0_0_35px_rgba(99,102,241,0.8)] duration-150 text-lg font-serif overflow-hidden"
          >
            {/* Shine effect on hover */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full"
              whileHover={{ x: "200%" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
            <span className="relative z-10">Bắt Đầu Học Tập</span>
          </motion.button>
        </motion.div>
      </div>

      {/* Animated Lottie Mascot right side */}
      <motion.div
        className="lg:col-span-5 relative w-full flex justify-center items-center h-[320px] md:h-[400px] cursor-pointer"
        onMouseEnter={() => setIsMascotHovered(true)}
        onMouseLeave={() => setIsMascotHovered(false)}
        animate={{
          y: [0, -8, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <DotLottiePlayer
          src="/animal.lottie"
          autoplay
          loop
          speed={isMascotHovered ? 1 : 0.5}
          className="w-full h-full max-w-[340px] md:max-w-[400px]"
        />

        {/* Glow effect behind mascot */}
        <motion.div
          className="absolute inset-0 bg-gradient-radial from-[#89cff0]/20 to-transparent dark:from-[#34d399]/20 rounded-full blur-3xl"
          animate={{
            scale: [0.9, 1.1, 0.9],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>
    </section>
  );
}
