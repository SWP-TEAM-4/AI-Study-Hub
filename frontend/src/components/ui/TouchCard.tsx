import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";

interface TouchCardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  className?: string;
}

export function TouchCard({ children, className = "", ...props }: TouchCardProps) {
  return (
    <motion.div
      whileTap={{ scale: 0.98, opacity: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`bg-card text-card-foreground rounded-2xl shadow-sm border border-border/50 p-4 ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
