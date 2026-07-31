import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Award, CheckCircle2, Info, Plus, RefreshCw, Search, Settings, Sparkles, Trophy, UserPlus } from "lucide-react";
import { badgeService, BadgeDTO } from "../services/badgeService";
import { Notify } from "notiflix";

type BadgeFilter = "all" | "auto" | "manual";

interface AutoBadgeRule {
  name: string;
  condition: string;
  trigger: string;
  iconUrl: string;
  configKey?: string;
  defaultValue?: string;
}

const autoBadgeRules: AutoBadgeRule[] = [
  {
    name: "Top Contributor",
    condition: "Người dùng nằm trong top N bảng đóng góp.",
    trigger: "Khi hệ thống tính leaderboard contributor.",
    configKey: "GROWTH_TOP_CONTRIBUTOR_LIMIT",
    defaultValue: "10",
    iconUrl: "/badges/top-contributor.svg",
  },
  {
    name: "First Approved Content",
    condition: "Có ít nhất 1 nội dung marketplace được duyệt.",
    trigger: "Khi contributor leaderboard được cập nhật.",
    iconUrl: "/badges/first-approved-content.svg",
  },
  {
    name: "Marketplace Contributor",
    condition: "Có đủ số nội dung marketplace được duyệt.",
    trigger: "Khi contributor leaderboard được cập nhật.",
    configKey: "REWARD_MARKETPLACE_CONTRIBUTOR_APPROVED_CONTENTS",
    defaultValue: "3",
    iconUrl: "/badges/marketplace-contributor.svg",
  },
  {
    name: "Popular Creator",
    condition: "Tổng lượt tải nội dung marketplace đạt mốc.",
    trigger: "Khi contributor leaderboard được cập nhật.",
    configKey: "REWARD_POPULAR_CREATOR_DOWNLOADS",
    defaultValue: "50",
    iconUrl: "/badges/popular-creator.svg",
  },
  {
    name: "Top Reviewer",
    condition: "Reviewer hoàn tất đủ số lượt vote review.",
    trigger: "Khi reviewer gửi kết quả review marketplace.",
    configKey: "REWARD_TOP_REVIEWER_REVIEWS",
    defaultValue: "10",
    iconUrl: "/badges/top-reviewer.svg",
  },
  {
    name: "Referral Starter",
    condition: "Người dùng apply một mã referral hợp lệ.",
    trigger: "Khi referral được ghi nhận trạng thái APPLIED.",
    iconUrl: "/badges/referral-starter.svg",
  },
  {
    name: "Referral Ambassador",
    condition: "Người mời đạt đủ số referral apply thành công.",
    trigger: "Khi referral được ghi nhận trạng thái APPLIED.",
    configKey: "GROWTH_REFERRAL_AMBASSADOR_INVITES",
    defaultValue: "5",
    iconUrl: "/badges/referral-ambassador.svg",
  },
  {
    name: "Reputation Milestone",
    condition: "Điểm reputation của người dùng đạt mốc cấu hình.",
    trigger: "Khi xử lý contributor, referral hoặc reviewer reward.",
    configKey: "REWARD_REPUTATION_MILESTONE_POINTS",
    defaultValue: "100",
    iconUrl: "/badges/reputation-milestone.svg",
  },
];

const autoBadgeNameSet = new Set(autoBadgeRules.map((rule) => rule.name.toLowerCase()));

function isAutoBadgeName(name: string) {
  return autoBadgeNameSet.has(name.trim().toLowerCase());
}

