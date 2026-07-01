"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Mail, Lock, User, Sparkles, ArrowRight, ArrowLeft, Check, X, Eye, EyeOff } from "lucide-react";
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import { gsap } from "gsap";
import { motion, AnimatePresence } from "framer-motion";
import { authService, type AuthUser } from "../../services/authService";
import { cn } from "../../lib/utils";
import type { UserDTO } from "../../services/userService";

// 1. IMPORT CÁC COMPONENT LIÊN QUAN
import './LoginPanel.css';
import FPTComboForm from "./Loader/FptComboForm";

// COMPONENT: METEORS BACKGROUND
export const Meteors = ({ number = 20, className }: { number?: number; className?: string }) => {
  const meteorStyles = useMemo(() => {
    return Array.from({ length: number }).map(() => ({
      top: "-20px",
      left: Math.floor(Math.random() * (1000 - -300) + -300) + "px",
      animationDelay: Math.random() * (0.8 - 0.2) + 0.2 + "s",
      animationDuration: Math.floor(Math.random() * (10 - 2) + 2) + "s",
    }));
  }, [number]);

  return (
    <>
      {meteorStyles.map((style, idx) => (
        <span
          key={"meteor" + idx}
          className={cn(
            "animate-meteor-effect absolute top-1/2 left-1/2 h-0.5 w-0.5 rounded-[9999px] bg-slate-500 shadow-[0_0_0_1px_#ffffff10] rotate-[215deg] pointer-events-none",
            "before:content-[''] before:absolute before:top-1/2 before:transform before:-translate-y-[50%] before:w-[50px] before:h-[1px] before:bg-gradient-to-r before:from-[#64748b] before:to-transparent",
            className
          )}
          style={style}
        />
      ))}
    </>
  );
};

// NOTIFLIX CONFIG
Notify.init({
  width: '320px',
  position: 'right-top',
  distance: '15px',
  opacity: 1,
  borderRadius: '20px',
  timeout: 3500,
  cssAnimationStyle: 'fade',
  fontFamily: 'monospace',
  maxVisibleNotifications: 3,
  success: { background: '#10B981', textColor: '#fff' },
  failure: { background: '#EF4444', textColor: '#fff' }
} as any);

interface LoginPanelProps {
  onLoginSuccess: (token: string, user: AuthUser) => void;
  onClose?: () => void;
}

