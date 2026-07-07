"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, GraduationCap, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { userService } from "../../services/userService";
import { motion } from "framer-motion";

export function DashboardHero() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const springConfig: any = { type: "spring", damping: 20, stiffness: 100 };

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["dashboardHero"],
    queryFn: async () => {
      const [profile, aiUsage, tests] = await Promise.all([
        userService.getMyProfile(),
        userService.getMyAIUsage(),
        userService.getMyTestHistory({ page: 0, size: 1, sort: "newest" }),
      ]);
      return { profile: profile.data, aiUsage: aiUsage.data, testCount: tests.data.totalElements };
    },
    staleTime: 5 * 60 * 1000,
  });

  const profile = dashboardData?.profile;
  const userName = profile?.fullName?.split(" ")?.pop() || "bạn";
  const fullName = profile?.fullName || "";
  const avatarUrl = profile?.avatarUrl || null;
  const initials = fullName
    ? fullName
        .trim()
        .split(" ")
        .filter(Boolean)
        .map((word: string) => word[0])
        .slice(-2)
        .join("")
        .toUpperCase()
    : "U";

  const stats = [
    { label: "Điểm uy tín", value: profile?.reputationPoints ?? 0, color: "bg-yellow-50 text-yellow-600" },
    { label: "Lượt làm bài", value: dashboardData?.testCount ?? 0, color: "bg-blue-50 text-blue-600" },
    { label: "Tương tác AI", value: dashboardData?.aiUsage.totalRequests ?? 0, color: "bg-purple-50 text-purple-600" },
  ];

  const telemetry = [
    profile?.currentSemesterName || profile?.currentSemesterCode,
    profile?.comboName || profile?.comboCode,
    profile?.role,
  ].filter((item): item is string => Boolean(item));

  return (
    <section className="bg-white rounded-3xl border border-gray-200 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
        {/* Left Content */}
        <div className="lg:col-span-2 p-12 flex flex-col justify-between">
          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-sm font-semibold text-gray-500 mb-6">
              {profile?.currentSemesterCode || "Learning Journey"}
            </p>
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              {isLoading ? (
                <span className="inline-block w-96 h-16 bg-gray-200 rounded-xl animate-pulse" />
              ) : (
                <>
                  Chào mừng trở lại
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    {userName === "User" ? "bạn" : userName}
                  </span>
                </>
              )}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
              Tiếp tục hành trình học tập của bạn. Luyện tập với quiz hoặc mở sổ tay để ôn tập.
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-wrap gap-3 mt-8"
          >
            <button
              onClick={() => navigate("/quiz")}
              className="px-8 py-3 bg-gray-900 text-white rounded-full font-semibold hover:bg-black transition-colors flex items-center gap-2"
            >
              <GraduationCap size={18} />
              Luyện tập
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate("/notebooks")}
              className="px-8 py-3 bg-gray-100 text-gray-900 rounded-full font-semibold hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <BookOpen size={18} />
              Sổ tay
            </button>
            <button
              onClick={() => navigate("/community")}
              className="px-8 py-3 bg-gray-100 text-gray-900 rounded-full font-semibold hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <Users size={18} />
              Cộng đồng
            </button>
          </motion.div>
        </div>

        {/* Right Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gradient-to-br from-gray-50 to-gray-100 p-12 flex flex-col justify-between border-l border-gray-200 lg:border-l-0"
        >
          {/* Header */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Hồ sơ</p>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">{fullName || "MindSpace"}</h2>

            {/* Avatar */}
            <div className="w-32 h-32 rounded-2xl bg-white shadow-lg flex items-center justify-center mb-8 mx-auto lg:mx-0">
              <div className="w-28 h-28 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white text-4xl font-bold flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
            </div>
          </div>

          {/* Info Badges */}
          <div className="space-y-2">
            {telemetry.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-2">Chưa cập nhật thông tin</p>
            ) : (
              telemetry.map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between bg-white rounded-lg px-3 py-2 text-xs font-semibold text-gray-900 shadow-sm"
                >
                  <span>{item}</span>
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="border-t border-gray-200 grid grid-cols-3 divide-x divide-gray-200">
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="p-8 text-center"
          >
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {Number(stat.value).toLocaleString()}
            </div>
            <div className="text-sm font-medium text-gray-600">{stat.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}