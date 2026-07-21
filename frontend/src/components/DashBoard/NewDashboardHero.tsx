"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { userService } from "../../services/userService";
import { motion } from "framer-motion";
import { SkeletonCard } from "../ui/SkeletonCard";
import { BookOpen, FileText, Sparkles, LayoutDashboard, Clock } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export function NewDashboardHero() {
  const navigate = useNavigate();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["dashboardHero"],
    queryFn: async () => {
      const [profile] = await Promise.all([userService.getMyProfile()]);
      return { profile: profile.data };
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <SkeletonCard />;

  const fullName = dashboardData?.profile?.fullName || "Student FPT";

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full bg-white rounded-3xl border border-slate-200 shadow-sm p-8 relative overflow-hidden"
    >
      {/* Decorative Background Element */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-red-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />

      <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
        
        {/* Left: Greeting & Quick Stats */}
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 border border-red-100 text-red-600 text-xs font-bold uppercase tracking-widest">
            <Sparkles size={14} /> FPT Scholar Portal
          </div>
          
          <div>
            <h1 className="text-5xl font-extrabold text-slate-900 leading-tight tracking-tighter">
              Chào ngày mới, <br />
              <span className="text-red-600">{fullName.split(" ").pop()}</span>!
            </h1>
            <p className="text-slate-500 text-lg mt-2">Sẵn sàng để bắt đầu công việc hôm nay chưa?</p>
          </div>

          {/* Quick Stats Section */}
          <div className="flex gap-6 pt-4 border-t border-slate-100">
            <div>
              <p className="text-2xl font-bold text-slate-900">3</p>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Đang học</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">12</p>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Tài liệu</p>
            </div>
          </div>
        </motion.div>

        {/* Right: Focused Actions */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
          <ActionCard 
            title="Notebooks" 
            desc="Ghi chú của bạn"
            icon={<BookOpen size={24} />}
            onClick={() => navigate("/notebooks")}
          />
          <ActionCard 
            title="Documents" 
            desc="Tài liệu môn học"
            icon={<FileText size={24} />}
            onClick={() => navigate("/documents")}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

function ActionCard({ title, desc, icon, onClick }: { title: string, desc: string, icon: React.ReactNode, onClick: () => void }) {
  return (
    <motion.button 
      whileHover={{ scale: 1.03, y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group p-6 bg-slate-50 hover:bg-white border border-slate-100 hover:border-red-200 rounded-3xl text-left transition-all hover:shadow-xl hover:shadow-red-500/10"
    >
      <div className="mb-6 p-3 bg-white w-fit rounded-2xl shadow-sm group-hover:text-red-600 transition-colors">
        {icon}
      </div>
      <h3 className="font-bold text-lg text-slate-900 group-hover:text-red-600">{title}</h3>
      <p className="text-sm text-slate-500 mt-1">{desc}</p>
    </motion.button>
  );
}