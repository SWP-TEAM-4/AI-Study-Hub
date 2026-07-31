"use client";

import React, { memo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Award, BarChart3, CheckCircle2, Target } from "lucide-react";
import { userService, type TestHistoryDTO } from "../../services/userService";
import { SkeletonCard } from "../ui/SkeletonCard";

type DayPoint = {
  d: string;
  dateKey: string;
  avgScore: number | null;
  completedCount: number;
};

const DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const PAGE_SIZE = 200;
const MAX_HISTORY_PAGES = 5;

const containerVariants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.08,
      ease: "easeOut" as const,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

function startOfMondayWeek(baseDate: Date) {
  const date = new Date(baseDate);
  const day = date.getDay();
  const distanceToMonday = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + distanceToMonday);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatScore(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function normalizeScore(value?: number | null) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.max(0, Math.min(10, numeric));
}

async function getRecentTestHistory() {
  const collected: TestHistoryDTO[] = [];
  const previousWeekStart = addDays(startOfMondayWeek(new Date()), -7);

  for (let page = 0; page < MAX_HISTORY_PAGES; page += 1) {
    const response = await userService.getMyTestHistory({ page, size: PAGE_SIZE, sort: "newest" });
    const items = response.data?.items ?? [];
    collected.push(...items);

    const reachedOldData = items.some((item) => {
      if (!item.createdAt) return false;
      return new Date(item.createdAt) < previousWeekStart;
    });

    if (items.length < PAGE_SIZE || reachedOldData) break;
  }

  return collected;
}

function buildWeekPoints(tests: TestHistoryDTO[], weekStart: Date) {
  const buckets = DAY_LABELS.map((label, index) => ({
    d: label,
    dateKey: toDateKey(addDays(weekStart, index)),
    scores: [] as number[],
  }));
  const weekEnd = addDays(weekStart, 7);

  tests.forEach((test) => {
    if (test.status !== "COMPLETED" || !test.createdAt) return;
    const score = normalizeScore(test.totalScore);
    if (score === null) return;

    const date = new Date(test.createdAt);
    if (date < weekStart || date >= weekEnd) return;

    const day = date.getDay();
    const targetIndex = day === 0 ? 6 : day - 1;
    buckets[targetIndex].scores.push(score);
  });

  return buckets.map<DayPoint>((bucket) => {
    const completedCount = bucket.scores.length;
    const avgScore = completedCount
      ? Number((bucket.scores.reduce((sum, score) => sum + score, 0) / completedCount).toFixed(2))
      : null;

    return {
      d: bucket.d,
      dateKey: bucket.dateKey,
      avgScore,
      completedCount,
    };
  });
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as DayPoint;

  return (
    <div className="select-none rounded-2xl border border-black/5 bg-background p-3 shadow-lg dark:border-white/5">
      <p className="text-[13px] font-extrabold uppercase text-foreground">{point.d} · {point.dateKey}</p>
      <p className="mt-1 text-[15px] font-bold text-emerald-600">
        {point.avgScore === null ? "-" : `${formatScore(point.avgScore)}/10`}
      </p>
      <p className="mt-1 text-xs font-semibold text-muted-foreground">
        {point.completedCount ? `${point.completedCount} bài đã hoàn thành` : "Không có quiz hoàn thành"}
      </p>
    </div>
  );
}

