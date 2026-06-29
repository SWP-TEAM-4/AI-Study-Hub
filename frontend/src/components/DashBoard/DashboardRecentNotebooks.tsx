import React from "react";
import { BookMarked, Bell, Users, GraduationCap, FileText, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { notebooks } from "../../lib/mock-data";
import EmptyState from "../ui/EmptyState";

const communityHighlights = [
  { title: "Đề thi thử Java OOP (PRJ301) Final", desc: "Bộ đề ôn tập 40 câu trắc nghiệm chuẩn kết quả thi cử.", author: "Minh FPT", downloads: "2.3k", icon: GraduationCap, color: "text-amber-500 bg-amber-500/10" },
  { title: "Machine Learning Cheat Sheet - Kỳ 5", desc: "Tổng hợp toàn bộ công thức mô hình dự báo chương 1-8.", author: "Anh Khoa", downloads: "4.5k", icon: FileText, color: "text-primary bg-primary/10" },
  { title: "Software Testing Mock Test - SWT301", desc: "Câu hỏi tình huống Unit Test & Integration Test cực sát.", author: "Sam Bennet", downloads: "1.2k", icon: BookOpen, color: "text-purple-500 bg-purple-500/10" }
];

const notifications = [
  { id: 1, text: "AI đã tạo 20 Flashcards mới môn Machine Learning", time: "10 phút trước", action: "Học ngay", link: "/flashcards" },
  { id: 2, text: "Lửa streak 5 ngày của bạn sắp tắt! Luyện 1 bài Quiz ngay", time: "2 giờ trước", action: "Ôn tập", link: "/quiz" },
  { id: 3, text: "Bạn học Minh đã chia sẻ bộ notebook Java OOP mới", time: "Hôm qua", action: "Xem", link: "/community" },
];

export const DashboardRecentNotebooks = React.memo(function DashboardRecentNotebooks() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Thư mục & Thông báo */}
      <section className="grid lg:grid-cols-3 gap-5">
        <div className="surface-card p-6 lg:col-span-2 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display text-base font-bold text-foreground">Thư mục vừa mở</h3>
            <button 
              onClick={() => navigate("/notebooks")} 
              className="text-xs text-primary font-bold cursor-pointer hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
              aria-label="Xem tất cả thư mục"
            >
              Xem tất cả
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {notebooks.length === 0 ? (
              <div className="col-span-full">
                <EmptyState 
                  title="Chưa có Notebook nào"
                  description="Hãy tạo notebook đầu tiên để sắp xếp tài liệu."
                  actionText="Tạo Notebook"
                  actionHref="/notebooks"
                />
              </div>
            ) : notebooks.slice(0, 4).map((nb) => (
              <button
                key={nb.id}
                onClick={() => navigate("/notebooks")}
                className="block w-full p-4 rounded-xl border border-border/80 hover:border-primary/50 hover:bg-muted/20 transition-all bg-card cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`Mở thư mục ${nb.title}`}
              >
                <div
                  className="size-10 rounded-lg mb-3 grid place-items-center"
                  style={{ background: `var(--color-primary)`, opacity: 0.8, color: "var(--color-primary-foreground)" }}
                  aria-hidden="true"
                >
                  <BookMarked size={18} />
                </div>
                <div className="font-semibold truncate text-sm text-foreground">{nb.title}</div>
                <div className="text-xs text-muted-foreground mt-1 font-medium">
                  {nb.docs} tài liệu · {nb.cards} flashcard
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Thông báo học tập */}
        <div className="surface-card p-6 rounded-2xl border border-border shadow-sm text-left">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display text-base font-bold flex items-center gap-2 text-foreground">
              <Bell size={18} className="text-primary" aria-hidden="true" /> Thông báo học tập
            </h3>
            <button 
              onClick={() => navigate("/notifications")} 
              className="text-xs text-primary font-bold cursor-pointer hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
              aria-label="Xem tất cả thông báo"
            >
              Tất cả
            </button>
          </div>
          <ul className="space-y-4 text-left">
            {notifications.map((n) => (
              <li key={n.id} className="flex gap-3 items-start">
                <div className="size-2 mt-1.5 rounded-full bg-primary shrink-0" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs leading-snug font-medium text-foreground">{n.text}</div>
                  <div className="text-[10px] text-muted-foreground mt-1 font-semibold flex items-center gap-2">
                    <span>{n.time}</span>
                    <button 
                      onClick={() => navigate(n.link)}
                      className="text-primary font-bold hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                      aria-label={`${n.action}: ${n.text}`}
                    >
                      {n.action}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Tiêu điểm chia sẻ cộng đồng */}
      <section className="space-y-4">
        <div className="text-left">
          <h3 className="font-display text-base font-bold flex items-center gap-2 text-foreground">
            <Users size={18} className="text-primary" aria-hidden="true" /> Tiêu điểm chia sẻ cộng đồng
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Tài liệu, bài viết nổi bật được chia sẻ rộng rãi tuần này.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 text-left">
          {communityHighlights.map((item) => {
            const Icon = item.icon;
            return (
              <button 
                key={item.title} 
                onClick={() => navigate("/community")}
                className="group p-5 rounded-xl border border-border/80 hover:border-primary/50 bg-card cursor-pointer transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary block w-full"
                aria-label={`Xem tài liệu: ${item.title}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${item.color}`} aria-hidden="true">
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">{item.title}</h4>
                    <span className="text-xs text-muted-foreground font-medium">Tác giả: {item.author}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {item.desc}
                </p>
                <div className="mt-4 flex justify-between items-center text-xs text-muted-foreground font-semibold pt-3 border-t border-border/50">
                  <span>{item.downloads} lượt tải</span>
                  <span className="text-primary font-bold group-hover:underline">Xem ngay</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
});
