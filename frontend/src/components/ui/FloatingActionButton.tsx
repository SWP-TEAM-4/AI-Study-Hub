import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface FloatingActionButtonProps extends HTMLMotionProps<"button"> {
  icon: LucideIcon;
  onClick: () => void;
  className?: string;
  position?: "bottom-right" | "bottom-center";
}

export function FloatingActionButton({ 
  icon: Icon, 
  onClick, 
  className = "",
  position = "bottom-right",
  ...props 
}: FloatingActionButtonProps) {
  
  const positionClasses = position === "bottom-right" 
    ? "bottom-24 right-6" // Accounts for bottom nav
    : "bottom-24 left-1/2 -translate-x-1/2";

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={onClick}
      className={`fixed ${positionClasses} z-40 flex items-center justify-center size-14 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 border border-primary/20 ${className}`}
      {...props}
    >
      <Icon size={24} strokeWidth={2.5} />
    </motion.button>
  );
}
