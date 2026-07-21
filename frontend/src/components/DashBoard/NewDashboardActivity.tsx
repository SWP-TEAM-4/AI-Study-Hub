"use client";

import React, { memo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ClipboardList, Layers, BookOpen, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { userService } from "../../services/userService";
import { flashcardService } from "../../services/flashcardService";
import { SkeletonCard } from "../ui/SkeletonCard";

export const NewDashboardActivity = memo(function NewDashboardActivity() {
  const navigate = useNavigate();

  const dataQuery = useQuery({
    queryKey: ["recentActivity"],
    queryFn: async () => {
      const [tests, flashcards] = await Promise.all([
        userService.getMyTestHistory({ page: 0, size: 3, sort: "newest" }),
        flashcardService.getMyFlashcardDecks(0, 3),
      ]);
      return {
        quizzes: tests.data.items || [],
        decks: flashcards.data.items || [],
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const { quizzes = [], decks = [] } = dataQuery.data || {};
  const loading = dataQuery.isLoading;
  const error = dataQuery.isError;

  if (loading) {
    return <SkeletonCard />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      <Panel
        icon={<ClipboardList size={18} className="text-primary" />}
        title="Bài kiểm tra gần đây"
        subtitle="Luyện tập & củng cố kiến thức"
        accent="from-primary/15 via-primary/5 to-transparent"
        ring="ring-primary/20"
        onViewAll={() => navigate("/quiz")}
      >
        {error ? (
          <ErrorState retry={() => dataQuery.refetch()} />
        ) : quizzes.length === 0 ? (
          <EmptyState
            icon={<Sparkles size={22} className="text-primary" />}
            title="Chưa có bài kiểm tra nào"
            hint="Hoàn thành bài kiểm tra đầu tiên để thấy lịch sử tại đây."
            cta="Khám phá Quiz"
            onClick={() => navigate("/quiz")}
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {quizzes.map((quiz: any, idx: number) => (
              <motion.li
                key={quiz.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
                className="group flex items-center gap-4 p-3.5 rounded-xl border border-transparent hover:border-border/60 hover:bg-muted/40 transition-all"
              >
                <div className="size-11 shrink-0 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 grid place-items-center text-primary">
                  <ClipboardList size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-[15px] font-semibold text-foreground truncate">
                    {quiz.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {quiz.subjectName || quiz.notebookTitle || "Chưa phân loại"}
                    {quiz.examType ? ` · ${quiz.examType}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => navigate("/quiz")}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-foreground/5 hover:bg-primary hover:text-primary-foreground text-foreground text-xs font-semibold transition-all"
                >
                  Làm bài
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </button>
              </motion.li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel
        icon={<Layers size={18} className="text-accent" />}
        title="Flashcard gần đây"
        subtitle="Ghi nhớ nhanh với phương pháp lặp lại"
        accent="from-accent/15 via-accent/5 to-transparent"
        ring="ring-accent/20"
        onViewAll={() => navigate("/flashcards")}
      >
        {error ? (
          <ErrorState retry={() => dataQuery.refetch()} />
        ) : decks.length === 0 ? (
          <EmptyState
            icon={<BookOpen size={22} className="text-accent" />}
            title="Chưa có bộ Flashcard nào"
            hint="Tạo bộ thẻ đầu tiên để bắt đầu ôn tập thông minh."
            cta="Tạo Flashcard"
            onClick={() => navigate("/flashcards")}
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {decks.map((deck: any, idx: number) => (
              <motion.li
                key={deck.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
                className="group flex items-center gap-4 p-3.5 rounded-xl border border-transparent hover:border-border/60 hover:bg-muted/40 transition-all"
              >
                <div className="size-11 shrink-0 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 grid place-items-center text-accent">
                  <Layers size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-[15px] font-semibold text-foreground truncate">
                    {deck.title || "Bộ Flashcard"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <span className="font-semibold text-accent">{deck.cards.length}</span> thẻ ·{" "}
                    {new Date(deck.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <button
                  onClick={() => navigate("/flashcards")}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-foreground/5 hover:bg-accent hover:text-accent-foreground text-foreground text-xs font-semibold transition-all"
                >
                  Ôn tập
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </button>
              </motion.li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
});

function Panel({
  icon,
  title,
  subtitle,
  accent,
  ring,
  onViewAll,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accent: string;
  ring: string;
  onViewAll: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow"
    >
      <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${accent} pointer-events-none`} />

      <div className="relative px-6 pt-6 pb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`size-10 rounded-xl bg-card ring-1 ${ring} grid place-items-center shadow-sm`}>
            {icon}
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-lg font-bold text-foreground leading-tight truncate">
              {title}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
          </div>
        </div>
        <button
          onClick={onViewAll}
          className="shrink-0 text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
        >
          Tất cả
          <ArrowRight size={13} />
        </button>
      </div>

      <div className="relative px-6 pb-6 pt-2">{children}</div>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 p-3.5">
          <div className="size-11 rounded-xl bg-muted animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-muted rounded-md w-2/3 animate-pulse" />
            <div className="h-3 bg-muted rounded-md w-1/3 animate-pulse" />
          </div>
          <div className="h-8 w-20 bg-muted rounded-lg animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function ErrorState({ retry }: { retry: () => void }) {
  return (
    <div className="py-8 text-center">
      <p className="text-sm font-medium text-destructive">Đã xảy ra lỗi tải dữ liệu.</p>
      <button
        onClick={retry}
        className="mt-3 px-4 py-2 rounded-lg border border-destructive/30 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
      >
        Thử lại
      </button>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  hint,
  cta,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <div className="py-8 text-center flex flex-col items-center gap-2">
      <div className="size-12 rounded-2xl bg-muted/60 grid place-items-center mb-1">{icon}</div>
      <p className="font-display text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground max-w-[260px]">{hint}</p>
      <button
        onClick={onClick}
        className="mt-3 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:brightness-110 transition-all"
      >
        {cta}
      </button>
    </div>
  );
}