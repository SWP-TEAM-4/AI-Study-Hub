import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  GraduationCap,
  BookOpen,
  Save,
  ArrowLeft,
  Camera,
  ShieldCheck,
  Eye,
  EyeOff,
  Star,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  Loader2,
  TriangleAlert,
  BadgeCheck,
  BadgeX,
  Clock,
} from "lucide-react";
import { useAuthStore } from "../../../store/authStore";
import {
  getMyProfile,
  updateMyProfile,
  changePassword,
} from "../../../services/userService";
import type { UserProfileResponse } from "../../../services/userService";
import "./Profile.css";

interface ProfileProps {
  onBack: () => void;
}

interface ToastState {
  message: string;
  type: "success" | "error";
}

// ─── Helper: format date ──────────────────────────────────────────────────
function formatDate(isoString: string | undefined | null): string {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ─── Helper: role label ───────────────────────────────────────────────────
function getRoleLabel(role: string | undefined): string {
  switch (role) {
    case "ADMIN":
      return "Quản trị viên";
    case "REVIEWER":
      return "Người đánh giá";
    case "STUDENT":
    default:
      return "Sinh viên";
  }
}

export default function Profile({ onBack }: ProfileProps) {
  // ── Tabs ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"info" | "security">("info");

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<ToastState | null>(null);
  const triggerToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Auth store ────────────────────────────────────────────────────────────
  const { user: storeUser, updateUser } = useAuthStore();

  // ── Profile data từ backend ───────────────────────────────────────────────
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const data = await getMyProfile();
        if (!cancelled) setProfile(data);
      } catch (err) {
        if (!cancelled)
          triggerToast(
            err instanceof Error
              ? err.message
              : "Không thể tải thông tin cá nhân.",
            "error"
          );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchProfile();
    return () => { cancelled = true; };
  }, []);

  // ── Avatar (local preview trước khi upload) ───────────────────────────────
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
        triggerToast(
          "Ảnh đại diện đã được chọn. Nhấn 'Lưu thay đổi' để cập nhật.",
          "success"
        );
      };
      reader.readAsDataURL(file);
    }
  };

  // ── Form: Thông tin cá nhân ───────────────────────────────────────────────
  const [formData, setFormData] = useState({
    fullName: "",
    avatarUrl: "",
  });
  const [isSavingInfo, setIsSavingInfo] = useState(false);

  // Đồng bộ formData với profile khi load xong
  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName ?? "",
        avatarUrl: profile.avatarUrl ?? "",
      });
    }
  }, [profile]);

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingInfo(true);
    try {
      const updated = await updateMyProfile({
        fullName: formData.fullName.trim() || undefined,
        // Nếu có preview (base64) thì dùng avatarUrl hiện tại
        // Để thực sự lưu avatar URL, cần tích hợp file upload service
        avatarUrl: avatarPreview ? profile?.avatarUrl : formData.avatarUrl || undefined,
      });
      setProfile(updated);
      setAvatarPreview(null); // Reset preview sau khi save
      // Đồng bộ ngay vào store để Dashboard header cập nhật tên/avatar
      updateUser({
        fullName: updated.fullName,
        avatarUrl: updated.avatarUrl,
      });
      triggerToast("Thông tin cá nhân đã được cập nhật thành công!", "success");
    } catch (err) {
      triggerToast(
        err instanceof Error ? err.message : "Cập nhật thất bại.",
        "error"
      );
    } finally {
      setIsSavingInfo(false);
    }
  };

  // ── Form: Đổi mật khẩu ────────────────────────────────────────────────────
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPwd, setShowPwd] = useState({
    current: false,
    newPwd: false,
    confirm: false,
  });
  const [isSavingPwd, setIsSavingPwd] = useState(false);

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Kiểm tra frontend trước
    if (passwordData.newPassword.length < 6) {
      triggerToast("Mật khẩu mới phải có ít nhất 6 ký tự!", "error");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      triggerToast("Mật khẩu mới và xác nhận mật khẩu không khớp!", "error");
      return;
    }
    if (passwordData.currentPassword === passwordData.newPassword) {
      triggerToast("Mật khẩu mới không được trùng mật khẩu hiện tại!", "error");
      return;
    }

    setIsSavingPwd(true);
    try {
      // Backend kiểm tra WRONG_PASSWORD & SAME_PASSWORD
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      triggerToast("Đổi mật khẩu thành công! 🎉", "success");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      triggerToast(
        err instanceof Error ? err.message : "Đổi mật khẩu thất bại.",
        "error"
      );
    } finally {
      setIsSavingPwd(false);
    }
  };

  // ── Derived display values ────────────────────────────────────────────────
  const displayName = profile?.fullName ?? storeUser?.fullName ?? "—";
  const displayAvatar =
    avatarPreview ?? profile?.avatarUrl ?? storeUser?.avatarUrl ?? null;
  const displayRole = profile?.role ?? storeUser?.role;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <motion.div
      className="pf-container"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
    >
      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`pf-toast pf-toast-${toast.type}`}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {toast.type === "success" ? (
              <CheckCircle2 size={18} className="pf-toast-icon" />
            ) : (
              <AlertCircle size={18} className="pf-toast-icon" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP BAR */}
      <div className="pf-top-bar">
        <button className="pf-back-btn" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Quay lại Dashboard</span>
        </button>
      </div>

      {/* LOADING SKELETON */}
      {isLoading ? (
        <div className="pf-loading">
          <Loader2 size={32} className="pf-spinner" />
          <p>Đang tải thông tin cá nhân...</p>
        </div>
      ) : (
        <div className="pf-grid-layout">
          {/* ====== CỘT TRÁI: AVATAR + TABS ====== */}
          <div className="pf-card pf-avatar-card">
            {/* Avatar */}
            <div className="pf-avatar-wrapper">
              <div className="pf-avatar-circle">
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt="Avatar"
                    className="pf-avatar-img"
                  />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>
              <button
                type="button"
                className="pf-avatar-upload-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Thay đổi ảnh đại diện"
              >
                <Camera size={14} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            <h3 className="pf-profile-name">{displayName}</h3>
            <p className="pf-profile-sub">{profile?.email ?? storeUser?.email ?? "—"}</p>

            {/* Stats badges */}
            <div className="pf-stats-row">
              <div className="pf-stat-chip">
                <Star size={12} />
                <span>{profile?.reputationPoints ?? 0} điểm</span>
              </div>
              <div
                className={`pf-badge pf-badge-${(displayRole ?? "STUDENT").toLowerCase()}`}
              >
                {getRoleLabel(displayRole)}
              </div>
            </div>

            {/* Academic info */}
            {(profile?.currentSemesterName || profile?.comboName) && (
              <div className="pf-academic-info">
                {profile.currentSemesterName && (
                  <div className="pf-academic-item">
                    <CalendarDays size={13} />
                    <span>{profile.currentSemesterName}</span>
                  </div>
                )}
                {profile.comboName && (
                  <div className="pf-academic-item">
                    <BookOpen size={13} />
                    <span>{profile.comboName}</span>
                  </div>
                )}
              </div>
            )}

            {/* Member since */}
            <p className="pf-member-since">
              Thành viên từ: {formatDate(profile?.createdAt)}
            </p>

            {/* Tab Menu */}
            <div className="pf-menu-tabs">
              <button
                type="button"
                className={`pf-tab-item ${activeTab === "info" ? "active" : ""}`}
                onClick={() => setActiveTab("info")}
              >
                <User size={16} />
                <span>Thông tin chung</span>
              </button>
              <button
                type="button"
                className={`pf-tab-item ${activeTab === "security" ? "active" : ""}`}
                onClick={() => setActiveTab("security")}
              >
                <ShieldCheck size={16} />
                <span>Bảo mật & Mật khẩu</span>
              </button>
            </div>
          </div>

          {/* ====== CỘT PHẢI: FORM CONTENT ====== */}
          <div className="pf-card pf-form-card">
            <AnimatePresence mode="wait">
              {activeTab === "info" ? (
                /* TAB 1: THÔNG TIN CÁ NHÂN */
                <motion.div
                  key="info-tab"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <h2 className="pf-title">Thông tin cá nhân</h2>
                  <p className="pf-subtitle">
                    Quản lý và cập nhật thông tin tài khoản của bạn tại đây.
                    {profile?.updatedAt && (
                      <span className="pf-last-updated">
                        {" "}· Cập nhật lần cuối: {formatDate(profile.updatedAt)}
                      </span>
                    )}
                  </p>

                  {/* ── WARNING BANNER: Chưa cập nhật học kỳ/combo ── */}
                  {(!profile?.currentSemesterId || !profile?.comboId) && (
                    <motion.div
                      className="pf-warning-banner"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <TriangleAlert size={18} className="pf-warning-icon" />
                      <div className="pf-warning-text">
                        <strong>Hồ sơ chưa đầy đủ!</strong>
                        <span>
                          Bạn nên cập nhật kì hiện tại và combo của bạn để chúng tôi
                          custom tài liệu của bạn dễ dàng hơn.
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {/* ── FORM: Thông tin có thể chỉnh sửa ── */}
                  <form onSubmit={handleInfoSubmit} className="pf-form">
                    {/* Họ và tên */}
                    <div className="pf-field" style={{ gridColumn: "span 2" }}>
                      <label>
                        <User size={15} /> Họ và tên
                      </label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData({ ...formData, fullName: e.target.value })
                        }
                        minLength={2}
                        maxLength={255}
                        placeholder="Nhập họ và tên..."
                        required
                      />
                    </div>

                    {/* Email (readonly) */}
                    <div className="pf-field" style={{ gridColumn: "span 2" }}>
                      <label>
                        <Mail size={15} /> Địa chỉ Email
                      </label>
                      <input
                        type="email"
                        value={profile?.email ?? ""}
                        disabled
                        className="pf-disabled"
                        title="Email hệ thống không thể thay đổi"
                      />
                    </div>

                    {/* Avatar URL */}
                    <div className="pf-field" style={{ gridColumn: "span 2" }}>
                      <label>
                        <Camera size={15} /> URL Ảnh đại diện
                      </label>
                      <input
                        type="url"
                        value={formData.avatarUrl}
                        onChange={(e) =>
                          setFormData({ ...formData, avatarUrl: e.target.value })
                        }
                        maxLength={500}
                        placeholder="https://... (tối đa 500 ký tự)"
                      />
                    </div>

                    <button
                      type="submit"
                      className="pf-save-btn"
                      disabled={isSavingInfo}
                      style={{ gridColumn: "span 2" }}
                    >
                      {isSavingInfo ? (
                        <Loader2 size={16} className="pf-btn-spinner" />
                      ) : (
                        <Save size={16} />
                      )}
                      <span>
                        {isSavingInfo ? "Đang lưu..." : "Lưu thay đổi"}
                      </span>
                    </button>
                  </form>

                  {/* ── READ-ONLY: Thông tin tài khoản từ hệ thống ── */}
                  <div className="pf-section-divider">
                    <h4 className="pf-section-title">
                      <GraduationCap size={15} /> Thông tin tài khoản
                    </h4>
                  </div>

                  <div className="pf-info-grid">
                    {/* Role */}
                    <div className="pf-info-card">
                      <span className="pf-info-label">
                        <User size={13} /> Vai trò
                      </span>
                      <span className={`pf-info-role pf-badge-${(profile?.role ?? "STUDENT").toLowerCase()}`}>
                        {getRoleLabel(profile?.role)}
                      </span>
                    </div>

                    {/* Reputation */}
                    <div className="pf-info-card">
                      <span className="pf-info-label">
                        <Star size={13} /> Điểm uy tín
                      </span>
                      <span className="pf-info-value pf-info-reputation">
                        {profile?.reputationPoints ?? 0}
                        <span className="pf-info-unit"> điểm</span>
                      </span>
                    </div>

                    {/* Trạng thái */}
                    <div className="pf-info-card">
                      <span className="pf-info-label">
                        {profile?.isActive ? <BadgeCheck size={13} /> : <BadgeX size={13} />}
                        {" "}Trạng thái
                      </span>
                      <span className={`pf-info-status ${profile?.isActive ? "active" : "inactive"}`}>
                        {profile?.isActive ? "Đang hoạt động" : "Đã bị khoá"}
                      </span>
                    </div>

                    {/* Ngày tạo */}
                    <div className="pf-info-card">
                      <span className="pf-info-label">
                        <Clock size={13} /> Ngày tham gia
                      </span>
                      <span className="pf-info-value">
                        {formatDate(profile?.createdAt)}
                      </span>
                    </div>

                    {/* Học kỳ */}
                    <div className={`pf-info-card pf-info-card-wide ${!profile?.currentSemesterId ? "pf-info-card-missing" : ""}` }>
                      <span className="pf-info-label">
                        <CalendarDays size={13} /> Học kỳ hiện tại
                      </span>
                      {profile?.currentSemesterId ? (
                        <span className="pf-info-value">
                          <strong>{profile.currentSemesterCode}</strong>
                          {" – "}{profile.currentSemesterName}
                        </span>
                      ) : (
                        <span className="pf-info-missing">
                          <TriangleAlert size={13} /> Chưa cập nhật
                        </span>
                      )}
                    </div>

                    {/* Combo */}
                    <div className={`pf-info-card pf-info-card-wide ${!profile?.comboId ? "pf-info-card-missing" : ""}` }>
                      <span className="pf-info-label">
                        <BookOpen size={13} /> Combo học phần
                      </span>
                      {profile?.comboId ? (
                        <span className="pf-info-value">
                          <strong>{profile.comboCode}</strong>
                          {" – "}{profile.comboName}
                        </span>
                      ) : (
                        <span className="pf-info-missing">
                          <TriangleAlert size={13} /> Chưa cập nhật
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* TAB 2: BẢO MẬT & ĐỔI MẬT KHẨU */
                <motion.div
                  key="security-tab"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <h2 className="pf-title">Bảo mật tài khoản</h2>
                  <p className="pf-subtitle">
                    Thay đổi mật khẩu định kỳ để đảm bảo an toàn cho dữ liệu
                    cá nhân. Mật khẩu mới phải có ít nhất 6 ký tự.
                  </p>

                  <form onSubmit={handleSecuritySubmit} className="pf-form">
                    {/* Mật khẩu hiện tại */}
                    <div className="pf-field pf-pwd-field" style={{ gridColumn: "span 2" }}>
                      <label>Mật khẩu hiện tại</label>
                      <div className="pf-pwd-wrapper">
                        <input
                          type={showPwd.current ? "text" : "password"}
                          placeholder="••••••••"
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              currentPassword: e.target.value,
                            })
                          }
                          required
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          className="pf-eye-btn"
                          onClick={() =>
                            setShowPwd((s) => ({ ...s, current: !s.current }))
                          }
                          tabIndex={-1}
                        >
                          {showPwd.current ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Mật khẩu mới */}
                    <div className="pf-field pf-pwd-field">
                      <label>Mật khẩu mới</label>
                      <div className="pf-pwd-wrapper">
                        <input
                          type={showPwd.newPwd ? "text" : "password"}
                          placeholder="Tối thiểu 6 ký tự"
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              newPassword: e.target.value,
                            })
                          }
                          minLength={6}
                          maxLength={100}
                          required
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="pf-eye-btn"
                          onClick={() =>
                            setShowPwd((s) => ({ ...s, newPwd: !s.newPwd }))
                          }
                          tabIndex={-1}
                        >
                          {showPwd.newPwd ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Xác nhận mật khẩu mới */}
                    <div className="pf-field pf-pwd-field">
                      <label>Xác nhận mật khẩu mới</label>
                      <div className="pf-pwd-wrapper">
                        <input
                          type={showPwd.confirm ? "text" : "password"}
                          placeholder="Nhập lại mật khẩu mới"
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              confirmPassword: e.target.value,
                            })
                          }
                          minLength={6}
                          maxLength={100}
                          required
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="pf-eye-btn"
                          onClick={() =>
                            setShowPwd((s) => ({ ...s, confirm: !s.confirm }))
                          }
                          tabIndex={-1}
                        >
                          {showPwd.confirm ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Password strength indicator */}
                    {passwordData.newPassword.length > 0 && (
                      <div className="pf-pwd-strength" style={{ gridColumn: "span 2" }}>
                        <div
                          className={`pf-pwd-bar ${
                            passwordData.newPassword.length < 6
                              ? "weak"
                              : passwordData.newPassword.length < 10
                              ? "medium"
                              : "strong"
                          }`}
                        />
                        <span className="pf-pwd-label">
                          {passwordData.newPassword.length < 6
                            ? "Quá ngắn"
                            : passwordData.newPassword.length < 10
                            ? "Trung bình"
                            : "Mạnh"}
                        </span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="pf-save-btn pf-secure-btn"
                      disabled={isSavingPwd}
                      style={{ gridColumn: "span 2" }}
                    >
                      {isSavingPwd ? (
                        <Loader2 size={16} className="pf-btn-spinner" />
                      ) : (
                        <ShieldCheck size={16} />
                      )}
                      <span>
                        {isSavingPwd ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                      </span>
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.div>
  );
}