export default function LoginPanel({ onLoginSuccess, onClose }: LoginPanelProps) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot" | "reset">(() => {
    return (localStorage.getItem("loginPanelMode") as "login" | "signup" | "forgot" | "reset") || "login";
  });

  const [showCombo, setShowCombo] = useState(false);
  const [onboardingUser, setOnboardingUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const formContainerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!formContainerRef.current || showCombo) return;
    const els = formContainerRef.current.querySelectorAll(
      ".gsap-fade-header, .gsap-fade-field, .gsap-fade-btn, .gsap-fade-footer"
    );
    gsap.fromTo(els,
      { opacity: 0, y: 12, rotateX: -3 },
      { opacity: 1, y: 0, rotateX: 0, duration: 0.4, stagger: 0.03, ease: "power2.out", clearProps: "transform" }
    );
  }, [mode, showCombo]);

  // ── 🎯 XỬ LÝ POPUP ĐĂNG NHẬP OAUTH GOOGLE CHUYÊN NGHIỆP VÀ BÁO LỖI ──
  const handleOAuthLogin = async (provider: "google" | "github") => {
    setLoading(true);

    const width = 500;
    const height = 650;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const oauthUrl = provider === "google"
      ? "https://accounts.google.com/gsi/select?client_id=mock-client-id"
      : "https://github.com/login/oauth/authorize";

    const popupWindow = window.open(
      oauthUrl,
      `${provider} Sign-In`,
      `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`
    );

    const timer = setInterval(() => {
      if (!popupWindow || popupWindow.closed) {
        clearInterval(timer);
        setLoading(false);
        // Báo lỗi ngắt kết nối trực tiếp khi đóng Popup
        Notify.failure(`Kết nối ${provider} thất bại! Vui lòng thử lại sau.`);
      }
    }, 1000);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateX = -(y / (rect.height / 2)) * 6;
    const rotateY = (x / (rect.width / 2)) * 6;

    gsap.to(card, {
      rotateX: rotateX,
      rotateY: rotateY,
      transformPerspective: 1000,
      duration: 0.3,
      ease: "power2.out"
    });
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    gsap.to(cardRef.current, { rotateX: 0, rotateY: 0, duration: 0.5, ease: "power2.out" });
  };

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "", color: "bg-transparent", textClass: "" };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    // Đã fix lỗi Object cấu trúc dấu hai chấm chuẩn xác cho ông
    if (score <= 1) return { score, label: "Quá yếu ", color: "bg-red-500", textClass: "text-red-400" };
    if (score === 2) return { score, label: "Trung bình ", color: "bg-yellow-500", textClass: "text-yellow-400" };
    if (score === 3) return { score, label: "Mạnh ", color: "bg-blue-500", textClass: "text-blue-400" };
    return { score, label: "Cực kỳ an toàn ", color: "bg-emerald-500", textClass: "text-emerald-400" };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail.endsWith("@gmail.com") && !cleanEmail.endsWith("@fpt.edu.vn")) {
      Notify.failure("Hệ thống chỉ chấp nhận tài khoản @gmail.com hoặc @fpt.edu.vn");
      return;
    }
    if (mode === "signup") {
      if (!fullName.trim()) {
        Notify.failure("Vui lòng nhập họ và tên của bạn!");
        return;
      }
      if (strength.score < 2) {
        Notify.failure("Mật khẩu quá yếu! Hãy gia cố thêm ký tự đặc biệt hoặc số.");
        return;
      }
      if (password !== confirmPassword) {
        Notify.failure("Mật khẩu xác nhận nhập lại chưa trùng khớp!");
        return;
      }
    }
    if (mode === "login" && password.length < 6) {
      Notify.failure("Mật khẩu cấu hình phải từ 6 ký tự trở lên");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const response = await authService.login(cleanEmail, password);

        if (response.success) {
          Notify.success("Xác thực thông tin tài khoản thành công! ");
          const { accessToken, tokenType, ...user } = response.data;
          onLoginSuccess(accessToken, user as AuthUser);
        }
      } else {
        const response = await authService.register({
          email: cleanEmail,
          password: password,
          fullName: fullName,
        });

        if (response.success) {
          Notify.success("Tạo tài khoản học viên mới thành công!");
          const { accessToken, tokenType, ...user } = response.data;
          setOnboardingUser(user as AuthUser);
          setPassword(""); setConfirmPassword("");
          setTimeout(() => setShowCombo(true), 450);
        }
      }
    } catch (err: any) {
      Notify.failure(err.message || "Xử lý yêu cầu xác thực thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken.trim()) {
      Notify.failure("Vui lòng nhập mã khôi phục (Reset Token)!");
      return;
    }
    if (strength.score < 2) {
      Notify.failure("Mật khẩu mới quá yếu! Hãy gia cố thêm ký tự đặc biệt hoặc số.");
      return;
    }
    if (password !== confirmPassword) {
      Notify.failure("Mật khẩu xác nhận nhập lại chưa trùng khớp!");
      return;
    }

    setLoading(true);
    try {
      const response = await authService.resetPassword(resetToken, password);
      if (response.success) {
        Notify.success("Khôi phục mật khẩu thành công! Vui lòng đăng nhập lại bằng mật khẩu mới.");
        setMode("login");
        setPassword(""); setConfirmPassword(""); setResetToken("");
      }
    } catch (err: any) {
      Notify.failure(err.message || "Khôi phục mật khẩu thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith("@gmail.com") && !cleanEmail.endsWith("@fpt.edu.vn")) {
      Notify.failure("Địa chỉ Email liên hệ không hợp lệ!");
      return;
    }
    setLoading(true);
    try {
      const response = await authService.forgotPassword(cleanEmail);
      if (response.success) {
        const tokenPreview = response.data?.resetTokenPreview;
        setResetMessage(tokenPreview ? `Yêu cầu thành công. Mã Reset Token Preview: ${tokenPreview}` : response.message);
        Notify.success("Đã khởi tạo lệnh cấp lại mật khẩu!");
        setTimeout(() => { setMode("login"); setResetMessage(""); setEmail(""); }, 4000);
      }
    } catch (err: any) {
      Notify.failure(err.message || "Gửi yêu cầu khôi phục thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const toAuthUser = (profile: UserDTO, fallback?: AuthUser | null): AuthUser => ({
    userId: profile.id ?? fallback?.userId ?? 0,
    email: profile.email ?? fallback?.email ?? "",
    fullName: profile.fullName ?? fallback?.fullName ?? "",
    avatarUrl: profile.avatarUrl ?? fallback?.avatarUrl ?? null,
    role: profile.role ?? fallback?.role ?? "STUDENT",
    reputationPoints: profile.reputationPoints ?? fallback?.reputationPoints ?? 0,
    currentSemesterId: profile.currentSemesterId ?? null,
    currentSemesterCode: profile.currentSemesterCode ?? null,
    currentSemesterName: profile.currentSemesterName ?? null,
    comboId: profile.comboId ?? null,
    comboCode: profile.comboCode ?? null,
    comboName: profile.comboName ?? null,
    createdAt: profile.createdAt ?? fallback?.createdAt ?? new Date().toISOString(),
  });

  const readStoredUser = (): AuthUser | null => {
    const userStr = localStorage.getItem("auth_user");
    if (!userStr || userStr === "undefined") return null;
    try {
      return JSON.parse(userStr) as AuthUser;
    } catch (e) {
      console.error("Error parsing user from localStorage", e);
      return null;
    }
  };

  const handleFinishCombo = (updatedProfile?: UserDTO) => {
    const token = localStorage.getItem("auth_token") || "";
    const storedUser = readStoredUser();
    const user = updatedProfile ? toAuthUser(updatedProfile, storedUser ?? onboardingUser) : (storedUser ?? onboardingUser);

    if (user) {
      localStorage.setItem("auth_user", JSON.stringify(user));
    }

    onLoginSuccess(token, user as AuthUser);
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden">

      {/* ── 🎥 1. VIDEO NỀN ĐỘNG CHẠY VÒNG LẶP TOÀN MÀN HÌNH (Z-0) ── */}
      <div className="fixed inset-0 w-full h-full overflow-hidden z-0 pointer-events-none brightness-[0.85]">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4"
        />
      </div>

      {/* ── 🧪 2. INJECT SẴN LOGIC PHÂN TẦNG KÍNH LỎNG (LIQUID GLASS FORM) ── */}
      <style>{`
        .liquid-glass-form {
          background: rgba(255, 255, 255, 0.01) !important;
          background-blend-mode: luminosity;
          backdrop-filter: blur(25px) saturate(110%);
          -webkit-backdrop-filter: blur(25px) saturate(110%);
          position: relative;
          overflow: hidden;
          box-shadow: 4px 4px 30px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.15);
        }
        .liquid-glass-form::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1.4px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.15) 20%, transparent 40%, transparent 60%, rgba(255, 255, 255, 0.15) 80%, rgba(255, 255, 255, 0.45) 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
      `}</style>

      {/* ── 📦 3. KHU VỰC CHỨA FORM LOGIN ĐƯỢC ÉP NỔI TRÊN BỀ MẶT (Z-10) ── */}
      <div className="relative z-10 w-full flex items-center justify-center">
        <AnimatePresence mode="wait">
          {showCombo ? (
            /* MÀN HÌNH CHỌN NGÀNH COMBO */
            <motion.div
              key="combo-form-screen"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -15 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="w-full max-w-xl mx-auto p-4"
            >
              <FPTComboForm
                initialUser={onboardingUser ?? readStoredUser()}
                onSkip={() => handleFinishCombo()}
                onCompleted={(updatedUser) => {
                  Notify.success("Đã cập nhật hồ sơ học tập!");
                  handleFinishCombo(updatedUser);
                }}
              />
            </motion.div>
          ) : (
            /* MÀN HÌNH ĐĂNG NHẬP GỐC */
            <motion.div
              key="login-panel-screen"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="w-full max-w-[460px] mx-auto select-none p-4"
              ref={formContainerRef}
            >
              <motion.div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="liquid-glass liquid-glass-form relative overflow-hidden rounded-[32px] p-6 sm:p-9 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] transition-all duration-300 will-change-transform"
              >
                {/* 🌠 HIỆU ỨNG SAO BĂNG CHẠY TRÊN NỀN */}
                <Meteors number={20} />

                {/* NỘI DUNG CHÍNH */}
                <div className="relative z-10">
                  <AnimatePresence mode="wait">
                    {mode !== "login" ? (
                      <motion.button
                        key="back-to-login"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        type="button"
                        onClick={() => { setMode("login"); setEmail(""); setResetMessage(""); setPassword(""); setConfirmPassword(""); setFullName(""); setResetToken(""); }}
                        className="group flex items-center gap-2 text-cream/40 hover:text-neon mb-5 transition-all duration-300 font-mono text-[11px] uppercase tracking-wider cursor-pointer"
                      >
                        <ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform" /> Back to Login
                      </motion.button>
                    ) : (
                      <motion.button
                        key="back-to-journey"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        type="button"
                        onClick={onClose}
                        className="group flex items-center gap-2 text-cream/40 hover:text-neon mb-5 transition-all duration-300 font-mono text-[11px] uppercase tracking-wider cursor-pointer"
                      >
                        <ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform" /> Back to Journey
                      </motion.button>
                    )}
                  </AnimatePresence>

                  {mode === "forgot" || mode === "reset" ? (
                    <>
                      <div className="mb-3 flex items-center gap-2 gsap-fade-header">
                        <div className="p-1.5 rounded-lg bg-neon/10 border border-neon/20">
                          <Sparkles size={15} className="text-neon animate-pulse" />
                        </div>
                        <span className="font-grotesk text-[11px] uppercase tracking-[0.25em] text-cream/60 font-semibold">AI Study Hub</span>
                      </div>

                      <h1 className="text-3xl font-black tracking-tight text-white uppercase font-grotesk mb-1 gsap-fade-header">Reset Password</h1>
                      <p className="text-2xl font-condiment text-neon mb-6 drop-shadow-[0_0_8px_rgba(111,255,0,0.3)] gsap-fade-header">Get back in</p>

                      {mode === "forgot" ? (
                        <>
                          {resetMessage ? (
                            <div className="p-4 bg-emerald-500/10 border border-emerald-400/20 rounded-2xl mb-4 gsap-fade-field">
                              <p className="text-xs font-mono text-center text-emerald-300 flex items-center justify-center gap-2">
                                <Check size={14} /> {resetMessage}
                              </p>
                            </div>
                          ) : (
                            <form onSubmit={handleForgotPassword} className="space-y-4">
                              <div className="gsap-fade-field">
                                <Field Icon={Mail} type="email" placeholder="Email address" value={email} onChange={setEmail} />
                              </div>
                              <button
                                type="submit"
                                disabled={loading || !email}
                                className="w-full py-3.5 rounded-2xl bg-neon text-space font-grotesk uppercase tracking-widest text-xs hover:brightness-110 active:scale-[0.99] transition-all duration-300 disabled:opacity-40 font-black shadow-[0_0_25px_rgba(111,255,0,0.2)] gsap-fade-btn cursor-pointer"
                              >
                                {loading ? "Sending Orbit Link..." : "Send Reset Link"}
                              </button>
                            </form>
                          )}
                          <div className="mt-5 text-center gsap-fade-footer">
                            <span className="text-[11px] font-mono text-cream/40 uppercase tracking-wider">Đã có mã khôi phục? </span>
                            <button type="button" onClick={() => { setMode("reset"); setResetMessage(""); }} className="text-neon hover:text-white font-bold text-[11px] font-mono transition-colors uppercase tracking-wider cursor-pointer">
                              Tạo mật khẩu mới
                            </button>
                          </div>
                        </>
                      ) : (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                          <div className="gsap-fade-field">
                            <Field Icon={Lock} type="text" placeholder="Reset Token" value={resetToken} onChange={setResetToken} />
                          </div>
                          <div className="gsap-fade-field">
                            <Field Icon={Lock} type="password" placeholder="New Password" value={password} onChange={setPassword} />
                          </div>
                          <div className="gsap-fade-field">
                            <Field Icon={Lock} type="password" placeholder="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} />
                            {confirmPassword && (
                              <div className="pt-1.5 px-2 text-[10px] font-mono flex items-center gap-1.5">
                                {password === confirmPassword ? (
                                  <><Check size={11} className="text-emerald-400" strokeWidth={3} /><span className="text-emerald-400/80">Mật khẩu trùng khớp</span></>
                                ) : (
                                  <><X size={11} className="text-red-400" strokeWidth={3} /><span className="text-red-400/80">Mật khẩu chưa khớp</span></>
                                )}
                              </div>
                            )}
                          </div>
                          <button
                            type="submit"
                            disabled={loading || !resetToken || !password || !confirmPassword}
                            className="w-full py-3.5 rounded-2xl bg-neon text-space font-grotesk uppercase tracking-widest text-xs hover:brightness-110 active:scale-[0.99] transition-all duration-300 disabled:opacity-40 font-black shadow-[0_0_25px_rgba(111,255,0,0.2)] gsap-fade-btn cursor-pointer"
                          >
                            {loading ? "Updating..." : "Update Password"}
                          </button>
                        </form>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="mb-2 flex items-center gap-2 gsap-fade-header">
                        <div className="p-1.5 rounded-lg bg-neon/10 border border-neon/20">
                          <Sparkles size={14} className="text-neon" />
                        </div>
                        <span className="font-grotesk text-[11px] uppercase tracking-[0.25em] text-cream/60 font-semibold">AI Study Hub</span>
                      </div>

                      <h1 className="font-grotesk uppercase text-[30px] sm:text-[36px] font-black tracking-tight leading-none mb-1 text-white gsap-fade-header">
                        {mode === "login" ? "Welcome back" : "Create account"}
                      </h1>
                      <p className="font-condiment text-neon text-[24px] sm:text-[26px] -rotate-1 mb-5 drop-shadow-[0_0_10px_rgba(111,255,0,0.25)] mix-blend-exclusion gsap-fade-header">
                        {mode === "login" ? "study smarter" : "join the orbit"}
                      </p>

                      <form className="space-y-3.5" onSubmit={handleSubmit}>
                        {mode === "signup" && (
                          <div className="gsap-fade-field">
                            <Field Icon={User} type="text" placeholder="Full name" value={fullName} onChange={setFullName} />
                          </div>
                        )}

                        <div className="gsap-fade-field">
                          <Field Icon={Mail} type="email" placeholder="Email address" value={email} onChange={setEmail} />
                        </div>

                        <div className="gsap-fade-field">
                          <Field Icon={Lock} type="password" placeholder="Password" value={password} onChange={setPassword} />
                        </div>

                        {/* Password Strength Indicator */}
                        {mode === "signup" && password && (
                          <div className="p-3.5 bg-black/30 border border-white/5 rounded-2xl shadow-inner transition-all duration-300 space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-mono tracking-wide">
                              <span className="text-cream/50">Độ bảo mật:</span>
                              <span className={`font-bold uppercase ${strength.textClass}`}>{strength.label}</span>
                            </div>
                            <div className="grid grid-cols-4 gap-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
                              {[1, 2, 3, 4].map((n) => (
                                <div
                                  key={n}
                                  className={`h-full rounded-full transition-all duration-500 ${strength.score >= n ? strength.color : 'bg-transparent'}`}
                                />
                              ))}
                            </div>
                            <div className="pt-1 text-[10px] font-mono text-cream/40 space-y-1 border-t border-white/5 mt-1.5 border-white/5">
                              {[
                                { check: password.length >= 6, label: "Tối thiểu 6 ký tự" },
                                { check: /[a-z]/.test(password) && /[A-Z]/.test(password), label: "Chứa chữ HOA & chữ thường" },
                                { check: /\d/.test(password), label: "Chứa ít nhất 1 chữ số" },
                              ].map(({ check, label }) => (
                                <div key={label} className="flex items-center gap-1.5">
                                  <div className={`p-0.5 rounded-full ${check ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {check ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={3} />}
                                  </div>
                                  <span className={check ? 'text-cream/60' : 'text-cream/30'}>{label}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Confirm Password */}
                        {mode === "signup" && (
                          <div className="gsap-fade-field">
                            <Field Icon={Lock} type="password" placeholder="Confirm password" value={confirmPassword} onChange={setConfirmPassword} />
                            {confirmPassword && (
                              <div className="pt-1.5 px-2 text-[10px] font-mono flex items-center gap-1.5">
                                {password === confirmPassword ? (
                                  <><Check size={11} className="text-emerald-400" strokeWidth={3} /><span className="text-emerald-400/80">Mật khẩu trùng khớp</span></>
                                ) : (
                                  <><X size={11} className="text-red-400" strokeWidth={3} /><span className="text-red-400/80">Mật khẩu chưa khớp</span></>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full mt-2 rounded-[18px] bg-neon text-space font-grotesk uppercase text-[13px] font-black tracking-widest py-3.5 flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all duration-300 shadow-[0_0_25px_rgba(111,255,0,0.25)] disabled:opacity-70 gsap-fade-btn group cursor-pointer"
                        >
                          {loading ? (
                            <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-space/30 border-t-space rounded-full animate-spin" />Syncing...</span>
                          ) : (
                            <>
                              {mode === "login" ? "Enter the hub" : "Launch account"}
                              <ArrowRight size={15} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </button>
                      </form>

                      {mode === "login" && (
                        <p className="mt-4 text-center gsap-fade-footer">
                          <button type="button" onClick={() => setMode("forgot")}
                            className="text-cream/40 hover:text-neon transition-colors duration-300 text-[10px] font-mono uppercase tracking-widest cursor-pointer">
                            Forgot password?
                          </button>
                        </p>
                      )}

                      <div className="mt-5 flex items-center justify-center gap-3 gsap-fade-footer">
                        <div className="h-[1px] bg-gradient-to-r from-transparent to-white/10 flex-1" />
                        <span className="text-[9px] font-mono uppercase text-cream/30 tracking-[0.18em]">Or continue with</span>
                        <div className="h-[1px] bg-gradient-to-l from-transparent to-white/10 flex-1" />
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 gsap-fade-footer">
                        <button type="button" disabled={loading} onClick={() => handleOAuthLogin("google")}
                          className="liquid-glass flex items-center justify-center gap-2 py-3 rounded-[16px] bg-white/[0.01] hover:bg-white/[0.05] text-cream/60 hover:text-white transition-all border border-white/5 text-xs font-mono uppercase tracking-wider cursor-pointer">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                          </svg>
                          Google
                        </button>
                        <button type="button" disabled={loading} onClick={() => handleOAuthLogin("github")}
                          className="liquid-glass flex items-center justify-center gap-2 py-3 rounded-[16px] bg-white/[0.01] hover:bg-white/[0.05] text-cream/60 hover:text-white transition-all border border-white/5 text-xs font-mono uppercase tracking-wider cursor-pointer">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                          </svg>
                          GitHub
                        </button>
                      </div>

                      <p className="mt-5 text-center text-[10px] font-mono uppercase tracking-wide text-cream/40 gsap-fade-footer">
                        {mode === "login" ? "New explorer? " : "Already orbiting? "}
                        <button type="button"
                          onClick={() => { setMode(mode === "login" ? "signup" : "login"); setFullName(""); setEmail(""); setPassword(""); setConfirmPassword(""); }}
                          className="text-neon hover:underline font-black tracking-widest ml-1 cursor-pointer">
                          {mode === "login" ? "Create account" : "Sign in"}
                        </button>
                      </p>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}

// SUB-COMPONENT: Field
// ============================================================
interface FieldProps {
  Icon: React.ElementType;
  type: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
}

function Field({ Icon, type, placeholder, value, onChange }: FieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="liquid-glass group rounded-[16px] flex items-center px-4 py-3 gap-3 relative border border-white/5 bg-white/[0.01] focus-within:border-neon/50 focus-within:bg-black/20 transition-all duration-300">
      <Icon size={16} className="text-cream/40 group-focus-within:text-neon transition-colors duration-300 shrink-0" />
      <input
        type={isPassword ? (showPassword ? "text" : "password") : type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="bg-transparent outline-none w-full font-mono text-[13px] placeholder:text-cream/30 text-white pr-10"
      />
      {isPassword && (
        <button type="button" onClick={() => setShowPassword((v) => !v)}
          className="absolute right-4 text-cream/30 hover:text-neon transition-all duration-200 cursor-pointer">
          {showPassword ? <EyeOff size={15} strokeWidth={2.5} /> : <Eye size={15} strokeWidth={2.5} />}
        </button>
      )}
    </div>
  );
} 
