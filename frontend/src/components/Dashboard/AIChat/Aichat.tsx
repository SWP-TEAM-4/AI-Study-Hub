import React, { useState, useEffect, useRef } from "react";
import {
  Plus, MessageSquare, Trash2, Send, 
  Bot, User, CheckCircle2
} from "lucide-react";
// 🎯 Đã import thêm Variants để ép kiểu định nghĩa hiệu ứng chuẩn chỉnh
import { motion, AnimatePresence, Variants } from "framer-motion";
import "./AIChat.css";

/* ==========================================================================
   ✨ TYPES & INTERFACES
   ========================================================================== */
interface Citation {
  sourceDoc: string;
  page?: number;
  snippet: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  citations?: Citation[];
}

interface ChatSession {
  id: string;
  title: string;
  updatedAt: Date;
  attachedDocId?: string;
}

interface DocumentSource {
  id: string;
  name: string;
  type: "pdf" | "docx" | "txt";
  size: string;
}

/* ==========================================================================
   ✨ ĐỊNH NGHĨA CÁC BIẾN ANIMATION (ĐÃ FIX LỖI TYPING)
   ========================================================================== */
const messageVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 350, damping: 25 }
  },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
};

const citationVariants: Variants = {
  hidden: { opacity: 0, height: 0, scaleY: 0.8 },
  visible: { 
    opacity: 1, 
    height: "auto",
    scaleY: 1,
    transition: { type: "spring", stiffness: 400, damping: 30 } 
  },
};

const dotVariants: Variants = {
  initial: { opacity: 0.4 },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.6,
      repeat: Infinity,
      repeatType: "reverse",
      staggerChildren: 0.15,
    },
  },
};

const dotChildVariants: Variants = {
  initial: { y: 0 },
  animate: { y: -3 },
};

/* ==========================================================================
   📦 MOCK DATA
   ========================================================================== */
const MOCK_DOCUMENTS: DocumentSource[] = [
  { id: "doc-1", name: "Neural Networks — Lecture 04.pdf", type: "pdf", size: "2.4 MB" },
  { id: "doc-2", name: "Calculus II Final Cheatsheet.pdf", type: "pdf", size: "1.1 MB" },
  { id: "doc-3", name: "Ethics in AI — Research Paper.docx", type: "docx", size: "850 KB" },
];

const MOCK_INITIAL_CHATS: ChatSession[] = [
  { id: "chat-1", title: "Giải thích kiến trúc CNN", updatedAt: new Date(), attachedDocId: "doc-1" },
  { id: "chat-2", title: "Tính tích phân Riemann", updatedAt: new Date(Date.now() - 3600000), attachedDocId: "doc-2" },
];

