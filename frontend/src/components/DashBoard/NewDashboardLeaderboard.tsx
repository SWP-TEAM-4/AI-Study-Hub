"use client";

import React, { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { userService } from "../../services/userService";
import { SkeletonCard } from "../ui/SkeletonCard";
import { Flame } from "lucide-react";

export const NewDashboardLeaderboard = memo(function NewDashboardLeaderboard() {
  // 1. Fetch Campus Ranking (top contributors)
  const { data: ranking = [], isLoading: isLoadingRanking } = useQuery({
    queryKey: ["leaderboardContributors"],
    queryFn: async () => {
      try {
        const response = await userService.getTopContributors(0, 3);
        return response.data?.items || [];
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // 2. Fetch My Badges
  const { data: myBadges = [], isLoading: isLoadingBadges } = useQuery({
    queryKey: ["myBadgesList"],
    queryFn: async () => {
      try {
        const response = await userService.getMyBadges();
        return response.data || [];
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoadingRanking || isLoadingBadges) {
    return <SkeletonCard />;
  }

  // Fallback rank contributors if API is empty
  const displayRanking = ranking.length > 0 ? ranking.slice(0, 3) : [
    { fullName: "Minh T.", reputationPoints: 520, role: "STUDENT" },
    { fullName: "Khoa N.", reputationPoints: 420, role: "STUDENT" },
    { fullName: "Lan P.", reputationPoints: 390, role: "STUDENT" },
  ];

  // Fallback badges if empty
  const displayBadges = myBadges.length > 0 ? myBadges.slice(0, 3) : [
    { title: "Early Bird", icon: "☀️" },
    { title: "AI Master", icon: "🤖" },
    { title: "Coder", icon: "💻" }
  ];

  const renderBadgeIcon = (title: string) => {
    const cleanTitle = title.toLowerCase();
    if (cleanTitle.includes("early") || cleanTitle.includes("bird") || cleanTitle.includes("sáng") || cleanTitle.includes("☀️")) {
      return (
        <svg className="w-7 h-7 text-amber-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="5" fill="currentColor" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    }
    if (cleanTitle.includes("ai") || cleanTitle.includes("master") || cleanTitle.includes("trí tuệ") || cleanTitle.includes("🤖")) {
      return (
        <svg className="w-7 h-7 text-indigo-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="6" width="18" height="12" rx="3" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2"/>
          <path d="M8 11h.01M16 11h.01M9 15h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M12 6V3M10 3h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    }
    return (
      <svg className="w-7 h-7 text-emerald-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="4" width="18" height="12" rx="2" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2"/>
        <path d="M2 19h20M7 19v-3h10v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 8l-2 2 2 2M15 8l2 2-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Campus Ranking Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 9H4.5A2.5 2.5 0 012 6.5v-1A2.5 2.5 0 014.5 3H6M18 9h1.5A2.5 2.5 0 0022 6.5v-1A2.5 2.5 0 0019.5 3H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 3h12v8a6 6 0 01-12 0V3z" fill="#F59E0B" fillOpacity="0.18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 17v4M8 21h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Top Contributors
          </h3>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-full">This Week</span>
        </div>

        <div className="flex flex-col gap-3 flex-1 justify-center">
          {displayRanking.map((user: any, idx: number) => {
            const medals = ["🥇", "🥈", "🥉"];
            const medalColors = [
              "from-amber-400/20 to-yellow-300/10 border-amber-300/60",
              "from-slate-300/20 to-slate-200/10 border-slate-300/50",
              "from-orange-400/20 to-amber-300/10 border-orange-300/50",
            ];
            const pts = user.reputationPoints || user.points || 0;
            const maxPts = (displayRanking[0]?.reputationPoints || displayRanking[0]?.points || 1);
            const pct = Math.max(10, Math.round((pts / maxPts) * 100));
            return (
              <div
                key={idx}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-gradient-to-r border ${medalColors[idx]} overflow-hidden`}
              >
                {/* Rank medal */}
                <span className="text-xl shrink-0">{medals[idx]}</span>

                {/* Avatar */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-sm shrink-0 ${
                  idx === 0 ? "bg-amber-100 text-amber-700" :
                  idx === 1 ? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300" :
                  "bg-orange-100 text-orange-700"
                }`}>
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : "?"}
                </div>

                {/* Name & stats */}
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-slate-800 dark:text-slate-100 truncate">
                    {user.fullName}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          idx === 0 ? "bg-amber-400" : idx === 1 ? "bg-slate-400" : "bg-orange-400"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 shrink-0">
                      {pts} XP
                    </span>
                  </div>
                </div>

                <Flame className={`w-4 h-4 shrink-0 ${
                  idx === 0 ? "text-amber-500 fill-amber-500" :
                  idx === 1 ? "text-slate-400 fill-slate-400" :
                  "text-orange-500 fill-orange-500"
                }`} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
        <h3 className="text-xl font-extrabold text-slate-800 dark:text-white font-serif flex items-center gap-2.5 mb-6">
          <svg className="w-6 h-6 text-[#8B5CF6] shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="#8B5CF6" fillOpacity="0.15" stroke="currentColor" strokeWidth="2.5"/>
            <path d="M12 7l1.5 3 3.5.5-2.5 2.5.5 3.5-3-2-3 2 .5-3.5-2.5-2.5 3.5-.5z" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
          </svg>
          Badges
        </h3>

        <div className="flex items-center justify-around py-2">
          {displayBadges.map((badge: any, idx: number) => (
            <div key={idx} className="flex flex-col items-center gap-2 cursor-default group">
              <div className="w-14 h-14 rounded-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110">
                {renderBadgeIcon(badge.title || badge.icon)}
              </div>
              <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 font-sans tracking-wide">
                {badge.title}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
