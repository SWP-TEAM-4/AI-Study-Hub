import React, { useRef } from "react";
import { X, FileText, Maximize2, Download } from "lucide-react";

export interface DocumentViewerPaneProps {
  documentTitle: string;
  onClose: () => void;
  viewerRef?: React.RefObject<HTMLDivElement | null>;
}

export default function DocumentViewerPane({ documentTitle, onClose, viewerRef }: DocumentViewerPaneProps) {
  return (
    <div className="flex-1 flex flex-col border-r border-border/50 bg-background/50 h-full overflow-hidden">
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
  );
}
