import { useState, useRef } from "react";
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
  Link2, 
  Github, 
  Linkedin,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import "./Profile.css";

interface ProfileProps {
  onBack: () => void;
}

interface ToastState {
  message: string;
  type: "success" | "error";
}

export default function Profile({ onBack }: ProfileProps) {
  // 1. Quản lý các Tab ("info": Thông tin chung, "security": Bảo mật)
  const [activeTab, setActiveTab] = useState<"info" | "security">("info");
  const [isSaving, setIsSaving] = useState(false);

  // 2. Hệ thống Toast Notification (Thay thế hoàn toàn alert và console.log)
  const [toast, setToast] = useState<ToastState | null>(null);

  const triggerToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // 3. Quản lý Avatar Upload & Preview
  const [avatar, setAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
        triggerToast("Cập nhật ảnh đại diện tạm thời thành công!", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  // 4. Dữ liệu Form Thông tin cá nhân & Mạng xã hội
  const [formData, setFormData] = useState({
    name: "Anh Khoa",
    email: "anhkhoa@fpt.edu.vn",
    university: "FPT University",
    major: "Software Engineering",
    github: "https://github.com/anhkhoa",
    linkedin: "https://linkedin.com/in/anhkhoa",
  });

  // 5. Dữ liệu Form Bảo mật mật khẩu
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Xử lý Submit lưu thông tin chung
  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      triggerToast("Thông tin tài khoản đã được cập nhật thành công!", "success");
    }, 800);
  };

  // Xử lý Submit đổi mật khẩu (Đã tích hợp đầy đủ các lớp bảo mật bảo vệ)
  const handleSecuritySubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // KIỂM TRA 1: Mật khẩu mới không được trùng mật khẩu hiện tại
    if (passwordData.currentPassword === passwordData.newPassword) {
      triggerToast("Mật khẩu mới không được trùng với mật khẩu hiện tại!", "error");
      return;
    }

    // KIỂM TRA 2: Mật khẩu mới và Nhập lại mật khẩu phải khớp nhau
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      triggerToast("Mật khẩu mới và Nhập lại mật khẩu không trùng khớp!", "error");
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      triggerToast("Cập nhật mật khẩu bảo mật thành công!", "success");
      // Reset lại form mật khẩu về trống sau khi đổi thành công
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    }, 800);
  };

  return (
    <motion.div
      className="pf-container"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
    >
      {/* ANIMS KHUNG THÔNG BÁO TOAST NỔI TRÊN MÀN HÌNH */}
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

      {/* THANH ĐIỀU HƯỚNG TRÊN CÙNG */}
      <div className="pf-top-bar">
        <button className="pf-back-btn" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Quay lại Dashboard</span>
        </button>
      </div>

      <div className="pf-grid-layout">
        {/* ================= CỘT TRÁI: THẺ AVATAR & TABS MENU ================= */}
        <div className="pf-card pf-avatar-card">
          <div className="pf-avatar-wrapper">
            <div className="pf-avatar-circle">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" />
              ) : (
                formData.name.charAt(0).toUpperCase()
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

          <h3 className="pf-profile-name">{formData.name}</h3>
          <p className="pf-profile-sub">{formData.major}</p>
          <div className="pf-badge">Sinh Viên</div>

          {/* Hệ thống Menu chuyển đổi Tab */}
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

        {/* ================= CỘT PHẢI: NỘI DUNG FORM CHUYỂN TAB ĐỘNG ================= */}
        <div className="pf-card pf-form-card">
          <AnimatePresence mode="wait">
            {activeTab === "info" ? (
              /* TAB 1: THÔNG TIN CHUNG & SOCIAL LINKS */
              <motion.div
                key="info-tab"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="pf-title">Thông tin cá nhân</h2>
                <p className="pf-subtitle">Quản lý và cập nhật thông tin tài khoản của bạn tại đây.</p>
                
                <form onSubmit={handleInfoSubmit} className="pf-form">
                  <div className="pf-field">
                    <label><User size={15} /> Họ và tên</label>
                    <input 
                      type="text" 
                      value={formData.name} 
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                      required 
                    />
                  </div>

                  <div className="pf-field">
                    <label><Mail size={15} /> Địa chỉ Email</label>
                    <input 
                      type="email" 
                      value={formData.email} 
                      disabled 
                      className="pf-disabled"
                      title="Email hệ thống không thể thay đổi"
                    />
                  </div>

                  <div className="pf-field">
                    <label><GraduationCap size={15} /> Trường đại học</label>
                    <input 
                      type="text" 
                      value={formData.university} 
                      onChange={(e) => setFormData({ ...formData, university: e.target.value })} 
                      required 
                    />
                  </div>

                  <div className="pf-field">
                    <label><BookOpen size={15} /> Chuyên ngành</label>
                    <input 
                      type="text" 
                      value={formData.major} 
                      onChange={(e) => setFormData({ ...formData, major: e.target.value })} 
                      required 
                    />
                  </div>

                  {/* Thanh Divider chia khối chuẩn Pixel-Perfect */}
                  <div className="pf-section-divider">
                    <h4 className="pf-section-title">
                      <Link2 size={15} /> Liên kết mạng xã hội
                    </h4>
                  </div>

                  <div className="pf-field">
                    <label><Github size={15} /> GitHub Profile</label>
                    <input 
                      type="url" 
                      placeholder="https://github.com/..."
                      value={formData.github} 
                      onChange={(e) => setFormData({ ...formData, github: e.target.value })} 
                    />
                  </div>

                  <div className="pf-field">
                    <label><Linkedin size={15} /> LinkedIn Profile</label>
                    <input 
                      type="url" 
                      placeholder="https://linkedin.com/in/..."
                      value={formData.linkedin} 
                      onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })} 
                    />
                  </div>

                  <button type="submit" className="pf-save-btn" disabled={isSaving}>
                    <Save size={16} />
                    <span>{isSaving ? "Đang lưu..." : "Lưu thay đổi"}</span>
                  </button>
                </form>
              </motion.div>
            ) : (
              /* TAB 2: ĐỔI MẬT KHẨU BẢO MẬT TÀI KHOẢN */
              <motion.div
                key="security-tab"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="pf-title">Bảo mật tài khoản</h2>
                <p className="pf-subtitle">Thay đổi mật khẩu định kỳ để đảm bảo an toàn cho dữ liệu cá nhân.</p>
                
                <form onSubmit={handleSecuritySubmit} className="pf-form">
                  <div className="pf-field" style={{ gridColumn: "span 2" }}>
                    <label>Mật khẩu hiện tại</label>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      value={passwordData.currentPassword} 
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} 
                      required 
                    />
                  </div>

                  <div className="pf-field">
                    <label>Mật khẩu mới</label>
                    <input 
                      type="password" 
                      placeholder="Tối thiểu 6 ký tự" 
                      value={passwordData.newPassword} 
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} 
                      required 
                    />
                  </div>

                  <div className="pf-field">
                    <label>Xác nhận mật khẩu mới</label>
                    <input 
                      type="password" 
                      placeholder="Nhập lại mật khẩu mới" 
                      value={passwordData.confirmPassword} 
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} 
                      required 
                    />
                  </div>

                  <button type="submit" className="pf-save-btn pf-secure-btn" disabled={isSaving}>
                    <ShieldCheck size={16} />
                    <span>{isSaving ? "Đang xử lý..." : "Cập nhật mật khẩu"}</span>
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}