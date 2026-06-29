import React, { useRef, useState } from "react";
import { X, FileText, Maximize2, Download, Edit3, Sparkles, Loader2, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Notify } from "notiflix";

export interface DocumentViewerPaneProps {
  documentTitle: string;
  onClose: () => void;
  viewerRef?: React.RefObject<HTMLDivElement | null>;
}

export default function DocumentViewerPane({ documentTitle, onClose, viewerRef }: DocumentViewerPaneProps) {
  const [activeTab, setActiveTab] = useState<"none" | "note" | "ai">("none");
  const [noteContent, setNoteContent] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [outlineContent, setOutlineContent] = useState<string | null>(null);

  const handleSaveNote = () => {
    setIsSavingNote(true);
    setTimeout(() => {
      setIsSavingNote(false);
      Notify.success("Đã lưu ghi chú cá nhân");
    }, 800);
  };

  const handleGenerateOutline = () => {
    setIsGeneratingOutline(true);
    setOutlineContent(null);
    setTimeout(() => {
      setIsGeneratingOutline(false);
      setOutlineContent("# Đề Cương Ôn Tập\n\n## 1. Microservices là gì?\n- Biến thể của SOA\n- Gồm các dịch vụ nhỏ, độc lập\n- Giao tiếp qua HTTP/gRPC\n\n## 2. Ưu điểm\n- Độc lập triển khai\n- Tự do công nghệ\n\n## 3. Thách thức\n- Network Latency\n- Distributed Transactions");
      Notify.success("Đã tạo đề cương thành công!");
    }, 2500);
  };

  return (
    <div className="flex-1 flex border-r border-border/50 bg-background/50 h-full overflow-hidden">
      {/* LEFT: Document Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/50 bg-muted/10 shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="size-8 shrink-0 rounded-lg bg-card border border-border/50 grid place-items-center text-primary shadow-sm">
            <FileText size={16} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate" title={documentTitle}>
              {documentTitle}
            </h3>
            <p className="text-[11px] text-muted-foreground">PDF Document · 2.4 MB</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <button 
            onClick={() => setActiveTab(activeTab === "note" ? "none" : "note")}
            className={`flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold transition-colors ${activeTab === "note" ? "bg-primary/20 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}
          >
            <Edit3 size={14} /> Ghi chú
          </button>
          <button 
            onClick={() => setActiveTab(activeTab === "ai" ? "none" : "ai")}
            className={`flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold transition-colors mr-2 ${activeTab === "ai" ? "bg-rose-500/20 text-rose-500" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}
          >
            <Sparkles size={14} /> AI Outline
          </button>
          
          <div className="w-px h-4 bg-border/50 mx-1" />
          
          <button className="size-8 rounded-lg hover:bg-muted grid place-items-center text-muted-foreground hover:text-foreground transition-colors" title="Phóng to">
            <Maximize2 size={16} />
          </button>
          <button className="size-8 rounded-lg hover:bg-muted grid place-items-center text-muted-foreground hover:text-foreground transition-colors" title="Tải xuống">
            <Download size={16} />
          </button>
          <button onClick={onClose} className="size-8 rounded-lg hover:bg-destructive/10 hover:text-destructive grid place-items-center text-muted-foreground transition-colors ml-1" title="Đóng">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Content (Mock PDF) */}
      <div 
        ref={viewerRef}
        className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#e5e7eb] dark:bg-[#1a1c23] flex justify-center"
      >
        <div className="w-full max-w-3xl bg-white dark:bg-[#0d1117] min-h-[1056px] shadow-xl p-12 text-slate-900 dark:text-slate-200 rounded border border-border/10 selection:bg-primary/30 selection:text-primary">
          <h1 className="text-3xl font-bold mb-6 text-center text-slate-900 dark:text-white">Kiến trúc Microservices: Ưu điểm và Thách thức</h1>
          
          <p className="mb-4 leading-relaxed text-[15px]">
            Trong kỹ thuật phần mềm, <strong>Kiến trúc Microservices</strong> (hay gọi tắt là Microservices) là một biến thể của phong cách kiến trúc Service-Oriented Architecture (SOA), trong đó ứng dụng được cấu trúc dưới dạng một tập hợp các dịch vụ nhỏ gọn, độc lập, giao tiếp với nhau qua các giao thức nhẹ (thường là HTTP RESTful API hoặc gRPC).
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4 border-b pb-2 text-slate-800 dark:text-slate-100">1. Đặc điểm chính của Microservices</h2>
          <ul className="list-disc pl-6 mb-6 space-y-2 text-[15px] leading-relaxed">
            <li><strong>Độc lập triển khai (Independent Deployability):</strong> Mỗi service có thể được cập nhật, triển khai và scale (mở rộng) một cách độc lập mà không ảnh hưởng đến các service khác.</li>
            <li><strong>Tổ chức xoay quanh tính năng kinh doanh:</strong> Thay vì chia theo mảng kỹ thuật (UI, Database, Server), microservices chia theo Domain Driven Design (Ví dụ: Service Giỏ hàng, Service Thanh toán).</li>
            <li><strong>Sở hữu dữ liệu riêng (Decentralized Data Management):</strong> Mỗi service quản lý một database riêng rẽ để tránh tính phụ thuộc chặt (tight coupling).</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-4 border-b pb-2 text-slate-800 dark:text-slate-100">2. Ưu điểm (Benefits)</h2>
          <p className="mb-4 leading-relaxed text-[15px]">
            Lợi ích lớn nhất của Microservices là cho phép các nhóm (teams) phát triển độc lập và sử dụng các công nghệ đa dạng. Một service xử lý AI có thể viết bằng Python, trong khi service xử lý thời gian thực viết bằng Go hoặc Node.js. Ngoài ra, việc bảo trì trở nên dễ dàng hơn vì codebase của mỗi service rất nhỏ và dễ hiểu.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4 border-b pb-2 text-slate-800 dark:text-slate-100">3. Thách thức (Challenges)</h2>
          <p className="mb-4 leading-relaxed text-[15px]">
            Tuy nhiên, "Microservices không phải là thuốc tiên". Việc chia nhỏ ứng dụng mang lại vô số rắc rối về mạng (Network Latency), đảm bảo tính toàn vẹn dữ liệu (Distributed Transactions), và theo dõi lỗi (Distributed Tracing). Nếu bạn có một team nhỏ và ứng dụng chưa quá phức tạp, Monolith (kiến trúc nguyên khối) vẫn là sự lựa chọn an toàn hơn.
          </p>
        </div>
      </div>
      </div>

      {/* RIGHT: Tools Sidebar */}
      <AnimatePresence>
        {activeTab !== "none" && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l border-border/50 bg-card flex flex-col shrink-0 h-full overflow-hidden"
          >
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                {activeTab === "note" ? <><Edit3 size={16} className="text-primary"/> Ghi chú cá nhân</> : <><Sparkles size={16} className="text-rose-500"/> Tạo Đề Cương (AI)</>}
              </h3>
              <button onClick={() => setActiveTab("none")} className="text-muted-foreground hover:text-foreground"><X size={16}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {activeTab === "note" && (
                <>
                  <p className="text-xs text-muted-foreground">Ghi chú này được lưu riêng tư cho bạn đối với tài liệu này.</p>
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Nhập ghi chú của bạn vào đây..."
                    className="flex-1 w-full bg-muted/30 border border-border/50 rounded-xl p-3 text-sm focus:border-primary outline-none resize-none custom-scrollbar"
                  />
                  <button 
                    onClick={handleSaveNote}
                    disabled={isSavingNote}
                    className="w-full h-10 rounded-xl bg-primary text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isSavingNote ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {isSavingNote ? "Đang lưu..." : "Lưu ghi chú"}
                  </button>
                </>
              )}

              {activeTab === "ai" && (
                <>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Hệ thống AI sẽ đọc toàn bộ nội dung tài liệu và trích xuất thành một Đề Cương Ôn Tập (Outline) bao gồm các chương và ý chính.
                  </p>
                  
                  {!outlineContent && !isGeneratingOutline && (
                    <button 
                      onClick={handleGenerateOutline}
                      className="w-full h-10 mt-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 hover:scale-[1.02] transition-transform"
                    >
                      <Sparkles size={16} /> Tạo Đề Cương Ngay
                    </button>
                  )}

                  {isGeneratingOutline && (
                    <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
                      <div className="size-12 rounded-full border-4 border-rose-500/30 border-t-rose-500 animate-spin" />
                      <p className="text-sm font-semibold text-rose-500 animate-pulse">AI đang phân tích tài liệu...</p>
                    </div>
                  )}

                  {outlineContent && (
                    <div className="mt-2 bg-muted/30 border border-border/50 rounded-xl p-4">
                      <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                        {outlineContent}
                      </pre>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
