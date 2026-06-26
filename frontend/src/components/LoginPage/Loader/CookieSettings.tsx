"use client";

import { ArrowLeft, ShieldCheck, Eye, Lock } from "lucide-react";

interface CookieSettingsProps {
  onBackClick?: () => void;
}

export default function CookieSettings({ onBackClick }: CookieSettingsProps) {
  const pageFontStyle = { fontFamily: "'Plus Jakarta Sans', sans-serif" };

  return (
    <div 
      style={pageFontStyle} 
      className="min-h-screen bg-[#020514] text-[#F5F2EA] relative overflow-hidden selection:bg-[#00ffcc] selection:text-[#020514]"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(0,255,204,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,204,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#00ffcc]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-[900px] mx-auto px-6 sm:px-8 py-16">
        
        {onBackClick && (
          <button
            onClick={onBackClick}
            className="group mb-10 inline-flex items-center gap-2 text-sm text-[#00ffcc] hover:text-white transition-colors cursor-pointer bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:border-[#00ffcc]/30"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Quay lại trang chủ
          </button>
        )}

        <div className="border-b border-white/10 pb-8 mb-12">
          <div className="flex items-center gap-3 text-[#00ffcc] text-sm font-semibold tracking-wider uppercase mb-3">
            <ShieldCheck size={20} />
            <span>Privacy & Preferences</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
            Cài Đặt Cookie
          </h1>
          <p className="text-sm text-white/40 mt-3 font-medium">
            Tùy chỉnh trải nghiệm của bạn trên Mind Space
          </p>
        </div>

        <div className="space-y-12 text-[15px] sm:text-[16px] text-[#F5F2EA]/80 leading-relaxed font-normal">
          
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <span className="text-[#00ffcc]">01.</span> Cookie là gì?
            </h2>
            <p>
              Cookie là các tệp văn bản nhỏ được lưu trữ trên thiết bị của bạn khi bạn truy cập trang web. Mind Space sử dụng cookie để ghi nhớ các tùy chọn của bạn, hiểu cách bạn tương tác với hệ thống, và cung cấp trải nghiệm học tập nhất quán, liền mạch.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <span className="text-[#00ffcc]">02.</span> Quản lý tùy chọn Cookie
            </h2>
            <p>
              Bạn có thể dễ dàng quản lý loại cookie nào bạn muốn cho phép bên dưới. Lưu ý rằng việc vô hiệu hóa một số loại cookie có thể làm giảm trải nghiệm sử dụng nền tảng của bạn.
            </p>
            
            <div className="grid grid-cols-1 gap-4 pt-2">
              <div className="bg-white/5 border border-white/5 rounded-xl p-5 flex items-start justify-between">
                <div className="space-y-2 pr-6">
                  <Lock size={18} className="text-[#00ffcc]" />
                  <h4 className="font-bold text-white text-base">Cookie Thiết Yếu (Luôn Bật)</h4>
                  <p className="text-sm text-white/60">Cần thiết cho các chức năng cơ bản của trang web như đăng nhập, bảo mật và lưu trữ trạng thái người dùng.</p>
                </div>
                <div className="shrink-0 mt-2">
                  <div className="w-12 h-6 bg-[#00ffcc]/20 rounded-full relative cursor-not-allowed">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-[#00ffcc] rounded-full" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 border border-white/5 rounded-xl p-5 flex items-start justify-between">
                <div className="space-y-2 pr-6">
                  <Eye size={18} className="text-[#00ffcc]" />
                  <h4 className="font-bold text-white text-base">Cookie Phân Tích</h4>
                  <p className="text-sm text-white/60">Giúp chúng tôi hiểu cách bạn sử dụng Mind Space thông qua các dữ liệu thống kê ẩn danh, từ đó cải tiến giao diện và tính năng.</p>
                </div>
                <div className="shrink-0 mt-2">
                  <div className="w-12 h-6 bg-[#00ffcc]/20 rounded-full relative cursor-pointer hover:bg-[#00ffcc]/30 transition-colors">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-[#00ffcc] rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>

        <div className="mt-20 pt-8 border-t border-white/5 text-center text-xs text-white/20 uppercase tracking-widest">
          <p>© 2026 Mind Space. All rights reserved.</p>
        </div>

      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
