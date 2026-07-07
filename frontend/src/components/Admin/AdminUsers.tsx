<<<<<<< HEAD
import { useEffect, useState } from "react";
import { Award, ChevronLeft, ChevronRight, Eye, RefreshCw, Search, UserCheck, UserMinus, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Notify } from "notiflix";
import { BadgeDTO, UserDTO, userService } from "../../services/userService";

type UserRole = UserDTO["role"];

function getErrorMessage(error: unknown, fallback: string) {
  return typeof error === "object" && error !== null && "message" in error
    ? String((error as { message?: unknown }).message ?? fallback)
    : fallback;
}
=======
import { useState, useEffect } from "react";
import { Search, UserCheck, UserMinus, Award } from "lucide-react";
import { useTranslation } from "react-i18next";
import { userService, UserDTO } from "../../services/userService";
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b

export default function AdminUsers() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
<<<<<<< HEAD
  const [role, setRole] = useState<UserRole | "">("");
  const [active, setActive] = useState<"" | "true" | "false">("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [badgeUser, setBadgeUser] = useState<UserDTO | null>(null);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setKeyword(searchInput.trim());
      setCurrentPage(0);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const usersQuery = useQuery({
    queryKey: ["adminUsers", currentPage, keyword, role, active],
    queryFn: async () => {
      const response = await userService.adminGetUsers({
        page: currentPage,
        size: 10,
        keyword: keyword || undefined,
        role: role || undefined,
        isActive: active === "" ? undefined : active === "true",
        sort: "newest",
      });
      return response.data;
    },
  });

  const userDetailQuery = useQuery({
    queryKey: ["adminUserDetail", selectedUserId],
    queryFn: async () => (await userService.adminGetUserById(selectedUserId!)).data,
    enabled: selectedUserId !== null,
  });

  const badgesQuery = useQuery({
    queryKey: ["availableBadges"],
    queryFn: async () => (await userService.getAvailableBadges()).data,
    enabled: badgeUser !== null,
  });

  const refreshUsers = async () => {
    await queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    await queryClient.invalidateQueries({ queryKey: ["adminOverview"] });
=======
  const [usersList, setUsersList] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalElements, setTotalElements] = useState(0);

  // Gọi API lấy danh sách user thực tế từ Backend khi chuyển trang hoặc gõ tìm kiếm
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await userService.adminGetUsers({
          page: currentPage,
          size: 10,
          keyword: searchKeyword
        });
        if (res.success && res.data) {
          setUsersList(res.data.items);
          setTotalElements(res.data.totalElements);
        }
      } catch (err: any) {
        console.error("Lỗi lấy danh sách thành viên từ API:", err);
      } finally {
        setLoading(false);
      }
    };

    // Cơ chế debounce nhẹ nếu cần, hoặc gọi trực tiếp qua dependency array
    fetchUsers();
  }, [currentPage, searchKeyword]);

  const handleToggleActive = async (userId: number, currentStatus: boolean) => {
    try {
      const res = await userService.adminToggleUserActive(userId, !currentStatus);
      if (res.success && res.data) {
        setUsersList(prev => prev.map(u => u.id === userId ? res.data! : u));
      }
    } catch (err: any) { 
      alert(err.message || "Lỗi khóa tài khoản"); 
    }
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
  };

  const handleToggleActive = async (user: UserDTO) => {
    setBusyUserId(user.id);
    try {
<<<<<<< HEAD
      await userService.adminToggleUserActive(user.id, !user.isActive);
      Notify.success(t("admin.users.updateSuccess"));
      await refreshUsers();
    } catch (error) {
      Notify.failure(getErrorMessage(error, t("admin.users.updateError")));
    } finally {
      setBusyUserId(null);
=======
      const res = await userService.adminUpdateUserRole(userId, newRole);
      if (res.success && res.data) {
        setUsersList(prev => prev.map(u => u.id === userId ? res.data! : u));
      }
    } catch (err: any) { 
      alert(err.message || "Lỗi cập nhật quyền hạn"); 
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
    }
  };

  const handleRoleChange = async (user: UserDTO, newRole: UserRole) => {
    if (newRole === user.role) return;
    setBusyUserId(user.id);
    try {
<<<<<<< HEAD
      await userService.adminUpdateUserRole(user.id, newRole);
      Notify.success(t("admin.users.updateSuccess"));
      await refreshUsers();
      if (selectedUserId === user.id) {
        await queryClient.invalidateQueries({ queryKey: ["adminUserDetail", user.id] });
      }
    } catch (error) {
      Notify.failure(getErrorMessage(error, t("admin.users.updateError")));
    } finally {
      setBusyUserId(null);
=======
      const res = await userService.adminAssignBadgeToUser(userId, 2);
      if (res.success) alert("Đã gán huy hiệu danh giá thành công! 🎖️");
    } catch (err: any) { 
      alert(`Không thể gán: ${err.message || "Lỗi không xác định"}`); 
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
    }
  };

  const handleAssignBadge = async (badge: BadgeDTO) => {
    if (!badgeUser) return;
    setBusyUserId(badgeUser.id);
    try {
      await userService.adminAssignBadgeToUser(badgeUser.id, badge.id);
      Notify.success(t("admin.users.badgeSuccess", { badge: badge.name }));
      setBadgeUser(null);
    } catch (error) {
      Notify.failure(getErrorMessage(error, t("admin.users.badgeError")));
    } finally {
      setBusyUserId(null);
    }
  };

  const pageData = usersQuery.data;
  const users = pageData?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="surface-card p-4 grid gap-3 md:grid-cols-[1fr_auto_auto] bg-card/60 backdrop-blur-md">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={15} />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t("admin.users.search")}
            className="w-full pl-10 pr-4 h-10 rounded-xl bg-muted/50 border border-transparent focus:bg-card focus:border-primary/50 outline-none text-sm font-medium text-foreground transition-all"
          />
        </div>
        <select
          value={role}
          onChange={(event) => { setRole(event.target.value as UserRole | ""); setCurrentPage(0); }}
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm text-foreground"
          aria-label={t("admin.users.filterRole")}
        >
          <option value="">{t("admin.users.allRoles")}</option>
          <option value="STUDENT">STUDENT</option>
          <option value="REVIEWER">REVIEWER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        <select
          value={active}
          onChange={(event) => { setActive(event.target.value as "" | "true" | "false"); setCurrentPage(0); }}
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm text-foreground"
          aria-label={t("admin.users.filterStatus")}
        >
          <option value="">{t("admin.users.allStatuses")}</option>
          <option value="true">{t("admin.users.active")}</option>
          <option value="false">{t("admin.users.locked")}</option>
        </select>
      </div>
