"use client";

import { useEffect, useRef, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import OrbisLanding from "./components/LoginPage/OrbisLanding";
import LoginPanel from "./components/LoginPage/LoginPanel";
import Loader from "./components/LoginPage/Loader/Loader";
import { AppShell } from "./components/DashBoard/AppShell";
import NotFoundPage from "./pages/NotFoundPage";
import { Toaster } from "sonner";
import { useCapabilities } from "./hooks/useCapabilities";
import { safeLocalStorage } from "./utils/safeStorage";
import { safeParseJson } from "./utils/safeParseJson";

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
const ReviewerPage = lazy(() => import("./pages/ReviewerPage"));
const ReviewerDocumentPreviewPage = lazy(() => import("./pages/ReviewerDocumentPreviewPage"));
const MyReportsPage = lazy(() => import("./pages/MyReportsPage"));

// ── Landing page switcher: set VITE_ACTIVE_LANDING="corporate" to show new page ──
const CorporateLanding = lazy(() => import("./components/LoginPage/CorporateLanding"));
const ACTIVE_LANDING = (import.meta as any).env.VITE_ACTIVE_LANDING ?? "orbis";

export default function App() {
  const isLoginLoading = false;
  const { isLoggedIn, login, logout, user } = useAuthStore();
  const navigate = useNavigate();

  const justLoggedIn = useRef(false);

  const userRole = user?.role ?? "STUDENT";
  const { data: capabilities, isLoading: capabilitiesLoading } = useCapabilities(isLoggedIn);

  useEffect(() => {
    if (isLoggedIn && justLoggedIn.current) {
      justLoggedIn.current = false;
      navigate("/dashboard", { replace: true });
    }
  }, [isLoggedIn, navigate]);

  const handleLoginSuccess = (token?: string, userData?: any) => {
    const authToken = token || safeLocalStorage.getItem("auth_token") || "";
    const storedUser = userData || safeLocalStorage.getJSON<any>("auth_user", null);

    if (storedUser) {
      justLoggedIn.current = true;
      login(authToken, storedUser);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  if (isLoginLoading || (isLoggedIn && capabilitiesLoading)) return <Loader />;

  const LandingComponent = ACTIVE_LANDING === "corporate" ? CorporateLanding : OrbisLanding;

  const landingElement = isLoggedIn ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <div className="flex w-screen h-screen overflow-hidden bg-space relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full h-full overflow-y-auto hide-scrollbar relative"
      >
        <style>{`
          .hide-scrollbar::-webkit-scrollbar { display: none; }
        `}</style>
        <Suspense fallback={<Loader />}>
          <LandingComponent onLoginClick={() => navigate("/login")} />
        </Suspense>
      </motion.div>
    </div>
  );

  const authElement = isLoggedIn ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <div className="flex w-screen h-screen overflow-hidden bg-space relative">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full h-full flex items-center justify-center relative"
      >
        <LoginPanel
          onLoginSuccess={(token, user) => handleLoginSuccess(token, user)}
          onClose={() => navigate("/")}
        />
      </motion.div>
    </div>
  );

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={landingElement} />
        <Route path="/privacy-policy" element={landingElement} />
        <Route path="/cookie-settings" element={landingElement} />
        <Route path="/login" element={authElement} />
        <Route path="/reset-password" element={authElement} />
        <Route path="/oauth/:provider/callback" element={authElement} />

        <Route
          path="/share/documents/:token"
          element={
            <Suspense fallback={<Loader />}>
              <SharedDocumentPage />
            </Suspense>
          }
        />

        {/* Authenticated Routes – wrapped in AppShell */}
        <Route element={isLoggedIn ? <AppShell /> : <Navigate to="/" replace />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/notebooks" element={<NotebooksPage />} />
          <Route path="/notebooks/:id" element={<NotebookDetailPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/quiz/history" element={<QuizPage />} />
          <Route path="/flashcards" element={<FlashcardsPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/my-reports" element={<MyReportsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          {(userRole === "ADMIN" || capabilities?.canModerateReports) && (
            <>
              <Route path="/admin" element={<Navigate to={userRole === "ADMIN" ? "/admin/overview" : "/admin/reports"} replace />} />
              <Route path="/admin/:tab" element={<AdminPage />} />
            </>
          )}
          {(capabilities?.canReviewMarketplace || userRole === "ADMIN") && (
            <>
              <Route path="/reviewer" element={
                <Suspense fallback={<Loader />}>
                  <ReviewerPage />
                </Suspense>
              } />
              <Route path="/reviewer/documents/:id" element={
                <Suspense fallback={<Loader />}>
                  <ReviewerDocumentPreviewPage />
                </Suspense>
              } />
            </>
          )}
          <Route path="/admin/reports" element={<MyReportsPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <Toaster position="bottom-center" richColors theme="system" />
    </>
  );
}
