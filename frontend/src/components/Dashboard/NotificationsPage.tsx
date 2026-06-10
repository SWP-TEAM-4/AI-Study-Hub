import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, Search, X } from "lucide-react";
import "./NotificationsPage.css";

type Noti = {
  id: string;
  text: string;
  time: string;
  unread: boolean;
  kind?: "ai" | "system" | "market";
};

function formatEmpty(text: string) {
  return (
    <div className="np-empty">
      <div className="np-empty-icon">{text.slice(0, 1)}</div>
      <div className="np-empty-title">{text}</div>
      <div className="np-empty-sub">Chưa có dữ liệu để hiển thị.</div>
    </div>
  );
}

export default function NotificationsPage() {
  const [query, setQuery] = useState("");

  const [notifications, setNotifications] = useState<Noti[]>([
    { id: "1", text: "🤖 AI vừa tóm tắt xong tài liệu 'Calculus II'", time: "5 phút trước", unread: true, kind: "ai" },
    { id: "2", text: "🔥 Bạn vừa duy trì được Chuỗi học tập 5 ngày!", time: "2 giờ trước", unread: true, kind: "system" },
    { id: "3", text: "🏆 Jack Nicklson vừa vượt qua bạn trên Leaderboard", time: "1 ngày trước", unread: false, kind: "system" },
  ]);

  const unreadCount = useMemo(() => notifications.filter((n) => n.unread).length, [notifications]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notifications;
    return notifications.filter((n) => n.text.toLowerCase().includes(q) || n.time.toLowerCase().includes(q));
  }, [notifications, query]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  return (
    <motion.div className="np-wrap" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
      <div className="np-head">
        <div className="np-title">
          <div className="np-title-icon">
            <Bell size={18} />
          </div>
          <div>
            <h2>Thông báo</h2>
            <p>{unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : "Tất cả đều đã đọc"}</p>
          </div>
        </div>

        <div className="np-actions">
          <button className="np-cta" onClick={markAllRead} disabled={unreadCount === 0}>
            <CheckCheck size={16} /> Đọc tất cả
          </button>
        </div>
      </div>

      <div className="np-search">
        <Search size={16} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm theo nội dung hoặc thời gian..." />
        {query && (
          <button className="np-clear" onClick={() => setQuery("")} aria-label="Clear">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="np-list" role="list">
        {filtered.length === 0 ? (
          formatEmpty("Không có kết quả")
        ) : (
          <AnimatePresence>
            {filtered.map((n) => (
              <motion.div
                key={n.id}
                className={`np-item ${n.unread ? "unread" : ""}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.18 }}
                role="listitem"
              >
                <div className="np-dot" />
                <div className="np-item-body">
                  <div className="np-item-text">{n.text}</div>
                  <div className="np-item-meta">{n.time}</div>
                </div>
                {n.unread && <div className="np-unread-pill">NEW</div>}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}

