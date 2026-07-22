"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Award, Star, Trophy, BookOpen, Users, Zap, Clock, TrendingUp, Lock, CheckCircle2, RefreshCw } from "lucide-react";
import { badgeService, type BadgeDTO } from "../services/badgeService";
import { userService } from "../services/userService";
import { reputationService } from "../services/reputationService";

type BadgeCategory = "all" | "contribution" | "quiz" | "community" | "streak" | "special";

interface BadgeWithStatus extends BadgeDTO {
  earned: boolean;
  earnedAt?: string;
  rarity?: "common" | "rare" | "epic" | "legendary";
}

const rarityColors = {
  common: { 
    bg: "from-slate-100 to-gray-100 dark:from-slate-800 dark:to-gray-800", 
    border: "border-slate-300 dark:border-slate-600", 
    text: "text-slate-600 dark:text-slate-300", 
    badgeBg: "bg-slate-100 dark:bg-slate-800"
  },
  rare: { 
    bg: "from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50", 
    border: "border-blue-400 dark:border-blue-600", 
    text: "text-blue-600 dark:text-blue-400", 
    badgeBg: "bg-blue-100 dark:bg-blue-900/50"
  },
  epic: { 
    bg: "from-purple-100 to-violet-100 dark:from-purple-900/50 dark:to-violet-900/50", 
    border: "border-purple-400 dark:border-purple-600", 
    text: "text-purple-600 dark:text-purple-400", 
    badgeBg: "bg-purple-100 dark:bg-purple-900/50"
  },
  legendary: { 
    bg: "from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50", 
    border: "border-amber-400 dark:border-amber-600", 
    text: "text-amber-600 dark:text-amber-400", 
    badgeBg: "bg-amber-100 dark:bg-amber-900/50"
  },
};

const rarityLabels = {
  common: "Phổ biến",
  rare: "Hiếm",
  epic: "Sử thi",
  legendary: "Huyền thoại",
};

const categories = [
  { id: "all" as BadgeCategory, label: "Tất cả", icon: Star },
  { id: "contribution" as BadgeCategory, label: "Đóng góp", icon: BookOpen },
  { id: "quiz" as BadgeCategory, label: "Quiz", icon: Zap },
  { id: "community" as BadgeCategory, label: "Cộng đồng", icon: Users },
  { id: "streak" as BadgeCategory, label: "Streak", icon: Clock },
  { id: "special" as BadgeCategory, label: "Đặc biệt", icon: Trophy },
];

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("vi-VN", { day: "numeric", month: "short", year: "numeric" });
}

