"use client";

import { useParams, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import AdminOverview from "../components/Admin/AdminOverview";
import AdminUsers from "../components/Admin/AdminUsers";
import AdminFeedbacks from "../components/Admin/AdminFeedbacks";
import AdminLogs from "../components/Admin/AdminLogs";
import AdminAcademicTab from "./AdminAcademicTab";
import AdminRolesTab from "./AdminRolesTab";
import AdminReportsTab from "./AdminReportsTab";
import AdminMarketplaceTab from "./AdminMarketplaceTab";
import AdminBadgesTab from "./AdminBadgesTab";
import AdminSystemConfigTab from "./AdminSystemConfigTab";
import AdminReputationTab from "./AdminReputationTab";
import { useAuthStore } from "../store/useAuthStore";
import { useCapabilities } from "../hooks/useCapabilities";

export default function AdminPage() {
  const { t } = useTranslation();
  const { tab } = useParams<{ tab: string }>();
  const { user } = useAuthStore();
  const userRole = user?.role ?? "STUDENT";
  const { data: capabilities } = useCapabilities();
  const isAdmin = userRole === "ADMIN";
  const canModerateReports = Boolean(capabilities?.canModerateReports);

  const renderTabContent = () => {
    if (!isAdmin && canModerateReports && tab !== "reports") {
      return <Navigate to="/admin/reports" replace />;
    }
    if (!isAdmin && !canModerateReports) {
      return <Navigate to="/dashboard" replace />;
    }

    switch (tab) {
      case "overview": return <AdminOverview />;
      case "users": return <AdminUsers />;
      case "feedbacks": return <AdminFeedbacks />;
      case "logs": return <AdminLogs />;
      case "academic": return <AdminAcademicTab />;
      case "roles": return <AdminRolesTab />;
      case "reports": return <div className="p-6"><AdminReportsTab /></div>;
      case "marketplace": return <div className="p-6"><AdminMarketplaceTab /></div>;
      case "badges": return <div className="p-6"><AdminBadgesTab /></div>;
      case "reputation": return <div className="p-6"><AdminReputationTab /></div>;
      case "system-configs": return <div className="p-6"><AdminSystemConfigTab /></div>;
      default: return <Navigate to="/admin/overview" replace />;
    }
  };

  return (
    <div className="space-y-6 app-shell-font w-full max-w-full overflow-y-auto h-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {/* ── HEADER & TAB BAR CONTROLS ── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-border/40 pb-4 w-full">
        <div className="flex items-center gap-2">
          <Shield className="text-primary animate-pulse" />
          <h1 className="text-1xl font-bold tracking-tight text-foreground">{t("admin.title")}</h1>
        </div>
      </div>

      {/* ── TAB CONTENT RENDERING WITH ANIMATION ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
        >
          {renderTabContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
