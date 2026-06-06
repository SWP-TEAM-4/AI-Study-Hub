import { useState, useEffect, useRef } from "react";
import { Mail, Lock, User, Sparkles, ArrowRight, ArrowLeft, Check, X, Eye, EyeOff } from "lucide-react";
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import { gsap } from "gsap";
import '../LoginPage/LoginPanel.css';
import * as authService from '../../services/authService';
import { useAuthStore } from '../../store/authStore';

// --- CẤU HÌNH NOTIFLIX GLOBAL ---
Notify.init({
  width: '300px',
  position: 'right-top',
  distance: '15px',
  opacity: 1,
  borderRadius: '20px',
  timeout: 3000,
  cssAnimationStyle: 'fade',
  fontFamily: 'monospace',
  maxVisibleNotifications: 3,
  success: { background: '#10B981', textColor: '#fff' },
  failure: { background: '#EF4444', textColor: '#fff' }
} as any);

interface LoginPanelProps {
  onLoginSuccess: () => void;
}

export default function LoginPanel({ onLoginSuccess }: LoginPanelProps) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">(() => {
    const savedMode = localStorage.getItem("loginPanelMode");
    return (savedMode as "login" | "signup" | "forgot") || "login";
  });

  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  const formContainerRef = useRef<HTMLDivElement>(null);

  // --- HIỆU ỨNG CHUYỂN FORM CINEMATIC BẰNG GSAP ---
  useEffect(() => {
    if (formContainerRef.current) {
      // Tìm tất cả các phần tử con cần tạo hiệu ứng xuất hiện sinh động
      const elementsToAnimate = formContainerRef.current.querySelectorAll(
        ".gsap-fade-header, .gsap-fade-field, .gsap-fade-btn, .gsap-fade-footer"
      );

      // Tạo chuyển động mượt mà đẩy từ GPU lên, mượt như các trang Web3 cao cấp
      gsap.fromTo(elementsToAnimate,
        { opacity: 0, y: 16, rotateX: -4 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 0.5,
          stagger: 0.04,
          ease: "power2.out",
          clearProps: "transform" // Xóa thuộc tính sau khi chạy xong để không lỗi layout ẩn
        }
      );
    }
  }, [mode]); // Kích hoạt chạy lại mỗi khi bấm đổi Tab Mode

  // --- HÀM KIỂM TRA ĐỘ MẠNH MẬT KHẨU ---
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

  // --- HÀM XỬ LÝ ĐĂNG NHẬP / ĐĂNG KÝ ---
  const { setAuth } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;

    if (mode === "signup") {
      if (strength.score < 2) {
        Notify.failure("Mật khẩu của bạn quá yếu! Vui lòng làm theo gợi ý.");
        return;
      }
      if (cleanPassword !== confirmPassword) {
        Notify.failure("Mật khẩu nhập lại không trùng khớp!");
        return;
      }
    }

    if (cleanPassword.length < 6) {
      Notify.failure("Mật khẩu phải từ 6 ký tự trở lên");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        // ── Gọi API đăng nhập thực ──
        const data = await authService.login(cleanEmail, cleanPassword);
        setAuth(data); // Lưu JWT + user vào store & localStorage
        Notify.success(`Chào mừng trở lại, ${data.fullName}!`);
        setTimeout(() => onLoginSuccess(), 400);
      } else {
        // ── Gọi API đăng ký thực ──
        await authService.register(cleanEmail, cleanPassword, fullName.trim());
        Notify.success("Đăng ký tài khoản thành công! Vui lòng đăng nhập.");
        setTimeout(() => {
          setMode("login");
          setPassword("");
          setConfirmPassword("");
          setFullName("");
        }, 500);
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Đã có lỗi xảy ra. Vui lòng thử lại!";
      Notify.failure(msg);
    } finally {
      setLoading(false);
    }
  };

  // --- HÀM XỬ LÝ OAUTH (GOOGLE / GITHUB) – Chưa triển khai ở backend ---
  const handleOAuthLogin = (provider: "google" | "github") => {
    Notify.info(`Đăng nhập bằng ${provider === 'google' ? 'Google' : 'GitHub'} đang được phát triển. Vui lòng dùng email & mật khẩu.`);
  };

  // --- HÀM QUÊN MẬT KHẨU ---
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      Notify.failure("Vui lòng nhập địa chỉ email!");
      return;
    }

    setLoading(true);
    try {
      // ── Gọi API thực – backend sẽ log reset token ra console (mock email) ──
      await authService.forgotPassword(cleanEmail);
      setResetMessage(
        `Nếu email "${cleanEmail}" tồn tại trong hệ thống, chúng tôi đã gửi link đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.`
      );
      Notify.success("Yêu cầu đã được gửi!");

      setTimeout(() => {
        setMode("login");
        setResetMessage("");
        setEmail("");
      }, 6000);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Gửi yêu cầu thất bại.";
      Notify.failure(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full perspective-1000" ref={formContainerRef}>
      <div className="liquid-glass rounded-[28px] p-8 sm:p-10 will-change-transform border border-white/5 shadow-2xl">

        {/* --- DIỆN MẠO GIAO DIỆN QUÊN MẬT KHẨU --- */}
        {mode === "forgot" ? (
          <>
            <button
              type="button"
              onClick={() => { setMode("login"); setEmail(""); setResetMessage(""); }}
              className="gsap-fade-header flex items-center gap-2 text-cream/60 hover:text-neon mb-6 transition-colors font-mono text-xs uppercase"
            >
              <ArrowLeft size={16} />
              Back to Login
            </button>

            <div className="gsap-fade-header flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-neon" />
              <span className="font-grotesk text-[13px] uppercase tracking-[0.2em] text-cream/80">AI Study Hub</span>
            </div>

            <h1 className="gsap-fade-header font-grotesk uppercase text-4xl leading-none mb-1 text-white">Reset Password</h1>
            <p className="gsap-fade-header font-condiment text-neon text-2xl mb-8">Get back in</p>

            {resetMessage ? (
              <div className="gsap-fade-field bg-green-500/20 border border-green-400/30 p-4 rounded-2xl mb-6">
                <p className="text-sm text-green-300 font-mono">{resetMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="gsap-fade-field">
                  <Field Icon={Mail} type="email" placeholder="Email address" value={email} onChange={setEmail} />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="gsap-fade-btn w-full py-4 rounded-2xl bg-neon text-space font-grotesk uppercase tracking-wider hover:brightness-110 transition disabled:opacity-50 font-bold"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
            )}
          </>
        ) : (
          /* --- DIỆN MẠO GIAO DIỆN ĐĂNG NHẬP / ĐĂNG KÝ --- */
          <>
            <div className="gsap-fade-header flex items-center gap-2 mb-2">
              <Sparkles size={18} className="text-neon" />
              <span className="font-grotesk text-[13px] uppercase tracking-[0.2em] text-cream/80">AI Study Hub</span>
            </div>

            <h1 className="gsap-fade-header font-grotesk uppercase text-[36px] sm:text-[44px] leading-[1] mb-1 text-white">
              {mode === "login" ? "Welcome back" : "Create account"}
            </h1>

            <p className="gsap-fade-header font-condiment text-neon text-[28px] -rotate-1 mb-6 mix-blend-exclusion">
              {mode === "login" ? "study smarter" : "join the orbit"}
            </p>

            <form className="space-y-4" onSubmit={handleSubmit}>
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

              {/* KHU VỰC THÔNG BÁO ĐỘ MẠNH CỦA PASS (Cực mượt) */}
              {mode === "signup" && password && (
                <div className="space-y-2 px-1 py-1 bg-black/20 border border-white/5 rounded-2xl p-3 structure-smooth-trigger will-change-transform">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-cream/60">Độ bảo mật:</span>
                    <span className={`font-bold ${strength.textClass}`}>{strength.label}</span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full bg-cream/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 1 ? strength.color : 'bg-transparent'}`}></div>
                    <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 2 ? strength.color : 'bg-transparent'}`}></div>
                    <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 3 ? strength.color : 'bg-transparent'}`}></div>
                    <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 4 ? strength.color : 'bg-transparent'}`}></div>
                  </div>

                  <div className="pt-0.5 text-[11px] font-mono text-cream/40 space-y-1">
                    <div className="flex items-center gap-1.5">
                      {password.length >= 6 ? <Check size={12} className="text-emerald-400" /> : <X size={12} className="text-red-400" />}
                      <span>Tối thiểu 6 ký tự</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {(/[a-z]/.test(password) && /[A-Z]/.test(password)) ? <Check size={12} className="text-emerald-400" /> : <X size={12} className="text-red-400" />}
                      <span>Chứa chữ HOA và chữ thường</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {/\d/.test(password) ? <Check size={12} className="text-emerald-400" /> : <X size={12} className="text-red-400" />}
                      <span>Chứa ít nhất 1 chữ số</span>
                    </div>
                  </div>
                </div>
              )}

              {mode === "signup" && (
                <div className="gsap-fade-field">
                  <Field
                    Icon={Lock}
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                  />
                  {confirmPassword && (
                    <div className="pt-1.5 px-2 text-[11px] font-mono flex items-center gap-1.5 animate-fadeIn">
                      {password === confirmPassword ? (
                        <>
                          <Check size={12} className="text-emerald-400" />
                          <span className="text-emerald-400/80">Mật khẩu trùng khớp</span>
                        </>
                      ) : (
                        <>
                          <X size={12} className="text-red-400" />
                          <span className="text-red-400/80">Mật khẩu chưa khớp</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="gsap-fade-btn group w-full mt-2 rounded-[18px] bg-neon text-space font-grotesk uppercase text-[15px] tracking-wider py-4 flex items-center justify-center gap-2 hover:brightness-110 transition shadow-[0_0_30px_rgba(111,255,0,0.25)] disabled:opacity-80 font-bold"
              >
                {loading ? "Loading..." : mode === "login" ? "Enter the hub" : "Launch account"}
                {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>

            {mode === "login" && (
              <p className="gsap-fade-footer mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-cream/60 hover:text-neon transition text-xs font-mono uppercase tracking-wide"
                >
                  Forgot password?
                </button>
              </p>
            )}

            <div className="gsap-fade-footer mt-6 flex items-center justify-center gap-3">
              <div className="h-[1px] bg-cream/10 flex-1"></div>
              <span className="text-[11px] font-mono uppercase text-cream/40 tracking-wider">
                Or continue with
              </span>
              <div className="h-[1px] bg-cream/10 flex-1"></div>
            </div>

            <div className="gsap-fade-footer mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleOAuthLogin("google")}
                className="liquid-glass flex items-center justify-center gap-2 py-3 rounded-[16px] hover:bg-cream/5 text-cream/80 hover:text-cream transition disabled:opacity-50 text-xs font-mono uppercase border border-white/5"
              >
                <svg className="w-4 h-4 will-change-transform" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Google
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleOAuthLogin("github")}
                className="liquid-glass flex items-center justify-center gap-2 py-3 rounded-[16px] hover:bg-cream/5 text-cream/80 hover:text-cream transition disabled:opacity-50 text-xs font-mono uppercase border border-white/5"
              >
                <svg className="w-4 h-4 will-change-transform" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
                GitHub
              </button>
            </div>

            <p className="gsap-fade-footer mt-6 text-center text-[12px] font-mono uppercase text-cream/70">
              {mode === "login" ? "New explorer? " : "Already orbiting? "}
              <button
                type="button"
                onClick={() => { setMode(mode === "login" ? "signup" : "login"); setFullName(""); setEmail(""); setPassword(""); setConfirmPassword(""); }}
                className="text-neon hover:underline font-bold"
              >
                {mode === "login" ? "Create account" : "Sign in"}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// --- SUB-COMPONENT FIELD CHUNG (Được tối ưu GPU Layer) ---
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
    <div className="liquid-glass rounded-[16px] flex items-center px-4 py-3 gap-3 relative border border-white/5 will-change-transform focus-within:border-neon/40 transition-colors">
      <Icon size={18} className="text-cream/60 will-change-transform" />
      <input
        type={isPassword ? (showPassword ? "text" : "password") : type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="bg-transparent outline-none w-full font-mono text-[14px] placeholder:text-cream/40 text-cream pr-10"
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 text-cream/40 hover:text-neon transition-colors will-change-transform"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  );
}