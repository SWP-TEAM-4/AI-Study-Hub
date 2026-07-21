"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
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
  Gauge,
  History,
  ChevronDown,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { userService, UserDTO, TestHistoryDTO, ActivityLogDTO, AIUsageDTO } from "../services/userService";
import { communityService, ReferralDTO } from "../services/communityService";
import { communityRoleService, CommunityRoleDTO } from "../services/communityRoleService";
import { feedbackService } from "../services/feedbackService";
import { notebookService } from "../services/notebookService";
import { documentService } from "../services/documentService";
import { flashcardService } from "../services/flashcardService";
import { academicService, ComboDTO, SemesterDTO } from "../services/academicService";
import { reputationService, type AiQuotaStatusDTO, type ReputationEventDTO } from "../services/reputationService";
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import { useAuthStore } from "../store/useAuthStore";
import { safeLocalStorage } from "../utils/safeStorage";

// ───  1. GLOBAL STATIC CONFIGURATIONS ───────────────────────────────────────

const emptyStats = {
  notebooks: 0,
  documents: 0,
  tests: 0,
  flashcardDecks: 0,
};

const reputationEventLabels: Record<string, string> = {
  CONTENT_APPROVED_DOCUMENT: "Tài liệu được duyệt",
  CONTENT_APPROVED_QUIZ: "Quiz được duyệt",
  CONTENT_APPROVED_FLASHCARD_DECK: "Flashcard được duyệt",
  MARKETPLACE_CLONE_RECEIVED: "Có lượt clone từ cộng đồng",
  CONTENT_DOWNLOAD_MILESTONE: "Đạt mốc lượt tải",
  COMMUNITY_REVIEW_GOOD: "Nội dung được đánh giá tốt",
  COMMUNITY_REVIEW_BAD: "Nội dung bị đánh giá thấp",
  REVIEWER_MARKETPLACE_VOTE: "Hoàn thành lượt duyệt",
  REVIEWER_DECISION_ALIGNED: "Duyệt khớp quyết định cuối",
  CONTENT_REPORT_ACCEPTED: "Báo cáo hợp lệ",
  CONTENT_REPORT_REJECTED: "Báo cáo bị từ chối",
  CONTENT_REPORT_OWNER_PENALTY: "Nội dung bị report xấu",
  CONTENT_HIDDEN_PENALTY: "Nội dung bị ẩn",
};

function reputationEventTitle(event: ReputationEventDTO): string {
  return event.displayTitle || reputationEventLabels[event.eventType] || event.eventType;
}

function reputationEventSubtitle(event: ReputationEventDTO): string {
  return event.displayMessage || event.reason || event.periodKey || "Điểm uy tín được cập nhật";
}

/**
 * Tính initials an toàn từ fullName. Trả về "" nếu rỗng/null/undefined.
 */
function computeInitials(fullName?: string | null): string {
  if (!fullName) return "";
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/**
 * Hook thu gọn / mở rộng có nhớ trạng thái vào localStorage.
 * `defaultOpen` chỉ áp dụng cho lần đầu; các lần sau user tự chọn sẽ được ghi nhớ.
 */
function usePersistentDisclosure(key: string, defaultOpen: boolean) {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === "undefined") return defaultOpen;
    try {
      const stored = safeLocalStorage.getItem(key);
      return stored === null ? defaultOpen : stored === "1";
    } catch {
      return defaultOpen;
    }
  });

  const setOpen = (value: boolean) => {
    setIsOpen(value);
    try {
      safeLocalStorage.setItem(key, value ? "1" : "0");
    } catch {
      /* ignore quota / privacy errors */
    }
  };

  const toggle = () => setOpen(!isOpen);
  return { isOpen, setOpen, toggle } as const;
}

/**
 * Tính streak (số ngày hoạt động liên tiếp) từ danh sách ActivityLogDTO.
 * Logic: nhóm log theo ngày (YYYY-MM-DD, local timezone) → duyệt từ hôm nay
 * lùi về, đếm số ngày liên tiếp có activity. Nếu hôm nay chưa có → bắt đầu từ hôm qua.
 */
