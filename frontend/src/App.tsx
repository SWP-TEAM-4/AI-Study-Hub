"use client";

import { useEffect, useState, lazy, Suspense } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import OrbisLanding from "./components/LoginPage/OrbisLanding";
import LoginPanel from "./components/LoginPage/LoginPanel";
import Loader from "./components/LoginPage/Loader/Loader";
import { AppShell } from "./components/DashBoard/AppShell";
import NotFoundPage from "./pages/NotFoundPage";

// Pages (Lazy Loaded)
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const NotebooksPage = lazy(() => import("./pages/NotebooksPage"));
const NotebookDetailPage = lazy(() => import("./pages/NotebookDetailPage"));
const DocumentsPage = lazy(() => import("./pages/DocumentsPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const QuizPage = lazy(() => import("./pages/QuizPage"));
const FlashcardsPage = lazy(() => import("./pages/FlashcardsPage"));
const CommunityPage = lazy(() => import("./pages/CommunityPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const SharedDocumentPage = lazy(() => import("./pages/SharedDocumentPage"));

export default function App() {
  const { isLoggedIn, login, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Handle fake login loading
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  const handleLoginSuccess = (emailFromForm?: string) => {
    setIsLoginLoading(true);
    const finalEmail = emailFromForm || "anhkhoa@fpt.edu.vn";
    setTimeout(() => {
      login(finalEmail);
      setIsLoginLoading(false);
      navigate("/dashboard", { replace: true });
    }, 2500);
  };

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  if (isLoginLoading) return <Loader />;

  const landingElement = isLoggedIn ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <div className="flex w-screen h-screen overflow-hidden bg-space relative">
      <div className="w-full h-full overflow-y-auto hide-scrollbar relative">
        <style>{`
          .hide-scrollbar::-webkit-scrollbar { display: none; }
        `}</style>
        <OrbisLanding onLoginClick={() => navigate("/login")} />
      </div>
    </div>
  );

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={landingElement} />
      <Route path="/privacy-policy" element={landingElement} />
      <Route path="/cookie-settings" element={landingElement} />

      <Route
        path="/login"
        element={
          isLoggedIn ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <div className="flex w-screen h-screen overflow-hidden bg-space relative">
              <div className="w-full h-full flex items-center justify-center relative animate-fade-in">
                <LoginPanel
                  onLoginSuccess={(_, user) => handleLoginSuccess(user.email)}
                  onClose={() => navigate("/")}
                />
              </div>
            </div>
          )
        }
      />

      <Route path="/share/documents/:token" element={
        <Suspense fallback={<Loader />}>
          <SharedDocumentPage shareToken="token-from-url" />
        </Suspense>
      } />

      {/* Authenticated Routes wrapped in AppShell */}
      <Route element={isLoggedIn ? <AppShell /> : <Navigate to="/" replace />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/notebooks" element={<NotebooksPage />} />
        <Route path="/notebooks/:id" element={<NotebookDetailPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/flashcards" element={<FlashcardsPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />
        <Route path="/admin/:tab" element={<AdminPage />} />
      </Route>

      {/* Catch-all for unknown routes */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}