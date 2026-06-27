"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, Search, Bot, Trophy, ShoppingBag, MessageCircle, Trash2 } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { notificationService, NotificationDTO } from "../services/notificationService";
import { Notify } from "notiflix";

const iconMap = {
  ai: { Icon: Bot, tint: "165" },
  system: { Icon: Trophy, tint: "35" },
  market: { Icon: ShoppingBag, tint: "200" },
  social: { Icon: MessageCircle, tint: "250" },
} as const;

export default function NotificationsPage() {
  const [list, setList] = useState<NotificationDTO[]>([]);
  const [q, setQ] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await notificationService.getMyNotifications({ page: 0, size: 50 });
      if (res.success) setList(res.data.items);
    } catch (e: any) {
      Notify.failure(e.message || "Lỗi tải thông báo");
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = useMemo(
    () => list.filter((n) => n.content.toLowerCase().includes(q.toLowerCase()) || n.title.toLowerCase().includes(q.toLowerCase())),
    [list, q],
  );
  const unread = list.filter((n) => !n.isRead).length;

  const handleMarkAllAsRead = async () => {
    try {
      const res = await notificationService.markAllAsRead();
      if (res.success) {
        setList((p) => p.map((n) => ({ ...n, isRead: true })));
        Notify.success("Đã đánh dấu đọc tất cả");
      }
    } catch (e: any) {
      Notify.failure(e.message || "Lỗi cập nhật");
    }
  };

  const handleMarkAsRead = async (id: number) => {
    const item = list.find(n => n.id === id);
    if (item?.isRead) return;

    try {
      const res = await notificationService.markAsRead(id);
      if (res.success) {
        setList((p) => p.map((x) => (x.id === id ? { ...x, isRead: true } : x)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await notificationService.deleteNotification(id);
      if (res.success) {
        setList((p) => p.filter(n => n.id !== id));
        Notify.success("Đã xóa thông báo");
      }
    } catch (e: any) {
      Notify.failure(e.message || "Lỗi xóa");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="text-primary" /> Thông báo
          </h1>
          <p className="text-muted-foreground mt-1">
            {unread > 0 ? `${unread} chưa đọc` : "Tất cả đã đọc"}
          </p>
        </div>
        <button
          disabled={unread === 0}
          onClick={handleMarkAllAsRead}
          className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 transition-opacity"
        >
          <CheckCheck size={16} /> Đọc tất cả
        </button>
      </div>

      {/* Search */}
      <div className="surface-card p-3 relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm thông báo..."
          className="w-full pl-10 pr-3 h-10 rounded-xl bg-muted/60 border border-transparent focus:bg-card focus:border-primary outline-none text-sm"
        />
      </div>

      {/* List */}
      <div className="space-y-3">
        <AnimatePresence>
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">
              <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Đang tải...
            </div>
          ) : filtered.map((n) => {
            let kind: "ai" | "system" | "market" | "social" = "system";
            if (n.title.toLowerCase().includes("tài liệu") || n.title.toLowerCase().includes("marketplace")) kind = "market";
            if (n.content.toLowerCase().includes("ai") || n.title.toLowerCase().includes("ai")) kind = "ai";
            if (n.title.toLowerCase().includes("bình luận") || n.content.toLowerCase().includes("đánh giá")) kind = "social";
            
            const meta = iconMap[kind];
            const Icon = meta.Icon;
            
            return (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                onClick={() => handleMarkAsRead(n.id)}
                className={`surface-card p-5 flex gap-4 cursor-pointer group relative overflow-hidden transition-all duration-200 hover:shadow-sm ${
                  !n.isRead ? "border-primary/40 bg-primary/5" : ""
                }`}
              >
                {/* Khối Icon phân loại bên trái */}
                <div
                  className="size-11 shrink-0 rounded-xl grid place-items-center"
                  style={{
                    background: `oklch(0.55 0.14 ${meta.tint} / 0.15)`,
                    color: `oklch(0.45 0.14 ${meta.tint})`,
                  }}
                >
                  <Icon size={20} />
                </div>

                {/* Khối chữ và nội dung */}
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  
                  {/* Hàng 1: Tiêu đề & Cụm thời gian + Chấm xanh bên phải */}
                  <div className="flex items-center justify-between gap-4 w-full">
                    <h3 className="text-sm sm:text-base font-bold text-foreground leading-tight truncate">
                      {n.title}
                    </h3>
                    
                    <div className="flex items-center gap-2.5 shrink-0 select-none">
                      <span className="text-xs text-muted-foreground/80 font-medium whitespace-nowrap">
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                      {!n.isRead && <span className="size-2 rounded-full bg-primary shrink-0 animate-pulse" />}
                    </div>
                  </div>

                  {/* Hàng 2: Nội dung (pr-10 để chữ tự xuống dòng né nút xóa ra) */}
                  <p className="text-sm leading-relaxed text-foreground/80 break-words mt-0.5 pr-10">
                    {n.content}
                  </p>
                </div>

                {/* 🎯 NÚT DELETE: Đã chuyển xuống góc dưới bên phải cố định */}
                <button 
                  onClick={(e) => handleDelete(n.id, e)}
                  className="absolute right-5 bottom-5 p-1.5 rounded-lg text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 z-20"
                  title="Xóa thông báo"
                >
                  <Trash2 size={15} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">Không có thông báo nào.</div>
        )}
      </div>
    </div>
  );
}