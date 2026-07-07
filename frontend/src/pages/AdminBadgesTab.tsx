import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Plus, Search, Trophy } from "lucide-react";
import { badgeService, BadgeDTO } from "../services/badgeService";
import { Notify } from "notiflix";

export default function AdminBadgesTab() {
  const [badges, setBadges] = useState<BadgeDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [q, setQ] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "", iconUrl: "/badges/default.svg" });

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    setIsLoading(true);
    try {
      const res = await badgeService.getBadges();
      if (res.success && res.data) {
        setBadges(res.data);
      }
    } catch (e: any) {
      Notify.failure(e.message || "Lỗi nạp danh sách huy hiệu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim()) {
      Notify.failure("Vui lòng điền đủ thông tin.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await badgeService.createBadge(formData);
      if (res.success && res.data) {
        Notify.success("Tạo huy hiệu thành công!");
        setBadges([res.data, ...badges]);
        setIsFormOpen(false);
        setFormData({ name: "", description: "", iconUrl: "/badges/default.svg" });
      }
    } catch (e: any) {
      Notify.failure(e.message || "Lỗi tạo huy hiệu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBadges = badges.filter(b => b.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm kiếm huy hiệu..."
            className="w-full pl-10 pr-4 h-11 rounded-xl bg-card border border-border focus:border-primary outline-none text-sm transition-colors"
          />
        </div>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all shrink-0"
        >
          <Plus size={16} /> Tạo Huy hiệu mới
        </button>
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleCreateBadge} className="surface-card p-6 border border-primary/20 bg-primary/5">
              <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2 text-foreground">
                <Trophy className="text-primary" size={18} /> Nhập thông tin Huy hiệu
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tên huy hiệu</label>
                  <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3.5 h-10 rounded-xl bg-card border border-border focus:border-primary outline-none text-sm font-medium" placeholder="VD: First Upload" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Icon URL</label>
                  <input required value={formData.iconUrl} onChange={e => setFormData({ ...formData, iconUrl: e.target.value })} className="w-full px-3.5 h-10 rounded-xl bg-card border border-border focus:border-primary outline-none text-sm font-medium" placeholder="/badges/icon.svg" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mô tả điều kiện đạt được</label>
                  <input required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-3.5 h-10 rounded-xl bg-card border border-border focus:border-primary outline-none text-sm font-medium" placeholder="VD: Uploaded first approved content" />
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-3">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-5 h-10 rounded-xl bg-muted text-muted-foreground font-semibold text-sm hover:bg-muted/80">Hủy</button>
                <button type="submit" disabled={isSubmitting} className="px-5 h-10 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2">
                  {isSubmitting && <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Tạo Huy hiệu
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Đang tải dữ liệu...
          </div>
        ) : filteredBadges.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">Không tìm thấy huy hiệu nào.</div>
        ) : (
          filteredBadges.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="surface-card p-5 text-center flex flex-col items-center group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div
                className="size-16 rounded-2xl grid place-items-center mb-3 shadow-sm relative z-10"
                style={{
                  background: `oklch(0.55 0.14 165 / 0.15)`,
                  color: `oklch(0.45 0.14 165)`,
                }}
              >
                <Award size={28} />
              </div>
              <h3 className="font-bold text-foreground text-sm relative z-10">{b.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 relative z-10">{b.description}</p>
              <div className="text-[10px] font-mono text-muted-foreground/60 mt-3 pt-3 border-t border-border w-full relative z-10">
                ID: #{b.id}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
