import { ApiResponse, PaginatedResponse } from "./types";

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface ChunkDTO {
  id: number;
  documentId: number;
  chunkIndex: number;
  textContent: string;
  tokenEstimate: number;
  sourcePage: number | null;
  sourceSection: string | null;
  vectorId: string | null;
}

export interface DocumentDTO {
  id: number;
  userId: number;
  subjectId: number | null;
  title: string;
  description: string | null;
  fileUrl: string | null;
  cloudFilePath: string | null;
  fileType: string;
  fileSize: number;
  visibility: "PRIVATE" | "WORKSPACE" | "MARKETPLACE";
  marketStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  downloadCount: number;
  reviewCount: number;
  acceptPercentage: number;
  aiVerdictNote: string | null;
  processingStatus: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED";
  createdAt: string;
}

export interface MarketplaceDocumentDTO {
  targetType: "DOCUMENT";
  targetId: number;
  title: string;
  subjectId: number | null;
  creatorName: string;
  downloadCount: number;
  reviewCount: number;
  acceptPercentage: number;
  marketStatus: "APPROVED";
  visibility: "MARKETPLACE";
}

export interface TagDTO {
  id: number;
  name: string;
  type: "CUSTOM" | "SYSTEM";
  color: string;
}

export interface CreateDocumentRequest {
  subjectId?: number;
  title: string;
  description?: string;
  fileUrl?: string;
  fileType: string;
  fileSize: number;
  visibility: "PRIVATE" | "WORKSPACE" | "MARKETPLACE";
}

export interface ProcessDocumentRequest {
  chunkSize: number;
  overlap: number;
  mockText?: string;
}

export interface CreateTagRequest {
  name: string;
  type: "CUSTOM" | "SYSTEM";
  color: string;
}

export interface ReviewDocumentRequest {
  voteResult: "APPROVED" | "REJECTED";
  reviewNote?: string;
}

export interface ShareLinkDTO {
  documentId: number;
  title?: string;
  visibility: string;
  shareToken: string;
  shareUrl: string;
  expiresAt: string | null;
  allowDownload: boolean;
  createdAt: string;
  revoked?: boolean;
}

export interface SharedDocumentDTO {
  documentId: number;
  title: string;
  description: string | null;
  subject: { id: number; code: string; name: string } | null;
  fileType: string;
  fileSize: number;
  ownerName: string;
  allowDownload: boolean;
  downloadUrl: string;
  expiresAt: string | null;
  createdAt: string;
}

// ─── BASE REQUEST ────────────────────────────────────────────────────────────

const BASE_URL = "/api";

