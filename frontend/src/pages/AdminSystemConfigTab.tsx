import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  Bot,
  Edit2,
  KeyRound,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Store,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Notify } from "notiflix";
import { systemConfigService, SystemConfigDTO } from "../services/systemConfigService";

type ConfigGroupId = "all" | "reward" | "marketplace" | "growth" | "ai" | "security" | "safety" | "other";

const rewardThresholds = [
  {
    key: "GROWTH_TOP_CONTRIBUTOR_LIMIT",
    badge: "Top Contributor",
    condition: "Top N người trên bảng đóng góp",
    unit: "người",
  },
  {
    key: "REWARD_MARKETPLACE_CONTRIBUTOR_APPROVED_CONTENTS",
    badge: "Marketplace Contributor",
    condition: "Số nội dung marketplace được duyệt",
    unit: "nội dung",
  },
  {
    key: "REWARD_POPULAR_CREATOR_DOWNLOADS",
    badge: "Popular Creator",
    condition: "Tổng lượt tải marketplace",
    unit: "lượt tải",
  },
  {
    key: "REWARD_TOP_REVIEWER_REVIEWS",
    badge: "Top Reviewer",
    condition: "Số lượt reviewer đã vote",
    unit: "review",
  },
  {
    key: "GROWTH_REFERRAL_AMBASSADOR_INVITES",
    badge: "Referral Ambassador",
    condition: "Số referral apply thành công",
    unit: "người",
  },
  {
    key: "REWARD_REPUTATION_MILESTONE_POINTS",
    badge: "Reputation Milestone",
    condition: "Điểm reputation tối thiểu",
    unit: "điểm",
  },
];

const hardcodedRewardRules = [
  { badge: "First Approved Content", condition: "Có ít nhất 1 nội dung marketplace được duyệt" },
  { badge: "Referral Starter", condition: "Apply một mã referral hợp lệ" },
];

const configGroups: Array<{ id: ConfigGroupId; label: string; icon: typeof Settings; hint: string }> = [
  { id: "all", label: "Tất cả", icon: SlidersHorizontal, hint: "Toàn bộ cấu hình" },
  { id: "reward", label: "Huy hiệu", icon: Award, hint: "Ngưỡng cấp badge tự động" },
  { id: "marketplace", label: "Marketplace", icon: Store, hint: "Duyệt, tải, hoa hồng" },
  { id: "growth", label: "Growth", icon: Users, hint: "Referral, đề cử cộng đồng" },
  { id: "ai", label: "AI", icon: Bot, hint: "Quota AI hằng ngày" },
  { id: "security", label: "Bảo mật", icon: KeyRound, hint: "Token, đăng ký, upload" },
  { id: "safety", label: "Safety", icon: ShieldCheck, hint: "Kiểm duyệt tài liệu" },
  { id: "other", label: "Khác", icon: Settings, hint: "Config còn lại" },
];

function normalizeKey(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "_");
}

function resolveGroup(configKey: string): ConfigGroupId {
  if (rewardThresholds.some((item) => item.key === configKey)) return "reward";
  if (configKey.startsWith("MARKETPLACE_") || configKey.includes("DOWNLOAD") || configKey.includes("COMMISSION")) return "marketplace";
  if (configKey.startsWith("GROWTH_") || configKey.startsWith("COMMUNITY_")) return "growth";
  if (configKey.startsWith("AI_")) return "ai";
  if (configKey.includes("TOKEN") || configKey.includes("REGISTRATION") || configKey.includes("UPLOAD") || configKey.includes("ALLOWED_FILE")) return "security";
  if (configKey.includes("SAFETY") || configKey.includes("MODERATION")) return "safety";
  return "other";
}

function groupClasses(groupId: ConfigGroupId) {
  switch (groupId) {
    case "reward":
      return "border-amber-500/25 bg-amber-500/[0.06] text-amber-700";
    case "marketplace":
      return "border-sky-500/25 bg-sky-500/[0.06] text-sky-700";
    case "growth":
      return "border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-700";
    case "ai":
      return "border-violet-500/25 bg-violet-500/[0.06] text-violet-700";
    case "security":
      return "border-rose-500/25 bg-rose-500/[0.06] text-rose-700";
    case "safety":
      return "border-teal-500/25 bg-teal-500/[0.06] text-teal-700";
    default:
      return "border-border bg-muted/40 text-muted-foreground";
  }
}

