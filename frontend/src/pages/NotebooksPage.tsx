"use client";
 
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Plus, Search, X, Edit, Trash2, FolderOpen, ArrowRight, Book, Clock, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { NotebookDTO } from "../services/notebookService";
import { 
  useNotebooks, 
  useCreateNotebook, 
  useUpdateNotebook, 
  useDeleteNotebook 
} from "../hooks/useNotebooks";
import CustomSelect from "../components/ui/CustomSelect";
import { Confirm } from "notiflix";
import EmptyState from "../components/ui/EmptyState";
import { useSubjects } from "../hooks/useSubjects";
import { useNavigate } from "react-router-dom";

// ==========================================
// Vector Illustration Style Architecture (React CSS Art + Framer Motion)
// ==========================================

const ShimmerButton = ({ children, onClick, className, id, disabled }: any) => (
  <button 
    id={id}
    disabled={disabled}
    onClick={onClick}
    className={`relative overflow-hidden group font-bold transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 ${className}`}
  >
    <span className="relative z-10 flex items-center gap-2">{children}</span>
    {!disabled && (
      <motion.div 
        animate={{ x: ["-200%", "300%"] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
        className="absolute top-0 bottom-0 left-0 z-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
      />
    )}
  </button>
);

import { useMotionValue, useSpring, useTransform } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80, damping: 15 } }
};

const QuickStats = ({ notebooks, subjects }: any) => {
  const totalDocs = notebooks.reduce((acc: number, nb: any) => acc + (nb.documentCount || 0), 0);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 max-w-7xl mx-auto w-full relative z-10">
       <motion.div variants={itemVariants} className="bg-white p-5 rounded-2xl border-2 border-slate-200/60 shadow-[0_4px_15px_rgba(0,0,0,0.02)] flex items-center gap-4 hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 group">
          <div className="w-14 h-14 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
             <Book size={24} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Tổng Sổ Tay</p>
            <h4 className="text-3xl font-black text-slate-900">{notebooks.length}</h4>
          </div>
       </motion.div>
       
       <motion.div variants={itemVariants} className="bg-white p-5 rounded-2xl border-2 border-slate-200/60 shadow-[0_4px_15px_rgba(0,0,0,0.02)] flex items-center gap-4 hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 group">
          <div className="w-14 h-14 bg-amber-50 rounded-xl border border-amber-100 flex items-center justify-center text-amber-500 shrink-0 group-hover:scale-110 group-hover:bg-amber-400 group-hover:text-white transition-all duration-300">
             <FolderOpen size={24} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Tổng Tài Liệu</p>
            <h4 className="text-3xl font-black text-slate-900">{totalDocs}</h4>
          </div>
       </motion.div>
       
       <motion.div variants={itemVariants} className="bg-white p-5 rounded-2xl border-2 border-slate-200/60 shadow-[0_4px_15px_rgba(0,0,0,0.02)] flex items-center gap-4 hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 group">
          <div className="w-14 h-14 bg-rose-50 rounded-xl border border-rose-100 flex items-center justify-center text-rose-500 shrink-0 group-hover:scale-110 group-hover:bg-rose-400 group-hover:text-white transition-all duration-300">
             <Clock size={24} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Môn Học</p>
            <h4 className="text-3xl font-black text-slate-900">{subjects.length}</h4>
          </div>
       </motion.div>
    </div>
  )
}

