import { useState } from "react";
import OrbisLanding from "./components/LoginPage/OrbisLanding";
import LoginPanel from "./components/LoginPage/LoginPanel";
import Loader from "./components/LoginPage/Loader/Loader";
import Dashboard from "./components/Dashboard/Dashboard";
import ResetPasswordPage from "./components/ResetPassword/ResetPasswordPage";
import { useAuthStore } from "./store/authStore";

export default function App() {
  const { isLoggedIn, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // ── Phát hiện route /reset-password?token=... ──────────────────────────
  const isResetPasswordRoute = window.location.pathname === "/reset-password";
  const resetToken = new URLSearchParams(window.location.search).get("token");

  if (isResetPasswordRoute && resetToken) {
    return <ResetPasswordPage token={resetToken} />;
  }

  // ── Handler sau khi login thành công ──────────────────────────────────
  const handleLoginSuccess = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  // ── Handler đăng xuất ─────────────────────────────────────────────────
  const handleLogout = () => {
    logout(); // Xóa token + user khỏi store & localStorage
  };

  if (isLoading) {
    return <Loader />;
  }

  if (isLoggedIn) {
    return <Dashboard onLogout={handleLogout} />;
  }

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-space">
      {/* BÊN TRÁI - Thêm ID "orbis-scroll-wrapper" phục vụ việc bám dính smooth scroll */}
      <div 
        id="orbis-scroll-wrapper" 
        className="w-[65%] min-w-[65%] max-w-[65%] h-full overflow-y-auto hide-scrollbar relative flex-shrink-0"
      >
        <style>{`
          .hide-scrollbar::-webkit-scrollbar { display: none; }
        `}</style>
        <OrbisLanding />
      </div>

      {/* BÊN PHẢI - Giữ nguyên form đăng nhập cũ */}
      <div className="w-[35%] min-w-[35%] max-w-[35%] h-full border-l border-white/10 overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#010828] via-[#0a1440] to-[#1a0f3f] relative flex-shrink-0">
        <div className="relative z-10 w-full max-w-sm sm:max-w-md px-6 py-8">
          <LoginPanel onLoginSuccess={handleLoginSuccess} />
        </div>
      </div>
    </div>  
  );
}