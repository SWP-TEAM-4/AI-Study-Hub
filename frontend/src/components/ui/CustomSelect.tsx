import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";

export type SelectOption = {
  label: string;
  value: string;
};

export type SelectGroup = {
  label: string;
  options: SelectOption[];
};

export type SelectData = SelectOption | SelectGroup;

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  data: SelectData[];
  placeholder?: string;
  className?: string;
}

export default function CustomSelect({ value, onChange, data, placeholder, className = "" }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Find selected label
  let selectedLabel = placeholder || "Chọn...";
  for (const item of data) {
    if ("options" in item) {
      const found = item.options.find(opt => opt.value === value);
      if (found) {
        selectedLabel = found.label;
        break;
      }
    } else {
      if (item.value === value) {
        selectedLabel = item.label;
        break;
      }
    }
  }

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${isOpen ? 'z-[100]' : ''} ${className}`} ref={containerRef}>
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={placeholder || "Chọn tùy chọn"}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-11 px-3 text-sm flex items-center justify-between outline-none cursor-pointer bg-muted/50 hover:bg-muted/80 border border-transparent focus:border-primary focus:bg-card focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl transition-all"
      >
        <span className="truncate pr-2 font-medium">{selectedLabel}</span>
        <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 mt-1.5 w-full min-w-[200px] left-0 md:left-auto right-auto md:right-0 bg-card border border-border shadow-lg rounded-xl overflow-hidden"
          >
            <div 
              role="listbox" 
              className="max-h-[500px] overflow-y-auto custom-scrollbar py-1.5"
            >
              {data.map((item, i) => {
                if ("options" in item) {
                  // It's a group
                  return (
                    <div key={i} className="mb-1" role="group" aria-label={item.label}>
                      <div className="px-3 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider bg-muted/20">
                        {item.label}
                      </div>
                      {item.options.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          role="option"
                          aria-selected={value === opt.value}
                          onClick={() => handleSelect(opt.value)}
                          className="w-full px-3 py-2 text-sm text-left flex items-center justify-between hover:bg-muted/50 transition-colors focus:bg-muted/50 outline-none"
                        >
                          <span className={value === opt.value ? "font-semibold text-primary" : ""}>{opt.label}</span>
                          {value === opt.value && <Check size={14} className="text-primary" />}
                        </button>
                      ))}
                    </div>
                  );
                } else {
                  // It's a normal option
                  return (
                    <button
                      key={item.value}
                      type="button"
                      role="option"
                      aria-selected={value === item.value}
                      onClick={() => handleSelect(item.value)}
                      className="w-full px-3 py-2 text-sm text-left flex items-center justify-between hover:bg-muted/50 transition-colors focus:bg-muted/50 outline-none"
                    >
                      <span className={value === item.value ? "font-semibold text-primary" : ""}>{item.label}</span>
                      {value === item.value && <Check size={14} className="text-primary" />}
                    </button>
                  );
                }
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
