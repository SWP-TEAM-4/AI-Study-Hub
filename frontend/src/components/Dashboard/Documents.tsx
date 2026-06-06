import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, Folder, Search, Plus, MoreVertical, FileText } from "lucide-react";
import HeroBackground from "./BackGroundForDocuments/HeroBackground"; 

interface DocumentItem {
    id: string;
    name: string;
    type: "file" | "folder";
    date: string;
    size?: string;
    files?: number;
    uploadedBy?: string;
}

interface UploadedFile {
    id: string;
    name: string;
    date: string;
    size: string;
    uploadedBy: string;
    status: "success" | "pending" | "error";
}

const Documents = () => {
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([
        { id: "1", name: "Health Data.pdf", date: "30.11.2024", size: "56 MB", uploadedBy: "Cameron Williamson", status: "success" },
        { id: "2", name: "Medical reports.docx", date: "30.11.2024", size: "12 MB", uploadedBy: "Jenny Wilson", status: "success" },
        { id: "3", name: "Lab results.xlsx", date: "30.11.2024", size: "4.2 MB", uploadedBy: "Floyd Miles", status: "success" },
        { id: "4", name: "Vaccine Passport.pdf", date: "30.11.2024", size: "850 KB", uploadedBy: "Kristin Watson", status: "success" },
    ]);

    const [folders] = useState<DocumentItem[]>([
        { id: "1", name: "Health Report", type: "folder", date: "30.11.2024", files: 80, size: "168 MB" },
        { id: "2", name: "Medical Information", type: "folder", date: "30.11.2024", files: 8, size: "56 MB" },
        { id: "3", name: "Prescriptions", type: "folder", date: "30.11.2024", files: 20, size: "11 MB" },
        { id: "4", name: "Archieved", type: "folder", date: "30.11.2024", files: 99, size: "267 MB" },
    ]);

    const [recentFiles] = useState<DocumentItem[]>([
        { id: "1", name: "Health data.pdf", date: "30.11.2024", size: "56 MB", type: "file" },
        { id: "2", name: "Medical report.docx", date: "30.11.2024", size: "12 MB", type: "file" },
        { id: "3", name: "Prescriptions.pdf", date: "30.11.2024", size: "56 MB", type: "file" },
    ]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragActive, setIsDragActive] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragActive(true);
        } else if (e.type === "dragleave") {
            setIsDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);

        const files = e.dataTransfer.files;
        if (files && files[0]) {
            handleFileUpload(files[0]);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const handleFileUpload = (file: File) => {
        const newFile: UploadedFile = {
            id: Date.now().toString(),
            name: file.name,
            date: new Date().toLocaleDateString("vi-VN"),
            size: formatFileSize(file.size),
            uploadedBy: "You",
            status: "success"
        };
        setUploadedFiles([newFile, ...uploadedFiles]);
    };

    const handleClickUpload = () => {
        fileInputRef.current?.click();
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
        }
    };

    const filteredFiles = uploadedFiles.filter(file =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const pageVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.4, staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        // Thay đổi: Root bao ngoài đổi thành div thường có màu nền mong muốn
        <div className="bg-slate-50 min-h-screen">
            <motion.div
                className="doc-container"
                variants={pageVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header */}
                <motion.div className="doc-header" variants={itemVariants}>
                    <div>
                        <h1 className="doc-title">Documents</h1>
                        <p className="doc-subtitle">Manage and organize your files and folders</p>
                    </div>
                </motion.div>

                {/* Upload Area */}
                <motion.div
                    className={`doc-upload-zone ${isDragActive ? "active" : ""}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    variants={itemVariants}
                >
                    {/* Thay đổi: Đưa HeroBackground vào đây để ôm trọn phần content upload */}
                    <HeroBackground showFrame={true} showVeil={true}>
                        <div className="doc-upload-content" onClick={handleClickUpload}>
                            <div className="doc-upload-icon">
                                <Upload size={32} />
                            </div>
                            {/* Chỉnh lại chữ màu trắng hoặc sáng hơn để nổi bật trên nền video */}
                            <h3 className="text-white font-semibold">Click to upload or drag and drop</h3>
                            <p className="text-slate-300">Supported formats: PDF, DOCX, PPTX, XLSX, etc.</p>
                            <button className="doc-upload-btn" type="button">
                                <Plus size={16} /> New file / Folder
                            </button>
                        </div>
                    </HeroBackground>

                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileInputChange}
                        style={{ display: "none" }}
                    />
                </motion.div>

                {/* Main Content */}
                <div className="doc-content">
                    {/* Left Column */}
                    <motion.div className="doc-left" variants={itemVariants}>
                        {/* Folders Section */}
                        <section className="doc-section">
                            <h2 className="doc-section-title">Folders</h2>
                            <div className="doc-folders-grid">
                                {folders.map((folder) => (
                                    <motion.div
                                        key={folder.id}
                                        className="doc-folder-card"
                                        whileHover={{ y: -4 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div className="doc-folder-icon">
                                            <Folder size={32} />
                                        </div>
                                        <h4>{folder.name}</h4>
                                        <p>{folder.files} Files • {folder.size}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </section>

                        {/* Recent Files Section */}
                        <section className="doc-section">
                            <h2 className="doc-section-title">Recent files</h2>
                            <div className="doc-recent-files">
                                {recentFiles.map((file) => (
                                    <motion.div
                                        key={file.id}
                                        className="doc-recent-item"
                                        whileHover={{ x: 4 }}
                                    >
                                        <div className="doc-recent-icon">
                                            <FileText size={20} />
                                        </div>
                                        <div className="doc-recent-info">
                                            <p className="doc-recent-name">{file.name}</p>
                                            <span className="doc-recent-meta">{file.date} • {file.size}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </section>
                    </motion.div>

                    {/* Right Column - All Files */}
                    <motion.div className="doc-right" variants={itemVariants}>
                        <section className="doc-section">
                            <div className="doc-section-header">
                                <h2 className="doc-section-title">All Files</h2>
                                <div className="doc-search-box">
                                    <Search size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search files..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="doc-files-table">
                                <div className="doc-table-header">
                                    <span className="doc-col-name">Name</span>
                                    <span className="doc-col-date">Uploaded Date</span>
                                    <span className="doc-col-by">Uploaded By</span>
                                    <span className="doc-col-action">More Actions</span>
                                </div>

                                <div className="doc-table-body">
                                    {filteredFiles.map((file) => (
                                        <motion.div
                                            key={file.id}
                                            className="doc-table-row"
                                            whileHover={{ backgroundColor: "rgba(248, 250, 251, 0.6)" }}
                                        >
                                            <div className="doc-file-item">
                                                <FileText size={18} />
                                                <span>{file.name}</span>
                                            </div>
                                            <span className="doc-date">{file.date}</span>
                                            <div className="doc-uploaded-by">
                                                <div className="doc-avatar">{file.uploadedBy[0]}</div>
                                                <span>{file.uploadedBy}</span>
                                            </div>
                                            <div className="doc-actions">
                                                <motion.button
                                                    className="doc-action-btn"
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    aria-label="More actions"
                                                >
                                                    <MoreVertical size={16} />
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    ))}

                                    {filteredFiles.length === 0 && (
                                        <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
                                            No files matched your search.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    </motion.div>
                </div>

                {/* CSS Tinh Chỉnh */}
                <style dangerouslySetInnerHTML={{
                    __html: `
            .doc-container {
              padding: 32px;
              background: transparent; 
              position: relative;
              z-index: 1;
            }

            .doc-header {
              margin-bottom: 32px;
            }

            .doc-title {
              font-size: 28px;
              font-weight: 700;
              color: #1e293b;
              margin: 0 0 8px 0;
            }

            .doc-subtitle {
              font-size: 14px;
              color: #64748b;
              margin: 0;
            }

            /* Thay đổi CSS vùng Upload Zone để khít video */
            .doc-upload-zone {
              border: 2px dashed #cbd5e1;
              border-radius: 12px;
              padding: 0; /* Đổi từ 48px thành 0 để video tràn hết viền nét đứt */
              text-align: center;
              margin-bottom: 40px;
              background: #000; /* Thêm nền đen để bổ trợ cho video */
              transition: all 0.3s ease;
              cursor: pointer;
              position: relative;
              overflow: hidden; /* Cắt góc video bo tròn theo khung */
            }

            .doc-upload-zone.active {
              border-color: #0ea5e9;
              transform: scale(1.01);
            }

            /* Di chuyển padding 48px xuống content bên trong video */
            .doc-upload-content {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 12px;
              padding: 48px;
            }

            .doc-upload-icon {
              width: 60px;
              height: 60px;
              background: rgba(255, 255, 255, 0.15); /* Glassmorphism cho icon */
              backdrop-filter: blur(4px);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #fff;
            }

            .doc-upload-btn {
              margin-top: 12px;
              padding: 10px 20px;
              background: #0ea5e9;
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 6px;
              transition: all 0.3s ease;
            }

            .doc-upload-btn:hover {
              background: #0284c7;
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
            }

            .doc-content {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 32px;
            }

            .doc-section {
              margin-bottom: 32px;
            }

            .doc-section-title {
              font-size: 18px;
              font-weight: 700;
              color: #1e293b;
              margin: 0 0 20px 0;
            }

            .doc-section-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 20px;
            }

            .doc-search-box {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 8px 12px;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              background: rgba(255, 255, 255, 0.9);
              width: 250px;
            }

            .doc-search-box input {
              border: none;
              outline: none;
              background: transparent;
              flex: 1;
              font-size: 14px;
              color: #1e293b;
            }

            .doc-search-box input::placeholder {
              color: #94a3b8;
            }

            .doc-folders-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 16px;
            }

            .doc-folder-card {
              background: rgba(255, 255, 255, 0.8);
              backdrop-filter: blur(4px);
              border-radius: 12px;
              padding: 20px;
              cursor: pointer;
              border: 1px solid #e2e8f0;
              transition: all 0.3s ease;
            }

            .doc-folder-card:hover {
              border-color: #0ea5e9;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
              background: rgba(255, 255, 255, 0.95);
            }

            .doc-folder-icon {
              color: #3b82f6;
              margin-bottom: 12px;
            }

            .doc-folder-card h4 {
              font-size: 15px;
              font-weight: 600;
              color: #1e293b;
              margin: 0 0 4px 0;
            }

            .doc-folder-card p {
              font-size: 13px;
              color: #64748b;
              margin: 0;
            }

            .doc-recent-files {
              display: grid;
              grid-template-columns: 1fr;
              gap: 12px;
            }

            .doc-recent-item {
              display: flex;
              gap: 12px;
              padding: 12px;
              background: rgba(255, 255, 255, 0.8);
              backdrop-filter: blur(4px);
              border-radius: 8px;
              border: 1px solid #e2e8f0;
              cursor: pointer;
              transition: all 0.3s ease;
            }

            .doc-recent-item:hover {
              border-color: #0ea5e9;
              background: #f0f9ff;
            }

            .doc-recent-icon {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 40px;
              height: 40px;
              background: #f1f5f9;
              border-radius: 8px;
              color: #64748b;
              flex-shrink: 0;
            }

            .doc-recent-info {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }

            .doc-recent-name {
              font-size: 14px;
              font-weight: 500;
              color: #1e293b;
              margin: 0;
            }

            .doc-recent-meta {
              font-size: 12px;
              color: #94a3b8;
            }

            .doc-files-table {
              background: rgba(255, 255, 255, 0.8);
              backdrop-filter: blur(4px);
              border-radius: 12px;
              border: 1px solid #e2e8f0;
              overflow: hidden;
            }

            .doc-table-header {
              display: grid;
              grid-template-columns: 2fr 1.5fr 1.5fr 100px;
              gap: 16px;
              padding: 16px 20px;
              background: rgba(248, 240, 252, 0.5);
              border-bottom: 1px solid #e2e8f0;
              font-size: 13px;
              font-weight: 600;
              color: #475569;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }

            .doc-col-name, .doc-col-date, .doc-col-by, .doc-col-action {
              display: flex;
              align-items: center;
            }

            .doc-table-body {
              display: flex;
              flex-direction: column;
            }

            .doc-table-row {
              display: grid;
              grid-template-columns: 2fr 1.5fr 1.5fr 100px;
              gap: 16px;
              padding: 14px 20px;
              border-bottom: 1px solid #f1f5f9;
              align-items: center;
              transition: all 0.2s ease;
            }

            .doc-table-row:last-child {
              border-bottom: none;
            }

            .doc-file-item {
              display: flex;
              align-items: center;
              gap: 10px;
              color: #1e293b;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .doc-file-item svg {
              color: #64748b;
              flex-shrink: 0;
            }

            .doc-date {
              font-size: 14px;
              color: #64748b;
            }

            .doc-uploaded-by {
              display: flex;
              align-items: center;
              gap: 8px;
            }

            .doc-avatar {
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 13px;
              font-weight: 600;
              flex-shrink: 0;
            }

            .doc-uploaded-by span {
              font-size: 14px;
              color: #1e293b;
            }

            .doc-actions {
              display: flex;
              gap: 8px;
              justify-content: center;
            }

            .doc-action-btn {
              width: 32px;
              height: 32px;
              border-radius: 6px;
              border: none;
              background: transparent;
              color: #64748b;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.2s ease;
            }

            .doc-action-btn:hover {
              background: #f1f5f9;
              color: #0ea5e9;
            }

            @media (max-width: 1400px) {
              .doc-content {
                grid-template-columns: 1fr;
              }
            }

            @media (max-width: 768px) {
              .doc-container {
                padding: 16px;
              }

              .doc-table-header {
                grid-template-columns: 1fr 1fr;
                font-size: 12px;
              }

              .doc-table-row {
                grid-template-columns: 1fr 1fr;
              }

              .doc-col-by,
              .doc-uploaded-by {
                display: none;
              }
            }
          `}} />
            </motion.div>
        </div>
    );
};

export default Documents;