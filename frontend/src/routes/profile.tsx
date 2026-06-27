import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Mail, MapPin, Award, Flame, BookMarked, FileText, GraduationCap, Settings, LogOut } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Hồ sơ — Stitch" },
      { name: "description", content: "Hồ sơ cá nhân, huy hiệu và thống kê học tập." },
    ],
  }),
  component: ProfilePage,
});

const badges = [
  { name: "Người mới", desc: "Hoàn thành onboarding", color: "165" },
  { name: "Chăm chỉ", desc: "Học 7 ngày liên tiếp", color: "35" },
  { name: "Đóng góp", desc: "Upload 10 tài liệu", color: "200" },
  { name: "Quiz Master", desc: "Đạt 100 điểm", color: "75" },
];

const stats = [
  { label: "Notebook", value: 5, icon: BookMarked },
  { label: "Tài liệu", value: 42, icon: FileText },
  { label: "Quiz đã làm", value: 28, icon: GraduationCap },
];

function ProfilePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="surface-card gradient-hero p-6 lg:p-8">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="size-24 rounded-3xl bg-ink text-cream grid place-items-center text-3xl font-display font-bold">
            AK
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Anh Khoa</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">PRO</span>
            </div>
            <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-4">
              <span className="inline-flex items-center gap-1">
                <Mail size={13} /> anhkhoa@fpt.edu.vn
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin size={13} /> FPT University HCM
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-coral/10 text-coral text-xs font-medium">
                <Flame size={12} /> Chuỗi 7 ngày
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning/20 text-xs font-medium">
                <Award size={12} /> 11,320 reputation
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-1.5 px-3 h-9 rounded-xl bg-card border border-border text-sm font-medium">
              <Settings size={14} /> Cài đặt
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 h-9 rounded-xl bg-destructive/10 text-destructive text-sm font-medium">
              <LogOut size={14} /> Đăng xuất
            </button>
          </div>
        </div>
      </motion.div>

      <section className="grid grid-cols-3 gap-4">
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
              <Icon size={18} className="text-primary mb-2" />
              <div className="text-2xl font-bold font-display">{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </motion.div>
          );
        })}
      </section>

      <section className="surface-card p-6">
        <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
          <Award className="text-coral" size={18} /> Huy hiệu của bạn
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {badges.map((b, i) => (
            <motion.div
              key={b.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -3 }}
              className="p-4 rounded-2xl bg-muted/40 border border-border text-center"
            >
              <div
                className="size-14 rounded-2xl mx-auto grid place-items-center mb-2"
                style={{ background: `oklch(0.55 0.14 ${b.color} / 0.15)`, color: `oklch(0.45 0.14 ${b.color})` }}
              >
                <Award size={24} />
              </div>
              <div className="font-medium text-sm">{b.name}</div>
              <div className="text-xs text-muted-foreground">{b.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
