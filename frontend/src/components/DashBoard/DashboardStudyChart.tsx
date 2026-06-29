import React from "react";
import { TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  Tooltip,
  Cell,
} from "recharts";

const weekActivity = [
  { d: "T2", minutes: 45 },
  { d: "T3", minutes: 60 },
  { d: "T4", minutes: 30 },
  { d: "T5", minutes: 120 },
  { d: "T6", minutes: 75 },
  { d: "T7", minutes: 90 },
  { d: "CN", minutes: 110 },
];

export const DashboardStudyChart = React.memo(function DashboardStudyChart() {
  return (
    <div className="surface-card p-5 rounded-2xl shadow-sm border border-border flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 text-left">
        <div>
          <h3 className="font-display text-base font-bold text-foreground">Thống kê thời gian tự học</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">Đơn vị đo: Phút học tập tích lũy hàng ngày</p>
        </div>
        <div className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm font-extrabold bg-emerald-500/10 px-2.5 py-1 rounded-full">
          <TrendingUp size={14} aria-hidden="true" /> +24% tuần này
        </div>
      </div>
      
      <div className="flex-1 min-h-[320px] w-full" role="img" aria-label="Biểu đồ thống kê thời gian học tập trong tuần">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weekActivity} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <XAxis 
              dataKey="d" 
              axisLine={false} 
              tickLine={false} 
              fontSize={11} 
              stroke="var(--color-muted-foreground)" 
            />
            <Tooltip
              cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
              contentStyle={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--color-foreground)",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
              }}
              itemStyle={{ color: "var(--color-foreground)", fontWeight: 600 }}
            />
            <Bar dataKey="minutes" radius={[6, 6, 0, 0]} maxBarSize={48}>
              {weekActivity.map((_, i) => (
                <Cell 
                  key={i} 
                  fill="var(--color-primary)" 
                  fillOpacity={i === 5 ? 1 : 0.4} 
                  style={{ transition: "all 0.3s ease" }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
