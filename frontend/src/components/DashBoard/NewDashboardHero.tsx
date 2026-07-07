"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { userService } from "../../services/userService";
import { motion } from "framer-motion";
import { DotLottiePlayer } from "@dotlottie/react-player";
import "@dotlottie/react-player/dist/index.css";
import { SkeletonCard } from "../ui/SkeletonCard";

export function NewDashboardHero() {
  const navigate = useNavigate();

  const { data: dashboardData, isLoading } = useQuery({
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

  if (isLoading) {
    return <SkeletonCard />;
  }

  const profile = dashboardData?.profile;
  const userName = profile?.fullName?.split(" ")?.pop() || "bạn nhỏ";

  // Calculate Level and XP based on points (200 points per level)
  const points = profile?.points || 0;
  const level = Math.floor(points / 200) + 1;
  const currentXp = points % 200;
  const maxXp = 200;
  const xpPercent = Math.min(100, Math.max(0, (currentXp / maxXp) * 100));
  const liquidY = 110 - (xpPercent / 100) * 70;

  // Get time-based greeting for mascot
  const getMascotGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) {
      return {
        text: '"Chào buổi sáng bé yêu! Nạp đầy năng lượng học tập và thử sức làm một bài đố vui nhé! "',
        status: "Chuột Sáng Tạo "
      };
    } else if (hour >= 12 && hour < 18) {
      return {
        text: '"Chào buổi chiều bé! Cùng khám phá thêm vùng đất tri thức thú vị hôm nay nào! "',
        status: "Chuột Sáng Tạo "
      };
    } else {
      return {
        text: '"Tối rồi bé ơi, làm một bài tập nhẹ nhàng rồi chuẩn bị đi ngủ ngon nhé! "',
        status: "Chuột Sáng Tạo "
      };
    }
  };

  const greeting = getMascotGreeting();

  return (
    <section className="relative px-8 py-10 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[360px] bg-[#fef9f3] border-4 border-[#89cff0] rounded-3xl shadow-[0_8px_0_rgba(137,207,240,0.25)] select-none overflow-hidden">
      {/* Playful Dashed Stitched Border */}
      <div className="absolute inset-2 md:inset-3 border-4 border-dashed border-[#89cff0]/40 rounded-2xl pointer-events-none z-0" />

      {/* Red Bookmark Ribbon (Aligned to grid boundary) */}
      <div 
        className="absolute top-0 right-[42%] w-10 h-32 bg-gradient-to-b from-red-400 to-rose-500 shadow-md pointer-events-none z-0 hidden lg:block"
        style={{
          clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 50% 85%, 0% 100%)",
        }}
      />

      

      {/* Potion Animation Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes float-bubble {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          50% { opacity: 0.6; }
          100% { transform: translateY(-40px) scale(0.8); opacity: 0; }
        }
        .bubble-1 { animation: float-bubble 4s infinite ease-in-out; }
        .bubble-2 { animation: float-bubble 3.2s infinite ease-in-out 1s; }
        .bubble-3 { animation: float-bubble 5s infinite ease-in-out 2s; }
      `}} />

      <div className="relative z-10 lg:col-span-7 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* LESA Brand Logo */}
          {/* <div className="mb-4">
            <img src="/images/lesa_logo.png" alt="LESA Logo" className="h-14 object-contain select-none" />
          </div> */}

          {/* Welcome Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#0d1c2e] tracking-tight mb-4 leading-tight font-serif">
            {isLoading ? (
              <span className="inline-block w-64 h-16 bg-slate-100 rounded-3xl animate-pulse" />
            ) : (
              <>
                Chào <span className="text-[#0d6683] font-quicksand tracking-tight">{userName}</span>!
              </>
            )}
          </h1>

          {/* Description */}
          <p className="text-[#475569] text-lg md:text-xl max-w-xl leading-relaxed font-medium mb-8">
            Hôm nay mình cùng khám phá những bài học thú vị nhé. Học mà chơi, chơi mà học là cách tốt nhất!
          </p>

          <div className="flex flex-col sm:flex-row gap-6 max-w-2xl">
            {/* Mascot Companion Speech Bubble */}
            <div className="group relative flex-1 p-5 bg-white border-2 border-[#8ad5b3] rounded-3xl shadow-[0_6px_0_rgba(138,213,179,0.12)] flex items-center gap-4 transition-transform duration-300 hover:scale-[1.02] cursor-default">
              <img 
                src="/images/lesa_mouse.png" 
                alt="Mascot Mouse" 
                className="w-12 h-12 object-contain shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" 
              />
              <div className="text-[15px] font-bold text-[#0d1c2e] leading-relaxed">
                <span className="text-[#166534] font-extrabold">{greeting.status}:</span> {greeting.text}
              </div>
              {/* Balloon tip */}
              <div className="absolute left-6 top-[-10px] w-4 h-4 bg-white border-t-2 border-l-2 border-[#8ad5b3] rotate-45" />
            </div>

            {/* LESA Magic Potion XP Tube */}
            <div className="p-4 bg-white border-2 border-[#8ad5b3]/40 rounded-3xl shadow-[0_6px_0_rgba(138,213,179,0.12)] flex items-center gap-4 transition-transform duration-300 hover:scale-[1.02] shrink-0 min-w-[210px] select-none">
              <div className="relative shrink-0">
                <svg className="w-14 h-16 drop-shadow-[0_2px_4px_rgba(0,0,0,0.06)]" viewBox="0 0 100 120">
                  {/* Potion Base Liquid (Background fill) */}
                  <path
                    d="M 40 20 L 60 20 L 60 40 L 85 70 A 25 25 0 0 1 15 70 L 40 40 Z"
                    fill="#e6f7ed"
                  />
                  {/* Mask for liquid */}
                  <mask id="potion-mask">
                    <path d="M 40 20 L 60 20 L 60 40 L 85 70 A 25 25 0 0 1 15 70 L 40 40 Z" fill="white" />
                  </mask>
                  {/* Liquid group */}
                  <g mask="url(#potion-mask)">
                    {/* Animated Wave */}
                    <rect x="0" y={liquidY} width="100" height="120" fill="url(#potion-grad)" />
                    {/* Bubbles */}
                    <circle cx="35" cy="80" r="4.5" fill="white" className="bubble-1" />
                    <circle cx="65" cy="70" r="3.5" fill="white" className="bubble-2" />
                    <circle cx="48" cy="88" r="5" fill="white" className="bubble-3" />
                  </g>
                  {/* Glass Bottle Border Outline */}
                  <path
                    d="M 40 20 L 60 20 L 60 40 L 85 70 A 25 25 0 0 1 15 70 L 40 40 Z"
                    fill="none"
                    stroke="#166534"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Sparkle highlights on bottle */}
                  <path d="M 23 72 A 20 20 0 0 1 35 50" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.6" />

                  {/* Gradient definition */}
                  <defs>
                    <linearGradient id="potion-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#8ad5b3" />
                      <stop offset="100%" stopColor="#166534" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-[11px] font-extrabold text-[#166534] uppercase tracking-wider">Bình Ma Thuật</span>
                <span className="text-[17px] font-extrabold text-[#0d1c2e] leading-tight">Cấp độ {level}</span>
                <div className="mt-1 w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/50">
                  <div
                    className="bg-gradient-to-r from-[#8ad5b3] to-[#166534] h-full rounded-full transition-all duration-500"
                    style={{ width: `${xpPercent}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-500 mt-1">{currentXp}/{maxXp} XP</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Squishy 3D Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="relative z-10 flex flex-wrap gap-5 mt-10"
        >
          <button
            onClick={() => navigate("/quiz")}
            className="group relative px-8 py-4 rounded-full font-bold text-white bg-[#89cff0] border-b-4 border-[#0d6683] hover:bg-[#a6dcf8] active:translate-y-[2px] active:border-b-[2px] transition-[transform,background-color] shadow-[0_6px_0_rgba(13,102,131,0.25)] hover:scale-[1.03] duration-150 text-lg font-serif"
          >
            Bắt Đầu Học Tập 
          </button>
        </motion.div>
      </div>

      {/* Animated Lottie Mascot right side */}
      <div className="lg:col-span-5 relative w-full flex justify-center items-center h-[320px] md:h-[400px]">
        <DotLottiePlayer
          src="/animal.lottie"
          autoplay
          loop
          className="w-full h-full max-w-[340px] md:max-w-[400px]"
        />
      </div>
    </section>
  );
}
