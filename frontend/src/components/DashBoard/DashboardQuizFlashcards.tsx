"use client";

import React from "react";
import { ArrowRight, ChevronRight, Layers, SquareCheck } from "lucide-react";
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

  const springConfig: any = { type: "spring" as any, damping: 20, stiffness: 100 };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Panel
        title="Quiz gần đây"
        icon={<SquareCheck size={20} className="text-blue-600" />}
        onViewAll={() => navigate("/quiz")}
      >
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState retry={() => dataQuery.refetch()} />
        ) : quizzes.length === 0 ? (
          <EmptyState text="Chưa có quiz nào" />
        ) : (
          <div className="space-y-2">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{quiz.title}</p>
                  <p className="text-xs text-gray-600 mt-1 truncate">
                    {quiz.subjectName || quiz.notebookTitle || "Chưa phân loại"}
                    {quiz.examType ? ` · ${quiz.examType}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => navigate("/quiz")}
                  className="ml-3 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                >
                  Mở
                </button>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel
        title="Flashcard gần đây"
        icon={<Layers size={20} className="text-purple-600" />}
        onViewAll={() => navigate("/flashcards")}
      >
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState retry={() => dataQuery.refetch()} />
        ) : decks.length === 0 ? (
          <EmptyState text="Chưa có flashcard nào" />
        ) : (
          <div className="space-y-2">
            {decks.map((deck) => (
              <div
                key={deck.id}
                className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{deck.title}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {deck.cards.length} thẻ · {new Date(deck.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <button
                  onClick={() => navigate("/flashcards")}
                  className="ml-3 px-4 py-2 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors"
                >
                  Học
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
  icon,
  onViewAll,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  onViewAll: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-3xl border border-gray-200 overflow-hidden"
    >
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">{icon}</div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        <button
          onClick={onViewAll}
          className="text-sm font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors"
        >
          Tất cả
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="p-6">{children}</div>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-2">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-12 bg-gray-100 animate-pulse rounded-xl" />
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="h-32 flex items-center justify-center text-sm text-gray-400 font-medium">
      {text}
    </div>
  );
}

function ErrorState({ retry }: { retry: () => void }) {
  return (
    <div className="h-32 flex items-center justify-center">
      <button onClick={retry} className="text-sm font-semibold text-blue-600 hover:underline">
        Không thể tải. Thử lại
      </button>
    </div>
  );
}