const HeroSection = ({ onNavigate }: { onNavigate: () => void }) => {
  return (
    <div 
      className="relative w-full rounded-2xl overflow-hidden bg-white border border-slate-200/60 mb-8 flex flex-col xl:flex-row items-center p-8 md:p-14 shadow-[0_8px_30px_rgba(0,0,0,0.04)] group"
    >
      {/* Background Soft Mesh/Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-50/50 via-white to-white pointer-events-none" />
      <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-rose-50/40 to-transparent pointer-events-none" />

      {/* Text Content */}
      <div className="flex-1 relative z-10 w-full">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-full text-xs font-bold text-slate-600 mb-6 shadow-sm uppercase tracking-widest">
           <span className="flex h-2 w-2 rounded-full bg-[#FF6B6B] animate-pulse"></span>
           Thư viện cá nhân
        </div>
        <h1 className="text-4xl md:text-[3.5rem] font-extrabold text-slate-900 mb-6 leading-[1.1] tracking-tight">
          Quản Lý <br/>
          <motion.span 
            animate={{ backgroundPosition: ["0% 50%", "200% 50%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            style={{ backgroundSize: "200% auto" }}
            className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] via-[#38BDF8] to-[#2563EB] inline-block"
          >
            Tài Liệu Đỉnh Cao
          </motion.span>
        </h1>
        <p className="text-slate-500 font-medium mb-8 max-w-md text-base leading-relaxed">
          Không gian học tập chuyên nghiệp, tương tác mượt mà. Mang trải nghiệm của một ứng dụng cao cấp vào góc học tập của bạn.
        </p>
        <ShimmerButton 
          onClick={onNavigate}
          className="px-8 py-3.5 bg-slate-900 text-white rounded-xl shadow-[0_10px_20px_rgba(15,23,42,0.15)] hover:shadow-[0_10px_25px_rgba(15,23,42,0.2)]"
        >
          <Plus size={18}/> Bắt đầu ngay
        </ShimmerButton>
      </div>

      {/* 3D Illustration Area */}
      <div className="flex-1 relative mt-16 xl:mt-0 flex justify-center items-center h-[340px] w-full transform-gpu">
        
        {/* Animated Background Blob */}
        <div 
          className="absolute z-0 w-[300px] h-[300px] rounded-full opacity-60 mix-blend-multiply filter blur-2xl bg-gradient-to-br from-[#FFE0D3] to-[#E0F7FA]"
        />
        <motion.div 
          animate={{ scale: [1, 1.05, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute z-0 w-[260px] h-[260px] rounded-full bg-gradient-to-tr from-rose-100 to-transparent opacity-80"
        />

        {/* The Main Book/Tablet */}
        <motion.div 
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="relative z-10 w-[320px] h-[210px] bg-slate-900 rounded-[20px] p-2.5 shadow-[0_20px_50px_-15px_rgba(15,23,42,0.35)] border border-slate-700/50 -rotate-2"
        >
           {/* Screen / Pages */}
           <div className="w-full h-full bg-white rounded-[12px] flex overflow-hidden shadow-inner relative">
              {/* Left Page */}
              <div className="flex-1 border-r border-slate-100 p-5 flex flex-col gap-4 bg-gradient-to-br from-white to-slate-50">
                 <div className="w-full h-3 bg-slate-100 rounded-full shadow-inner" />
                 <div className="w-3/4 h-3 bg-slate-100 rounded-full shadow-inner" />
                 <div className="w-full h-3 bg-slate-100 rounded-full shadow-inner" />
                 <div className="w-1/2 h-3 bg-slate-100 rounded-full shadow-inner" />
              </div>
              {/* Right Page */}
              <div className="flex-1 p-5 flex flex-col gap-4 relative bg-white">
                 <motion.div 
                   animate={{ y: [0, -4, 0] }}
                   transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                   className="absolute -top-1 right-6 w-8 h-14 bg-gradient-to-b from-[#FF6B6B] to-[#EF233C] rounded-b-md shadow-[0_4px_10px_rgba(239,35,60,0.3)] border-b border-white/20" 
                 />
                 <div className="w-full h-3 bg-slate-100 rounded-full shadow-inner mt-10" />
                 <div className="w-5/6 h-3 bg-slate-100 rounded-full shadow-inner" />
                 
                 {/* Decorative UI element on page */}
                 <div className="absolute bottom-4 right-4 flex gap-1.5">
                   <div className="w-2.5 h-2.5 rounded-full bg-indigo-100" />
                   <div className="w-2.5 h-2.5 rounded-full bg-indigo-100" />
                   <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                 </div>
              </div>
              
              {/* Center bind reflection */}
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-4 bg-gradient-to-r from-transparent via-slate-900/5 to-transparent mix-blend-multiply" />
           </div>
        </motion.div>

        {/* Floating Clock (Premium CSS Art) */}
        <motion.div 
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-2 left-4 z-20 w-20 h-20 bg-gradient-to-br from-white to-slate-100 rounded-full flex items-center justify-center shadow-[0_15px_35px_rgba(0,0,0,0.15),inset_0_-4px_8px_rgba(0,0,0,0.05),inset_0_4px_8px_rgba(255,255,255,1)] border border-slate-200/50"
        >
           <div className="w-[85%] h-[85%] rounded-full bg-[#FAFAFA] shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] relative flex items-center justify-center border border-slate-100/50">
              {/* Ticks */}
              {Array.from({ length: 12 }).map((_, i) => (
                <div 
                  key={i} 
                  className="absolute w-0.5 h-1.5 bg-slate-300 rounded-full" 
                  style={{ transform: `rotate(${i * 30}deg) translateY(-14px)` }} 
                />
              ))}
              
              {/* Hour Hand Container */}
              <motion.div 
                className="absolute inset-0 flex items-center justify-center"
                animate={{ rotate: 360 }}
                transition={{ duration: 43200, repeat: Infinity, ease: "linear" }}
              >
                <div className="w-[3.5px] h-4 bg-slate-800 rounded-full absolute bottom-1/2 shadow-sm" />
              </motion.div>
              
              {/* Minute Hand Container */}
              <motion.div 
                className="absolute inset-0 flex items-center justify-center"
                animate={{ rotate: 360 }}
                transition={{ duration: 3600, repeat: Infinity, ease: "linear" }}
              >
                <div className="w-0.5 h-6 bg-slate-500 rounded-full absolute bottom-1/2 shadow-sm" />
              </motion.div>
              
              {/* Second Hand Container */}
              <motion.div 
                className="absolute inset-0 flex items-center justify-center"
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              >
                <div className="w-[1.5px] h-8 bg-[#FF6B6B] rounded-full absolute bottom-[40%] shadow-[0_2px_4px_rgba(255,107,107,0.3)]" />
              </motion.div>
              
              {/* Center Pin */}
              <div className="absolute w-2 h-2 bg-white border-[1.5px] border-[#FF6B6B] rounded-full shadow-sm z-10" />
           </div>
        </motion.div>

        {/* Floating Ruler (Premium 3D feel) */}
        <motion.div 
          animate={{ y: [0, 10, 0], rotate: [-15, -10, -15] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute bottom-4 left-4 z-20 w-36 h-12 bg-gradient-to-br from-[#FFD166] to-[#F4A261] rounded-xl border border-white/50 flex flex-col justify-end px-4 py-2.5 shadow-[0_15px_30px_rgba(244,162,97,0.3)] overflow-hidden"
        >
           <div className="absolute top-0 left-0 w-full h-[45%] bg-white/25 rounded-t-xl" />
           <div className="flex gap-3 relative z-10">
             {Array.from({length: 5}).map((_, i) => (
               <div key={i} className="w-1.5 h-3.5 bg-amber-900/20 rounded-full" />
             ))}
           </div>
        </motion.div>

        {/* Floating Pen (Glossy) */}
        <motion.div 
          animate={{ y: [0, -15, 0], rotate: [45, 50, 45] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-0 right-2 z-20 w-12 h-36 bg-gradient-to-br from-[#48D1CC] to-[#06D6A0] rounded-full border border-white/60 flex flex-col items-center py-3 gap-1.5 shadow-[0_15px_35px_rgba(6,214,160,0.3)] overflow-hidden"
        >
            <div className="absolute top-0 left-2 bottom-0 w-2.5 bg-white/30 rounded-full blur-[2px]" /> 
            <div className="w-6 h-6 bg-white rounded-full border border-slate-100 flex items-center justify-center shadow-inner relative z-10">
              <div className="w-2.5 h-2.5 bg-slate-800 rounded-full" />
            </div>
            <div className="w-full flex-1 border-t-2 border-white/40 mt-2 relative z-10" />
        </motion.div>

      </div>
    </div>
  );
};

const NotebookSkeletonCard = ({ index }: { index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: "spring", stiffness: 100, damping: 16, delay: index * 0.04 }}
    className="relative w-full h-[200px] bg-white border-2 border-slate-200/60 rounded-xl flex overflow-hidden animate-pulse shadow-sm"
  >
    {/* Spine Skeleton */}
    <div className="w-8 shrink-0 bg-slate-200/80 flex flex-col justify-evenly items-center py-4 border-r-2 border-slate-200/40 relative">
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-8 bg-slate-300 rounded-b-sm" />
      <div className="w-3.5 h-1.5 bg-white/50 rounded-full" />
      <div className="w-3.5 h-1.5 bg-white/50 rounded-full" />
      <div className="w-3.5 h-1.5 bg-white/50 rounded-full" />
      <div className="w-3.5 h-1.5 bg-white/50 rounded-full" />
    </div>

    {/* Content Skeleton */}
    <div className="flex-1 p-5 flex flex-col bg-[#FAFAFA]/50 justify-between">
      <div>
        <div className="h-5 w-16 bg-slate-200/80 rounded-md mb-4" />
        <div className="h-6 w-3/4 bg-slate-200/80 rounded-md mb-2 animate-pulse" />
        <div className="h-4 w-1/2 bg-slate-200/60 rounded-md" />
      </div>
      <div className="flex justify-between items-center pt-2 border-t border-slate-200/40">
        <div className="h-4 w-20 bg-slate-200/70 rounded" />
        <div className="h-7 w-7 bg-slate-200/80 rounded-lg" />
      </div>
    </div>
  </motion.div>
);

const NotebookCard = ({ nb, index, getSubjectLabel, onEdit, onDelete, onClick }: any) => {
  const THEMES = [
    { bg: "bg-indigo-50", border: "border-indigo-200", accent: "bg-indigo-500", text: "text-indigo-700" },
    { bg: "bg-teal-50", border: "border-teal-200", accent: "bg-teal-500", text: "text-teal-700" },
    { bg: "bg-rose-50", border: "border-rose-200", accent: "bg-rose-500", text: "text-rose-700" },
    { bg: "bg-amber-50", border: "border-amber-200", accent: "bg-amber-500", text: "text-amber-700" },
    { bg: "bg-sky-50", border: "border-sky-200", accent: "bg-sky-500", text: "text-sky-700" },
  ];
  const theme = THEMES[index % THEMES.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ 
        type: "spring", 
        stiffness: 100, 
        damping: 15, 
        delay: index * 0.04 
      }}
      onClick={onClick}
      className={`group relative w-full h-[200px] bg-white border-2 border-slate-200 rounded-xl shadow-sm hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] cursor-pointer transition-all duration-300 flex overflow-hidden`}
    >
       {/* Spine */}
       <div className={`w-8 shrink-0 ${theme.accent} flex flex-col justify-evenly items-center py-4 border-r-2 border-slate-200 relative`}>
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-8 bg-[#1E293B] rounded-b-sm shadow-sm" />
          <div className="w-3.5 h-1.5 bg-white/40 rounded-full" />
          <div className="w-3.5 h-1.5 bg-white/40 rounded-full" />
          <div className="w-3.5 h-1.5 bg-white/40 rounded-full" />
          <div className="w-3.5 h-1.5 bg-white/40 rounded-full" />
       </div>

       <div className="flex-1 p-5 flex flex-col bg-[#FAFAFA] relative">
          <div className="flex justify-between items-start mb-3">
            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${theme.bg} ${theme.text} border ${theme.border}`}>
              {getSubjectLabel(nb.subjectId)}
            </span>
            
            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={(e) => { e.stopPropagation(); onEdit(nb); }} className="p-1.5 bg-white border border-slate-200 rounded-md text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-sm transition-all"><Edit size={14}/></button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(nb.id, e); }} className="p-1.5 bg-white border border-slate-200 rounded-md text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:shadow-sm transition-all"><Trash2 size={14}/></button>
            </div>
          </div>
          
          <h3 className="text-[17px] font-bold text-[#1E293B] leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
            {nb.title}
          </h3>

          <div className="mt-auto pt-4 border-t-2 border-dashed border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-500 font-medium text-sm">
              <FolderOpen size={16} className={theme.text} />
              <span>{nb.documentCount || 0} tài liệu</span>
            </div>
            
            <motion.div 
              whileHover={{ x: 3 }}
              className={`w-8 h-8 rounded-md flex items-center justify-center ${theme.bg} ${theme.text} border ${theme.border}`}
            >
               <ArrowRight size={16} />
            </motion.div>
          </div>
       </div>
    </motion.div>
  )
}

const AnimatedSelect = ({ value, onChange, options, placeholder }: { value: string, onChange: (v: string) => void, options: {label: string, value: string}[], placeholder: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="relative w-full sm:w-[200px] z-30">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-11 px-4 pr-8 bg-white border-2 border-[#1E293B] rounded-lg text-sm font-bold text-[#1E293B] flex items-center justify-between shadow-inner focus:outline-none transition-all cursor-pointer"
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop to close dropdown */}
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            
            <motion.ul
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute left-0 right-0 mt-2 bg-white border-2 border-[#1E293B] rounded-lg shadow-[4px_4px_0px_#1E293B] overflow-hidden z-50 py-1"
            >
              {options.map(option => (
                <li key={option.value}>
                  <button
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors flex items-center justify-between cursor-pointer ${
                      value === option.value 
                        ? 'bg-[#FFD166] text-[#1E293B]' 
                        : 'text-[#1E293B] hover:bg-[#FFF9F0]'
                    }`}
                  >
                    {option.label}
                    {value === option.value && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#EF233C]" />
                    )}
                  </button>
                </li>
              ))}
            </motion.ul>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function NotebooksPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [activeSubjectTab, setActiveSubjectTab] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const { t } = useTranslation();
  const { subjects, subjectMap } = useSubjects();

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSubjectId, setNewSubjectId] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Edit Modal State
  const [editModal, setEditModal] = useState({ isOpen: false, id: 0, title: "", subjectId: "" });

  const subjectOptions = useMemo(
    () => [
      { label: "Môn học: Tất cả", value: "all" },
      ...subjects.map((subject) => ({ label: subject.code, value: String(subject.id) }))
    ],
    [subjects],
  );

  const sortOptions = [
    { label: "Mới nhất", value: "newest" },
    { label: "Cũ nhất", value: "oldest" },
    { label: "Từ A - Z", value: "az" }
  ];

  useEffect(() => {
    if (subjectOptions.length > 0 && !subjectOptions.some((subject) => subject.value === newSubjectId)) {
      setNewSubjectId(subjectOptions[0].value);
    }
  }, [newSubjectId, subjectOptions]);

  const getSubjectLabel = (subjectId: number) => {
    const subject = subjectMap[subjectId];
    return subject ? subject.code : `Môn #${subjectId}`;
  };

  const handleEdit = (nb: NotebookDTO) => {
    setEditModal({ isOpen: true, id: nb.id, title: nb.title, subjectId: String(nb.subjectId) });
  };

  // 1. Fetch Notebooks
  const { data: notebooksList = [], isLoading } = useNotebooks();

  // Filter notebooks
  const filtered = useMemo(
    () => {
      let result = notebooksList.filter((x: any) => {
        const subjectLabel = getSubjectLabel(x.subjectId).toLowerCase();
        const matchSearch = x.title.toLowerCase().includes(q.toLowerCase()) || subjectLabel.includes(q.toLowerCase());
        const matchSubject = activeSubjectTab === "all" || String(x.subjectId) === activeSubjectTab;
        return matchSearch && matchSubject;
      });

      if (sortBy === "newest") {
        result.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      } else if (sortBy === "oldest") {
        result.sort((a: any, b: any) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
      } else if (sortBy === "az") {
        result.sort((a: any, b: any) => a.title.localeCompare(b.title));
      }
      return result;
    },
    [notebooksList, q, activeSubjectTab, sortBy, subjectMap],
  );

  // 2. Create Mutation
  const createMutation = useCreateNotebook({
    onSuccess: () => {
      setIsModalOpen(false);
      setNewTitle("");
    }
  });

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    createMutation.mutate({ subjectId: Number(newSubjectId), title: newTitle });
  };

  // 3. Update Mutation
  const updateMutation = useUpdateNotebook({
    onSuccess: () => {
      setEditModal({ isOpen: false, id: 0, title: "", subjectId: "" });
    }
  });

  const handleUpdate = () => {
    if (!editModal.title.trim()) return;
    updateMutation.mutate({ id: editModal.id, subjectId: Number(editModal.subjectId), title: editModal.title });
  };

  // 4. Delete Mutation
  const deleteMutation = useDeleteNotebook();

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    Confirm.show(
      "Xóa Notebook",
      "Bạn chắc chắn muốn xóa Notebook này?",
      "Xóa",
      "Hủy",
      () => deleteMutation.mutate(id),
      undefined,
      {
        borderRadius: "8px",
        titleColor: "#1E293B",
        okButtonBackground: "#EF233C"
      }
    );
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="relative -mx-4 -mt-16 min-h-[calc(100vh-4rem)] bg-white px-4 pb-24 pt-24 text-[#1E293B] antialiased md:-mx-6 md:-mt-6 md:px-6 md:pt-12 lg:-mx-8 lg:px-8 overflow-hidden font-sans"
    >
      
      <motion.div variants={itemVariants}>
        <HeroSection onNavigate={() => setIsModalOpen(true)} />
      </motion.div>

      {/* Workspace Area - Clean grid with unrolling tape measure */}
      <div className="relative bg-slate-50/50 border-t-2 border-slate-100/80 pt-8 pb-12 mt-12 -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
        
        <QuickStats notebooks={notebooksList} subjects={subjects} />

        {/* Unrolling Tape Measure (Thước Cuộn Hạt Bụi) */}
        <motion.div variants={itemVariants} className="max-w-7xl mx-auto mb-8 relative flex items-center h-16">
          <motion.div
            initial={false}
            animate={{
              width: isDrawerOpen ? "100%" : "52px",
              height: isDrawerOpen ? "64px" : "52px",
              borderRadius: isDrawerOpen ? "16px" : "50%",
            }}
            transition={{ type: "spring", stiffness: 130, damping: 18 }}
            className="bg-[#FFD166] border-2 border-[#1E293B] shadow-[4px_4px_0px_#1E293B] relative overflow-visible flex items-center justify-start z-30"
          >
            {/* The Rolled Tape State (Icon when closed) */}
            {!isDrawerOpen ? (
              <button 
                onClick={() => setIsDrawerOpen(true)}
                className="w-full h-full flex items-center justify-center text-[#1E293B] hover:scale-105 transition-transform"
                title="Mở thước bộ lọc"
              >
                <SlidersHorizontal size={20} strokeWidth={2.5} />
              </button>
            ) : (
              // Open State Layout
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="w-full h-full flex flex-col xl:flex-row items-center justify-between px-4 py-3 gap-3 relative z-10"
              >
                {/* Horizontal Ticks (Ruler background) */}
                <div className="absolute top-0 left-0 right-0 h-3 flex gap-[8px] opacity-35 px-4 pointer-events-none">
                  {Array.from({length: 120}).map((_, i) => (
                    <div key={`h-tick-${i}`} className={`w-[2px] bg-[#1E293B] rounded-b-sm shrink-0 ${i % 10 === 0 ? 'h-3.5' : i % 5 === 0 ? 'h-2.5' : 'h-1.5'}`} />
                  ))}
                </div>

                <div className="flex flex-1 w-full xl:w-auto flex-col sm:flex-row items-center gap-3 pt-1 xl:pt-0">
                  {/* Search Input */}
                  <div className="relative w-full sm:w-[220px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                    <input
                      type="text"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Tìm kiếm..."
                      className="w-full h-9 pl-8 pr-4 bg-white/95 focus:bg-white border-2 border-[#1E293B] rounded-lg text-xs font-bold text-[#1E293B] focus:outline-none placeholder:text-slate-500 shadow-inner"
                    />
                  </div>

                  {/* Subject Select */}
                  <div className="w-full sm:w-[200px] z-[60]">
                    <AnimatedSelect
                      value={activeSubjectTab}
                      onChange={setActiveSubjectTab}
                      options={subjectOptions}
                      placeholder="Môn học: Tất cả"
                    />
                  </div>

                  {/* Sort Select */}
                  <div className="w-full sm:w-[180px] z-[50]">
                    <AnimatedSelect
                      value={sortBy}
                      onChange={setSortBy}
                      options={sortOptions}
                      placeholder="Sắp xếp"
                    />
                  </div>
                </div>

                {/* Right side buttons */}
                <div className="flex items-center w-full xl:w-auto justify-end gap-3 pt-1 xl:pt-0">
                  <ShimmerButton 
                    onClick={() => setIsModalOpen(true)} 
                    className="h-9 px-5 bg-[#EF233C] border-2 border-[#1E293B] text-white text-xs font-bold rounded-lg shadow-[2px_2px_0px_#1E293B] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0px_#1E293B] transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus size={14} /> Tạo mới
                  </ShimmerButton>

                  {/* Close button that rolls it back */}
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="w-8 h-8 bg-white hover:bg-slate-100 border-2 border-[#1E293B] rounded-lg flex items-center justify-center shadow-[1px_1px_0px_#1E293B] text-[#1E293B] transition-transform hover:rotate-90 active:scale-95"
                    title="Thu thước lại"
                  >
                    <X size={14} strokeWidth={3} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* The Rolling Tape Head Cylinder (always pinned to the expanding right edge) */}
            <motion.div
              style={{ position: "absolute", right: 0, top: 0, bottom: 0 }}
              animate={{
                width: isDrawerOpen ? "6px" : "100%",
                background: isDrawerOpen ? "#1E293B" : "transparent"
              }}
              transition={{ type: "spring", stiffness: 130, damping: 18 }}
              className="pointer-events-none rounded-r-xl"
            />
          </motion.div>
        </motion.div>

        <motion.div variants={itemVariants} className="max-w-7xl mx-auto relative">
          {/* Main Grid */}
          <div className="relative z-10 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <NotebookSkeletonCard key={`sk-${i}`} index={i} />
              ))
            ) : filtered.length === 0 ? (
              <div className="col-span-full bg-[#FAFAFA] border-2 border-slate-200 border-dashed rounded-xl p-16 text-center mt-4 flex flex-col items-center justify-center min-h-[400px]">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }} 
                  className="relative w-40 h-40 mb-6 flex justify-center items-center"
                >
                  {/* Background Blob */}
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute w-32 h-32 bg-[#FFE0D3] rounded-[40%] z-0" />
                  
                  {/* CSS Art Folder */}
                  <motion.div 
                    animate={{ y: [0, -10, 0] }} 
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="relative z-10 w-24 h-28 bg-[#FFD166] rounded-lg border-2 border-[#1E293B] shadow-[6px_6px_0px_rgba(30,41,59,0.1)] flex flex-col justify-end p-2 -rotate-6"
                  >
                     <div className="w-12 h-2.5 bg-white border-2 border-[#1E293B] rounded-full absolute -top-4 left-5 shadow-sm" />
                     <div className="w-full h-1/2 bg-[#FFF9F0] border-t-2 border-dashed border-[#1E293B] rounded-t-sm flex items-center justify-center overflow-hidden relative">
                        <motion.div 
                          animate={{ x: [-40, 40, -40] }} 
                          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                        >
                          <Search className="text-[#1E293B] opacity-20" size={24} />
                        </motion.div>
                     </div>
                  </motion.div>
                </motion.div>
                
                <h3 className="text-2xl font-black text-[#1E293B] mb-3">{t('pages.notebooks.emptyTitle', 'Chưa có Sổ tay nào')}</h3>
                <p className="text-slate-500 font-medium max-w-sm mb-8 leading-relaxed">
                  {t('pages.notebooks.emptyDesc', 'Bạn chưa tạo Notebook nào hoặc không có Notebook nào phù hợp với bộ lọc. Hãy tạo một Notebook mới để bắt đầu.')}
                </p>
                
                <ShimmerButton 
                  onClick={() => setIsModalOpen(true)}
                  className="px-6 py-3 bg-[#1E293B] text-white rounded-lg shadow-md hover:shadow-lg"
                >
                  <Plus size={18} /> {t('pages.notebooks.createFirst', 'Tạo Sổ tay đầu tiên')}
                </ShimmerButton>
              </div>
            ) : (
              filtered.map((nb, index) => (
                <NotebookCard 
                  key={nb.id}
                  nb={nb}
                  index={index}
                  getSubjectLabel={getSubjectLabel}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onClick={() => navigate(`/notebooks/${nb.id}`)}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
      </motion.div>
      </div> {/* End Workspace Area */}

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="bg-white border border-slate-200/80 w-full max-w-md rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] p-6 text-slate-800 relative overflow-visible"
            >
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                    <Book size={18} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Tạo Sổ Tay Mới</h3>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">Tiêu đề</label>
                  <input 
                    autoFocus
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ví dụ: Lịch sử, Toán học..."
                    className="w-full h-11 px-4 bg-slate-50 focus:bg-white border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl outline-none text-sm font-bold text-slate-800 placeholder:text-slate-400 transition-all shadow-inner"
                  />
                </div>
                <div className="relative z-[70]">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">Môn học</label>
                  <AnimatedSelect 
                    value={newSubjectId}
                    onChange={setNewSubjectId}
                    options={subjects.map((subject) => ({ label: subject.code, value: String(subject.id) }))}
                    placeholder="Chọn môn học..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all"
                >
                  Hủy
                </button>
                <ShimmerButton
                  onClick={handleCreate}
                  disabled={!newTitle.trim() || !newSubjectId || createMutation.isPending}
                  className="px-6 py-2.5 bg-[#1E293B] hover:bg-slate-800 text-white text-sm font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {createMutation.isPending ? "Đang xử lý..." : "Xác nhận tạo"}
                </ShimmerButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="bg-white border border-slate-200/80 w-full max-w-md rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] p-6 text-slate-800 relative overflow-visible"
            >
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                    <Edit size={16} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Chỉnh Sửa Sổ Tay</h3>
                </div>
                <button 
                  onClick={() => setEditModal(prev => ({ ...prev, isOpen: false }))} 
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">Tên Sổ tay</label>
                  <input 
                    autoFocus 
                    value={editModal.title} 
                    onChange={e => setEditModal(prev => ({ ...prev, title: e.target.value }))} 
                    placeholder="Nhập tên mới..." 
                    className="w-full h-11 px-4 bg-slate-50 focus:bg-white border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl outline-none text-sm font-bold text-slate-800 placeholder:text-slate-400 transition-all shadow-inner"
                  />
                </div>
                <div className="relative z-[70]">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">Môn học</label>
                  <AnimatedSelect 
                    value={editModal.subjectId}
                    onChange={(val) => setEditModal(prev => ({ ...prev, subjectId: val }))}
                    options={subjects.map((subject) => ({ label: subject.code, value: String(subject.id) }))}
                    placeholder="Chọn môn học..."
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => setEditModal(prev => ({ ...prev, isOpen: false }))} 
                  className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all"
                >
                  Hủy
                </button>
                <ShimmerButton
                  onClick={handleUpdate} 
                  disabled={updateMutation.isPending || !editModal.title.trim()} 
                  className="px-6 py-2.5 bg-[#1E293B] hover:bg-slate-800 text-white text-sm font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                </ShimmerButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