<<<<<<< HEAD

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground border-b border-border/50">
              <tr>
                <th className="text-left px-5 py-3.5">{t("admin.users.member")}</th>
                <th className="text-left px-5 py-3.5">{t("admin.users.role")}</th>
                <th className="text-left px-5 py-3.5">{t("admin.users.status")}</th>
                <th className="px-5 py-3.5 text-right">{t("admin.users.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {usersQuery.isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index}><td colSpan={4} className="px-5 py-4"><div className="h-5 animate-pulse rounded bg-muted" /></td></tr>
                ))
              ) : usersQuery.isError ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-muted-foreground">
                    <p>{getErrorMessage(usersQuery.error, t("admin.users.loadError"))}</p>
                    <button onClick={() => usersQuery.refetch()} className="mx-auto mt-3 inline-flex items-center gap-2 text-primary">
                      <RefreshCw size={14} /> {t("admin.overview.retry")}
                    </button>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-12 text-center text-muted-foreground">{t("admin.users.noData")}</td></tr>
              ) : users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/20">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="size-9 rounded-xl object-cover" />
                      ) : (
                        <div className="size-9 rounded-xl bg-ink text-white font-bold text-xs grid place-items-center">
                          {(user.fullName || user.email).slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="text-left">
                        <div className="font-semibold text-foreground">{user.fullName}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-left">
                    <select
                      value={user.role}
                      disabled={busyUserId === user.id}
                      onChange={(event) => handleRoleChange(user, event.target.value as UserRole)}
                      className="bg-muted text-foreground text-xs font-bold rounded-lg px-2 py-1 disabled:opacity-50"
=======
      
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
            {loading ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-muted-foreground">
                  <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Đang tải danh sách thành viên hệ thống...
                </td>
              </tr>
            ) : usersList.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-muted-foreground">
                  Không tìm thấy thành viên nào phù hợp.
                </td>
              </tr>
            ) : (
              usersList.map((user: UserDTO) => (
                <tr key={user.id} className="hover:bg-muted/20">
                  <td className="px-5 py-3 flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-ink text-white font-bold text-xs grid place-items-center">
                      {user.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-foreground">{user.fullName}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-left">
                    <select 
                      value={user.role} 
                      onChange={(e) => handleRoleChange(user.id, e.target.value as any)} 
                      className="bg-muted text-foreground text-xs font-bold rounded-lg px-2 py-1 outline-none cursor-pointer"
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
                    >
                      <option value="STUDENT">STUDENT</option>
                      <option value="REVIEWER">REVIEWER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="px-5 py-3 text-left">
<<<<<<< HEAD
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium uppercase ${user.isActive ? "bg-emerald-500/12 text-emerald-500 border border-emerald-500/25" : "bg-rose-500/12 text-rose-500 border border-rose-500/25"}`}>
=======
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium uppercase ${user.isActive ? "bg-emerald-500/12 text-emerald-300 border border-emerald-500/25" : "bg-rose-500/12 text-rose-300 border border-rose-500/25"}`}>
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
                      {user.isActive ? t("admin.users.active") : t("admin.users.locked")}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex gap-1.5">
<<<<<<< HEAD
                      <ActionButton title={t("admin.users.viewDetails")} onClick={() => setSelectedUserId(user.id)}><Eye size={13} /></ActionButton>
                      <ActionButton title={t("admin.users.assignBadge")} onClick={() => setBadgeUser(user)}><Award size={13} /></ActionButton>
                      <button
                        title={user.isActive ? t("admin.users.lockAction") : t("admin.users.unlockAction")}
                        disabled={busyUserId === user.id}
                        onClick={() => handleToggleActive(user)}
                        className={`size-8 rounded-lg grid place-items-center disabled:opacity-50 ${user.isActive ? "bg-rose-500/12 text-rose-500 border border-rose-500/25" : "bg-emerald-500/12 text-emerald-500 border border-emerald-500/25"}`}
                      >
=======
                      <button onClick={() => handleRewardBadge(user.id)} className="size-8 rounded-lg border border-border grid place-items-center hover:text-primary transition-colors cursor-pointer" title="Tặng huy hiệu">
                        <Award size={13} />
                      </button>
                      <button onClick={() => handleToggleActive(user.id, user.isActive)} className={`size-8 rounded-lg grid place-items-center ${user.isActive ? "bg-rose-500/12 text-rose-300 border border-rose-500/25" : "bg-emerald-500/12 text-emerald-300 border border-emerald-500/25"} cursor-pointer`} title={user.isActive ? "Khóa tài khoản" : "Kích hoạt tài khoản"}>
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
                        {user.isActive ? <UserMinus size={13} /> : <UserCheck size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
<<<<<<< HEAD
              ))}
            </tbody>
          </table>
        </div>

        {pageData && pageData.totalPages > 0 && (
          <div className="flex items-center justify-between border-t border-border/60 px-5 py-3 text-sm">
            <span className="text-muted-foreground">
              {t("admin.users.total", { count: pageData.totalElements })}
            </span>
            <div className="flex items-center gap-3">
              <button disabled={currentPage === 0} onClick={() => setCurrentPage((page) => page - 1)} className="rounded-lg border border-border p-1.5 disabled:opacity-30"><ChevronLeft size={15} /></button>
              <span className="text-xs font-medium">{currentPage + 1} / {pageData.totalPages}</span>
              <button disabled={currentPage + 1 >= pageData.totalPages} onClick={() => setCurrentPage((page) => page + 1)} className="rounded-lg border border-border p-1.5 disabled:opacity-30"><ChevronRight size={15} /></button>
            </div>
          </div>
        )}
      </div>

      {selectedUserId !== null && (
        <Modal title={t("admin.users.userDetails")} onClose={() => setSelectedUserId(null)}>
          {userDetailQuery.isLoading ? (
            <div className="h-32 animate-pulse rounded-xl bg-muted" />
          ) : userDetailQuery.isError || !userDetailQuery.data ? (
            <p className="py-8 text-center text-destructive">{getErrorMessage(userDetailQuery.error, t("admin.users.loadError"))}</p>
          ) : (
            <UserDetails user={userDetailQuery.data} />
          )}
        </Modal>
      )}

      {badgeUser && (
        <Modal title={t("admin.users.chooseBadge", { name: badgeUser.fullName })} onClose={() => setBadgeUser(null)}>
          {badgesQuery.isLoading ? (
            <div className="h-32 animate-pulse rounded-xl bg-muted" />
          ) : badgesQuery.isError ? (
            <p className="py-8 text-center text-destructive">{getErrorMessage(badgesQuery.error, t("admin.users.badgeLoadError"))}</p>
          ) : (badgesQuery.data ?? []).length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">{t("admin.users.noBadges")}</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {(badgesQuery.data ?? []).map((badge) => (
                <button
                  key={badge.id}
                  disabled={busyUserId === badgeUser.id}
                  onClick={() => handleAssignBadge(badge)}
                  className="flex items-start gap-3 rounded-xl border border-border p-3 text-left hover:border-primary hover:bg-primary/5 disabled:opacity-50"
                >
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Award size={17} /></div>
                  <div><div className="font-semibold text-foreground">{badge.name}</div><div className="mt-0.5 text-xs text-muted-foreground">{badge.description}</div></div>
                </button>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

function ActionButton({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return <button title={title} onClick={onClick} className="size-8 rounded-lg border border-border grid place-items-center hover:text-primary transition-colors">{children}</button>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-display text-lg font-bold text-foreground">{title}</h2>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-lg hover:bg-muted" aria-label="Close"><X size={17} /></button>
        </div>
        {children}
=======
              ))
            )}
          </tbody>
        </table>
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
      </div>
      
      {/* Gợi ý phân trang nhỏ gọn phía dưới */}
      {totalElements > 10 && (
        <div className="flex justify-end gap-2 text-xs font-medium pr-2">
          <button disabled={currentPage === 0} onClick={() => setCurrentPage(p => p - 1)} className="px-3 h-8 rounded-lg bg-muted border border-border disabled:opacity-45">Trước</button>
          <span className="h-8 flex items-center px-2">Trang {currentPage + 1}</span>
          <button disabled={usersList.length < 10} onClick={() => setCurrentPage(p => p + 1)} className="px-3 h-8 rounded-lg bg-muted border border-border disabled:opacity-45">Sau</button>
        </div>
      )}
    </div>
  );
<<<<<<< HEAD
}

function UserDetails({ user }: { user: UserDTO }) {
  const { t } = useTranslation();
  const rows = [
    [t("admin.users.email"), user.email],
    [t("admin.users.role"), user.role],
    [t("admin.users.status"), user.isActive ? t("admin.users.active") : t("admin.users.locked")],
    [t("admin.users.reputation"), String(user.reputationPoints)],
    [t("admin.users.semester"), user.currentSemesterName || user.currentSemesterCode || "—"],
    [t("admin.users.combo"), user.comboName || user.comboCode || "—"],
    [t("admin.users.createdAt"), user.createdAt ? new Date(user.createdAt).toLocaleString() : "—"],
  ];
  return (
    <div>
      <div className="mb-4 text-xl font-bold text-foreground">{user.fullName}</div>
      <dl className="divide-y divide-border/60 rounded-xl border border-border px-4">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[130px_1fr] gap-3 py-3 text-sm"><dt className="text-muted-foreground">{label}</dt><dd className="break-all font-medium text-foreground">{value}</dd></div>
        ))}
      </dl>
    </div>
  );
}
=======
}
>>>>>>> 2ac62919393ef329af731fc080d5973154a9eb0b
