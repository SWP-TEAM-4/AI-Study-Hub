import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, CalendarDays, Layers, Plus, Edit2, Trash2, X, PlusCircle, MinusCircle } from "lucide-react";
import { 
  academicService, 
  SemesterDTO, 
  SubjectDTO, 
  ComboDTO 
} from "../services/academicService";

export default function AdminAcademicTab() {
  const [activeTab, setActiveTab] = useState<"semesters" | "subjects" | "combos">("semesters");

  return (
    <div className="space-y-6">
      {/* Nút chuyển đổi giữa Học kỳ / Môn học / Combo */}
      <div className="flex p-1 bg-muted rounded-xl border border-border/50 self-start inline-flex gap-1">
        <button onClick={() => setActiveTab("semesters")} className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "semesters" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          <CalendarDays size={14} className="inline mr-1 mb-0.5" /> Học kỳ
        </button>
        <button onClick={() => setActiveTab("subjects")} className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "subjects" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          <BookOpen size={14} className="inline mr-1 mb-0.5" /> Môn học
        </button>
        <button onClick={() => setActiveTab("combos")} className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "combos" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          <Layers size={14} className="inline mr-1 mb-0.5" /> Combo
        </button>
      </div>

      <div className="surface-card p-5 bg-card overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === "semesters" && <SemesterManager key="semesters" />}
          {activeTab === "subjects" && <SubjectManager key="subjects" />}
          {activeTab === "combos" && <ComboManager key="combos" />}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ======================= SEMESTER MANAGER =======================
function SemesterManager() {
  const [semesters, setSemesters] = useState<SemesterDTO[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<SemesterDTO | null>(null);
  const [formData, setFormData] = useState({ code: "", name: "" });

  const loadData = async () => {
    setLoading(true);
    const res = await academicService.getSemesters();
    if (res.success) setSemesters(res.data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async () => {
    if (editItem) {
      await academicService.adminUpdateSemester(editItem.id, formData);
    } else {
      await academicService.adminCreateSemester(formData);
    }
    setShowModal(false);
    loadData();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa học kỳ này?")) {
      await academicService.adminDeleteSemester(id);
      loadData();
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-bold">Quản lý Học kỳ</h2>
          <p className="text-xs text-muted-foreground">Danh sách học kỳ trong hệ thống</p>
        </div>
        <button onClick={() => { setEditItem(null); setFormData({ code: "", name: "" }); setShowModal(true); }} className="px-3 py-1.5 bg-primary text-primary-foreground text-sm font-bold rounded-lg flex items-center gap-1 hover:bg-primary/90">
          <Plus size={16} /> Thêm mới
        </button>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Đang tải...</p> : (
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr><th className="px-4 py-3">Mã HK</th><th className="px-4 py-3">Tên HK</th><th className="px-4 py-3 text-right">Thao tác</th></tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            <AnimatePresence>
              {semesters.map((s, i) => (
                <motion.tr 
                  key={s.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="hover:bg-muted/10"
                >
                  <td className="px-4 py-3 font-mono font-bold text-primary">{s.code}</td>
                  <td className="px-4 py-3">{s.name}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => { setEditItem(s); setFormData({ code: s.code, name: s.name }); setShowModal(true); }} className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-md"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(s.id)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-md ml-1"><Trash2 size={14} /></button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card p-6 rounded-xl w-full max-w-sm border border-border shadow-xl">
            <h3 className="text-lg font-bold mb-4">{editItem ? "Sửa Học kỳ" : "Thêm Học kỳ mới"}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground">Mã Học Kỳ (VD: FA25)</label>
                <input value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} className="w-full mt-1 px-3 py-2 bg-muted rounded-lg text-sm outline-none focus:border-primary border border-transparent" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground">Tên Học Kỳ</label>
                <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full mt-1 px-3 py-2 bg-muted rounded-lg text-sm outline-none focus:border-primary border border-transparent" />
              </div>
            </div>
            <div className="mt-6 flex gap-2 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm font-bold bg-muted text-foreground hover:bg-muted/80">Hủy</button>
              <button onClick={handleSubmit} className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90">Lưu</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ======================= SUBJECT MANAGER =======================
function SubjectManager() {
  const [subjects, setSubjects] = useState<SubjectDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<SubjectDTO | null>(null);
  const [formData, setFormData] = useState({ code: "", name: "", standardSemesterNumber: 1 });

  const loadData = async () => {
    setLoading(true);
    const res = await academicService.getSubjects();
    if (res.success) setSubjects(res.data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async () => {
    if (editItem) {
      await academicService.adminUpdateSubject(editItem.id, formData);
    } else {
      await academicService.adminCreateSubject(formData);
    }
    setShowModal(false);
    loadData();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa môn học này?")) {
      await academicService.adminDeleteSubject(id);
      loadData();
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-bold">Quản lý Môn học</h2>
          <p className="text-xs text-muted-foreground">Danh sách môn học hệ thống</p>
        </div>
        <button onClick={() => { setEditItem(null); setFormData({ code: "", name: "", standardSemesterNumber: 1 }); setShowModal(true); }} className="px-3 py-1.5 bg-primary text-primary-foreground text-sm font-bold rounded-lg flex items-center gap-1 hover:bg-primary/90">
          <Plus size={16} /> Thêm mới
        </button>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Đang tải...</p> : (
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr><th className="px-4 py-3">Mã Môn</th><th className="px-4 py-3">Tên Môn</th><th className="px-4 py-3">Kỳ chuẩn</th><th className="px-4 py-3 text-right">Thao tác</th></tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            <AnimatePresence>
              {subjects.map((s, i) => (
                <motion.tr 
                  key={s.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="hover:bg-muted/10"
                >
                  <td className="px-4 py-3 font-mono font-bold text-primary">{s.code}</td>
                  <td className="px-4 py-3">{s.name}</td>
                  <td className="px-4 py-3 text-center w-24">Kỳ {s.standardSemesterNumber}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => { setEditItem(s); setFormData({ code: s.code, name: s.name, standardSemesterNumber: s.standardSemesterNumber }); setShowModal(true); }} className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-md"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(s.id)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-md ml-1"><Trash2 size={14} /></button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card p-6 rounded-xl w-full max-w-sm border border-border shadow-xl">
            <h3 className="text-lg font-bold mb-4">{editItem ? "Sửa Môn học" : "Thêm Môn học mới"}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground">Mã Môn Học</label>
                <input value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} className="w-full mt-1 px-3 py-2 bg-muted rounded-lg text-sm outline-none focus:border-primary border border-transparent" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground">Tên Môn Học</label>
                <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full mt-1 px-3 py-2 bg-muted rounded-lg text-sm outline-none focus:border-primary border border-transparent" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground">Kỳ chuẩn</label>
                <input type="number" value={formData.standardSemesterNumber} onChange={e => setFormData({ ...formData, standardSemesterNumber: parseInt(e.target.value) || 1 })} className="w-full mt-1 px-3 py-2 bg-muted rounded-lg text-sm outline-none focus:border-primary border border-transparent" />
              </div>
            </div>
            <div className="mt-6 flex gap-2 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm font-bold bg-muted text-foreground hover:bg-muted/80">Hủy</button>
              <button onClick={handleSubmit} className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90">Lưu</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ======================= COMBO MANAGER =======================
function ComboManager() {
  const [combos, setCombos] = useState<ComboDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ code: "", name: "", description: "" });

  // Quản lý Môn học trong Combo
  const [selectedCombo, setSelectedCombo] = useState<ComboDTO | null>(null);
  const [comboSubjects, setComboSubjects] = useState<SubjectDTO[]>([]);
  const [allSubjects, setAllSubjects] = useState<SubjectDTO[]>([]);

  const loadData = async () => {
    setLoading(true);
    const res = await academicService.getCombos();
    if (res.success) setCombos(res.data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreateCombo = async () => {
    await academicService.adminCreateCombo(formData);
    setShowAddModal(false);
    loadData();
  };

  const handleViewSubjects = async (combo: ComboDTO) => {
    setSelectedCombo(combo);
    const res1 = await academicService.getSubjectsOfCombo(combo.id);
    const res2 = await academicService.getSubjects(); // load all subjects for adding
    if (res1.success) setComboSubjects(res1.data);
    if (res2.success) setAllSubjects(res2.data);
  };

  const handleAddSubjectToCombo = async (subjectId: number) => {
    if (!selectedCombo) return;
    await academicService.adminAddSubjectToCombo(selectedCombo.id, subjectId);
    handleViewSubjects(selectedCombo); // reload
  };

  const handleRemoveSubjectFromCombo = async (subjectId: number) => {
    if (!selectedCombo) return;
    await academicService.adminRemoveSubjectFromCombo(selectedCombo.id, subjectId);
    handleViewSubjects(selectedCombo); // reload
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
      {selectedCombo ? (
        // VIEW THÀNH PHẦN COMBO
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <button onClick={() => setSelectedCombo(null)} className="p-1 hover:bg-muted rounded-md"><X size={16} /></button>
                Thành phần môn học: {selectedCombo.name}
              </h2>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Danh sách môn trong combo */}
            <div className="border border-border/60 rounded-xl p-4">
              <h3 className="text-sm font-bold text-primary mb-3">Môn học đã có trong Combo</h3>
              <div className="space-y-2">
                {comboSubjects.length === 0 && <p className="text-xs text-muted-foreground">Chưa có môn nào.</p>}
                {comboSubjects.map(s => (
                  <div key={s.id} className="flex justify-between items-center bg-muted/30 p-2.5 rounded-lg border border-border/40">
                    <div>
                      <span className="font-mono font-bold text-xs text-foreground mr-2">{s.code}</span>
                      <span className="text-xs text-muted-foreground">{s.name}</span>
                    </div>
                    <button onClick={() => handleRemoveSubjectFromCombo(s.id)} className="text-red-500 hover:text-red-400 p-1"><MinusCircle size={16} /></button>
                  </div>
                ))}
              </div>
            </div>

            {/* Danh sách môn ngoài combo */}
            <div className="border border-border/60 rounded-xl p-4">
              <h3 className="text-sm font-bold text-muted-foreground mb-3">Thêm môn học vào Combo</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {allSubjects.filter(s => !comboSubjects.find(cs => cs.id === s.id)).map(s => (
                  <div key={s.id} className="flex justify-between items-center bg-muted/30 p-2.5 rounded-lg border border-border/40">
                    <div>
                      <span className="font-mono font-bold text-xs text-foreground mr-2">{s.code}</span>
                      <span className="text-xs text-muted-foreground">{s.name}</span>
                    </div>
                    <button onClick={() => handleAddSubjectToCombo(s.id)} className="text-success hover:text-success/80 p-1"><PlusCircle size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // VIEW DANH SÁCH COMBO
        <>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-bold">Quản lý Combo</h2>
              <p className="text-xs text-muted-foreground">Tạo và phân bổ môn học vào các Combo chuyên ngành</p>
            </div>
            <button onClick={() => { setFormData({ code: "", name: "", description: "" }); setShowAddModal(true); }} className="px-3 py-1.5 bg-primary text-primary-foreground text-sm font-bold rounded-lg flex items-center gap-1 hover:bg-primary/90">
              <Plus size={16} /> Tạo Combo
            </button>
          </div>

          {loading ? <p className="text-sm text-muted-foreground">Đang tải...</p> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {combos.map((c, i) => (
                  <motion.div 
                    key={c.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-muted/20 border border-border/60 p-4 rounded-xl hover:border-primary/50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono font-bold text-xs px-2 py-1 bg-primary/10 text-primary rounded-md">{c.code}</span>
                    </div>
                    <h3 className="font-bold text-sm text-foreground">{c.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.description}</p>
                    
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <button onClick={() => handleViewSubjects(c)} className="w-full py-1.5 bg-muted hover:bg-primary/10 hover:text-primary text-xs font-bold rounded-lg transition-colors">
                        Quản lý môn học
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Modal thêm Combo */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-card p-6 rounded-xl w-full max-w-sm border border-border shadow-xl">
                <h3 className="text-lg font-bold mb-4">Tạo Combo mới</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground">Mã Combo</label>
                    <input value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} className="w-full mt-1 px-3 py-2 bg-muted rounded-lg text-sm outline-none focus:border-primary border border-transparent" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground">Tên Combo</label>
                    <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full mt-1 px-3 py-2 bg-muted rounded-lg text-sm outline-none focus:border-primary border border-transparent" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground">Mô tả</label>
                    <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full mt-1 px-3 py-2 bg-muted rounded-lg text-sm outline-none focus:border-primary border border-transparent h-20 resize-none" />
                  </div>
                </div>
                <div className="mt-6 flex gap-2 justify-end">
                  <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-lg text-sm font-bold bg-muted text-foreground hover:bg-muted/80">Hủy</button>
                  <button onClick={handleCreateCombo} className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90">Lưu</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
