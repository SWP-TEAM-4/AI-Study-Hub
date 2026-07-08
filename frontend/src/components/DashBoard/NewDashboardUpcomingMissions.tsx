"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion as m } from "framer-motion";
import { Brain, Star, History, Compass, CheckCircle2 } from "lucide-react";
import { userService } from "../../services/userService";
import { SkeletonCard } from "../ui/SkeletonCard";

export function NewDashboardUpcomingMissions() {
  const navigate = useNavigate();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["dashboardMissions"],
    queryFn: async () => {
      const [aiUsage, tests] = await Promise.all([
        userService.getMyAIUsage(),
        userService.getMyTestHistory({ page: 0, size: 1, sort: "newest" }),
      ]);
      return { aiUsage: aiUsage.data, testCount: tests.data.totalElements };
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return <SkeletonCard />;
  }

  const remainingRequests = dashboardData?.aiUsage
    ? Math.max(0, ((dashboardData.aiUsage as any).maxRequests || 0) - ((dashboardData.aiUsage as any).usedRequests || 0))
    : 0;

  // 5 Road Map Milestones
  const milestones = [
    {
      id: "start",
      label: "Bắt Đầu",
      desc: "Trạm xuất phát",
      status: "completed", // Completed milestone
      icon: Compass,
      path: "/notebooks",
      colorClass: "bg-[#ecfdf5] text-[#065f46] border-[#10b981] border-b-4",
      shadowClass: "shadow-[0_4px_0_rgba(16,185,129,0.2)]",
      pos: { left: "8%", top: "60%" },
      tooltip: null
    },
    {
      id: "quiz",
      label: "Đố Vui Trí Tuệ",
      desc: `${dashboardData?.testCount || 0} bài đã làm`,
      status: "active", // Active milestone
      icon: Brain,
      path: "/quiz",
      colorClass: "bg-[#fffbeb] text-[#b45309] border-[#fbbf24] border-b-4",
      shadowClass: "shadow-[0_4px_0_rgba(251,191,36,0.35)]",
      pos: { left: "28%", top: "31%" },
      tooltip: "Bé học ở đây! "
    },
    {
      id: "ask_ai",
      label: "Hỏi Đáp AI",
      desc: `${remainingRequests} lượt hỏi`,
      status: "upcoming",
      icon: Star,
      path: "/ask-ai",
      colorClass: "bg-[#fff7ed] text-[#ea580c] border-[#ff7f50] border-b-4",
      shadowClass: "shadow-[0_4px_0_rgba(255,127,80,0.25)]",
      pos: { left: "50%", top: "67%" },
      tooltip: null
    },
    {
      id: "history",
      label: "Nhật Ký Học",
      desc: "Lịch sử học",
      status: "upcoming",
      icon: History,
      path: "/quiz/history",
      colorClass: "bg-[#f0f9ff] text-[#0284c7] border-[#38bdf8] border-b-4",
      shadowClass: "shadow-[0_4px_0_rgba(56,189,248,0.25)]",
      pos: { left: "72%", top: "32%" },
      tooltip: null
    },
    {
      id: "finish",
      label: "Vũ Trụ Tài Liệu",
      desc: "Trạm vinh danh",
      status: "upcoming",
      icon: CheckCircle2,
      path: "/community",
      colorClass: "bg-[#faf5ff] text-[#7c3aed] border-[#c084fc] border-b-4",
      shadowClass: "shadow-[0_4px_0_rgba(192,132,252,0.25)]",
      pos: { left: "90%", top: "65%" },
      tooltip: null
    }
  ];

  return (
    <m.section 
      initial={{ opacity: 0, y: 35, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 80, damping: 16, mass: 0.8, delay: 0.1 }}
      className="mt-8"
    >
      {/* Lightning Crackle & Cloud Flash Styles */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div>
          <h2 className="text-3xl font-extrabold text-[#0d1c2e] tracking-tight font-serif">Bản Đồ Học Tập Phiêu Lưu</h2>
          <p className="text-sm font-bold text-slate-500 mt-1">Cùng bé vượt qua các trạm tri thức để nhận huy hiệu nhé!</p>
        </div>
      </div>

      {/* Tactile Paper Sticker Container for Roadmap */}
      <div className="relative w-full min-h-[340px] bg-gradient-to-br from-[#f0f9ff] via-[#e0f2fe] to-[#fef9f3] rounded-3xl pt-16 pb-8 px-8 shadow-sm select-none">
        {/* Playful Dashed Stitched Border */}
        <div className="absolute inset-2 md:inset-3 border-4 border-dashed border-[#ffffff]/60 rounded-2xl pointer-events-none z-0" />
        
        {/* Winding road SVG path behind milestones */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 200" preserveAspectRatio="none">
            {/* Soft Shadow path */}
            <path 
              d="M 80 120 C 180 50, 200 50, 280 50 C 360 50, 420 120, 500 120 C 580 120, 640 50, 720 50 C 800 50, 820 120, 900 120" 
              fill="none" 
              stroke="rgba(251,191,36,0.15)" 
              strokeWidth="20" 
              strokeLinecap="round" 
            />
            {/* Winding dashed line */}
            <path 
              d="M 80 120 C 180 50, 200 50, 280 50 C 360 50, 420 120, 500 120 C 580 120, 640 50, 720 50 C 800 50, 820 120, 900 120" 
              fill="none" 
              stroke="#ffd000" 
              strokeWidth="8" 
              strokeLinecap="round" 
              strokeDasharray="16 12" 
            />
            {/* Thin guiding inner line */}
            <path 
              d="M 80 120 C 180 50, 200 50, 280 50 C 360 50, 420 120, 500 120 C 580 120, 640 50, 720 50 C 800 50, 820 120, 900 120" 
              fill="none" 
              stroke="#fff5c0" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
            />
          </svg>
        </div>

        {/* Milestones positioned absolutely over winding path */}
        <div className="absolute inset-0">
          {milestones.map((mNode, idx) => {
            const isActive = mNode.status === "active";
            const isCompleted = mNode.status === "completed";

            return (
              <div 
                key={mNode.id} 
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{ left: mNode.pos.left, top: mNode.pos.top }}
              >
                {/* Float bouncy tooltip for active milestone */}
                {isActive && (
                  <m.div 
                    initial={{ y: -6, opacity: 0 }}
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                    className="absolute top-[-52px] bg-gradient-to-r from-[#ffa07a] to-[#ff7f50] text-white px-3 py-1 rounded-full text-[11px] font-extrabold shadow-md border border-[#ea580c]/20 z-20 whitespace-nowrap"
                  >
                    {mNode.tooltip}
                    {/* Tooltip arrow */}
                    <div className="absolute bottom-[-4px] left-1/2 transform -translate-x-1/2 w-2.5 h-2.5 bg-[#ff7f50] rotate-45 border-r border-b border-[#ea580c]/10" />
                  </m.div>
                )}

                {/* Milestone Node Button */}
                <m.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(mNode.path)}
                  className={`group relative w-16 h-16 rounded-full flex items-center justify-center border-4 ${mNode.colorClass} ${mNode.shadowClass} transition-all duration-150 text-xl font-extrabold`}
                  style={{
                    transform: isActive ? "scale(1.15)" : "none"
                  }}
                >
                  {/* Pulsing Glow on Hover */}
                  <span className="absolute inset-0 rounded-full border-4 border-current opacity-0 group-hover:opacity-60 group-hover:animate-ping transition-all duration-300 pointer-events-none" />

                  {/* Milestone Number */}
                  <span className="font-serif select-none">{idx + 1}</span>

                  {/* Small gold star badge for completed nodes */}
                  {isCompleted && (
                    <div className="absolute bottom-[-4px] right-[-4px] w-6 h-6 rounded-full bg-yellow-400 border border-white shadow-sm flex items-center justify-center text-[11px] font-bold">
                      ⭐
                    </div>
                  )}
                </m.button>

                {/* Text Labels */}
                <div className="mt-3 text-center">
                  <p className="text-[14px] font-extrabold text-[#0d1c2e] font-serif leading-tight">{mNode.label}</p>
                  <p className="text-[11px] font-bold text-slate-500 mt-0.5">{mNode.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </m.section>
  );
}
