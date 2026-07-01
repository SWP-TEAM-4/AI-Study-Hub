import React, { useState } from "react";
import { Gem, Trophy, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { communityService, ContributorDTO } from "../../services/communityService";

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(-2).map((word) => word[0]).join("").toUpperCase();
}

function Avatar({ user, size = "size-11" }: { user: ContributorDTO; size?: string }) {
  return user.avatarUrl
    ? <img src={user.avatarUrl} alt="" className={`${size} rounded-full object-cover`} />
    : <div className={`${size} grid place-items-center rounded-full bg-white text-sm font-black text-emerald-600`}>{initials(user.fullName)}</div>;
}

export const DashboardLeaderboardWidget = React.memo(function DashboardLeaderboardWidget() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const leaderboardQuery = useQuery({
    queryKey: ["contributorLeaderboard"],
    queryFn: async () => (await communityService.getLeaderboardContributors(0, 10)).data.items,
    staleTime: 60_000,
  });
  const contributors = leaderboardQuery.data ?? [];
  const podiumOrder = [contributors[1], contributors[0], contributors[2]].filter(Boolean) as ContributorDTO[];

  return (
    <>
      <div className="surface-card relative min-h-[340px] overflow-hidden p-5 pb-0" style={{ backgroundColor: "#fffaf0" }}>
        <div className="absolute inset-0 opacity-[0.35]" style={{ background: "repeating-conic-gradient(from 0deg at 50% 100%, transparent 0deg 15deg, #fcd34d 15deg 30deg)" }} />
        <div className="relative z-10 mb-2 flex items-center justify-between">
          <h3 className="font-display text-[17px] font-bold text-slate-800">{t("dashboard.leaderboard.title", "Top Contributors")}</h3>
          <button onClick={() => setIsOpen(true)} disabled={contributors.length === 0} className="inline-flex items-center gap-1.5 rounded-md border bg-white/60 px-2 py-1 text-xs font-bold text-emerald-600 disabled:opacity-40"><Trophy size={14} /> {t("dashboard.leaderboard.details", "Details")}</button>
        </div>

        {leaderboardQuery.isLoading ? (
          <div className="relative z-10 mt-8 h-64 animate-pulse rounded-2xl bg-white/50" />
        ) : leaderboardQuery.isError ? (
          <div className="relative z-10 grid h-64 place-items-center text-center text-sm text-rose-600"><button onClick={() => leaderboardQuery.refetch()}>Không thể tải bảng xếp hạng. Thử lại</button></div>
        ) : contributors.length === 0 ? (
          <div className="relative z-10 grid h-64 place-items-center text-sm text-slate-500">Chưa có dữ liệu đóng góp.</div>
        ) : (
          <div className="relative z-10 flex min-h-[270px] cursor-pointer items-end justify-center gap-2 pt-6" onClick={() => setIsOpen(true)}>
            {podiumOrder.map((user) => {
              const rank = user.rank;
              const height = rank === 1 ? "h-[125px]" : rank === 2 ? "h-[92px]" : "h-[76px]";
              const color = rank === 1 ? "bg-[#9bd16f]" : rank === 2 ? "bg-[#f5b675]" : "bg-[#ec8c8b]";
              return (
                <div key={user.userId} className={rank === 1 ? "flex-[1.2] text-center" : "flex-1 text-center"}>
                  <div className="mx-auto mb-1.5 w-fit rounded-full border-2 border-white shadow-md"><Avatar user={user} size={rank === 1 ? "size-14" : "size-11"} /></div>
                  <div className="truncate text-[11px] font-bold text-slate-800">{user.fullName}</div>
                  <div className="mb-2 text-[10px] font-bold text-slate-500">{user.reputationPoints.toLocaleString()} pts</div>
                  <div className={`${height} ${color} flex justify-center rounded-t-xl pt-2 shadow-inner`}><span className="text-2xl font-black text-white">#{rank}</span></div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOpen(false)} className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 12 }} onClick={(event) => event.stopPropagation()} className="relative max-h-[85vh] w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-[#fffaf0] shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5"><div><h2 className="text-2xl font-black text-slate-900">Leaderboard</h2><p className="text-xs text-slate-500">Xếp hạng đóng góp toàn hệ thống</p></div><button onClick={() => setIsOpen(false)} className="grid size-8 place-items-center rounded-full bg-white text-slate-600 shadow"><X size={16} /></button></div>
              <div className="max-h-[65vh] space-y-2 overflow-y-auto p-5">
                {contributors.map((user) => (
                  <div key={user.userId} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3">
                    <span className="w-7 text-sm font-black text-slate-700">#{user.rank}</span><Avatar user={user} />
                    <div className="min-w-0 flex-1"><div className="truncate text-sm font-bold text-slate-800">{user.fullName}</div><div className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-blue-500"><Gem size={10} /> {user.reputationPoints.toLocaleString()} pts · {user.approvedContents} nội dung duyệt</div></div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});
