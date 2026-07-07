import { useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, CheckCircle2, Layers } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { notebookService } from "../../services/notebookService";
import { flashcardService } from "../../services/flashcardService";
import { userService } from "../../services/userService";
import { motion } from "framer-motion";

export function DashboardUpcomingMissions() {
  const navigate = useNavigate();
  const snapshotQuery = useSuspenseQuery({
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

  const { notebooks, dueCards, tests } = snapshotQuery.data;
  const latestNotebook = notebooks[0];
  const completedRecentTests = tests.items.filter((test) => test.status === "COMPLETED").length;
  
  const learningItems = [
    { 
      label: "Flashcard ôn tập", 
      value: dueCards.length, 
      icon: Layers, 
      action: "Ôn ngay", 
      path: "/flashcards",
      color: "var(--color-quiz)",
      bg: "bg-[var(--color-quiz)]/10"
    },
    { 
      label: "Lượt làm bài Test", 
      value: tests.totalElements, 
      icon: CheckCircle2, 
      action: "Mở Quiz", 
      path: "/quiz",
      color: "var(--color-study)",
      bg: "bg-[var(--color-study)]/10"
    },
    { 
      label: "Test gần đây", 
      value: completedRecentTests, 
      icon: CheckCircle2, 
      action: "Xem kết quả", 
      path: "/quiz",
      color: "var(--color-notebook)",
      bg: "bg-emerald-500/10 text-emerald-600"
    },
  ];

  const springConfig: any = { type: "spring", damping: 20, stiffness: 100 };

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ...springConfig, delay: 0.1 }}
        className="group relative flex min-h-[300px] flex-col justify-between gap-8 overflow-hidden rounded-[24px] surface-2 p-8 transition-shadow hover:shadow-md"
      >
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#f5f5f7] px-3.5 py-1.5 text-xs font-bold tracking-widest uppercase text-[#86868b]">
            Notebook gần nhất
          </div>
          {latestNotebook ? (
            <>
              <h3 className="mt-6 flex max-w-lg items-center gap-3 text-2xl font-bold tracking-tight text-[#1d1d1f] sm:text-3xl">
                <BookOpen className="text-[var(--color-notebook)]" size={28} />
                {latestNotebook.title}
              </h3>
              <p className="mt-4 text-sm font-medium text-[#6e6e73] max-w-sm">
                Đang nghiên cứu <strong>{latestNotebook.subjectCode || "Chưa gán môn"}</strong> với {latestNotebook.documentCount} tài liệu đính kèm.
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-[#86868b]">
                Cập nhật: {new Date(latestNotebook.createdAt).toLocaleDateString()}
              </p>
            </>
          ) : (
            <div className="mt-8 text-sm font-medium text-[#6e6e73]">Bạn chưa có notebook nào.</div>
          )}
        </div>
        <button 
          onClick={() => navigate(latestNotebook ? `/notebooks/${latestNotebook.id}` : "/notebooks")} 
          className="inline-flex w-full sm:w-auto self-start items-center justify-center gap-2 rounded-full bg-[#1d1d1f] px-6 py-3.5 text-sm font-bold text-white transition-all hover:bg-black active:scale-95"
        >
          {latestNotebook ? "Tiếp tục học" : "Tạo notebook"} <ArrowRight size={16} />
        </button>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ...springConfig, delay: 0.2 }}
        className="rounded-[24px] surface-2 p-8 transition-shadow hover:shadow-md"
      >
        <div className="mb-6">
          <div className="text-xs font-bold uppercase tracking-[0.15em] text-[#86868b]">
            Nhiệm vụ hàng ngày
          </div>
          <h3 className="mt-1 text-2xl font-bold tracking-tight text-[#1d1d1f]">Tiếp tục học</h3>
        </div>
        
        <div className="space-y-4">
          {learningItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.button 
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                key={item.label} 
                onClick={() => navigate(item.path)} 
                className="group flex w-full items-center justify-between gap-4 rounded-[20px] surface-3 p-4 text-left text-[#1d1d1f] transition-all hover:shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className={`grid size-11 place-items-center rounded-full ${item.bg}`}>
                    <Icon size={18} style={{ color: item.color }} className={item.bg.includes('emerald') ? 'text-emerald-600' : ''} />
                  </div>
                  <div>
                    <span className="block text-sm font-bold tracking-tight text-[#1d1d1f] group-hover:text-black">{item.label}</span>
                    <span className="mt-0.5 block text-xs font-semibold text-[#86868b]">{item.action}</span>
                  </div>
                </div>
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#1d1d1f]/5 text-sm font-bold tabular-nums text-[#1d1d1f] transition-colors group-hover:bg-[#1d1d1f] group-hover:text-white">
                  {item.value}
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
