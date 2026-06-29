import React from "react";
import { GraduationCap, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { notebooks, decks } from "../../lib/mock-data";

export const DashboardQuizFlashcards = React.memo(function DashboardQuizFlashcards() {
  const navigate = useNavigate();

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="surface-card p-6 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-base font-bold flex items-center gap-2 text-foreground">
            <GraduationCap size={20} className="text-primary" aria-hidden="true" /> Quiz cần làm
          </h3>
          <button 
            onClick={() => navigate("/quiz")} 
            className="text-xs text-primary font-bold cursor-pointer hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
            aria-label="Xem tất cả Quiz"
          >
            Tất cả
          </button>
        </div>
        <div className="space-y-3 text-left">
          {notebooks.slice(0, 3).map((nb) => (
            <div key={nb.id} className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex-1 min-w-0 pr-3">
                <div className="text-sm font-bold text-foreground truncate">{nb.title}</div>
                <div className="text-xs text-muted-foreground font-medium mt-0.5">{nb.quizzes} bộ quiz · Trung bình</div>
              </div>
              <button 
                onClick={() => navigate("/quiz-practice")}
                className="px-4 h-9 inline-flex items-center justify-center rounded-lg text-xs font-bold glow-button cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background shrink-0"
                aria-label={`Làm bài quiz ${nb.title}`}
              >
                Làm bài
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="surface-card p-6 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-base font-bold flex items-center gap-2 text-foreground">
            <BookOpen size={20} className="text-red-500" aria-hidden="true" /> Flashcard mới
          </h3>
          <button 
            onClick={() => navigate("/flashcards")} 
            className="text-xs text-primary font-bold cursor-pointer hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
            aria-label="Xem tất cả Flashcards"
          >
            Tất cả
          </button>
        </div>
        <div className="space-y-3 text-left">
          {decks.map((d) => (
            <div key={d.id} className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex-1 min-w-0 pr-3">
                <div className="text-sm font-bold text-foreground truncate">{d.title}</div>
                <div className="text-xs text-muted-foreground font-medium mt-0.5">
                  {d.mastered}/{d.cards} đã thuộc · {d.updated}
                </div>
              </div>
              <button
                onClick={() => navigate("/flashcards")}
                className="px-4 h-9 inline-flex items-center justify-center rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1 focus-visible:ring-offset-background shrink-0"
                aria-label={`Học thẻ ${d.title}`}
              >
                Học
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
