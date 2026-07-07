import React, { useState } from "react";
import { Trophy, X, ChevronRight, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { useSuspenseQuery } from "@tanstack/react-query";
import { communityService, ContributorDTO } from "../../services/communityService";

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(-2).map((word) => word[0]).join("").toUpperCase();
}

function Avatar({ user, size = "size-10" }: { user: ContributorDTO; size?: string }) {
  return user.avatarUrl
    ? <img src={user.avatarUrl} alt="" className={`${size} rounded-full object-cover shadow-sm`} />
    : <div className={`${size} grid place-items-center rounded-full bg-gradient-to-br from-gray-800 to-black text-xs font-semibold text-white shadow-sm ring-1 ring-black/5`}>{initials(user.fullName)}</div>;
}

export const DashboardLeaderboardWidget = React.memo(function DashboardLeaderboardWidget() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const leaderboardQuery = useSuspenseQuery({
    queryKey: ["contributorLeaderboard"],
    queryFn: async () => (await communityService.getLeaderboardContributors(0, 10)).data.items,
    staleTime: 60_000,
  });
  
  const contributors = leaderboardQuery.data ?? [];
  const top3 = contributors.slice(0, 3);

  const springConfig: any = { type: "spring", damping: 20, stiffness: 100 };

  return (
    <>
      <div className="relative flex h-full flex-col overflow-hidden rounded-[24px] bg-white p-6 sm:p-8 shadow-sm ring-1 ring-black/[0.04] transition-all hover:shadow-md">
        <div className="relative z-10 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="grid size-10 place-items-center rounded-full bg-gray-100">
               <Trophy size={18} className="text-[#1d1d1f]" />
             </div>
             <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f]">{t("dashboard.leaderboard.title", "Vinh danh")}</h3>
          </div>
          
          <button 
            onClick={() => setIsOpen(true)} 
            disabled={contributors.length === 0} 
            className="group flex items-center gap-1 text-[13px] font-semibold text-[#86868b] transition hover:text-[#1d1d1f] disabled:opacity-40"
          >
            {t("dashboard.leaderboard.details", "Xem tất cả")}
            <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {contributors.length === 0 ? (
          <div className="flex-1 grid place-items-center text-sm font-medium text-[#86868b]">Chưa có dữ liệu.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {top3.map((user, idx) => {
              const isFirst = idx === 0;
              return (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...springConfig, delay: idx * 0.1 }}
                  key={user.userId}
                  onClick={() => setIsOpen(true)}
                  className={`group relative flex cursor-pointer items-center gap-4 rounded-2xl p-4 transition-all ${
                    isFirst 
                      ? "bg-gradient-to-r from-[#f5f5f7] to-white ring-1 ring-black/5" 
                      : "hover:bg-[#f5f5f7]"
                  }`}
                >
                  <div className="relative flex items-center justify-center w-6 font-bold text-[#86868b]">
                    {isFirst ? (
                      <Sparkles size={16} className="text-amber-500 animate-pulse" />
                    ) : (
                      `#${user.rank}`
                    )}
                  </div>
                  
                  <Avatar user={user} size={isFirst ? "size-12" : "size-10"} />
                  
                  <div className="flex-1 min-w-0">
                    <div className={`truncate font-semibold tracking-tight ${isFirst ? "text-base text-[#1d1d1f]" : "text-sm text-[#1d1d1f]"}`}>
                      {user.fullName}
                    </div>
                    <div className="mt-0.5 text-[12px] font-medium text-[#86868b]">
                      {user.reputationPoints.toLocaleString()} pts
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={() => setIsOpen(false)} 
            className="fixed inset-0 z-50 grid place-items-center bg-black/20 p-4 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 20 }} 
              transition={springConfig}
              onClick={(e) => e.stopPropagation()} 
              className="relative max-h-[85vh] w-full max-w-lg overflow-hidden rounded-[32px] bg-white shadow-2xl ring-1 ring-black/5"
            >
              <div className="flex items-center justify-between border-b border-black/5 px-8 py-6">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-[#1d1d1f]">Leaderboard</h2>
                  <p className="mt-1 text-sm font-medium text-[#86868b]">Xếp hạng đóng góp hệ thống</p>
                </div>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="grid size-10 place-items-center rounded-full bg-[#f5f5f7] text-[#1d1d1f] transition hover:bg-[#e8e8ed]"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="max-h-[60vh] space-y-2 overflow-y-auto p-6">
                {contributors.map((user, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={user.userId} 
                    className="flex items-center gap-4 rounded-[20px] bg-white px-5 py-4 transition hover:bg-[#f5f5f7]"
                  >
                    <span className="w-8 text-center text-base font-bold text-[#86868b]">#{user.rank}</span>
                    <Avatar user={user} size="size-11" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-base font-semibold tracking-tight text-[#1d1d1f]">{user.fullName}</div>
                      <div className="mt-1 flex items-center gap-2 text-xs font-medium text-[#86868b]">
                        <span className="text-amber-600">{user.reputationPoints.toLocaleString()} pts</span>
                        <span>·</span>
                        <span>{user.approvedContents} nội dung</span>
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
