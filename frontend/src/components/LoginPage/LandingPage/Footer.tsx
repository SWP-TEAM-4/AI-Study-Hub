import { Mail, Twitter, Github, Sparkles } from "lucide-react";

function SocialBtn({ Icon }: { Icon: React.ElementType }) {
  return (
    <button className="border border-white/10 bg-white/5 rounded-[1rem] w-12 h-12 flex items-center justify-center text-[#F5F2EA] hover:bg-white/10 hover:border-white/20 transition-all">
      <Icon size={18} />
    </button>
  );
}

export default function Footer() {
  return (
    <footer className="bg-[#030712] border-t border-white/10 pt-20 pb-10 relative overflow-hidden w-full z-10">
      <div className="max-w-[1831px] mx-auto px-6 sm:px-10 lg:px-16">
        
        {/* Main Grid Hệ Thống Danh Mục */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 pb-16">
          
          {/* Cột 1: Thông tin Thương hiệu (Chiếm 2 cột trên màn hình lớn) */}
          <div className="lg:col-span-2 pr-0 lg:pr-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6FFF00] to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(111,255,0,0.2)]">
                <Sparkles size={20} className="text-[#070b1e]" />
              </div>
              <span className="font-grotesk text-2xl font-bold tracking-tight text-[#F5F2EA]">
                AI Study Hub
              </span>
            </div>
            <p className="text-[#F5F2EA]/60 text-sm max-w-sm leading-relaxed mb-8">
              Nền tảng học tập thông minh tích hợp trí tuệ nhân tạo thế hệ mới. 
              Giúp tối ưu hóa lộ trình, học sâu nhớ lâu và bứt phá giới hạn tư duy.
            </p>
            <div className="flex gap-3">
              <SocialBtn Icon={Twitter} />
              <SocialBtn Icon={Github} />
              <SocialBtn Icon={Mail} />
            </div>
          </div>

          {/* Cột 2: Danh mục Nền tảng */}
          <div>
            <h4 className="font-grotesk uppercase tracking-[0.15em] text-xs font-bold mb-6 text-[#6FFF00]">
              Nền tảng
            </h4>
            <ul className="space-y-3 text-sm text-[#F5F2EA]/70">
              {["Dashboard", "Khóa học", "Tài liệu", "AI Assistant", "Lịch học", "Tiến độ"].map((item) => (
                <li key={item}>
                  <a href="#" className="hover:text-[#6FFF00] transition-colors duration-200">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Cột 3: Danh mục Tài nguyên */}
          <div>
            <h4 className="font-grotesk uppercase tracking-[0.15em] text-xs font-bold mb-6 text-[#6FFF00]">
              Tài nguyên
            </h4>
            <ul className="space-y-3 text-sm text-[#F5F2EA]/70">
              {["Blog", "Hướng dẫn", "Cộng đồng", "FAQ", "Học miễn phí"].map((item) => (
                <li key={item}>
                  <a href="#" className="hover:text-[#6FFF00] transition-colors duration-200">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Cột 4: Danh mục Công ty */}
          <div>
            <h4 className="font-grotesk uppercase tracking-[0.15em] text-xs font-bold mb-6 text-[#6FFF00]">
              Công ty
            </h4>
            <ul className="space-y-3 text-sm text-[#F5F2EA]/70">
              {["Về chúng tôi", "Liên hệ", "Chính sách bảo mật", "Điều khoản"].map((item) => (
                <li key={item}>
                  <a href="#" className="hover:text-[#6FFF00] transition-colors duration-200">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Thanh Bản Quyền Phía Dưới */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#F5F2EA]/40 font-mono tracking-wider">
          <div>
            © 2026 AI Study Hub. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-center sm:text-right">
            <span>Made with ❤️ for Vietnamese Students</span>
            <span className="text-[#6FFF00] hidden sm:inline">●</span>
            <span className="hidden sm:inline">Study Smarter, Not Harder</span>
          </div>
        </div>

      </div>

      {/* Hiệu ứng Phát quang Neon mờ dưới đáy trang */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-[#6FFF00]/5 blur-[120px] pointer-events-none" />
    </footer>
  );
}