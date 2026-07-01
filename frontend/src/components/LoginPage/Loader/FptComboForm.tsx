"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, GraduationCap, Loader2, Send, X } from "lucide-react";
import { academicService, type ComboDTO, type SemesterDTO } from "../../../services/academicService";
import { userService, type UserDTO } from "../../../services/userService";

interface OnboardingUser {
  email?: string;
  fullName?: string;
  currentSemesterId?: number | null;
  comboId?: number | null;
}

interface FormState {
  fullName: string;
  currentSemesterId: string;
  comboId: string;
}

interface FPTComboFormProps {
  initialUser?: OnboardingUser | null;
  onSkip: () => void;
  onCompleted: (user: UserDTO) => void;
}

const TOTAL_STEPS = 4;

const inputCls =
  "h-10 w-full rounded-xl border border-border/60 bg-muted/40 px-3.5 text-sm text-foreground outline-none focus:border-primary/50 focus:bg-card focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/40 font-medium font-sans";

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mt-3">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => {
        const step = i + 1;
        const active = step === current;
        const done = step < current;
        return (
          <div
            key={step}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              done ? "bg-primary/70 w-5" : active ? "bg-primary w-8" : "bg-muted w-5"
            }`}
          />
        );
      })}
      <span className="text-[11px] font-mono text-muted-foreground ml-1 font-medium">
        Bước {current}/{TOTAL_STEPS}
      </span>
    </div>
  );
}

function Btn({
  children,
  onClick,
  primary,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-10 items-center gap-1.5 rounded-xl px-5 text-xs font-semibold uppercase tracking-wide transition-all duration-200 outline-none cursor-pointer
        ${
          primary
            ? "bg-primary text-primary-foreground hover:opacity-90 shadow-sm active:scale-[0.97]"
            : "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground active:scale-[0.97]"
        }
        disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100`}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full flex-col gap-1.5 text-left">
      <label className="text-xs font-semibold tracking-wide text-muted-foreground">
        {label} {required && <span className="text-coral">*</span>}
      </label>
      {children}
    </div>
  );
}

function FormCard({
  stepLabel,
  title,
  description,
  footer,
  children,
  stepKey,
}: {
  stepLabel: string;
  title: string;
  description: string;
  footer: React.ReactNode;
  children: React.ReactNode;
  stepKey: string;
}) {
  return (
    <div className="surface-card overflow-hidden bg-card/70 backdrop-blur-xl border-border/60">
      <div className="px-6 pt-6 text-left">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{stepLabel}</p>
        <h2 className="font-display text-xl font-bold tracking-tight text-foreground">{title}</h2>
        <p className="mt-0.5 text-xs font-medium text-muted-foreground">{description}</p>
      </div>

      <div className="flex min-h-[320px] flex-col justify-center px-6 py-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={stepKey}
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -25 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="w-full text-left"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between border-t border-border/50 bg-muted/20 px-6 py-4">
        {footer}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/40 py-2 text-sm last:border-0">
      <span className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-right font-semibold text-foreground">{value}</span>
    </div>
  );
}

