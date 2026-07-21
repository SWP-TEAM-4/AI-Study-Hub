import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Search } from "lucide-react";

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
  /** Bật ô search bên trong dropdown. Mặc định: auto khi tổng options vượt searchThreshold. */
  searchable?: boolean | "auto";
  /** Ngưỡng auto. Mặc định 8. */
  searchThreshold?: number;
  /** Placeholder cho ô search. */
  searchPlaceholder?: string;
  /** Text hiển thị khi filter không khớp option nào. */
  emptyText?: string;
  /** Cho phép option rỗng (value === ""). Dùng cho dropdown mặc định "Không chọn..." */
  allowEmpty?: boolean;
  emptyOptionLabel?: string;
}

function flattenOptions(data: SelectData[]): SelectOption[] {
  const out: SelectOption[] = [];
  for (const item of data) {
    if ("options" in item) out.push(...item.options);
    else out.push(item);
  }
  return out;
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function highlightMatch(label: string, query: string) {
  const q = normalize(query);
  if (!q) return label;
  const norm = normalize(label);
  const idx = norm.indexOf(q);
  if (idx === -1) return label;
  return (
    <>
      {label.slice(0, idx)}
      <span className="text-primary font-semibold">{label.slice(idx, idx + q.length)}</span>
      {label.slice(idx + q.length)}
    </>
  );
}

export default function CustomSelect({
  value,
  onChange,
  data,
  placeholder,
  className = "",
  searchable = "auto",
  searchThreshold = 8,
  searchPlaceholder = "Tìm kiếm...",
  emptyText = "Không có kết quả phù hợp",
  allowEmpty = false,
  emptyOptionLabel = "",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [focusedIdx, setFocusedIdx] = useState<number>(0);

  // Reset khi đóng
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setFocusedIdx(0);
    } else {
      // focus vào ô search sau khi mở
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalOptions = useMemo(() => flattenOptions(data).length, [data]);

  const isSearchable = useMemo(() => {
    if (searchable === true) return true;
    if (searchable === false) return false;
    return totalOptions >= searchThreshold;
  }, [searchable, totalOptions, searchThreshold]);

  // Lọc data theo query (search không phân biệt hoa thường / dấu)
  const filteredData = useMemo<SelectData[]>(() => {
    if (!isSearchable || !query.trim()) return data;
    const q = normalize(query);
    const result: SelectData[] = [];
    for (const item of data) {
      if ("options" in item) {
        const matched = item.options.filter((o) => normalize(o.label).includes(q));
        if (matched.length > 0) result.push({ label: item.label, options: matched });
      } else {
        if (normalize(item.label).includes(q)) result.push(item);
      }
    }
    return result;
  }, [data, query, isSearchable]);

  const flatFiltered = useMemo(() => flattenOptions(filteredData), [filteredData]);

  // Tìm label hiện đang chọn
  let selectedLabel = placeholder || "Chọn...";
  for (const item of data) {
    if ("options" in item) {
      const found = item.options.find((opt) => opt.value === value);
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIdx((i) => Math.min(flatFiltered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = flatFiltered[focusedIdx];
      if (opt) handleSelect(opt.value);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${isOpen ? "z-[100]" : ""} ${className}`} ref={containerRef} onKeyDown={handleKeyDown}>
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={placeholder || "Chọn tùy chọn"}
        onClick={() => setIsOpen((o) => !o)}
        className="w-full h-11 px-3 text-sm flex items-center justify-between outline-none cursor-pointer bg-muted/50 hover:bg-muted/80 border border-transparent focus:border-primary focus:bg-card focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl transition-all"
      >
        <span className={`truncate pr-2 font-medium ${value === "" ? "text-muted-foreground" : ""}`}>
          {value === "" && emptyOptionLabel ? emptyOptionLabel : selectedLabel}
        </span>
        <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 mt-1.5 w-full min-w-[240px] left-0 md:left-auto right-auto md:right-0 bg-card border border-border shadow-lg rounded-xl overflow-hidden"
          >
            {isSearchable && (
              <div className="p-2 border-b border-border/60 sticky top-0 bg-card">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setFocusedIdx(0);
                    }}
                    placeholder={searchPlaceholder}
                    className="w-full h-9 pl-8 pr-3 rounded-lg bg-muted/40 border border-transparent focus:border-primary focus:bg-card outline-none text-sm"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}

            <div role="listbox" className="max-h-[400px] overflow-y-auto custom-scrollbar py-1.5">
              {allowEmpty && (
                <button
                  type="button"
                  role="option"
                  aria-selected={value === ""}
                  onClick={() => handleSelect("")}
                  className="w-full px-3 py-2 text-sm text-left flex items-center justify-between hover:bg-muted/50 transition-colors focus:bg-muted/50 outline-none text-muted-foreground italic"
                >
                  <span className={value === "" ? "font-semibold text-foreground not-italic" : ""}>
                    {emptyOptionLabel || "— Không chọn —"}
                  </span>
                  {value === "" && <Check size={14} className="text-primary" />}
                </button>
              )}

              {flatFiltered.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-muted-foreground">{emptyText}</div>
              ) : (
                filteredData.map((item, i) => {
                  if ("options" in item) {
                    return (
                      <div key={`g-${i}`} className="mb-1" role="group" aria-label={item.label}>
                        <div className="px-3 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider bg-muted/20">
                          {item.label}
                        </div>
                        {item.options.map((opt) => {
                          const flatIdx = flatFiltered.findIndex((f) => f.value === opt.value);
                          const isFocused = flatIdx === focusedIdx;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              role="option"
                              aria-selected={value === opt.value}
                              onClick={() => handleSelect(opt.value)}
                              onMouseEnter={() => setFocusedIdx(flatIdx)}
                              className={`w-full px-3 py-2 text-sm text-left flex items-center justify-between transition-colors outline-none ${
                                isFocused ? "bg-muted/60" : "hover:bg-muted/50"
                              }`}
                            >
                              <span className={value === opt.value ? "font-semibold text-primary" : ""}>
                                {highlightMatch(opt.label, query)}
                              </span>
                              {value === opt.value && <Check size={14} className="text-primary" />}
                            </button>
                          );
                        })}
                      </div>
                    );
                  }
                  const flatIdx = flatFiltered.findIndex((f) => f.value === item.value);
                  const isFocused = flatIdx === focusedIdx;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      role="option"
                      aria-selected={value === item.value}
                      onClick={() => handleSelect(item.value)}
                      onMouseEnter={() => setFocusedIdx(flatIdx)}
                      className={`w-full px-3 py-2 text-sm text-left flex items-center justify-between transition-colors outline-none ${
                        isFocused ? "bg-muted/60" : "hover:bg-muted/50"
                      }`}
                    >
                      <span className={value === item.value ? "font-semibold text-primary" : ""}>
                        {highlightMatch(item.label, query)}
                      </span>
                      {value === item.value && <Check size={14} className="text-primary" />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}