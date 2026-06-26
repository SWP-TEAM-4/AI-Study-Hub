import { useState, useMemo } from "react";
import { Search, UserCheck, UserMinus, Award } from "lucide-react";
import { useTranslation } from "react-i18next";
import { userService, UserDTO } from "../../services/userService";
import { MOCK_USERS } from "../../lib/admin-mock-data";

export default function AdminUsers() {
  const { t } = useTranslation();
  
  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [usersList, setUsersList] = useState<UserDTO[]>(MOCK_USERS);

  const filteredUsers = useMemo(() => {
    return usersList.filter(u =>
      u.fullName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      u.email.toLowerCase().includes(searchKeyword.toLowerCase())
    );
  }, [usersList, searchKeyword]);

  const handleToggleActive = async (userId: number, currentStatus: boolean) => {
    try {
      const res = await userService.adminToggleUserActive(userId, !currentStatus);
      if (res.success && res.data) setUsersList(prev => prev.map(u => u.id === userId ? res.data! : u));
    } catch (err: any) { alert(err.message || "Lỗi khóa tài khoản"); }
  };

  const handleRoleChange = async (userId: number, newRole: "STUDENT" | "REVIEWER" | "ADMIN") => {
    try {
      const res = await userService.adminUpdateUserRole(userId, newRole);
      if (res.success && res.data) setUsersList(prev => prev.map(u => u.id === userId ? res.data! : u));
    } catch (err: any) { alert(err.message || "Lỗi cập nhật quyền hạn"); }
  };

  const handleRewardBadge = async (userId: number) => {
    try {
      const res = await userService.adminAssignBadgeToUser(userId, 2);
      if (res.success) alert("Đã gán huy hiệu danh giá thành công! 🎖️");
    } catch (err: any) { alert(`Không thể gán: ${err.message || "Lỗi không xác định"}`); }
  };

  return (
    <div className="space-y-4">
      <div className="surface-card p-4 flex gap-3 bg-card/60 backdrop-blur-md">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={15} />
          <input 
            type="text" 
            value={searchKeyword} 
            onChange={(e) => { setSearchKeyword(e.target.value); setCurrentPage(0); }} 
            placeholder={t("admin.users.search")} 
            className="w-full pl-10 pr-4 h-10 rounded-xl bg-muted/50 border border-transparent focus:bg-card focus:border-primary/50 outline-none text-sm font-medium text-foreground transition-all" 
          />
        </div>
      </div>
      <div className="surface-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground border-b border-border/50">
            <tr>
              <th className="text-left px-5 py-3.5">{t("admin.users.member")}</th>
              <th className="text-left px-5 py-3.5">{t("admin.users.role")}</th>
              <th className="text-left px-5 py-3.5">{t("admin.users.status")}</th>
              <th className="px-5 py-3.5 text-right">{t("admin.users.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filteredUsers.map((user: any) => (
              <tr key={user.id} className="hover:bg-muted/20">
                <td className="px-5 py-3 flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-ink text-white font-bold text-xs grid place-items-center">{user.fullName.slice(0, 2).toUpperCase()}</div>
                  <div className="text-left">
                    <div className="font-semibold text-foreground">{user.fullName}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">{user.email}</div>
                  </div>
                </td>
                <td className="px-5 py-3 text-left">
                  <select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value as any)} className="bg-muted text-foreground text-xs font-bold rounded-lg px-2 py-1">
                    <option value="STUDENT">STUDENT</option>
                    <option value="REVIEWER">REVIEWER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </td>
                <td className="px-5 py-3 text-left">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${user.isActive ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                    {user.isActive ? t("admin.users.active") : t("admin.users.locked")}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="inline-flex gap-1.5">
                    <button onClick={() => handleRewardBadge(user.id)} className="size-8 rounded-lg border border-border grid place-items-center hover:text-primary transition-colors cursor-pointer"><Award size={13} /></button>
                    <button onClick={() => handleToggleActive(user.id, user.isActive)} className={`size-8 rounded-lg grid place-items-center ${user.isActive ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"} cursor-pointer`}>
                      {user.isActive ? <UserMinus size={13} /> : <UserCheck size={13} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
