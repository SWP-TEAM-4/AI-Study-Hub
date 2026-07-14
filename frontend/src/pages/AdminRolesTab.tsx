import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Trash2, Plus, Users, UserCheck } from "lucide-react";
import { communityRoleService, CommunityRoleDTO } from "../services/communityRoleService";
import { userService, UserDTO } from "../services/userService";
import { useSubjects } from "../hooks/useSubjects";
import { Notify } from "notiflix";

const roleOptions = [
  {
    value: "MARKETPLACE_REVIEWER",
    label: "Marketplace Reviewer",
    description: "Duyệt/từ chối tài liệu, quiz, flashcard deck được gửi lên marketplace theo phạm vi môn được cấp.",
  },
  {
    value: "CONTENT_MODERATOR",
    label: "Community Moderator",
    description: "Xử lý report và kiểm duyệt nội dung cộng đồng trong phạm vi môn được cấp.",
  },
  {
    value: "SUBJECT_MODERATOR",
    label: "Subject Moderator",
    description: "Quyền điều phối/kiểm duyệt rộng hơn cho một môn; backend hiện dùng quyền này tương đương moderator khi xử lý report.",
  },
];

const roleLabelMap = Object.fromEntries(roleOptions.map(role => [role.value, role.label]));

function toLocalDateTime(date: string) {
  return `${date}T00:00:00`;
}

