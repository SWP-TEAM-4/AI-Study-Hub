"use client";

import React, { memo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Database, Download, FileText, Server } from "lucide-react";
import { motion } from "framer-motion";
import { userService } from "../../services/userService";
import { communityMarketplaceService } from "../../services/communityMarketplaceService";
import { NewDashboard3DBook } from "./NewDashboard3DBook";
import { SkeletonCard } from "../ui/SkeletonCard";
import { useNotebooks } from "../../hooks/useNotebooks";

const BOOK_COLORS = [
  "#89cff0", // pastel blue
  "#ffa07a", // pastel peach/orange
  "#8ad5b3", // pastel green
  "#fcdf46", // pastel yellow
  "#ffb6c1", // pastel pink
];

function MagicChest({ doc, relativeTime, onClick }: { doc: any; relativeTime: (d: string) => string; onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="group relative h-[220px] cursor-pointer select-none flex flex-col justify-end"
    >
      {/* 1. Parchment Scroll (Floats up on hover) */}
      <div className="absolute inset-x-2 top-[70px] z-10 transition-all duration-500 ease-out transform translate-y-0 scale-75 opacity-0 group-hover:-translate-y-[85px] group-hover:scale-100 group-hover:opacity-100 pointer-events-none">
        {/* Scroll Paper container */}
        <div className="relative p-3 bg-[#fcf8ed] border-2 border-[#d4b270] rounded-2xl shadow-xl flex flex-col justify-between min-h-[110px]">
          {/* Scroll Side Rollers */}
          <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-[90%] bg-[#b89047] rounded-full border border-[#8b6515] shadow-inner" />
          <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-[90%] bg-[#b89047] rounded-full border border-[#8b6515] shadow-inner" />
          
          <div>
            <span className="text-[8px] font-extrabold text-[#b45309] uppercase tracking-wider font-serif">Cuộn Sách Da</span>
            <p className="text-[11px] font-extrabold text-[#1e293b] leading-tight line-clamp-2 mt-1 font-serif">
              {doc.title}
            </p>
          </div>
          <div className="border-t border-[#f1e5cf] pt-1 mt-1.5 flex items-center justify-between text-[8px] text-[#475569] font-bold font-serif">
            <span className="text-[#b45309]">{doc.downloadCount} lượt tải</span>
            <span>{relativeTime(doc.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* 2. Magic Glow Aura */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-24 h-12 bg-gradient-to-t from-yellow-400/30 via-amber-400/10 to-transparent blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0" />

      {/* 3. The Wizard Chest Container */}
      <div className="relative w-full h-[110px] flex flex-col justify-end z-20 pointer-events-none">
        {/* A. Chest Lid */}
        <div className="absolute bottom-[44px] left-[50%] -translate-x-[50%] w-[110px] h-[45px] transition-all duration-500 ease-out transform translate-y-0 group-hover:-translate-y-8 group-hover:rotate-[-6deg] z-10 origin-bottom-left">
          <svg viewBox="0 0 130 50" className="w-full h-full drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)]">
            <path d="M 5 50 C 5 15, 125 15, 125 50 Z" fill="#854d0e" stroke="#451a03" strokeWidth="4" />
            <rect x="25" y="10" width="8" height="40" fill="#facc15" stroke="#a16207" strokeWidth="2" />
            <rect x="97" y="10" width="8" height="40" fill="#facc15" stroke="#a16207" strokeWidth="2" />
            <path d="M 55 10 Q 65 0 75 10" fill="none" stroke="#facc15" strokeWidth="5" strokeLinecap="round" />
            <rect x="59" y="38" width="12" height="12" fill="#eab308" stroke="#854d0e" strokeWidth="1.5" />
          </svg>
        </div>

        {/* B. Chest Body */}
        <div className="absolute bottom-0 left-[50%] -translate-x-[50%] w-[110px] h-[50px] z-0">
          <svg viewBox="0 0 130 55" className="w-full h-full drop-shadow-[0_6px_10px_rgba(13,28,46,0.15)]">
            <rect x="5" y="0" width="120" height="50" rx="4" fill="#a16207" stroke="#451a03" strokeWidth="4" />
            <rect x="5" y="0" width="12" height="50" fill="#facc15" stroke="#a16207" strokeWidth="2" />
            <rect x="113" y="0" width="12" height="50" fill="#facc15" stroke="#a16207" strokeWidth="2" />
            <rect x="5" y="42" width="120" height="8" fill="#eab308" stroke="#a16207" strokeWidth="2" />
            <circle cx="65" cy="10" r="5" fill="#facc15" stroke="#451a03" strokeWidth="2" />
            <rect x="61" y="10" width="8" height="10" rx="1.5" fill="#facc15" stroke="#451a03" strokeWidth="2" />
          </svg>
        </div>
      </div>

      {/* Label under the chest */}
      <div className="text-center mt-2.5 pb-2 relative z-30 pointer-events-none">
        <p className="text-[12px] font-extrabold text-[#0d1c2e] line-clamp-1 font-serif">{doc.title}</p>
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-serif">{doc.downloadCount} lượt tải</p>
      </div>
    </div>
  );
}

export const NewDashboardRecentNotebooks = memo(function NewDashboardRecentNotebooks() {
  const navigate = useNavigate();

  // Get recent notebooks using custom hook
  const { data: notebooks = [], isLoading: isLoadingNotebooks } = useNotebooks();

  // Get community docs
  const { data: documents = [], isLoading: isLoadingDocuments } = useQuery({
    queryKey: ["recentDocuments"],
    queryFn: async () => {
      const response = await communityMarketplaceService.browse({ category: "documents", page: 0, size: 3, sort: "downloadCount" });
      return response.data?.items || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoadingNotebooks || isLoadingDocuments) {
    return <SkeletonCard />;
  }

  const relativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const diffMs = Date.now() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) return "Hôm nay";
      if (diffDays === 1) return "Hôm qua";
      return `${diffDays} ngày trước`;
    } catch {
      return "Gần đây";
    }
  };

  return (
    <div className="mt-8 relative z-10">
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />

      {/* Books Section */}
      <div>
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-extrabold text-[#0d1c2e] tracking-tight font-serif">Sách Vở Gần Đây</h3>
          </div>
          <button
            onClick={() => navigate("/notebooks")}
            className="text-[15px] font-bold text-[#0d6683] hover:text-[#0a4e65] flex items-center gap-1 transition-[color] font-serif"
          >
            Tất cả vở &rarr;
          </button>
        </div>

        {notebooks.length === 0 ? (
          <div className="min-h-[12rem] py-12 px-6 flex items-center justify-center text-[#475569] text-[15px] bg-white rounded-3xl border-2 border-dashed border-slate-200">
            Chưa có vở học tập nào được xếp trên kệ.
          </div>
        ) : (
          /* Light Pastel Wooden Toy Bookshelf */
          <div className="relative pt-20 pb-12 px-10 bg-gradient-to-b from-[#e0f2fe] via-[#bae6fd] to-[#7dd3fc] rounded-t-[80px] rounded-b-3xl border-4 border-[#89cff0] shadow-[0_12px_24px_rgba(137,207,240,0.25)] min-h-[350px] flex items-end overflow-hidden">
            {/* Inner Border Line */}
            <div className="absolute inset-2 border-2 border-white/40 rounded-t-[72px] rounded-b-[18px] pointer-events-none" />

            {/* Books Row */}
            <div className="flex flex-row items-end gap-10 overflow-x-auto pb-6 pt-4 w-full no-scrollbar snap-x relative z-10 px-4">
              {notebooks.map((notebook, idx) => {
                const bookCol = BOOK_COLORS[idx % BOOK_COLORS.length];
                return (
                  <motion.div
                    key={notebook.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08, type: "spring", stiffness: 100 }}
                    className="snap-start shrink-0"
                  >
                    <NewDashboard3DBook
                      title={notebook.title}
                      subjectCode={notebook.subjectCode || "BÀI HỌC"}
                      documentCount={notebook.documentCount}
                      color={bookCol}
                      onClick={() => navigate(`/notebooks/${notebook.id}`)}
                      index={idx}
                      dateText={relativeTime(notebook.createdAt)}
                    />
                  </motion.div>
                );
              })}
            </div>
            
            {/* Pastel Toy brackets left and right */}
            <div className="absolute bottom-[10px] left-6 w-3 h-6 bg-gradient-to-b from-[#ffe66d] to-[#d9a507] rounded-b-sm shadow-md pointer-events-none" />
            <div className="absolute bottom-[10px] right-6 w-3 h-6 bg-gradient-to-b from-[#ffe66d] to-[#d9a507] rounded-b-sm shadow-md pointer-events-none" />

            {/* Pastel Yellow Wood shelf board */}
            <div className="absolute bottom-[26px] left-6 right-6 h-5 bg-gradient-to-r from-[#ffe66d] to-[#fde047] rounded-md border-t border-[#e2c62d]/40 shadow-[0_4px_10px_rgba(0,0,0,0.15)] pointer-events-none flex flex-col justify-start">
              {/* White inlaid highlight stripe */}
              <div className="h-[2px] bg-white/60 w-full mt-[1px]" />
            </div>
          </div>
        )}
      </div>

      {/* Community Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="pt-10"
      >
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-extrabold text-[#0d1c2e] tracking-tight font-serif">Kho Tài Liệu Chung</h3>
          </div>
          <button
            onClick={() => navigate("/community")}
            className="text-[15px] font-bold text-[#0d6683] hover:text-[#0a4e65] flex items-center gap-1 transition-[color] font-serif"
          >
            Khám phá ngay &rarr;
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="bg-white border-2 border-[#89cff0]/40 rounded-3xl min-h-[12rem] py-12 px-6 flex items-center justify-center text-[#475569] text-[15px] shadow-[0_8px_0_rgba(137,207,240,0.15)]">
            Chưa có tài liệu cộng đồng nào được chia sẻ.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white border-4 border-[#89cff0]/20 rounded-3xl p-6 shadow-inner">
             {documents.map((doc: any, idx: number) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="flex justify-center w-full"
              >
                <MagicChest
                  doc={doc}
                  relativeTime={relativeTime}
                  onClick={() => navigate("/community")}
                />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
});
