import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RefreshCw, Trash2, Cpu, FileText, Loader2, Sparkles } from "lucide-react";
import { 
  DocumentChunk, 
  getDocumentChunks, 
  processDocument, 
  deleteDocumentChunks 
} from "../../services/documentService";
import { Report } from "notiflix/build/notiflix-report-aio";

interface DocumentChunkModalProps {
  documentId: string;
  documentName: string;
  onClose: () => void;
}

const DocumentChunkModal = ({ documentId, documentName, onClose }: DocumentChunkModalProps) => {
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    void fetchChunks();
  }, [documentId]);

  const fetchChunks = async () => {
    setLoading(true);
    try {
      const data = await getDocumentChunks(documentId);
      setChunks(data || []);
    } catch (error: any) {
      if (error.message !== "Không tìm thấy tài liệu này." && error.message !== "Document not found") {
         Report.failure("Error", error.message || "Failed to fetch chunks", "OK");
      }
      setChunks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async () => {
    setProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const res = await processDocument(documentId, { chunkSize: 800, overlap: 120 });
      setChunks(res.chunks || []);
      Report.success("Success", res.message || "Document processed for RAG successfully!", "OK");
    } catch (error: any) {
      Report.failure("Processing Failed", error.message || "Something went wrong", "OK");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteDocumentChunks(documentId);
      setChunks([]);
      Report.success("Deleted", "Document chunks have been removed.", "OK");
    } catch (error: any) {
      Report.failure("Delete Failed", error.message || "Failed to delete chunks", "OK");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Cpu className="text-cyan-500" />
                AI RAG Processing
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Manage vector chunks for: <span className="font-semibold text-slate-700">{documentName}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 flex-1 overflow-y-auto bg-slate-50">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p>Loading chunks...</p>
              </div>
            ) : chunks.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="px-2.5 py-1 bg-green-100 text-green-700 font-medium rounded-full text-xs">
                      PROCESSED
                    </span>
                    <span>{chunks.length} chunks generated</span>
                  </div>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Delete Chunks
                  </button>
                </div>

                <div className="grid gap-4">
                  {chunks.map((chunk, idx) => (
                    <motion.div
                      key={chunk.id || idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Chunk {chunk.chunkIndex}
                        </span>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          {chunk.sourcePage ? (
                            <span className="flex items-center gap-1">
                              <FileText size={12} /> Page {chunk.sourcePage}
                            </span>
                          ) : null}
                          {chunk.tokenEstimate ? (
                            <span className="px-2 py-0.5 bg-slate-100 rounded">
                              {chunk.tokenEstimate} tokens
                            </span>
                          ) : null}
                        </div>
                      </div>
                      {chunk.sourceSection ? (
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-cyan-600">
                          {chunk.sourceSection}
                        </p>
                      ) : null}
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {chunk.textContent.length > 150 
                          ? chunk.textContent.substring(0, 150) + "..." 
                          : chunk.textContent}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-cyan-50 rounded-2xl flex items-center justify-center mb-6">
                  <Sparkles className="w-10 h-10 text-cyan-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Ready for AI Integration</h3>
                <p className="text-slate-500 max-w-sm mb-8 text-sm">
                  This document has not been processed for AI Retrieval-Augmented Generation (RAG) yet. Process it to generate semantic chunks.
                </p>
                <button
                  onClick={handleProcess}
                  disabled={processing}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium rounded-xl shadow-lg shadow-cyan-500/25 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing Document...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5" />
                      Process for AI RAG
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DocumentChunkModal;
