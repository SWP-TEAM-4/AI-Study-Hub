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
      : <div className={`${size} grid place-items-center rounded-full bg-gradient-to-br from-[#0071e3] to-[#42a5f5] text-sm font-semibold text-white`}>{initials(user.fullName)}</div>;
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
        <div className="relative min-h-[340px] overflow-hidden rounded-[22px] bg-white p-5 pb-0 shadow-[0_2px_20px_rgba(0,0,0,0.05)] ring-1 ring-black/[0.04]">
          <div className="relative z-10 mb-2 flex items-center justify-between">
            <h3 className="text-base font-semibold tracking-tight text-[#1d1d1f]">{t("dashboard.leaderboard.title", "Top Contributors")}</h3>
            <button onClick={() => setIsOpen(true)} disabled={contributors.length === 0} className="inline-flex items-center gap-1.5 rounded-full bg-[#0071e3]/10 px-3 py-1 text-xs font-medium text-[#0071e3] transition hover:bg-[#0071e3]/15 disabled:opacity-40"><Trophy size={14} /> {t("dashboard.leaderboard.details", "Details")}</button>
          </div>

          {leaderboardQuery.isLoading ? (
            <div className="relative z-10 mt-8 h-64 animate-pulse rounded-2xl bg-black/[0.04]" />
          ) : leaderboardQuery.isError ? (
            <div className="relative z-10 grid h-64 place-items-center text-center text-sm text-rose-600"><button onClick={() => leaderboardQuery.refetch()}>Không thể tải bảng xếp hạng. Thử lại</button></div>
          ) : contributors.length === 0 ? (
            <div className="relative z-10 grid h-64 place-items-center text-sm text-[#86868b]">Chưa có dữ liệu đóng góp.</div>
          ) : (
            <div className="relative z-10 flex min-h-[270px] cursor-pointer items-end justify-center gap-2 pt-6" onClick={() => setIsOpen(true)}>
              {podiumOrder.map((user) => {
                const rank = user.rank;
                const height = rank === 1 ? "h-[125px]" : rank === 2 ? "h-[92px]" : "h-[76px]";
                const color = rank === 1 ? "bg-[#f7c948]" : rank === 2 ? "bg-[#c7c7cc]" : "bg-[#e0a26f]";
                return (
                  <div key={user.userId} className={rank === 1 ? "flex-[1.2] text-center" : "flex-1 text-center"}>
                    <div className="mx-auto mb-1.5 w-fit rounded-full bg-white p-0.5 shadow-[0_4px_14px_rgba(0,0,0,0.1)]"><Avatar user={user} size={rank === 1 ? "size-14" : "size-11"} /></div>
                    <div className="truncate text-[11px] font-semibold text-[#1d1d1f]">{user.fullName}</div>
                    <div className="mb-2 text-[10px] font-medium text-[#86868b]">{user.reputationPoints.toLocaleString()} pts</div>
                    <div className={`${height} ${color} flex justify-center rounded-t-2xl pt-2`}><span className="text-2xl font-semibold text-white">#{rank}</span></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOpen(false)} className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 12 }} onClick={(event) => event.stopPropagation()} className="relative max-h-[85vh] w-full max-w-md overflow-hidden rounded-[24px] bg-white shadow-2xl ring-1 ring-black/[0.06]">
                <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-5"><div><h2 className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">Leaderboard</h2><p className="text-xs text-[#86868b]">Xếp hạng đóng góp toàn hệ thống</p></div><button onClick={() => setIsOpen(false)} className="grid size-8 place-items-center rounded-full bg-black/[0.04] text-[#6e6e73] transition hover:bg-black/[0.08]"><X size={16} /></button></div>
                <div className="max-h-[65vh] space-y-2 overflow-y-auto p-5">
                  {contributors.map((user) => (
                    <div key={user.userId} className="flex items-center gap-3 rounded-2xl bg-[#f5f5f7] px-4 py-3">
                      <span className="w-7 text-sm font-semibold text-[#1d1d1f]">#{user.rank}</span><Avatar user={user} />
                      <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-[#1d1d1f]">{user.fullName}</div><div className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-[#0071e3]"><Gem size={10} /> {user.reputationPoints.toLocaleString()} pts · {user.approvedContents} nội dung duyệt</div></div>
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
