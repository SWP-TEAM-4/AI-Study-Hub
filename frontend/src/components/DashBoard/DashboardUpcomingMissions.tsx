import { useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, CheckCircle2, Layers, Orbit, Radar, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { notebookService } from "../../services/notebookService";
import { flashcardService } from "../../services/flashcardService";
import { userService } from "../../services/userService";

export function DashboardUpcomingMissions() {
  const navigate = useNavigate();
  const snapshotQuery = useQuery({
    queryKey: ["dashboardLearningSnapshot"],
    queryFn: async () => {
      const [notebooks, dueCards, tests] = await Promise.all([
        notebookService.getNotebooks(0, 4),
        flashcardService.getFlashcardsDue(),
        userService.getMyTestHistory({ page: 0, size: 3, sort: "newest" }),
      ]);
      return {
        notebooks: notebooks.data.items,
        dueCards: dueCards.data,
        tests: tests.data,
      };
    },
    staleTime: 60_000,
  });

  if (snapshotQuery.isLoading) {
    return <section className="grid gap-6 lg:grid-cols-2"><div className="surface-card h-[280px] animate-pulse" /><div className="surface-card h-[280px] animate-pulse" /></section>;
  }

  if (snapshotQuery.isError || !snapshotQuery.data) {
    return (
      <section className="surface-card rounded-[1.75rem] p-8 text-center text-slate-300">
        <p>Không thể tải tiến độ học tập từ backend.</p>
        <button onClick={() => snapshotQuery.refetch()} className="mx-auto mt-3 inline-flex items-center gap-2 text-cyan-200"><RefreshCw size={14} /> Thử lại</button>
      </section>
    );
  }

  const { notebooks, dueCards, tests } = snapshotQuery.data;
  const latestNotebook = notebooks[0];
  const completedRecentTests = tests.items.filter((test) => test.status === "COMPLETED").length;
  const learningItems = [
    { label: "Flashcard đến hạn ôn", value: dueCards.length, icon: Layers, action: "Ôn ngay", path: "/flashcards" },
    { label: "Lượt làm test", value: tests.totalElements, icon: CheckCircle2, action: "Mở Quiz", path: "/quiz" },
    { label: "Test hoàn thành gần đây", value: completedRecentTests, icon: CheckCircle2, action: "Xem Quiz", path: "/quiz" },
  ];

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
      <div className="surface-card group relative min-h-[280px] overflow-hidden rounded-[1.75rem] border border-cyan-200/15 p-6 text-left">
        <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_70%_40%,rgba(80,196,255,0.18),transparent_55%)]" aria-hidden="true" />
        <div className="absolute right-8 top-8 grid size-28 place-items-center rounded-full border border-cyan-200/14 dashboard-orbit-drift" aria-hidden="true"><Orbit className="text-cyan-100/60" size={34} /></div>
        <div className="relative z-10 flex h-full flex-col justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/15 bg-cyan-200/8 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-100/80"><Radar size={12} /> Notebook gần nhất</div>
            {latestNotebook ? (
              <>
                <h3 className="mt-5 flex max-w-lg items-center gap-3 text-2xl font-semibold leading-tight text-white sm:text-3xl"><BookOpen className="text-cyan-100" size={26} />{latestNotebook.title}</h3>
                <p className="mt-3 text-sm text-slate-300">{latestNotebook.subjectCode || "Chưa gán môn học"} · {latestNotebook.documentCount} tài liệu</p>
                <p className="mt-1 text-xs text-slate-400">Tạo lúc {new Date(latestNotebook.createdAt).toLocaleString()}</p>
              </>
            ) : (
              <div className="mt-8 text-sm text-slate-300">Bạn chưa có notebook nào.</div>
            )}
          </div>
          <button onClick={() => navigate(latestNotebook ? `/notebooks/${latestNotebook.id}` : "/notebooks")} className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-cyan-100/24 bg-cyan-100/12 px-4 py-3 text-sm font-bold text-cyan-50 transition hover:bg-cyan-100/18">
            {latestNotebook ? "Tiếp tục notebook" : "Tạo notebook đầu tiên"} <ArrowRight size={15} />
          </button>
        </div>
      </div>

      <div className="surface-card relative overflow-hidden rounded-[1.75rem] border border-amber-200/15 p-6 text-left">
        <div className="mb-6"><div className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-100/75">Dữ liệu học tập</div><h3 className="mt-1 text-2xl font-semibold text-white">Việc cần tiếp tục</h3></div>
        <div className="space-y-3">
          {learningItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.label} onClick={() => navigate(item.path)} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/6 p-4 text-left text-white transition hover:border-amber-200/28 hover:bg-amber-200/8">
                <span className="flex items-center gap-3"><Icon size={17} className="text-amber-100" /><span><span className="block text-sm font-semibold">{item.label}</span><span className="text-xs text-slate-400">{item.action}</span></span></span>
                <span className="rounded-full bg-amber-200/12 px-3 py-1 text-sm font-black text-amber-100">{item.value}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
