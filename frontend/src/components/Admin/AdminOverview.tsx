import { useTranslation } from "react-i18next";
import { Users, FileText, Bot, AlertTriangle } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { analyticsService, AIUsageAnalyticsDTO } from "../../services/analyticsService";

const trend = [
  { d: "T2", v: 1240 }, { d: "T3", v: 1380 }, { d: "T4", v: 1520 },
  { d: "T5", v: 1410 }, { d: "T6", v: 1680 }, { d: "T7", v: 2010 }, { d: "CN", v: 1820 },
];

export default function AdminOverview() {
  const { t } = useTranslation();

  const { data: aiUsageData, isLoading } = useQuery({
    queryKey: ["adminAiUsage"],
    queryFn: async () => {
      const res = await analyticsService.getAdminAIUsage();
      return res.data;
    },
  });

  const stats = [
    { label: t("admin.stats.users"), value: "2,481", icon: Users, color: "165", trend: "+12%" },
    { label: t("admin.stats.documents"), value: "18,302", icon: FileText, color: "200", trend: "+8%" },
    { label: t("admin.stats.aiQuery"), value: "94,521", icon: Bot, color: "35", trend: "+24%" },
    { label: t("admin.stats.reports"), value: "12", icon: AlertTriangle, color: "0", trend: "+3" },
  ];

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="surface-card p-5 text-left">
              <div className="flex items-center justify-between">
                <div className="size-10 rounded-xl grid place-items-center" style={{ background: `oklch(0.55 0.14 ${s.color} / 0.12)`, color: `oklch(0.45 0.14 ${s.color})` }}>
                  <Icon size={18} />
                </div>
                <span className="text-xs font-medium text-success">{s.trend}</span>
              </div>
              <div className="mt-3 text-2xl font-bold font-display tracking-tight text-foreground">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          );
        })}
      </section>

      <section className="surface-card p-5">
        <div className="mb-4 text-left"><h2 className="font-display text-lg font-semibold text-foreground">{t("admin.overview.aiUsageWeek")}</h2></div>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="ai-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.55 0.14 165)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="oklch(0.55 0.14 165)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="d" axisLine={false} tickLine={false} fontSize={12} stroke="oklch(0.5 0.02 250)" />
              <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
              <Area type="monotone" dataKey="v" stroke="oklch(0.55 0.14 165)" strokeWidth={2.5} fill="url(#ai-grad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="surface-card p-5">
        <div className="mb-4 text-left"><h2 className="font-display text-lg font-semibold text-foreground">{t("admin.overview.aiUsageDetails")}</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">User ID</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3 text-right">Chat</th>
                <th className="px-4 py-3 text-right">Quiz</th>
                <th className="px-4 py-3 text-right">Flashcard</th>
                <th className="px-4 py-3 text-right">Tokens</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-3">
                      <div className="h-4 bg-muted animate-pulse rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : !aiUsageData ? (
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground text-xs">{t("admin.overview.noData")}</td></tr>
              ) : (
                <>
                  <tr className="hover:bg-muted/10">
                    <td className="px-4 py-3 font-semibold">Tất cả người dùng</td>
                    <td className="px-4 py-3 font-mono text-xs">Hệ thống</td>
                    <td className="px-4 py-3 text-right">{aiUsageData.actionCounts?.CHAT_NORMAL || 0} lượt</td>
                    <td className="px-4 py-3 text-right">{aiUsageData.actionCounts?.GENERATE_QUIZ || 0} lượt</td>
                    <td className="px-4 py-3 text-right">{aiUsageData.actionCounts?.GENERATE_FLASHCARD || 0} lượt</td>
                    <td className="px-4 py-3 text-right font-mono text-success font-bold">{aiUsageData.totalTokens?.toLocaleString() || 0}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