export default function AdminRolesTab() {
  const [roles, setRoles] = useState<CommunityRoleDTO[]>([]);
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { subjects, subjectMap, isLoading: subjectsLoading } = useSubjects();

  // Form states
  const [userId, setUserId] = useState("");
  const [roleType, setRoleType] = useState("MARKETPLACE_REVIEWER");
  const [scopeType, setScopeType] = useState("SUBJECT");
  const [scopeId, setScopeId] = useState("");
  const [startAt, setStartAt] = useState(new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
  const [endAt, setEndAt] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [rolesRes, usersRes] = await Promise.all([
        communityRoleService.getAdminCommunityRoles(0, 100),
        userService.adminGetUsers({ page: 0, size: 200, sort: "newest" }),
      ]);
      if (rolesRes.success) setRoles(rolesRes.data.items);
      if (usersRes.success) setUsers(usersRes.data.items);
    } catch (e) {
      console.error(e);
      Notify.failure("Không thể tải dữ liệu phân quyền");
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
    if (scopeType === "SUBJECT" && !scopeId) {
      Notify.failure("Vui lòng chọn môn học");
      return;
    }
    
    try {
      const res = await communityRoleService.grantAdminCommunityRole({
        userId: parseInt(userId),
        roleType,
        scopeType,
        scopeId: scopeId ? parseInt(scopeId) : null,
        startAt: toLocalDateTime(startAt),
        endAt: endAt ? toLocalDateTime(endAt) : null,
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
          <p className="text-sm text-muted-foreground mt-1">Cấp phát và thu hồi quyền reviewer/moderator theo user và môn học.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer"
        >
          {showForm ? "Đóng form" : <><Plus size={18} /> Cấp quyền mới</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="surface-card p-5 border border-primary/15">
          <div className="flex items-start gap-3">
            <ShieldAlert className="text-primary mt-1" size={20} />
            <div>
              <h3 className="font-bold">Marketplace Reviewer</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Được thấy queue reviewer và duyệt/từ chối nội dung gửi lên marketplace trong môn được cấp.
                Theo rule hiện tại, một reviewer phụ trách đúng môn có thể duyệt bài của user; nếu tự đăng thì phải reviewer khác hoặc admin duyệt.
              </p>
            </div>
          </div>
        </div>
        <div className="surface-card p-5 border border-primary/15">
          <div className="flex items-start gap-3">
            <Users className="text-primary mt-1" size={20} />
            <div>
              <h3 className="font-bold">Community Moderator</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Trong backend role này tương ứng <span className="font-mono text-xs">CONTENT_MODERATOR</span> hoặc <span className="font-mono text-xs">SUBJECT_MODERATOR</span>.
                Có quyền xử lý report/kiểm duyệt nội dung cộng đồng trong phạm vi môn hoặc toàn hệ thống nếu cấp Global.
              </p>
            </div>
          </div>
        </div>
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
                <label className="block text-xs font-bold mb-1 text-muted-foreground uppercase">Người dùng</label>
                <select
                  value={userId}
                  onChange={e => setUserId(e.target.value)}
                  className="w-full bg-muted border border-border px-3 py-2 rounded-lg text-sm"
                >
                  <option value="">Chọn user</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      #{user.id} - {user.fullName || user.email} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-muted-foreground uppercase">Loại vai trò</label>
                <select
                  value={roleType}
                  onChange={e => setRoleType(e.target.value)}
                  className="w-full bg-muted border border-border px-3 py-2 rounded-lg text-sm"
                >
                  {roleOptions.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {roleOptions.find(role => role.value === roleType)?.description}
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-muted-foreground uppercase">Phạm vi</label>
                <select
                  value={scopeType}
                  onChange={e => {
                    setScopeType(e.target.value);
                    if (e.target.value === "GLOBAL") setScopeId("");
                  }}
                  className="w-full bg-muted border border-border px-3 py-2 rounded-lg text-sm"
                >
                  <option value="SUBJECT">Môn học (Subject)</option>
                  <option value="GLOBAL">Toàn cầu (Global)</option>
                </select>
              </div>
              {scopeType === "SUBJECT" && (
                <div>
                  <label className="block text-xs font-bold mb-1 text-muted-foreground uppercase">Môn học</label>
                  <select
                    value={scopeId}
                    onChange={e => setScopeId(e.target.value)}
                    className="w-full bg-muted border border-border px-3 py-2 rounded-lg text-sm"
                    disabled={subjectsLoading}
                  >
                    <option value="">{subjectsLoading ? "Đang tải môn..." : "Chọn môn học"}</option>
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.id}>
                        {subject.code} - {subject.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold mb-1 text-muted-foreground uppercase">Ngày bắt đầu</label>
                <input type="date" value={startAt} onChange={e => setStartAt(e.target.value)} className="w-full bg-muted border border-border px-3 py-2 rounded-lg text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-muted-foreground uppercase">Ngày kết thúc (Bỏ trống nếu vĩnh viễn)</label>
                <input type="date" value={endAt} onChange={e => setEndAt(e.target.value)} className="w-full bg-muted border border-border px-3 py-2 rounded-lg text-sm outline-none" />
              </div>
            </div>
            <button type="submit" className="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-lg hover:brightness-110 cursor-pointer">Lưu quyền</button>
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
              <tr><td colSpan={5} className="py-12 text-center">Đang tải cấu trúc vai trò thành viên...</td></tr>
            ) : roles.length === 0 ? (
              <tr><td colSpan={5} className="py-12 text-center text-muted-foreground">Chưu có vai trò nào được cấp phát trên hệ thống.</td></tr>
            ) : (
              roles.map(r => (
                <tr key={r.id} className="hover:bg-muted/20">
                  <td className="px-6 py-4">
                    <div className="font-bold text-lg">#{r.userId}</div>
                    {users.find(user => user.id === r.userId) && (
                      <div className="text-xs text-muted-foreground">
                        {users.find(user => user.id === r.userId)?.fullName || users.find(user => user.id === r.userId)?.email}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-primary">{roleLabelMap[r.roleType] || r.roleType}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-1">
                      Scope: {r.scopeType} {r.scopeId ? `#${r.scopeId}` : ""}
                    </div>
                    {r.scopeType === "SUBJECT" && r.scopeId && subjectMap[r.scopeId] && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {subjectMap[r.scopeId].code} - {subjectMap[r.scopeId].name}
                      </div>
                    )}
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
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
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