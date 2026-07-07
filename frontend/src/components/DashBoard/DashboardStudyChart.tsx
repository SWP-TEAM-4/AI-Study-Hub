"use client";

import React, { useState } from "react";
import { TrendingUp, BarChart2 } from "lucide-react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { motion } from "framer-motion";

const weekActivity = [
  { d: "T2", minutes: 45 },
  { d: "T3", minutes: 60 },
  { d: "T4", minutes: 30 },
  { d: "T5", minutes: 120 },
  { d: "T6", minutes: 75 },
  { d: "T7", minutes: 90 },
  { d: "CN", minutes: 110 },
];

const today = new Date().getDay(); // 0=Sun,1=Mon,...
const todayIdx = today === 0 ? 6 : today - 1;

const totalMinutes = weekActivity.reduce((s, d) => s + d.minutes, 0);
const avgMinutes = Math.round(totalMinutes / weekActivity.length);

// Custom Premium Tooltip (Apple Style: Clean, crisp, light)
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const val = payload[0].value as number;
    return (
      <div className="rounded-xl border border-black/5 bg-white/90 px-4 py-3 text-xs shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl">
        <p className="font-semibold text-[#86868b] mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="font-bold text-[#1d1d1f] text-lg">{val} phút</p>
          <p className="text-[#86868b]">{Math.round(val / 60 * 10) / 10} giờ</p>
        </div>
      </div>
    );
  }
  return null;
};

export const DashboardStudyChart = React.memo(function DashboardStudyChart() {
  const [hovered, setHovered] = useState<number | null>(null);

  // Staggered animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, bounce: 0.3 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="relative flex h-full flex-col overflow-hidden rounded-[24px] bg-white p-6 sm:p-8 shadow-sm ring-1 ring-black/[0.04]"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="relative z-10 mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="grid size-10 place-items-center rounded-full bg-[var(--color-study)]/10" aria-hidden="true">
              <BarChart2 size={18} className="text-[var(--color-study)]" />
            </div>
            <h3 className="text-xl font-bold leading-tight tracking-tight text-[#1d1d1f]">
              Thời gian học
            </h3>
          </div>
          <p className="sm:ml-12 text-[13px] font-medium text-[#86868b]">
            Phút học tập tích lũy trong tuần
          </p>
        </div>

        <div className="flex shrink-0 flex-col sm:items-end gap-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-600">
            <TrendingUp size={14} aria-hidden="true" />
            +24% tuần này
          </div>
          <p className="text-[12px] font-medium text-[#86868b]">
            TB: {avgMinutes} phút/ngày
          </p>
        </div>
      </motion.div>

      {/* Summary strip */}
      <motion.div variants={itemVariants} className="relative z-10 mb-8 grid grid-cols-3 gap-4 rounded-[20px] bg-[#f5f5f7] p-4">
        {[
          { label: "Tổng tuần", value: `${totalMinutes} p` },
          { label: "Cao nhất", value: "120 p" },
          { label: "Trung bình", value: `${avgMinutes} p` },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-xl font-bold tabular-nums tracking-tight text-[#1d1d1f]">{s.value}</div>
            <div className="mt-1 text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </motion.div>

      {/* Chart */}
      <motion.div
        variants={itemVariants}
        className="relative z-10 min-h-[220px] w-full flex-1"
        role="img"
        aria-label={`Biểu đồ thời gian học tập tuần này. Trung bình ${avgMinutes} phút mỗi ngày.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={weekActivity}
            margin={{ top: 10, right: 0, left: -24, bottom: 0 }}
            onMouseLeave={() => setHovered(null)}
          >
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#000000" strokeOpacity={0.04} />
            <XAxis
              dataKey="d"
              axisLine={false}
              tickLine={false}
              fontSize={12}
              tick={{ fill: "#86868b", fontWeight: 600 }}
              dy={12}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              fontSize={11}
              tick={{ fill: "#86868b", fontWeight: 500 }}
              tickFormatter={(v) => `${v}m`}
              dx={-8}
            />
            <ReferenceLine
              y={avgMinutes}
              stroke="var(--color-study)"
              strokeDasharray="4 4"
              strokeOpacity={0.3}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "#000000", opacity: 0.03, radius: 8 }}
            />
            <Bar
              dataKey="minutes"
              radius={[8, 8, 8, 8]}
              maxBarSize={48}
              onMouseEnter={(_, index) => setHovered(index)}
              animationBegin={200}
              animationDuration={1200}
              animationEasing="ease-out"
            >
              {weekActivity.map((_, i) => (
                <Cell
                  key={i}
                  fill="var(--color-study)"
                  fillOpacity={i === todayIdx ? 1 : hovered === i ? 0.8 : 0.3}
                  style={{ transition: "all 0.3s ease" }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Legend */}
      <motion.div variants={itemVariants} className="relative z-10 mt-6 flex flex-wrap items-center justify-center gap-6 pt-2">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-[#86868b] uppercase tracking-wider">
          <div className="size-3 rounded-md bg-[var(--color-study)]" aria-hidden="true" />
          <span>Hôm nay</span>
        </div>
        <div className="flex items-center gap-2 text-[12px] font-semibold text-[#86868b] uppercase tracking-wider">
          <div className="size-3 rounded-md bg-[var(--color-study)] opacity-30" aria-hidden="true" />
          <span>Khác</span>
        </div>
        <div className="flex items-center gap-2 text-[12px] font-semibold text-[#86868b] uppercase tracking-wider">
          <div className="h-px w-6 border-t-2 border-dashed border-[var(--color-study)] opacity-40" aria-hidden="true" />
          <span>Trung bình</span>
        </div>
      </motion.div>
    </motion.div>
  );
});
