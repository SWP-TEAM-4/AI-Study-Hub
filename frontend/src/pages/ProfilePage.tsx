"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  MapPin,
  Award,
  Flame,
  BookMarked,
  FileText,
  GraduationCap,
  Settings,
  LogOut,
  X,
  User,
  Users,
  UserCheck,
  Key,
  CheckCircle2,
  Camera,
  Cpu,
  MessageSquare,
  Send,
  LucideIcon
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { userService, UserDTO, TestHistoryDTO, ActivityLogDTO, AIUsageDTO } from "../services/userService";
import { communityService, ReferralDTO } from "../services/communityService";
import { communityRoleService, CommunityRoleDTO } from "../services/communityRoleService";
import { feedbackService } from "../services/feedbackService";
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import { useAuthStore } from "../store/useAuthStore";

// ─── 🌐 1. GLOBAL STATIC CONFIGURATIONS ───────────────────────────────────────

const COMBO_MAJORS: Record<number, { major: string; spec: string }> = {
  1: { major: "Kỹ thuật Phần mềm + AI", spec: "Trí tuệ nhân tạo (AI/ML)" },
  2: { major: "Kinh doanh + Khoa học dữ liệu", spec: "Phân tích dữ liệu (Data Science)" },
  3: { major: "Thiết kế đồ họa + UI/UX", spec: "Thiết kế trải nghiệm UI/UX" },
};

const statsConfig: { label: string; value: number; icon: LucideIcon }[] = [
  { label: "Notebook", value: 5, icon: BookMarked },
  { label: "Tài liệu", value: 42, icon: FileText },
  { label: "Quiz đã làm", value: 28, icon: GraduationCap },
];

const MOCK_USER_FALLBACK: UserDTO = {
  id: 1,
  email: "anhkhoa@fpt.edu.vn",
  fullName: "Lê Trần Anh Khoa",
  avatarUrl: null,
  currentSemesterId: 3,
  comboId: 1,
  role: "STUDENT",
  reputationPoints: 11320,
  isActive: true,
  createdAt: "2026-03-15T21:30:00"
};

// ─── 🧑‍🎓 2. MAIN PROFILE COMPONENT ──────────────────────────────────────────────

interface ProfilePageProps {
  onLogout?: () => void;
}

