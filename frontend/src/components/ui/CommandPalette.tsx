import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, FileText, BookOpen, User, Settings, Command } from "lucide-react";
import { useCommandPalette } from "@/hooks/useCommandPalette";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function CommandPalette() {
  const { isOpen, close } = useCommandPalette();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Toggle with Ctrl+K or Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        useCommandPalette.getState().toggle();
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  // Mock data for search
  const routes = [
    { id: "home", title: "Trang chủ", icon: <Command size={16} />, path: "/" },
    { id: "community", title: "Cộng đồng (Marketplace)", icon: <User size={16} />, path: "/community" },
    { id: "notebooks", title: "Sổ tay học tập", icon: <BookOpen size={16} />, path: "/notebooks" },
    { id: "documents", title: "Tài liệu", icon: <FileText size={16} />, path: "/documents" },
    { id: "settings", title: "Cài đặt", icon: <Settings size={16} />, path: "/settings" },
  ];

  const filtered = query
    ? routes.filter((r) => r.title.toLowerCase().includes(query.toLowerCase()))
    : routes;

  const handleSelect = (path: string) => {
    navigate({ to: path });
    close();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm"
            onClick={close}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-x-0 top-[15vh] z-[101] mx-auto w-full max-w-2xl px-4"
          >
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
              <div className="flex items-center border-b border-border px-4">
                <Search className="text-muted-foreground mr-3" size={20} />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm kiếm tài liệu, thư mục, công cụ... (Ctrl+K)"
                  className="w-full bg-transparent py-4 text-base outline-none placeholder:text-muted-foreground"
                />
                <kbd className="hidden sm:inline-block pointer-events-none rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  ESC
                </kbd>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
                {filtered.length > 0 ? (
                  <div className="space-y-1">
                    {filtered.map((item, i) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item.path)}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm hover:bg-primary/10 hover:text-primary transition-colors outline-none focus-ring"
                      >
                        <span className="text-muted-foreground group-hover:text-primary">
                          {item.icon}
                        </span>
                        <span>{item.title}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-14 text-center text-sm text-muted-foreground">
                    Không tìm thấy kết quả nào.
                  </div>
                )}
              </div>
              
              <div className="border-t border-border bg-muted/50 px-4 py-3 text-xs text-muted-foreground flex justify-between">
                <span>Dùng phím <kbd className="font-mono font-bold">↑</kbd> <kbd className="font-mono font-bold">↓</kbd> để di chuyển</span>
                <span>Nhấn <kbd className="font-mono font-bold">Enter</kbd> để chọn</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