function computeStreakFromLogs(logs: { createdAt: string }[]): number {
  if (!logs || logs.length === 0) return 0;
  const toDayKey = (ts: string | Date): string => {
    const d = typeof ts === "string" ? new Date(ts) : ts;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  const uniqueDays = new Set(logs.map((l) => toDayKey(l.createdAt)));

  const today = new Date();
  const todayKey = toDayKey(today);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  // Nếu user chưa hoạt động hôm nay, streak đo từ hôm qua trở về
  let cursor = uniqueDays.has(todayKey) ? today : yesterday;
  let streak = 0;
  while (uniqueDays.has(toDayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

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
  const [aiQuota, setAiQuota] = useState<AiQuotaStatusDTO | null>(null);
  const [reputationEvents, setReputationEvents] = useState<ReputationEventDTO[]>([]);
  const [myReferral, setMyReferral] = useState<ReferralDTO | null>(null);
  const [myRoles, setMyRoles] = useState<CommunityRoleDTO[]>([]);
  const [stats, setStats] = useState(emptyStats);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // States quản lý Mã giới thiệu
  const [referralCodeInput, setReferralCodeInput] = useState("");
  const [applyingReferral, setApplyingReferral] = useState(false);

  // States quản lý UI điều khiển Hộp thoại Cài đặt
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState<string | null>(null);
  const [editSemesterId, setEditSemesterId] = useState<number | null>(null);
  const [editComboId, setEditComboId] = useState<number | null>(null);
  const [semesters, setSemesters] = useState<SemesterDTO[]>([]);
  const [combos, setCombos] = useState<ComboDTO[]>([]);

  // States kiểm duyệt mật khẩu bảo mật
  const [oldPasswordInput, setOldPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");

  // States quản lý Form gửi góp ý / Báo cáo lỗi
  const [fbTitle, setFbTitle] = useState("");
  const [fbContent, setFbContent] = useState("");
  const [isFbSubmitting, setFbSubmitting] = useState(false);

  // 📦 Trạng thái thu gọn/mở rộng các card dài — nhớ qua các lần tải trang
  const testHistoryDisclosure = usePersistentDisclosure("profile.testHistory.open", true);
  const activityLogDisclosure = usePersistentDisclosure("profile.activityLogs.open", true);
  const myRolesDisclosure = usePersistentDisclosure("profile.myRoles.open", true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🔄 HÀM NẠP TIẾN TRÌNH ĐỒNG BỘ ĐÃ NÂNG CẤP BIỆN PHÁP AN TOÀN
  const loadFullProfileData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const profileRes = await userService.getMyProfile();

      if (profileRes.success && profileRes.data) {
        setUserInfo(profileRes.data);
        setEditName(profileRes.data.fullName);
        setEditAvatarUrl(profileRes.data.avatarUrl);
        setEditSemesterId(profileRes.data.currentSemesterId);
        setEditComboId(profileRes.data.comboId);
      }

      const [badgesRes, testsRes, logsRes, aiRes, quotaRes, reputationRes, refRes, rolesRes, notebooksRes, documentsRes, flashcardsRes, semestersRes, combosRes] = await Promise.allSettled([
        userService.getMyBadges(),
        userService.getMyTestHistory({ page: 0, size: 5, sort: "newest" }),
        userService.getMyActivityLogs({ page: 0, size: 100, sort: "newest" }),
        userService.getMyAIUsage(),
        reputationService.getMyAiQuota(),
        reputationService.getMyReputationEvents(0, 8),
        communityService.getMyReferralInfo(),
        communityRoleService.getMyCommunityRoles(),
        notebookService.getNotebooks(0, 1),
        documentService.getWorkspaceDocuments(0, 1),
        flashcardService.getMyFlashcardDecks(0, 1),
        academicService.getSemesters(),
        academicService.getCombos(),
      ]);

      if (badgesRes.status === "fulfilled" && badgesRes.value.success && badgesRes.value.data) {
        const mappedBadges = badgesRes.value.data.map((b: any, index: number) => {
          const colorMap = ["165", "35", "200", "75"];
          return {
            ...b,
            color: b.color || colorMap[index % colorMap.length],
          };
        });
        setBadges(mappedBadges);
      } else {
        setBadges([]);
      }

      if (testsRes.status === "fulfilled" && testsRes.value.success && testsRes.value.data) {
        setTestHistory(testsRes.value.data.items || []);
      } else {
        setTestHistory([]);
      }

      if (logsRes.status === "fulfilled" && logsRes.value.success && logsRes.value.data) {
        setActivityLogs(logsRes.value.data.items || []);
      } else {
        setActivityLogs([]);
      }

      setAiUsage(aiRes.status === "fulfilled" && aiRes.value.success ? aiRes.value.data : null);
      setAiQuota(quotaRes.status === "fulfilled" && quotaRes.value.success ? quotaRes.value.data : null);
      setReputationEvents(reputationRes.status === "fulfilled" && reputationRes.value.success ? reputationRes.value.data.items || [] : []);
      setMyReferral(refRes.status === "fulfilled" && refRes.value.success ? refRes.value.data : null);
      setMyRoles(rolesRes.status === "fulfilled" && rolesRes.value.success ? rolesRes.value.data : []);

      setStats({
        notebooks: notebooksRes.status === "fulfilled" ? notebooksRes.value.data.totalElements : 0,
        documents: documentsRes.status === "fulfilled" ? documentsRes.value.data.totalElements : 0,
        tests: testsRes.status === "fulfilled" ? testsRes.value.data.totalElements : 0,
        flashcardDecks: flashcardsRes.status === "fulfilled" ? flashcardsRes.value.data.totalElements : 0,
      });
      setSemesters(semestersRes.status === "fulfilled" && semestersRes.value.success ? semestersRes.value.data : []);
      setCombos(combosRes.status === "fulfilled" && combosRes.value.success ? combosRes.value.data : []);

    } catch (err: any) {
      setLoadError(err.message || "Không thể tải hồ sơ cá nhân từ backend.");
      Notify.failure(err.message || "Không thể tải hồ sơ cá nhân");
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
      Notify.warning("Backend profile hiện nhận avatarUrl, chưa có API upload avatar. Hãy dán URL ảnh đại diện.");
      e.target.value = "";
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
        avatarUrl: editAvatarUrl,
        currentSemesterId: editSemesterId,
        comboId: editComboId,
      });

      if (updateRes.success) {
        setUserInfo(updateRes.data || null);
        if (updateRes.data && typeof window !== "undefined") {
          const { id, email, fullName, avatarUrl, role, reputationPoints, createdAt } = updateRes.data;
          safeLocalStorage.setJSON("auth_user", { userId: id, email, fullName, avatarUrl, role, reputationPoints, createdAt });
        }
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

  if (isLoading) {
    return (
      <div className="py-24 text-center text-muted-foreground font-mono text-xs app-shell-font">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Đang đồng bộ cấu trúc dữ liệu hồ sơ cá nhân...
      </div>
    );
  }

  if (loadError || !userInfo) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center app-shell-font">
        <div className="surface-card p-8">
          <h1 className="text-xl font-bold text-foreground">Không thể tải hồ sơ</h1>
          <p className="mt-2 text-sm text-muted-foreground">{loadError || "Backend không trả về dữ liệu profile."}</p>
          <button
            onClick={loadFullProfileData}
            className="mt-5 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const statsConfig = [
    { label: "Notebook", value: stats.notebooks, icon: BookMarked },
    { label: "Tài liệu", value: stats.documents, icon: FileText },
    { label: "Quiz đã làm", value: stats.tests, icon: GraduationCap },
    { label: "Bộ flashcard", value: stats.flashcardDecks, icon: BookMarked },
  ];

  // 🔥 Streak học tập thật, tính từ nhật ký hoạt động (createdAt)
  const learningStreak = computeStreakFromLogs(activityLogs);

  const aiUsageCards = [
    { label: "Tổng request", value: aiUsage?.totalRequests ?? 0 },
    { label: "Chat", value: aiUsage?.chatRequests ?? 0 },
    { label: "Tóm tắt", value: aiUsage?.summaryRequests ?? 0 },
    { label: "Sinh quiz", value: aiUsage?.quizGenerations ?? 0 },
    { label: "Sinh flashcard", value: aiUsage?.flashcardGenerations ?? 0 },
    { label: "Chunking tài liệu", value: aiUsage?.documentChunkingRequests ?? 0 },
    { label: "Vector tài liệu", value: aiUsage?.documentEmbeddingRequests ?? 0 },
    { label: "Tokens", value: (aiUsage?.totalTokens ?? 0).toLocaleString() },
  ];

  const quotaUsageCards = aiQuota ? [
    {
      label: "Chat",
      dailyUsed: aiQuota.dailyChatUsed,
      dailyLimit: aiQuota.tier?.dailyChatLimit ?? 0,
      monthlyUsed: aiQuota.monthlyChatUsed,
      monthlyLimit: aiQuota.tier?.monthlyChatLimit ?? 0,
      available: aiQuota.chatAvailable !== false,
    },
    {
      label: "Tóm tắt",
      dailyUsed: aiQuota.dailySummaryUsed,
      dailyLimit: aiQuota.tier?.dailySummaryLimit ?? 0,
      monthlyUsed: aiQuota.monthlySummaryUsed,
      monthlyLimit: aiQuota.tier?.monthlySummaryLimit ?? 0,
      available: aiQuota.summaryAvailable !== false,
    },
    {
      label: "Sinh nội dung",
      dailyUsed: aiQuota.dailyGenerationUsed,
      dailyLimit: aiQuota.tier?.dailyGenerationLimit ?? 0,
      monthlyUsed: aiQuota.monthlyGenerationUsed,
      monthlyLimit: aiQuota.tier?.monthlyGenerationLimit ?? 0,
      available: aiQuota.generationAvailable !== false,
    },
  ] : [];

  const quotaPercent = (used: number, limit: number) => {
    if (!limit || limit <= 0) return 0;
    return Math.min(100, Math.round((used / limit) * 100));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative app-shell-font">

      {/* Banner Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="surface-card gradient-hero p-6 lg:p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-center relative z-10">
          <div className="size-24 rounded-3xl bg-ink text-cream grid place-items-center text-3xl font-display font-bold shadow-inner overflow-hidden shrink-0 border border-white/10">
            {userInfo.avatarUrl ? (
              <img src={userInfo.avatarUrl} alt={userInfo.fullName} className="w-full h-full object-cover" />
            ) : (
              computeInitials(userInfo.fullName) || "U"
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
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-coral/10 text-coral text-xs font-semibold border border-coral/10"><Flame size={12} fill="currentColor" /> Chuỗi học tập {learningStreak} ngày</div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning/10 text-warning-foreground text-xs font-semibold border border-warning/10"><Award size={12} /> {userInfo.reputationPoints.toLocaleString()} reputation</div>
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto shrink-0">
            <button onClick={() => { setEditName(userInfo.fullName); setEditAvatarUrl(userInfo.avatarUrl); setEditSemesterId(userInfo.currentSemesterId); setEditComboId(userInfo.comboId); setIsSettingsOpen(true); }} className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 h-10 rounded-xl bg-card border border-border text-sm font-semibold hover:bg-muted transition-all cursor-pointer"><Settings size={14} /> Cài đặt</button>
            <button onClick={handleLogout} className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 h-10 rounded-xl bg-destructive/10 text-destructive text-sm font-semibold hover:bg-destructive/20 transition-all cursor-pointer"><LogOut size={14} /> Đăng xuất</button>
          </div>
        </div>
      </motion.div>

      {/* Stats Dashboard Tiles */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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
          <div className="text-2xl font-bold font-display tracking-tight text-foreground">{aiUsage ? aiUsage.totalRequests : 0}</div>
          <div className="text-xs font-medium text-muted-foreground mt-0.5">Lượt gọi AI</div>
        </div>
      </section>

      <section className="surface-card p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 text-left">
          <div>
            <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
              <Cpu size={18} className="text-coral" /> Thống kê sử dụng AI
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Dữ liệu sử dụng AI</p>
          </div>
          {aiUsage?.estimatedCost !== undefined && (
            <div className="text-xs font-mono px-3 py-1.5 rounded-full bg-muted/50 border border-border text-muted-foreground">
              Cost: ${aiUsage.estimatedCost.toFixed(4)}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {aiUsageCards.map((item) => (
            <div key={item.label} className="rounded-xl bg-muted/35 border border-border p-3 text-left">
              <div className="text-xl font-bold">{item.value}</div>
              <div className="text-[10px] text-muted-foreground uppercase font-bold mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="surface-card p-5 lg:col-span-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 text-left">
            <div>
              <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                <Gauge size={18} className="text-primary" /> Quota AI theo reputation
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                Tier hiện tại: <span className="font-bold text-foreground">{aiQuota?.tier?.name || "Chưa có tier"}</span>
              </p>
            </div>
            <div className="text-xs font-mono px-3 py-1.5 rounded-full bg-muted/50 border border-border text-muted-foreground">
              {aiQuota ? `${aiQuota.reputationPoints.toLocaleString("vi-VN")} điểm` : "N/A"}
            </div>
          </div>
          {quotaUsageCards.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-left">Chưa có dữ liệu quota AI.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {quotaUsageCards.map((item) => {
                const dailyPercent = quotaPercent(item.dailyUsed, item.dailyLimit);
                const monthlyPercent = quotaPercent(item.monthlyUsed, item.monthlyLimit);
                return (
                  <div key={item.label} className="rounded-xl bg-muted/35 border border-border p-4 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-bold text-foreground">{item.label}</div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.available ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                        {item.available ? "Available" : "Limited"}
                      </span>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                          <span>Ngày</span><span>{item.dailyUsed}/{item.dailyLimit}</span>
                        </div>
                        <div className="mt-1 h-1.5 rounded-full bg-border/60 overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${dailyPercent}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                          <span>Tháng</span><span>{item.monthlyUsed}/{item.monthlyLimit}</span>
                        </div>
                        <div className="mt-1 h-1.5 rounded-full bg-border/60 overflow-hidden">
                          <div className="h-full rounded-full bg-coral" style={{ width: `${monthlyPercent}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="surface-card p-5">
          <div className="text-left mb-4">
            <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
              <History size={16} className="text-amber-500" /> Lịch sử điểm
            </h2>
          </div>
          <div className="space-y-3 text-left">
            {reputationEvents.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4">Chưa có event cộng/trừ điểm.</p>
            ) : (
              reputationEvents.map((event) => (
                <div key={event.id} className="flex items-start justify-between gap-3 rounded-xl border border-border/50 bg-muted/20 p-3">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-bold text-foreground">{reputationEventTitle(event)}</div>
                    <div className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">
                      {reputationEventSubtitle(event)}
                    </div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground/70">
                      {event.createdAt ? new Date(event.createdAt).toLocaleDateString("vi-VN") : event.periodKey || "N/A"}
                    </div>
                  </div>
                  <div className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-black ${event.pointsDelta >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                    {event.pointsDelta >= 0 ? "+" : ""}{event.pointsDelta}
                  </div>
                </div>
              ))
            )}
          </div>
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
          <div className="flex items-center justify-between mb-4 text-left">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2 text-foreground">
              <UserCheck className="text-primary" size={18} /> Vai trò cộng đồng
            </h2>
            <button
              onClick={myRolesDisclosure.toggle}
              aria-expanded={myRolesDisclosure.isOpen}
              aria-label={myRolesDisclosure.isOpen ? "Thu gọn" : "Mở rộng"}
              className="size-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
            >
              <motion.span animate={{ rotate: myRolesDisclosure.isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={16} />
              </motion.span>
            </button>
          </div>
          <AnimatePresence initial={false}>
            {myRolesDisclosure.isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
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
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      {/* Lịch sử thi & Nhật ký hoạt động */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="surface-card p-5 lg:col-span-2 overflow-hidden flex flex-col">
          <div className="text-left mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2"><GraduationCap size={22} className="text-primary" /> Lịch sử làm bài kiểm tra</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Kết quả điểm số các bài test trắc nghiệm kiến thức môn học</p>
            </div>
            <button
              onClick={testHistoryDisclosure.toggle}
              aria-expanded={testHistoryDisclosure.isOpen}
              aria-label={testHistoryDisclosure.isOpen ? "Thu gọn" : "Mở rộng"}
              className="size-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center shrink-0"
            >
              <motion.span animate={{ rotate: testHistoryDisclosure.isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={16} />
              </motion.span>
            </button>
          </div>
          <AnimatePresence initial={false}>
            {testHistoryDisclosure.isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden flex-1 flex flex-col"
              >
                <div className="overflow-x-auto rounded-xl border border-border/50 flex-1">
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
                            <td className="px-4 py-3 text-right"><span className={`text-[9px] px-2.5 py-0.5 rounded-full font-medium uppercase ${test.status === "COMPLETED" ? "bg-emerald-500/12 text-emerald-300 border border-emerald-500/25" : "bg-amber-500/12 text-amber-300 border border-amber-500/25"}`}>{test.status}</span></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nhật ký hoạt động */}
        <div className="surface-card p-5 flex flex-col">
          <div className="text-left mb-4 flex items-start justify-between gap-3">
            <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2"><FileText size={16} className="text-coral" /> Nhật ký hoạt động</h2>
            <button
              onClick={activityLogDisclosure.toggle}
              aria-expanded={activityLogDisclosure.isOpen}
              aria-label={activityLogDisclosure.isOpen ? "Thu gọn" : "Mở rộng"}
              className="size-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center shrink-0"
            >
              <motion.span animate={{ rotate: activityLogDisclosure.isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={16} />
              </motion.span>
            </button>
          </div>
          <AnimatePresence initial={false}>
            {activityLogDisclosure.isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden flex-1"
              >
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
              </motion.div>
            )}
          </AnimatePresence>
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
                      <div className="flex justify-between items-center border-b border-border/40 pb-2"><span className="text-muted-foreground font-medium">User ID:</span><span className="font-mono font-bold text-foreground">#{userInfo.id}</span></div>
                      <div className="flex flex-col gap-1 border-b border-border/40 pb-2"><span className="text-muted-foreground font-medium">Học kỳ hiện tại:</span><span className="font-semibold text-foreground">{userInfo.currentSemesterCode ? `${userInfo.currentSemesterCode} - ${userInfo.currentSemesterName}` : "Chưa cập nhật"}</span></div>
                      <div className="flex flex-col gap-1"><span className="text-muted-foreground font-medium">Combo ngành:</span><span className="inline-flex items-center gap-1.5 font-bold text-coral bg-coral/5 border border-coral/10 px-2.5 py-1 rounded-lg w-fit mt-1 text-xs">{userInfo.comboCode ? `${userInfo.comboCode} - ${userInfo.comboName}` : "Chưa cập nhật"}</span></div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2 border-t border-border/50 text-left">
                    <div className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1"><User size={12} /> Thay đổi thông tin cá nhân</div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground">Ảnh đại diện tài khoản:</label>
                      <div className="flex gap-4 items-center">
                        <div onClick={() => fileInputRef.current?.click()} className="size-20 rounded-2xl bg-ink text-cream text-2xl font-bold grid place-items-center cursor-pointer overflow-hidden relative border border-border/40 shadow-inner group shrink-0">
                          {editAvatarUrl ? <img src={editAvatarUrl} alt="Preview" className="w-full h-full object-cover group-hover:opacity-70 transition-opacity" /> : (computeInitials(userInfo.fullName) || "U")}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white gap-1 transition-all duration-200"><Camera size={16} /><span className="text-[9px] font-bold uppercase tracking-wider">Thay ảnh</span></div>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                        <div className="text-xs text-muted-foreground leading-relaxed font-medium">Backend đang hỗ trợ lưu URL ảnh đại diện trong profile.</div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Avatar URL:</label>
                      <input
                        type="url"
                        value={editAvatarUrl || ""}
                        onChange={(e) => setEditAvatarUrl(e.target.value || null)}
                        placeholder="https://..."
                        className="w-full px-3.5 h-10 rounded-xl bg-muted/60 border border-transparent focus:border-primary focus:bg-card outline-none text-sm transition-all font-medium text-foreground"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Họ và tên hiển thị:</label>
                      <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-3.5 h-10 rounded-xl bg-muted/60 border border-transparent focus:border-primary focus:bg-card outline-none text-sm transition-all font-medium text-foreground" required />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Học kỳ hiện tại:</label>
                        <select
                          value={editSemesterId ?? ""}
                          onChange={(e) => setEditSemesterId(e.target.value ? Number(e.target.value) : null)}
                          className="w-full px-3.5 h-10 rounded-xl bg-muted/60 border border-transparent focus:border-primary focus:bg-card outline-none text-sm transition-all font-medium text-foreground"
                        >
                          <option value="">Chưa chọn</option>
                          {semesters.map((semester) => (
                            <option key={semester.id} value={semester.id}>{semester.code} - {semester.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Combo ngành:</label>
                        <select
                          value={editComboId ?? ""}
                          onChange={(e) => setEditComboId(e.target.value ? Number(e.target.value) : null)}
                          className="w-full px-3.5 h-10 rounded-xl bg-muted/60 border border-transparent focus:border-primary focus:bg-card outline-none text-sm transition-all font-medium text-foreground"
                        >
                          <option value="">Chưa chọn</option>
                          {combos.map((combo) => (
                            <option key={combo.id} value={combo.id}>{combo.code} - {combo.name}</option>
                          ))}
                        </select>
                      </div>
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