function BadgeCard({ badge }: { badge: BadgeWithStatus }) {
  const colors = badge.rarity ? rarityColors[badge.rarity] : rarityColors.common;
  
  const getBadgeIcon = () => {
    const name = badge.name?.toLowerCase() ?? "";
    if (name.includes("quiz")) return Zap;
    if (name.includes("contributor") || name.includes("đóng góp")) return TrendingUp;
    if (name.includes("reviewer") || name.includes("duyệt")) return Star;
    if (name.includes("streak") || name.includes("chuỗi") || name.includes("ngày")) return Clock;
    if (name.includes("community") || name.includes("cộng đồng")) return Users;
    if (name.includes("legendary")) return Trophy;
    return Award;
  };
  
  const Icon = getBadgeIcon();

  return (
    <div
      className={`relative rounded-2xl p-5 transition-all duration-200 ${
        badge.earned
          ? `bg-gradient-to-br ${colors.bg} border-2 ${colors.border}`
          : "bg-gradient-to-br from-muted/30 to-muted/20 border border-dashed border-muted-foreground/20"
      }`}
    >
      {/* Lock overlay for unearned badges */}
      {!badge.earned && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-muted/40">
          <div className="rounded-full bg-background/80 p-3">
            <Lock size={20} className="text-muted-foreground" />
          </div>
        </div>
      )}

      {/* Earned checkmark */}
      {badge.earned && (
        <div className="absolute -top-2 -right-2 rounded-full bg-emerald-500 p-1">
          <CheckCircle2 size={16} className="text-white" />
        </div>
      )}

      {/* Badge Icon */}
      <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl overflow-hidden ${
        badge.earned
          ? `bg-gradient-to-br ${colors.bg} ${colors.border} border-2`
          : "bg-muted"
      }`}>
        {badge.iconUrl && badge.earned ? (
          <img 
            src={badge.iconUrl} 
            alt={badge.name} 
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <Icon
          size={36}
          strokeWidth={2}
          className={`${badge.earned ? colors.text : "text-muted-foreground"} ${badge.iconUrl && badge.earned ? 'hidden' : ''}`}
        />
      </div>

      {/* Badge Info */}
      <div className="text-center">
        <h3 className={`mb-1 font-bold ${badge.earned ? colors.text : "text-muted-foreground"}`}>
          {badge.name}
        </h3>
        <p className="mb-2 text-xs text-muted-foreground min-h-[32px]">
          {badge.description || "Hoàn thành thử thách để nhận huy hiệu này"}
        </p>

        {/* Rarity */}
        <span className={`inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
          badge.earned && badge.rarity
            ? `${colors.badgeBg} ${colors.border} border`
            : "bg-muted text-muted-foreground"
        }`}>
          {badge.earned && badge.rarity ? rarityLabels[badge.rarity] : "Chưa đạt được"}
        </span>

        {/* Earned date */}
        {badge.earned && badge.earnedAt && (
          <p className="mt-2 text-[10px] text-muted-foreground">
            Đạt ngày {formatDate(badge.earnedAt)}
          </p>
        )}
      </div>
    </div>
  );
}

function StatsCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-card p-4 border border-border/50">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-black text-foreground">{value}</p>
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default function BadgesPage() {
  const [activeCategory, setActiveCategory] = useState<BadgeCategory>("all");
  const [showEarned, setShowEarned] = useState<"all" | "earned" | "unearned">("all");

  // Fetch ALL available badges from backend
  const { data: allBadgesResponse, isLoading: badgesLoading, error: badgesError, refetch: refetchBadges } = useQuery({
    queryKey: ["all-badges"],
    queryFn: async () => {
      const res = await badgeService.getBadges();
      return res.data ?? [];
    },
  });

  // Fetch user's earned badges from backend
  const { data: myBadgesResponse } = useQuery({
    queryKey: ["my-badges"],
    queryFn: async () => {
      const res = await userService.getMyBadges();
      return res.data ?? [];
    },
  });

  // Fetch reputation stats
  const { data: reputationStats } = useQuery({
    queryKey: ["my-reputation-stats"],
    queryFn: async () => {
      const [contributors, reviewers] = await Promise.all([
        reputationService.getReputationLeaderboard("contributors", { page: 0, size: 1 }).catch(() => ({ data: { items: [], totalScore: 0, totalEvents: 0 } })),
        reputationService.getReputationLeaderboard("reviewers", { page: 0, size: 1 }).catch(() => ({ data: { items: [], totalScore: 0, totalEvents: 0 } })),
      ]);
      return {
        contributorPoints: contributors.data?.totalScore ?? 0,
        reviewerPoints: reviewers.data?.totalScore ?? 0,
        totalEvents: (contributors.data?.totalEvents ?? 0) + (reviewers.data?.totalEvents ?? 0),
      };
    },
  });

  // Combine badges with earned status
  const allBadges: BadgeWithStatus[] = useMemo(() => {
    const earnedIds = new Set(myBadgesResponse?.map((b) => b.id) ?? []);
    const earnedMap = new Map(myBadgesResponse?.map((b) => [b.id, b]) ?? []);
    
    return (allBadgesResponse ?? []).map((badge) => {
      const earned = earnedIds.has(badge.id);
      const earnedBadge = earnedMap.get(badge.id);
      return {
        ...badge,
        earned,
        earnedAt: earnedBadge?.createdAt,
      };
    });
  }, [allBadgesResponse, myBadgesResponse]);

  const earnedCount = allBadges.filter((b) => b.earned).length;

  // Filter badges
  const filteredBadges = useMemo(() => {
    return allBadges.filter((badge) => {
      const categoryMatch = activeCategory === "all";
      const earnedMatch =
        showEarned === "all" ||
        (showEarned === "earned" && badge.earned) ||
        (showEarned === "unearned" && !badge.earned);
      return categoryMatch && earnedMatch;
    });
  }, [allBadges, activeCategory, showEarned]);

  return (
    <div className="mx-auto max-w-6xl pb-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
            <Award size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground">Huy Hiệu Của Tôi</h1>
            <p className="text-sm text-muted-foreground">Kiểm tra thành tựu và danh hiệu đã đạt được</p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard icon={Award} label="Huy hiệu đã đạt" value={earnedCount} color="from-amber-500 to-orange-500" />
        <StatsCard icon={TrendingUp} label="Điểm Contributor" value={(reputationStats?.contributorPoints ?? 0).toLocaleString()} color="from-emerald-500 to-teal-500" />
        <StatsCard icon={Star} label="Điểm Reviewer" value={(reputationStats?.reviewerPoints ?? 0).toLocaleString()} color="from-violet-500 to-purple-500" />
        <StatsCard icon={Zap} label="Tổng sự kiện" value={(reputationStats?.totalEvents ?? 0).toLocaleString()} color="from-blue-500 to-cyan-500" />
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                  activeCategory === cat.id
                    ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white"
                    : "bg-card text-muted-foreground hover:bg-muted border border-border/50"
                }`}
              >
                <Icon size={16} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Earned Filter */}
        <div className="flex gap-2">
          {[
            { id: "all" as const, label: "Tất cả" },
            { id: "earned" as const, label: "Đã đạt" },
            { id: "unearned" as const, label: "Chưa đạt" },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setShowEarned(filter.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                showEarned === filter.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Badges Grid */}
      {badgesLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : badgesError ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-destructive/10 py-16 text-center">
          <Award size={48} className="mb-4 text-destructive/50" />
          <p className="font-bold text-destructive">Không thể tải huy hiệu</p>
          <p className="text-sm text-muted-foreground mb-4">Đã xảy ra lỗi khi lấy dữ liệu từ server</p>
          <button
            onClick={() => refetchBadges()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"
          >
            <RefreshCw size={16} /> Thử lại
          </button>
        </div>
      ) : filteredBadges.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-muted/30 py-16 text-center">
          <Award size={48} className="mb-4 text-muted-foreground/50" />
          <p className="font-bold text-muted-foreground">Không có huy hiệu nào</p>
          <p className="text-sm text-muted-foreground/70">Thử thay đổi bộ lọc để xem thêm</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filteredBadges.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </div>
      )}

      {/* Progress Summary */}
      {allBadges.length > 0 && (
        <div className="mt-8 rounded-2xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 p-6 border border-violet-200/30 dark:border-violet-800/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
                <Trophy size={20} className="text-amber-500" />
                Tiến độ sưu tập
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Bạn đã đạt được <span className="font-bold text-foreground">{earnedCount}</span> trong <span className="font-bold text-foreground">{allBadges.length}</span> huy hiệu
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-violet-600 dark:text-violet-400">
                {Math.round((earnedCount / allBadges.length) * 100)}%
              </span>
            </div>
          </div>
          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              style={{ width: `${(earnedCount / allBadges.length) * 100}%` }}
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
