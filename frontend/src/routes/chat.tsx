import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Sparkles, FileText, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import mascot from "@/assets/mascot.png";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Hỏi AI — Stitch" },
      { name: "description", content: "Chat với AI dựa trên tài liệu trong notebook của bạn." },
    ],
  }),
  component: ChatPage,
});

type Msg = { id: string; role: "user" | "ai"; text: string; sources?: string[] };

const suggestions = [
  "Tóm tắt tài liệu 'Software Project — Lecture 01'",
  "Tạo 5 câu hỏi trắc nghiệm về Scrum",
  "Giải thích Definition of Done",
  "Đề cương ôn thi cuối kỳ SWP391",
];

function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "0",
      role: "ai",
      text: "Xin chào Khoa 👋 Mình là trợ lý AI của Stitch. Hỏi mình bất cứ điều gì về tài liệu trong notebook của bạn nhé!",
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const send = (text?: string) => {
    const value = (text ?? input).trim();
    if (!value) return;
    const userMsg: Msg = { id: Date.now().toString(), role: "user", text: value };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setThinking(true);

    setTimeout(() => {
      setThinking(false);
      const aiMsg: Msg = {
        id: Date.now().toString() + "ai",
        role: "ai",
        text:
          "Dựa trên tài liệu của bạn, mình có thể trả lời như sau:\n\n• Đây là phần phản hồi mẫu để minh họa luồng RAG.\n• Khi tích hợp backend, câu trả lời sẽ được tổng hợp từ các chunk tài liệu liên quan và kèm trích dẫn nguồn cụ thể.",
        sources: ["Software Project — Lecture 01.pdf", "Mock exam answers.pdf"],
      };
      setMessages((p) => [...p, aiMsg]);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto">
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="size-11 rounded-2xl bg-primary/10 text-primary grid place-items-center">
          <Bot size={20} />
        </div>
        <div>
          <h1 className="font-display text-xl font-semibold">Trợ lý AI</h1>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-success animate-pulse" /> Đang online · RAG từ 42 tài liệu
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 space-y-5 scrollbar-hidden">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`size-9 shrink-0 rounded-full grid place-items-center ${
                  m.role === "user" ? "bg-ink text-cream" : "bg-primary/10"
                }`}
              >
                {m.role === "user" ? <User size={16} /> : <img src={mascot} alt="" className="size-7" />}
              </div>
              <div className={`max-w-[80%] ${m.role === "user" ? "items-end" : "items-start"} flex flex-col gap-2`}>
                {m.role === "user" ? (
                  <div className="px-4 py-3 rounded-2xl bg-primary text-primary-foreground text-sm whitespace-pre-wrap">
                    {m.text}
                  </div>
                ) : (
                  <div className="text-foreground text-sm whitespace-pre-wrap leading-relaxed">{m.text}</div>
                )}
                {m.sources && (
                  <div className="flex flex-wrap gap-1.5">
                    {m.sources.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-accent text-accent-foreground"
                      >
                        <FileText size={11} /> {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {thinking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 items-center">
            <div className="size-9 rounded-full bg-primary/10 grid place-items-center">
              <img src={mascot} alt="" className="size-7" />
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
              <span>AI đang suy nghĩ</span>
              <span className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="size-1.5 rounded-full bg-primary"
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </span>
            </div>
          </motion.div>
        )}
        <div ref={endRef} />
      </div>

      {messages.length === 1 && (
        <div className="pb-3">
          <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
            <Sparkles size={12} /> Gợi ý nhanh
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="px-3 py-2 text-xs rounded-xl bg-card border border-border hover:border-primary/40 hover:bg-muted/50"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="pt-3 border-t border-border"
      >
        <div className="surface-card p-2 flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="Hỏi AI về tài liệu của bạn..."
            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none resize-none max-h-32"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="size-10 rounded-xl bg-primary text-primary-foreground grid place-items-center disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
