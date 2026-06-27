import { motion } from "framer-motion";
import { Compass, Home, Rocket } from "lucide-react";

// Removed NotFoundPageProps

import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-space text-cream overflow-hidden relative app-shell-font">
      {/* Background glowing effects */}
      <div className="absolute top-1/3 left-1/4 size-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 size-[300px] bg-neon/20 blur-[100px] rounded-full pointer-events-none" />

      {/* Floating 404 numbers */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex items-center justify-center gap-4 mb-8"
      >
        <span className="text-[120px] md:text-[180px] font-black text-transparent bg-clip-text bg-gradient-to-br from-white/90 to-white/20 drop-shadow-2xl leading-none">
          4
        </span>
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="size-24 md:size-36 rounded-full bg-gradient-to-br from-primary to-neon p-[2px] shadow-[0_0_50px_rgba(var(--primary),0.5)]"
        >
          <div className="w-full h-full rounded-full bg-ink flex items-center justify-center">
            <Compass className="size-12 md:size-16 text-primary" />
          </div>
        </motion.div>
        <span className="text-[120px] md:text-[180px] font-black text-transparent bg-clip-text bg-gradient-to-br from-white/90 to-white/20 drop-shadow-2xl leading-none">
          4
        </span>
      </motion.div>

      {/* Text Content */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        className="relative z-10 text-center max-w-lg px-6"
      >
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">
          Lạc lối trong không gian!
        </h1>
        <p className="text-muted-foreground text-base md:text-lg mb-10 leading-relaxed font-medium">
          Đường dẫn URL bạn vừa tìm kiếm không tồn tại hoặc đã bị di dời. Hãy kiểm tra lại và quay về trạm không gian chính nhé.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <button
            onClick={() => navigate("/")}
            className="group relative inline-flex items-center justify-center gap-2 px-8 h-14 rounded-2xl bg-primary text-primary-foreground text-base font-bold overflow-hidden transition-transform hover:scale-105 active:scale-95 w-full sm:w-auto"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <Home size={20} className="relative z-10" />
            <span className="relative z-10">Về Trang chủ</span>
          </button>
          <button
            onClick={() => window.history.back()}
            className="group inline-flex items-center justify-center gap-2 px-8 h-14 rounded-2xl bg-white/5 border border-white/10 text-white text-base font-bold transition-all hover:bg-white/10 hover:border-white/20 active:scale-95 w-full sm:w-auto"
          >
            <Rocket size={20} className="text-coral" />
            <span>Quay lại</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
