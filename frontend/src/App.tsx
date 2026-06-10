import { useState } from "react";
import OrbisLanding from "./components/LoginPage/OrbisLanding";
import LoginPanel from "./components/LoginPage/LoginPanel";
import Loader from "./components/LoginPage/Loader/Loader";
import Dashboard from "./components/Dashboard/Dashboard";
import { useAuthStore } from "./store/authStore";
import type { AuthResponseData } from "./services/authService";

export default function App() {
  // Đọc trạng thái login từ authStore (có persist qua localStorage)
  const { isLoggedIn, setAuth, logout } = useAuthStore();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showLoginPanel, setShowLoginPanel] = useState<boolean>(false);

  const handleLoginSuccess = (data: AuthResponseData) => {
    // Lưu token + user vào Zustand store và localStorage
    setAuth(data);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setShowLoginPanel(false);
    }, 2500);
  };

  const handleLogout = () => {
    // Xóa toàn bộ auth state khỏi store và localStorage
    logout();
  };

  if (isLoading) {
    return <Loader />;
  }

  if (isLoggedIn) {
    return <Dashboard onLogout={handleLogout} />;
  }

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-space relative">
      
      {/* 3. DIỆN TÍCH HIỂN THỊ ORBIS LANDING */}
      {/* Nếu không showLoginPanel thì full màn hình, nếu show thì có thể ẩn đi hoặc thu nhỏ tùy layout bạn muốn */}
      {!showLoginPanel ? (
        <div
          id="orbis-scroll-wrapper"
          className="w-full h-full overflow-y-auto hide-scrollbar relative"
        >
          <style>{`
            .hide-scrollbar::-webkit-scrollbar { display: none; }
          `}</style>

          {/* KHI ẤN NÚT THÌ SET STATE THÀNH TRUE */}
          <OrbisLanding onLoginClick={() => setShowLoginPanel(true)} />
        </div>
      ) : (
        // 4. HIỂN THỊ LOGIN PANEL KHI STATE LÀ TRUE
        // Thêm nút Back nếu bạn muốn người dùng quay lại Landing Page từ LoginPanel
        <div className="w-full h-full flex items-center justify-center relative animate-fade-in">
          <button 
            onClick={() => setShowLoginPanel(false)} 
            className="absolute top-6 left-6 text-xs uppercase tracking-widest text-neon border border-neon/30 px-4 py-2 hover:bg-neon hover:text-space transition-all duration-300"
          >
            ← Back to journey
          </button>
          
          <LoginPanel onLoginSuccess={handleLoginSuccess} />
        </div>
      )}

    </div>
  );
}