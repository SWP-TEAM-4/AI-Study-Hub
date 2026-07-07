"use client";

import React, { memo, useState } from "react";
import { ChevronRight, Sparkles, Trophy, X, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { userService } from "../../services/userService";
import { SkeletonCard } from "../ui/SkeletonCard";

function Avatar({ user, size = "size-10" }: { user: any; size?: string }) {
  const initial = user.fullName ? user.fullName.charAt(0).toUpperCase() : "?";
  return user.avatarUrl ? (
    <img
      src={user.avatarUrl}
      alt={user.fullName || ""}
      className={`${size} rounded-full object-cover border-2 border-white shadow-md`}
    />
  ) : (
    <div className={`${size} rounded-full bg-[#bee9ff] border-2 border-[#89cff0] text-[#0d6683] font-bold flex items-center justify-center`}>
      {initial}
    </div>
  );
}

const springConfig = { type: "spring", stiffness: 380, damping: 30 };

export const NewDashboardLeaderboard = memo(function NewDashboardLeaderboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"ranking" | "stickers">("ranking");
  const [selectedSticker, setSelectedSticker] = useState<any | null>(null);

  const { data: contributors = [], isLoading: isLoadingContributors } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const response = await userService.getTopContributors();
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: profileData, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["profileForStickers"],
    queryFn: async () => {
      const response = await userService.getMyProfile();
      return response.data || null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: testHistory, isLoading: isLoadingTests } = useQuery({
    queryKey: ["testHistoryForStickers"],
    queryFn: async () => {
      const response = await userService.getMyTestHistory({ page: 0, size: 1 });
      return response.data || null;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoadingContributors || isLoadingProfile || isLoadingTests) {
    return <SkeletonCard />;
  }

  const points = profileData?.points || 0;
  const testCount = testHistory?.totalElements || 0;

  // LESA Stickers List
  const stickers = [
    {
      id: "mouse",
      image: "/images/lesa_mouse.png",
      name: "Chuột Sáng Tạo",
      req: "Có tài khoản học tập trên MindSpace",
      isUnlocked: true
    },
    {
      id: "sheep",
      image: "/images/lesa_sheep.png",
      name: "Cừu Học Nhạc",
      req: "Có điểm tích lũy học tập > 50",
      isUnlocked: points > 50
    },
    {
      id: "logo",
      image: "/images/lesa_logo.png",
      name: "Logo LESA",
      req: "Hoàn thành ít nhất 1 bài kiểm tra",
      isUnlocked: testCount > 0
    },
    {
      id: "star",
      emoji: "🌟",
      name: "Sao May Mắn",
      req: "Có điểm tích lũy học tập > 150",
      isUnlocked: points > 150
    },
    {
      id: "book",
      emoji: "📖",
      name: "Sách Phép Thuật",
      req: "Tham gia diễn đàn tài liệu",
      isUnlocked: true
    },
    {
      id: "lens",
      emoji: "🔍",
      name: "Kính Vạn Hoa",
      req: "Hoàn thành 3 bài kiểm tra",
      isUnlocked: testCount >= 3
    }
  ];

  const top3 = contributors.slice(0, 3);

  return (
    <>
      <div className="relative flex h-full min-h-[380px] flex-col overflow-hidden rounded-3xl bg-white border-2 border-[#fcdf46]/40 p-8 shadow-[0_8px_0_rgba(252,223,70,0.15)] transition-all hover:scale-[1.01] group select-none">
        
        {/* Card Header with tabs */}
        <div className="relative z-10 mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("ranking")}
              className={`text-lg font-extrabold pb-1 transition-all font-serif ${
                activeTab === "ranking" 
                  ? "text-[#0d1c2e] border-b-4 border-[#fcdf46]" 
                  : "text-slate-400 border-b-4 border-transparent hover:text-slate-600"
              }`}
            >
              Vinh Danh
            </button>
            <button
              onClick={() => setActiveTab("stickers")}
              className={`text-lg font-extrabold pb-1 transition-all font-serif ${
                activeTab === "stickers" 
                  ? "text-[#0d1c2e] border-b-4 border-[#fcdf46]" 
                  : "text-slate-400 border-b-4 border-transparent hover:text-slate-600"
              }`}
            >
              Sổ Sticker 🧸
            </button>
          </div>

          {activeTab === "ranking" && (
            <button 
              onClick={() => setIsOpen(true)} 
              disabled={contributors.length === 0} 
              className="text-[14px] font-bold text-[#0d6683] hover:text-[#0a4e65] disabled:opacity-40 font-serif"
            >
              Tất cả &rarr;
            </button>
          )}
        </div>

        {/* TAB Content 1: Leaderboard */}
        {activeTab === "ranking" && (
          contributors.length === 0 ? (
            <div className="flex-1 grid place-items-center text-[15px] font-bold text-[#475569]">Chưa có dữ liệu học tập.</div>
          ) : (
            <div className="flex flex-col gap-4 relative z-10">
              {top3.map((user, idx) => {
                const isFirst = idx === 0;
                return (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...springConfig, delay: idx * 0.1 }}
                    key={user.userId}
                    onClick={() => setIsOpen(true)}
                    className={`group/item relative flex cursor-pointer items-center gap-4 rounded-2xl p-4 transition-all ${
                      isFirst 
                        ? "bg-[#fef9c3]/50 border-2 border-[#fcdf46]/40 shadow-[0_4px_0_rgba(252,223,70,0.1)]" 
                        : "bg-transparent hover:bg-[#eff4ff] border-2 border-transparent hover:border-[#89cff0]/20"
                    }`}
                  >
                    <div className="relative flex items-center justify-center w-6 font-extrabold">
                      <span className={isFirst ? "text-[#854d0e] text-lg" : "text-[#475569]"}>#{user.rank}</span>
                    </div>
                    
                    <Avatar user={user} size={isFirst ? "size-12" : "size-10"} />
                    
                    <div className="flex-1 min-w-0">
                      <div className={`truncate tracking-tight font-serif ${isFirst ? "font-extrabold text-[16px] text-[#0d1c2e]" : "font-bold text-[15px] text-[#0d1c2e]"}`}>
                        {user.fullName}
                      </div>
                      <div className="mt-0.5 text-[12px] font-bold text-slate-500">
                        {user.reputationPoints.toLocaleString()} điểm
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )
        )}

        {/* TAB Content 2: Sticker Book Grid */}
        {activeTab === "stickers" && (
          <div className="grid grid-cols-3 gap-3 relative z-10 flex-1 justify-center py-2">
            {stickers.map((st) => (
              <motion.div
                key={st.id}
                whileHover={{ scale: 1.05 }}
                onClick={() => setSelectedSticker(st)}
                className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                  st.isUnlocked 
                    ? "bg-[#effbfa] border-[#8ad5b3] shadow-[0_4px_0_rgba(138,213,179,0.2)]" 
                    : "bg-slate-50 border-slate-200/60 opacity-60"
                }`}
              >
                {/* Vinyl Sticker with 3D outline effect */}
                <div 
                  className={`w-12 h-12 flex items-center justify-center filter transition-all select-none ${
                    st.isUnlocked 
                      ? "drop-shadow-[0_0_0_2px_#ffffff] drop-shadow-[0_2px_4px_rgba(0,0,0,0.12)] scale-110" 
                      : "grayscale opacity-50"
                  }`}
                >
                  {st.image ? (
                    <img src={st.image} alt={st.name} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-3xl">{st.emoji}</span>
                  )}
                </div>
                <span className="text-[11px] font-extrabold text-slate-600 mt-2 text-center leading-tight truncate w-full">{st.name}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Popup Dialog details for stickers */}
      <AnimatePresence>
        {selectedSticker && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setSelectedSticker(null)}
            className="fixed inset-0 z-50 grid place-items-center bg-[#0d1c2e]/40 p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 15 }} 
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl bg-white border-4 border-[#8ad5b3] p-6 text-center shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedSticker(null)} 
                className="absolute top-4 right-4 grid size-8 place-items-center rounded-full bg-[#eff4ff] text-[#0d6683] hover:bg-[#89cff0] hover:text-white"
              >
                <X size={16} />
              </button>
              
              {selectedSticker.image ? (
                <img src={selectedSticker.image} alt={selectedSticker.name} className="w-24 h-24 object-contain mx-auto my-4 drop-shadow-[0_0_0_3px_#ffffff] drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)]" />
              ) : (
                <div className="text-6xl my-4 drop-shadow-[0_0_0_4px_#ffffff] drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)]">{selectedSticker.emoji}</div>
              )}
              <h3 className="text-2xl font-extrabold text-[#0d1c2e] font-serif mb-2">{selectedSticker.name}</h3>
              
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold mb-4 uppercase ${
                selectedSticker.isUnlocked 
                  ? "bg-[#dcfce7] text-[#166534]" 
                  : "bg-slate-100 text-slate-500"
              }`}>
                {selectedSticker.isUnlocked ? "✨ Đã Mở Khóa" : "🔒 Chưa Đạt"}
              </div>
              
              <p className="text-[14px] text-slate-600 font-bold leading-relaxed bg-[#eff4ff]/40 p-3 rounded-2xl border border-[#89cff0]/10">
                {selectedSticker.isUnlocked 
                  ? "Chúc mừng bé đã đạt được huy hiệu vô cùng đáng yêu này! 🎉" 
                  : `Bé cần hoàn thành: ${selectedSticker.req} để rinh chú sticker này nhé!`
                }
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leaderboard Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={() => setIsOpen(false)} 
            className="fixed inset-0 z-50 grid place-items-center bg-[#0d1c2e]/40 p-4 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 20 }} 
              transition={springConfig}
              onClick={(e) => e.stopPropagation()} 
              className="relative max-h-[85vh] w-full max-w-lg overflow-hidden rounded-3xl bg-white border-4 border-[#fcdf46] shadow-2xl"
            >
              <div className="relative flex items-center justify-between border-b-2 border-[#fde047]/30 px-10 py-8">
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight text-[#0d1c2e] font-serif">Bảng Vàng Thành Tích</h2>
                  <p className="mt-2 text-[15px] font-bold text-[#475569]">Những học viên xuất sắc nhất của chúng mình</p>
                </div>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="grid size-10 place-items-center rounded-full bg-[#eff4ff] text-[#0d6683] transition hover:bg-[#89cff0] hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="relative max-h-[60vh] space-y-3 overflow-y-auto p-8 scrollbar-hide">
                {contributors.map((user, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={user.userId} 
                    className="flex items-center gap-5 rounded-2xl bg-[#eff4ff]/30 hover:bg-[#eff4ff]/60 px-6 py-5 transition-all border border-[#89cff0]/15 hover:border-[#89cff0]/30"
                  >
                    <span className="w-8 text-center text-lg font-extrabold text-[#475569] font-serif">#{user.rank}</span>
                    <Avatar user={user} size="size-12" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[17px] font-bold tracking-tight text-[#0d1c2e] font-serif">{user.fullName}</div>
                      <div className="mt-1 flex items-center gap-2 text-[14px] font-bold text-[#475569]">
                        <span className="text-[#0d6683] font-extrabold">{user.reputationPoints.toLocaleString()} điểm</span>
                        <span>·</span>
                        <span>{user.approvedContents} tài liệu</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});
