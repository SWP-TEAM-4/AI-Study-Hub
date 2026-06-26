"use client";

import { ArrowLeft, ShieldCheck, Eye, Lock, UserCheck, Mail } from "lucide-react";

interface PrivacyPolicyProps {
  onBackClick?: () => void; // Hàm để quay lại trang chủ nếu bạn tích hợp điều hướng
}

export default function PrivacyPolicy({ onBackClick }: PrivacyPolicyProps) {
  // Đồng bộ duy nhất 1 font chữ tự nhiên, sạch sẽ cho toàn bộ trang
  const pageFontStyle = { fontFamily: "'Plus Jakarta Sans', sans-serif" };

  return (
    <div 
      style={pageFontStyle} 
      className="min-h-screen bg-[#020514] text-[#F5F2EA] relative overflow-hidden selection:bg-[#00ffcc] selection:text-[#020514]"
    >
      {/* Lưới Grid Neon Nền tương tự như Footer */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(0,255,204,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,204,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Hiệu ứng hào quang mờ ở các góc tạo chiều sâu không gian */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#00ffcc]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-[900px] mx-auto px-6 sm:px-8 py-16">
        
        {/* Nút Quay Lại (Back Button) */}
        {onBackClick && (
          <button
            onClick={onBackClick}
            className="group mb-10 inline-flex items-center gap-2 text-sm text-[#00ffcc] hover:text-white transition-colors cursor-pointer bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:border-[#00ffcc]/30"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Quay lại trang chủ
          </button>
        )}

        {/* Tiêu đề trang chính */}
        <div className="border-b border-white/10 pb-8 mb-12">
          <div className="flex items-center gap-3 text-[#00ffcc] text-sm font-semibold tracking-wider uppercase mb-3">
            <ShieldCheck size={20} />
            <span>Privacy & Legal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
            Chính Sách Bảo Mật
          </h1>
          <p className="text-sm text-white/40 mt-3 font-medium">
            Cập nhật lần cuối: Ngày 17 tháng 06, 2026
          </p>
        </div>

        {/* Nội dung các điều khoản */}
        <div className="space-y-12 text-[15px] sm:text-[16px] text-[#F5F2EA]/80 leading-relaxed font-normal">
          
          {/* Mục 1 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <span className="text-[#00ffcc]">01.</span> Giới thiệu tổng quan
            </h2>
            <p>
              Chào mừng bạn đến với <strong>Mind Space</strong>. Chúng tôi cam kết bảo vệ quyền riêng tư và an toàn dữ liệu cá nhân của bạn. Chính sách bảo mật này giải thích cách chúng tôi thu thập, sử dụng, tiết lộ và bảo vệ thông tin của bạn khi bạn tham gia danh sách chờ (waitlist) hoặc sử dụng nền tảng học tập thông minh của chúng tôi.
            </p>
          </section>

          {/* Mục 2 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <span className="text-[#00ffcc]">02.</span> Thông tin chúng tôi thu thập
            </h2>
            <p>
              Khi bạn tương tác với Mind Space, chúng tôi có thể thu thập một số thông tin cơ bản nhằm mục đích nâng cao trải nghiệm học tập của bạn, bao gồm:
            </p>
            <ul className="list-none space-y-2 pl-2">
              <li className="flex items-start gap-3">
                <div className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[#00ffcc]" />
                <span><strong>Thông tin đăng ký:</strong> Địa chỉ email khi bạn đăng ký tham gia danh sách chờ waitlist hoặc khởi tạo tài khoản hệ thống.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[#00ffcc]" />
                <span><strong>Dữ liệu học tập:</strong> Tiến trình ôn tập, kết quả bài quiz, các bộ flashcard được tạo lập và lịch sử tương tác với trợ lý AI hỗ trợ học tập.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[#00ffcc]" />
                <span><strong>Dữ liệu kỹ thuật:</strong> Địa chỉ IP, loại trình duyệt, thời gian truy cập và cách bạn thao tác các tính năng trên website.</span>
              </li>
            </ul>
          </section>

          {/* Mục 3 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <span className="text-[#00ffcc]">03.</span> Cách sử dụng thông tin của bạn
            </h2>
            <p>
              Mind Space sử dụng dữ liệu thu thập được một cách minh bạch cho các hoạt động hợp pháp sau:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-white/5 border border-white/5 rounded-xl p-5 space-y-2">
                <Eye size={18} className="text-[#00ffcc]" />
                <h4 className="font-bold text-white text-base">Cá nhân hóa lộ trình</h4>
                <p className="text-sm text-white/60">Tối ưu hóa các gợi ý tài liệu học tập và cấu trúc câu hỏi quiz phù hợp với năng lực riêng biệt của từng sinh viên.</p>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-5 space-y-2">
                <Lock size={18} className="text-[#00ffcc]" />
                <h4 className="font-bold text-white text-base">Giao tiếp & Thông báo</h4>
                <p className="text-sm text-white/60">Gửi các thông tin cập nhật quan trọng, thông báo ra mắt nền tảng chính thức hoặc phản hồi các yêu cầu hỗ trợ kỹ thuật.</p>
              </div>
            </div>
          </section>

          {/* Mục 4 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <span className="text-[#00ffcc]">04.</span> Bảo mật dữ liệu cá nhân
            </h2>
            <p>
              Chúng tôi áp dụng các tiêu chuẩn an ninh công nghệ nghiêm ngặt (bao gồm mã hóa SSL/TLS, tường lửa bảo vệ hệ thống cơ sở dữ liệu cloud) để ngăn chặn các hành vi truy cập trái phép, thay đổi hoặc làm rò rỉ thông tin cá nhân của bạn. Hệ thống lõi AI hoàn toàn bảo mật và không chia sẻ dữ liệu học tập nội bộ cho bất kỳ bên thứ ba nào vì mục đích thương mại thương mại.
            </p>
          </section>

          {/* Mục 5 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <span className="text-[#00ffcc]">05.</span> Quyền lợi của người dùng
            </h2>
            <p>
              Bạn có toàn quyền kiểm soát thông tin cá nhân của mình trên hệ thống của chúng tôi bất cứ lúc nào:
            </p>
            <ul className="list-none space-y-2 pl-2">
              <li className="flex items-start gap-3">
                <div className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span>Yêu cầu sao lưu, truy xuất hoặc kiểm tra toàn bộ dữ liệu cá nhân đang lưu trữ.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span>Yêu cầu chỉnh sửa, cập nhật thông tin tài khoản bị sai lệch.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span>Yêu cầu hủy đăng ký waitlist hoặc xóa hoàn toàn tài khoản vĩnh viễn khỏi hệ thống.</span>
              </li>
            </ul>
          </section>

          {/* Mục 6 */}
          <section className="space-y-4 bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Mail size={18} className="text-[#00ffcc]" />
              Liên hệ với đội ngũ kỹ thuật
            </h2>
            <p className="text-sm text-white/70">
              Nếu bạn có bất kỳ câu hỏi, khiếu nại hay đóng góp ý kiến nào liên quan đến điều khoản bảo mật thông tin này, vui lòng kết nối trực tiếp với nhóm kỹ sư vận hành của chúng tôi thông qua cổng thông tin:
            </p>
            <div className="pt-2">
              <a 
                href="mailto:swpteam4@fpt.edu.vn" 
                className="inline-block text-[#00ffcc] font-semibold text-base hover:underline"
              >
                swpteam4@fpt.edu.vn
              </a>
              <div className="text-xs text-white/40 mt-1 uppercase tracking-wider font-semibold">
                SWP_TEAM_4 · FPT University Ho Chi Minh Campus
              </div>
            </div>
          </section>

        </div>

        {/* Khối Footer bản quyền gọn nhẹ chân trang */}
        <div className="mt-20 pt-8 border-t border-white/5 text-center text-xs text-white/20 uppercase tracking-widest">
          <p>© 2026 Mind Space. All rights reserved.</p>
        </div>

      </div>

      {/* ── 🎯 ĐOẠN CSS ẨN THANH CUỘN ĐƯỢC NHÚNG TRỰC TIẾP ── */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;  /* Dành cho IE và Edge cũ */
          scrollbar-width: none;  /* Dành cho Firefox */
        }
      `}</style>
    </div>
  );
}