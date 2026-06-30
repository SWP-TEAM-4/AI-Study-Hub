import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, CheckCircle2, Circle, Orbit, Radar } from "lucide-react";
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
      prev.map((mission) => (mission.id === id ? { ...mission, completed: !mission.completed } : mission))
    );
    Notify.success("Tiến độ nhiệm vụ đã được cập nhật!");
  }, []);

  const completedCount = missions.filter((mission) => mission.completed).length;
  const progressPercent = Math.round((completedCount / missions.length) * 100);

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
      <div className="surface-card group relative min-h-[280px] overflow-hidden rounded-[1.75rem] border border-cyan-200/15 p-6 text-left">
        <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_70%_40%,rgba(80,196,255,0.18),transparent_55%)]" aria-hidden="true" />
        <div className="absolute right-8 top-8 grid size-28 place-items-center rounded-full border border-cyan-200/14 dashboard-orbit-drift" aria-hidden="true">
          <Orbit className="text-cyan-100/60" size={34} />
        </div>

        <div className="relative z-10 flex h-full flex-col justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/15 bg-cyan-200/8 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-100/80">
              <Radar size={12} aria-hidden="true" /> Current expedition
            </div>
            <h3 className="mt-5 flex max-w-lg items-center gap-3 text-2xl font-semibold leading-tight text-white sm:text-3xl">
              <BookOpen className="text-cyan-100" size={26} aria-hidden="true" />
              Machine Learning (PRN231)
            </h3>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
              Chương 5: Supervised Classification Algorithm. Tiếp tục module nghiên cứu và đưa hành trình học hôm nay vào quỹ đạo ổn định.
            </p>
          </div>

          <div className="relative z-10">
            <div className="mb-2 flex justify-between text-xs font-bold text-slate-200">
              <span>Chapter oxygen level</span>
              <span className="text-cyan-100">75%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full border border-white/10 bg-white/8">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-200 via-sky-300 to-amber-200 shadow-[0_0_24px_rgba(125,211,252,0.45)]"
                style={{ width: "75%" }}
                role="progressbar"
                aria-valuenow={75}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <button
              onClick={() => navigate("/notebooks")}
              className="mt-5 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-cyan-100/24 bg-cyan-100/12 px-4 py-3 text-sm font-bold text-cyan-50 transition hover:-translate-y-0.5 hover:bg-cyan-100/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100/70"
            >
              Resume research log <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className="surface-card relative overflow-hidden rounded-[1.75rem] border border-amber-200/15 p-6 text-left">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/50 to-transparent" aria-hidden="true" />
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-100/75">Today mission</div>
            <h3 className="mt-1 text-2xl font-semibold text-white">Daily flight plan</h3>
          </div>
          <span className="rounded-full border border-amber-200/18 bg-amber-200/10 px-3 py-1 text-xs font-black text-amber-100">
            {progressPercent}% clear
          </span>
        </div>

        <div className="space-y-3">
          {missions.map((mission) => {
            const Icon = mission.completed ? CheckCircle2 : Circle;
            return (
              <button
                key={mission.id}
                onClick={() => toggleMission(mission.id)}
                className={"group flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border p-4 text-left transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-100/70 " +
                  (mission.completed
                    ? "border-emerald-200/20 bg-emerald-200/8 text-slate-300"
                    : "border-white/10 bg-white/6 text-white hover:border-amber-200/28 hover:bg-amber-200/8")}
                aria-label={"Đánh dấu nhiệm vụ " + mission.text}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <Icon size={17} className={mission.completed ? "text-emerald-200" : "text-slate-500 group-hover:text-amber-100"} aria-hidden="true" />
                  <span className={"text-sm font-semibold " + (mission.completed ? "line-through decoration-emerald-200/45" : "")}>{mission.text}</span>
                </span>
                <span className="shrink-0 rounded-full bg-amber-200/12 px-2.5 py-1 text-[10px] font-black text-amber-100">+{mission.xp} XP</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
