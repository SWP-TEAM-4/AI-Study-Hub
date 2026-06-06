import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, MessageSquare } from "lucide-react";

// Định nghĩa kiểu tin nhắn
interface Message {
    id: string;
    text: string;
    sender: "user" | "ai";
    time: string;
}

const robotAssistantImg = new URL('../../assets/robot-focus.png', import.meta.url).href;

export default function AIAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        { id: "1", text: "Xin chào! Mình là Trợ lý AI của bạn. Hôm nay bạn cần giúp gì nào? ✨", sender: "ai", time: "Bây giờ" }
    ]);

    const chatEndRef = useRef<HTMLDivElement>(null);

    // Tự động cuộn xuống tin nhắn mới nhất
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen]);

    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: input,
            sender: "user",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMsg]);
        setInput("");

        // Giả lập AI phản hồi sau 1 giây
        setTimeout(() => {
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: `Tôi đã nhận được yêu cầu: "${input}". Tính năng xử lý thông minh đang được kết nối! 🤖`,
                sender: "ai",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, aiMsg]);
        }, 1000);
    };

    return (
        <div className="ai-widget-container">
            {/* Khung Chat sử dụng AnimatePresence để đóng/mở mượt mà */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="ai-chat-window"
                    >
                        {/* Header Khung Chat */}
                        <div className="ai-chat-header">
                            <div className="ai-chat-profile">
                                <img src={robotAssistantImg} alt="AI Avatar" className="ai-chat-avatar" />
                                <div>
                                    <h4>Mia Assistant</h4>
                                    <span className="ai-status">🟢 Trực tuyến</span>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="ai-close-btn" aria-label="Close Chat">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Nội dung tin nhắn */}
                        <div className="ai-chat-messages">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`ai-message-wrapper ${msg.sender}`}>
                                    {msg.sender === "ai" && (
                                        <img src={robotAssistantImg} alt="AI" className="ai-msg-mini-avatar" />
                                    )}
                                    <div className={`ai-message-bubble ${msg.sender}`}>
                                        <p>{msg.text}</p>
                                        <span className="ai-message-time">{msg.time}</span>
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Ô nhập liệu chân trang */}
                        <div className="ai-chat-footer">
                            <input
                                type="text"
                                placeholder="Nhập câu hỏi tại đây..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            />
                            <button onClick={handleSend} className="ai-send-btn" aria-label="Send message">
                                <Send size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Nút Tròn Robot nổi ở góc màn hình */}
            {!isOpen && (
                <motion.button
                    onClick={() => setIsOpen(true)}
                    className="ai-floating-button"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    aria-label="Open AI Assistant"
                >
                    <img src={robotAssistantImg} alt="AI Robot" className="ai-btn-img" />
                    <div className="ai-notification-badge" />
                </motion.button>
            )}
        </div>
    );
}