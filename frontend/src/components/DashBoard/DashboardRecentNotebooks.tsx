"use client";

import React from "react";
import { BookMarked, Bell, Users, GraduationCap, FileText, BookOpen, ArrowUpRight, Download, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { notebooks } from "../../lib/mock-data";
import EmptyState from "../ui/EmptyState";
import { motion } from "framer-motion";

const communityHighlights = [
  {
    title: "Đề thi thử Java OOP (PRJ301) Final",
    desc: "Bộ đề ôn tập 40 câu trắc nghiệm chuẩn kết quả thi.",
    author: "Minh FPT",
    downloads: "2.3k",
    time: "2 giờ trước",
    icon: GraduationCap,
    gradient: "from-amber-500/15 to-amber-500/5",
    border: "border-amber-500/20",
    iconColor: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-500/12",
  },
  {
    title: "Machine Learning Cheat Sheet - Kỳ 5",
    desc: "Tổng hợp công thức mô hình dự báo chương 1-8.",
    author: "Anh Khoa",
    downloads: "4.5k",
    time: "5 giờ trước",
    icon: FileText,
    gradient: "from-primary/15 to-primary/5",
    border: "border-primary/20",
    iconColor: "text-primary",
    iconBg: "bg-primary/12",
  },
  {
    title: "Software Testing Mock Test - SWT301",
    desc: "Câu hỏi Unit Test & Integration Test cực sát đề.",
    author: "Sam Bennet",
    downloads: "1.2k",
    time: "Hôm qua",
    icon: BookOpen,
    gradient: "from-violet-500/15 to-violet-500/5",
    border: "border-violet-500/20",
    iconColor: "text-violet-600 dark:text-violet-400",
    iconBg: "bg-violet-500/12",
  },
];

const notifications = [
  { id: 1, text: "Đã tạo 20 Flashcards mới môn Machine Learning", time: "10 phút trước", action: "Học ngay", link: "/flashcards", dot: "bg-primary" },
  { id: 2, text: "Chuỗi học 5 ngày sắp bị ngắt! Luyện 1 bài Quiz ngay", time: "2 giờ trước", action: "Ôn tập", link: "/quiz", dot: "bg-orange-500" },
  { id: 3, text: "Bạn học Minh vừa chia sẻ bộ notebook Java OOP mới", time: "Hôm qua", action: "Xem", link: "/community", dot: "bg-blue-500" },
];

// Notebook color map by index
const notebookColors = [
  { bg: "bg-blue-500/12", icon: "text-blue-600 dark:text-blue-400" },
  { bg: "bg-violet-500/12", icon: "text-violet-600 dark:text-violet-400" },
  { bg: "bg-emerald-500/12", icon: "text-emerald-600 dark:text-emerald-400" },
  { bg: "bg-amber-500/12", icon: "text-amber-600 dark:text-amber-400" },
];

export const DashboardRecentNotebooks = React.memo(function DashboardRecentNotebooks() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Row 1: Notebooks + Notifications */}
      <section className="grid lg:grid-cols-3 gap-5" aria-label="Thư mục và thông báo">

        {/* Recent Notebooks */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="lg:col-span-2 rounded-2xl border border-border bg-card shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-base text-foreground">Thư mục vừa mở</h3>
            <button
              id="view-all-notebooks-btn"
              onClick={() => navigate("/notebooks")}
              className="cursor-pointer inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm transition-opacity hover:opacity-80"
              aria-label="Xem tất cả thư mục"
            >
              Xem tất cả <ArrowUpRight size={11} aria-hidden="true" />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {notebooks.length === 0 ? (
              <div className="col-span-full">
                <EmptyState
                  title="Chưa có Notebook nào"
                  description="Hãy tạo notebook đầu tiên để sắp xếp tài liệu."
                  actionText="Tạo Notebook"
                  actionHref="/notebooks"
                />
              </div>
            ) : (
              notebooks.slice(0, 4).map((nb, i) => {
                const col = notebookColors[i % notebookColors.length];
                return (
                  <motion.button
                    key={nb.id}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: i * 0.04 }}
                    onClick={() => navigate("/notebooks")}
                    className="cursor-pointer group w-full text-left p-4 rounded-xl border border-border/70 hover:border-primary/40 hover:bg-muted/20 bg-card transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.98]"
                    aria-label={`Mở thư mục ${nb.title}`}
                  >
                    <div
                      className={`size-10 rounded-lg mb-3 flex items-center justify-center ${col.bg} transition-transform duration-200 group-hover:scale-105`}
                      aria-hidden="true"
                    >
                      <BookMarked size={18} className={col.icon} />
                    </div>
                    <div className="font-semibold truncate text-sm text-foreground">{nb.title}</div>
                    <div className="text-xs text-muted-foreground mt-1 font-medium flex items-center gap-1.5">
                      <span>{nb.docs} tài liệu</span>
                      <span className="opacity-40">·</span>
                      <span>{nb.cards} flashcard</span>
                    </div>
                  </motion.button>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.08 }}
          className="rounded-2xl border border-border bg-card shadow-sm p-6 text-left"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Bell size={17} className="text-primary shrink-0" aria-hidden="true" />
              Thông báo học tập
            </h3>
            <button
              id="view-all-notifications-btn"
              onClick={() => navigate("/notifications")}
              className="cursor-pointer inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
              aria-label="Xem tất cả thông báo"
            >
              Tất cả <ArrowUpRight size={11} aria-hidden="true" />
            </button>
          </div>

          <ul className="space-y-4" role="list" aria-label="Thông báo học tập">
            {notifications.map((n, i) => (
              <motion.li
                key={n.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: i * 0.06 }}
                className="flex gap-3 items-start"
                role="listitem"
              >
                <div className={`size-2 mt-2 rounded-full ${n.dot} shrink-0`} aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs leading-snug font-medium text-foreground">{n.text}</p>
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground font-semibold">
                    <Clock size={9} aria-hidden="true" />
                    <span>{n.time}</span>
                    <button
                      id={`notification-${n.id}-action-btn`}
                      onClick={() => navigate(n.link)}
                      className="cursor-pointer text-primary font-bold hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm"
                      aria-label={`${n.action}: ${n.text}`}
                    >
                      {n.action}
                    </button>
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </section>

      {/* Row 2: Community highlights */}
      <section aria-label="Tiêu điểm cộng đồng">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Users size={17} className="text-primary shrink-0" aria-hidden="true" />
              Tiêu điểm cộng đồng
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tài liệu nổi bật được chia sẻ rộng rãi tuần này
            </p>
          </div>
          <button
            id="view-community-btn"
            onClick={() => navigate("/community")}
            className="cursor-pointer inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
            aria-label="Xem tất cả tài liệu cộng đồng"
          >
            Xem tất cả <ArrowUpRight size={11} aria-hidden="true" />
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {communityHighlights.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: i * 0.06 }}
                onClick={() => navigate("/community")}
                className={`cursor-pointer group w-full text-left p-5 rounded-2xl border bg-gradient-to-br ${item.gradient} ${item.border} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.98]`}
                aria-label={`Xem tài liệu: ${item.title}`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${item.iconBg}`} aria-hidden="true">
                    <Icon size={19} className={item.iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors duration-150 line-clamp-2 leading-tight">
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-muted-foreground font-medium">bởi {item.author}</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                  {item.desc}
                </p>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold pt-3 border-t border-border/40">
                  <span className="inline-flex items-center gap-1">
                    <Download size={10} aria-hidden="true" />
                    {item.downloads} lượt tải
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock size={9} aria-hidden="true" />
                    {item.time}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>
    </div>
  );
});