export default function AdminSystemConfigTab() {
  const [configs, setConfigs] = useState<SystemConfigDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [q, setQ] = useState("");
  const [activeGroup, setActiveGroup] = useState<ConfigGroupId>("all");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ configKey: "", configValue: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState({ configKey: "", configValue: "", description: "" });

  useEffect(() => {
    loadConfigs();
  }, []);

  const configsByKey = useMemo(() => new Map(configs.map((config) => [config.configKey, config])), [configs]);

  const groupCounts = useMemo(() => {
    const counts = new Map<ConfigGroupId, number>();
    configGroups.forEach((group) => counts.set(group.id, group.id === "all" ? configs.length : 0));
    configs.forEach((config) => {
      const groupId = resolveGroup(config.configKey);
      counts.set(groupId, (counts.get(groupId) ?? 0) + 1);
    });
    return counts;
  }, [configs]);

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    return configs.filter((config) => {
      const groupMatch = activeGroup === "all" || resolveGroup(config.configKey) === activeGroup;
      const textMatch = !keyword
        || config.configKey.toLowerCase().includes(keyword)
        || config.configValue.toLowerCase().includes(keyword)
        || (config.description ?? "").toLowerCase().includes(keyword);
      return groupMatch && textMatch;
    });
  }, [configs, activeGroup, q]);

  const loadConfigs = async () => {
    setIsLoading(true);
    try {
      const res = (await systemConfigService.getAdminConfigs()) as any;
      if (res.success && res.data) {
        setConfigs(res.data);
      }
    } catch (e: any) {
      Notify.failure(e.message || "Lỗi tải cấu hình hệ thống");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.configKey.trim() || !formData.configValue.trim()) {
      Notify.failure("Vui lòng điền tối thiểu Key và Value.");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = { ...formData, configKey: normalizeKey(formData.configKey) };
      const res = (await systemConfigService.createConfig(payload)) as any;
      if (res.success && res.data) {
        Notify.success("Tạo cấu hình thành công!");
        setConfigs([res.data, ...configs]);
        setIsFormOpen(false);
        setFormData({ configKey: "", configValue: "", description: "" });
      }
    } catch (e: any) {
      Notify.failure(e.message || "Lỗi tạo cấu hình");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editData.configKey.trim() || !editData.configValue.trim()) {
      Notify.failure("Key và Value không được để trống.");
      return;
    }
    try {
      const payload = { ...editData, configKey: normalizeKey(editData.configKey) };
      const res = (await systemConfigService.updateConfig(id, payload)) as any;
      if (res.success && res.data) {
        Notify.success("Cập nhật thành công!");
        setConfigs(configs.map((config) => config.id === id ? res.data! : config));
        setEditingId(null);
      }
    } catch (e: any) {
      Notify.failure(e.message || "Lỗi cập nhật cấu hình");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa cấu hình này? Hệ thống có thể gặp lỗi nếu thiếu cấu hình quan trọng.")) return;
    try {
      const res = (await systemConfigService.deleteConfig(id)) as any;
      if (res.success) {
        Notify.success("Xóa cấu hình thành công!");
        setConfigs(configs.filter((config) => config.id !== id));
      }
    } catch (e: any) {
      Notify.failure(e.message || "Lỗi xóa cấu hình");
    }
  };

  const beginEdit = (config: SystemConfigDTO) => {
    setEditingId(config.id);
    setEditData({ configKey: config.configKey, configValue: config.configValue, description: config.description || "" });
  };

  const prepareCreate = (key?: string, description?: string) => {
    setFormData({ configKey: key ?? "", configValue: "", description: description ?? "" });
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-5">
      <div className="surface-card border border-border/60 bg-card p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-extrabold text-primary">
              <Settings size={18} />
              System Config
            </div>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight">Cấu hình hệ thống</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              Các ngưỡng huy hiệu tự động được lưu trong database tại bảng system_configs. Công thức cấp badge vẫn nằm trong backend.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={loadConfigs}
              disabled={isLoading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-4 text-xs font-extrabold text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
            >
              <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
              Tải lại
            </button>
            <button
              onClick={() => prepareCreate()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-extrabold text-primary-foreground transition-all hover:brightness-110"
            >
              <Plus size={15} />
              Thêm cấu hình
            </button>
          </div>
        </div>
      </div>

      <section className="surface-card border border-border/60 bg-card p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-base font-extrabold">
              <Award size={17} className="text-amber-600" />
              Ngưỡng huy hiệu tự động
            </h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Có thể chỉnh nhanh các mốc số. Hai huy hiệu cuối đang cố định theo logic backend.
            </p>
          </div>
          <span className="rounded-full border border-amber-500/20 bg-amber-500/[0.07] px-3 py-1 text-xs font-bold text-amber-700">
            {rewardThresholds.length} config DB · {hardcodedRewardRules.length} rule cố định
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {rewardThresholds.map((threshold) => {
            const config = configsByKey.get(threshold.key);
            const isEditing = config && editingId === config.id;
            return (
              <div key={threshold.key} className="rounded-xl border border-border/60 bg-muted/[0.18] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-foreground">{threshold.badge}</div>
                    <div className="mt-1 text-xs leading-5 text-muted-foreground">{threshold.condition}</div>
                    <div className="mt-2 break-all font-mono text-[10px] font-bold text-muted-foreground">{threshold.key}</div>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${config ? "border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-700" : "border-rose-500/25 bg-rose-500/[0.08] text-rose-700"}`}>
                    {config ? "DB" : "Thiếu"}
                  </span>
                </div>

                <div className="mt-4 flex items-end gap-2">
                  <div className="min-w-0 flex-1">
                    <label className="mb-1 block text-[10px] font-bold uppercase text-muted-foreground">Giá trị</label>
                    {isEditing ? (
                      <input
                        value={editData.configValue}
                        onChange={(event) => setEditData({ ...editData, configValue: event.target.value })}
                        className="h-10 w-full rounded-xl border border-border bg-card px-3 font-mono text-sm font-bold outline-none focus:border-primary"
                      />
                    ) : (
                      <div className="flex h-10 items-center rounded-xl border border-border/60 bg-card px-3 font-mono text-sm font-extrabold">
                        {config?.configValue ?? "-"}
                        {config && <span className="ml-2 font-sans text-xs font-semibold text-muted-foreground">{threshold.unit}</span>}
                      </div>
                    )}
                  </div>
                  {config ? (
                    isEditing ? (
                      <div className="flex gap-1.5">
                        <button onClick={() => setEditingId(null)} className="grid size-10 place-items-center rounded-xl border border-border text-muted-foreground hover:bg-muted" title="Hủy">
                          <X size={15} />
                        </button>
                        <button onClick={() => handleUpdate(config.id)} className="grid size-10 place-items-center rounded-xl bg-emerald-600 text-white hover:brightness-110" title="Lưu">
                          <Save size={15} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => beginEdit(config)} className="h-10 rounded-xl border border-border px-3 text-xs font-extrabold text-muted-foreground hover:text-primary">
                        Chỉnh
                      </button>
                    )
                  ) : (
                    <button onClick={() => prepareCreate(threshold.key, threshold.condition)} className="h-10 rounded-xl bg-primary px-3 text-xs font-extrabold text-primary-foreground">
                      Tạo
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {hardcodedRewardRules.map((rule) => (
            <div key={rule.badge} className="rounded-xl border border-dashed border-border bg-muted/[0.10] p-4">
              <div className="text-sm font-extrabold text-foreground">{rule.badge}</div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{rule.condition}</p>
              <div className="mt-4 inline-flex rounded-full border border-border bg-card px-3 py-1 text-[10px] font-bold uppercase text-muted-foreground">
                Cố định trong code
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="surface-card border border-border/60 bg-card p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo key, value hoặc mô tả..."
              className="h-11 w-full rounded-xl border border-border bg-muted/30 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {configGroups.map((group) => {
              const Icon = group.icon;
              const active = activeGroup === group.id;
              return (
                <button
                  key={group.id}
                  onClick={() => setActiveGroup(group.id)}
                  className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border px-3 text-xs font-extrabold transition-all ${
                    active ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:text-primary"
                  }`}
                  title={group.hint}
                >
                  <Icon size={15} />
                  {group.label}
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{groupCounts.get(group.id) ?? 0}</span>
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
            <form onSubmit={handleCreate} className="surface-card border border-primary/20 bg-primary/[0.04] p-5">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-foreground">
                <Settings className="text-primary" size={18} />
                Thêm cấu hình mới
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Config Key</label>
                  <input
                    required
                    value={formData.configKey}
                    onChange={(e) => setFormData({ ...formData, configKey: normalizeKey(e.target.value) })}
                    className="h-10 w-full rounded-xl border border-border bg-card px-3.5 font-mono text-sm uppercase outline-none focus:border-primary"
                    placeholder="VD: REWARD_TOP_REVIEWER_REVIEWS"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Config Value</label>
                  <input
                    required
                    value={formData.configValue}
                    onChange={(e) => setFormData({ ...formData, configValue: e.target.value })}
                    className="h-10 w-full rounded-xl border border-border bg-card px-3.5 font-mono text-sm outline-none focus:border-primary"
                    placeholder="VD: 10"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mô tả</label>
                  <input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="h-10 w-full rounded-xl border border-border bg-card px-3.5 text-sm font-medium outline-none focus:border-primary"
                    placeholder="Mô tả mục đích cấu hình..."
                  />
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-3">
                <button type="button" onClick={() => setIsFormOpen(false)} className="h-10 rounded-xl bg-muted px-5 text-sm font-semibold text-muted-foreground hover:bg-muted/80">Hủy</button>
                <button type="submit" disabled={isSubmitting} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50">
                  {isSubmitting && <div className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                  Lưu cấu hình
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="surface-card overflow-hidden border border-border/60 bg-card">
        <div className="border-b border-border/60 px-5 py-4">
          <h3 className="font-extrabold">Danh sách cấu hình chi tiết</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Đang hiển thị {filtered.length} / {configs.length} cấu hình
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] text-left text-sm">
            <thead className="border-b border-border/50 bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-3.5">Nhóm</th>
                <th className="px-5 py-3.5">Config Key</th>
                <th className="px-5 py-3.5">Giá trị</th>
                <th className="px-5 py-3.5">Mô tả</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    <div className="mx-auto mb-2 size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Đang tải...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-muted-foreground">Không tìm thấy cấu hình phù hợp.</td></tr>
              ) : (
                filtered.map((config, index) => {
                  const groupId = resolveGroup(config.configKey);
                  const group = configGroups.find((item) => item.id === groupId);
                  return (
                    <motion.tr
                      key={config.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.025 }}
                      className="hover:bg-muted/10"
                    >
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${groupClasses(groupId)}`}>
                          {group?.label ?? "Khác"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {editingId === config.id ? (
                          <input value={editData.configKey} onChange={(e) => setEditData({ ...editData, configKey: normalizeKey(e.target.value) })} className="w-full rounded-lg border border-border bg-card px-2 py-1 font-mono text-xs" />
                        ) : (
                          <div className="break-all font-mono text-xs font-bold text-primary">{config.configKey}</div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {editingId === config.id ? (
                          <input value={editData.configValue} onChange={(e) => setEditData({ ...editData, configValue: e.target.value })} className="w-full rounded-lg border border-border bg-card px-2 py-1 font-mono text-xs" />
                        ) : (
                          <div className="inline-block rounded-lg bg-muted/50 px-2 py-1 font-mono text-xs font-bold text-foreground">{config.configValue}</div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {editingId === config.id ? (
                          <input value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} className="w-full rounded-lg border border-border bg-card px-2 py-1 text-xs" />
                        ) : (
                          <div className="max-w-xl text-xs font-medium leading-5 text-muted-foreground">{config.description || <span className="italic opacity-50">Không có mô tả</span>}</div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {editingId === config.id ? (
                          <div className="inline-flex gap-1.5">
                            <button onClick={() => setEditingId(null)} className="grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground hover:bg-muted/80"><X size={14} /></button>
                            <button onClick={() => handleUpdate(config.id)} className="grid size-8 place-items-center rounded-lg bg-emerald-600 text-white hover:brightness-110"><Save size={14} /></button>
                          </div>
                        ) : (
                          <div className="inline-flex gap-1.5">
                            <button onClick={() => beginEdit(config)} className="grid size-8 place-items-center rounded-lg border border-border transition-colors hover:text-primary"><Edit2 size={13} /></button>
                            <button onClick={() => handleDelete(config.id)} className="grid size-8 place-items-center rounded-lg bg-destructive/10 text-destructive transition-colors hover:bg-destructive/20"><Trash2 size={13} /></button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