export default function FPTComboForm({ initialUser, onSkip, onCompleted }: FPTComboFormProps) {
  const [step, setStep] = useState(1);
  const [semesters, setSemesters] = useState<SemesterDTO[]>([]);
  const [combos, setCombos] = useState<ComboDTO[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    fullName: initialUser?.fullName ?? "",
    currentSemesterId: initialUser?.currentSemesterId ? String(initialUser.currentSemesterId) : "",
    comboId: initialUser?.comboId ? String(initialUser.comboId) : "",
  });

  const selectedSemester = useMemo(
    () => semesters.find((semester) => String(semester.id) === form.currentSemesterId),
    [semesters, form.currentSemesterId]
  );
  const selectedCombo = useMemo(
    () => combos.find((combo) => String(combo.id) === form.comboId),
    [combos, form.comboId]
  );

  useEffect(() => {
    let mounted = true;

    async function loadOptions() {
      setLoadingOptions(true);
      setError(null);
      try {
        const [semesterRes, comboRes] = await Promise.all([
          academicService.getSemesters(),
          academicService.getCombos(),
        ]);
        if (!mounted) return;
        setSemesters(semesterRes.data ?? []);
        setCombos(comboRes.data ?? []);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || "Không tải được danh sách học kỳ và combo.");
      } finally {
        if (mounted) setLoadingOptions(false);
      }
    }

    loadOptions();
    return () => {
      mounted = false;
    };
  }, []);

  const patch = (partial: Partial<FormState>) => setForm((current) => ({ ...current, ...partial }));

  const submitProfile = async () => {
    if (!form.fullName.trim() || !form.currentSemesterId || !form.comboId) return;

    setSaving(true);
    setError(null);
    try {
      const response = await userService.updateMyProfile({
        fullName: form.fullName.trim(),
        currentSemesterId: Number(form.currentSemesterId),
        comboId: Number(form.comboId),
      });
      onCompleted(response.data);
    } catch (err: any) {
      setError(err?.message || "Cập nhật hồ sơ thất bại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-4 app-shell-font">
      <div className="surface-card bg-card/70 backdrop-blur-xl border-border/60 px-5 py-4 flex items-center gap-4 text-left">
        <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 font-display font-black text-primary-foreground text-sm tracking-widest shadow-sm">
          FPT
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-bold tracking-tight text-foreground">Đăng ký chuyên ngành Combo</p>
          <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">
            {initialUser?.email || "Tài khoản mới"} · có thể cập nhật lại trong Profile
          </p>
          <StepIndicator current={step} />
        </div>
        <button
          type="button"
          onClick={onSkip}
          disabled={saving}
          className="grid size-8 place-items-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
          aria-label="Bỏ qua"
        >
          <X size={16} />
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200">
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <FormCard
            key="step-1"
            stepKey="personal"
            stepLabel="Mục 01"
            title="Thông tin cá nhân"
            description="Xác nhận tên hiển thị trước khi đồng bộ hồ sơ học tập"
            footer={
              <>
                <Btn onClick={onSkip}>Bỏ qua</Btn>
                <Btn primary onClick={() => setStep(2)} disabled={!form.fullName.trim()}>
                  Tiếp theo <ArrowRight size={13} strokeWidth={2.5} />
                </Btn>
              </>
            }
          >
            <div className="flex flex-col gap-4">
              <Field label="Họ và tên sinh viên" required>
                <input
                  className={inputCls}
                  placeholder="Nguyễn Văn A"
                  value={form.fullName}
                  onChange={(event) => patch({ fullName: event.target.value })}
                />
              </Field>
              <Field label="Email tài khoản">
                <input className={`${inputCls} opacity-70`} value={initialUser?.email ?? ""} readOnly />
              </Field>
            </div>
          </FormCard>
        )}

        {step === 2 && (
          <FormCard
            key="step-2"
            stepKey="semester"
            stepLabel="Mục 02"
            title="Học kỳ hiện tại"
            description="Chọn học kỳ để hệ thống ưu tiên đúng tài liệu, quiz và flashcard"
            footer={
              <>
                <Btn onClick={() => setStep(1)}>
                  <ArrowLeft size={13} strokeWidth={2.5} /> Quay lại
                </Btn>
                <Btn primary onClick={() => setStep(3)} disabled={loadingOptions || !form.currentSemesterId}>
                  Tiếp theo <ArrowRight size={13} strokeWidth={2.5} />
                </Btn>
              </>
            }
          >
            {loadingOptions ? (
              <div className="flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground">
                <Loader2 size={16} className="animate-spin" /> Đang tải học kỳ
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {semesters.map((semester) => {
                  const selected = form.currentSemesterId === String(semester.id);
                  return (
                    <button
                      type="button"
                      key={semester.id}
                      onClick={() => patch({ currentSemesterId: String(semester.id) })}
                      className={`rounded-xl border-2 p-4 text-left transition-all duration-200 outline-none ${
                        selected ? "border-primary bg-primary/5" : "border-border bg-card/40 hover:border-primary/30"
                      }`}
                    >
                      <p className={`font-display text-sm font-bold ${selected ? "text-primary" : "text-foreground"}`}>
                        {semester.name}
                      </p>
                      <p className="mt-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {semester.code}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </FormCard>
        )}

        {step === 3 && (
          <FormCard
            key="step-3"
            stepKey="combo"
            stepLabel="Mục 03"
            title="Chương trình đào tạo Combo"
            description="Chọn combo ngành sẽ được lưu vào hồ sơ backend của bạn"
            footer={
              <>
                <Btn onClick={() => setStep(2)}>
                  <ArrowLeft size={13} strokeWidth={2.5} /> Quay lại
                </Btn>
                <Btn primary onClick={() => setStep(4)} disabled={loadingOptions || !form.comboId}>
                  Xem lại <ArrowRight size={13} strokeWidth={2.5} />
                </Btn>
              </>
            }
          >
            {loadingOptions ? (
              <div className="flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground">
                <Loader2 size={16} className="animate-spin" /> Đang tải combo
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {combos.map((combo) => {
                  const selected = form.comboId === String(combo.id);
                  return (
                    <button
                      type="button"
                      key={combo.id}
                      onClick={() => patch({ comboId: String(combo.id) })}
                      className={`rounded-xl border-2 text-left transition-all duration-200 outline-none ${
                        selected ? "border-primary bg-primary/5" : "border-border bg-card/30 hover:border-primary/20"
                      }`}
                    >
                      <div className="flex items-start gap-4 p-4">
                        <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-primary/10 border border-primary/20 grid place-items-center shadow-inner">
                          <GraduationCap size={18} className="text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-sm font-bold tracking-tight text-foreground">{combo.name}</p>
                          <p className="mt-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
                            {combo.code}
                          </p>
                          {combo.description && (
                            <p className="mt-2 rounded-lg border border-border/40 bg-muted/40 p-2 text-xs font-medium leading-relaxed text-muted-foreground">
                              {combo.description}
                            </p>
                          )}
                        </div>
                        <div
                          className={`mt-0.5 flex size-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                            selected ? "border-primary bg-primary" : "border-border bg-card"
                          }`}
                        >
                          {selected && <span className="text-[10px] font-bold text-primary-foreground">✓</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </FormCard>
        )}

        {step === 4 && (
          <FormCard
            key="step-4"
            stepKey="review"
            stepLabel="Mục 04"
            title="Xác nhận hồ sơ"
            description="Thông tin này sẽ được cập nhật qua API profile của backend"
            footer={
              <>
                <Btn onClick={() => setStep(3)} disabled={saving}>
                  <ArrowLeft size={13} strokeWidth={2.5} /> Quay lại
                </Btn>
                <Btn primary onClick={submitProfile} disabled={saving || !form.fullName.trim() || !form.currentSemesterId || !form.comboId}>
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} strokeWidth={2.5} />}
                  Lưu hồ sơ
                </Btn>
              </>
            }
          >
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                <ReviewRow label="Họ tên" value={form.fullName.trim()} />
                <ReviewRow label="Email" value={initialUser?.email ?? "-"} />
                <ReviewRow label="Học kỳ" value={selectedSemester ? `${selectedSemester.name} (${selectedSemester.code})` : "-"} />
                <ReviewRow label="Combo" value={selectedCombo ? `${selectedCombo.name} (${selectedCombo.code})` : "-"} />
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs font-semibold text-primary">
                <CheckCircle2 size={15} /> Bạn vẫn có thể chỉnh lại các thông tin này trong trang Profile.
              </div>
            </div>
          </FormCard>
        )}
      </AnimatePresence>
    </div>
  );
}
