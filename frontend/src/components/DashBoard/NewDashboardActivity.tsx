"use client";

import React, { memo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Layers, SquareCheck } from "lucide-react";
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
      <Panel
        title="Bài Kiểm Tra Gần Đây"
        onViewAll={() => navigate("/quiz")}
      >
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState retry={() => dataQuery.refetch()} />
        ) : quizzes.length === 0 ? (
          <EmptyState text="Chưa có bài kiểm tra nào đâu bé ơi!" />
        ) : (
          <div className="divide-y divide-[#eff4ff] -mt-2">
            {quizzes.map((quiz: any) => (
              <div
                key={quiz.id}
                className="flex items-center justify-between py-4 hover:bg-black/5 dark:hover:bg-white/5 transition-[background-color] group px-4 rounded-2xl"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-extrabold text-foreground truncate font-serif">{quiz.title}</p>
                  <p className="text-[13px] text-muted-foreground mt-1 truncate font-bold">
                    {quiz.subjectName || quiz.notebookTitle || "Chưa phân loại"}
                    {quiz.examType ? ` · ${quiz.examType}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => navigate("/quiz")}
                  className="ml-4 px-5 py-2.5 rounded-full bg-[#89cff0] text-white text-[13px] font-extrabold hover:bg-[#a6dcf8] border-b-4 border-[#0d6683] active:translate-y-[2px] active:border-b-[2px] transition-all"
                >
                  Làm Bài
                </button>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel
        title="Flashcard Gần Đây"
        onViewAll={() => navigate("/flashcards")}
      >
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState retry={() => dataQuery.refetch()} />
        ) : decks.length === 0 ? (
          <EmptyState text="Chưa có thẻ từ vựng nào hết!" />
        ) : (
          <div className="divide-y divide-border -mt-2">
            {decks.map((deck: any) => (
              <div
                key={deck.id}
                className="flex items-center justify-between py-4 hover:bg-black/5 dark:hover:bg-white/5 transition-[background-color] group px-4 rounded-2xl"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-extrabold text-foreground truncate font-serif">{deck.title || "Bộ Flashcard"}</p>
                  <p className="text-[13px] text-muted-foreground mt-1 font-bold">
                    <span className="text-[#0d6683] font-extrabold">{deck.cards.length} thẻ</span> · {new Date(deck.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <button
                  onClick={() => navigate("/flashcards")}
                  className="ml-4 px-5 py-2.5 rounded-full bg-[#89cff0] text-white text-[13px] font-extrabold hover:bg-[#a6dcf8] border-b-4 border-[#0d6683] active:translate-y-[2px] active:border-b-[2px] transition-all"
                >
                  Ôn Tập
                </button>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
});

function Panel({
  title,
  onViewAll,
  children
}: {
  title: string;
  onViewAll: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="surface-card overflow-hidden flex flex-col transition-all hover:scale-[1.01]"
    >
      <div className="px-8 py-8 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-2xl font-extrabold text-foreground tracking-tight font-serif">{title}</h3>
        </div>
        <button
          onClick={onViewAll}
          className="text-[15px] font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-[color] font-serif"
        >
          Tất cả &rarr;
        </button>
      </div>

      <div className="p-8 flex-1">{children}</div>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-4 py-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between py-2">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-100 rounded-full w-2/3 animate-pulse" />
            <div className="h-3 bg-slate-100 rounded-full w-1/3 animate-pulse" />
          </div>
          <div className="h-10 bg-slate-100 rounded-full w-20 ml-4 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function ErrorState({ retry }: { retry: () => void }) {
  return (
    <div className="py-8 text-center">
      <p className="text-[15px] font-bold text-red-500">Đã xảy ra lỗi tải dữ liệu.</p>
      <button
        onClick={retry}
        className="mt-4 px-5 py-2 rounded-full border border-red-200 text-[13px] font-extrabold text-red-500 hover:bg-red-50 transition-colors"
      >
        Thử Lại
      </button>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-12 text-center text-[15px] font-bold text-[#475569]">
      {text}
    </div>
  );
}
