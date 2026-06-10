import React, { useState, useEffect, useRef, useMemo } from "react";
import { Mail, Lock, User, Sparkles, ArrowRight, ArrowLeft, Check, X, Eye, EyeOff } from "lucide-react";
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import { gsap } from "gsap";
import { motion, AnimatePresence } from "framer-motion";
import { type AuthUser } from "../../services/authService";
import { cn } from "../../lib/utils";

// 1. IMPORT ẢNH NỀN AURORA (Lùi 2 nấc ra src/)
import './LoginPanel.css';

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
}

export default function LoginPanel({ onLoginSuccess }: LoginPanelProps) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">(() => {
    return (localStorage.getItem("loginPanelMode") as "login" | "signup" | "forgot") || "login";
  });

  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const formContainerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const auroraRef = useRef<HTMLImageElement>(null);
  // Hiệu ứng Fade-in các thành phần khi đổi chế độ Form
  useEffect(() => {
    if (!formContainerRef.current) return;
    const els = formContainerRef.current.querySelectorAll(
      ".gsap-fade-header, .gsap-fade-field, .gsap-fade-btn, .gsap-fade-footer"
    );
    gsap.fromTo(els,
      { opacity: 0, y: 12, rotateX: -3 },
      { opacity: 1, y: 0, rotateX: 0, duration: 0.4, stagger: 0.03, ease: "power2.out", clearProps: "transform" }
    );
  }, [mode]);

  // Hiệu ứng tương tác Chuột 3D Tilt Card
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

  // Kiểm tra độ mạnh mật khẩu
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "", color: "bg-transparent", textClass: "" };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { score, label: "Quá yếu ❌", color: "bg-red-500", textClass: "text-red-400" };
    if (score === 2) return { score, label: "Trung bình ⚠️", color: "bg-yellow-500", textClass: "text-yellow-400" };
    if (score === 3) return { score, label: "Mạnh   ✨", color: "bg-blue-500", textClass: "text-blue-400" };
    return { score, label: "Cực kỳ an toàn 💪", color: "bg-emerald-500", textClass: "text-emerald-400" };
  };

  const strength = getPasswordStrength(password);

  // XỬ LÝ SUBMIT FORM
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail.endsWith("@gmail.com")) {
      Notify.failure("Email phải có định dạng @gmail.com");
      return;
    }
    if (mode === "signup") {
      if (strength.score < 2) {
        Notify.failure("Mật khẩu quá yếu!");
        return;
      }
      if (password !== confirmPassword) {
        Notify.failure("Mật khẩu nhập lại không khớp!");
        return;
      }
    }
    if (mode === "login" && password.length < 6) {
      Notify.failure("Mật khẩu phải từ 6 ký tự trở lên");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const response = await fetch("https://httpbin.org/post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail, password }),
        });
        if (!response.ok) throw new Error("Network error");
        await response.json();

        if (cleanEmail === "khoa@gmail.com" && password === "123456") {
          Notify.success("Đăng nhập thành công vào Hub! ✨");
          const mockToken = "fake-jwt-token-for-anh-khoa-192585";
          const mockUser: AuthUser = { email: cleanEmail, role: "student" };

          localStorage.setItem("auth_token", mockToken);
          localStorage.setItem("auth_user", JSON.stringify(mockUser));
          setTimeout(() => onLoginSuccess(mockToken, mockUser), 600);
        } else if (cleanEmail === "banned@gmail.com") {
          Notify.failure("Tài khoản này đã bị khóa do vi phạm chính sách! ❌");
        } else {
          Notify.failure("Sai tài khoản hoặc mật khẩu không chính xác! ⚠️");
        }
      } else {
        await new Promise((r) => setTimeout(r, 1000));
        Notify.success("Đăng ký thành công! Hãy đăng nhập.");
        setMode("login");
        setPassword(""); setConfirmPassword(""); setFullName("");
      }
    } catch (err) {
      Notify.failure("Mất kết nối mạng, không thể gửi request!");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: "google" | "github") => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      Notify.success(`Kết nối ${provider} thành công!`);
    } catch {
      Notify.failure(`Kết nối với ${provider} thất bại.`);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith("@gmail.com")) {
      Notify.failure("Email không hợp lệ!");
      return;
    }
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      setResetMessage(`Link reset đã gửi tới ${cleanEmail}.`);
      Notify.success("Đã gửi link đặt lại mật khẩu!");
      setTimeout(() => { setMode("login"); setResetMessage(""); setEmail(""); }, 3000);
    } catch {
      Notify.failure("Gửi yêu cầu thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
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
        className="liquid-glass relative overflow-hidden rounded-[32px] p-6 sm:p-9 border border-white/10 bg-space/40 backdrop-blur-xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] transition-all duration-300 hover:border-white/20 will-change-transform"
      >
      
        

        {/* 🌠 HIỆU ỨNG SAO BĂNG CHẠY TRÊN NỀN */}
        <Meteors number={20} />

        {/* NỘI DUNG CHÍNH (NẰM TRÊN NỀN AURORA) */}
        <div className="relative z-10">
          <AnimatePresence>
            {mode !== "login" && (
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                type="button"
                onClick={() => { setMode("login"); setEmail(""); setResetMessage(""); setPassword(""); setConfirmPassword(""); setFullName(""); }}
                className="group flex items-center gap-2 text-cream/40 hover:text-neon mb-5 transition-all duration-300 font-mono text-[11px] uppercase tracking-wider"
              >
                <ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform" /> Back to Login
              </motion.button>
            )}
          </AnimatePresence>

          {mode === "forgot" ? (
            <>
              <div className="gsap-fade-header flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-neon/10 border border-neon/20">
                  <Sparkles size={15} className="text-neon animate-pulse" />
                </div>
                <span className="font-grotesk text-[11px] uppercase tracking-[0.25em] text-cream/60 font-semibold">AI Study Hub</span>
              </div>

              <h1 className="gsap-fade-header font-grotesk uppercase text-3xl font-black tracking-tight mb-1 text-white">Reset Password</h1>
              <p className="gsap-fade-header font-condiment text-neon text-2xl mb-6 drop-shadow-[0_0_8px_rgba(111,255,0,0.3)]">Get back in</p>

              {resetMessage ? (
                <div className="gsap-fade-field bg-emerald-500/10 border border-emerald-400/20 p-4 rounded-2xl mb-4">
                  <p className="text-xs text-emerald-300 font-mono text-center flex items-center justify-center gap-2">
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
                    className="gsap-fade-btn w-full py-3.5 rounded-2xl bg-neon text-space font-grotesk uppercase tracking-widest text-xs hover:brightness-110 active:scale-[0.99] transition-all duration-300 disabled:opacity-40 font-black shadow-[0_0_25px_rgba(111,255,0,0.2)]"
                  >
                    {loading ? "Sending Orbit Link..." : "Send Reset Link"}
                  </button>
                </form>
              )}
            </>
          ) : (
            <>
              <div className="gsap-fade-header flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-neon/10 border border-neon/20">
                  <Sparkles size={14} className="text-neon" />
                </div>
                <span className="font-grotesk text-[11px] uppercase tracking-[0.25em] text-cream/60 font-semibold">AI Study Hub</span>
              </div>

              <h1 className="gsap-fade-header font-grotesk uppercase text-[30px] sm:text-[36px] font-black tracking-tight leading-none mb-1 text-white">
                {mode === "login" ? "Welcome back" : "Create account"}
              </h1>
              <p className="gsap-fade-header font-condiment text-neon text-[24px] sm:text-[26px] -rotate-1 mb-5 drop-shadow-[0_0_10px_rgba(111,255,0,0.25)] mix-blend-exclusion">
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
                  <div className="space-y-2 bg-black/30 border border-white/5 rounded-2xl p-3.5 shadow-inner transition-all duration-300">
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
                    <div className="pt-1 text-[10px] font-mono text-cream/40 space-y-1 border-t border-white/5 mt-1.5">
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
                  className="gsap-fade-btn group w-full mt-2 rounded-[18px] bg-neon text-space font-grotesk uppercase text-[13px] font-black tracking-widest py-3.5 flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all duration-300 shadow-[0_0_25px_rgba(111,255,0,0.25)] disabled:opacity-70"
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
                <p className="gsap-fade-footer mt-4 text-center">
                  <button type="button" onClick={() => setMode("forgot")}
                    className="text-cream/40 hover:text-neon transition-colors duration-300 text-[10px] font-mono uppercase tracking-widest">
                    Forgot password?
                  </button>
                </p>
              )}

              <div className="gsap-fade-footer mt-5 flex items-center justify-center gap-3">
                <div className="h-[1px] bg-gradient-to-r from-transparent to-white/10 flex-1" />
                <span className="text-[9px] font-mono uppercase text-cream/30 tracking-[0.18em]">Or continue with</span>
                <div className="h-[1px] bg-gradient-to-l from-transparent to-white/10 flex-1" />
              </div>

              <div className="gsap-fade-footer mt-4 grid grid-cols-2 gap-3">
                <button type="button" disabled={loading} onClick={() => handleOAuthLogin("google")}
                  className="liquid-glass flex items-center justify-center gap-2 py-3 rounded-[16px] bg-white/[0.01] hover:bg-white/[0.05] text-cream/60 hover:text-white transition-all border border-white/5 text-xs font-mono uppercase tracking-wider">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  Google
                </button>
                <button type="button" disabled={loading} onClick={() => handleOAuthLogin("github")}
                  className="liquid-glass flex items-center justify-center gap-2 py-3 rounded-[16px] bg-white/[0.01] hover:bg-white/[0.05] text-cream/60 hover:text-white transition-all border border-white/5 text-xs font-mono uppercase tracking-wider">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                  GitHub
                </button>
              </div>

              <p className="gsap-fade-footer mt-5 text-center text-[10px] font-mono uppercase tracking-wide text-cream/40">
                {mode === "login" ? "New explorer? " : "Already orbiting? "}
                <button type="button"
                  onClick={() => { setMode(mode === "login" ? "signup" : "login"); setFullName(""); setEmail(""); setPassword(""); setConfirmPassword(""); }}
                  className="text-neon hover:underline font-black tracking-widest ml-1">
                  {mode === "login" ? "Create account" : "Sign in"}
                </button>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
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
          className="absolute right-4 text-cream/30 hover:text-neon transition-all duration-200">
          {showPassword ? <EyeOff size={15} strokeWidth={2.5} /> : <Eye size={15} strokeWidth={2.5} />}
        </button>
      )}
    </div>
  );
}