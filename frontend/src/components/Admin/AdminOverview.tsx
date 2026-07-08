import { useTranslation } from "react-i18next";
import { AlertTriangle, Bot, FileText, RefreshCw, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useQuery } from "@tanstack/react-query";
<<<<<<< HEAD
import { analyticsService } from "../../services/analyticsService";
import { governanceService } from "../../services/governanceService";
import { userService } from "../../services/userService";
=======
<<<<<<< HEAD
import { analyticsService } from "../../services/analyticsService";
import { governanceService } from "../../services/governanceService";
import { userService } from "../../services/userService";
=======
import { analyticsService, AIUsageAnalyticsDTO } from "../../services/analyticsService";
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929

const numberFormatter = new Intl.NumberFormat("vi-VN");
const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 4,
});

function formatActionName(action: string) {
  return action
    .replace(/^AI_/, "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

export default function AdminOverview() {
  const { t } = useTranslation();

  const overviewQuery = useQuery({
    queryKey: ["adminOverview"],
    queryFn: async () => {
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
      const [users, activeUsers, reviewers, admins, contents, reports, pendingReports, aiUsage] = await Promise.all([
        userService.adminGetUsers({ page: 0, size: 1 }),
        userService.adminGetUsers({ page: 0, size: 1, isActive: true }),
        userService.adminGetUsers({ page: 0, size: 1, role: "REVIEWER" }),
        userService.adminGetUsers({ page: 0, size: 1, role: "ADMIN" }),
        analyticsService.adminGetContents(),
        governanceService.getAdminReports(0, 1),
        governanceService.getAdminReports(0, 1, "PENDING_ADMIN"),
        analyticsService.adminGetAiUsage(),
      ]);

      const contentItems = contents.data ?? [];
      const contentCounts = contentItems.reduce<Record<string, number>>((result, item) => {
        result[item.targetType] = (result[item.targetType] ?? 0) + 1;
        return result;
      }, {});

      return {
        totalUsers: users.data.totalElements,
        activeUsers: activeUsers.data.totalElements,
        reviewers: reviewers.data.totalElements,
        admins: admins.data.totalElements,
        totalContents: contentItems.length,
        contentCounts,
        totalReports: reports.data.totalElements,
        pendingReports: pendingReports.data.totalElements,
        aiUsage: aiUsage.data,
      };
<<<<<<< HEAD
=======
=======
      const res = await analyticsService.getAdminAIUsage();
      return res.data;
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
    },
    staleTime: 30_000,
  });

  if (overviewQuery.isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" aria-label={t("admin.overview.loading")}>
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="surface-card h-28 animate-pulse bg-muted/40" />
        ))}
      </div>
    );
  }

  if (overviewQuery.isError || !overviewQuery.data) {
    return (
      <div className="surface-card p-8 text-center">
        <AlertTriangle className="mx-auto mb-3 text-destructive" size={28} />
        <p className="font-semibold text-foreground">{t("admin.overview.loadError")}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {(overviewQuery.error as { message?: string } | null)?.message}
        </p>
        <button
          onClick={() => overviewQuery.refetch()}
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          <RefreshCw size={15} /> {t("admin.overview.retry")}
        </button>
      </div>
    );
  }

  const data = overviewQuery.data;
  const stats = [
    { label: t("admin.stats.users"), value: data.totalUsers, icon: Users, color: "165" },
    { label: t("admin.stats.contents"), value: data.totalContents, icon: FileText, color: "200" },
    { label: t("admin.stats.aiQuery"), value: data.aiUsage.totalRequests, icon: Bot, color: "35" },
    { label: t("admin.stats.reports"), value: data.pendingReports, icon: AlertTriangle, color: "0" },
  ];
  const actionData = Object.entries(data.aiUsage.actionCounts ?? {})
    .map(([name, value]) => ({ name: formatActionName(name), value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="surface-card p-5 text-left">
              <div
                className="size-10 rounded-xl grid place-items-center"
                style={{ background: `oklch(0.55 0.14 ${stat.color} / 0.12)`, color: `oklch(0.45 0.14 ${stat.color})` }}
              >
                <Icon size={18} />
              </div>
              <div className="mt-3 text-2xl font-bold font-display tracking-tight text-foreground">
                {numberFormatter.format(stat.value)}
              </div>
              <div className="text-sm text-muted-foreground mt-0.5">{stat.label}</div>
            </div>
          );
        })}
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DetailCard label={t("admin.overview.activeUsers")} value={`${numberFormatter.format(data.activeUsers)} / ${numberFormatter.format(data.totalUsers)}`} />
        <DetailCard label={t("admin.overview.reviewers")} value={numberFormatter.format(data.reviewers)} />
        <DetailCard label={t("admin.overview.admins")} value={numberFormatter.format(data.admins)} />
        <DetailCard label={t("admin.overview.totalReports")} value={numberFormatter.format(data.totalReports)} />
      </section>

<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
      <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="surface-card p-5">
          <div className="mb-4 text-left">
            <h2 className="font-display text-lg font-semibold text-foreground">{t("admin.overview.aiUsageByAction")}</h2>
            <p className="text-xs text-muted-foreground">{t("admin.overview.realTimeAggregate")}</p>
          </div>
          <div className="h-64">
            {actionData.length === 0 ? (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">{t("admin.overview.noData")}</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={actionData} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid vertical={false} stroke="var(--color-border)" strokeOpacity={0.5} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={11} stroke="var(--color-muted-foreground)" />
                  <YAxis axisLine={false} tickLine={false} fontSize={11} stroke="var(--color-muted-foreground)" allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="value" fill="oklch(0.55 0.14 165)" radius={[7, 7, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="surface-card p-5 text-left">
          <h2 className="font-display text-lg font-semibold text-foreground">{t("admin.overview.systemTotals")}</h2>
          <div className="mt-4 space-y-3 text-sm">
            <MetricRow label={t("admin.overview.tokens")} value={numberFormatter.format(data.aiUsage.totalTokens)} />
            <MetricRow label={t("admin.overview.estimatedCost")} value={currencyFormatter.format(data.aiUsage.estimatedCost ?? 0)} />
            <MetricRow label={t("admin.overview.documents")} value={numberFormatter.format(data.contentCounts.DOCUMENT ?? 0)} />
            <MetricRow label={t("admin.overview.quizzes")} value={numberFormatter.format(data.contentCounts.QUIZ ?? 0)} />
            <MetricRow label={t("admin.overview.flashcards")} value={numberFormatter.format(data.contentCounts.FLASHCARD_DECK ?? 0)} />
          </div>
<<<<<<< HEAD
=======
=======
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
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
>>>>>>> 3bc437942c7073fcb68ae9417c7e8e2754181929
        </div>
      </section>
    </div>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card px-5 py-4 text-left">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-bold text-foreground">{value}</div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-3 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-semibold text-foreground">{value}</span>
    </div>
  );
}