function BadgeIcon({ iconUrl, name, size = "md" }: { iconUrl?: string; name: string; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "size-16 rounded-2xl" : size === "sm" ? "size-10 rounded-xl" : "size-12 rounded-2xl";

  return (
    <div className={`${sizeClass} grid shrink-0 place-items-center border border-primary/10 bg-primary/[0.08] text-primary`}>
      {iconUrl ? (
        <img
          src={iconUrl}
          alt={name}
          className="size-3/5 object-contain"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <Award size={size === "lg" ? 28 : 22} />
      )}
    </div>
  );
}

export default function AdminBadgesTab() {
  const [badges, setBadges] = useState<BadgeDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [q, setQ] = useState("");
  const [activeFilter, setActiveFilter] = useState<BadgeFilter>("all");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "", iconUrl: "/badges/default.svg" });

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    setIsLoading(true);
    try {
      const res = (await badgeService.getBadges()) as any;
      if (res.success && res.data) {
        setBadges(res.data);
      }
    } catch (e: any) {
      Notify.failure(e.message || "Lỗi nạp danh sách huy hiệu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim()) {
      Notify.failure("Vui lòng điền đủ thông tin.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = (await badgeService.createBadge(formData)) as any;
      if (res.success && res.data) {
        Notify.success("Tạo huy hiệu thành công!");
        setBadges([res.data, ...badges]);
        setIsFormOpen(false);
        setFormData({ name: "", description: "", iconUrl: "/badges/default.svg" });
      }
    } catch (e: any) {
      Notify.failure(e.message || "Lỗi tạo huy hiệu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const manualBadges = useMemo(() => badges.filter((badge) => !isAutoBadgeName(badge.name)), [badges]);

  const autoBadges = useMemo(() => badges.filter((badge) => isAutoBadgeName(badge.name)), [badges]);

  const autoRulesWithBadge = useMemo(() => {
    return autoBadgeRules.map((rule) => ({
      ...rule,
      badge: badges.find((badge) => badge.name.trim().toLowerCase() === rule.name.toLowerCase()),
    }));
  }, [badges]);

  const searchKeyword = q.trim().toLowerCase();

  const visibleAutoRules = useMemo(() => {
    if (activeFilter === "manual") return [];
    return autoRulesWithBadge.filter((rule) => {
      if (!searchKeyword) return true;
      return (
        rule.name.toLowerCase().includes(searchKeyword)
        || rule.condition.toLowerCase().includes(searchKeyword)
        || rule.trigger.toLowerCase().includes(searchKeyword)
        || (rule.configKey ?? "").toLowerCase().includes(searchKeyword)
        || (rule.badge?.description ?? "").toLowerCase().includes(searchKeyword)
      );
    });
  }, [activeFilter, autoRulesWithBadge, searchKeyword]);

  const visibleManualBadges = useMemo(() => {
    if (activeFilter === "auto") return [];
    return manualBadges.filter((badge) => {
      if (!searchKeyword) return true;
      return (
        badge.name.toLowerCase().includes(searchKeyword)
        || badge.description.toLowerCase().includes(searchKeyword)
        || badge.iconUrl.toLowerCase().includes(searchKeyword)
      );
    });
  }, [activeFilter, manualBadges, searchKeyword]);

  const filters: Array<{ id: BadgeFilter; label: string; count: number }> = [
    { id: "all", label: "Tất cả", count: badges.length },
    { id: "auto", label: "Tự động", count: autoBadgeRules.length },
    { id: "manual", label: "Thủ công", count: manualBadges.length },
  ];

  return (
    <div className="space-y-5">
      <div className="surface-card border border-border/60 bg-card p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-extrabold text-primary">
              <Trophy size={18} />
              Badges
            </div>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight">Quản lý huy hiệu</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              Huy hiệu tự động được cấp bởi logic backend. Huy hiệu thủ công do admin tạo và gán cho người dùng ở mục quản lý user.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={loadBadges}
              disabled={isLoading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-4 text-xs font-extrabold text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
            >
              <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
              Tải lại
            </button>
            <button
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-extrabold text-primary-foreground transition-all hover:brightness-110"
            >
              <Plus size={15} />
              Tạo huy hiệu
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-muted/[0.18] p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
              <Award size={15} />
              Tổng DB
            </div>
            <div className="mt-2 text-2xl font-extrabold">{badges.length}</div>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-700">
              <Sparkles size={15} />
              Rule tự động
            </div>
            <div className="mt-2 text-2xl font-extrabold">{autoBadgeRules.length}</div>
          </div>
          <div className="rounded-xl border border-sky-500/20 bg-sky-500/[0.06] p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-sky-700">
              <UserPlus size={15} />
              Thủ công
            </div>
            <div className="mt-2 text-2xl font-extrabold">{manualBadges.length}</div>
          </div>
        </div>
      </div>

      <div className="surface-card border border-border/60 bg-card p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tên, điều kiện, config key hoặc mô tả..."
              className="h-11 w-full rounded-xl border border-border bg-muted/30 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {filters.map((filter) => {
              const active = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border px-3 text-xs font-extrabold transition-all ${
                    active ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:text-primary"
                  }`}
                >
                  {filter.label}
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{filter.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleCreateBadge} className="surface-card border border-sky-500/20 bg-sky-500/[0.05] p-5">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-extrabold text-foreground">
                    <UserPlus className="text-sky-600" size={18} />
                    Tạo huy hiệu thủ công
                  </h3>
                  <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
                    Huy hiệu tạo ở đây chưa tự cấp nếu backend chưa có rule. Admin có thể gán thủ công trong mục Users.
                  </p>
                </div>
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-sky-500/20 bg-card px-3 py-1 text-[10px] font-bold uppercase text-sky-700">
                  <Info size={12} />
                  Manual badge
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tên huy hiệu</label>
                  <input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-10 w-full rounded-xl border border-border bg-card px-3.5 text-sm font-medium outline-none focus:border-primary"
                    placeholder="VD: Excellent Mentor"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Icon URL</label>
                  <input
                    required
                    value={formData.iconUrl}
                    onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                    className="h-10 w-full rounded-xl border border-border bg-card px-3.5 text-sm font-medium outline-none focus:border-primary"
                    placeholder="/badges/icon.svg"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mô tả / lý do trao</label>
                  <input
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="h-10 w-full rounded-xl border border-border bg-card px-3.5 text-sm font-medium outline-none focus:border-primary"
                    placeholder="VD: Được admin trao cho thành viên hỗ trợ cộng đồng nổi bật"
                  />
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-3">
                <button type="button" onClick={() => setIsFormOpen(false)} className="h-10 rounded-xl bg-muted px-5 text-sm font-semibold text-muted-foreground hover:bg-muted/80">Hủy</button>
                <button type="submit" disabled={isSubmitting} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50">
                  {isSubmitting && <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
                  Tạo huy hiệu
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="surface-card border border-border/60 bg-card py-12 text-center text-muted-foreground">
          <div className="mx-auto mb-2 size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Đang tải dữ liệu...
        </div>
      ) : (
        <>
          {activeFilter !== "manual" && (
            <section className="surface-card border border-border/60 bg-card p-5">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-base font-extrabold">
                    <Sparkles size={17} className="text-emerald-600" />
                    Huy hiệu cấp tự động
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Những huy hiệu này do backend tự tạo nếu chưa có trong DB và tự gán khi người dùng đạt điều kiện.
                  </p>
                </div>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-1 text-xs font-bold text-emerald-700">
                  {autoBadges.length} đã có DB / {autoBadgeRules.length} rule
                </span>
              </div>

              {visibleAutoRules.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                  Không tìm thấy rule tự động phù hợp.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                  {visibleAutoRules.map((rule, index) => (
                    <motion.div
                      key={rule.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.035 }}
                      className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.035] p-4"
                    >
                      <div className="flex items-start gap-3">
                        <BadgeIcon iconUrl={rule.badge?.iconUrl || rule.iconUrl} name={rule.name} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-extrabold text-foreground">{rule.name}</h4>
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                              rule.badge ? "border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-700" : "border-amber-500/25 bg-amber-500/[0.08] text-amber-700"
                            }`}>
                              {rule.badge ? <CheckCircle2 size={11} /> : <Info size={11} />}
                              {rule.badge ? "Đã có DB" : "Sẽ tự tạo"}
                            </span>
                          </div>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">{rule.condition}</p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2 text-xs">
                        <div className="rounded-lg border border-border/50 bg-card/70 p-3">
                          <div className="mb-1 font-bold text-muted-foreground">Nơi điều chỉnh</div>
                          {rule.configKey ? (
                            <div className="break-all font-mono text-[11px] font-extrabold text-primary">{rule.configKey}</div>
                          ) : (
                            <div className="font-semibold text-muted-foreground">Cố định trong code</div>
                          )}
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div className="rounded-lg border border-border/50 bg-card/70 p-3">
                            <div className="mb-1 font-bold text-muted-foreground">Giá trị mặc định</div>
                            <div className="font-extrabold">{rule.defaultValue ?? "Không dùng config"}</div>
                          </div>
                          <div className="rounded-lg border border-border/50 bg-card/70 p-3">
                            <div className="mb-1 font-bold text-muted-foreground">Badge ID</div>
                            <div className="font-mono font-extrabold">{rule.badge ? `#${rule.badge.id}` : "-"}</div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 rounded-lg bg-card/60 p-3 text-xs leading-5 text-muted-foreground">
                        <span className="font-bold text-foreground">Trigger:</span> {rule.trigger}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeFilter !== "auto" && (
            <section className="surface-card border border-border/60 bg-card p-5">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-base font-extrabold">
                    <UserPlus size={17} className="text-sky-600" />
                    Huy hiệu thủ công / tuỳ chỉnh
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Nhóm này không nằm trong danh sách rule tự động hiện tại. Admin tạo và gán thủ công cho người dùng.
                  </p>
                </div>
                <span className="rounded-full border border-sky-500/20 bg-sky-500/[0.07] px-3 py-1 text-xs font-bold text-sky-700">
                  {manualBadges.length} huy hiệu
                </span>
              </div>

              {visibleManualBadges.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                  Không tìm thấy huy hiệu thủ công phù hợp.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {visibleManualBadges.map((badge, index) => (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.035 }}
                      className="rounded-xl border border-border/60 bg-muted/[0.14] p-4"
                    >
                      <div className="flex items-start gap-3">
                        <BadgeIcon iconUrl={badge.iconUrl} name={badge.name} size="lg" />
                        <div className="min-w-0 flex-1">
                          <h4 className="break-words font-extrabold text-foreground">{badge.name}</h4>
                          <p className="mt-1 line-clamp-3 text-xs leading-5 text-muted-foreground">{badge.description}</p>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-2 text-[11px]">
                        <div className="flex items-center justify-between rounded-lg border border-border/50 bg-card px-3 py-2">
                          <span className="font-bold text-muted-foreground">ID</span>
                          <span className="font-mono font-extrabold">#{badge.id}</span>
                        </div>
                        <div className="rounded-lg border border-border/50 bg-card px-3 py-2">
                          <div className="mb-1 flex items-center gap-1.5 font-bold text-muted-foreground">
                            <Settings size={12} />
                            Icon URL
                          </div>
                          <div className="break-all font-mono text-[10px] text-muted-foreground">{badge.iconUrl}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
