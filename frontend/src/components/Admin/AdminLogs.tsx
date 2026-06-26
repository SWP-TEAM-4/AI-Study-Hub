import { useState } from "react";
import { Search, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { activityLogService } from "../../services/activityLogService";

export default function AdminLogs() {
  const { t } = useTranslation();
  
  const [logKeyword, setLogKeyword] = useState("");
  const [logSort, setLogSort] = useState("newest");
  const [logPage, setLogPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["adminLogs", logPage, logKeyword, logSort],
    queryFn: async () => {
      const res = await activityLogService.adminGetActivityLogs({ page: logPage, size: 10, keyword: logKeyword, sort: logSort });
      return res.data;
    },
  });

  const logsList = data?.items || [];
  const logTotalPages = data?.totalPages || 1;

  return (
    <div className="space-y-4">
      <div className="surface-card p-4 flex gap-3 bg-card/60 backdrop-blur-md">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={15} />
          <input 
            type="text" 
            value={logKeyword} 
            onChange={(e) => { setLogKeyword(e.target.value); setLogPage(0); }} 
            placeholder={t("admin.logs.search")} 
            className="w-full pl-10 pr-4 h-10 rounded-xl bg-muted/50 border border-transparent focus:bg-card focus:border-primary/50 outline-none text-sm font-medium text-foreground transition-all" 
          />
        </div>
        <select 
          value={logSort} 
          onChange={(e) => { setLogSort(e.target.value); setLogPage(0); }} 
          className="bg-muted text-foreground text-sm font-medium rounded-xl px-4 py-2 border border-border/60 outline-none focus:border-primary/50 cursor-pointer"
        >
          <option value="newest">{t("admin.logs.newest")}</option>
          <option value="oldest">{t("admin.logs.oldest")}</option>
        </select>
      </div>
      
      <div className="surface-card overflow-hidden bg-card">
        <div className="p-5 flex items-center justify-between border-b border-border bg-card">
          <div className="text-left">
            <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
              <Clock size={18} className="text-primary" /> {t("admin.logs.title")}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t("admin.logs.subtitle")}</p>
          </div>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground tracking-wider border-b border-border/50">
            <tr>
              <th className="px-5 py-3.5">{t("admin.logs.action")}</th>
              <th className="px-5 py-3.5">{t("admin.logs.target")}</th>
              <th className="px-5 py-3.5">{t("admin.logs.metadata")}</th>
              <th className="px-5 py-3.5 text-right">{t("admin.logs.time")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={4} className="px-5 py-4">
                    <div className="h-10 bg-muted animate-pulse rounded w-full"></div>
                  </td>
                </tr>
              ))
            ) : logsList.length === 0 ? (
              <tr><td colSpan={4} className="py-12 text-center text-muted-foreground font-medium text-xs">{t("admin.logs.noData")}</td></tr>
            ) : (
              logsList.map((log: any) => (
                <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-foreground text-sm">{log.action}</div>
                    <span className="text-[10px] font-mono text-muted-foreground/60 block mt-1">Actor ID: {log.actorId}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-xs font-bold font-mono text-primary">{log.targetType}</div>
                    <span className="text-[10px] font-mono text-muted-foreground/60 block mt-1">ID: {log.targetId}</span>
                  </td>
                  <td className="px-5 py-4">
                    <pre className="text-[10px] text-muted-foreground bg-muted p-2 rounded-md max-w-xs overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="p-4 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">{t("admin.logs.page")} {logPage + 1} / {logTotalPages}</span>
          <div className="flex gap-2">
            <button disabled={logPage === 0} onClick={() => setLogPage((p: number) => Math.max(0, p - 1))} className="px-4 py-1.5 rounded-lg text-xs font-bold bg-muted text-foreground disabled:opacity-50 transition-all hover:bg-muted/80">{t("admin.logs.prev")}</button>
            <button disabled={logPage >= logTotalPages - 1} onClick={() => setLogPage((p: number) => p + 1)} className="px-4 py-1.5 rounded-lg text-xs font-bold bg-muted text-foreground disabled:opacity-50 transition-all hover:bg-muted/80">{t("admin.logs.next")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
