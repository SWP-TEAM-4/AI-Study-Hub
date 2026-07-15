"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { DotLottiePlayer } from "@dotlottie/react-player";
import "@dotlottie/react-player/dist/index.css";

// ─── TOUR STEPS ───────────────────────────────────────────────────────────────

const steps = [
  {
    id: "upload",
    title: " Bước 1: Tải Lên Tài Liệu",
    description:
      "Bạn chỉ cần tải lên sách, truyện, hoặc tài liệu học tập (PDF, Word). Người bạn AI sẽ tự động đọc hiểu và tóm tắt bài học giúp bạn cực kỳ nhanh chóng!",
    tip: "Gợi ý: Tải lên một tệp bài học để bắt đầu học tập ngay bé nhé!",
  },
  {
    id: "ai_chat",
    title: " Bước 2: Trò Chuyện Cùng AI",
    description:
      "Bạn có câu hỏi khó hay chỗ nào chưa hiểu bài? Hãy gửi tin nhắn ngay cho bạn AI thông thái để được giải đáp bằng những ví dụ siêu dễ thương nhé.",
    tip: "Gợi ý: Bạn hãy nhờ AI giải thích bất kỳ từ ngữ hay khái niệm khó nào!",
  },
  {
    id: "quiz_flashcard",
    title: " Bước 3: Đố Vui & Flashcard",
    description:
      "Bạn AI sẽ tự động biến tài liệu học tập của bé thành các câu đố vui nhộn (Quiz) hoặc thẻ ghi nhớ thông minh (Flashcard) để bạn vừa học vừa chơi trò chơi cực đỉnh.",
    tip: "Gợi ý: Trả lời đố vui hàng ngày giúp bộ não bé ghi nhớ siêu lâu!",
  },
  {
    id: "community",
    title: " Bước 4: Cộng Đồng Chia Sẻ",
    description:
      "Nơi bạn có thể tự tin chia sẻ những cuốn vở ghi chép đẹp đẽ, tài liệu bổ ích và cùng kết nối, đua điểm số học tập với bạn bè trên khắp cả nước.",
    tip: "Gợi ý: Cùng nhau chia sẻ kiến thức hay để nhận thêm nhiều huy chương lấp lánh!",
  },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export function OnboardingTour() {
  const [isVisible, setIsVisible] = useState(false);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  const handleComplete = () => {
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
    <>
      {/* Floating help guide button */}
      {!isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => {
            setCurrentStep(0);
            setIsVisible(true);
          }}
          onMouseEnter={() => setIsButtonHovered(true)}
          onMouseLeave={() => setIsButtonHovered(false)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 pl-3 pr-5 h-12 rounded-full bg-white border-2 border-[#89cff0] text-[#0d6683] text-[14px] font-extrabold shadow-[0_8px_20px_rgba(137,207,240,0.3)] hover:bg-[#eff6ff] active:scale-95 transition-all cursor-pointer"
        >
          <div className="w-8 h-8 flex items-center justify-center overflow-hidden">
            <DotLottiePlayer
              src="/Book animation.lottie"
              autoplay
              loop
              speed={isButtonHovered ? 1 : 0}
              style={{ width: "100%", height: "100%" }}
            />
          </div>
          Hướng dẫn học tập
        </motion.button>
      )}

      <AnimatePresence>
        {isVisible && (
          <>
            {/* Backdrop blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm"
              onClick={handleSkip}
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 30 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none"
            >
              <div
                className="pointer-events-auto relative w-full max-w-md bg-[#fef9f3] border-4 border-[#89cff0] rounded-[32px] shadow-2xl p-6 overflow-hidden select-none"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Dashed stitched border inside */}
                <div className="absolute inset-1.5 border-4 border-dashed border-[#89cff0]/40 rounded-[24px] pointer-events-none z-0" />

                {/* Top progress indicators */}
                <div className="relative z-10 flex items-center justify-between px-2 pt-2">
                  <div className="flex gap-2">
                    {steps.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setDirection(i > currentStep ? 1 : -1);
                          setCurrentStep(i);
                        }}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          i === currentStep
                            ? "w-6 bg-[#89cff0]"
                            : i < currentStep
                            ? "w-2 bg-[#89cff0]/60"
                            : "w-2 bg-slate-300"
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={handleSkip}
                    className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200"
                  >
                    <X size={13} />
                    Bỏ qua
                  </button>
                </div>

                {/* Lottie animation area displaying the book */}
                <div className="relative z-10 mt-6 px-2">
                  <div className="w-full h-48 flex items-center justify-center bg-white border-2 border-[#89cff0]/30 rounded-2xl overflow-hidden shadow-inner">
                    <DotLottiePlayer
                      src="/Blue Working Cat Animation.lottie"
                      autoplay
                      loop
                      style={{ width: "100%", height: "100%" }}
                    />
                  </div>
                </div>

                {/* Step content */}
                <div className="relative z-10 px-2 py-5 min-h-[190px] flex flex-col items-center text-center overflow-hidden">
                  <AnimatePresence custom={direction} mode="wait">
                    <motion.div
                      key={step.id}
                      custom={direction}
                      variants={variants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="flex flex-col items-center gap-3 w-full"
                    >
                      {/* Title */}
                      <h2 className="text-xl font-extrabold text-[#0d1c2e] font-serif leading-tight">
                        {step.title}
                      </h2>

                      {/* Description */}
                      <p className="text-[14px] font-bold text-slate-500 leading-relaxed max-w-sm">
                        {step.description}
                      </p>

                      {/* Tip suggestion box */}
                      {step.tip && (
                        <div className="w-full mt-1.5 px-4 py-2.5 rounded-xl bg-[#eff6ff] border-2 border-[#89cff0]/20 text-[12px] text-[#0d6683] font-bold text-left leading-relaxed">
                          💡 {step.tip}
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Navigation Actions Footer */}
                <div className="relative z-10 flex items-center justify-between px-2 pb-2 gap-4">
                  {/* Prev page */}
                  <button
                    onClick={handlePrev}
                    disabled={isFirst}
                    className={`flex items-center gap-1.5 px-4 h-10 rounded-full text-sm font-bold transition-all ${
                      isFirst
                        ? "opacity-0 pointer-events-none"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-500"
                    }`}
                  >
                    <ArrowLeft size={15} />
                    Quay lại
                  </button>

                  {/* Step indicators label */}
                  <span className="text-xs font-bold text-slate-400">
                    Trạm {currentStep + 1} / {steps.length}
                  </span>

                  {/* Next page / Complete button */}
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-1.5 px-5 h-10 rounded-full text-sm font-extrabold text-white bg-[#89cff0] border-b-4 border-[#0d6683] hover:bg-[#a6dcf8] active:translate-y-[1.5px] active:border-b-[2px] shadow-sm hover:shadow active:scale-95 transition-all duration-100"
                  >
                    {isLast ? (
                      <>
                        Khám phá ngay!
                        {/* <Sparkles size={14} /> */}
                      </>
                    ) : (
                      <>
                        Tiếp theo
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
}