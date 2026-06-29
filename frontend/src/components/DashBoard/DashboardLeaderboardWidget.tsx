import React, { useState } from "react";
import { Trophy, TrendingUp, TrendingDown, Gem, Medal, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

const mockContributions = {
  weekly: [
    { rank: 1, name: "Ngô Nhựt Minh", points: 65322, avatar: "NM", trending: "up" },
    { rank: 2, name: "Lê Trần Anh Khoa", points: 48105, avatar: "AK", trending: "up" },
    { rank: 3, name: "Trần Bích Trâm", points: 21780, avatar: "BT", trending: "down" },
    { rank: 4, name: "Sam Kim", points: 19231, avatar: "S", trending: "up" },
    { rank: 5, name: "Anna Doe", points: 15322, avatar: "A", trending: "down" },
  ],
  monthly: [
    { rank: 1, name: "Lê Trần Anh Khoa", points: 185400, avatar: "AK", trending: "up" },
    { rank: 2, name: "Ngô Nhựt Minh", points: 142100, avatar: "NM", trending: "down" },
    { rank: 3, name: "Sam Kim", points: 98500, avatar: "S", trending: "up" },
    { rank: 4, name: "Trần Bích Trâm", points: 88400, avatar: "BT", trending: "down" },
    { rank: 5, name: "Anna Doe", points: 52100, avatar: "A", trending: "up" },
  ],
  allTime: [
    { rank: 1, name: "Ngô Nhựt Minh", points: 954000, avatar: "NM", trending: "up" },
    { rank: 2, name: "Lê Trần Anh Khoa", points: 842000, avatar: "AK", trending: "up" },
    { rank: 3, name: "Sam Kim", points: 512000, avatar: "S", trending: "up" },
    { rank: 4, name: "Trần Bích Trâm", points: 489000, avatar: "BT", trending: "down" },
    { rank: 5, name: "Anna Doe", points: 312000, avatar: "A", trending: "down" },
  ]
};

export const DashboardLeaderboardWidget = React.memo(function DashboardLeaderboardWidget() {
  const { t } = useTranslation();
  const [isContributorOpen, setIsContributorOpen] = useState(false);
  const [activeContribTab, setActiveContributorTab] = useState<"weekly" | "monthly" | "allTime">("weekly");

  return (
    <>
      <div 
        className="surface-card p-5 pb-0 relative overflow-hidden h-full min-h-[340px]" 
        style={{ backgroundColor: "#fffaf0" }}
      >
        {/* Sunburst Background */}
        <div 
          className="absolute top-0 left-0 right-0 h-full pointer-events-none opacity-[0.35]" 
          style={{ 
            background: "repeating-conic-gradient(from 0deg at 50% 100%, transparent 0deg 15deg, #fcd34d 15deg 30deg)" 
          }} 
        />

        <div className="flex items-center justify-between mb-2 relative z-10">
          <h3 className="font-display text-[17px] font-bold text-slate-800">{t("dashboard.leaderboard.title") || "Top Contributors"}</h3>
          <button
            onClick={() => setIsContributorOpen(true)}
            className="text-xs text-emerald-600 font-bold hover:underline inline-flex items-center gap-1.5 cursor-pointer bg-white/50 px-2 py-1 rounded-md border border-slate-200/20"
          >
            <Trophy size={14} className="text-coral" /> {t("dashboard.leaderboard.details") || "Details"}
          </button>
        </div>

        <div 
          className="relative pt-6 pb-0 flex items-end justify-center gap-2 z-10 min-h-[220px] cursor-pointer" 
          onClick={() => setIsContributorOpen(true)}
        >
          {/* Rank 2 */}
          {mockContributions.weekly[1] && (() => {
            const u = mockContributions.weekly[1];
            return (
              <div className="flex-1 flex flex-col items-center">
                <div className="size-10 rounded-full border-[2px] border-[#3b82f6] bg-white text-[#3b82f6] flex items-center justify-center text-sm font-black shadow-sm z-10 mb-1.5">
                  {u.avatar}
                </div>
                <div className="w-full px-0.5 mb-1">
                  <div className="text-[10px] font-bold text-slate-800 text-center leading-tight truncate">
                    {u.name.split(" ").slice(-2).join(" ")}
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 font-bold mb-2 whitespace-nowrap">
                  {u.points.toLocaleString()} {t("dashboard.leaderboard.pts") || "pts"}
                </div>
                {/* Bục #2 */}
                <div className="w-full h-[85px] bg-[#f5b675] rounded-t-xl flex justify-center pt-2 shadow-[inset_0_4px_6px_rgba(255,255,255,0.4)] transition-transform hover:-translate-y-1">
                  <span className="text-white/90 font-black text-xl drop-shadow-sm">#2</span>
                </div>
              </div>
            );
          })()}

          {/* Rank 1 */}
          {mockContributions.weekly[0] && (() => {
            const u = mockContributions.weekly[0];
            return (
              <div className="flex-[1.2] flex flex-col items-center">
                <div className="size-[50px] rounded-full border-[2px] border-[#22c55e] bg-white text-[#22c55e] flex items-center justify-center text-lg font-black shadow-md z-10 mb-1.5 relative">
                  {u.avatar}
                </div>
                <div className="w-full px-0.5 mb-1">
                  <div className="text-[11px] font-bold text-slate-800 text-center leading-tight truncate">
                    {u.name.split(" ").slice(-2).join(" ")}
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 font-bold mb-2 whitespace-nowrap">
                  {u.points.toLocaleString()} {t("dashboard.leaderboard.pts") || "pts"}
                </div>
                {/* Bục #1 */}
                <div className="w-full h-[115px] bg-[#9bd16f] rounded-t-xl flex justify-center pt-2 shadow-[inset_0_4px_6px_rgba(255,255,255,0.4)] transition-transform hover:-translate-y-1">
                  <span className="text-white font-black text-[26px] leading-none drop-shadow-sm">#1</span>
                </div>
              </div>
            );
          })()}

          {/* Rank 3 */}
          {mockContributions.weekly[2] && (() => {
            const u = mockContributions.weekly[2];
            return (
              <div className="flex-1 flex flex-col items-center">
                <div className="size-10 rounded-full border-[2px] border-[#ef4444] bg-white text-[#ef4444] flex items-center justify-center text-sm font-black shadow-sm z-10 mb-1.5">
                  {u.avatar}
                </div>
                <div className="w-full px-0.5 mb-1">
                  <div className="text-[10px] font-bold text-slate-800 text-center leading-tight truncate">
                    {u.name.split(" ").slice(-2).join(" ")}
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 font-bold mb-2 whitespace-nowrap">
                  {u.points.toLocaleString()} {t("dashboard.leaderboard.pts") || "pts"}
                </div>
                {/* Bục #3 */}
                <div className="w-full h-[75px] bg-[#ec8c8b] rounded-t-xl flex justify-center pt-1.5 shadow-[inset_0_4px_6px_rgba(255,255,255,0.4)] transition-transform hover:-translate-y-1">
                  <span className="text-white/90 font-black text-xl drop-shadow-sm">#3</span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Leaderboard Modal Details */}
      <AnimatePresence>
        {isContributorOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsContributorOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto"
            >
              {/* Modal Container */}
              <motion.div
                initial={{ scale: 0.96, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0, y: 15 }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
                onClick={(e) => e.stopPropagation()}
                className="pointer-events-auto w-full max-w-md bg-[#fffaf0] border border-slate-200 shadow-2xl rounded-3xl flex flex-col max-h-[85vh] overflow-hidden text-left relative"
              >
                {/* Sunburst Background */}
                <div 
                  className="absolute top-0 left-0 right-0 h-[450px] pointer-events-none opacity-[0.35]" 
                  style={{ 
                    background: "repeating-conic-gradient(from 0deg at 50% 100%, transparent 0deg 15deg, #fcd34d 15deg 30deg)" 
                  }} 
                />

                {/* Close Button */}
                <button
                  onClick={() => setIsContributorOpen(false)}
                  className="absolute right-4 top-4 z-50 grid h-8 w-8 place-items-center rounded-full bg-white text-slate-600 shadow-md transition hover:text-slate-900 hover:scale-105 cursor-pointer border border-slate-100"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>

                <div className="pt-6 px-6 pb-2 relative z-20">
                  <h2 className="text-[26px] font-black text-slate-900 tracking-tight">Leaderboard</h2>
                </div>

                {/* Tabs */}
                <div className="flex p-1.5 bg-white/60 backdrop-blur-md rounded-xl mx-5 mt-1 border border-slate-200/50 gap-1 shrink-0 z-20 relative shadow-sm">
                  {[
                    { id: "weekly", label: t("dashboard.leaderboard.weekly") || "Weekly" },
                    { id: "monthly", label: t("dashboard.leaderboard.monthly") || "Monthly" },
                    { id: "allTime", label: t("dashboard.leaderboard.allTime") || "All Time" }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveContributorTab(tab.id as any)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                        activeContribTab === tab.id
                          ? "bg-white text-slate-900 shadow-sm border border-slate-100/50"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] z-20 px-5 pt-4 pb-6 space-y-4">
                  {/* Podium Section in Modal */}
                  <div className="relative pt-6 pb-2 flex items-end justify-center gap-2 min-h-[200px]">
                    {/* Rank 2 */}
                    {mockContributions[activeContribTab][1] && (() => {
                      const u = mockContributions[activeContribTab][1];
                      return (
                        <div className="flex-1 flex flex-col items-center">
                          <div className="size-12 rounded-full border-[3px] border-[#3b82f6] bg-white text-[#3b82f6] flex items-center justify-center text-lg font-black shadow-md z-10 mb-2">
                            {u.avatar}
                          </div>
                          <div className="w-full px-0.5 mb-1">
                            <div className="text-[10px] font-bold text-slate-800 text-center leading-tight truncate">
                              {u.name}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 bg-white border border-[#3b82f6] text-[#3b82f6] px-1.5 py-0.5 rounded-full text-[9px] font-bold shadow-sm mb-2 z-10 whitespace-nowrap">
                            <Gem size={8} className="fill-[#3b82f6]" /> {u.points.toLocaleString()}
                          </div>
                          <div className="w-full h-[75px] bg-[#f5b675] rounded-t-2xl flex justify-center pt-2 shadow-[inset_0_4px_6px_rgba(255,255,255,0.4)]">
                            <span className="text-white/90 font-black text-2xl drop-shadow-sm">#2</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Rank 1 */}
                    {mockContributions[activeContribTab][0] && (() => {
                      const u = mockContributions[activeContribTab][0];
                      return (
                        <div className="flex-[1.2] flex flex-col items-center">
                          <div className="size-[56px] rounded-full border-[3px] border-[#22c55e] bg-white text-[#22c55e] flex items-center justify-center text-xl font-black shadow-md z-10 mb-2">
                            {u.avatar}
                          </div>
                          <div className="w-full px-0.5 mb-1">
                            <div className="text-[11px] font-bold text-slate-800 text-center leading-tight truncate">
                              {u.name}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 bg-white border border-[#22c55e] text-[#22c55e] px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm mb-2 z-10 whitespace-nowrap">
                            <Gem size={9} className="fill-[#22c55e]" /> {u.points.toLocaleString()}
                          </div>
                          <div className="w-full h-[105px] bg-[#9bd16f] rounded-t-2xl flex justify-center pt-3 shadow-[inset_0_4px_6px_rgba(255,255,255,0.4)]">
                            <span className="text-white font-black text-[32px] leading-none drop-shadow-sm">#1</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Rank 3 */}
                    {mockContributions[activeContribTab][2] && (() => {
                      const u = mockContributions[activeContribTab][2];
                      return (
                        <div className="flex-1 flex flex-col items-center">
                          <div className="size-12 rounded-full border-[3px] border-[#ef4444] bg-white text-[#ef4444] flex items-center justify-center text-lg font-black shadow-md z-10 mb-2">
                            {u.avatar}
                          </div>
                          <div className="w-full px-0.5 mb-1">
                            <div className="text-[10px] font-bold text-slate-800 text-center leading-tight truncate">
                              {u.name}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 bg-white border border-[#ef4444] text-[#ef4444] px-1.5 py-0.5 rounded-full text-[9px] font-bold shadow-sm mb-2 z-10 whitespace-nowrap">
                            <Gem size={8} className="fill-[#ef4444]" /> {u.points.toLocaleString()}
                          </div>
                          <div className="w-full h-[65px] bg-[#ec8c8b] rounded-t-2xl flex justify-center pt-1.5 shadow-[inset_0_4px_6px_rgba(255,255,255,0.4)]">
                            <span className="text-white/90 font-black text-2xl drop-shadow-sm">#3</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* List for #4, #5... */}
                  <div className="space-y-2">
                    {mockContributions[activeContribTab].slice(3).map((u) => (
                      <div 
                        key={u.rank} 
                        className="flex items-center gap-3.5 bg-white py-2.5 px-4 rounded-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100 transition-transform hover:scale-[1.01]"
                      >
                        <span className="text-sm font-black text-slate-700 w-5">#{u.rank}</span>
                        <div className="size-9 shrink-0 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center text-xs font-black shadow-sm">
                          {u.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-800 truncate">{u.name}</div>
                          <div className="flex items-center gap-1 text-[#3b82f6] text-[10px] font-bold mt-0.5">
                            <Gem size={10} className="fill-[#3b82f6]/20" /> {u.points.toLocaleString()}
                          </div>
                        </div>
                        <div className="shrink-0">
                          {u.trending === "up" ? (
                            <TrendingUp size={16} className="text-[#22c55e]" strokeWidth={2.5} />
                          ) : (
                            <TrendingDown size={16} className="text-[#ef4444]" strokeWidth={2.5} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
});
