import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Award,
  ShieldCheck, 
  XCircle, 
  Clock, 
  Search, 
  Cpu, 
  Terminal, 
  Radio, 
  Layers, 
  FileText, 
  Gamepad2, 
  RefreshCw,
  User,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Download,
  ExternalLink
} from "lucide-react";
import { marketplaceService, type AdminContentDTO } from "../services/marketplaceService";
import { documentService } from "../services/documentService";
import { Notify } from "notiflix";
import { useTranslation } from "react-i18next";
import { safeLocalStorage } from "../utils/safeStorage";

export default function ReviewerPage() {
  const { t } = useTranslation();
  const [keyword, setKeyword] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "DOCUMENT" | "QUIZ" | "FLASHCARD_DECK">("ALL");
  const [queue, setQueue] = useState<AdminContentDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Detail state
  const [selectedItem, setSelectedItem] = useState<AdminContentDTO | null>(null);
  const [detailedInfo, setDetailedInfo] = useState<any>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  
  // Vote form state
  const [reviewNote, setReviewNote] = useState("");
  const [isVoting, setIsVoting] = useState(false);
  const [subjectsMap, setSubjectsMap] = useState<Record<number, string>>({});
  const [lastVoteReward, setLastVoteReward] = useState<{
    pointsDelta?: number | null;
    title?: string | null;
    message?: string | null;
    targetTitle: string;
    subjectLabel: string;
  } | null>(null);

  const resolveSubjectLabel = (item?: any) => {
    if (!item) return "Không rõ môn";
    if (item.subject?.code) return item.subject.code;
    if (item.subjectCode) return item.subjectCode;
    if (item.subjectId) return subjectsMap[item.subjectId] || `Môn #${item.subjectId}`;
    return "Không rõ môn";
  };

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const token = safeLocalStorage.getItem("auth_token")?.replace(/['"]+/g, '');
        const headers: any = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch("/api/subjects?keyword=", { headers });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const map: Record<number, string> = {};
          json.data.forEach((s: any) => {
            map[s.id] = s.code;
          });
          setSubjectsMap(map);
        }
      } catch (e) {
        console.warn("Không thể tải danh mục môn học:", e);
      }
    };
    fetchSubjects();
  }, []);

  useEffect(() => {
    loadQueue();
  }, [keyword, filterType]);

  const loadQueue = async () => {
    setIsLoading(true);
    try {
      const res = await marketplaceService.getReviewerPending(0, 100, keyword);
      if (res.success) {
        let items = res.data.items || [];
        if (filterType !== "ALL") {
          items = items.filter(item => item.targetType === filterType);
        }
        setQueue(items);
      }
    } catch (err: any) {
      console.error("Lỗi tải hàng chờ kiểm duyệt:", err);
      Notify.failure(err.message || "Không thể tải hàng chờ tín hiệu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSignal = async (item: AdminContentDTO) => {
    setSelectedItem(item);
    setDetailedInfo(null);
    setReviewNote("");
    setIsDetailLoading(true);
    try {
      // 1. Fetch reviewer item basic details
      const res = await marketplaceService.getReviewerContentDetails(item.targetType, item.targetId);
      let mergedData: any = res.success ? res.data : item;

      // 2. Proactively try to fetch the actual fileUrl from document details for preview if type is DOCUMENT
      if (item.targetType === "DOCUMENT") {
        try {
          const docRes = await documentService.getCommunityDocumentDetails(item.targetId);
          if (docRes.success) {
            mergedData = { ...mergedData, fileUrl: docRes.data.fileUrl, fileType: docRes.data.fileType };
          }
        } catch (e) {
          console.warn("Không lấy được URL file thực tế:", e);
        }
      }

      setDetailedInfo(mergedData);
    } catch (err) {
      console.error("Lỗi lấy chi tiết tín hiệu:", err);
      setDetailedInfo(item);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleVote = async (voteResult: "APPROVED" | "REJECTED") => {
    if (!selectedItem) return;
    
    setIsVoting(true);
    try {
      const res = await marketplaceService.voteReviewerContent(
        selectedItem.targetType,
        selectedItem.targetId,
        voteResult,
        reviewNote || (voteResult === "APPROVED" ? "Phê chuẩn nội dung thành công" : "Nội dung bị từ chối do không đạt yêu cầu")
      );
      
      if (res.success) {
        const rewardDelta = res.data.reviewerRewardPointsDelta;
        if (rewardDelta !== undefined && rewardDelta !== null) {
          setLastVoteReward({
            pointsDelta: rewardDelta,
            title: res.data.reviewerRewardTitle,
            message: res.data.reviewerRewardMessage,
            targetTitle: detailedInfo?.title || selectedItem.title,
            subjectLabel: resolveSubjectLabel(detailedInfo || selectedItem),
          });
        }
        if (res.data.decisionReached) {
          Notify.success(res.data.submissionStatus === "APPROVED"
            ? `Nội dung đã đủ điều kiện và được xuất bản.${rewardDelta ? ` Bạn nhận ${rewardDelta > 0 ? "+" : ""}${rewardDelta} điểm.` : ""}`
            : `Nội dung đã đủ điều kiện và bị từ chối.${rewardDelta ? ` Bạn nhận ${rewardDelta > 0 ? "+" : ""}${rewardDelta} điểm.` : ""}`);
        } else {
          Notify.info(`Đã ghi nhận vote (${res.data.totalVotes}/${res.data.requiredVotes}).${rewardDelta ? ` Bạn nhận ${rewardDelta > 0 ? "+" : ""}${rewardDelta} điểm.` : ""}`);
        }
        // Remove item from queue
        setQueue(prev => prev.filter(c => !(c.targetType === selectedItem.targetType && c.targetId === selectedItem.targetId)));
        setSelectedItem(null);
        setDetailedInfo(null);
        setReviewNote("");
      }
    } catch (err: any) {
      console.error("Lỗi biểu quyết kiểm duyệt:", err);
      Notify.failure(err.message || "Không thể gửi lệnh biểu quyết");
    } finally {
      setIsVoting(false);
    }
  };

  const handleOpenFile = () => {
    if (!detailedInfo?.fileUrl) {
      Notify.warning("Không tìm thấy liên kết file. BE3 cần trả về trường fileUrl trong DTO!");
      return;
    }

    if (detailedInfo.fileType?.toLowerCase() === "pdf") {
      // PDF can be opened directly in browser new tab natively
      window.open(detailedInfo.fileUrl, "_blank");
    } else {
      // Other formats automatically download
      const a = document.createElement("a");
      a.href = detailedInfo.fileUrl;
      a.download = detailedInfo.title || "document";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="space-y-6 relative select-none app-shell-font">
      <style>{`
        .radar-sweep-line {
          animation: sweep 4s linear infinite;
        }
        @keyframes sweep {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .terminal-cursor::after {
          content: '█';
          animation: blink 1s step-start infinite;
        }
        @keyframes blink {
          50% { opacity: 0; }
        }
      `}</style>

      {/* ── HEADER & RADAR CONSOLE STATUS ── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold">
            <Radio className="animate-pulse" size={18} />
            <span className="text-xs font-mono tracking-widest uppercase">Trạm Kiểm Duyệt Vũ Trụ</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1">Hàng Chờ Kiểm Duyệt</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Dò quét, giải mã và phê duyệt các tài nguyên học tập trước khi đưa lên Chợ vũ trụ.</p>
        </div>

        {/* Console Health Readouts */}
        <div className="flex items-center gap-4 text-xs font-mono bg-muted/40 px-4 py-2 rounded-xl border border-border/50 backdrop-blur-md">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-muted-foreground">SCANNER:</span>
            <span className="text-foreground font-bold">ONLINE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Cpu size={14} className="text-primary" />
            <span className="text-muted-foreground">AUTO-DECRYPT:</span>
            <span className="text-emerald-500 font-bold">ACTIVE</span>
          </div>
        </div>
      </div>

      {lastVoteReward && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-foreground">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-bold text-emerald-600">
                <Award size={16} /> {lastVoteReward.title || "Đã ghi nhận điểm reviewer"}
              </div>
              <div className="mt-1 truncate text-xs font-semibold text-muted-foreground">
                {lastVoteReward.targetTitle} · {lastVoteReward.subjectLabel}
              </div>
            </div>
            <div className="shrink-0 rounded-lg bg-background/70 px-3 py-1 text-right font-mono text-base font-black text-emerald-600">
              {lastVoteReward.pointsDelta && lastVoteReward.pointsDelta > 0 ? "+" : ""}
              {lastVoteReward.pointsDelta ?? 0} điểm
            </div>
          </div>
          {lastVoteReward.message && (
            <div className="mt-2 line-clamp-2 text-xs text-muted-foreground">{lastVoteReward.message}</div>
          )}
        </div>
      )}

      {/* ── CHÍNH: CONSOLE MÀN HÌNH ĐÔI ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================= LEFT: SIGNAL SCANNER (Lớp bên trái) ================= */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* Controls & Filter Panel */}
          <div className="surface-card p-4 space-y-4 border border-border/50 backdrop-blur-md relative overflow-hidden">
            
            {/* Filter keys */}
            <div className="flex items-center justify-between gap-2 relative z-10">
              <span className="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
                <Layers size={12} className="text-primary" /> BỘ LỌC TẦN SỐ
              </span>
              <button 
                onClick={loadQueue}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Quét lại hệ thống"
              >
                <RefreshCw size={14} className={isLoading ? "animate-spin text-primary" : ""} />
              </button>
            </div>
            
            <div className="grid grid-cols-4 gap-1 p-1 bg-muted/40 rounded-lg relative z-10 border border-border/30">
              {(["ALL", "DOCUMENT", "QUIZ", "FLASHCARD_DECK"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`py-1.5 text-[10px] font-bold rounded font-mono transition-all uppercase cursor-pointer ${
                    filterType === type 
                      ? "bg-card text-foreground shadow-sm border border-border/50" 
                      : "text-muted-foreground hover:text-foreground border border-transparent"
                  }`}
                >
                  {type === "ALL" ? "TẤT CẢ" : type === "FLASHCARD_DECK" ? "THẺ" : type}
                </button>
              ))}
            </div>

            {/* Input decode text */}
            <div className="relative z-10">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Nhập tên tín hiệu để lọc..."
                className="w-full pl-9 pr-3 h-10 rounded-xl bg-muted/30 border border-border/50 text-xs font-mono outline-none focus:bg-card focus:border-primary transition-all placeholder:text-muted-foreground/60 text-foreground"
              />
            </div>
          </div>

          {/* Active Signal Feed list */}
          <div className="surface-card border border-border/50 backdrop-blur-md relative h-[450px] flex flex-col justify-between overflow-hidden">
            
            {/* Hologram sweep line */}
            <div className="absolute inset-x-0 h-0.5 bg-primary/10 radar-sweep-line pointer-events-none z-10" />

            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2 relative z-10">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                  <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-mono text-muted-foreground">Đang quét băng tần tín hiệu...</span>
                </div>
              ) : queue.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground font-mono text-xs gap-2">
                  <Clock className="text-muted-foreground/50" size={24} />
                  <span>Không tìm thấy tín hiệu chưa duyệt</span>
                </div>
              ) : (
                queue.map((item) => {
                  const isSelected = selectedItem?.targetId === item.targetId && selectedItem?.targetType === item.targetType;
                  
                  // Badge type definitions
                  const typeLabel = item.targetType === "DOCUMENT" ? "DOC" : item.targetType === "QUIZ" ? "QUIZ" : "DECK";
                  const typeColor = 
                    item.targetType === "DOCUMENT" ? "border-blue-500/20 text-blue-500 bg-blue-500/5" :
                    item.targetType === "QUIZ" ? "border-emerald-500/20 text-emerald-500 bg-emerald-500/5" :
                    "border-purple-500/20 text-purple-500 bg-purple-500/5";

                  return (
                    <motion.div
                      key={`${item.targetType}_${item.targetId}`}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => handleSelectSignal(item)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 relative ${
                        isSelected 
                          ? "bg-primary/5 border-primary/40 shadow-sm" 
                          : "bg-muted/10 border-border/40 hover:border-primary/20 hover:bg-primary/2"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Status blinking dot */}
                        <div className="relative flex h-2 w-2 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </div>

                        {/* Title & Coordinates */}
                        <div className="min-w-0">
                          <div className="font-mono text-[10px] text-muted-foreground flex items-center gap-2">
                            <span className="text-primary font-bold">[SIG-{typeLabel}-{item.targetId}]</span>
                            {item.subjectId && <span>{resolveSubjectLabel(item)}</span>}
                            {item.submittedAt && (
                              <span>
                                {new Date(item.submittedAt).toLocaleTimeString()}
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-semibold text-foreground truncate mt-1">{item.title}</div>
                        </div>
                      </div>

                      {/* Right Indicator badge */}
                      <span className={`px-2 py-0.5 text-[9px] font-mono border rounded uppercase font-bold shrink-0 ${typeColor}`}>
                        {typeLabel}
                      </span>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Total readout summary */}
            <div className="border-t border-border/40 bg-muted/20 p-2.5 px-4 font-mono text-[10px] text-muted-foreground flex justify-between items-center relative z-10">
              <span>HÀNG CHỜ HIỆN TẠI: {queue.length} TÍN HIỆU</span>
              <span className="text-emerald-500 font-bold animate-pulse">HỆ THỐNG SẴN SÀNG</span>
            </div>
          </div>
        </div>

        {/* ================= RIGHT: SIGNAL ANALYZER (Lớp bên phải) ================= */}
        <div className="lg:col-span-7">
          
          {/* Main analyzer console container */}
          <div className="surface-card border border-border/50 backdrop-blur-md relative h-[578px] flex flex-col overflow-hidden">

            <AnimatePresence mode="wait">
              {!selectedItem ? (
                // ── Empty default terminal screen ──
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground font-mono"
                >
                  <Terminal className="text-primary/30 mb-3 animate-pulse" size={32} />
                  <p className="text-xs text-primary font-bold uppercase tracking-widest">BỘ PHÂN TÍCH TÍN HIỆU</p>
                  <p className="text-[11px] text-muted-foreground mt-2 max-w-sm">Chọn một luồng tín hiệu từ hàng chờ bên trái để khởi chạy bộ phân tích thông số và thực hiện biểu quyết kiểm duyệt.</p>
                </motion.div>
              ) : isDetailLoading ? (
                // ── Loading telemetry state ──
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center p-8 font-mono text-xs text-primary gap-3"
                >
                  <RefreshCw className="animate-spin text-primary" size={24} />
                  <span>ĐANG GIẢI MÃ VI ĐĂNG KÝ...</span>
                </motion.div>
              ) : (
                // ── Active Analyzer Content Screen ──
                <motion.div
                  key="telemetry"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex-1 flex flex-col overflow-hidden p-6 relative z-10"
                >
                  {/* Hologram Header */}
                  <div className="border-b border-border/50 pb-4 mb-4 flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                          {selectedItem.targetType}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">ID: #{selectedItem.targetId}</span>
                      </div>
                      <h3 className="font-bold text-base text-foreground mt-2 leading-snug">{detailedInfo?.title || selectedItem.title}</h3>
                    </div>
                  </div>

                  {/* Telemetry metrics grids */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                    {/* Metric 1 */}
                    <div className="bg-muted/30 border border-border/40 p-3 rounded-xl font-mono">
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <User size={12} className="text-primary" /> NGƯỜI TẠO
                      </div>
                      <div className="text-xs font-semibold text-foreground mt-1 truncate">
                        {detailedInfo?.creatorName || "Đang giải mã..."}
                      </div>
                    </div>
                    {/* Metric 2 */}
                    <div className="bg-muted/30 border border-border/40 p-3 rounded-xl font-mono">
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <BookOpen size={12} className="text-primary" /> MÔN HỌC
                      </div>
                      <div className="text-xs font-semibold text-foreground mt-1">
                        {resolveSubjectLabel(detailedInfo || selectedItem)}
                      </div>
                    </div>
                    {/* Metric 3 */}
                    <div className="bg-muted/30 border border-border/40 p-3 rounded-xl font-mono col-span-2 md:col-span-1">
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <TrendingUp size={12} className="text-primary" /> TỶ LỆ ĐỒNG THUẬN
                      </div>
                      <div className="text-xs font-bold text-emerald-500 mt-1 flex items-center gap-1">
                        {detailedInfo?.acceptPercentage !== undefined ? `${detailedInfo.acceptPercentage}% đồng ý` : "N/A"}
                      </div>
                    </div>
                    {/* Metric 4 */}
                    <div className="bg-muted/30 border border-border/40 p-3 rounded-xl font-mono">
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Download size={12} className="text-primary" /> TẢI XUỐNG
                      </div>
                      <div className="text-xs font-semibold text-foreground mt-1">
                        {detailedInfo?.downloadCount !== undefined ? `${detailedInfo.downloadCount} lượt` : "0"}
                      </div>
                    </div>
                    {/* Metric 5 */}
                    <div className="bg-muted/30 border border-border/40 p-3 rounded-xl font-mono">
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock size={12} className="text-primary" /> NGÀY GỬI
                      </div>
                      <div className="text-xs font-semibold text-foreground mt-1 truncate">
                        {detailedInfo?.submittedAt ? new Date(detailedInfo.submittedAt).toLocaleDateString() : "Mới đây"}
                      </div>
                    </div>
                    {/* Metric 6 */}
                    <div className="bg-muted/30 border border-border/40 p-3 rounded-xl font-mono">
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <ShieldCheck size={12} className="text-primary" /> TRẠNG THÁI
                      </div>
                      <div className="text-xs font-bold text-amber-500 mt-1 uppercase">
                        {detailedInfo?.marketStatus || "PENDING"}
                      </div>
                    </div>
                  </div>

                  <div className="mb-5 rounded-xl border border-primary/15 bg-primary/5 p-3 font-mono text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-primary font-bold">
                        <ShieldCheck size={14} /> PHẠM VI REVIEWER
                      </div>
                      <span className="rounded-full border border-primary/20 bg-background/70 px-2 py-0.5 text-[10px] font-bold text-primary">
                        {resolveSubjectLabel(detailedInfo || selectedItem)}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                      <span>Chính sách: {selectedItem.policyMode === "SINGLE_REVIEWER" ? "Một reviewer" : "Biểu quyết nhiều reviewer"}</span>
                      <span>Yêu cầu: {selectedItem.requiredVotes ?? detailedInfo?.requiredVotes ?? 1} vote</span>
                      {selectedItem.adminRequired && <span>Cần admin xử lý khi thiếu reviewer cùng môn</span>}
                    </div>
                  </div>

                  {/* PDF direct view / preview button */}
                  {selectedItem.targetType === "DOCUMENT" && (
                    <div className="mb-5 bg-primary/5 border border-primary/20 rounded-xl p-3.5 flex items-center justify-between gap-4">
                      <div className="min-w-0 flex items-center gap-3">
                        <div className="size-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0">
                          <FileText size={20} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-foreground">File tài liệu đính kèm</div>
                          <div className="text-[11px] text-muted-foreground truncate max-w-xs">{detailedInfo?.fileUrl || "Đang kết nối liên kết..."}</div>
                        </div>
                      </div>
                      <button
                        onClick={handleOpenFile}
                        className="px-3.5 h-9 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <ExternalLink size={14} /> Xem tài liệu
                      </button>
                    </div>
                  )}

                  {/* Command input console (Terminal form) */}
                  <div className="flex-1 flex flex-col min-h-0 bg-[#0c0d12] border border-border/50 rounded-xl p-4 font-mono text-xs relative overflow-hidden focus-within:border-primary/50 transition-colors">
                    <div className="absolute right-3 top-3 flex items-center gap-1 opacity-40">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                      <span className="text-[8px] text-muted-foreground">TERMINAL</span>
                    </div>
                    
                    <div className="text-primary font-bold mb-2 flex items-center gap-1.5">
                      <Terminal size={14} /> Ghi chú phản hồi kiểm duyệt:
                    </div>
                    
                    <textarea
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      placeholder="Nhập nhận xét nội dung kiểm duyệt tại đây để lưu hồ sơ lịch sử..."
                      className="flex-1 bg-transparent border-none outline-none resize-none text-emerald-400 placeholder:text-emerald-800/60 text-xs leading-relaxed overflow-y-auto"
                      disabled={isVoting}
                    />
                    
                    <div className="text-[10px] text-muted-foreground/40 text-right mt-2 font-bold terminal-cursor">
                      C:REVSN // USER_AUTH
                    </div>
                  </div>

                  {/* Actions Console controls */}
                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleVote("REJECTED")}
                      disabled={isVoting}
                      className="h-11 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 active:scale-[0.98] transition-all font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <XCircle size={16} /> 
                      {isVoting ? "ĐANG GỬI..." : "Từ chối (Reject)"}
                    </button>
                    <button
                      onClick={() => handleVote("APPROVED")}
                      disabled={isVoting}
                      className="h-11 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 active:scale-[0.98] transition-all font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <ShieldCheck size={16} />
                      {isVoting ? "ĐANG GỬI..." : "Duyệt tín hiệu (Approve)"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
