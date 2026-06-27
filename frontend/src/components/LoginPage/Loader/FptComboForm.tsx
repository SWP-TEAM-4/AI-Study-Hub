"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Send, CheckCircle2, X } from "lucide-react";

// ─── INTERFACES ────────────────────────────────────────────────────────────────

interface Campus {
  city: string;
  address: string;
}

interface Combo {
  id: string;
  name: string;
  code: string;
  icon: string;
  tags: string[];
  description: string;
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  dob: string;
  campus: string;
  combo: string;
  minor: string;
}

// ─── DATA SYSTEM ───────────────────────────────────────────────────────────────

const CAMPUSES: Campus[] = [
  { city: "Hà Nội", address: "Khu CNC Hòa Lạc" },
  { city: "TP.HCM", address: "Đường D1, Khu CNC, Quận 9" },
  { city: "Đà Nẵng", address: "Khu đô thị FPT City" },
  { city: "Cần Thơ", address: "Khu đô thị mới Hưng Phú" },
  { city: "Quy Nhơn", address: "Khu đô thị khoa học giáo dục" },
];

const COMBOS: Combo[] = [
  {
    id: "SE_AI",
    name: "Kỹ thuật phần mềm + AI",
    code: "SE + AI/ML",
    icon: "💻",
    tags: ["Hot", "Lập trình", "Data"],
    description:
      "Học sâu về phát triển phần mềm kết hợp trí tuệ nhân tạo. Sau tốt nghiệp có thể tự tin đảm nhận vị trí AI Engineer, ML Engineer, Backend Developer.",
  },
  {
    id: "BA_DS",
    name: "Kinh doanh + Khoa học dữ liệu",
    code: "BA + DS",
    icon: "📊",
    tags: ["Phân tích", "Business"],
    description:
      "Kết hợp tư duy nhạy bén kinh doanh với kỹ năng khai phá phân tích dữ liệu lớn. Phù hợp vị trí Business Analyst, Data Analyst, Product Manager.",
  },
  {
    id: "GD_UX",
    name: "Thiết kế đồ họa + UX/UI",
    code: "GD + UX",
    icon: "🎨",
    tags: ["Sáng tạo", "Design", "Hot"],
    description:
      "Nền tảng nghệ thuật vững chắc kết hợp tư duy tối ưu trải nghiệm người dùng UX. Lộ trình hoàn hảo cho Product Designer, UI/UX Designer.",
  },
];

const MINORS: Record<string, string[]> = {
  SE_AI: ["Blockchain", "Cloud Computing", "Embedded Systems", "Game Development"],
  BA_DS: ["FinTech", "Supply Chain", "Healthcare Analytics", "E-commerce"],
  GD_UX: ["Motion Design", "3D & AR/VR", "Brand Identity", "Service Design"],
};

const STEP_LABELS = ["Cá nhân", "Campus", "Ngành combo", "Xác nhận"];

