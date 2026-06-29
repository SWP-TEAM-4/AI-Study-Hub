import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, ArrowRight, CheckCircle2 } from "lucide-react";
import { Notify } from "notiflix";

const initialMissions = [
  { id: 1, text: "Hoàn thành 2 bài Quiz", xp: 100, completed: true },
  { id: 2, text: "Học 20 Flashcards", xp: 50, completed: false },
  { id: 3, text: "Đọc 1 tài liệu mới", xp: 50, completed: false },
];

export function DashboardUpcomingMissions() {
  const navigate = useNavigate();
  const [missions, setMissions] = useState(initialMissions);

  const toggleMission = useCallback((id: number) => {
    setMissions((prev) =>
      prev.map((m) => (m.id === id ? { ...m, completed: !m.completed } : m))
    );
    Notify.success("Tiến độ nhiệm vụ đã được cập nhật!");
  }, []);

  const completedCount = missions.filter((m) => m.completed).length;
  const progressPercent = Math.round((completedCount / missions.length) * 100);

  return (
    <section className="grid md:grid-cols-2 gap-5">
      {/* Continue Learning card */}
      <div className="surface-card p-6 flex flex-col justify-between border border-primary/20 relative overflow-hidden bg-gradient-to-br from-card to-primary/5 rounded-2xl">
        <div className="absolute top-0 right-0 p-3 bg-primary/10 text-primary rounded-bl-2xl text-xs font-black uppercase tracking-wider">
          Đang học dở
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-extrabold">
            Môn học tiếp theo
          </div>
          <h3 className="text-xl font-bold mt-1.5 flex items-center gap-2">
            <BookOpen className="text-primary" size={20} aria-hidden="true" />
            Machine Learning (PRN231)
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Chương 5: Supervised Classification Algorithm
          </p>

          {/* Progress bar */}
          <div className="mt-6 space-y-1.5" aria-label={`Tiến độ chương học: ${75}%`}>
            <div className="flex justify-between text-xs font-bold text-foreground">
              <span>Tiến độ chương học</span>
              <span className="text-primary">75%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-[#00F0FF] shadow-[0_0_10px_rgba(0,221,163,0.5)]"
                style={{ width: "75%" }}
                role="progressbar"
                aria-valuenow={75}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate("/notebooks")}
          className="mt-6 w-full py-2.5 rounded-xl text-xs font-bold glow-button focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background inline-flex items-center justify-center gap-1 cursor-pointer"
        >
          Học tiếp bài học <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>

      {/* Today's mission goals */}
      <div className="surface-card p-6 border border-emerald-500/20 bg-gradient-to-br from-card to-emerald-500/5 rounded-2xl text-left">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-extrabold">
              Nhiệm vụ hôm nay
            </div>
            <h3 className="text-lg font-bold mt-0.5">Today's Mission</h3>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-black">
            {progressPercent}% Đạt
          </span>
        </div>

        {/* Missions List */}
        <div className="space-y-3">
          {missions.map((m) => (
            <button
              key={m.id}
              onClick={() => toggleMission(m.id)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer ${
                m.completed
                  ? "bg-emerald-500/10 border-emerald-500/20 text-muted-foreground/80 line-through"
                  : "bg-card border-border/60 hover:border-emerald-500/40 text-foreground"
              }`}
              aria-label={`Đánh dấu nhiệm vụ ${m.text} là ${m.completed ? 'chưa hoàn thành' : 'hoàn thành'}`}
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2
                  size={16}
                  className={m.completed ? "text-emerald-500" : "text-muted-foreground/40"}
                  aria-hidden="true"
                />
                <span className="text-xs font-semibold text-left">{m.text}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-extrabold shrink-0">
                +{m.xp} XP
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
