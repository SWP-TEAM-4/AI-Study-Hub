import { FolderOpen } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  imageUrl?: string;
}

export default function EmptyState({
  title,
  description,
  actionText,
  actionHref,
  onAction,
  actionIcon,
  imageUrl,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full flex flex-col items-center justify-center p-8 text-center surface-card rounded-2xl border border-border/30 min-h-[300px]"
    >
      <div className="w-32 h-32 mb-6 opacity-80 mix-blend-plus-lighter relative flex items-center justify-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Empty State"
            className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          />
        ) : (
          <FolderOpen size={64} className="text-muted-foreground/30" />
        )}
      </div>

      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">{description}</p>

      {(actionText && actionHref) ? (
        <Link
          to={actionHref}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 hover:border-primary/40 rounded-xl font-medium text-sm transition-all"
        >
          {actionIcon}
          {actionText}
        </Link>
      ) : (actionText && onAction) ? (
        <button
          onClick={onAction}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 hover:border-primary/40 rounded-xl font-medium text-sm transition-all cursor-pointer"
        >
          {actionIcon}
          {actionText}
        </button>
      ) : null}
    </motion.div>
  );
}
