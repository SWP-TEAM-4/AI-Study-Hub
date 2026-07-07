"use client";

import React, { memo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { userService } from "../../services/userService";
import { SkeletonCard } from "../ui/SkeletonCard";

const containerVariants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.08,
      ease: "easeOut",
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-2xl border-2 border-[#8ad5b3]/40 bg-white p-3 shadow-lg select-none">
        <p className="text-[13px] font-extrabold text-[#0d1c2e] uppercase font-serif">
          {payload[0].payload.d}
        </p>
        <p className="mt-1 text-[15px] font-bold text-[#166534]">
          {payload[0].value} phút học bài
        </p>
      </div>
    );
  }
  return null;
}

export const NewDashboardStudyChart = memo(function NewDashboardStudyChart() {
  const [activeIdx, setActiveIdx] = React.useState<number | null>(null);

  const { data: apiWeekActivity, isLoading } = useQuery({
    queryKey: ["weekActivity"],
    queryFn: async () => {
      try {
        const response = await userService.getMyWeeklyActivity();
        return response.data || [];
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return <SkeletonCard />;
  }

  const mockWeekActivity = [
    { d: "T2", minutes: 45 },
    { d: "T3", minutes: 60 },
    { d: "T4", minutes: 30 },
    { d: "T5", minutes: 120 },
    { d: "T6", minutes: 75 },
    { d: "T7", minutes: 90 },
    { d: "CN", minutes: 110 },
  ];

  // Fallback to mock data if API is empty or loading
  const chartData = apiWeekActivity && apiWeekActivity.length > 0 ? apiWeekActivity : mockWeekActivity;

  const totalMinutes = chartData.reduce((acc, curr) => acc + curr.minutes, 0);
  const avgMinutes = Math.round(totalMinutes / chartData.length);
  const maxMinutes = Math.max(...chartData.map(d => d.minutes));

  // Find the index of the peak day to place the cart when not hovered
  const peakIdx = chartData.findIndex(d => d.minutes === maxMinutes);

  // Custom Dot renderer for Rollercoaster concept
  const RenderCustomDot = (props: any) => {
    const { cx, cy, payload, index } = props;
    const isPeak = index === peakIdx;
    
    // We render the cart at the currently hovered index, or fallback to the peak day
    const isCartHere = activeIdx !== null ? index === activeIdx : isPeak;
    
    return (
      <g key={`roller-node-${index}`} className="select-none pointer-events-none">
        {/* Idea 2: Realistic Rollercoaster Scaffold Support */}
        {/* Main vertical support pillar */}
        <line 
          x1={cx} 
          y1={cy} 
          x2={cx} 
          y2={220} 
          stroke="#b45309" 
          strokeWidth="3.5" 
          strokeLinecap="round" 
          strokeDasharray="4 4"
          opacity="0.3" 
        />
        {/* Horizontal cross brace */}
        <line 
          x1={cx - 12} 
          y1={cy + 30} 
          x2={cx + 12} 
          y2={cy + 30} 
          stroke="#b45309" 
          strokeWidth="2" 
          opacity="0.25" 
        />
        {/* X bracing below tracks */}
        <line 
          x1={cx - 10} 
          y1={cy + 15} 
          x2={cx + 10} 
          y2={cy + 45} 
          stroke="#b45309" 
          strokeWidth="1.5" 
          opacity="0.2" 
        />
        <line 
          x1={cx + 10} 
          y1={cy + 15} 
          x2={cx - 10} 
          y2={cy + 45} 
          stroke="#b45309" 
          strokeWidth="1.5" 
          opacity="0.2" 
        />

        {/* Idea 3: Start/Finish Theme Flags and stations */}
        {index === 0 ? (
          /* Start Flag */
          <g transform={`translate(${cx - 8}, ${cy - 28})`}>
            <rect x="0" y="0" width="3" height="28" fill="#475569" rx="1" />
            <path d="M 3 0 L 18 6 L 3 12 Z" fill="#10b981" />
          </g>
        ) : index === 6 ? (
          /* Checkered Finish Flag */
          <g transform={`translate(${cx - 2}, ${cy - 28})`}>
            <rect x="0" y="0" width="3" height="28" fill="#475569" rx="1" />
            <path d="M 3 0 H 17 V 10 H 3 Z" fill="#0f172a" />
            <path d="M 3 0 H 10 V 5 H 3 Z" fill="white" />
            <path d="M 10 5 H 17 V 10 H 10 Z" fill="white" />
          </g>
        ) : (
          /* Station Balloon Dot */
          <circle 
            cx={cx} 
            cy={cy} 
            r={6} 
            fill="#38bdf8" 
            stroke="#0284c7" 
            strokeWidth={2} 
          />
        )}

        {/* Idea 1 & 4: Rollercoaster Cart with Owl and Magic Sparkles */}
        {isPeak && (
          <g transform={`translate(${cx - 24}, ${cy - 29})`} className="select-none pointer-events-none">
            <g>
              {/* Sparkle Sparks trails */}
              <path 
                d="M -12 2 L -8 4 L -12 6 L -14 4 Z" 
                fill="#fbbf24" 
              />
              <path 
                d="M -8 18 L -4 20 L -8 22 L -10 20 Z" 
                fill="#fbbf24" 
              />
              <circle cx="-16" cy="12" r="3.5" fill="#f59e0b" />

              {/* Passenger Wise Owl sitting in the cabin stably */}
              <text x="12" y="2" fontSize="22">🦉</text>

              {/* Bubbly Rollercoaster Cart Body (Toy capsule design) */}
              <path 
                d="M 4 8 C 4 2, 8 0, 14 0 H 34 C 40 0, 44 2, 44 8 V 18 C 44 22, 40 24, 34 24 H 14 C 8 24, 4 22, 4 18 Z" 
                fill="#ffa07a" 
                stroke="#ea580c" 
                strokeWidth="2.5" 
              />
              {/* Windshield/Window */}
              <path 
                d="M 28 4 H 38 V 12 H 28 Z" 
                fill="#bae6fd" 
                stroke="#0284c7" 
                strokeWidth="1.5" 
                strokeLinejoin="round" 
              />
              {/* Decorative yellow stripe */}
              <rect x="8" y="14" width="28" height="4" rx="2" fill="#facc15" />
              
              {/* Wheels sitting exactly on the line */}
              <circle cx="14" cy="24" r="5" fill="#334155" stroke="white" strokeWidth="1.5" />
              <circle cx="14" cy="24" r="1.5" fill="white" />
              
              <circle cx="34" cy="24" r="5" fill="#334155" stroke="white" strokeWidth="1.5" />
              <circle cx="34" cy="24" r="1.5" fill="white" />
            </g>
          </g>
        )}
      </g>
    );
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="relative flex h-full flex-col overflow-hidden rounded-3xl bg-white border-2 border-[#8ad5b3]/40 p-8 shadow-[0_8px_0_rgba(138,213,179,0.15)] transition-all hover:scale-[1.01] select-none"
    >
      {/* Dynamic Rollercoaster Chart Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float-owl {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(4deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes cart-vibrate {
          0% { transform: translateY(0); }
          50% { transform: translateY(0.8px); }
          100% { transform: translateY(0); }
        }
        .animate-owl-bounce {
          animation: float-owl 1.2s infinite ease-in-out;
          display: inline-block;
          transform-origin: center bottom;
        }
        .animate-cart-ride {
          animation: cart-vibrate 0.12s infinite linear;
        }
      `}} />

      <motion.div variants={itemVariants} className="relative z-10 mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <h3 className="text-2xl font-extrabold leading-tight tracking-tight text-[#0d1c2e] font-serif">
              Thời Gian Học Tập
            </h3>
          </div>
          <p className="text-[15px] font-bold text-[#475569]">
            Thời gian học tập chăm chỉ trong tuần này
          </p>
        </div>

        <div className="flex shrink-0 flex-col sm:items-end gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#dcfce7] border border-[#8ad5b3]/30 px-4 py-2 text-[13px] font-extrabold text-[#166534] font-serif">
            +24% TIẾN BỘ!
          </div>
          <p className="text-[13px] font-bold text-[#475569]">
            TB: {avgMinutes} phút/ngày
          </p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="relative z-10 mb-10 grid grid-cols-3 gap-4 rounded-2xl bg-[#eff4ff] p-5">
        {[
          { label: "Cả Tuần", value: `${totalMinutes}p` },
          { label: "Chăm Nhất", value: `${maxMinutes}p` },
          { label: "Trung Bình", value: `${avgMinutes}p` },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-2xl font-extrabold tracking-tight text-[#0d1c2e] font-serif">{s.value}</div>
            <div className="mt-1 text-[12px] font-extrabold text-[#475569] uppercase tracking-wider font-serif">{s.label}</div>
          </div>
        ))}
      </motion.div>

      {/* Rollercoaster Area Chart */}
      <motion.div
        variants={itemVariants}
        className="relative z-10 min-h-[260px] w-full flex-1 overflow-visible"
        role="img"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 40, right: 10, left: -24, bottom: 0 }}
            onMouseMove={(state) => {
              if (state && state.activeTooltipIndex !== undefined && state.activeTooltipIndex !== null) {
                setActiveIdx(state.activeTooltipIndex);
              }
            }}
            onMouseLeave={() => {
              setActiveIdx(null);
            }}
          >
            <defs>
              <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#89cff0" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#89cff0" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#0d1c2e" strokeOpacity={0.06} />
            <XAxis
              dataKey="d"
              axisLine={false}
              tickLine={false}
              fontSize={13}
              tick={{ fill: "#475569", fontWeight: 700 }}
              dy={12}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              fontSize={13}
              tick={{ fill: "#475569", fontWeight: 700 }}
              tickFormatter={(v) => `${v}p`}
              dx={-12}
              domain={[0, 'dataMax + 40']}
            />
            <ReferenceLine
              y={avgMinutes}
              stroke="#ffa07a"
              strokeDasharray="4 4"
              strokeOpacity={0.8}
              strokeWidth={2}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: 'rgba(137,207,240,0.15)', strokeWidth: 2, fill: 'transparent' }}
            />
            {/* The main background area block and bottom track support */}
            <Area
              type="monotone"
              dataKey="minutes"
              stroke="#bae6fd"
              strokeWidth={8}
              fillOpacity={1}
              fill="url(#colorMinutes)"
              animationBegin={200}
              animationDuration={1000}
            />
            {/* The inner rail track line that carries the passenger Owl */}
            <Area
              type="monotone"
              dataKey="minutes"
              stroke="#0d6683"
              strokeWidth={3}
              fill="none"
              dot={<RenderCustomDot />}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

    </motion.div>
  );
});
