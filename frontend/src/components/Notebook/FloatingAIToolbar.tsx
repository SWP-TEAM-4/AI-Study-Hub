import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, FileText, Globe, GraduationCap } from "lucide-react";

export interface FloatingAIToolbarProps {
  containerRef: React.RefObject<HTMLElement | null>;
  onAction: (action: string, selectedText: string) => void;
}

export default function FloatingAIToolbar({ containerRef, onAction }: FloatingAIToolbarProps) {
  const [selection, setSelection] = useState<{ text: string; top: number; left: number } | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      // Small timeout to allow the browser to update the selection
      setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) {
          setSelection(null);
          return;
        }

        const text = sel.toString().trim();
        if (!text) {
          setSelection(null);
          return;
        }

        // Check if the selection is inside the container
        if (containerRef.current && containerRef.current.contains(sel.anchorNode)) {
          const range = sel.getRangeAt(0);
          const rect = range.getBoundingClientRect();

          // Calculate position (above the selection)
          // Ensure it stays within viewport
          let top = rect.top - 50; 
          if (top < 10) top = rect.bottom + 10;
          
          let left = rect.left + rect.width / 2;

          setSelection({
            text,
            top,
            left,
          });
        } else {
          setSelection(null);
        }
      }, 50);
    };

    const handleMouseDown = (e: MouseEvent) => {
      // If clicking inside the toolbar, don't dismiss
      if (toolbarRef.current && toolbarRef.current.contains(e.target as Node)) {
        return;
      }
      setSelection(null);
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [containerRef]);

  const handleActionClick = (action: string) => {
    if (selection) {
      onAction(action, selection.text);
      setSelection(null);
      window.getSelection()?.removeAllRanges();
    }
  };

  return (
    <AnimatePresence>
      {selection && (
        <motion.div
          ref={toolbarRef}
          initial={{ opacity: 0, y: 10, scale: 0.95, x: "-50%" }}
          animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
          exit={{ opacity: 0, y: 5, scale: 0.95, x: "-50%" }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          style={{
            position: "fixed",
            top: selection.top,
            left: selection.left,
            zIndex: 9999,
          }}
          className="flex items-center gap-1 p-1 rounded-xl bg-card/80 backdrop-blur-xl border border-border/50 shadow-2xl dark:premium-ambient-glow"
        >
          <button
            onClick={() => handleActionClick("Giải thích")}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium text-foreground hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer"
          >
            <Sparkles size={14} className="text-primary" /> Giải thích
          </button>
          
          <div className="w-px h-4 bg-border/50 mx-1" />
          
          <button
            onClick={() => handleActionClick("Tóm tắt")}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <FileText size={14} /> Tóm tắt
          </button>

          <div className="w-px h-4 bg-border/50 mx-1" />
          
          <button
            onClick={() => handleActionClick("Dịch")}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <Globe size={14} /> Dịch
          </button>

          <div className="w-px h-4 bg-border/50 mx-1" />
          
          <button
            onClick={() => handleActionClick("Tạo Flashcard")}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium text-foreground hover:bg-rose-500/20 hover:text-rose-500 transition-colors cursor-pointer"
          >
            <GraduationCap size={14} className="text-rose-500" /> Flashcard
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
