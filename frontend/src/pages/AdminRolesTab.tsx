import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Trash2, Plus, Users, UserCheck } from "lucide-react";
import { communityRoleService, CommunityRoleDTO } from "../services/communityRoleService";
import { Notify } from "notiflix";

export default function AdminRolesTab() {
  const [roles, setRoles] = useState<CommunityRoleDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [userId, setUserId] = useState("");
  const [roleType, setRoleType] = useState("MARKETPLACE_REVIEWER");
  const [scopeType, setScopeType] = useState("SUBJECT");
  const [scopeId, setScopeId] = useState("");
  const [startAt, setStartAt] = useState(new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
  const [endAt, setEndAt] = useState("");

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const res = await communityRoleService.getAdminCommunityRoles(0, 50);
      if (res.success) setRoles(res.data.items);
    } catch (e) {
      console.error(e);
      Notify.failure("Không thể tải danh sách quyền");
    } finally {
      setLoading(false);
    }
  };

  const handleGrantRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !roleType || !scopeType) {
      Notify.failure("Vui lòng điền đủ thông tin");
      return;
    }
    
    try {
      const res = await communityRoleService.grantAdminCommunityRole({
        userId: parseInt(userId),
        roleType,
        scopeType,
        scopeId: scopeId ? parseInt(scopeId) : null,
        startAt: new Date(startAt).toISOString(),
        endAt: endAt ? new Date(endAt).toISOString() : null,
      });

      if (res.success) {
        Notify.success("Cấp quyền thành công");
        setRoles([res.data, ...roles]);
        setShowForm(false);
      }
    } catch (err: any) {
      Notify.failure(err.message || "Lỗi cấp quyền");
    }
  };

  const handleRevokeRole = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn thu hồi quyền này?")) return;
    try {
      const res = await communityRoleService.revokeAdminCommunityRole(id, "Admin revoked");
      if (res.success) {
        Notify.success("Thu hồi quyền thành công");
        setRoles(roles.map(r => r.id === id ? res.data : r));
      }
    } catch (err: any) {
      Notify.failure(err.message || "Lỗi thu hồi quyền");
    }
  };

  return (
    <div className="space-y-6">
      <div className="surface-card p-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            <UserCheck className="text-primary" /> Quản lý vai trò cộng đồng
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Cấp phát và thu hồi các vai trò quản trị viên học thuật, kiểm duyệt viên, v.v.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all"
        >
          {showForm ? "Đóng form" : <><Plus size={18} /> Cấp quyền mới</>}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="surface-card p-6 border-l-4 border-primary overflow-hidden"
            onSubmit={handleGrantRole}
          >
            <h3 className="font-bold mb-4">Mẫu cấp quyền mới</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-muted-foreground uppercase">User ID</label>
                <input type="number" value={userId} onChange={e => setUserId(e.target.value)} className="w-full bg-muted border border-border px-3 py-2 rounded-lg text-sm" placeholder="VD: 2" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-muted-foreground uppercase">Loại vai trò</label>
                <select value={roleType} onChange={e => setRoleType(e.target.value)} className="w-full bg-muted border border-border px-3 py-2 rounded-lg text-sm">
                  <option value="MARKETPLACE_REVIEWER">Marketplace Reviewer</option>
                  <option value="COMMUNITY_MODERATOR">Community Moderator</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-muted-foreground uppercase">Phạm vi</label>
                <select value={scopeType} onChange={e => setScopeType(e.target.value)} className="w-full bg-muted border border-border px-3 py-2 rounded-lg text-sm">
                  <option value="SUBJECT">Môn học (Subject)</option>
                  <option value="GLOBAL">Toàn cầu (Global)</option>
                </select>
              </div>
              {scopeType === "SUBJECT" && (
                <div>
                  <label className="block text-xs font-bold mb-1 text-muted-foreground uppercase">Scope ID (Mã môn)</label>
                  <input type="number" value={scopeId} onChange={e => setScopeId(e.target.value)} className="w-full bg-muted border border-border px-3 py-2 rounded-lg text-sm" placeholder="VD: 12" />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold mb-1 text-muted-foreground uppercase">Ngày bắt đầu</label>
                <input type="date" value={startAt} onChange={e => setStartAt(e.target.value)} className="w-full bg-muted border border-border px-3 py-2 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-muted-foreground uppercase">Ngày kết thúc (Bỏ trống nếu vĩnh viễn)</label>
                <input type="date" value={endAt} onChange={e => setEndAt(e.target.value)} className="w-full bg-muted border border-border px-3 py-2 rounded-lg text-sm" />
              </div>
            </div>
            <button type="submit" className="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-lg hover:brightness-110">Lưu quyền</button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="surface-card p-0 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-bold">
            <tr>
              <th className="px-6 py-4">User ID</th>
              <th className="px-6 py-4">Vai trò & Phạm vi</th>
              <th className="px-6 py-4">Thời gian</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {loading ? (
              <tr><td colSpan={5} className="py-12 text-center">Đang tải...</td></tr>
            ) : roles.length === 0 ? (
              <tr><td colSpan={5} className="py-12 text-center text-muted-foreground">Chưa có vai trò nào được cấp.</td></tr>
            ) : (
              roles.map(r => (
                <tr key={r.id} className="hover:bg-muted/20">
                  <td className="px-6 py-4 font-bold text-lg">#{r.userId}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-primary">{r.roleType}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-1">Scope: {r.scopeType} {r.scopeId ? `(${r.scopeId})` : ""}</div>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                    <div>Bắt đầu: {new Date(r.startAt).toLocaleDateString("vi-VN")}</div>
                    {r.endAt && <div>Kết thúc: {new Date(r.endAt).toLocaleDateString("vi-VN")}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                      r.status === "ACTIVE" ? "bg-emerald-500/12 text-emerald-300 border border-emerald-500/25" :
                      r.status === "REVOKED" ? "bg-rose-500/12 text-rose-300 border border-rose-500/25" :
                      "bg-amber-500/12 text-amber-300 border border-amber-500/25"
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {r.status === "ACTIVE" && (
                      <button
                        onClick={() => handleRevokeRole(r.id)}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        title="Thu hồi quyền"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
