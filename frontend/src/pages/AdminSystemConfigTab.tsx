import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Plus, Search, Trash2, Edit2, Save, X } from "lucide-react";
import { systemConfigService, SystemConfigDTO } from "../services/systemConfigService";
import { Notify } from "notiflix";

export default function AdminSystemConfigTab() {
  const [configs, setConfigs] = useState<SystemConfigDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [q, setQ] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ configKey: "", configValue: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState({ configKey: "", configValue: "", description: "" });

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setIsLoading(true);
    try {
      const res = await systemConfigService.getAdminConfigs();
      if (res.success && res.data) {
        setConfigs(res.data);
      }
    } catch (e: any) {
      Notify.failure(e.message || "Lỗi tải cấu hình hệ thống");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.configKey.trim() || !formData.configValue.trim()) {
      Notify.failure("Vui lòng điền tối thiểu Key và Value.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await systemConfigService.createConfig(formData);
      if (res.success && res.data) {
        Notify.success("Tạo cấu hình thành công!");
        setConfigs([res.data, ...configs]);
        setIsFormOpen(false);
        setFormData({ configKey: "", configValue: "", description: "" });
      }
    } catch (e: any) {
      Notify.failure(e.message || "Lỗi tạo cấu hình");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editData.configKey.trim() || !editData.configValue.trim()) {
      Notify.failure("Key và Value không được để trống.");
      return;
    }
    try {
      const res = await systemConfigService.updateConfig(id, editData);
      if (res.success && res.data) {
        Notify.success("Cập nhật thành công!");
        setConfigs(configs.map(c => c.id === id ? res.data! : c));
        setEditingId(null);
      }
    } catch (e: any) {
      Notify.failure(e.message || "Lỗi cập nhật cấu hình");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa cấu hình này? Hệ thống có thể gặp lỗi nếu thiếu cấu hình quan trọng.")) return;
    try {
      const res = await systemConfigService.deleteConfig(id);
      if (res.success) {
        Notify.success("Xóa cấu hình thành công!");
        setConfigs(configs.filter(c => c.id !== id));
      }
    } catch (e: any) {
      Notify.failure(e.message || "Lỗi xóa cấu hình");
    }
  };

  const filtered = configs.filter(c => 
    c.configKey.toLowerCase().includes(q.toLowerCase()) || 
    (c.description && c.description.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm kiếm config key, mô tả..."
            className="w-full pl-10 pr-4 h-11 rounded-xl bg-card border border-border focus:border-primary outline-none text-sm transition-colors"
          />
        </div>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all shrink-0"
        >
          <Plus size={16} /> Thêm Cấu hình mới
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
            <form onSubmit={handleCreate} className="surface-card p-6 border border-primary/20 bg-primary/5">
              <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2 text-foreground">
                <Settings className="text-primary" size={18} /> Nhập thông số cấu hình (System Config)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Config Key</label>
                  <input required value={formData.configKey} onChange={e => setFormData({ ...formData, configKey: e.target.value.toUpperCase().replace(/\s/g, '_') })} className="w-full px-3.5 h-10 rounded-xl bg-card border border-border focus:border-primary outline-none text-sm font-mono uppercase" placeholder="VD: MAX_UPLOAD_SIZE" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Config Value</label>
                  <input required value={formData.configValue} onChange={e => setFormData({ ...formData, configValue: e.target.value })} className="w-full px-3.5 h-10 rounded-xl bg-card border border-border focus:border-primary outline-none text-sm font-mono" placeholder="VD: 50" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mô tả chi tiết</label>
                  <input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-3.5 h-10 rounded-xl bg-card border border-border focus:border-primary outline-none text-sm font-medium" placeholder="VD: Giới hạn dung lượng file tối đa khi upload..." />
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-3">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-5 h-10 rounded-xl bg-muted text-muted-foreground font-semibold text-sm hover:bg-muted/80">Hủy</button>
                <button type="submit" disabled={isSubmitting} className="px-5 h-10 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2">
                  {isSubmitting && <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Lưu cấu hình
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="surface-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground border-b border-border/50">
            <tr>
              <th className="px-5 py-3.5">Config Key</th>
              <th className="px-5 py-3.5">Giá trị (Value)</th>
              <th className="px-5 py-3.5 hidden md:table-cell">Mô tả</th>
              <th className="px-5 py-3.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {isLoading ? (
              <tr><td colSpan={4} className="py-12 text-center text-muted-foreground"><div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />Đang tải...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="py-12 text-center text-muted-foreground">Không tìm thấy cấu hình hệ thống nào.</td></tr>
            ) : (
              filtered.map((c, i) => (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="hover:bg-muted/10 transition-colors"
                >
                  <td className="px-5 py-4">
                    {editingId === c.id ? (
                      <input value={editData.configKey} onChange={e => setEditData({...editData, configKey: e.target.value.toUpperCase().replace(/\s/g, '_')})} className="w-full px-2 py-1 rounded bg-card border border-border text-xs font-mono" />
                    ) : (
                      <div className="font-mono font-bold text-primary text-xs">{c.configKey}</div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {editingId === c.id ? (
                      <input value={editData.configValue} onChange={e => setEditData({...editData, configValue: e.target.value})} className="w-full px-2 py-1 rounded bg-card border border-border text-xs font-mono" />
                    ) : (
                      <div className="font-mono font-bold text-foreground bg-muted/50 px-2 py-1 rounded inline-block text-xs">{c.configValue}</div>
                    )}
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    {editingId === c.id ? (
                      <input value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} className="w-full px-2 py-1 rounded bg-card border border-border text-xs" />
                    ) : (
                      <div className="text-xs text-muted-foreground font-medium">{c.description || <span className="italic opacity-50">Không có mô tả</span>}</div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {editingId === c.id ? (
                      <div className="inline-flex gap-1.5">
                        <button onClick={() => setEditingId(null)} className="size-8 rounded-lg bg-muted grid place-items-center hover:bg-muted/80 text-muted-foreground"><X size={14} /></button>
                        <button onClick={() => handleUpdate(c.id)} className="size-8 rounded-lg bg-success/10 text-success grid place-items-center hover:bg-success/20"><Save size={14} /></button>
                      </div>
                    ) : (
                      <div className="inline-flex gap-1.5">
                        <button onClick={() => { setEditingId(c.id); setEditData({ configKey: c.configKey, configValue: c.configValue, description: c.description || "" }); }} className="size-8 rounded-lg border border-border grid place-items-center hover:text-primary transition-colors"><Edit2 size={13} /></button>
                        <button onClick={() => handleDelete(c.id)} className="size-8 rounded-lg bg-destructive/10 text-destructive grid place-items-center hover:bg-destructive/20 transition-colors"><Trash2 size={13} /></button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