export function AIChat() {
  const [sessions, setSessions] = useState<ChatSession[]>(MOCK_INITIAL_CHATS);
  const [activeSessionId, setActiveSessionId] = useState<string>("chat-1");
  const [messages, setMessages] = useState<Record<string, Message[]>>({
    "chat-1": [
      {
        id: "m1",
        role: "assistant",
        content: "Xin chào! Tôi đã nạp tài liệu ngữ cảnh. Hãy đặt câu hỏi bất kỳ!",
        timestamp: new Date(),
      }
    ],
    "chat-2": [
      {
        id: "m2",
        role: "assistant",
        content: "Tôi sẵn sàng hỗ trợ giải toán Calculus II dựa trên Cheatsheet.",
        timestamp: new Date(),
      }
    ]
  });
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeSessionId, isLoading]);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const currentMessages = messages[activeSessionId] || [];

  const handleCreateNewChat = () => {
    const newId = `chat-${Date.now()}`;
    const newChat: ChatSession = {
      id: newId,
      title: "Cuộc hội thoại mới",
      updatedAt: new Date(),
      attachedDocId: selectedDocId || undefined
    };
    
    setSessions([newChat, ...sessions]);
    setMessages({
      ...messages,
      [newId]: [
        {
          id: `m-${Date.now()}`,
          role: "assistant",
          content: selectedDocId 
            ? `Hệ thống đã sẵn sàng với tài liệu [${MOCK_DOCUMENTS.find(d => d.id === selectedDocId)?.name}]. Hãy đặt câu hỏi!`
            : "Xin chào! Bạn cần tôi giúp gì hôm nay?",
          timestamp: new Date()
        }
      ]
    });
    setActiveSessionId(newId);
  };

  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    
    const updatedMsgs = { ...messages };
    delete updatedMsgs[id];
    setMessages(updatedMsgs);

    if (activeSessionId === id && updated.length > 0) {
      setActiveSessionId(updated[0].id);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userPrompt = inputValue.trim();
    setInputValue("");

    const userMessage: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: userPrompt,
      timestamp: new Date()
    };

    setMessages(prev => ({
      ...prev,
      [activeSessionId]: [...(prev[activeSessionId] || []), userMessage]
    }));

    if (currentMessages.length <= 1) {
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, title: userPrompt.substring(0, 24) + "..." } : s));
    }

    setIsLoading(true);

    setTimeout(() => {
      const activeDoc = MOCK_DOCUMENTS.find(d => d.id === (activeSession?.attachedDocId || selectedDocId));
      let aiResponse = "Tôi đã tiếp nhận câu hỏi. Tôi sẽ trả lời dựa trên kiến thức chung.";
      let citations: Citation[] = [];

      if (activeDoc) {
        aiResponse = `Dựa trên tài liệu "${activeDoc.name}", các lớp mạng được lan truyền ngược (Backpropagation).`;
        citations = [
          {
            sourceDoc: activeDoc.name,
            page: 4,
            snippet: "Lan truyền ngược sử dụng đạo hàm riêng của hàm mất mát để cập nhật trọng số..."
          }
        ];
      }

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
        citations: citations.length > 0 ? citations : undefined
      };

      setMessages(prev => ({
        ...prev,
        [activeSessionId]: [...(prev[activeSessionId] || []), aiMessage]
      }));
      setIsLoading(false);
    }, 1800);
  };

  return (
    <div className="ai-chat-container">
      
      {/* PANEL TRÁI */}
      <div className="ai-chat-sidebar">
        <motion.button 
          onClick={handleCreateNewChat} 
          className="new-chat-btn"
          whileHover={{ scale: 1.03, backgroundColor: "#1e4a7a" }}
          whileTap={{ scale: 0.97 }}
        >
          <Plus size={16} /> Tạo Chat Mới
        </motion.button>

        <div className="section-doc">
          <div className="section-title">📚 Nguồn Kiến Thức (RAG)</div>
          <select 
            value={selectedDocId} 
            onChange={(e) => {
              setSelectedDocId(e.target.value);
              if (activeSession) {
                setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, attachedDocId: e.target.value || undefined } : s));
              }
            }}
            className="select-doc"
          >
            <option value="">-- Dùng kiến thức chung AI --</option>
            {MOCK_DOCUMENTS.map(doc => (
              <option key={doc.id} value={doc.id}>📄 {doc.name}</option>
            ))}
          </select>
          {selectedDocId && (
            <div className="rag-badge">
              <CheckCircle2 size={12} color="#10b981" /> Đã nạp Vector DB thành công
            </div>
          )}
        </div>

        <div className="history-container">
          <div className="section-title">💬 Các cuộc hội thoại gần đây</div>
          <AnimatePresence initial={false}>
            {sessions.map(s => (
              <motion.div 
                key={s.id} 
                layout
                onClick={() => setActiveSessionId(s.id)}
                className={`chat-row ${s.id === activeSessionId ? "active" : ""}`}
                whileHover={{ x: 4, backgroundColor: s.id === activeSessionId ? "#e2e8f0" : "#e0e7ff" }}
                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
              >
                <div className="chat-row-left">
                  <MessageSquare size={16} style={{ marginRight: 8, color: "#64748b" }} />
                  <span className="chat-row-title">{s.title}</span>
                </div>
                <motion.button 
                  onClick={(e) => handleDeleteChat(s.id, e)} 
                  className="delete-btn"
                  whileHover={{ scale: 1.2, color: "#ef4444" }}
                >
                  <Trash2 size={14} />
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* PANEL PHẢI */}
      <div className="main-chat">
        <div className="chat-header">
          <div>
            <div className="header-title">{activeSession?.title || "AI Assistant"}</div>
            <div className="header-subtitle">
              {activeSession?.attachedDocId ? (
                <span className="active-ctx">
                  🎯 Đang dùng ngữ cảnh: {MOCK_DOCUMENTS.find(d => d.id === activeSession.attachedDocId)?.name}
                </span>
              ) : "🌐 Chế độ hội thoại tự do"}
            </div>
          </div>
        </div>

        <div className="message-list">
          <AnimatePresence initial={false}>
            {currentMessages.map((msg) => (
              <motion.div 
                key={msg.id} 
                layout
                className={`message-wrapper ${msg.role === "user" ? "user" : "assistant"}`}
                initial="hidden"    
                animate="visible"
                exit="exit"
                variants={messageVariants}
              >
                {msg.role === "assistant" && (
                  <div className="avatar-bot"><Bot size={16} color="#fff" /></div>
                )}
                
                <div className="message-container">
                  <div className={`bubble ${msg.role}`}>
                    {msg.content}
                  </div>

                  {msg.role === "assistant" && msg.citations && (
                    <motion.div 
                      className="citation-box"
                      initial="hidden"
                      animate="visible"
                      variants={citationVariants}
                      style={{ originY: 0 }}
                    >
                      <div className="citation-header">📌 Nguồn trích dẫn tài liệu:</div>
                      {msg.citations.map((cite, index) => (
                        <div key={index} className="citation-item">
                          <strong>{cite.sourceDoc} (Trang {cite.page})</strong>: 
                          <em>"{cite.snippet}"</em>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="avatar-user"><User size={16} color="#fff" /></div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* HIỆU ỨNG CHẤM NHẤP NHÁY (TYPING) */}
          {isLoading && (
            <motion.div layout className="message-wrapper assistant">
              <div className="avatar-bot"><Bot size={16} color="#fff" /></div>
              <motion.div 
                className="typing-indicator"
                initial="initial"
                animate="animate"
                variants={dotVariants}
              >
                {[...Array(3)].map((_, i) => (
                  <motion.span key={i} className="typing-dot" variants={dotChildVariants} />
                ))}
              </motion.div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="input-area">
          <div className="input-container">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={activeSession?.attachedDocId ? "Hỏi bất kỳ điều gì về tài liệu..." : "Nhập câu hỏi tại đây..."}
              className="chat-input"
              disabled={isLoading}
            />
            <motion.button 
              type="submit" 
              disabled={!inputValue.trim() || isLoading} 
              className="send-btn"
              whileHover={!isLoading ? { scale: 1.08, backgroundColor: "#1e4a7a" } : {}}
              whileTap={!isLoading ? { scale: 0.92 } : {}}
            >
              <Send size={18} />
            </motion.button>
          </div>
        </form>
      </div>

    </div>
  );
}