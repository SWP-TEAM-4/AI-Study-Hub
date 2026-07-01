"use client";

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Award, BookOpen, GraduationCap, Radio, Satellite, Target, Users, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { userService } from "../../services/userService";
import { motion } from "framer-motion";

export function DashboardHero() {
  const { t } = useTranslation();
  const navigate = useNavigate();

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
    staleTime: 5 * 60 * 1000,
  });

  const profile = dashboardData?.profile;
  const userName = profile?.fullName?.split(" ")?.pop() || "bạn";
  const fullName = profile?.fullName || "";
  const avatarUrl = profile?.avatarUrl || null;
  const initials = fullName
    ? fullName.trim().split(" ").filter(Boolean).map((word: string) => word[0]).slice(-2).join("").toUpperCase()
    : "U";
  const stats = [
    { label: t("dashboard.hero.reputation", "Reputation"), value: profile?.reputationPoints ?? 0, icon: Award, tone: "from-amber-300/24 to-orange-500/10", text: "text-amber-200" },
    { label: t("dashboard.hero.testAttempts", "Test attempts"), value: dashboardData?.testCount ?? 0, icon: Target, tone: "from-cyan-300/22 to-blue-500/10", text: "text-cyan-200" },
    { label: t("dashboard.hero.aiRequests", "AI requests"), value: dashboardData?.aiUsage.totalRequests ?? 0, icon: Zap, tone: "from-violet-300/22 to-fuchsia-500/10", text: "text-violet-200" },
  ];
  const telemetry = [
    profile?.currentSemesterName || profile?.currentSemesterCode,
    profile?.comboName || profile?.comboCode,
    profile?.role,
  ].filter((item): item is string => Boolean(item));

  return (
    <section
      aria-label="Mission control dashboard"
      className="dashboard-command-card relative overflow-hidden rounded-[2rem] border border-white/12 bg-[#07101d]/78 shadow-[0_32px_120px_rgba(0,0,0,0.42)] backdrop-blur-2xl"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(255,197,122,0.20),transparent_32%),radial-gradient(circle_at_85%_18%,rgba(87,201,255,0.18),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.10),rgba(255,255,255,0.02)_42%,rgba(255,255,255,0.06))]" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-24 top-8 h-72 w-72 rounded-full border border-cyan-200/12 dashboard-orbit-drift" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-cyan-200/45 to-transparent" aria-hidden="true" />

      <div className="relative z-10 grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.15fr)_390px] lg:p-9 xl:p-10">
        <div className="flex min-w-0 flex-col justify-between gap-9">
          <div>
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200/20 bg-amber-200/8 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-amber-100 shadow-[0_0_32px_rgba(251,191,36,0.10)]"
            >
              <Radio size={13} className="text-amber-200" aria-hidden="true" />
              {profile?.currentSemesterCode || t("dashboard.hero.learningProfile", "Learning profile")}
            </motion.div>

            <h1 className="max-w-4xl text-balance text-4xl font-semibold leading-[0.98] tracking-tight text-white sm:text-5xl xl:text-7xl">
              {isLoading ? (
                <span className="block h-16 w-80 animate-pulse rounded-2xl bg-white/10" aria-label="Đang tải..." role="status" />
              ) : (
                <motion.span
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.05 }}
                >
                  {t("dashboard.hero.greeting", "Welcome aboard, {{name}}", { name: userName === "User" ? "bạn" : userName })}
                </motion.span>
              )}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.12 }}
              className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base"
            >
              {t("dashboard.hero.description", "Mission Control đã sẵn sàng. Chọn quiz để phóng nhiệm vụ, mở notebook để nghiên cứu, hoặc kết nối crew network để khám phá tri thức mới.")}
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.18 }}
            className="flex flex-wrap gap-3"
          >
            <button
              id="hero-start-quiz-btn"
              onClick={() => navigate("/quiz")}
              className="group inline-flex cursor-pointer items-center gap-2 rounded-full border border-amber-200/40 bg-amber-200 px-5 py-3 text-sm font-bold text-[#101722] shadow-[0_0_42px_rgba(251,191,36,0.22)] transition duration-300 hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
              aria-label="Làm Quiz ngay"
            >
              <GraduationCap size={17} aria-hidden="true" />
              {t("dashboard.hero.doQuiz", "Launch quiz")}
              <ArrowUpRight size={15} className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
            </button>

            <button
              id="hero-notebooks-btn"
              onClick={() => navigate("/notebooks")}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/12 bg-white/8 px-5 py-3 text-sm font-semibold text-white backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-cyan-200/35 hover:bg-cyan-200/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/60"
              aria-label="Xem sổ tay học tập"
            >
              <BookOpen size={17} aria-hidden="true" />
              {t("dashboard.hero.viewNotebooks", "Research logs")}
            </button>

            <button
              id="hero-community-btn"
              onClick={() => navigate("/community")}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/12 bg-white/8 px-5 py-3 text-sm font-semibold text-white backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-violet-200/35 hover:bg-violet-200/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200/60"
              aria-label="Xem cộng đồng học tập"
            >
              <Users size={17} aria-hidden="true" />
              {t("dashboard.hero.viewCommunity", "Crew network")}
            </button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="relative min-h-[360px] overflow-hidden rounded-[1.7rem] border border-white/12 bg-black/20 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(88,166,255,0.20),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]" aria-hidden="true" />
          <div className="dashboard-scanline absolute inset-0 opacity-30" aria-hidden="true" />

          <div className="relative z-10 flex h-full flex-col justify-between gap-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-100/70">Astronaut ID</div>
                <div className="mt-1 text-lg font-semibold text-white">{fullName || "MindSpace Explorer"}</div>
              </div>
              <Satellite size={22} className="text-cyan-100" aria-hidden="true" />
            </div>

            <div className="mx-auto grid size-40 place-items-center rounded-full border border-cyan-100/18 bg-cyan-100/8 shadow-[0_0_70px_rgba(56,189,248,0.18)] sm:size-48">
              <div className="grid size-28 place-items-center overflow-hidden rounded-[2rem] border border-white/16 bg-gradient-to-br from-cyan-100/18 to-violet-300/14 text-4xl font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] sm:size-32">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={"Ảnh đại diện của " + fullName} className="h-full w-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              {telemetry.length === 0 ? (
                <div className="rounded-2xl border border-white/8 bg-white/6 px-3 py-2 text-xs text-slate-400">
                  {t("dashboard.hero.noAcademicInfo", "Academic information has not been updated")}
                </div>
              ) : telemetry.map((item) => (
                <div key={item} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/6 px-3 py-2 text-xs text-slate-200">
                  <span>{item}</span>
                  <span className="size-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.8)]" />
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.22 }}
          className="lg:col-span-2 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-3"
          role="list"
          aria-label="Learning telemetry"
        >
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/7 p-4 backdrop-blur-xl" role="listitem">
                <div className={"mb-4 grid size-10 place-items-center rounded-2xl bg-gradient-to-br " + stat.tone} aria-hidden="true">
                  <Icon size={17} className={stat.text} />
                </div>
                <div className="text-2xl font-semibold tabular-nums text-white">{Number(stat.value).toLocaleString()}</div>
                <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{stat.label}</div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
