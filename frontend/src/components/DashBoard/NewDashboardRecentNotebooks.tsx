"use client";

import React, { memo } from "react";
import { useNavigate } from "react-router-dom";
import { useNotebooks } from "../../hooks/useNotebooks";
import { SkeletonCard } from "../ui/SkeletonCard";

const FPT_LIBRARY_COLORS = [
  "bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] border-[#172554] text-white", // Deep Royal Blue
  "bg-gradient-to-br from-[#6D28D9] to-[#4C1D95] border-[#2E1065] text-white", // Deep Purple
  "bg-gradient-to-br from-[#B91C1C] to-[#7F1D1D] border-[#450A0A] text-white", // Deep Crimson Red
  "bg-gradient-to-br from-[#0F766E] to-[#115E59] border-[#042F2E] text-white", // Teal Green
  "bg-gradient-to-br from-[#4338CA] to-[#312E81] border-[#1E1B4B] text-white", // Deep Indigo
];

export const NewDashboardRecentNotebooks = memo(function NewDashboardRecentNotebooks() {
  const navigate = useNavigate();
  const { data: notebooks = [], isLoading } = useNotebooks();

  if (isLoading) {
    return <SkeletonCard />;
  }

  // If there are no notebooks, we show mock default notebooks representing FPT courses
  const displayNotebooks = notebooks.length > 0 ? notebooks.slice(0, 4) : [
    { id: "mad101", title: "Toán rời rạc", code: "MAD101" },
    { id: "swp391", title: "Dự án phần mềm", code: "SWP391" },
    { id: "prn211", title: "Lập trình Java", code: "PRN211" },
    { id: "ai301", title: "Trí tuệ nhân tạo", code: "AI301" },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-extrabold text-slate-800 dark:text-white font-serif flex items-center gap-2.5">
          <svg className="w-6 h-6 text-[#8B5CF6] shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M6 2h14v20H6a2.5 2.5 0 01-2.5-2.5V4.5A2.5 2.5 0 016 2z" fill="#8B5CF6" fillOpacity="0.15" stroke="currentColor" strokeWidth="2.5"/>
          </svg>
          FPT Library
        </h3>
        <button
          onClick={() => navigate("/notebooks")}
          className="text-xs font-extrabold text-[#8B5CF6] hover:text-[#7C3AED] transition-colors"
        >
          Xem tất cả
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1">
        {displayNotebooks.map((nb: any, idx: number) => {
          const colorClass = FPT_LIBRARY_COLORS[idx % FPT_LIBRARY_COLORS.length];
          const code = nb.code || nb.title.split(" ")[1] || nb.title.substring(0, 6).toUpperCase();
          const abbreviation = code.replace(/[0-9]/g, "").toUpperCase();
          const title = nb.code ? nb.title : (
            nb.id === "mad101" ? "Toán rời rạc" :
            nb.id === "swp391" ? "Dự án phần mềm" :
            nb.id === "prn211" ? "Lập trình Java" :
            nb.id === "ai301" ? "Trí tuệ nhân tạo" : nb.title
          );

          return (
            <div
              key={nb.id}
              onClick={() => navigate(nb.code ? `/notebooks` : `/notebooks/${nb.id}`)}
              className={`relative p-5 pl-8 pr-6 rounded-r-xl rounded-l-md flex flex-col justify-between min-h-[185px] transition-all duration-300 hover:scale-[1.04] hover:shadow-xl cursor-pointer ${colorClass} border border-black/10 border-l-[11px] border-l-black/35 shadow-md overflow-hidden`}
            >
              {/* Spine crease line shadow & highlight */}
              <div className="absolute left-0 top-0 bottom-0 w-[1.5px] bg-white/15" />
              <div className="absolute left-[1.5px] top-0 bottom-0 w-[2px] bg-black/10" />

              {/* Spine decorative ribs */}
              <div className="absolute left-[-8px] top-[25%] w-[6px] h-[2px] bg-white/20 rounded-full" />
              <div className="absolute left-[-8px] top-[50%] w-[6px] h-[2px] bg-white/20 rounded-full" />
              <div className="absolute left-[-8px] top-[75%] w-[6px] h-[2px] bg-white/20 rounded-full" />

              {/* Inset cover frame for hardcover look */}
              <div className="absolute inset-2 left-4 rounded-r-lg border border-white/10 pointer-events-none" />

              {/* Realistic paper page stack on the right edge */}
              <div className="absolute right-[2px] top-[4px] bottom-[4px] w-[5px] bg-gradient-to-r from-[#FAF8F5] via-[#EADDC9] to-[#FAF8F5] dark:from-[#cbd5e1] dark:to-[#94a3b8] rounded-r-md border-y border-r border-black/15 z-0" />
              
              <div className="text-right z-10">
                <span className="bg-white/10 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-extrabold tracking-wider border border-white/5 uppercase">
                  {code}
                </span>
              </div>
              
              <div className="flex flex-col mb-1 z-10">
                <span className="text-2xl font-extrabold font-serif tracking-wider drop-shadow-md">
                  {abbreviation}
                </span>
                <span className="text-[10px] font-bold leading-tight mt-1 opacity-90 truncate max-w-full drop-shadow-sm">
                  {title}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
