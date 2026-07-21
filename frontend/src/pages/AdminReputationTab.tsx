import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Award, CalendarClock, CheckCircle2, Edit2, Plus, RefreshCw, Save, Search, ShieldCheck, SlidersHorizontal, Trash2, X } from "lucide-react";
import { Notify } from "notiflix";
import { useSubjects } from "../hooks/useSubjects";
import { userService, type UserDTO } from "../services/userService";
import {
  reputationService,
  type AiQuotaTierDTO,
  type AiQuotaTierRequest,
  type CommunityRoleNominationDTO,
  type NominationStatus,
  type NominationType,
  type ReputationEventType,
  type RewardRuleDTO,
  type RewardRuleRequest,
} from "../services/reputationService";

type AdminSection = "rules" | "quota" | "nominations";
type EditableRuleNumberField =
  | "pointsDelta"
  | "maxEventsPerUserPerPeriod"
  | "thresholdValue"
  | "minRating"
  | "maxRating";

const sectionOptions: Array<{ id: AdminSection; label: string; icon: typeof Award }> = [
  { id: "rules", label: "Điểm thưởng", icon: Award },
  { id: "quota", label: "Quota AI", icon: SlidersHorizontal },
  { id: "nominations", label: "Đề cử", icon: ShieldCheck },
];

const rewardEventLabels: Record<ReputationEventType, string> = {
  CONTENT_APPROVED_DOCUMENT: "Duyệt tài liệu",
  CONTENT_APPROVED_QUIZ: "Duyệt quiz",
  CONTENT_APPROVED_FLASHCARD_DECK: "Duyệt flashcard",
  MARKETPLACE_CLONE_RECEIVED: "Có lượt clone/download",
  CONTENT_DOWNLOAD_MILESTONE: "Mốc lượt tải",
  COMMUNITY_REVIEW_GOOD: "Review cộng đồng tốt",
  COMMUNITY_REVIEW_BAD: "Review cộng đồng thấp",
  REVIEWER_MARKETPLACE_VOTE: "Reviewer bỏ phiếu",
  REVIEWER_DECISION_ALIGNED: "Reviewer vote đúng consensus",
  CONTENT_REPORT_ACCEPTED: "Report hợp lệ",
  CONTENT_REPORT_REJECTED: "Report bị bác",
  CONTENT_REPORT_OWNER_PENALTY: "Nội dung bị report xấu",
  CONTENT_HIDDEN_PENALTY: "Nội dung bị ẩn",
};

const nominationTypeLabels: Record<NominationType, string> = {
  MONTHLY_TOP_CONTRIBUTOR: "Top contributor tháng",
  REVIEWER_UNLOCK: "Unlock reviewer",
};

const statusStyles: Record<NominationStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  APPROVED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  REJECTED: "bg-rose-500/10 text-rose-600 border-rose-500/20",
};

const emptyTierForm: AiQuotaTierRequest = {
  name: "",
  minReputationPoints: 0,
  dailyChatLimit: 20,
  monthlyChatLimit: 300,
  dailySummaryLimit: 5,
  monthlySummaryLimit: 80,
  dailyGenerationLimit: 5,
  monthlyGenerationLimit: 80,
  enabled: true,
};

const quotaNumberFields: Array<{ key: keyof AiQuotaTierRequest; label: string }> = [
  { key: "minReputationPoints", label: "Điểm tối thiểu" },
  { key: "dailyChatLimit", label: "Chat/ngày" },
  { key: "monthlyChatLimit", label: "Chat/tháng" },
  { key: "dailySummaryLimit", label: "Tóm tắt/ngày" },
  { key: "monthlySummaryLimit", label: "Tóm tắt/tháng" },
  { key: "dailyGenerationLimit", label: "Sinh nội dung/ngày" },
  { key: "monthlyGenerationLimit", label: "Sinh nội dung/tháng" },
];

function currentPeriodKey() {
  return new Date().toISOString().slice(0, 7);
}