export default function ProfilePage({ onLogout }: ProfilePageProps) {
  const storeLogout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      storeLogout();
    }
  };
  // ── 📊 HỆ THỐNG STATE KẾT NỐI API THỰC TẾ ──
  const [userInfo, setUserInfo] = useState<UserDTO | null>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [testHistory, setTestHistory] = useState<TestHistoryDTO[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogDTO[]>([]);
  const [aiUsage, setAiUsage] = useState<AIUsageDTO | null>(null);
  const [myReferral, setMyReferral] = useState<ReferralDTO | null>(null);
  const [myRoles, setMyRoles] = useState<CommunityRoleDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // States quản lý Mã giới thiệu
  const [referralCodeInput, setReferralCodeInput] = useState("");
  const [applyingReferral, setApplyingReferral] = useState(false);

  // States quản lý UI điều khiển Hộp thoại Cài đặt
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState<string | null>(null);

  // States kiểm duyệt mật khẩu bảo mật
  const [oldPasswordInput, setOldPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");

  // States quản lý Form gửi góp ý / Báo cáo lỗi
  const [fbTitle, setFbTitle] = useState("");
  const [fbContent, setFbContent] = useState("");
  const [isFbSubmitting, setFbSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🔄 HÀM NẠP TIẾN TRÌNH ĐỒNG BỘ ĐÃ NÂNG CẤP BIỆN PHÁP AN TOÀN
  const loadFullProfileData = async () => {
    setIsLoading(true);
    try {
      const [profileRes, badgesRes, testsRes, logsRes, aiRes, refRes, rolesRes] = await Promise.all([
        userService.getMyProfile(),
        userService.getMyBadges(),
        userService.getMyTestHistory({ page: 0, size: 5 }),
        userService.getMyActivityLogs({ page: 0, size: 3 }),
        userService.getMyAIUsage(),
        communityService.getMyReferralInfo().catch(() => null),
        communityRoleService.getMyCommunityRoles().catch(() => null)
      ]);

      if (profileRes.success && profileRes.data) {
        setUserInfo(profileRes.data);
        setEditName(profileRes.data.fullName);
        setEditAvatarUrl(profileRes.data.avatarUrl);
      }

      if (badgesRes.success && badgesRes.data) {
        const mappedBadges = badgesRes.data.map((b: any, index: number) => {
          const colorMap = ["165", "35", "200", "75"];
          return {
            ...b,
            color: b.color || colorMap[index % colorMap.length]
          };
        });
        setBadges(mappedBadges);
      }
      if (testsRes.success && testsRes.data) setTestHistory(testsRes.data.items || []);
      if (logsRes.success && logsRes.data) setActivityLogs(logsRes.data.items || []);
      if (aiRes.success && aiRes.data) setAiUsage(aiRes.data);
      if (refRes?.success && refRes.data) setMyReferral(refRes.data);
      if (rolesRes?.success && rolesRes.data) setMyRoles(rolesRes.data);

    } catch (err: any) {
      console.warn("⚠️ Hệ thống tự động kích hoạt chế độ Fallback Mock do chưa kết nối được Server:", err);

      setUserInfo(MOCK_USER_FALLBACK);
      setEditName(MOCK_USER_FALLBACK.fullName);

      setBadges([
        { id: 1, name: "Người mới", description: "Hoàn thành onboarding", color: "165" },
        { id: 2, name: "Chăm chỉ", description: "Học 7 ngày liên tiếp", color: "35" },
        { id: 3, name: "Đóng góp", description: "Upload 10 tài liệu", color: "200" },
        { id: 4, name: "Quiz Master", description: "Đạt 100 điểm", color: "75" }
      ]);

      setTestHistory([
        { id: 901, quizId: 801, userId: 1, title: "SWP391 — Kiến trúc ứng dụng web Java", totalScore: 9.0, duration: 15, status: "COMPLETED", createdAt: "2026-06-12T22:05:00" },
        { id: 902, quizId: 802, userId: 1, title: "IOT102 — Lập trình điều khiển mạch ESP32", totalScore: 8.5, duration: 30, status: "COMPLETED", createdAt: "2026-06-11T14:15:00" }
      ]);

      setActivityLogs([
        { id: 1, actorId: 1, action: "Hỏi trợ lý AI về cấu trúc JSTL tags", targetType: "CHAT", targetId: 10, metadata: {}, createdAt: "2026-06-15T21:30:00" },
        { id: 2, actorId: 1, action: "Tải lên tài liệu \"Đề cương mạch ESP32\"", targetType: "DOCUMENT", targetId: 5, metadata: {}, createdAt: "2026-06-14T14:15:00" },
        { id: 3, actorId: 1, action: "Hoàn thành Flashcard Java Servlets", targetType: "FLASHCARD", targetId: 2, metadata: {}, createdAt: "2026-06-12T09:00:00" }
      ]);

      setAiUsage({
        userId: 1,
        period: "2026-06",
        chatRequests: 128,
        quizGenerations: 5,
        flashcardGenerations: 3,
        estimatedTokens: 18500
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFullProfileData();
  }, []);

  const checkPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "Chưa nhập", color: "bg-border", textColor: "text-muted-foreground", width: "w-0" };
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass)) score++;
    if (/[\W_]/.test(pass)) score++;

    if (score <= 1) return { score: 1, label: "Yếu ", color: "bg-red-500", textColor: "text-red-500", width: "w-1/3" };
    if (score === 2) return { score: 2, label: "Trung bình ", color: "bg-amber-500", textColor: "text-amber-500", width: "w-2/3" };
    return { score: 3, label: "Mạnh", color: "bg-green-500", textColor: "text-green-500", width: "w-full" };
  };

  const pwdStrength = checkPasswordStrength(newPasswordInput);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Notify.failure("Dung lượng ảnh đại diện không được vượt quá 5MB!");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setEditAvatarUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (oldPasswordInput || newPasswordInput || confirmPasswordInput) {
        if (!oldPasswordInput || !newPasswordInput || !confirmPasswordInput) {
          Notify.failure("Vui lòng điền đầy đủ thông tin Mật khẩu hiện tại, Mật khẩu mới và Xác nhận!");
          return;
        }
        if (newPasswordInput === oldPasswordInput) {
          Notify.failure("Mật khẩu mới không được trùng với mật khẩu hiện tại!");
          return;
        }
        if (newPasswordInput !== confirmPasswordInput) {
          Notify.failure("Mật khẩu mới nhập vào không trùng khớp!");
          return;
        }
        if (pwdStrength.score === 1) {
          Notify.failure("Hệ thống từ chối lưu mật khẩu yếu!");
          return;
        }
        await userService.changeMyPassword({ oldPasswordInput, newPasswordInput });
      }

      const updateRes = await userService.updateMyProfile({
        fullName: editName,
        avatarUrl: editAvatarUrl
      });

      if (updateRes.success) {
        setUserInfo(updateRes.data || null);
        Notify.success("Cập nhật tài khoản thành công!");
        setOldPasswordInput(""); setNewPasswordInput(""); setConfirmPasswordInput("");
        setTimeout(() => setIsSettingsOpen(false), 1000);
      }
    } catch (err: any) {
      Notify.failure(err.message || "Thao tác cập nhật thất bại!");
    }
  };

  const handleSendSystemFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbTitle.trim() || !fbContent.trim()) {
      Notify.failure("Vui lòng điền tiêu đề và nội dung báo cáo!");
      return;
    }
    setFbSubmitting(true);
    try {
      const res = await feedbackService.sendFeedback({
        title: fbTitle,
        content: fbContent,
        screenUrl: window.location.pathname
      });
      if (res.success) {
        Notify.success("Gửi báo cáo lỗi thành công! Ban quản trị sẽ rà soát sớm nhất.");
        setFbTitle(""); setFbContent("");
      }
    } catch (err) {
      Notify.failure("Gửi phản hồi thất bại!");
    } finally {
      setFbSubmitting(false);
    }
  };

  const handleApplyReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referralCodeInput.trim()) {
      Notify.failure("Vui lòng nhập mã giới thiệu!");
      return;
    }
    setApplyingReferral(true);
    try {
      const res = await communityService.applyReferralCode(referralCodeInput.toUpperCase());
      if (res.success && res.data) {
        setMyReferral(res.data);
        Notify.success(`Áp dụng mã thành công! Bạn nhận được thêm điểm thưởng.`);
        setReferralCodeInput("");
      }
    } catch (err: any) {
      Notify.failure(err.message || "Lỗi khi áp dụng mã giới thiệu");
    } finally {
      setApplyingReferral(false);
    }
  };

  if (isLoading || !userInfo) {
    return (
      <div className="py-24 text-center text-muted-foreground font-mono text-xs app-shell-font">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Đang đồng bộ cấu trúc dữ liệu hồ sơ cá nhân...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative app-shell-font">

      {/* Banner Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="surface-card gradient-hero p-6 lg:p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-center relative z-10">
          <div className="size-24 rounded-3xl bg-ink text-cream grid place-items-center text-3xl font-display font-bold shadow-inner overflow-hidden shrink-0 border border-white/10">
            {userInfo.avatarUrl ? (
              <img src={userInfo.avatarUrl} alt={userInfo.fullName} className="w-full h-full object-cover" />
            ) : (
              userInfo.fullName.slice(0, 2).toUpperCase()
            )}
          </div>

          <div className="flex-1 text-center md:text-left flex flex-col items-center md:items-start">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{userInfo.fullName}</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-semibold tracking-wider">
                {userInfo.role}
              </span>
            </div>
            <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-4 font-medium">
              <span className="inline-flex items-center gap-1"><Mail size={13} className="text-primary/70" /> {userInfo.email}</span>
              <span className="inline-flex items-center gap-1"><MapPin size={13} className="text-coral/70" /> FPT University HCM</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-coral/10 text-coral text-xs font-semibold border border-coral/10"><Flame size={12} fill="currentColor" /> Chuỗi 7 ngày</div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning/10 text-warning-foreground text-xs font-semibold border border-warning/10"><Award size={12} /> {userInfo.reputationPoints.toLocaleString()} reputation</div>
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto shrink-0">
            <button onClick={() => { setEditName(userInfo.fullName); setEditAvatarUrl(userInfo.avatarUrl); setIsSettingsOpen(true); }} className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 h-10 rounded-xl bg-card border border-border text-sm font-semibold hover:bg-muted transition-all cursor-pointer"><Settings size={14} /> Cài đặt</button>
            <button onClick={handleLogout} className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 h-10 rounded-xl bg-destructive/10 text-destructive text-sm font-semibold hover:bg-destructive/20 transition-all cursor-pointer"><LogOut size={14} /> Đăng xuất</button>
          </div>
        </div>
      </motion.div>

      {/* Stats Dashboard Tiles */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statsConfig.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="surface-card p-5 text-left">
              <Icon size={18} className="text-primary mb-2" />
              <div className="text-2xl font-bold font-display tracking-tight text-foreground">{s.value}</div>
              <div className="text-xs font-medium text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          );
        })}
        <div className="surface-card p-5 text-left">
          <Cpu size={18} className="text-coral mb-2" />
          <div className="text-2xl font-bold font-display tracking-tight text-foreground">{aiUsage ? aiUsage.chatRequests : 0}</div>
          <div className="text-xs font-medium text-muted-foreground mt-0.5">Lượt gọi AI ({aiUsage?.period || "2026-06"})</div>
        </div>
      </section>

      {/* Huy hiệu */}
      <section className="surface-card p-6">
        <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2 text-foreground text-left">
          <Award className="text-coral" size={18} /> Huy hiệu của bạn
        </h2>
        {badges.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-left">Chưa có huy hiệu phần thưởng vinh danh nào.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {badges.map((b, i) => (
              <motion.div
                key={b.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -3 }}
                className="p-4 rounded-2xl bg-muted/40 border border-border text-center transition-all duration-200"
              >
                <div
                  className="size-14 rounded-2xl mx-auto grid place-items-center mb-2 shadow-sm"
                  style={{
                    background: `oklch(0.55 0.14 ${b.color} / 0.15)`,
                    color: `oklch(0.45 0.14 ${b.color})`,
                  }}
                >
                  <Award size={24} />
                </div>
                <div className="font-semibold text-sm text-foreground truncate">{b.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{b.description || b.desc}</div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Vai trò cộng đồng */}
      {myRoles.length > 0 && (
        <section className="surface-card p-6">
          <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2 text-foreground text-left">
            <UserCheck className="text-primary" size={18} /> Vai trò cộng đồng
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {myRoles.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-2xl bg-muted/40 border border-border/50 text-left relative overflow-hidden"
              >
                <div className="absolute -right-4 -top-4 size-20 bg-primary/10 rounded-full blur-2xl"></div>
                <div className="font-bold text-foreground text-sm tracking-wide">{r.roleType}</div>
                <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-semibold">
                  Phạm vi: {r.scopeType} {r.scopeId ? `(${r.scopeId})` : ""}
                </div>
                <div className="text-[11px] font-mono text-primary/80 mt-3 pt-3 border-t border-border/50">
                  Từ {new Date(r.startAt).toLocaleDateString("vi-VN")} {r.endAt && `- ${new Date(r.endAt).toLocaleDateString("vi-VN")}`}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Lịch sử thi & Nhật ký hoạt động */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="surface-card p-5 lg:col-span-2 overflow-hidden flex flex-col justify-between">
          <div className="text-left mb-4">
            <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2"><GraduationCap size={22} className="text-primary" /> Lịch sử làm bài kiểm tra</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Kết quả điểm số các bài test trắc nghiệm kiến thức môn học</p>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border/50">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-[10px] font-bold uppercase text-muted-foreground border-b border-border/40">
                <tr><th className="px-4 py-3">Bài kiểm tra / Quiz</th><th className="px-4 py-3">Điểm số</th><th className="px-4 py-3 hidden sm:table-cell">Thời gian</th><th className="px-4 py-3 text-right">Trạng thái</th></tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-foreground font-medium">
                {testHistory.length === 0 ? (
                  <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">Chưa tham gia bài kiểm tra nào.</td></tr>
                ) : (
                  testHistory.map((test) => (
                    <tr key={test.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground truncate max-w-[200px] text-left">{test.title}</td>
                      <td className="px-4 py-3 font-mono font-bold text-primary text-left">{test.totalScore}/10</td>
                      <td className="px-4 py-3 hidden sm:table-cell text-left text-muted-foreground">{test.duration} phút</td>
                      <td className="px-4 py-3 text-right"><span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${test.status === "COMPLETED" ? "bg-success/15 text-success" : "bg-warning/15 text-warning-foreground"}`}>{test.status}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Nhật ký hoạt động */}
        <div className="surface-card p-5">
          <div className="text-left mb-4">
            <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2"><FileText size={16} className="text-coral" /> Nhật ký hoạt động</h2>
          </div>
          <div className="space-y-4 text-left">
            {activityLogs.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4">Chưa có nhật ký hoạt động.</p>
            ) : (
              activityLogs.map((log) => (
                <div key={log.id} className="flex gap-3 relative before:absolute before:left-[5px] before:top-3 before:bottom-[-21px] before:w-[1px] before:bg-border/60 last:before:hidden">
                  <div className="size-2.5 rounded-full bg-primary ring-4 ring-primary/10 mt-1 shrink-0 z-10" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground leading-snug truncate">{log.action}</p>
                    <span className="text-[10px] font-mono text-muted-foreground/70 block mt-0.5">{new Date(log.createdAt).toLocaleDateString("vi-VN")}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Mã giới thiệu */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="surface-card p-6 flex flex-col justify-between">
          <div className="text-left mb-4 flex items-start justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                <Users size={18} className="text-primary" /> Mã giới thiệu của tôi
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Chia sẻ mã này với bạn bè để cùng nhận điểm thưởng</p>
            </div>
            {myReferral && (
              <div className="text-right shrink-0">
                <div className="text-2xl font-black text-warning">{myReferral.rewardPoints}</div>
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Điểm thưởng</div>
              </div>
            )}
          </div>
          {myReferral ? (
            <div className="flex flex-col gap-3 mt-auto">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-neon rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <div className="relative flex items-center justify-between p-4 bg-card rounded-xl border border-border/50">
                  <div className="font-mono text-2xl font-black tracking-[0.2em] text-foreground mx-auto">
                    {myReferral.code}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(myReferral.code);
                  Notify.success("Đã copy mã giới thiệu!");
                }}
                className="w-full h-11 rounded-xl bg-primary/10 text-primary font-bold text-sm hover:bg-primary/20 transition-colors"
              >
                Sao chép mã
              </button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-6 text-center mt-auto">Chưa có thông tin mã giới thiệu</p>
          )}
        </div>

        <div className="surface-card p-6 flex flex-col justify-between">
          <div className="text-left mb-4">
            <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
              <Key size={18} className="text-coral" /> Nhập mã giới thiệu
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Áp dụng mã của người khác để nhận ngay +20 reputation</p>
          </div>
          {myReferral?.status === "APPLIED" ? (
            <div className="flex flex-col items-center justify-center py-6 mt-auto bg-muted/20 rounded-xl border border-border/50">
              <div className="size-12 rounded-full bg-success/10 text-success grid place-items-center mb-3">
                <CheckCircle2 size={24} />
              </div>
              <div className="font-bold text-foreground">Đã áp dụng mã thành công</div>
              <p className="text-xs text-muted-foreground mt-1">Bạn đã nhận được điểm thưởng giới thiệu.</p>
            </div>
          ) : (
            <form onSubmit={handleApplyReferral} className="flex flex-col gap-3 mt-auto">
              <input
                type="text"
                placeholder="Nhập mã (VD: KHOA2026)"
                value={referralCodeInput}
                onChange={e => setReferralCodeInput(e.target.value)}
                className="w-full px-4 h-12 rounded-xl bg-muted/30 border border-border/50 focus:border-primary focus:bg-card outline-none font-mono text-center text-lg uppercase transition-colors placeholder:text-sm placeholder:normal-case placeholder:font-sans"
              />
              <button
                type="submit"
                disabled={applyingReferral || !referralCodeInput.trim()}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {applyingReferral ? (
                  <><div className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Đang xử lý...</>
                ) : (
                  <><Send size={16} /> Áp dụng mã ngay</>
                )}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Khung gửi Góp ý & Báo cáo lỗi */}
      <section className="surface-card p-6 bg-card">
        <div className="text-left mb-4">
          <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
            <MessageSquare className="text-primary" size={18} /> Góp ý & Báo cáo lỗi hệ thống
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">Gặp sự cố giao diện hoặc có ý tưởng cải tiến RAG? Hãy gửi phản hồi ngay cho đội ngũ SWP-TEAM-4.</p>
        </div>

        <form onSubmit={handleSendSystemFeedback} className="space-y-4 text-left">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tiêu đề lỗi / Góp ý:</label>
              <input
                type="text"
                value={fbTitle}
                onChange={(e) => setFbTitle(e.target.value)}
                placeholder="Ví dụ: Lỗi tràn khung CSS, Tốc độ tải RAG chậm..."
                className="w-full px-3.5 h-10 rounded-xl bg-muted/50 border border-border focus:border-primary/50 focus:bg-card outline-none text-sm font-medium text-foreground transition-all"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nội dung báo cáo chi tiết:</label>
              <textarea
                value={fbContent}
                onChange={(e) => setFbContent(e.target.value)}
                placeholder="Mô tả cụ thể hành động dẫn đến lỗi để ban quản trị (Admin) rà soát vá lỗi..."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl bg-muted/50 border border-border focus:border-primary/50 focus:bg-card outline-none text-sm font-medium text-foreground transition-all resize-none"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isFbSubmitting}
            className="inline-flex items-center gap-2 px-5 h-10 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer shadow-sm ml-auto"
          >
            {isFbSubmitting ? "Sending..." : <><Send size={13} /> Gửi phản hồi lỗi</>}
          </button>
        </form>
      </section>

      {/* PANEL CÀI ĐẶT MODAL */}
      {typeof document !== "undefined" ? createPortal(
        <AnimatePresence>
          {isSettingsOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSettingsOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" />

              {/* 🛠️ CHÌA KHÓA: Injected variant bẫy ẩn thanh cuộn [&::-webkit-scrollbar]:hidden vào wrapper panel dưới đây */}
              <motion.div
                initial={{ x: "100%", opacity: 0.9 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "100%", opacity: 0.9 }}
                transition={{ type: "spring", damping: 26, stiffness: 220 }}
                className="fixed top-0 right-0 h-screen w-full max-w-md bg-card border-l border-border shadow-2xl p-6 z-[100] overflow-y-auto font-sans [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              >
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div className="flex items-center gap-2"><Settings className="text-primary" size={20} /><h3 className="text-lg font-bold text-foreground">Cấu hình tài khoản</h3></div>
                  <button onClick={() => setIsSettingsOpen(false)} className="size-8 rounded-lg hover:bg-muted grid place-items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"><X size={16} /></button>
                </div>

                <form onSubmit={handleSaveSettings} className="mt-5 space-y-6 pb-12">
                  <div className="space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1"><GraduationCap size={12} /> Thông tin đào tạo FPT</div>
                    <div className="rounded-xl bg-muted/50 border border-border/60 p-4 space-y-3 text-sm text-left">
                      <div className="flex justify-between items-center border-b border-border/40 pb-2"><span className="text-muted-foreground font-medium">Mã số sinh viên:</span><span className="font-mono font-bold text-foreground">SE192585</span></div>
                      <div className="flex flex-col gap-1 border-b border-border/40 pb-2"><span className="text-muted-foreground font-medium">Chuyên ngành chính:</span><span className="font-semibold text-foreground">{COMBO_MAJORS[userInfo.comboId ?? 1]?.major || "Kỹ thuật Phần mềm"}</span></div>
                      <div className="flex flex-col gap-1"><span className="text-muted-foreground font-medium">Chuyên ngành hẹp:</span><span className="inline-flex items-center gap-1.5 font-bold text-coral bg-coral/5 border border-coral/10 px-2.5 py-1 rounded-lg w-fit mt-1 text-xs">{COMBO_MAJORS[userInfo.comboId ?? 1]?.spec || "Hệ thống nhúng & IoT"}</span></div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2 border-t border-border/50 text-left">
                    <div className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1"><User size={12} /> Thay đổi thông tin cá nhân</div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground">Ảnh đại diện tài khoản:</label>
                      <div className="flex gap-4 items-center">
                        <div onClick={() => fileInputRef.current?.click()} className="size-20 rounded-2xl bg-ink text-cream text-2xl font-bold grid place-items-center cursor-pointer overflow-hidden relative border border-border/40 shadow-inner group shrink-0">
                          {editAvatarUrl ? <img src={editAvatarUrl} alt="Preview" className="w-full h-full object-cover group-hover:opacity-70 transition-opacity" /> : userInfo.fullName.slice(0, 2).toUpperCase()}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white gap-1 transition-all duration-200"><Camera size={16} /><span className="text-[9px] font-bold uppercase tracking-wider">Thay ảnh</span></div>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                        <div className="text-xs text-muted-foreground leading-relaxed font-medium">Bấm vào ô vuông để upload ảnh mới.</div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Họ và tên hiển thị:</label>
                      <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-3.5 h-10 rounded-xl bg-muted/60 border border-transparent focus:border-primary focus:bg-card outline-none text-sm transition-all font-medium text-foreground" required />
                    </div>
                  </div>

                  {/* 🔒 Khối cập nhật mật khẩu, đã được bọc logic chặn đổi trùng mật khẩu cũ */}
                  <div className="space-y-4 pt-2 border-t border-border/50 text-left">
                    <div className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1"><Key size={12} /> Cập nhật mật khẩu bảo mật</div>
                    <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">Mật khẩu hiện tại:</label><input type="password" value={oldPasswordInput} onChange={(e) => setOldPasswordInput(e.target.value)} className="w-full px-3.5 h-10 rounded-xl bg-muted/60 border border-transparent focus:border-primary focus:bg-card outline-none text-sm transition-all font-mono" placeholder="••••••••" /></div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center"><label className="text-xs font-semibold text-muted-foreground">Mật khẩu mới:</label>{newPasswordInput && <span className={`text-[11px] font-bold ${pwdStrength.textColor}`}>Độ mạnh: {pwdStrength.label}</span>}</div>
                      <input type="password" value={newPasswordInput} onChange={(e) => setNewPasswordInput(e.target.value)} className="w-full px-3.5 h-10 rounded-xl bg-muted/60 border border-transparent focus:border-primary focus:bg-card outline-none text-sm transition-all font-mono" placeholder="••••••••" />
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mt-1"><div className={`h-full ${pwdStrength.color} ${pwdStrength.width} transition-all duration-300`} /></div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Nhập lại mật khẩu mới:</label>
                      <input type="password" value={confirmPasswordInput} onChange={(e) => setConfirmPasswordInput(e.target.value)} className="w-full px-3.5 h-10 rounded-xl bg-muted/60 border border-transparent focus:border-primary focus:bg-card outline-none text-sm transition-all font-mono" placeholder="••••••••" />
                      {confirmPasswordInput && newPasswordInput !== confirmPasswordInput && <p className="text-[11px] text-red-500 font-medium mt-0.5 animate-pulse">Mật khẩu nhập lại không khớp!</p>}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-border/50 mt-4">
                    <button type="button" onClick={() => { setIsSettingsOpen(false); setOldPasswordInput(""); setNewPasswordInput(""); setConfirmPasswordInput(""); }} className="flex-1 h-10 rounded-xl bg-muted text-muted-foreground text-xs font-bold hover:bg-muted/80 active:scale-95 transition-all cursor-pointer">Hủy bộ</button>
                    <button type="submit" className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm cursor-pointer">Lưu thay đổi</button>
                  </div>
                </form>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      ) : null}
    </div>
  );
}