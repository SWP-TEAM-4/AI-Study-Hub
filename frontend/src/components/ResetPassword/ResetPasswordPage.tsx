import { useState } from "react";
import { Lock, Sparkles, Check, X, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Notify } from "notiflix/build/notiflix-notify-aio";
import { resetPassword } from "../../services/authService";

interface ResetPasswordPageProps {
  token: string;
}

export default function ResetPasswordPage({ token }: ResetPasswordPageProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // ── Password strength ─────────────────────────────────────────────────
  const getStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "", color: "bg-transparent", textClass: "" };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { score, label: "Quá yếu ❌", color: "bg-red-500", textClass: "text-red-400" };
    if (score === 2) return { score, label: "Trung bình ⚠️", color: "bg-yellow-500", textClass: "text-yellow-400" };
    if (score === 3) return { score, label: "Mạnh ✨", color: "bg-blue-500", textClass: "text-blue-400" };
    return { score, label: "Cực kỳ an toàn 💪", color: "bg-emerald-500", textClass: "text-emerald-400" };
  };

  const strength = getStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      Notify.failure("Mật khẩu phải từ 6 ký tự trở lên.");
      return;
    }
    if (strength.score < 2) {
      Notify.failure("Mật khẩu quá yếu. Vui lòng tạo mật khẩu mạnh hơn.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Notify.failure("Mật khẩu nhập lại không khớp!");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, newPassword);
      setDone(true);
      Notify.success("Đặt lại mật khẩu thành công!");
      // Tự động redirect về trang login sau 3 giây
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Đặt lại mật khẩu thất bại. Vui lòng thử lại.";
      Notify.failure(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #010828 0%, #0a1440 50%, #1a0f3f 100%)",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(20px)",
          borderRadius: "28px",
          border: "1px solid rgba(255,255,255,0.08)",
          padding: "40px 36px",
          boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <Sparkles size={18} color="#6fff00" />
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 12,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.7)",
            }}
          >
            AI Study Hub
          </span>
        </div>

        <h1
          style={{
            fontFamily: "sans-serif",
            fontSize: 34,
            fontWeight: 800,
            color: "#fff",
            margin: "0 0 4px",
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
          }}
        >
          New Password
        </h1>
        <p style={{ color: "#6fff00", fontSize: 22, marginBottom: 28, fontStyle: "italic" }}>
          Secure your account
        </p>

        {done ? (
          /* ── Thành công ── */
          <div
            style={{
              background: "rgba(16,185,129,0.15)",
              border: "1px solid rgba(16,185,129,0.3)",
              borderRadius: 16,
              padding: 20,
              textAlign: "center",
            }}
          >
            <Check size={40} color="#10B981" style={{ margin: "0 auto 12px" }} />
            <p style={{ color: "#6EE7B7", fontFamily: "monospace", fontSize: 14 }}>
              Mật khẩu đã được đặt lại thành công!
              <br />
              Đang chuyển hướng về trang đăng nhập...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* New Password Field */}
            <PasswordField
              placeholder="Mật khẩu mới"
              value={newPassword}
              onChange={setNewPassword}
            />

            {/* Strength indicator */}
            {newPassword && (
              <div
                style={{
                  background: "rgba(0,0,0,0.2)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: 12,
                  padding: "10px 14px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontFamily: "monospace", marginBottom: 8 }}>
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>Độ bảo mật:</span>
                  <span className={strength.textClass} style={{ fontWeight: "bold" }}>{strength.label}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      style={{
                        height: 6,
                        borderRadius: 9999,
                        background: strength.score >= i
                          ? strength.score <= 1 ? "#ef4444"
                          : strength.score === 2 ? "#eab308"
                          : strength.score === 3 ? "#3b82f6"
                          : "#10b981"
                          : "rgba(255,255,255,0.1)",
                        transition: "background 0.3s",
                      }}
                    />
                  ))}
                </div>
                <div style={{ marginTop: 8, fontSize: 11, fontFamily: "monospace", color: "rgba(255,255,255,0.4)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {newPassword.length >= 6
                      ? <Check size={11} color="#10b981" />
                      : <X size={11} color="#ef4444" />}
                    <span>Tối thiểu 6 ký tự</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)
                      ? <Check size={11} color="#10b981" />
                      : <X size={11} color="#ef4444" />}
                    <span>Chứa chữ HOA và chữ thường</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {/\d/.test(newPassword)
                      ? <Check size={11} color="#10b981" />
                      : <X size={11} color="#ef4444" />}
                    <span>Chứa ít nhất 1 chữ số</span>
                  </div>
                </div>
              </div>
            )}

            {/* Confirm Password Field */}
            <PasswordField
              placeholder="Xác nhận mật khẩu mới"
              value={confirmPassword}
              onChange={setConfirmPassword}
            />
            {confirmPassword && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontFamily: "monospace", paddingLeft: 4 }}>
                {newPassword === confirmPassword
                  ? <><Check size={12} color="#10b981" /><span style={{ color: "#10b981" }}>Mật khẩu trùng khớp</span></>
                  : <><X size={12} color="#ef4444" /><span style={{ color: "#ef4444" }}>Mật khẩu chưa khớp</span></>}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 16,
                background: "#6fff00",
                color: "#010828",
                fontWeight: 800,
                fontSize: 14,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                transition: "all 0.2s",
                boxShadow: "0 0 30px rgba(111,255,0,0.25)",
              }}
            >
              {loading ? "Đang xử lý..." : "Đặt Lại Mật Khẩu"}
            </button>

            {/* Back to login */}
            <a
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "rgba(255,255,255,0.5)",
                fontSize: 12,
                fontFamily: "monospace",
                textDecoration: "none",
                justifyContent: "center",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#6fff00")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
            >
              <ArrowLeft size={14} />
              Quay lại đăng nhập
            </a>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Sub-component: Password Field with show/hide toggle ───────────────────
function PasswordField({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 14,
        padding: "12px 16px",
        position: "relative",
      }}
    >
      <Lock size={18} color="rgba(255,255,255,0.5)" />
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        style={{
          background: "transparent",
          border: "none",
          outline: "none",
          flex: 1,
          color: "#fff",
          fontSize: 14,
          fontFamily: "monospace",
        }}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "rgba(255,255,255,0.4)",
          padding: 0,
          display: "flex",
        }}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