export const NewDashboardStudyChart = memo(function NewDashboardStudyChart() {
  const { data: testHistory = [], isLoading } = useQuery({
    queryKey: ["dashboard", "practice-results"],
    queryFn: getRecentTestHistory,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const summary = React.useMemo(() => {
    const thisWeekStart = startOfMondayWeek(new Date());
    const previousWeekStart = addDays(thisWeekStart, -7);
    const thisWeekPoints = buildWeekPoints(testHistory, thisWeekStart);
    const collectWeekScores = (weekStart: Date) => testHistory
      .filter((test) => {
        if (test.status !== "COMPLETED" || !test.createdAt) return false;
        const date = new Date(test.createdAt);
        return date >= weekStart && date < addDays(weekStart, 7);
      })
      .map((test) => normalizeScore(test.totalScore))
      .filter((score): score is number => score !== null);

    const completedScores = collectWeekScores(thisWeekStart);
    const previousWeekScores = collectWeekScores(previousWeekStart);
    const averageScores = (scores: number[]) => scores.length
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : null;

    const completedCount = completedScores.length;
    const highestScore = completedCount ? Math.max(...completedScores) : null;
    const thisWeekAverage = averageScores(completedScores);
    const previousWeekAverage = averageScores(previousWeekScores);
    const progressPercent =
      thisWeekAverage !== null && previousWeekAverage !== null && previousWeekAverage > 0
        ? Math.round(((thisWeekAverage - previousWeekAverage) / previousWeekAverage) * 100)
        : null;

    return {
      chartData: thisWeekPoints,
      completedCount,
      highestScore,
      average: thisWeekAverage,
      progressPercent,
    };
  }, [testHistory]);

  if (isLoading) {
    return <SkeletonCard />;
  }

  const hasScores = summary.chartData.some((point) => point.avgScore !== null);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="surface-card relative flex h-full flex-col overflow-hidden p-8 transition-all hover:scale-[1.01] select-none"
    >
      <motion.div variants={itemVariants} className="relative z-10 mb-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <BarChart3 size={22} />
            </div>
            <h3 className="text-2xl font-extrabold leading-tight tracking-tight text-foreground">
              Kết quả luyện tập
            </h3>
          </div>
          <p className="text-[15px] font-bold text-muted-foreground">
            Theo dõi điểm Quiz của bạn trong tuần này
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-extrabold ${
              summary.progressPercent === null
                ? "bg-muted text-muted-foreground"
                : summary.progressPercent >= 0
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
            }`}
          >
            {summary.progressPercent === null
              ? "Chưa đủ dữ liệu"
              : `${summary.progressPercent > 0 ? "+" : ""}${summary.progressPercent}% tiến bộ`}
          </div>
          <p className="text-[13px] font-bold text-muted-foreground">
            So với tuần trước
          </p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="relative z-10 mb-10 grid grid-cols-3 gap-4 rounded-2xl bg-black/5 p-5 dark:bg-white/5">
        {[
          { icon: CheckCircle2, label: "Số bài đã làm", value: summary.completedCount },
          { icon: Award, label: "Điểm cao nhất", value: summary.highestScore === null ? "-" : formatScore(summary.highestScore) },
          { icon: Target, label: "Điểm trung bình", value: summary.average === null ? "-" : formatScore(summary.average) },
        ].map((metric) => (
          <div key={metric.label} className="min-w-0 text-center">
            <div className="mx-auto mb-2 flex size-8 items-center justify-center rounded-xl bg-card/80 text-emerald-600 shadow-sm">
              <metric.icon size={16} />
            </div>
            <div className="truncate text-2xl font-extrabold tracking-tight text-foreground">{metric.value}</div>
            <div className="mt-1 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">{metric.label}</div>
          </div>
        ))}
      </motion.div>

      <motion.div variants={itemVariants} className="relative z-10 min-h-[260px] w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={summary.chartData}
            margin={{ top: 20, right: 12, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="currentColor" strokeOpacity={0.08} />
            <XAxis
              dataKey="d"
              axisLine={false}
              tickLine={false}
              fontSize={13}
              tick={{ fill: "currentColor", opacity: 0.55, fontWeight: 800 }}
              dy={12}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              fontSize={13}
              tick={{ fill: "currentColor", opacity: 0.55, fontWeight: 800 }}
              tickFormatter={(value) => `${value}`}
              ticks={[0, 2, 4, 6, 8, 10]}
              domain={[0, 10]}
              dx={-12}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "rgba(52,211,153,0.2)", strokeWidth: 2, fill: "transparent" }}
            />
            <Area
              type="monotone"
              dataKey="avgScore"
              name="Điểm trung bình"
              stroke="#10b981"
              strokeWidth={4}
              fill="url(#scoreGradient)"
              connectNulls={false}
              dot={{ r: 5, strokeWidth: 2, stroke: "#ffffff", fill: "#10b981" }}
              activeDot={{ r: 7, strokeWidth: 3, stroke: "#ffffff", fill: "#059669" }}
              animationBegin={150}
              animationDuration={900}
            />
          </AreaChart>
        </ResponsiveContainer>

        {!hasScores && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-2xl border border-dashed border-border bg-background/80 px-5 py-4 text-center shadow-sm backdrop-blur">
              <p className="text-sm font-extrabold text-foreground">Chưa có quiz hoàn thành trong tuần này</p>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">Hoàn thành quiz để biểu đồ bắt đầu ghi nhận điểm.</p>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
});
