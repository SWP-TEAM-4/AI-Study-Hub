"use client";

import { memo, useState } from "react";
import { Award, BookOpen, Medal, MessageSquareText, RefreshCw, ShieldCheck, Star, Trophy, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useSubjects } from "../../hooks/useSubjects";
import { reputationService, type ReputationLeaderboardItemDTO, type ReputationLeaderboardKind } from "../../services/reputationService";
import { communityService } from "../../services/communityService";
import { userService } from "../../services/userService";
import { SkeletonCard } from "../ui/SkeletonCard";

const springConfig = { type: "spring" as const, stiffness: 360, damping: 30 };

type PublicBadge = {
  id: number;
  name: string;
  description?: string | null;
  iconUrl?: string | null;
  createdAt?: string | null;
};

function currentPeriodKey() {
  return new Date().toISOString().slice(0, 7);
}

function formatNumber(value?: number | null) {
  return Number(value ?? 0).toLocaleString("vi-VN");
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString("vi-VN") : "";
}

function contributionTypeLabel(type?: string | null) {
  if (type === "QUIZ") return "Quiz";
  if (type === "FLASHCARD_DECK") return "Flashcard";
  return "Tài liệu";
}

function initials(name?: string | null) {
  return (name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function Avatar({ user, size = "size-11" }: { user: ReputationLeaderboardItemDTO; size?: string }) {
  return user.avatarUrl ? (
    <img src={user.avatarUrl} alt={user.fullName || ""} className={`${size} rounded-full border border-white/80 object-cover shadow-sm`} />
  ) : (
    <div className={`${size} grid place-items-center rounded-full bg-primary/12 text-sm font-black text-primary ring-1 ring-primary/15`}>
      {initials(user.fullName)}
    </div>
  );
}

function BadgeChips({ badges, limit = 2 }: { badges?: PublicBadge[]; limit?: number }) {
  const visible = (badges ?? []).slice(0, limit);
  if (visible.length === 0) {
    return <span className="text-[11px] font-semibold text-muted-foreground">Chưa có huy hiệu</span>;
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      {visible.map((badge) => (
        <span key={badge.id} className="inline-flex max-w-[145px] items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700">
          {badge.iconUrl ? <img src={badge.iconUrl} alt="" className="size-3 rounded-full object-cover" /> : <Award size={11} />}
          <span className="truncate">{badge.name}</span>
        </span>
      ))}
      {(badges?.length ?? 0) > limit && (
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
          +{(badges?.length ?? 0) - limit}
        </span>
      )}
    </div>
  );
}

function LeaderRow({
  user,
  mode,
  onOpen,
}: {
  user: ReputationLeaderboardItemDTO;
  mode: ReputationLeaderboardKind;
  onOpen: () => void;
}) {
  const isTop = user.rank === 1;
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all ${
        isTop ? "border-amber-500/30 bg-amber-500/10" : "border-border/60 bg-card hover:bg-muted/30"
      }`}
    >
      <div className={`grid size-8 shrink-0 place-items-center rounded-lg text-sm font-black ${isTop ? "bg-amber-500 text-white" : "bg-muted text-foreground"}`}>
        #{user.rank}
      </div>
      <Avatar user={user} size={isTop ? "size-12" : "size-10"} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold text-foreground">{user.fullName || `User #${user.userId}`}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-muted-foreground">
          <span>{formatNumber(user.score)} {mode === "reviewers" ? "điểm reviewer" : "điểm đóng góp"}</span>
          <span className="size-1 rounded-full bg-border" />
          <span>{formatNumber(user.eventCount)} sự kiện</span>
        </div>
        <div className="mt-1.5">
          <BadgeChips badges={user.badges} />
        </div>
      </div>
    </button>
  );
}

export const NewDashboardLeaderboard = memo(function NewDashboardLeaderboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ReputationLeaderboardItemDTO | null>(null);
  const [mode, setMode] = useState<ReputationLeaderboardKind>("contributors");
  const [subjectId, setSubjectId] = useState("all");
  const [periodKey, setPeriodKey] = useState(currentPeriodKey());
  const { subjects, subjectMap, isLoading: subjectsLoading } = useSubjects();

  const leaderboardQuery = useQuery({
    queryKey: ["dashboardHonorBoard", mode, subjectId, periodKey],
    queryFn: async () => {
      const response = await reputationService.getReputationLeaderboard(mode, {
        page: 0,
        size: 10,
        subjectId: subjectId !== "all" ? Number(subjectId) : undefined,
        periodKey,
      });
      return response.data?.items ?? [];
    },
    staleTime: 60_000,
  });

  const myBadgesQuery = useQuery({
    queryKey: ["dashboardMyBadges"],
    queryFn: async () => (await userService.getMyBadges()).data ?? [],
    staleTime: 5 * 60 * 1000,
  });

  const selectedProfileQuery = useQuery({
    queryKey: ["dashboardCommunityProfile", selectedUser?.userId],
    queryFn: async () => (await communityService.getCommunityProfile(selectedUser!.userId)).data,
    enabled: !!selectedUser?.userId,
    staleTime: 2 * 60 * 1000,
  });

  const leaders = leaderboardQuery.data ?? [];
  const top3 = leaders.slice(0, 3);
  const selectedProfile = selectedProfileQuery.data;
  const selectedBadges = selectedProfile?.badges ?? selectedUser?.badges ?? [];
  const selectedSubject = subjectId !== "all" ? subjectMap[Number(subjectId)] : null;
  const scopeLabel = selectedSubject ? `${selectedSubject.code} · ${periodKey}` : `Tất cả môn · ${periodKey}`;

  if (subjectsLoading && leaderboardQuery.isLoading) {
    return <SkeletonCard />;
  }

  return (
    <>
      <div className="surface-card flex h-full min-h-[380px] flex-col overflow-hidden p-6">
        <div className="mb-4 flex flex-col gap-3 border-b border-border/50 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
                <Trophy size={19} className="text-amber-500" /> Bảng vinh danh
              </h3>
              <p className="mt-0.5 text-xs font-semibold text-muted-foreground">{scopeLabel}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              disabled={leaders.length === 0}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-bold text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              <Medal size={13} /> Tất cả
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="flex rounded-xl border border-border bg-muted p-1">
              <button
                type="button"
                onClick={() => setMode("contributors")}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition-all ${mode === "contributors" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                Contributor
              </button>
              <button
                type="button"
                onClick={() => setMode("reviewers")}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition-all ${mode === "reviewers" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                Reviewer
              </button>
            </div>
            <div className="grid grid-cols-[1fr_120px] gap-2">
              <select
                value={subjectId}
                onChange={(event) => setSubjectId(event.target.value)}
                className="h-10 min-w-0 rounded-xl border border-border bg-card px-3 text-xs font-semibold outline-none focus:border-primary"
              >
                <option value="all">Tất cả môn</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.code}</option>
                ))}
              </select>
              <input
                type="month"
                value={periodKey}
                onChange={(event) => setPeriodKey(event.target.value || currentPeriodKey())}
                className="h-10 rounded-xl border border-border bg-card px-3 text-xs font-semibold outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {leaderboardQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : leaderboardQuery.isError ? (
          <div className="grid flex-1 place-items-center text-center text-sm text-destructive">
            <button type="button" onClick={() => leaderboardQuery.refetch()} className="inline-flex items-center gap-2 font-bold">
              <RefreshCw size={14} /> Không thể tải bảng vinh danh
            </button>
          </div>
        ) : top3.length === 0 ? (
          <div className="grid flex-1 place-items-center text-center text-sm font-semibold text-muted-foreground">
            Chưa có dữ liệu vinh danh cho bộ lọc này.
          </div>
        ) : (
          <div className="space-y-3">
            {top3.map((user) => (
              <LeaderRow key={`${mode}-${user.userId}`} user={user} mode={mode} onOpen={() => setSelectedUser(user)} />
            ))}
          </div>
        )}

        <div className="mt-auto border-t border-border/50 pt-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Award size={16} className="text-primary" /> Huy hiệu của tôi
            </div>
            <span className="text-[11px] font-bold text-muted-foreground">{formatNumber(myBadgesQuery.data?.length ?? 0)}</span>
          </div>
          <BadgeChips badges={myBadgesQuery.data} limit={3} />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.96, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 12 }}
              transition={springConfig}
              onClick={(event) => event.stopPropagation()}
              className="relative max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border px-6 py-5">
                <div>
                  <h2 className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
                    {mode === "reviewers" ? <ShieldCheck size={19} className="text-primary" /> : <Trophy size={19} className="text-amber-500" />}
                    {mode === "reviewers" ? "Top reviewer" : "Top contributor"}
                  </h2>
                  <p className="mt-0.5 text-xs font-semibold text-muted-foreground">{scopeLabel}</p>
                </div>
                <button onClick={() => setIsOpen(false)} className="grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground hover:text-foreground">
                  <X size={16} />
                </button>
              </div>
              <div className="max-h-[65vh] space-y-2 overflow-y-auto p-5">
                {leaders.map((user) => (
                  <LeaderRow key={`modal-${mode}-${user.userId}`} user={user} mode={mode} onOpen={() => setSelectedUser(user)} />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedUser(null)}
            className="fixed inset-0 z-[60] grid place-items-center bg-black/45 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.96, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 12 }}
              onClick={(event) => event.stopPropagation()}
              className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar user={selectedUser} size="size-14" />
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-lg font-bold text-foreground">{selectedUser.fullName || `User #${selectedUser.userId}`}</h3>
                    <p className="text-xs font-semibold text-muted-foreground">
                      #{selectedUser.rank} · {formatNumber(selectedUser.score)} điểm · {formatNumber(selectedUser.eventCount)} sự kiện
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground hover:text-foreground">
                  <X size={16} />
                </button>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold">
                  <Star size={15} className="text-amber-500" /> Danh hiệu đã đạt
                </div>
                {(selectedBadges.length ?? 0) === 0 ? (
                  <p className="rounded-xl border border-border bg-muted/25 p-4 text-sm text-muted-foreground">Thành viên này chưa có huy hiệu công khai.</p>
                ) : (
                  <div className="grid gap-2">
                    {selectedBadges.map((badge) => (
                      <div key={badge.id} className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3">
                        <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-600">
                          {badge.iconUrl ? <img src={badge.iconUrl} alt="" className="size-6 rounded object-cover" /> : <Award size={17} />}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-foreground">{badge.name}</div>
                          <div className="line-clamp-2 text-xs text-muted-foreground">{badge.description || "Danh hiệu cộng đồng"}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedProfileQuery.isLoading && (
                <p className="mt-4 rounded-xl border border-border bg-muted/20 p-3 text-sm text-muted-foreground">Đang tải hồ sơ cộng đồng...</p>
              )}

              {selectedProfile?.topSubjects?.length ? (
                <div className="mt-5">
                  <div className="mb-2 flex items-center gap-2 text-sm font-bold">
                    <BookOpen size={15} className="text-primary" /> Top môn nổi bật
                  </div>
                  <div className="grid gap-2">
                    {selectedProfile.topSubjects.slice(0, 3).map((subject) => (
                      <div key={subject.subjectId} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/15 p-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-foreground">{subject.subjectCode || subject.subjectName || `Môn #${subject.subjectId}`}</div>
                          <div className="truncate text-xs text-muted-foreground">{subject.subjectName || "Đóng góp theo môn học"}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-primary">{formatNumber(subject.score)}</div>
                          <div className="text-[11px] font-semibold text-muted-foreground">{formatNumber(subject.eventCount)} sự kiện</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {selectedProfile?.contributions?.length ? (
                <div className="mt-5">
                  <div className="mb-2 flex items-center gap-2 text-sm font-bold">
                    <MessageSquareText size={15} className="text-emerald-600" /> Đóng góp gần đây
                  </div>
                  <div className="grid gap-2">
                    {selectedProfile.contributions.slice(0, 3).map((item) => (
                      <div key={`${item.targetType}-${item.targetId}`} className="rounded-xl border border-border bg-muted/15 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{contributionTypeLabel(item.targetType)}</span>
                          <span className="text-[11px] font-semibold text-muted-foreground">{formatDate(item.approvedAt)}</span>
                        </div>
                        <div className="mt-1 truncate text-sm font-bold text-foreground">{item.title}</div>
                        <div className="mt-1 flex flex-wrap gap-2 text-[11px] font-semibold text-muted-foreground">
                          <span>{formatNumber(item.downloadCount)} lượt clone/download</span>
                          <span>{formatNumber(item.communityReviewCount)} review</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});
