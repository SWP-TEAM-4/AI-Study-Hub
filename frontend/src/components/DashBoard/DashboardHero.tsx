"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Flame, GraduationCap, Users, BookOpen, Zap, Target, ArrowUpRight, TrendingUp, Bot } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { userService } from "../../services/userService";
import { motion } from "framer-motion";

export function DashboardHero() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const springConfig: any = { type: "spring", damping: 20, stiffness: 100 };

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ["dashboardHero"],
    queryFn: async () => {
      const [profile, aiUsage, tests] = await Promise.all([
        userService.getMyProfile(),
        userService.getMyAIUsage(),
        userService.getMyTestHistory({ page: 0, size: 1, sort: "newest" }),
      ]);
      return { profile: profile.data, aiUsage: aiUsage.data, testCount: tests.data.totalElements };
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const profile = dashboardData?.profile;
  const userName = error ? "bạn" : (profile?.fullName?.split(" ")?.pop() || "bạn");
  const fullName = error ? "" : (profile?.fullName || "");
  const avatarUrl = error ? null : (profile?.avatarUrl || null);
  const initials = fullName
    ? fullName.trim().split(" ").filter(Boolean).map((w: string) => w[0]).slice(-2).join("").toUpperCase()
    : "U";

  const stats = [
    { label: "Điểm uy tín", value: profile?.reputationPoints ?? 0, icon: Flame, color: "text-orange-500", bg: "bg-orange-500/10 dark:bg-orange-500/15", border: "border-orange-500/20" },
    { label: "Lượt làm bài", value: dashboardData?.testCount ?? 0, icon: Target, color: "text-blue-500", bg: "bg-blue-500/10 dark:bg-blue-500/15", border: "border-blue-500/20" },
    { label: "Tương tác AI", value: dashboardData?.aiUsage?.totalRequests ?? 0, icon: Bot, color: "text-violet-500", bg: "bg-violet-500/10 dark:bg-violet-500/15", border: "border-violet-500/20" },
  ];

  return (
    <section
      aria-label="Trang chủ học tập"
      className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/5 shadow-sm"
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-28 -right-28 h-72 w-72 rounded-full bg-primary/15 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" aria-hidden="true" />

      <div className="relative z-10 p-6 lg:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Streak badge */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-600 dark:text-orange-400 select-none"
            >
              <Flame size={13} aria-hidden="true" className="shrink-0" />
              <span>{t("dashboard.hero.streak") || "Hành trình học tập"}</span>
              <TrendingUp size={11} aria-hidden="true" className="shrink-0 opacity-70" />
            </motion.div>

            {/* Greeting h1 */}
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground leading-tight">
              {isLoading ? (
                <div className="h-10 w-72 animate-pulse rounded-xl bg-muted" aria-label="Đang tải..." role="status" />
              ) : (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: 0.05 }}
                >
                  {t("dashboard.hero.greeting", { name: userName === "User" ? "bạn" : userName })}
                </motion.span>
              )}
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25, delay: 0.1 }}
              className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground"
            >
              {t("dashboard.hero.description") || "Tiếp tục hành trình học tập của bạn hôm nay. Mỗi ngày là cơ hội mới để phát triển bản thân!"}
            </motion.p>

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.15 }}
              className="mt-6 flex flex-wrap gap-3"
            >
              <button
                id="hero-start-quiz-btn"
                onClick={() => navigate("/quiz")}
                className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md shadow-primary/20 transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97]"
                aria-label="Làm bài Quiz ôn tập ngay"
              >
                <GraduationCap size={16} aria-hidden="true" />
                {t("dashboard.hero.doQuiz") || "Làm Quiz ngay"}
                <ArrowUpRight size={14} aria-hidden="true" className="opacity-70" />
              </button>

              <button
                id="hero-community-btn"
                onClick={() => navigate("/community")}
                className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-all duration-200 hover:bg-muted hover:border-primary/30 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97]"
                aria-label="Xem cộng đồng học tập"
              >
                <Users size={16} aria-hidden="true" />
                {t("dashboard.hero.viewCommunity") || "Cộng đồng"}
              </button>

              <button
                id="hero-notebooks-btn"
                onClick={() => navigate("/notebooks")}
                className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-all duration-200 hover:bg-muted hover:border-primary/30 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97]"
                aria-label="Xem sổ tay học tập"
              >
                <BookOpen size={16} aria-hidden="true" />
                {t("dashboard.hero.viewNotebooks") || "Sổ tay"}
              </button>
            </motion.div>
          </div>

          {/* Avatar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1, type: "spring", stiffness: 240 }}
            className="hidden sm:flex shrink-0"
            aria-hidden="true"
          >
            <div className="relative">
              <div className="size-20 lg:size-24 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center text-xl lg:text-2xl font-bold text-primary shadow-lg shadow-primary/10 overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={`Ảnh đại diện của ${fullName}`} className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <span
                className="absolute -bottom-1 -right-1 size-4 rounded-full bg-green-500 border-2 border-card shadow"
                aria-label="Đang hoạt động"
                role="status"
              />
            </div>
          </motion.div>
        </div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.2 }}
          className="mt-7 grid grid-cols-3 gap-3 border-t border-border/50 pt-5"
          role="list"
          aria-label="Thống kê học tập"
        >
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="flex items-center gap-2.5" role="listitem">
                <div className={`shrink-0 size-9 rounded-xl ${stat.bg} border ${stat.border} flex items-center justify-center`} aria-hidden="true">
                  <Icon size={16} className={stat.color} />
                </div>
                <div className="min-w-0">
                  <div className="text-base font-bold text-foreground tabular-nums leading-none">{(stat.value).toLocaleString()}</div>
                  <div className="text-[10px] text-muted-foreground leading-tight truncate mt-0.5">{stat.label}</div>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}