import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export function LeaderboardModal({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }} 
                        exit={{ scale: 0.9, opacity: 0 }}
                        // Đã thêm các class ẩn thanh cuộn ở đây:
                        className="bg-white rounded-3xl w-full max-w-md max-h-[85vh] overflow-y-auto p-6 shadow-2xl relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Nút đóng */}
                        <button 
                            onClick={onClose} 
                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full z-10"
                        >
                            <X size={20} />
                        </button>
                        
                        {/* Nội dung truyền vào */}
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}