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

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const val = payload[0].value as number;
    return (
      <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-lg text-xs">
        <p className="font-bold text-foreground">{label}</p>
        <p className="text-primary font-extrabold mt-0.5">{val} phút</p>
        <p className="text-muted-foreground">{Math.round(val / 60 * 10) / 10} giờ</p>
      </div>
    );
  }
  return null;
};

export const DashboardStudyChart = React.memo(function DashboardStudyChart() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm p-5 flex flex-col h-full"
    >
      {/* Ambient */}
      <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />

      {/* Header */}
      <div className="relative z-10 flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center" aria-hidden="true">
              <BarChart2 size={15} className="text-primary" />
            </div>
            <h3 className="font-bold text-base text-foreground leading-tight">
              Thống kê thời gian học
            </h3>
          </div>
          <p className="text-[11px] text-muted-foreground ml-10">
            Phút học tập tích lũy trong tuần
          </p>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold bg-emerald-500/10 px-2.5 py-1 rounded-full">
            <TrendingUp size={12} aria-hidden="true" />
            +24% tuần này
          </div>
          <p className="text-[10px] text-muted-foreground">
            TB: {avgMinutes} phút/ngày
          </p>
        </div>
      </div>

      {/* Summary strip */}
      <div className="relative z-10 grid grid-cols-3 gap-3 mb-5 p-3 rounded-xl bg-muted/40 border border-border/50">
        {[
          { label: "Tổng tuần", value: `${totalMinutes} phút` },
          { label: "Ngày cao nhất", value: "120 phút" },
          { label: "Trung bình", value: `${avgMinutes} phút` },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-sm font-bold text-foreground tabular-nums">{s.value}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div
        className="relative z-10 flex-1 min-h-[200px] w-full"
        role="img"
        aria-label={`Biểu đồ thời gian học tập tuần này. Trung bình ${avgMinutes} phút mỗi ngày.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={weekActivity}
            margin={{ top: 8, right: 4, left: -24, bottom: 0 }}
            onMouseLeave={() => setHovered(null)}
          >
            <XAxis
              dataKey="d"
              axisLine={false}
              tickLine={false}
              fontSize={11}
              tick={{ fill: "var(--color-muted-foreground)", fontWeight: 600 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              fontSize={10}
              tick={{ fill: "var(--color-muted-foreground)" }}
              tickFormatter={(v) => `${v}m`}
            />
            <ReferenceLine
              y={avgMinutes}
              stroke="var(--color-primary)"
              strokeDasharray="4 3"
              strokeOpacity={0.35}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "var(--color-muted)", opacity: 0.3, radius: 6 }}
            />
            <Bar
              dataKey="minutes"
              radius={[6, 6, 0, 0]}
              maxBarSize={44}
              onMouseEnter={(_, index) => setHovered(index)}
            >
              {weekActivity.map((_, i) => (
                <Cell
                  key={i}
                  fill={i === todayIdx ? "var(--color-primary)" : i === hovered ? "var(--color-primary)" : "var(--color-primary)"}
                  fillOpacity={i === todayIdx ? 1 : hovered === i ? 0.75 : 0.35}
                  style={{ transition: "fill-opacity 0.15s ease" }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="relative z-10 flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <div className="size-2.5 rounded-sm bg-primary" aria-hidden="true" />
          <span>Hôm nay</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <div className="size-2.5 rounded-sm bg-primary opacity-35" aria-hidden="true" />
          <span>Các ngày khác</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground ml-auto">
          <div className="h-px w-6 border-t-2 border-dashed border-primary/50" aria-hidden="true" />
          <span>Trung bình</span>
        </div>
      </div>
    </motion.div>
  );
});
