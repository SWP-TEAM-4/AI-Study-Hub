"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Gamepad2,
  Layers,
  FileStack,
  Globe2,
  Bot,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

// ─── TOUR STEPS ───────────────────────────────────────────────────────────────

const steps = [
  {
    id: "welcome",
    icon: Sparkles,
    color: "from-violet-500 to-purple-600",
    bgGlow: "bg-violet-500/10",
    title: "Chào mừng đến với AI Study Hub! 🎉",
    description:
      "Nền tảng học tập thông minh được hỗ trợ bởi AI, giúp bạn học hiệu quả hơn, ghi nhớ lâu hơn và đạt kết quả tốt hơn.",
    tip: null,
  },
  {
    id: "notebooks",
    icon: BookOpen,
    color: "from-blue-500 to-cyan-500",
    bgGlow: "bg-blue-500/10",
    title: " Sổ Tay Thông Minh",
    description:
      "Tổ chức tài liệu học tập của bạn theo từng môn học. Mỗi sổ tay có thể chứa nhiều tài liệu, ghi chú và các bài tập.",
    tip: " Gợi ý: Tạo một sổ tay riêng cho mỗi môn học của học kỳ này!",
  },
  {
    id: "documents",
    icon: FileStack,
    color: "from-emerald-500 to-teal-500",
    bgGlow: "bg-emerald-500/10",
    title: " Tài Liệu & Upload",
    description:
      "Upload tài liệu PDF, Word, PowerPoint... AI sẽ tự động phân tích và tóm tắt nội dung, giúp bạn học nhanh hơn.",
    tip: " Gợi ý: AI có thể trả lời câu hỏi dựa trên nội dung tài liệu của bạn!",
  },
  {
    id: "quiz",
    icon: Gamepad2,
    color: "from-orange-500 to-red-500",
    bgGlow: "bg-orange-500/10",
    title: " Quiz & Kiểm Tra",
    description:
      "Tạo bộ đề thi tùy chỉnh hoặc để AI tự động sinh câu hỏi từ tài liệu của bạn. Luyện tập thường xuyên để ghi nhớ tốt hơn!",
    tip: " Gợi ý: Hãy thử chế độ 'Làm bài ngay' để kiểm tra kiến thức của bạn!",
  },
  {
    id: "flashcards",
    icon: Layers,
    color: "from-pink-500 to-rose-500",
    bgGlow: "bg-pink-500/10",
    title: " Flashcards",
    description:
      "Phương pháp học Spaced Repetition (lặp lại theo khoảng cách) được chứng minh khoa học giúp ghi nhớ dài hạn hiệu quả.",
    tip: " Gợi ý: Học flashcard 15 phút mỗi ngày hiệu quả hơn học 2 tiếng một lần!",
  },
  {
    id: "ai",
    icon: Bot,
    color: "from-indigo-500 to-blue-600",
    bgGlow: "bg-indigo-500/10",
    title: " AI Trợ Lý Học Tập",
    description:
      "Đặt câu hỏi, giải thích khái niệm khó, hoặc nhờ AI tóm tắt bài học. Trợ lý AI luôn sẵn sàng hỗ trợ bạn 24/7.",
    tip: " Gợi ý: Hỏi AI để giải thích những phần bạn chưa hiểu trong tài liệu!",
  },
  {
    id: "community",
    icon: Globe2,
    color: "from-amber-500 to-yellow-500",
    bgGlow: "bg-amber-500/10",
    title: " Cộng Đồng Học Tập",
    description:
      "Chia sẻ tài liệu, trao đổi kinh thức và kết nối với hàng nghìn học sinh, sinh viên khác trong cộng đồng.",
    tip: " Gợi ý: Tài liệu được cộng đồng đánh giá cao thường rất đáng tin cậy!",
  },
  {
    id: "done",
    icon: CheckCircle2,
    color: "from-green-500 to-emerald-500",
    bgGlow: "bg-green-500/10",
    title: "Bạn đã sẵn sàng! ",
    description:
      "Bây giờ bạn đã biết tất cả các tính năng chính. Hãy bắt đầu hành trình học tập thông minh của bạn ngay hôm nay!",
    tip: null,
  },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "onboarding_completed_v1";

export function OnboardingTour() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      // Delay a bit to let the dashboard render first
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsVisible(false);
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const step = steps[currentStep];
  const Icon = step.icon;
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;

  const variants = {
    enter: (d: number) => ({
      x: d > 0 ? 60 : -60,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (d: number) => ({
      x: d > 0 ? -60 : 60,
      opacity: 0,
    }),
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md"
            onClick={handleSkip}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto relative w-full max-w-md bg-card border border-border/50 rounded-3xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Glow background */}
              <div
                className={`absolute inset-0 ${step.bgGlow} opacity-30 blur-3xl pointer-events-none transition-colors duration-500`}
              />

              {/* Top bar with skip */}
              <div className="relative flex items-center justify-between px-6 pt-5 pb-0">
                <div className="flex gap-1.5">
                  {steps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setDirection(i > currentStep ? 1 : -1);
                        setCurrentStep(i);
                      }}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === currentStep
                          ? "w-6 bg-primary"
                          : i < currentStep
                          ? "w-3 bg-primary/50"
                          : "w-3 bg-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={handleSkip}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted"
                >
                  <X size={14} />
                  Bỏ qua
                </button>
              </div>

              {/* Step content */}
              <div className="relative px-6 py-6 min-h-[320px] flex flex-col items-center text-center overflow-hidden">
                <AnimatePresence custom={direction} mode="wait">
                  <motion.div
                    key={step.id}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="flex flex-col items-center gap-4 w-full"
                  >
                    {/* Icon */}
                    <div
                      className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}
                    >
                      <Icon size={36} className="text-white" />
                      <div className="absolute inset-0 rounded-2xl bg-white/10" />
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold text-foreground leading-tight">
                      {step.title}
                    </h2>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                      {step.description}
                    </p>

                    {/* Tip */}
                    {step.tip && (
                      <div className="w-full mt-2 px-4 py-3 rounded-xl bg-primary/8 border border-primary/15 text-xs text-primary/90 font-medium text-left leading-relaxed">
                        {step.tip}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer buttons */}
              <div className="relative flex items-center justify-between px-6 pb-6 gap-3">
                {/* Prev */}
                <button
                  onClick={handlePrev}
                  disabled={isFirst}
                  className={`flex items-center gap-1.5 px-4 h-10 rounded-xl text-sm font-medium transition-all ${
                    isFirst
                      ? "opacity-0 pointer-events-none"
                      : "bg-muted hover:bg-muted/80 text-foreground"
                  }`}
                >
                  <ArrowLeft size={16} />
                  Quay lại
                </button>

                {/* Step counter */}
                <span className="text-xs text-muted-foreground tabular-nums">
                  {currentStep + 1} / {steps.length}
                </span>

                {/* Next / Done */}
                <button
                  onClick={handleNext}
                  className={`flex items-center gap-1.5 px-5 h-10 rounded-xl text-sm font-bold text-white transition-all bg-gradient-to-r ${step.color} hover:brightness-110 shadow-md hover:shadow-lg active:scale-95`}
                >
                  {isLast ? (
                    <>
                      Bắt đầu!
                      <Sparkles size={14} />
                    </>
                  ) : (
                    <>
                      Tiếp theo
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
