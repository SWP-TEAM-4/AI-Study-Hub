"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
<<<<<<< HEAD
import { ArrowRight, BookOpen, GraduationCap, Users } from "lucide-react";
=======
import { Flame, GraduationCap, Users, BookOpen, Zap, Target, ArrowUpRight, TrendingUp } from "lucide-react";
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
import { useQuery } from "@tanstack/react-query";
import { userService } from "../../services/userService";
import { motion } from "framer-motion";

<<<<<<< HEAD
=======
const stats = [
  { label: "Ngày học liên tiếp", value: "7", icon: Flame, color: "text-orange-500", bg: "bg-orange-500/10 dark:bg-orange-500/15", border: "border-orange-500/20" },
  { label: "Bài hoàn thành", value: "24", icon: Target, color: "text-blue-500", bg: "bg-blue-500/10 dark:bg-blue-500/15", border: "border-blue-500/20" },
  { label: "XP tuần này", value: "1,240", icon: Zap, color: "text-violet-500", bg: "bg-violet-500/10 dark:bg-violet-500/15", border: "border-violet-500/20" },
];

>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
export function DashboardHero() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const springConfig: any = { type: "spring", damping: 20, stiffness: 100 };

<<<<<<< HEAD
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["dashboardHero"],
    queryFn: async () => {
      const [profile, aiUsage, tests] = await Promise.all([
        userService.getMyProfile(),
        userService.getMyAIUsage(),
        userService.getMyTestHistory({ page: 0, size: 1, sort: "newest" }),
      ]);
      return { profile: profile.data, aiUsage: aiUsage.data, testCount: tests.data.totalElements };
    },
=======
  const { data: profileRes, isLoading, error } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => userService.getMyProfile(),
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

<<<<<<< HEAD
  const profile = dashboardData?.profile;
  const userName = profile?.fullName?.split(" ")?.pop() || "bạn";
  const fullName = profile?.fullName || "";
  const avatarUrl = profile?.avatarUrl || null;
  const initials = fullName
    ? fullName
        .trim()
        .split(" ")
        .filter(Boolean)
        .map((word: string) => word[0])
        .slice(-2)
        .join("")
        .toUpperCase()
=======
  const userName = error ? "bạn" : (profileRes?.data?.fullName?.split(" ")?.pop() || "bạn");
  const fullName = error ? "" : (profileRes?.data?.fullName || "");
  const avatarUrl = error ? null : (profileRes?.data?.avatarUrl || null);
  const initials = fullName
    ? fullName.trim().split(" ").filter(Boolean).map((w: string) => w[0]).slice(-2).join("").toUpperCase()
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
    : "U";

  const stats = [
    { label: "Điểm uy tín", value: profile?.reputationPoints ?? 0, color: "bg-yellow-50 text-yellow-600" },
    { label: "Lượt làm bài", value: dashboardData?.testCount ?? 0, color: "bg-blue-50 text-blue-600" },
    { label: "Tương tác AI", value: dashboardData?.aiUsage.totalRequests ?? 0, color: "bg-purple-50 text-purple-600" },
  ];

  const telemetry = [
    profile?.currentSemesterName || profile?.currentSemesterCode,
    profile?.comboName || profile?.comboCode,
    profile?.role,
  ].filter((item): item is string => Boolean(item));

  return (
<<<<<<< HEAD
    <section className="bg-white rounded-3xl border border-gray-200 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
        {/* Left Content */}
        <div className="lg:col-span-2 p-12 flex flex-col justify-between">
          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-sm font-semibold text-gray-500 mb-6">
              {profile?.currentSemesterCode || "Learning Journey"}
            </p>
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              {isLoading ? (
                <span className="inline-block w-96 h-16 bg-gray-200 rounded-xl animate-pulse" />
              ) : (
                <>
                  Chào mừng trở lại
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    {userName === "User" ? "bạn" : userName}
                  </span>
                </>
=======
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
              <span>{t("dashboard.hero.streak") || "Chuỗi học 7 ngày liên tiếp"}</span>
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
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
              )}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
              Tiếp tục hành trình học tập của bạn. Luyện tập với quiz hoặc mở sổ tay để ôn tập.
            </p>
          </motion.div>

<<<<<<< HEAD
          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-wrap gap-3 mt-8"
          >
            <button
              onClick={() => navigate("/quiz")}
              className="px-8 py-3 bg-gray-900 text-white rounded-full font-semibold hover:bg-black transition-colors flex items-center gap-2"
            >
              <GraduationCap size={18} />
              Luyện tập
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate("/notebooks")}
              className="px-8 py-3 bg-gray-100 text-gray-900 rounded-full font-semibold hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <BookOpen size={18} />
              Sổ tay
            </button>
            <button
              onClick={() => navigate("/community")}
              className="px-8 py-3 bg-gray-100 text-gray-900 rounded-full font-semibold hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <Users size={18} />
              Cộng đồng
            </button>
          </motion.div>
        </div>

        {/* Right Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gradient-to-br from-gray-50 to-gray-100 p-12 flex flex-col justify-between border-l border-gray-200 lg:border-l-0"
        >
          {/* Header */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Hồ sơ</p>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">{fullName || "MindSpace"}</h2>

            {/* Avatar */}
            <div className="w-32 h-32 rounded-2xl bg-white shadow-lg flex items-center justify-center mb-8 mx-auto lg:mx-0">
              <div className="w-28 h-28 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white text-4xl font-bold flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
=======
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
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
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
<<<<<<< HEAD
          </div>

          {/* Info Badges */}
          <div className="space-y-2">
            {telemetry.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-2">Chưa cập nhật thông tin</p>
            ) : (
              telemetry.map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between bg-white rounded-lg px-3 py-2 text-xs font-semibold text-gray-900 shadow-sm"
                >
                  <span>{item}</span>
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="border-t border-gray-200 grid grid-cols-3 divide-x divide-gray-200">
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="p-8 text-center"
          >
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {Number(stat.value).toLocaleString()}
            </div>
            <div className="text-sm font-medium text-gray-600">{stat.label}</div>
          </motion.div>
        ))}
=======
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
                  <div className="text-base font-bold text-foreground tabular-nums leading-none">{stat.value}</div>
                  <div className="text-[10px] text-muted-foreground leading-tight truncate mt-0.5">{stat.label}</div>
                </div>
              </div>
            );
          })}
        </motion.div>
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
      </div>
    </section>
  );
}