async function docRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const headers = new Headers(options.headers);
  if (token) {
    const cleanToken = token.replace(/['"]+/g, '');
    headers.set("Authorization", `Bearer ${cleanToken}`);
  }
  if (!headers.has("Content-Type") && options.method !== "GET" && options.method !== "DELETE" && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const text = await response.text();
  const result = text ? JSON.parse(text) : {};

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      localStorage.removeItem("auth-storage");
      window.location.href = "/";
    }
    throw { status: 401, message: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại." };
  }

  if (!response.ok) {
    throw {
      status: response.status,
      message: result.message || "Lỗi giao tiếp API Document",
      errorCode: result.errorCode || "DOC_ERROR"
    };
  }
  return result;
}

// ─── MOCK DATA FALLBACKS ─────────────────────────────────────────────────────

let mockDocuments: DocumentDTO[] = [
  {
    id: 501,
    userId: 1,
    subjectId: 12,
    title: "Chapter 10 Requirement Specification",
    description: "Slide SWR302 chương 10",
    fileUrl: "/uploads/documents/chapter10.pdf",
    cloudFilePath: "documents/1/chapter10.pdf",
    fileType: "pdf",
    fileSize: 2457600,
    visibility: "PRIVATE",
    marketStatus: "NONE",
    downloadCount: 0,
    reviewCount: 0,
    acceptPercentage: 0,
    aiVerdictNote: null,
    processingStatus: "SUCCESS",
    createdAt: "2026-06-12T21:45:00"
  },
  {
    id: 502,
    userId: 1,
    subjectId: null,
    title: "Project Guidelines",
    description: "Đồ án tốt nghiệp guidelines",
    fileUrl: "/uploads/documents/guidelines.docx",
    cloudFilePath: "documents/1/guidelines.docx",
    fileType: "docx",
    fileSize: 1250000,
    visibility: "MARKETPLACE",
    marketStatus: "APPROVED",
    downloadCount: 15,
    reviewCount: 4,
    acceptPercentage: 92.5,
    aiVerdictNote: null,
    processingStatus: "SUCCESS",
    createdAt: "2026-06-10T10:00:00"
  }
];

let mockChunks: ChunkDTO[] = [
  {
    id: 9001,
    documentId: 501,
    chunkIndex: 0,
    textContent: "Requirement specification should be clear, complete and testable...",
    tokenEstimate: 96,
    sourcePage: 12,
    sourceSection: "Chapter 10",
    vectorId: "mock-vector-501-0"
  }
];

let mockTags: TagDTO[] = [
  { id: 1, name: "SRS", type: "CUSTOM", color: "#7c3aed" },
  { id: 2, name: "SWR302", type: "SYSTEM", color: "#ef4444" }
];

// ─── SERVICE IMPLEMENTATION ──────────────────────────────────────────────────

export const documentService = {

  // ─── 1. CHUNKS (RAG) ───

  async deleteDocumentChunks(documentId: number): Promise<ApiResponse<{ deleted: boolean }>> {
    try {
      return await docRequest(`/documents/${documentId}/chunks`, { method: "DELETE" });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        mockChunks = mockChunks.filter(c => c.documentId !== documentId);
        res({ success: true, message: "Deleted successfully", data: { deleted: true } });
      }, 300));
    }
  },

  async getDocumentChunks(documentId: number): Promise<ApiResponse<ChunkDTO[]>> {
    try {
      return await docRequest(`/documents/${documentId}/chunks`, { method: "GET" });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        res({ success: true, message: "Success", data: mockChunks.filter(c => c.documentId === documentId) });
      }, 300));
    }
  },

  async processDocumentChunks(documentId: number, payload: ProcessDocumentRequest): Promise<ApiResponse<any>> {
    try {
      return await docRequest(`/documents/${documentId}/process`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        const newChunk: ChunkDTO = {
          id: Date.now(),
          documentId,
          chunkIndex: 1,
          textContent: payload.mockText || "Mocked processed content...",
          tokenEstimate: 120,
          sourcePage: 1,
          sourceSection: "Introduction",
          vectorId: `mock-vector-${documentId}-1`
        };
        mockChunks.push(newChunk);
        res({
          success: true,
          message: "Success",
          data: { documentId, processingStatus: "SUCCESS", chunkCount: 1, chunks: [newChunk] }
        });
      }, 500));
    }
  },

  // ─── 2. COMMUNITY & MARKETPLACE ───

  async getCommunityDocuments(page = 0, size = 10, keyword = ""): Promise<ApiResponse<PaginatedResponse<DocumentDTO>>> {
    try {
      return await docRequest(`/community/documents?page=${page}&size=${size}&keyword=${keyword}`, { method: "GET" });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        const docs = mockDocuments.filter(d => d.visibility === "MARKETPLACE" && d.marketStatus === "APPROVED");
        res({ success: true, message: "Success", data: { items: docs, page, size, totalElements: docs.length, totalPages: 1 } });
      }, 300));
    }
  },

  async getTopCommunityDocuments(): Promise<ApiResponse<PaginatedResponse<DocumentDTO>>> {
    try {
      return await docRequest(`/community/documents/top`, { method: "GET" });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        const docs = mockDocuments.filter(d => d.visibility === "MARKETPLACE" && d.marketStatus === "APPROVED").sort((a,b) => b.downloadCount - a.downloadCount);
        res({ success: true, message: "Success", data: { items: docs.slice(0, 5), page: 0, size: 5, totalElements: docs.length, totalPages: 1 } });
      }, 300));
    }
  },

  async getCommunityDocumentDetails(id: number): Promise<ApiResponse<DocumentDTO>> {
    try {
      return await docRequest(`/community/documents/${id}`, { method: "GET" });
    } catch (e) {
      return new Promise((res, rej) => setTimeout(() => {
        const doc = mockDocuments.find(d => d.id === id);
        if (doc) res({ success: true, message: "Success", data: doc });
        else rej({ message: "Not found" });
      }, 300));
    }
  },

  async getMarketplaceDocuments(page = 0, size = 10, keyword = ""): Promise<ApiResponse<PaginatedResponse<MarketplaceDocumentDTO>>> {
    try {
      return await docRequest(`/marketplace/documents?page=${page}&size=${size}&keyword=${keyword}`, { method: "GET" });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        let docs = mockDocuments.filter(d => d.visibility === "MARKETPLACE" && d.marketStatus === "APPROVED");
        if (keyword) {
          docs = docs.filter(d => d.title.toLowerCase().includes(keyword.toLowerCase()));
        }
        const mappedDocs = docs.map(d => ({
          targetType: "DOCUMENT" as const,
          targetId: d.id,
          title: d.title,
          subjectId: d.subjectId,
          creatorName: "Mock User",
          downloadCount: d.downloadCount,
          reviewCount: d.reviewCount,
          acceptPercentage: d.acceptPercentage,
          marketStatus: "APPROVED" as const,
          visibility: "MARKETPLACE" as const
        }));
        res({ success: true, message: "Success", data: { items: mappedDocs, page, size, totalElements: mappedDocs.length, totalPages: 1 } });
      }, 300));
    }
  },

  async cloneMarketplaceDocument(id: number, targetNotebookId?: number): Promise<ApiResponse<DocumentDTO>> {
    try {
      return await docRequest(`/marketplace/documents/${id}/clone`, {
        method: "POST",
        body: JSON.stringify({ targetNotebookId })
      });
    } catch (e) {
      return new Promise((res, rej) => setTimeout(() => {
        const doc = mockDocuments.find(d => d.id === id);
        if (!doc) return rej({ message: "Not found" });
        const cloned: DocumentDTO = { ...doc, id: Date.now(), userId: 1, visibility: "PRIVATE", marketStatus: "NONE" };
        mockDocuments.unshift(cloned);
        res({ success: true, message: "Cloned successfully", data: cloned });
      }, 400));
    }
  },

  async submitToMarketplace(id: number): Promise<ApiResponse<DocumentDTO>> {
    try {
      return await docRequest(`/marketplace/documents/${id}/submit`, {
        method: "POST",
        body: JSON.stringify({ note: "Submit for marketplace review" })
      });
    } catch (e) {
      return new Promise((res, rej) => setTimeout(() => {
        const docIndex = mockDocuments.findIndex(d => d.id === id);
        if (docIndex === -1) return rej({ message: "Not found" });
        mockDocuments[docIndex] = { ...mockDocuments[docIndex], visibility: "MARKETPLACE", marketStatus: "PENDING" };
        res({ success: true, message: "Submitted successfully", data: mockDocuments[docIndex] });
      }, 400));
    }
  },

  async reviewMarketplaceDocument(id: number, payload: ReviewDocumentRequest): Promise<ApiResponse<any>> {
    try {
      return await docRequest(`/admin/marketplace/documents/${id}/review`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
    } catch (e) {
      return new Promise((res, rej) => setTimeout(() => {
        const docIndex = mockDocuments.findIndex(d => d.id === id);
        if (docIndex === -1) return rej({ message: "Not found" });
        mockDocuments[docIndex] = { ...mockDocuments[docIndex], marketStatus: payload.voteResult };
        res({
          success: true, message: "Success", data: {
            id: Date.now(), reviewerId: 99, targetType: "DOCUMENT", targetId: id, voteResult: payload.voteResult, createdAt: new Date().toISOString()
          }
        });
      }, 400));
    }
  },

  // ─── 3. WORKSPACE DOCUMENTS ───

  async getWorkspaceDocuments(page = 0, size = 50, keyword = ""): Promise<ApiResponse<PaginatedResponse<DocumentDTO>>> {
    try {
      const res = await docRequest<ApiResponse<PaginatedResponse<DocumentDTO>>>(`/documents?page=${page}&size=${size}&keyword=${keyword}`, { method: "GET" });
      if (!res.data || !res.data.items || res.data.items.length === 0) {
        let docs = mockDocuments.filter(d => d.userId === 1);
        if (keyword) {
          docs = docs.filter(d => d.title.toLowerCase().includes(keyword.toLowerCase()));
        }
        return {
          success: true,
          message: "Success (Mock)",
          data: { items: docs, page, size, totalElements: docs.length, totalPages: 1 }
        };
      }
      return res;
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        let docs = mockDocuments.filter(d => d.userId === 1);
        if (keyword) {
          docs = docs.filter(d => d.title.toLowerCase().includes(keyword.toLowerCase()));
        }
        res({ success: true, message: "Success", data: { items: docs, page, size, totalElements: docs.length, totalPages: 1 } });
      }, 300));
    }
  },

  async createDocumentMetadata(payload: CreateDocumentRequest): Promise<ApiResponse<DocumentDTO>> {
    try {
      return await docRequest(`/documents`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        const newDoc: DocumentDTO = {
          id: Date.now(),
          userId: 1,
          ...payload,
          cloudFilePath: `documents/1/${payload.title}`,
          marketStatus: "NONE",
          downloadCount: 0,
          reviewCount: 0,
          acceptPercentage: 0,
          aiVerdictNote: null,
          processingStatus: "SUCCESS",
          createdAt: new Date().toISOString()
        } as DocumentDTO;
        mockDocuments.unshift(newDoc);
        res({ success: true, message: "Success", data: newDoc });
      }, 400));
    }
  },

  async uploadDocument(file: File, subjectId?: number, title?: string, description?: string, notebookId?: number): Promise<ApiResponse<DocumentDTO>> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (subjectId) formData.append("subjectId", subjectId.toString());
      if (title) formData.append("title", title);
      if (description) formData.append("description", description);
      if (notebookId) formData.append("notebookId", notebookId.toString());

      return await docRequest(`/documents/upload`, {
        method: "POST",
        body: formData
      });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        const parts = file.name.split('.');
        const ext = parts.length > 1 ? parts.pop()?.toLowerCase() || "txt" : "txt";
        
        const newDoc: DocumentDTO = {
          id: Date.now(),
          userId: 1,
          subjectId: subjectId || null,
          title: title || file.name,
          description: description || null,
          fileUrl: `/uploads/${file.name}`,
          cloudFilePath: `documents/1/${file.name}`,
          fileType: ext,
          fileSize: file.size,
          visibility: "PRIVATE",
          marketStatus: "NONE",
          downloadCount: 0,
          reviewCount: 0,
          acceptPercentage: 0,
          aiVerdictNote: null,
          processingStatus: "SUCCESS",
          createdAt: new Date().toISOString()
        };
        mockDocuments.unshift(newDoc);
        res({ success: true, message: "Success", data: newDoc });
      }, 800));
    }
  },

  async getDocumentDetails(id: number): Promise<ApiResponse<DocumentDTO>> {
    try {
      return await docRequest(`/documents/${id}`, { method: "GET" });
    } catch (e) {
      return new Promise((res, rej) => setTimeout(() => {
        const doc = mockDocuments.find(d => d.id === id);
        if (doc) res({ success: true, message: "Success", data: doc });
        else rej({ message: "Not found" });
      }, 200));
    }
  },

  async updateDocument(id: number, payload: Partial<CreateDocumentRequest>): Promise<ApiResponse<DocumentDTO>> {
    try {
      return await docRequest(`/documents/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
    } catch (e) {
      return new Promise((res, rej) => setTimeout(() => {
        const docIndex = mockDocuments.findIndex(d => d.id === id);
        if (docIndex === -1) return rej({ message: "Not found" });
        mockDocuments[docIndex] = { ...mockDocuments[docIndex], ...payload };
        res({ success: true, message: "Success", data: mockDocuments[docIndex] });
      }, 300));
    }
  },

  async deleteDocument(id: number): Promise<ApiResponse<{ deleted: boolean }>> {
    try {
      return await docRequest(`/documents/${id}`, { method: "DELETE" });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        mockDocuments = mockDocuments.filter(d => d.id !== id);
        res({ success: true, message: "Deleted successfully", data: { deleted: true } });
      }, 300));
    }
  },

  // ─── 4. NOTEBOOK DOCUMENTS ───

  async getNotebookDocuments(notebookId: number, page = 0, size = 10): Promise<ApiResponse<PaginatedResponse<DocumentDTO>>> {
    try {
      return await docRequest(`/notebooks/${notebookId}/documents?page=${page}&size=${size}`, { method: "GET" });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        // Mocking: just return all workspace docs for simplicity in demo
        const docs = mockDocuments.filter(d => d.userId === 1);
        res({ success: true, message: "Success", data: { items: docs, page, size, totalElements: docs.length, totalPages: 1 } });
      }, 300));
    }
  },

  async addDocumentToNotebook(notebookId: number, documentId: number): Promise<ApiResponse<DocumentDTO>> {
    try {
      return await docRequest(`/notebooks/${notebookId}/documents/${documentId}`, {
        method: "POST",
        body: JSON.stringify({})
      });
    } catch (e) {
      return new Promise((res, rej) => setTimeout(() => {
        const doc = mockDocuments.find(d => d.id === documentId);
        if (doc) res({ success: true, message: "Success", data: doc });
        else rej({ message: "Not found" });
      }, 300));
    }
  },

  async removeDocumentFromNotebook(notebookId: number, documentId: number): Promise<ApiResponse<{ deleted: boolean }>> {
    try {
      return await docRequest(`/notebooks/${notebookId}/documents/${documentId}`, { method: "DELETE" });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        res({ success: true, message: "Deleted successfully", data: { deleted: true } });
      }, 300));
    }
  },

  // ─── 5. TAGS ───

  async getAllTags(): Promise<ApiResponse<PaginatedResponse<TagDTO>>> {
    try {
      return await docRequest(`/tags`, { method: "GET" });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        res({ success: true, message: "Success", data: { items: mockTags, page: 0, size: 50, totalElements: mockTags.length, totalPages: 1 } });
      }, 200));
    }
  },

  async createTag(payload: CreateTagRequest): Promise<ApiResponse<TagDTO>> {
    try {
      return await docRequest(`/tags`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        const newTag = { id: Date.now(), ...payload };
        mockTags.push(newTag);
        res({ success: true, message: "Success", data: newTag });
      }, 300));
    }
  },

  async getDocumentTags(documentId: number): Promise<ApiResponse<PaginatedResponse<TagDTO>>> {
    try {
      return await docRequest(`/documents/${documentId}/tags`, { method: "GET" });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        res({ success: true, message: "Success", data: { items: mockTags, page: 0, size: 50, totalElements: mockTags.length, totalPages: 1 } });
      }, 200));
    }
  },

  async addTagToDocument(documentId: number, tagId: number): Promise<ApiResponse<any>> {
    try {
      return await docRequest(`/documents/${documentId}/tags/${tagId}`, {
        method: "POST",
        body: JSON.stringify({})
      });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        res({ success: true, message: "Success", data: { documentId, tagId } });
      }, 300));
    }
  },

  async removeTagFromDocument(documentId: number, tagId: number): Promise<ApiResponse<{ deleted: boolean }>> {
    try {
      return await docRequest(`/documents/${documentId}/tags/${tagId}`, { method: "DELETE" });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        res({ success: true, message: "Deleted successfully", data: { deleted: true } });
      }, 300));
    }
  },

  // ─── 6. DOCUMENT SHARE LINK ───

  async createShareLink(documentId: number, payload: { expiresAt?: string | null, allowDownload: boolean }): Promise<ApiResponse<ShareLinkDTO>> {
    try {
      return await docRequest(`/documents/${documentId}/share-link`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
    } catch (e) {
      return new Promise((res, rej) => setTimeout(() => {
        const docIndex = mockDocuments.findIndex(d => d.id === documentId);
        if (docIndex === -1) return rej({ message: "Document not found", errorCode: "DOCUMENT_NOT_FOUND" });
        mockDocuments[docIndex].visibility = "MARKETPLACE"; // Simulate setting public link
        const token = `doc_${Math.random().toString(36).substr(2, 9)}`;
        res({
          success: true,
          message: "Share link created successfully",
          data: {
            documentId,
            title: mockDocuments[docIndex].title,
            visibility: "PUBLIC_LINK",
            shareToken: token,
            shareUrl: `${window.location.origin}/share/documents/${token}`,
            expiresAt: payload.expiresAt || null,
            allowDownload: payload.allowDownload,
            createdAt: new Date().toISOString()
          }
        });
      }, 300));
    }
  },

  async getShareLinkStatus(documentId: number): Promise<ApiResponse<ShareLinkDTO>> {
    try {
      return await docRequest(`/documents/${documentId}/share-link`, { method: "GET" });
    } catch (e) {
      return new Promise((res, rej) => setTimeout(() => {
        const doc = mockDocuments.find(d => d.id === documentId);
        if (!doc) return rej({ message: "Document not found" });
        // Return a mock active link if document exists for demo
        res({
          success: true, message: "Success", data: {
            documentId, title: doc.title, visibility: "PUBLIC_LINK", shareToken: "doc_mock_token_123",
            shareUrl: `${window.location.origin}/share/documents/doc_mock_token_123`, expiresAt: null, allowDownload: true, createdAt: new Date().toISOString()
          }
        });
      }, 300));
    }
  },

  async updateShareLink(documentId: number, payload: { expiresAt?: string | null, allowDownload: boolean, regenerateToken: boolean }): Promise<ApiResponse<ShareLinkDTO>> {
    try {
      return await docRequest(`/documents/${documentId}/share-link`, {
        method: "PATCH",
        body: JSON.stringify(payload)
      });
    } catch (e) {
      return new Promise(res => setTimeout(() => {
        const token = payload.regenerateToken ? `doc_${Math.random().toString(36).substr(2, 9)}` : "doc_mock_token_123";
        res({
          success: true, message: "Share link updated successfully", data: {
            documentId, title: "Updated Document", visibility: "PUBLIC_LINK", shareToken: token,
            shareUrl: `${window.location.origin}/share/documents/${token}`, expiresAt: payload.expiresAt || null, allowDownload: payload.allowDownload, createdAt: new Date().toISOString()
          }
        });
      }, 300));
    }
  },

  async revokeShareLink(documentId: number): Promise<ApiResponse<{ documentId: number, visibility: string, revoked: boolean }>> {
    try {
      return await docRequest(`/documents/${documentId}/share-link`, { method: "DELETE" });
    } catch (e) {
      return new Promise((res, rej) => setTimeout(() => {
        const docIndex = mockDocuments.findIndex(d => d.id === documentId);
        if (docIndex === -1) return rej({ message: "Document not found" });
        mockDocuments[docIndex].visibility = "PRIVATE";
        res({ success: true, message: "Share link revoked successfully", data: { documentId, visibility: "PRIVATE", revoked: true } });
      }, 300));
    }
  },

  async getPublicSharedDocument(shareToken: string): Promise<ApiResponse<SharedDocumentDTO>> {
    try {
      return await docRequest(`/share/documents/${shareToken}`, { method: "GET" });
    } catch (e) {
      return new Promise((res, rej) => setTimeout(() => {
        // Mock successful retrieval
        if (shareToken === "invalid") return rej({ message: "Share link not found", errorCode: "SHARE_LINK_NOT_FOUND" });
        res({
          success: true, message: "Success", data: {
            documentId: 501, title: "Chapter 10 Requirement Specification", description: "Slide SWR302 chương 10",
            subject: { id: 12, code: "SWR302", name: "Software Requirements" }, fileType: "pdf", fileSize: 2457600,
            ownerName: "Anh Khoa", allowDownload: true, downloadUrl: `/api/share/documents/${shareToken}/download`,
            expiresAt: null, createdAt: new Date().toISOString()
          }
        });
      }, 300));
    }
  },

  async downloadSharedDocument(shareToken: string): Promise<ApiResponse<{ documentId: number, fileName: string, fileType: string, fileSize: number, downloadUrl: string, expiresInSeconds: number }>> {
    try {
      return await docRequest(`/share/documents/${shareToken}/download`, { method: "GET" });
    } catch (e) {
      return new Promise((res, rej) => setTimeout(() => {
        if (shareToken === "invalid") return rej({ message: "Share link not found", errorCode: "SHARE_LINK_NOT_FOUND" });
        res({
          success: true, message: "Download URL generated", data: {
            documentId: 501, fileName: "chapter10.pdf", fileType: "pdf", fileSize: 2457600,
            downloadUrl: "/uploads/documents/chapter10.pdf", expiresInSeconds: 300
          }
        });
      }, 300));
    }
  }

};
