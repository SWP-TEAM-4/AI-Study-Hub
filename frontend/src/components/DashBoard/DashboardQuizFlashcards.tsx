"use client";

import React from "react";
import { ArrowUpRight, ChevronRight, Layers, SquareCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { quizService } from "../../services/quizService";
import { flashcardService } from "../../services/flashcardService";

export const DashboardQuizFlashcards = React.memo(function DashboardQuizFlashcards() {
  const navigate = useNavigate();
  const dataQuery = useQuery({
    queryKey: ["dashboardQuizFlashcards"],
    queryFn: async () => {
      const [quizzes, decks] = await Promise.all([
        quizService.getQuizzes({ page: 0, size: 3, sort: "createdAt,desc" }),
        flashcardService.getMyFlashcardDecks(0, 3),
      ]);
      return { quizzes: quizzes.data.items.slice(0, 3), decks: decks.data.items.slice(0, 3) };
    },
    staleTime: 60_000,
  });

  const loading = dataQuery.isLoading;
  const error = dataQuery.isError;
  const quizzes = dataQuery.data?.quizzes ?? [];
  const decks = dataQuery.data?.decks ?? [];

  return (
    <section className="grid grid-cols-1 gap-5 lg:grid-cols-2" aria-label="Quiz và Flashcard">
      <Panel title="Quiz gần đây" icon={<SquareCheck size={16} className="text-primary" />} onViewAll={() => navigate("/quiz")}>
        {loading ? <Loading /> : error ? <ErrorState retry={() => dataQuery.refetch()} /> : quizzes.length === 0 ? <Empty text="Bạn chưa có quiz nào." /> : (
          <ul className="space-y-2.5 text-left">
            {quizzes.map((quiz) => (
              <li key={quiz.id} className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 p-3.5">
                <div className="min-w-0 flex-1 pr-3"><div className="truncate text-sm font-bold text-foreground">{quiz.title}</div><div className="mt-1 text-xs text-muted-foreground">{quiz.subjectName || quiz.notebookTitle || "Chưa phân loại"}{quiz.examType ? ` · ${quiz.examType}` : ""}</div></div>
                <button onClick={() => navigate("/quiz")} className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-primary px-4 text-xs font-bold text-primary-foreground">Mở <ChevronRight size={12} /></button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Flashcard gần đây" icon={<Layers size={16} className="text-violet-500" />} onViewAll={() => navigate("/flashcards")}>
        {loading ? <Loading /> : error ? <ErrorState retry={() => dataQuery.refetch()} /> : decks.length === 0 ? <Empty text="Bạn chưa có bộ flashcard nào." /> : (
          <ul className="space-y-2.5 text-left">
            {decks.map((deck) => (
              <li key={deck.id} className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 p-3.5">
                <div className="min-w-0 flex-1 pr-3"><div className="truncate text-sm font-bold text-foreground">{deck.title}</div><div className="mt-1 text-xs text-muted-foreground">{deck.cards.length} thẻ · {new Date(deck.createdAt).toLocaleDateString()}</div></div>
                <button onClick={() => navigate("/flashcards")} className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-violet-500 px-4 text-xs font-bold text-white">Học <ChevronRight size={12} /></button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </section>
  );
});

function Panel({ title, icon, onViewAll, children }: { title: string; icon: React.ReactNode; onViewAll: () => void; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between"><h3 className="flex items-center gap-2 text-base font-bold text-foreground"><span className="grid size-8 place-items-center rounded-lg bg-primary/10">{icon}</span>{title}</h3><button onClick={onViewAll} className="inline-flex items-center gap-1 text-xs font-bold text-primary">Tất cả <ArrowUpRight size={11} /></button></div>
      {children}
    </motion.div>
  );
}

function Loading() { return <div className="h-40 animate-pulse rounded-xl bg-muted" />; }
function Empty({ text }: { text: string }) { return <div className="grid h-40 place-items-center text-sm text-muted-foreground">{text}</div>; }
function ErrorState({ retry }: { retry: () => void }) { return <div className="grid h-40 place-items-center text-sm text-destructive"><button onClick={retry}>Không thể tải dữ liệu. Thử lại</button></div>; }
