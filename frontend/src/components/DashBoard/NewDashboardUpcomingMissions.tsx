"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { userService } from "../../services/userService";
import { CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { SkeletonCard } from "../ui/SkeletonCard";

export function NewDashboardUpcomingMissions() {
  const navigate = useNavigate();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["dashboardMissions"],
    queryFn: async () => {
      const [aiUsage, tests] = await Promise.all([
        userService.getMyAIUsage(),
        userService.getMyTestHistory({ page: 0, size: 10, sort: "newest" }),
      ]);
      return { aiUsage: aiUsage.data, testCount: tests.data.totalElements };
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return <SkeletonCard />;
  }

  // Determine actual status based on API data
  const hasDoneQuizToday = dashboardData?.testCount && dashboardData.testCount > 0;
  const hasAskedAIToday = dashboardData?.aiUsage && (dashboardData.aiUsage as any).usedRequests > 0;

  const plannerTasks = [
    {
      id: "quiz",
      title: "Luyện tập AI Quiz Chapter 4",
      status: hasDoneQuizToday ? "Done" : "To Do",
      badgeColor: hasDoneQuizToday ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      path: "/quiz"
    },
    {
      id: "flashcards",
      title: "Ôn tập Flashcard chuyên ngành (SE)",
      status: "To Do",
      badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      path: "/flashcards"
    },
    {
      id: "ai_chat",
      title: "Giải đáp thắc mắc với Trợ lý AI",
      status: hasAskedAIToday ? "Done" : "Urgent",
      badgeColor: hasAskedAIToday ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      path: "/chat"
    }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-extrabold text-slate-800 dark:text-white font-serif flex items-center gap-2.5">
          <svg className="w-6 h-6 text-[#3B82F6] shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="18" height="18" rx="5" fill="#3B82F6" fillOpacity="0.15" stroke="currentColor" strokeWidth="2.5"/>
            <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Semester Planner
        </h3>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        {plannerTasks.map((task) => (
          <div
            key={task.id}
            onClick={() => navigate(task.path)}
            className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              {task.status === "Done" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : task.status === "Urgent" ? (
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-amber-500 shrink-0" />
              )}
              <span className={`text-[14px] font-bold text-slate-700 dark:text-slate-200 ${task.status === "Done" ? "line-through text-slate-400 dark:text-slate-500" : ""}`}>
                {task.title}
              </span>
            </div>
            
            <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${task.badgeColor}`}>
              {task.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
