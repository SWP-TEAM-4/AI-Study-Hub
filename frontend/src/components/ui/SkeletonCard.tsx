import { motion } from "framer-motion";

export function SkeletonCard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="surface-card p-5 overflow-hidden relative"
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 dark:via-white/5 to-transparent z-10" />
      <div className="flex items-start justify-between mb-4">
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-muted rounded-full" />
          <div className="h-4 w-20 bg-muted/50 rounded mt-1" />
        </div>
        <div className="h-6 w-6 bg-muted rounded" />
      </div>
      <div className="h-6 w-3/4 bg-muted rounded mb-3" />
      <div className="h-4 w-1/2 bg-muted/50 rounded mb-6" />
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-muted rounded-xl" />
        <div className="h-10 flex-1 bg-muted rounded-xl" />
      </div>
    </motion.div>
  );
}
