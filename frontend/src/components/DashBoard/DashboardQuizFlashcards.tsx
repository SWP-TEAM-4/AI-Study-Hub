"use client";

import React from "react";
import { SquareCheck, Layers, ArrowUpRight, ChevronRight, Clock, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { notebooks, decks } from "../../lib/mock-data";
import { motion } from "framer-motion";

// Difficulty badge
const difficultyMap: Record<string, { label: string; color: string }> = {
  easy: { label: "Dễ", color: "text-emerald-600 bg-emerald-500/10" },
  medium: { label: "Trung bình", color: "text-amber-600 bg-amber-500/10" },
  hard: { label: "Khó", color: "text-red-600 bg-red-500/10" },
};

export const DashboardQuizFlashcards = React.memo(function DashboardQuizFlashcards() {
  const navigate = useNavigate();

  return (
    <section
      className="grid grid-cols-1 lg:grid-cols-2 gap-5"
      aria-label="Quiz và Flashcard"
    >
      {/* Quiz Panel */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-2xl border border-border bg-card shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/12 flex items-center justify-center shrink-0" aria-hidden="true">
              <SquareCheck size={16} className="text-primary" />
            </div>
            Quiz cần làm
          </h3>
          <button
            id="view-all-quiz-btn"
            onClick={() => navigate("/quiz")}
            className="cursor-pointer inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
            aria-label="Xem tất cả Quiz"
          >
            Tất cả <ArrowUpRight size={11} aria-hidden="true" />
          </button>
        </div>

        <ul className="space-y-2.5 text-left" role="list" aria-label="Danh sách Quiz cần làm">
          {notebooks.slice(0, 3).map((nb, i) => {
            const diff = i === 0 ? "hard" : i === 1 ? "medium" : "easy";
            const badge = difficultyMap[diff];
            return (
              <motion.li
                key={nb.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.18, delay: i * 0.05 }}
                role="listitem"
              >
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/30 hover:bg-muted/50 transition-all duration-150 group">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="text-sm font-bold text-foreground truncate">{nb.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground font-medium">
                        {nb.quizzes} bộ quiz
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${badge.color}`}>
                        {badge.label}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        <Clock size={9} aria-hidden="true" />
                        ~15 phút
                      </span>
                    </div>
                  </div>
                  <button
                    id={`quiz-${nb.id}-start-btn`}
                    onClick={() => navigate("/quiz")}
                    className="cursor-pointer px-4 h-9 min-w-[72px] inline-flex items-center justify-center rounded-lg text-xs font-bold bg-primary text-primary-foreground shadow-sm shadow-primary/20 transition-all duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background shrink-0 active:scale-[0.96]"
                    aria-label={`Làm bài quiz ${nb.title}`}
                  >
                    Làm bài <ChevronRight size={12} aria-hidden="true" />
                  </button>
                </div>
              </motion.li>
            );
          })}
        </ul>
      </motion.div>

      {/* Flashcards Panel */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.08 }}
        className="rounded-2xl border border-border bg-card shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <div className="size-8 rounded-lg bg-violet-500/12 flex items-center justify-center shrink-0" aria-hidden="true">
              <Layers size={16} className="text-violet-600 dark:text-violet-400" />
            </div>
            Flashcard mới
          </h3>
          <button
            id="view-all-flashcards-btn"
            onClick={() => navigate("/flashcards")}
            className="cursor-pointer inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
            aria-label="Xem tất cả Flashcard"
          >
            Tất cả <ArrowUpRight size={11} aria-hidden="true" />
          </button>
        </div>

        <ul className="space-y-2.5 text-left" role="list" aria-label="Danh sách bộ Flashcard">
          {decks.map((d, i) => {
            const mastery = Math.round((d.mastered / d.cards) * 100);
            return (
              <motion.li
                key={d.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.18, delay: i * 0.05 }}
                role="listitem"
              >
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/50 hover:border-violet-500/30 hover:bg-muted/50 transition-all duration-150 group">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="text-sm font-bold text-foreground truncate">{d.title}</div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 max-w-[80px] h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-violet-500 transition-all duration-500"
                          style={{ width: `${mastery}%` }}
                          role="progressbar"
                          aria-valuenow={mastery}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${mastery}% đã thuộc`}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium tabular-nums">
                        {d.mastered}/{d.cards} thuộc
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-500 font-bold">
                        <Star size={9} aria-hidden="true" />
                        {mastery}%
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{d.updated}</div>
                  </div>
                  <button
                    id={`flashcard-${d.id}-study-btn`}
                    onClick={() => navigate("/flashcards")}
                    className="cursor-pointer px-4 h-9 min-w-[64px] inline-flex items-center justify-center rounded-lg text-xs font-bold bg-violet-500 text-white shadow-sm shadow-violet-500/25 transition-all duration-200 hover:bg-violet-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 focus-visible:ring-offset-background shrink-0 active:scale-[0.96]"
                    aria-label={`Học bộ flashcard ${d.title}`}
                  >
                    Học <ChevronRight size={12} aria-hidden="true" />
                  </button>
                </div>
              </motion.li>
            );
          })}
        </ul>
      </motion.div>
    </section>
  );
});
