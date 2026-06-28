import { motion } from "framer-motion";
import { X, Tag, Edit, Sparkles } from "lucide-react";
import { Notify } from "notiflix";
import { useState } from "react";

interface MockFeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "EDIT" | "TAG";
  itemName?: string;
}

export function MockFeatureModal({ isOpen, onClose, type, itemName = "Tài liệu" }: MockFeatureModalProps) {
  const [val, setVal] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative surface-card w-full max-w-md rounded-2xl p-6 shadow-2xl border border-border/50">
        
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-primary/10 text-primary grid place-items-center">
              {type === "EDIT" ? <Edit size={16} /> : <Tag size={16} />}
            </div>
            <h3 className="font-display font-semibold text-lg">{type === "EDIT" ? "Sửa thông tin" : "Gắn thẻ (Tags)"}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground transition-colors"><X size={18} /></button>
        </div>

        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary/80 flex items-start gap-2">
            <Sparkles size={14} className="mt-0.5 shrink-0" />
            <div>Giao diện này đang được hiển thị ở dạng mô phỏng (Mock). Khi có API từ backend, dữ liệu sẽ được lưu thật.</div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              {type === "EDIT" ? "Tên mới" : "Thêm Tag mới"} cho {itemName}
            </label>
            <input 
              value={val}
              onChange={e => setVal(e.target.value)}
              placeholder={type === "EDIT" ? "Nhập tên..." : "Ví dụ: quan_trong, de_thi..."} 
              className="w-full h-10 px-3 rounded-xl bg-card border border-border focus:border-primary outline-none text-sm transition-all" 
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-4 h-10 rounded-xl bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors">
              Hủy
            </button>
            <button 
              onClick={() => {
                Notify.success("Đã mô phỏng lưu thành công!");
                onClose();
              }} 
              className="px-4 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Lưu thay đổi
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
