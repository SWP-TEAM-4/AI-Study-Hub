import { useState, useEffect } from "react";
import OrbisLanding from "./components/LoginPage/OrbisLanding";
// 1. MỞ COMMENT DÒNG IMPORT NÀY
import LoginPanel from "./components/LoginPage/LoginPanel";
import Loader from "./components/LoginPage/Loader/Loader";
import Dashboard from "./components/Dashboard/Dashboard";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const savedState = localStorage.getItem("isLoggedIn");
    return savedState === "true";
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // 2. THÊM STATE NÀY ĐỂ QUẢN LÝ ẨN/HIỆN LOGIN PANEL
  const [showLoginPanel, setShowLoginPanel] = useState<boolean>(false);

  useEffect(() => {
    if (isLoggedIn) {
      localStorage.setItem("isLoggedIn", "true");
    } else {
      localStorage.removeItem("isLoggedIn");
    }
  }, [isLoggedIn]);

  const handleLoginSuccess = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoggedIn(true);
      setIsLoading(false);
      setShowLoginPanel(false); // Đăng nhập xong thì ẩn panel đi luôn
    }, 2500);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
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