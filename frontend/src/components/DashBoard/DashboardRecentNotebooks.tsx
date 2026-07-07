import React from "react";
import { ArrowRight, Bell, BookMarked, Clock, Download, FileText, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { notebookService } from "../../services/notebookService";
import { notificationService } from "../../services/notificationService";
import { documentService } from "../../services/documentService";

const NOTEBOOK_COLORS = [
  { bg: "bg-blue-50", icon: "text-blue-600" },
  { bg: "bg-purple-50", icon: "text-purple-600" },
  { bg: "bg-emerald-50", icon: "text-emerald-600" },
  { bg: "bg-amber-50", icon: "text-amber-600" },
];

function relativeTime(value: string) {
  const date = new Date(value);
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
  if (minutes < 60) return `${minutes}m trước`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h trước`;
  if (minutes < 10080) return `${Math.floor(minutes / 1440)}d trước`;
  return date.toLocaleDateString("vi-VN");
}

export const DashboardRecentNotebooks = React.memo(function DashboardRecentNotebooks() {
  const navigate = useNavigate();
  const dataQuery = useQuery({
    queryKey: ["dashboardRecentData"],
    queryFn: async () => {
      const [notebooks, notifications, documents] = await Promise.all([
        notebookService.getNotebooks(0, 4),
        notificationService.getMyNotifications({ page: 0, size: 3, sort: "newest" }),
        documentService.getTopCommunityDocuments(),
      ]);
      return {
        notebooks: notebooks.data.items.slice(0, 4),
        notifications: notifications.data.items,
        documents: documents.data.items.slice(0, 3),
      };
    },
    staleTime: 60_000,
  });

  if (dataQuery.isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-96 bg-gray-100 rounded-3xl animate-pulse" />
        <div className="h-96 bg-gray-100 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (dataQuery.isError || !dataQuery.data) {
    return (
      <div className="bg-white rounded-3xl border border-gray-200 p-8 text-center">
        <p className="text-gray-600 font-medium">Không thể tải dữ liệu</p>
        <button
          onClick={() => dataQuery.refetch()}
          className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const { notebooks, notifications, documents } = dataQuery.data;

  return (
    <div className="space-y-6">
      {/* Notebooks & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notebooks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 overflow-hidden"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Notebook gần đây</h3>
            <button
              onClick={() => navigate("/notebooks")}
              className="text-sm font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors"
            >
              Xem tất cả
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="p-8">
            {notebooks.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
                Chưa có notebook nào
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {notebooks.map((notebook, idx) => {
                  const color = NOTEBOOK_COLORS[idx % NOTEBOOK_COLORS.length];
                  return (
                    <motion.button
                      key={notebook.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ y: -4 }}
                      onClick={() => navigate(`/notebooks/${notebook.id}`)}
                      className={`p-4 rounded-2xl text-left transition-all ${color.bg} hover:shadow-md`}
                    >
                      <div className={`w-10 h-10 rounded-lg ${color.bg} flex items-center justify-center mb-3`}>
                        <BookMarked size={18} className={color.icon} />
                      </div>
                      <p className="text-sm font-bold text-gray-900 truncate">{notebook.title}</p>
                      <p className="text-xs text-gray-600 mt-2">
                        {notebook.documentCount} tài liệu · {notebook.subjectCode || "Chưa gán môn"}
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-3xl border border-gray-200 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                <Bell size={18} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Thông báo</h3>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 flex-1 space-y-3">
            {notifications.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-gray-400 text-xs">
                Không có thông báo mới
              </div>
            ) : (
              notifications.map((notif) => (
                <motion.button
                  key={notif.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => navigate("/notifications")}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                        notif.isRead ? "bg-gray-300" : "bg-red-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 line-clamp-1">{notif.title}</p>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notif.content}</p>
                      <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1">
                        <Clock size={10} />
                        {relativeTime(notif.createdAt)}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Community Documents */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
              <Users size={18} className="text-teal-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Tài liệu cộng đồng</h3>
              <p className="text-xs text-gray-600 mt-1">Các tài liệu được bạn cộng đồng đánh giá cao</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/community")}
            className="text-sm font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors"
          >
            Xem tất cả
            <ArrowRight size={16} />
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 h-40 flex items-center justify-center text-gray-400 text-sm">
            Chưa có tài liệu nổi bật
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {documents.map((doc, idx) => (
              <motion.button
                key={doc.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -4 }}
                onClick={() => navigate("/community")}
                className="p-6 bg-white rounded-2xl border border-gray-200 text-left hover:shadow-lg transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center mb-4">
                  <FileText size={18} className="text-teal-600" />
                </div>
                <p className="text-sm font-bold text-gray-900 line-clamp-2 mb-2">{doc.title}</p>
                <p className="text-xs text-gray-600 line-clamp-2 mb-4">
                  {doc.description || "Tài liệu học tập chất lượng"}
                </p>
                <div className="border-t border-gray-200 pt-3 flex items-center justify-between text-[10px] text-gray-500 font-semibold">
                  <span className="flex items-center gap-1">
                    <Download size={10} />
                    {doc.downloadCount} tải
                  </span>
                  <span>{relativeTime(doc.createdAt)}</span>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
});