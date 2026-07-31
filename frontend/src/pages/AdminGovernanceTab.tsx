import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Bot,
  BookOpen,
  Check,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  Layers3,
  Loader2,
  Lock,
  MessageSquare,
  Search,
  ShieldCheck,
  RotateCcw,
  User,
} from "lucide-react";
import { Notify } from "notiflix";

import {
  AdminGovernanceItemDTO,
  AdminGovernancePreviewDTO,
  AdminGovernanceTabKey,
  governanceService,
} from "../services/governanceService";

const tabs: Array<{ id: AdminGovernanceTabKey; label: string; icon: typeof FileText }> = [
  { id: "documents", label: "Tài liệu", icon: FileText },
  { id: "quizzes", label: "Quiz", icon: GraduationCap },
  { id: "flashcards", label: "Flashcard", icon: Layers3 },
  { id: "chat-sessions", label: "Phiên chat", icon: MessageSquare },
];

const pageSize = 12;

function dateText(value?: string | null) {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function typeLabel(type?: string | null) {
  switch (type) {
    case "DOCUMENT": return "Tài liệu";
    case "QUIZ": return "Quiz";
    case "FLASHCARD_DECK": return "Flashcard";
    case "CHAT_SESSION": return "Phiên chat";
    default: return "Nội dung";
  }
}

function accessLabel(reason?: string | null) {
  switch (reason) {
    case "ADMIN_ROLE": return "Admin preview";
    case "USER_REPORTED": return "User report";
    case "USER_ALLOWED_ADMIN_PREVIEW": return "User cho phép";
    case "PRIVATE_REQUIRES_USER_REPORT": return "Private - cần report";
    case "USER_PERMISSION_REQUIRED": return "Cần user cho phép";
    default: return reason || "Chưa rõ";
  }
}

function softStatus(value?: string | null) {
  if (!value) return null;
  const tone = value.includes("REJECT") || value.includes("BLOCK")
    ? "border-destructive/20 bg-destructive/10 text-destructive"
    : value.includes("APPRO") || value.includes("COMPLETED") || value.includes("SAFE")
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700"
      : "border-amber-500/25 bg-amber-500/10 text-amber-700";
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold ${tone}`}>{value}</span>;
}

function metric(label: string, value?: string | number | null) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/70 p-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-extrabold text-foreground break-words">{value ?? "Chưa có"}</div>
    </div>
  );
}

export default function AdminGovernanceTab() {
  const [activeTab, setActiveTab] = useState<AdminGovernanceTabKey>("documents");
  const [items, setItems] = useState<AdminGovernanceItemDTO[]>([]);
  const [selected, setSelected] = useState<AdminGovernanceItemDTO | null>(null);
  const [preview, setPreview] = useState<AdminGovernancePreviewDTO | null>(null);
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [moderating, setModerating] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const activeTabInfo = useMemo(() => tabs.find((tab) => tab.id === activeTab) ?? tabs[0], [activeTab]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    governanceService.getAdminGovernanceItems(activeTab, page, pageSize, keyword)
      .then((response) => {
        if (!alive) return;
        setItems(response.data.items ?? []);
        setTotalPages(response.data.totalPages ?? 0);
        setTotalElements(response.data.totalElements ?? 0);
      })
      .catch((error) => {
        if (!alive) return;
        Notify.failure(error?.message || "Không tải được danh sách governance");
        setItems([]);
        setTotalPages(0);
        setTotalElements(0);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, [activeTab, keyword, page, reloadKey]);

  const switchTab = (tab: AdminGovernanceTabKey) => {
    setActiveTab(tab);
    setPage(0);
    setSelected(null);
    setPreview(null);
  };

  const submitSearch = () => {
    setPage(0);
    setKeyword(keywordInput.trim());
  };

  const openPreview = async (item: AdminGovernanceItemDTO) => {
    setSelected(item);
    setPreview(null);
    if (item.adminPreviewAllowed === false) {
      Notify.failure(`Chưa đủ quyền preview: ${accessLabel(item.accessReason)}`);
      return;
    }
    setPreviewLoading(true);
    try {
      const response = await governanceService.getAdminGovernancePreview(item.targetType, item.targetId);
      setPreview(response.data);
    } catch (error: any) {
      Notify.failure(error?.message || "Không tải được preview");
    } finally {
      setPreviewLoading(false);
    }
  };

  const moderateSelected = async (action: "hide" | "restore") => {
    if (!selected) return;
    if (selected.targetType === "CHAT_SESSION") {
      Notify.info("Phiên chat chỉ có preview/audit/report; không có trạng thái public để ẩn như tài liệu, quiz hoặc flashcard.");
      return;
    }

    const defaultReason = action === "hide"
      ? "Vi phạm nội quy nền tảng"
      : "Khôi phục sau khi kiểm tra lại nội dung";
    const reason = window.prompt(
      action === "hide" ? "Nhập lý do ẩn nội dung:" : "Nhập lý do khôi phục nội dung:",
      defaultReason,
    );
    if (!reason?.trim()) return;

    setModerating(true);
    try {
      if (action === "hide") {
        await governanceService.hideContent(selected.targetType, selected.targetId, reason.trim());
        Notify.warning(`Đã ẩn ${typeLabel(selected.targetType)} #${selected.targetId}`);
        setPreview((item) => item ? { ...item, visibility: "PRIVATE", marketStatus: "REJECTED" } : item);
      } else {
        await governanceService.restoreContent(selected.targetType, selected.targetId, reason.trim());
        Notify.success(`Đã khôi phục ${typeLabel(selected.targetType)} #${selected.targetId}`);
        setPreview((item) => item ? { ...item, visibility: "PUBLIC_LINK" } : item);
      }
      setReloadKey((value) => value + 1);
    } catch (error: any) {
      Notify.failure(error?.message || "Không xử lý được nội dung");
    } finally {
      setModerating(false);
    }
  };

  const warnSelectedOwner = async () => {
    if (!selected) return;
    const reason = window.prompt("Nhập nội dung cảnh báo gửi tới user:", "Nội dung có dấu hiệu vi phạm, vui lòng kiểm tra và chỉnh sửa.");
    if (!reason?.trim()) return;

    setModerating(true);
    try {
      await governanceService.warnGovernanceOwner(selected.targetType, selected.targetId, reason.trim());
      Notify.success("Đã gửi cảnh báo tới user");
    } catch (error: any) {
      Notify.failure(error?.message || "Không gửi được cảnh báo");
    } finally {
      setModerating(false);
    }
  };

  const Icon = activeTabInfo.icon;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">Quản trị nội dung hệ thống</h2>
              <div className="mt-1 text-sm text-muted-foreground">
                {totalElements} mục trong nhóm {activeTabInfo.label}
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex h-11 min-w-0 items-center gap-2 rounded-xl border border-border bg-background px-3">
              <Search size={16} className="shrink-0 text-muted-foreground" />
              <input
                value={keywordInput}
                onChange={(event) => setKeywordInput(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter") submitSearch(); }}
                placeholder="Tìm theo tên, user, môn học..."
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
              />
            </div>
            <button
              onClick={submitSearch}
              className="h-11 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm hover:brightness-110"
            >
              Tìm
            </button>
          </div>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const active = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-extrabold transition-colors ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-primary"
                }`}
              >
                <TabIcon size={16} />{tab.label}
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
        <section className="rounded-2xl border border-border/70 bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border/60 p-4">
            <div className="flex items-center gap-2">
              <Icon size={18} className="text-primary" />
              <h3 className="font-extrabold">{activeTabInfo.label}</h3>
            </div>
            <div className="text-xs font-bold text-muted-foreground">Trang {page + 1}/{Math.max(totalPages, 1)}</div>
          </div>

          <div className="min-h-[460px]">
            {loading ? (
              <div className="grid min-h-[460px] place-items-center">
                <Loader2 className="animate-spin text-primary" />
              </div>
            ) : items.length === 0 ? (
              <div className="grid min-h-[460px] place-items-center p-8 text-center text-sm text-muted-foreground">
                Không có nội dung phù hợp.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {items.map((item) => {
                  const blocked = item.adminPreviewAllowed === false;
                  const active = selected?.targetType === item.targetType && selected?.targetId === item.targetId;
                  return (
                    <button
                      key={`${item.targetType}-${item.targetId}`}
                      onClick={() => openPreview(item)}
                      className={`w-full p-4 text-left transition-colors hover:bg-muted/30 ${
                        active ? "bg-primary/[0.04]" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                              {typeLabel(item.targetType)} #{item.targetId}
                            </span>
                            {item.aiGenerated && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[11px] font-bold text-sky-700">
                                <Bot size={11} />AI
                              </span>
                            )}
                            {blocked ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                                <Lock size={11} />{accessLabel(item.accessReason)}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                                <Eye size={11} />{accessLabel(item.accessReason)}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 truncate text-base font-extrabold text-foreground">{item.title}</div>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1"><User size={12} />{item.ownerName || item.ownerEmail || `User #${item.ownerId}`}</span>
                            {item.subjectCode && <span>{item.subjectCode}</span>}
                            {item.notebookTitle && <span>{item.notebookTitle}</span>}
                            <span>{item.itemCount ?? 0} mục preview</span>
                          </div>
                          {item.reportReason && (
                            <div className="mt-2 line-clamp-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-800">
                              <AlertTriangle size={13} className="mr-1 inline" />{item.reportReason}
                            </div>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          {softStatus(item.marketStatus || item.processingStatus || item.moderationStatus)}
                          <div className="mt-2 text-[11px] font-semibold text-muted-foreground">{dateText(item.createdAt)}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border/60 p-4">
            <button
              onClick={() => setPage((value) => Math.max(0, value - 1))}
              disabled={page === 0 || loading}
              className="h-10 rounded-xl border border-border px-4 text-sm font-bold disabled:opacity-45"
            >
              Trước
            </button>
            <button
              onClick={() => setPage((value) => Math.min(Math.max(totalPages - 1, 0), value + 1))}
              disabled={page + 1 >= totalPages || loading}
              className="h-10 rounded-xl border border-border px-4 text-sm font-bold disabled:opacity-45"
            >
              Sau
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-border/70 bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border/60 p-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Preview</div>
              <h3 className="mt-1 font-extrabold">{preview?.title || selected?.title || "Chưa chọn nội dung"}</h3>
            </div>
            <div className="flex items-center gap-2">
              {selected && (
                <button
                  onClick={warnSelectedOwner}
                  disabled={moderating}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 text-xs font-bold text-amber-700 disabled:opacity-45"
                  title="Gửi cảnh báo tới chủ sở hữu"
                >
                  <Bell size={14} />
                  Cảnh báo
                </button>
              )}
              {selected && selected.targetType !== "CHAT_SESSION" && (
                <>
                  <button
                    onClick={() => moderateSelected("hide")}
                    disabled={moderating}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-destructive/25 bg-destructive/10 px-3 text-xs font-bold text-destructive disabled:opacity-45"
                    title="Ẩn khỏi public/marketplace"
                  >
                    {moderating ? <Loader2 size={14} className="animate-spin" /> : <EyeOff size={14} />}
                    Ẩn
                  </button>
                  <button
                    onClick={() => moderateSelected("restore")}
                    disabled={moderating}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 text-xs font-bold text-emerald-700 disabled:opacity-45"
                    title="Khôi phục nội dung"
                  >
                    <RotateCcw size={14} />
                    Khôi phục
                  </button>
                </>
              )}
              {previewLoading && <Loader2 className="animate-spin text-primary" size={18} />}
            </div>
          </div>

          <div className="max-h-[760px] overflow-y-auto p-4">
            {!selected ? (
              <div className="grid min-h-[420px] place-items-center rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Chọn một mục ở danh sách để xem preview.
              </div>
            ) : selected.adminPreviewAllowed === false ? (
              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-5 text-sm text-amber-800">
                <div className="flex items-center gap-2 font-extrabold"><Lock size={17} />Chưa đủ quyền preview</div>
                <p className="mt-2 leading-6">Trạng thái: {accessLabel(selected.accessReason)}.</p>
                {selected.reportReason && <p className="mt-2 leading-6">Ghi chú report: {selected.reportReason}</p>}
              </div>
            ) : previewLoading ? (
              <div className="grid min-h-[420px] place-items-center">
                <Loader2 className="animate-spin text-primary" />
              </div>
            ) : preview ? (
              <PreviewPanel preview={preview} />
            ) : (
              <div className="grid min-h-[420px] place-items-center text-sm text-muted-foreground">
                Không tải được preview.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function PreviewPanel({ preview }: { preview: AdminGovernancePreviewDTO }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {metric("Chủ sở hữu", preview.ownerName || preview.ownerEmail || `User #${preview.ownerId}`)}
        {metric("Môn học", preview.subjectCode || preview.subjectName)}
        {metric("Notebook", preview.notebookTitle)}
        {metric("Ngày tạo", dateText(preview.createdAt))}
      </div>

      <div className="flex flex-wrap gap-2">
        {softStatus(preview.visibility)}
        {softStatus(preview.marketStatus)}
        {softStatus(preview.processingStatus)}
        {softStatus(preview.moderationStatus)}
        {preview.aiGenerated && (
          <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[11px] font-bold text-sky-700">
            <Bot size={11} />Có dấu vết AI
          </span>
        )}
      </div>

      {preview.description && (
        <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm leading-6 text-muted-foreground">
          {preview.description}
        </div>
      )}

      {preview.targetType === "DOCUMENT" && <DocumentPreview preview={preview} />}
      {preview.targetType === "QUIZ" && <QuizPreview preview={preview} />}
      {preview.targetType === "FLASHCARD_DECK" && <FlashcardPreview preview={preview} />}
      {preview.targetType === "CHAT_SESSION" && <ChatPreview preview={preview} />}
    </div>
  );
}

function DocumentPreview({ preview }: { preview: AdminGovernancePreviewDTO }) {
  const chunks = preview.chunks ?? [];
  return (
    <div className="space-y-3">
      {chunks.length === 0 ? (
        <EmptyPreview text="Tài liệu này chưa có chunk để preview." />
      ) : chunks.map((chunk) => (
        <div key={chunk.id} className="rounded-2xl border border-border/60 bg-background p-4">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-bold text-muted-foreground">
            <FileText size={14} className="text-primary" />
            <span>Đoạn {chunk.chunkIndex + 1}</span>
            {chunk.sourcePage && <span>Trang {chunk.sourcePage}</span>}
            {chunk.tokenEstimate && <span>{chunk.tokenEstimate} tokens</span>}
          </div>
          <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">{chunk.textContent}</p>
        </div>
      ))}
    </div>
  );
}

function QuizPreview({ preview }: { preview: AdminGovernancePreviewDTO }) {
  const questions = preview.questions ?? [];
  return (
    <div className="space-y-3">
      {questions.length === 0 ? (
        <EmptyPreview text="Quiz này chưa có câu hỏi để preview." />
      ) : questions.map((question, index) => (
        <div key={question.id ?? index} className="rounded-2xl border border-border/60 bg-background p-4">
          <div className="flex items-start gap-2">
            <GraduationCap size={16} className="mt-0.5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-extrabold leading-6">{index + 1}. {question.questionText}</div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {(question.options ?? []).map((option, optionIndex) => (
                  <div
                    key={`${option.id ?? optionIndex}`}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                      option.isCorrect
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                        : "border-border/60 bg-card text-muted-foreground"
                    }`}
                  >
                    {option.isCorrect && <Check size={13} className="mr-1 inline" />}
                    {option.optionText}
                  </div>
                ))}
              </div>
              {question.explanation && <p className="mt-3 text-xs leading-5 text-muted-foreground">Giải thích: {question.explanation}</p>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FlashcardPreview({ preview }: { preview: AdminGovernancePreviewDTO }) {
  const cards = preview.cards ?? [];
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {cards.length === 0 ? (
        <EmptyPreview text="Bộ này chưa có flashcard để preview." />
      ) : cards.map((card, index) => (
        <div key={card.id ?? index} className="rounded-2xl border border-border/60 bg-background p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-primary">
            <BookOpen size={14} />Mặt trước
          </div>
          <div className="mt-2 text-sm font-extrabold leading-6">{card.frontText}</div>
          <div className="my-3 border-t border-dashed border-border" />
          <div className="text-xs font-bold uppercase text-muted-foreground">Mặt sau</div>
          <div className="mt-2 text-sm leading-6">{card.backText}</div>
        </div>
      ))}
    </div>
  );
}

function ChatPreview({ preview }: { preview: AdminGovernancePreviewDTO }) {
  const messages = preview.messages ?? [];
  return (
    <div className="space-y-3">
      {preview.reportReason && (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm leading-6 text-amber-800">
          <div className="font-extrabold">Ghi chú report</div>
          <div className="mt-1">{preview.reportReason}</div>
        </div>
      )}
      {messages.length === 0 ? (
        <EmptyPreview text="Phiên chat này chưa có tin nhắn để preview." />
      ) : messages.map((message) => {
        const isUser = message.senderRole === "USER";
        return (
          <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-7 shadow-sm ${
              isUser
                ? "rounded-br-md bg-primary text-primary-foreground"
                : "rounded-tl-md border border-border/70 bg-background text-foreground"
            }`}>
              <div className={`mb-1 text-[11px] font-extrabold ${isUser ? "text-primary-foreground/80" : "text-primary"}`}>
                {isUser ? "User" : "AI Study Hub"} - {dateText(message.createdAt)}
              </div>
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.citedSources?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {message.citedSources.map((source, index) => (
                    <span key={`${source.documentId}-${index}`} className="rounded-full border border-border bg-card px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                      {source.documentTitle} đoạn {source.chunkIndex + 1}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyPreview({ text }: { text: string }) {
  return (
    <div className="col-span-full grid min-h-[220px] place-items-center rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
