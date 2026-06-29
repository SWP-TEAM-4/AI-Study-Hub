import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Shield, Users, FileText, Bot, AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from "recharts";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Stitch" },
      { name: "description", content: "Bảng điều khiển admin: người dùng, nội dung, AI usage, báo cáo." },
    ],
  }),
  component: AdminPage,
});

const stats = [
  { label: "Người dùng", value: "2,481", icon: Users, color: "165", trend: "+12%" },
  { label: "Tài liệu", value: "18,302", icon: FileText, color: "200", trend: "+8%" },
  { label: "Lượt hỏi AI", value: "94,521", icon: Bot, color: "35", trend: "+24%" },
  { label: "Báo cáo mới", value: "12", icon: AlertTriangle, color: "0", trend: "+3" },
];

const trend = [
  { d: "T2", v: 1240 },
  { d: "T3", v: 1380 },
  { d: "T4", v: 1520 },
  { d: "T5", v: 1410 },
  { d: "T6", v: 1680 },
  { d: "T7", v: 2010 },
  { d: "CN", v: 1820 },
];

const queue = [
  { id: "p1", kind: "Tài liệu", title: "SWP391 — Đề thi giữa kỳ", author: "Minh Anh", status: "pending" },
  { id: "p2", kind: "Quiz", title: "Bộ 50 câu Testing", author: "Quang Hà", status: "pending" },
  { id: "p3", kind: "Flashcards", title: "OOP Concepts Deck", author: "Tuấn Kiệt", status: "approved" },
  { id: "p4", kind: "Tài liệu", title: "Java Web Lab 4", author: "Hà Linh", status: "rejected" },
];

const statusStyles: Record<string, { Icon: typeof CheckCircle2; text: string; cls: string }> = {
  pending: { Icon: Clock, text: "Chờ duyệt", cls: "bg-amber-500/12 text-amber-300 border border-amber-500/25" },
  approved: { Icon: CheckCircle2, text: "Đã duyệt", cls: "bg-emerald-500/12 text-emerald-300 border border-emerald-500/25" },
  rejected: { Icon: XCircle, text: "Từ chối", cls: "bg-rose-500/12 text-rose-300 border border-rose-500/25" },
};

function AdminPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="text-primary" />
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="surface-card p-5"
            >
              <div className="flex items-center justify-between">
                <div
                  className="size-10 rounded-xl grid place-items-center"
                  style={{ background: `oklch(0.55 0.14 ${s.color} / 0.12)`, color: `oklch(0.45 0.14 ${s.color})` }}
                >
                  <Icon size={18} />
                </div>
                <span className="text-xs font-medium text-success">{s.trend}</span>
              </div>
              <div className="mt-3 text-2xl font-bold font-display">{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </motion.div>
          );
        })}
      </section>

      <section className="surface-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-lg font-semibold">Lượt sử dụng AI tuần này</h2>
            <p className="text-xs text-muted-foreground">Tổng số request gọi tới AI Gateway</p>
          </div>
        </div>
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
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Area type="monotone" dataKey="v" stroke="oklch(0.55 0.14 165)" strokeWidth={2.5} fill="url(#ai-grad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="p-5 flex items-center justify-between border-b border-border">
          <h2 className="font-display text-lg font-semibold">Hàng chờ duyệt</h2>
          <button className="text-sm text-primary font-medium">Xem tất cả →</button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="text-left px-5 py-3">Nội dung</th>
              <th className="text-left px-5 py-3 hidden md:table-cell">Loại</th>
              <th className="text-left px-5 py-3 hidden md:table-cell">Tác giả</th>
              <th className="text-left px-5 py-3">Trạng thái</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {queue.map((q) => {
              const s = statusStyles[q.status];
              const Icon = s.Icon;
              return (
                <tr key={q.id} className="hover:bg-muted/30">
                  <td className="px-5 py-3 font-medium">{q.title}</td>
                  <td className="px-5 py-3 hidden md:table-cell text-muted-foreground">{q.kind}</td>
                  <td className="px-5 py-3 hidden md:table-cell text-muted-foreground">{q.author}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded font-medium ${s.cls}`}>
                      <Icon size={12} /> {s.text}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <button className="px-2 h-8 rounded-lg text-xs font-medium bg-success/15 text-success">Duyệt</button>
                      <button className="px-2 h-8 rounded-lg text-xs font-medium bg-destructive/15 text-destructive">Từ chối</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