// ─── STEP INDICATOR COMPONENT ──────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mt-3">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const isDone = step < current;
        const isActive = step === current;
        return (
          <React.Fragment key={step}>
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                isDone
                  ? "bg-primary w-5 opacity-60"
                  : isActive
                    ? "bg-primary w-8 shadow-sm"
                    : "bg-muted w-5"
              }`}
            />
          </React.Fragment>
        );
      })}
      <span className="text-[11px] font-mono text-muted-foreground ml-1 font-medium">
        Bước {current}/{total}
      </span>
    </div>
  );
}

// ─── WRAPPER LAYOUT: FORM CARD (DASHBOARD GLASS STYLE) ────────────────────────
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
  stepKey: string | number;
}) {
  const variants = {
    hidden: { opacity: 0, x: 25 },
    enter: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -25 },
  };

  return (
    <div className="surface-card overflow-hidden bg-card/70 backdrop-blur-xl border-border/60">
      {/* Header Card */}
      <div className="px-6 pt-6 pb-0 text-left">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-1">
          {stepLabel}
        </p>
        <h2 className="text-xl font-bold text-foreground font-display tracking-tight">{title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5 font-medium">{description}</p>
      </div>

      {/* Body Card */}
      <div className="px-6 py-5 min-h-[320px] flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={stepKey}
            variants={variants}
            initial="hidden"
            animate="enter"
            exit="exit"
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="w-full text-left"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Card */}
      <div className="px-6 py-4 border-t border-border/50 flex items-center justify-between bg-muted/20">
        {footer}
      </div>
    </div>
  );
}

// ─── SHARED COMPONENT UI BUTTON & FIELD ────────────────────────────────────────
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
      className={`inline-flex items-center gap-1.5 h-10 px-5 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all outline-none cursor-pointer duration-200
        ${primary
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
    <div className="flex flex-col gap-1.5 w-full text-left">
      <label className="text-xs font-semibold text-muted-foreground tracking-wide">
        {label} {required && <span className="text-coral">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "h-10 w-full rounded-xl border border-border/60 bg-muted/40 px-3.5 text-sm text-foreground outline-none focus:border-primary/50 focus:bg-card focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/40 font-medium font-sans";

// ─── STEP 1: PERSONAL INFO ─────────────────────────────────────────────────────
function Step1({
  data,
  onChange,
  onNext,
}: {
  data: FormState;
  onChange: (patch: Partial<FormState>) => void;
  onNext: () => void;
}) {
  return (
    <FormCard
      stepLabel="Mục 01"
      title="Thông tin cá nhân"
      description="Điền đầy đủ thông tin để liên kết tài khoản định hướng sinh viên"
      stepKey="step1"
      footer={
        <>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">Bảo mật thông tin dữ liệu</span>
          <Btn primary onClick={onNext} disabled={!data.name || !data.email}>
            Tiếp theo <ArrowRight size={13} strokeWidth={2.5} />
          </Btn>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Họ và tên sinh viên" required>
          <input
            className={inputCls}
            placeholder="Lê Trần Anh Khoa"
            value={data.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Địa chỉ Email" required>
            <input
              className={inputCls}
              type="email"
              placeholder="you@fpt.edu.vn"
              value={data.email}
              onChange={(e) => onChange({ email: e.target.value })}
            />
          </Field>
          <Field label="Số điện thoại liên hệ">
            <input
              className={inputCls}
              placeholder="0901234567"
              value={data.phone}
              onChange={(e) => onChange({ phone: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Ngày tháng năm sinh">
          <input
            className={inputCls}
            type="date"
            value={data.dob}
            onChange={(e) => onChange({ dob: e.target.value })}
          />
        </Field>
      </div>
    </FormCard>
  );
}

// ─── STEP 2: CAMPUS SELECTION ──────────────────────────────────────────────────
function Step2({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: FormState;
  onChange: (patch: Partial<FormState>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <FormCard
      stepLabel="Mục 02"
      title="Lựa chọn tổ chức cơ sở"
      description="Bạn mong muốn tham gia đào tạo tại Campus nào?"
      stepKey="step2"
      footer={
        <>
          <Btn onClick={onBack}>
            <ArrowLeft size={13} strokeWidth={2.5} /> Quay lại
          </Btn>
          <Btn primary onClick={onNext} disabled={!data.campus}>
            Tiếp theo <ArrowRight size={13} strokeWidth={2.5} />
          </Btn>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {CAMPUSES.map((c) => {
          const isSelected = data.campus === c.city;
          return (
            <button
              type="button"
              key={c.city}
              onClick={() => onChange({ campus: c.city })}
              className={`text-left p-4 rounded-xl border-2 transition-all outline-none cursor-pointer group hover:scale-[1.02] active:scale-[0.98] duration-200 ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card/40 hover:border-primary/30"
              }`}
            >
              <p className={`text-sm font-bold font-display transition-colors ${isSelected ? "text-primary" : "text-foreground"}`}>{c.city}</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-snug font-medium">{c.address}</p>
            </button>
          );
        })}
      </div>
    </FormCard>
  );
}

// ─── STEP 3: COMBO MAJORS SELECTION ────────────────────────────────────────────
function Step3({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: FormState;
  onChange: (patch: Partial<FormState>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <FormCard
      stepLabel="Mục 03"
      title="Chương trình đào tạo Combo"
      description="Chọn 1 combo ngành tích hợp đột phá phù hợp định hướng tương lai"
      stepKey="step3"
      footer={
        <>
          <Btn onClick={onBack}>
            <ArrowLeft size={13} strokeWidth={2.5} /> Quay lại
          </Btn>
          <Btn primary onClick={onNext} disabled={!data.combo}>
            Chọn môn phụ <ArrowRight size={13} strokeWidth={2.5} />
          </Btn>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {COMBOS.map((c) => {
          const selected = data.combo === c.id;
          return (
            <button
              type="button"
              key={c.id}
              onClick={() => onChange({ combo: c.id, minor: "" })}
              className={`text-left rounded-xl border-2 transition-all overflow-hidden outline-none cursor-pointer duration-200 ${
                selected ? "border-primary bg-primary/5" : "border-border bg-card/30 hover:border-primary/20"
              }`}
            >
              <div className="flex items-start gap-4 p-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-lg flex-shrink-0 shadow-inner">
                  {c.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground font-display tracking-tight">{c.name}</p>
                  <p className="text-[10px] font-mono tracking-wider font-bold text-primary uppercase mt-0.5">{c.code}</p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                    selected ? "bg-primary border-primary shadow-sm" : "border-border bg-card"
                  }`}
                >
                  {selected && <span className="text-primary-foreground text-[10px] font-bold">✓</span>}
                </div>
              </div>
              {selected && (
                <div className="px-4 pb-4 pt-0 animate-fade-in">
                  <p className="text-xs text-muted-foreground bg-muted/50 rounded-xl p-3 leading-relaxed border border-border/40 font-medium">
                    {c.description}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </FormCard>
  );
}

// ─── STEP 3.5: SPECIALIZATION MINORS ───────────────────────────────────────────
function Step35({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: FormState;
  onChange: (patch: Partial<FormState>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const combo = COMBOS.find((c) => c.id === data.combo)!;
  const options = MINORS[data.combo] ?? [];

  return (
    <FormCard
      stepLabel="Mục 03 · Chuyên sâu định hướng"
      title="Môn học phụ trợ chuyên sâu"
      description={`Phân hệ định hướng mở rộng dành riêng cho ${combo?.name}`}
      stepKey="step35"
      footer={
        <>
          <Btn onClick={onBack}>
            <ArrowLeft size={13} strokeWidth={2.5} /> Đổi ngành
          </Btn>
          <Btn primary onClick={onNext}>
            Xem lại <ArrowRight size={13} strokeWidth={2.5} />
          </Btn>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((m) => {
          const isSelected = data.minor === m;
          return (
            <button
              type="button"
              key={m}
              onClick={() => onChange({ minor: m })}
              className={`text-left p-4 rounded-xl border-2 transition-all outline-none cursor-pointer group hover:scale-[1.02] active:scale-[0.98] duration-200 ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card/40 hover:border-primary/30"
              }`}
            >
              <p className={`text-sm font-bold font-display transition-colors ${isSelected ? "text-primary" : "text-foreground"}`}>{m}</p>
              <p className="text-[11px] text-muted-foreground mt-1 font-medium">Lĩnh vực bổ trợ {m.toLowerCase()}</p>
            </button>
          );
        })}
      </div>
    </FormCard>
  );
}

// ─── STEP 4: REVIEW & CONFIRMATION ─────────────────────────────────────────────
function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-0 text-sm">
      <span className="text-muted-foreground font-medium text-xs uppercase tracking-wider font-mono">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

function Step4({
  data,
  onSubmit,
  onBack,
}: {
  data: FormState;
  onSubmit: () => void;
  onBack: () => void;
}) {
  const combo = COMBOS.find((c) => c.id === data.combo)!;
  return (
    <FormCard
      stepLabel="Mục 04"
      title="Xác nhận hồ sơ dữ liệu"
      description="Vui lòng kiểm tra kỹ lưỡng các phân hệ trước khi đồng bộ lên máy chủ"
      stepKey="step4"
      footer={
        <>
          <Btn onClick={onBack}>
            <ArrowLeft size={13} strokeWidth={2.5} /> Quay lại
          </Btn>
          <Btn primary onClick={onSubmit}>
            <Send size={13} strokeWidth={2.5} /> Gửi đăng ký
          </Btn>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-xl bg-muted/30 border border-border/60 p-4 space-y-1">
          <ReviewRow label="Họ tên học viên" value={data.name} />
          <ReviewRow label="Hòm thư liên hệ" value={data.email} />
          {data.phone && <ReviewRow label="Điện thoại" value={data.phone} />}
        </div>
        <div className="rounded-xl bg-muted/30 border border-border/60 p-4 space-y-1">
          <ReviewRow label="Cơ sở (Campus)" value={data.campus} />
          <ReviewRow
            label="Chuyên ngành chính"
            value={
              <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 text-xs font-bold px-3 py-1 rounded-lg">
                {combo?.icon} {combo?.name}
              </span>
            }
          />
          {data.minor && (
            <ReviewRow 
              label="Chuyên ngành hẹp" 
              value={<span className="inline-flex items-center text-xs font-bold text-coral bg-coral/5 border border-coral/10 px-2.5 py-0.5 rounded-md">{data.minor}</span>} 
            />
          )}
        </div>
      </div>
    </FormCard>
  );
}

// ─── SUCCESS CONGRATULATIONS SCREEN ────────────────────────────────────────────
function SuccessScreen({ name, onRedirect }: { name: string; onRedirect: () => void }) {
  return (
    <div className="surface-card bg-card/70 backdrop-blur-xl border-border/60 p-8 lg:p-12 text-center min-h-[350px] flex flex-col items-center justify-center">
      <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
        <CheckCircle2 size={32} className="text-primary" />
      </div>
      <h2 className="text-2xl font-bold text-foreground font-display tracking-tight mb-2">Đăng ký thành công!</h2>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto font-medium">
        Cảm ơn bạn <strong className="text-foreground font-semibold">{name}</strong>! Hệ thống đã ghi nhận cấu trúc ngành combo và đang hoàn tất đồng bộ hóa.
      </p>
      <button
        type="button"
        onClick={onRedirect}
        className="mt-8 inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:opacity-90 active:scale-[0.97] transition-all duration-200 cursor-pointer shadow-md shadow-primary/10"
      >
        Tiến vào Hub ngay <ArrowRight size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}

// ─── ROOT CORE COMPONENT ───────────────────────────────────────────────────────
const TOTAL_STEPS = 4;

interface FPTComboFormProps {
  onClose?: () => void;
  onLoginSuccess: (email: string) => void;
}

export default function FPTComboForm({ onClose, onLoginSuccess }: FPTComboFormProps) {
  const [step, setStep] = useState<number>(1);
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    dob: "",
    campus: "",
    combo: "",
    minor: "",
  });

  const patch = (p: Partial<FormState>) => setForm((f) => ({ ...f, ...p }));
  const displayStep = step === 3.5 ? 3 : step >= 4 ? 4 : step;

  // Luồng tự động chuyển tab sau khi đạt mốc thành công
  useEffect(() => {
    if (step === 5) {
      const timerToLoader = setTimeout(() => {
        onLoginSuccess(form.email);
      }, 4000);
      return () => clearTimeout(timerToLoader);
    }
  }, [step, form.email, onLoginSuccess]);

  const handleForceRedirect = () => {
    onLoginSuccess(form.email);
  };

  if (step === 5) {
    return (
      <div className="w-full max-w-xl mx-auto animate-fade-in app-shell-font">
        <SuccessScreen name={form.name} onRedirect={handleForceRedirect} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-4 app-shell-font">
      {/* Dynamic Main Header */}
      <div className="surface-card bg-card/70 backdrop-blur-xl border-border/60 px-5 py-4 flex items-center gap-4 text-left">
        <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 font-display font-black text-primary-foreground text-sm tracking-widest shadow-sm">
          FPT
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-foreground font-display tracking-tight">Đăng ký chuyên ngành Combo</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 font-semibold">FPT University · Chương trình tích hợp song ngành</p>
          <StepIndicator current={displayStep} total={TOTAL_STEPS} />
        </div>
        {onClose && (
          <button 
            type="button" 
            onClick={onClose} 
            className="text-muted-foreground/40 hover:text-foreground transition-colors size-8 rounded-lg hover:bg-muted grid place-items-center outline-none cursor-pointer"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Animation Workflow Steps Controller */}
      <div className="w-full">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <Step1 key="s1" data={form} onChange={patch} onNext={() => setStep(2)} />
          )}
          {step === 2 && (
            <Step2
              key="s2"
              data={form}
              onChange={patch}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <Step3
              key="s3"
              data={form}
              onChange={patch}
              onNext={() => setStep(3.5)}
              onBack={() => setStep(2)}
            />
          )}
          {step === 3.5 && (
            <Step35
              key="s35"
              data={form}
              onChange={patch}
              onNext={() => setStep(4)}
              onBack={() => setStep(3)}
            />
          )}
          {step === 4 && (
            <Step4
              key="s4"
              data={form}
              onSubmit={() => setStep(5)}
              onBack={() => setStep(3.5)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}