function toLocalDateTimeInput(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function optionalNumber(value: string) {
  return value === "" ? null : Number(value);
}

function ruleToRequest(rule: RewardRuleDTO): RewardRuleRequest {
  return {
    pointsDelta: rule.pointsDelta,
    enabled: rule.enabled ?? true,
    maxEventsPerUserPerPeriod: rule.maxEventsPerUserPerPeriod ?? null,
    thresholdValue: rule.thresholdValue ?? null,
    minRating: rule.minRating ?? null,
    maxRating: rule.maxRating ?? null,
    description: rule.description ?? "",
  };
}

function tierToRequest(tier: AiQuotaTierDTO): AiQuotaTierRequest {
  return {
    name: tier.name,
    minReputationPoints: tier.minReputationPoints,
    dailyChatLimit: tier.dailyChatLimit,
    monthlyChatLimit: tier.monthlyChatLimit,
    dailySummaryLimit: tier.dailySummaryLimit,
    monthlySummaryLimit: tier.monthlySummaryLimit,
    dailyGenerationLimit: tier.dailyGenerationLimit,
    monthlyGenerationLimit: tier.monthlyGenerationLimit,
    enabled: tier.enabled ?? true,
  };
}

function formatNumber(value?: number | null) {
  return Number(value ?? 0).toLocaleString("vi-VN");
}

export default function AdminReputationTab() {
  const [activeSection, setActiveSection] = useState<AdminSection>("rules");
  const [rules, setRules] = useState<RewardRuleDTO[]>([]);
  const [ruleDrafts, setRuleDrafts] = useState<Record<string, RewardRuleRequest>>({});
  const [editingRule, setEditingRule] = useState<ReputationEventType | null>(null);
  const [ruleSearch, setRuleSearch] = useState("");
  const [loadingRules, setLoadingRules] = useState(false);

  const [tiers, setTiers] = useState<AiQuotaTierDTO[]>([]);
  const [tierForm, setTierForm] = useState<AiQuotaTierRequest>(emptyTierForm);
  const [editingTierId, setEditingTierId] = useState<number | null>(null);
  const [tierDraft, setTierDraft] = useState<AiQuotaTierRequest | null>(null);
  const [loadingTiers, setLoadingTiers] = useState(false);
  const [creatingTier, setCreatingTier] = useState(false);

  const [nominations, setNominations] = useState<CommunityRoleNominationDTO[]>([]);
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [nominationStatus, setNominationStatus] = useState<NominationStatus | "ALL">("PENDING");
  const [nominationType, setNominationType] = useState<NominationType | "ALL">("ALL");
  const [nominationSubjectId, setNominationSubjectId] = useState("all");
  const [nominationPeriod, setNominationPeriod] = useState(currentPeriodKey());
  const [manualUserId, setManualUserId] = useState("");
  const [manualSubjectId, setManualSubjectId] = useState("");
  const [manualReason, setManualReason] = useState("");
  const [reviewNote, setReviewNote] = useState("Admin approved");
  const [reviewStartAt, setReviewStartAt] = useState(toLocalDateTimeInput());
  const [reviewEndAt, setReviewEndAt] = useState("");
  const [loadingNominations, setLoadingNominations] = useState(false);
  const [submittingNomination, setSubmittingNomination] = useState(false);

  const { subjects, subjectMap, isLoading: subjectsLoading } = useSubjects();

  const filteredRules = useMemo(() => {
    const keyword = ruleSearch.trim().toLowerCase();
    if (!keyword) return rules;
    return rules.filter((rule) => {
      const label = rewardEventLabels[rule.eventType] ?? rule.eventType;
      return (
        rule.eventType.toLowerCase().includes(keyword) ||
        label.toLowerCase().includes(keyword) ||
        (rule.description ?? "").toLowerCase().includes(keyword)
      );
    });
  }, [ruleSearch, rules]);

  const sortedTiers = useMemo(
    () => [...tiers].sort((a, b) => a.minReputationPoints - b.minReputationPoints),
    [tiers],
  );

  useEffect(() => {
    loadRules();
    loadTiers();
    loadUsers();
  }, []);

  useEffect(() => {
    loadNominations();
  }, [nominationStatus, nominationType, nominationSubjectId, nominationPeriod]);

  const loadRules = async () => {
    setLoadingRules(true);
    try {
      const response = await reputationService.getRewardRules();
      const data = response.data ?? [];
      setRules(data);
      setRuleDrafts(Object.fromEntries(data.map((rule) => [rule.eventType, ruleToRequest(rule)])));
    } catch (error: any) {
      Notify.failure(error.message || "Không tải được cấu hình điểm.");
    } finally {
      setLoadingRules(false);
    }
  };

  const loadTiers = async () => {
    setLoadingTiers(true);
    try {
      const response = await reputationService.getAiQuotaTiers();
      setTiers(response.data ?? []);
    } catch (error: any) {
      Notify.failure(error.message || "Không tải được quota AI.");
    } finally {
      setLoadingTiers(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await userService.adminGetUsers({ page: 0, size: 200, sort: "newest" });
      setUsers(response.data.items ?? []);
    } catch {
      setUsers([]);
    }
  };

  const loadNominations = async () => {
    setLoadingNominations(true);
    try {
      const response = await reputationService.getNominations({
        page: 0,
        size: 80,
        status: nominationStatus,
        nominationType,
        subjectId: nominationSubjectId !== "all" ? Number(nominationSubjectId) : undefined,
        periodKey: nominationPeriod,
      });
      setNominations(response.data.items ?? []);
    } catch (error: any) {
      Notify.failure(error.message || "Không tải được danh sách đề cử.");
    } finally {
      setLoadingNominations(false);
    }
  };

  const updateRuleDraft = (eventType: ReputationEventType, field: keyof RewardRuleRequest, value: RewardRuleRequest[keyof RewardRuleRequest]) => {
    setRuleDrafts((current) => ({
      ...current,
      [eventType]: {
        ...(current[eventType] ?? { pointsDelta: 0 }),
        [field]: value,
      },
    }));
  };

  const saveRule = async (eventType: ReputationEventType) => {
    const draft = ruleDrafts[eventType];
    if (!draft || !Number.isFinite(Number(draft.pointsDelta))) {
      Notify.failure("Points delta không hợp lệ.");
      return;
    }
    try {
      const response = await reputationService.updateRewardRule(eventType, {
        ...draft,
        pointsDelta: Number(draft.pointsDelta),
      });
      setRules((current) => current.map((rule) => (rule.eventType === eventType ? response.data : rule)));
      setRuleDrafts((current) => ({ ...current, [eventType]: ruleToRequest(response.data) }));
      setEditingRule(null);
      Notify.success("Đã cập nhật rule điểm.");
    } catch (error: any) {
      Notify.failure(error.message || "Không cập nhật được rule điểm.");
    }
  };

  const createTier = async (event: FormEvent) => {
    event.preventDefault();
    if (!tierForm.name.trim()) {
      Notify.failure("Tên quota tier không được để trống.");
      return;
    }
    setCreatingTier(true);
    try {
      const response = await reputationService.createAiQuotaTier(tierForm);
      setTiers((current) => [response.data, ...current]);
      setTierForm(emptyTierForm);
      Notify.success("Đã tạo quota tier.");
    } catch (error: any) {
      Notify.failure(error.message || "Không tạo được quota tier.");
    } finally {
      setCreatingTier(false);
    }
  };

  const saveTier = async (id: number) => {
    if (!tierDraft?.name.trim()) {
      Notify.failure("Tên quota tier không được để trống.");
      return;
    }
    try {
      const response = await reputationService.updateAiQuotaTier(id, tierDraft);
      setTiers((current) => current.map((tier) => (tier.id === id ? response.data : tier)));
      setEditingTierId(null);
      setTierDraft(null);
      Notify.success("Đã cập nhật quota tier.");
    } catch (error: any) {
      Notify.failure(error.message || "Không cập nhật được quota tier.");
    }
  };

  const deleteTier = async (id: number) => {
    if (!window.confirm("Xóa quota tier này khỏi hệ thống?")) return;
    try {
      await reputationService.deleteAiQuotaTier(id);
      setTiers((current) => current.filter((tier) => tier.id !== id));
      Notify.success("Đã xóa quota tier.");
    } catch (error: any) {
      Notify.failure(error.message || "Không xóa được quota tier.");
    }
  };

  const generateNominations = async () => {
    setSubmittingNomination(true);
    try {
      const response = await reputationService.generateMonthlyNominations(nominationPeriod);
      Notify.success(`Đã tạo ${response.data?.length ?? 0} đề cử cho kỳ ${nominationPeriod}.`);
      await loadNominations();
    } catch (error: any) {
      Notify.failure(error.message || "Không tạo được đề cử tháng.");
    } finally {
      setSubmittingNomination(false);
    }
  };

  const submitManualReviewerNomination = async (event: FormEvent) => {
    event.preventDefault();
    const parsedUserId = Number(manualUserId);
    const parsedSubjectId = Number(manualSubjectId);
    if (!parsedUserId || !parsedSubjectId || !manualReason.trim()) {
      Notify.failure("Vui lòng chọn user, môn và nhập lý do.");
      return;
    }
    setSubmittingNomination(true);
    try {
      await reputationService.nominateReviewer({
        userId: parsedUserId,
        subjectId: parsedSubjectId,
        reason: manualReason.trim(),
      });
      setManualUserId("");
      setManualSubjectId("");
      setManualReason("");
      Notify.success("Đã tạo đề cử reviewer.");
      await loadNominations();
    } catch (error: any) {
      Notify.failure(error.message || "Không tạo được đề cử reviewer.");
    } finally {
      setSubmittingNomination(false);
    }
  };

  const reviewNomination = async (nomination: CommunityRoleNominationDTO, decision: "approve" | "reject") => {
    const defaultNote = decision === "approve" ? reviewNote : "Admin rejected";
    const note = window.prompt(decision === "approve" ? "Ghi chú duyệt đề cử" : "Lý do từ chối đề cử", defaultNote);
    if (note === null) return;

    try {
      const payload = {
        reviewNote: note,
        effectiveStartAt: decision === "approve" ? reviewStartAt || null : null,
        effectiveEndAt: decision === "approve" ? reviewEndAt || null : null,
      };
      const response =
        decision === "approve"
          ? await reputationService.approveNomination(nomination.id, payload)
          : await reputationService.rejectNomination(nomination.id, payload);
      setNominations((current) => current.map((item) => (item.id === nomination.id ? response.data : item)));
      Notify.success(decision === "approve" ? "Đã duyệt và cấp quyền." : "Đã từ chối đề cử.");
    } catch (error: any) {
      Notify.failure(error.message || "Không xử lý được đề cử.");
    }
  };

  const renderRules = () => (
    <div className="space-y-4">
      <div className="surface-card p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            value={ruleSearch}
            onChange={(event) => setRuleSearch(event.target.value)}
            placeholder="Tìm event type, tên rule hoặc mô tả..."
            className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary"
          />
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b border-border/50 bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-3.5">Rule</th>
                <th className="px-5 py-3.5 text-center">Điểm</th>
                <th className="px-5 py-3.5 text-center">Giới hạn</th>
                <th className="px-5 py-3.5 text-center">Threshold</th>
                <th className="px-5 py-3.5 text-center">Rating</th>
                <th className="px-5 py-3.5 text-center">Bật</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loadingRules ? (
                <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">Đang tải rule điểm...</td></tr>
              ) : filteredRules.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">Không có rule phù hợp.</td></tr>
              ) : (
                filteredRules.map((rule) => {
                  const draft = ruleDrafts[rule.eventType] ?? ruleToRequest(rule);
                  const isEditing = editingRule === rule.eventType;
                  const numberInput = (field: EditableRuleNumberField, nullable = true) => (
                    <input
                      type="number"
                      value={draft[field] ?? ""}
                      onChange={(event) => updateRuleDraft(rule.eventType, field, nullable ? optionalNumber(event.target.value) : Number(event.target.value))}
                      disabled={!isEditing}
                      className="h-9 w-20 rounded-lg border border-border bg-card px-2 text-center text-xs font-semibold outline-none disabled:border-transparent disabled:bg-transparent"
                    />
                  );

                  return (
                    <tr key={rule.eventType} className="hover:bg-muted/10">
                      <td className="px-5 py-4">
                        <div className="font-bold text-foreground">{rewardEventLabels[rule.eventType] ?? rule.eventType}</div>
                        <div className="mt-0.5 font-mono text-[11px] text-primary">{rule.eventType}</div>
                        {isEditing ? (
                          <input
                            value={draft.description ?? ""}
                            onChange={(event) => updateRuleDraft(rule.eventType, "description", event.target.value)}
                            className="mt-2 h-9 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none"
                            placeholder="Mô tả rule"
                          />
                        ) : (
                          <div className="mt-1 max-w-md text-xs text-muted-foreground">{rule.description || "Chưa có mô tả"}</div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">{numberInput("pointsDelta", false)}</td>
                      <td className="px-5 py-4 text-center">{numberInput("maxEventsPerUserPerPeriod")}</td>
                      <td className="px-5 py-4 text-center">{numberInput("thresholdValue")}</td>
                      <td className="px-5 py-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          {numberInput("minRating")}
                          <span className="text-muted-foreground">-</span>
                          {numberInput("maxRating")}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(draft.enabled)}
                          onChange={(event) => updateRuleDraft(rule.eventType, "enabled", event.target.checked)}
                          disabled={!isEditing}
                          className="size-4 accent-primary"
                        />
                      </td>
                      <td className="px-5 py-4 text-right">
                        {isEditing ? (
                          <div className="inline-flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setRuleDrafts((current) => ({ ...current, [rule.eventType]: ruleToRequest(rule) }));
                                setEditingRule(null);
                              }}
                              className="grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground"
                            >
                              <X size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => saveRule(rule.eventType)}
                              className="grid size-8 place-items-center rounded-lg bg-success/10 text-success"
                            >
                              <Save size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditingRule(rule.eventType)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-bold hover:text-primary"
                          >
                            <Edit2 size={13} /> Sửa
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderQuota = () => (
    <div className="space-y-4">
      <form onSubmit={createTier} className="surface-card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="font-display text-lg font-bold">Tạo quota tier</h3>
          <label className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <input
              type="checkbox"
              checked={Boolean(tierForm.enabled)}
              onChange={(event) => setTierForm((current) => ({ ...current, enabled: event.target.checked }))}
              className="size-4 accent-primary"
            />
            Enabled
          </label>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-xs font-bold text-muted-foreground">
            Tên tier
            <input
              value={tierForm.name}
              onChange={(event) => setTierForm((current) => ({ ...current, name: event.target.value }))}
              className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary"
              placeholder="VD: Silver"
            />
          </label>
          {quotaNumberFields.map((field) => (
            <label key={field.key} className="text-xs font-bold text-muted-foreground">
              {field.label}
              <input
                type="number"
                min={0}
                value={Number(tierForm[field.key] ?? 0)}
                onChange={(event) => setTierForm((current) => ({ ...current, [field.key]: Number(event.target.value) }))}
                className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary"
              />
            </label>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            disabled={creatingTier}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            <Plus size={15} /> Tạo tier
          </button>
        </div>
      </form>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b border-border/50 bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-3.5">Tier</th>
                <th className="px-5 py-3.5 text-center">Min point</th>
                <th className="px-5 py-3.5 text-center">Chat</th>
                <th className="px-5 py-3.5 text-center">Summary</th>
                <th className="px-5 py-3.5 text-center">Generation</th>
                <th className="px-5 py-3.5 text-center">Bật</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loadingTiers ? (
                <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">Đang tải quota tier...</td></tr>
              ) : sortedTiers.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">Chưa có quota tier.</td></tr>
              ) : (
                sortedTiers.map((tier) => {
                  const isEditing = editingTierId === tier.id && tierDraft;
                  const draft = tierDraft ?? tierToRequest(tier);
                  const numberCell = (key: keyof AiQuotaTierRequest) => (
                    <input
                      type="number"
                      min={0}
                      value={Number(draft[key] ?? 0)}
                      disabled={!isEditing}
                      onChange={(event) => setTierDraft((current) => current ? { ...current, [key]: Number(event.target.value) } : current)}
                      className="h-9 w-20 rounded-lg border border-border bg-card px-2 text-center text-xs font-semibold outline-none disabled:border-transparent disabled:bg-transparent"
                    />
                  );

                  return (
                    <tr key={tier.id} className="hover:bg-muted/10">
                      <td className="px-5 py-4">
                        {isEditing ? (
                          <input
                            value={draft.name}
                            onChange={(event) => setTierDraft((current) => current ? { ...current, name: event.target.value } : current)}
                            className="h-9 w-44 rounded-lg border border-border bg-card px-3 text-sm font-bold outline-none"
                          />
                        ) : (
                          <>
                            <div className="font-bold text-foreground">{tier.name}</div>
                            <div className="mt-0.5 text-xs text-muted-foreground">Tier #{tier.id}</div>
                          </>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">{numberCell("minReputationPoints")}</td>
                      <td className="px-5 py-4 text-center">
                        <div className="inline-flex items-center gap-1">{numberCell("dailyChatLimit")}<span className="text-muted-foreground">/</span>{numberCell("monthlyChatLimit")}</div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="inline-flex items-center gap-1">{numberCell("dailySummaryLimit")}<span className="text-muted-foreground">/</span>{numberCell("monthlySummaryLimit")}</div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="inline-flex items-center gap-1">{numberCell("dailyGenerationLimit")}<span className="text-muted-foreground">/</span>{numberCell("monthlyGenerationLimit")}</div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(draft.enabled)}
                          disabled={!isEditing}
                          onChange={(event) => setTierDraft((current) => current ? { ...current, enabled: event.target.checked } : current)}
                          className="size-4 accent-primary"
                        />
                      </td>
                      <td className="px-5 py-4 text-right">
                        {isEditing ? (
                          <div className="inline-flex gap-1.5">
                            <button type="button" onClick={() => { setEditingTierId(null); setTierDraft(null); }} className="grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground"><X size={14} /></button>
                            <button type="button" onClick={() => saveTier(tier.id)} className="grid size-8 place-items-center rounded-lg bg-success/10 text-success"><Save size={14} /></button>
                          </div>
                        ) : (
                          <div className="inline-flex gap-1.5">
                            <button type="button" onClick={() => { setEditingTierId(tier.id); setTierDraft(tierToRequest(tier)); }} className="grid size-8 place-items-center rounded-lg border border-border hover:text-primary"><Edit2 size={13} /></button>
                            <button type="button" onClick={() => deleteTier(tier.id)} className="grid size-8 place-items-center rounded-lg bg-destructive/10 text-destructive"><Trash2 size={13} /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderNominations = () => (
    <div className="space-y-4">
      <div className="surface-card grid gap-3 p-4 md:grid-cols-[1fr_1fr_1fr_1fr_auto] md:items-end">
        <label className="text-xs font-bold text-muted-foreground">
          Kỳ xét
          <input
            type="month"
            value={nominationPeriod}
            onChange={(event) => setNominationPeriod(event.target.value || currentPeriodKey())}
            className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="text-xs font-bold text-muted-foreground">
          Môn
          <select
            value={nominationSubjectId}
            onChange={(event) => setNominationSubjectId(event.target.value)}
            disabled={subjectsLoading}
            className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary"
          >
            <option value="all">Tất cả môn</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>{subject.code} - {subject.name}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-bold text-muted-foreground">
          Trạng thái
          <select
            value={nominationStatus}
            onChange={(event) => setNominationStatus(event.target.value as NominationStatus | "ALL")}
            className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary"
          >
            <option value="ALL">Tất cả</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </label>
        <label className="text-xs font-bold text-muted-foreground">
          Loại đề cử
          <select
            value={nominationType}
            onChange={(event) => setNominationType(event.target.value as NominationType | "ALL")}
            className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary"
          >
            <option value="ALL">Tất cả</option>
            <option value="MONTHLY_TOP_CONTRIBUTOR">Top contributor</option>
            <option value="REVIEWER_UNLOCK">Reviewer unlock</option>
          </select>
        </label>
        <button
          type="button"
          onClick={generateNominations}
          disabled={submittingNomination}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-50"
        >
          <RefreshCw size={15} /> Tạo đề cử tháng
        </button>
      </div>

      <form onSubmit={submitManualReviewerNomination} className="surface-card grid gap-3 p-4 md:grid-cols-[1fr_1fr_2fr_auto] md:items-end">
        <label className="text-xs font-bold text-muted-foreground">
          User
          <select
            value={manualUserId}
            onChange={(event) => setManualUserId(event.target.value)}
            className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary"
          >
            <option value="">Chọn user</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>#{user.id} - {user.fullName || user.email}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-bold text-muted-foreground">
          Môn reviewer
          <select
            value={manualSubjectId}
            onChange={(event) => setManualSubjectId(event.target.value)}
            disabled={subjectsLoading}
            className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary"
          >
            <option value="">Chọn môn</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>{subject.code} - {subject.name}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-bold text-muted-foreground">
          Lý do
          <input
            value={manualReason}
            onChange={(event) => setManualReason(event.target.value)}
            className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary"
            placeholder="Đủ điểm và lịch sử review tốt"
          />
        </label>
        <button
          disabled={submittingNomination}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-primary/30 px-4 text-sm font-bold text-primary disabled:opacity-50"
        >
          <Plus size={15} /> Đề cử reviewer
        </button>
      </form>

      <div className="surface-card grid gap-3 p-4 md:grid-cols-3">
        <label className="text-xs font-bold text-muted-foreground">
          Ghi chú duyệt mặc định
          <input value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary" />
        </label>
        <label className="text-xs font-bold text-muted-foreground">
          Hiệu lực từ
          <input type="datetime-local" value={reviewStartAt} onChange={(event) => setReviewStartAt(event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary" />
        </label>
        <label className="text-xs font-bold text-muted-foreground">
          Hiệu lực đến
          <input type="datetime-local" value={reviewEndAt} onChange={(event) => setReviewEndAt(event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary" />
        </label>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead className="border-b border-border/50 bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Loại</th>
                <th className="px-5 py-3.5">Môn</th>
                <th className="px-5 py-3.5 text-center">Điểm</th>
                <th className="px-5 py-3.5 text-center">Trạng thái</th>
                <th className="px-5 py-3.5">Lý do</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loadingNominations ? (
                <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">Đang tải đề cử...</td></tr>
              ) : nominations.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">Không có đề cử phù hợp.</td></tr>
              ) : (
                nominations.map((nomination) => (
                  <tr key={nomination.id} className="hover:bg-muted/10">
                    <td className="px-5 py-4">
                      <div className="font-bold text-foreground">{nomination.userFullName || `User #${nomination.userId}`}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">#{nomination.userId}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs font-bold text-foreground">{nominationTypeLabels[nomination.nominationType] ?? nomination.nominationType}</div>
                      <div className="mt-0.5 font-mono text-[11px] text-primary">{nomination.roleType}</div>
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold">
                      {nomination.subjectId
                        ? `${nomination.subjectCode ?? subjectMap[nomination.subjectId]?.code ?? `#${nomination.subjectId}`}`
                        : "Global"}
                      <div className="mt-0.5 text-muted-foreground">{nomination.periodKey || "Không kỳ"}</div>
                    </td>
                    <td className="px-5 py-4 text-center font-bold">{formatNumber(nomination.score)}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusStyles[nomination.status]}`}>
                        {nomination.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="max-w-xs truncate text-xs text-muted-foreground">{nomination.reason || nomination.reviewNote || "Không có ghi chú"}</div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {nomination.status === "PENDING" ? (
                        <div className="inline-flex gap-1.5">
                          <button type="button" onClick={() => reviewNomination(nomination, "reject")} className="grid size-8 place-items-center rounded-lg bg-destructive/10 text-destructive"><X size={14} /></button>
                          <button type="button" onClick={() => reviewNomination(nomination, "approve")} className="grid size-8 place-items-center rounded-lg bg-success/10 text-success"><CheckCircle2 size={14} /></button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {nomination.reviewedAt ? new Date(nomination.reviewedAt).toLocaleDateString("vi-VN") : "Đã xử lý"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="surface-card flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-display text-xl font-bold">
            <Award className="text-primary" size={22} /> Reputation & Quota
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Cấu hình điểm, quota AI và duyệt vai trò cộng đồng.</p>
        </div>
        <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-muted p-1">
          {sectionOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setActiveSection(option.id)}
                className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-bold transition-all ${
                  activeSection === option.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon size={14} /> {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="surface-card p-4">
          <Award size={18} className="mb-2 text-primary" />
          <div className="text-2xl font-black">{formatNumber(rules.filter((rule) => rule.enabled !== false).length)}</div>
          <div className="text-xs font-bold text-muted-foreground">Rule đang bật</div>
        </div>
        <div className="surface-card p-4">
          <SlidersHorizontal size={18} className="mb-2 text-coral" />
          <div className="text-2xl font-black">{formatNumber(tiers.filter((tier) => tier.enabled !== false).length)}</div>
          <div className="text-xs font-bold text-muted-foreground">Quota tier active</div>
        </div>
        <div className="surface-card p-4">
          <CalendarClock size={18} className="mb-2 text-amber-500" />
          <div className="text-2xl font-black">{formatNumber(nominations.filter((item) => item.status === "PENDING").length)}</div>
          <div className="text-xs font-bold text-muted-foreground">Đề cử chờ duyệt</div>
        </div>
      </div>

      {activeSection === "rules" && renderRules()}
      {activeSection === "quota" && renderQuota()}
      {activeSection === "nominations" && renderNominations()}
    </div>
  );
}
