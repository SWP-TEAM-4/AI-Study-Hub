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
  clonedFromId: number | null;
  createdAt: string;
  updatedAt: string;
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
  chunkSize?: number;
  overlap?: number;
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
  id: number;
  documentId: number;
  ownerUserId: number;
  shareToken: string;
  shareUrl: string;
  downloadUrl: string;
  allowPreview: boolean;
  allowDownload: boolean;
  expiresAt: string | null;
  accessCount: number;
  lastAccessedAt: string | null;
  createdAt: string;
  updatedAt: string;
  documentVisibility: "PRIVATE" | "PUBLIC_LINK";
  enabled: boolean;
  isEnabled: boolean;
}

export interface CreateShareLinkRequest {
  allowPreview?: boolean;
  allowDownload?: boolean;
  expiresAt?: string | null;
}

export interface UpdateShareLinkRequest {
  isEnabled?: boolean;
  allowPreview?: boolean;
  allowDownload?: boolean;
  expiresAt?: string | null;
}

export interface SharedDocumentDTO {
  title: string;
  description: string | null;
  subjectId: number | null;
  fileType: string;
  fileSize: number;
  allowDownload: boolean;
  downloadUrl: string;
  expiresAt: string | null;
  previewText: string | null;
  previewSourcePage: number | null;
  createdAt: string;
}

// ─── BASE REQUEST ────────────────────────────────────────────────────────────

const BASE_URL = "/api";

async function docRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const headers = new Headers(options.headers);
  if (token) {
    const cleanToken = token.replace(/['"]+/g, "");
    headers.set("Authorization", `Bearer ${cleanToken}`);
  }
  if (
    !headers.has("Content-Type") &&
    options.method !== "GET" &&
    options.method !== "DELETE" &&
    !(options.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const text = await response.text();
  let result: any = {};
  if (text && text.trim().length > 0) {
    try {
      result = JSON.parse(text);
    } catch {
      result = { message: text.substring(0, 200) };
    }
  }

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
      errorCode: result.errorCode || "DOC_ERROR",
    };
  }
  return result;
}

// ─── SERVICE IMPLEMENTATION ──────────────────────────────────────────────────

export const documentService = {
  // ─── 1. CHUNKS (RAG) ───

  async deleteDocumentChunks(documentId: number): Promise<ApiResponse<{ deleted: boolean }>> {
    return await docRequest(`/documents/${documentId}/chunks`, { method: "DELETE" });
  },

  async getDocumentChunks(documentId: number): Promise<ApiResponse<ChunkDTO[]>> {
    return await docRequest(`/documents/${documentId}/chunks`, { method: "GET" });
  },

  async processDocumentChunks(
    documentId: number,
    payload: ProcessDocumentRequest
  ): Promise<ApiResponse<any>> {
    return await docRequest(`/documents/${documentId}/process`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // ─── 2. COMMUNITY & MARKETPLACE ───

  async getCommunityDocuments(
    page = 0,
    size = 10,
    keyword = ""
  ): Promise<ApiResponse<PaginatedResponse<DocumentDTO>>> {
    return await docRequest(`/community/documents?page=${page}&size=${size}&keyword=${keyword}`, {
      method: "GET",
    });
  },

  async getTopCommunityDocuments(): Promise<ApiResponse<PaginatedResponse<DocumentDTO>>> {
    return await docRequest(`/community/documents/top`, { method: "GET" });
  },

  async getCommunityDocumentDetails(id: number): Promise<ApiResponse<DocumentDTO>> {
    return await docRequest(`/community/documents/${id}`, { method: "GET" });
  },

  async getMarketplaceDocuments(
    page = 0,
    size = 10,
    keyword = ""
  ): Promise<ApiResponse<PaginatedResponse<MarketplaceDocumentDTO>>> {
    return await docRequest(`/marketplace/documents?page=${page}&size=${size}&keyword=${keyword}`, {
      method: "GET",
    });
  },

  async cloneMarketplaceDocument(
    id: number,
    targetNotebookId?: number
  ): Promise<ApiResponse<DocumentDTO>> {
    return await docRequest(`/marketplace/documents/${id}/clone`, {
      method: "POST",
      body: JSON.stringify({ targetNotebookId }),
    });
  },

  async submitToMarketplace(id: number): Promise<ApiResponse<DocumentDTO>> {
    return await docRequest(`/marketplace/documents/${id}/submit`, {
      method: "POST",
      body: JSON.stringify({ note: "Submit for marketplace review" }),
    });
  },

  async reviewMarketplaceDocument(
    id: number,
    payload: ReviewDocumentRequest
  ): Promise<ApiResponse<any>> {
    return await docRequest(`/admin/marketplace/documents/${id}/review`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // ─── 3. WORKSPACE DOCUMENTS ───

  async getWorkspaceDocuments(
    page = 0,
    size = 50,
    keyword = "",
    options?: {
      subjectId?: number;
      fileType?: string;
      visibility?: string;
      processingStatus?: string;
      sort?: string;
    }
  ): Promise<ApiResponse<PaginatedResponse<DocumentDTO>>> {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("size", String(size));
    if (keyword) params.set("keyword", keyword);
    if (options?.subjectId != null) params.set("subjectId", String(options.subjectId));
    if (options?.fileType) params.set("fileType", options.fileType);
    if (options?.visibility) params.set("visibility", options.visibility);
    if (options?.processingStatus) params.set("processingStatus", options.processingStatus);
    if (options?.sort) params.set("sort", options.sort);
    return await docRequest<ApiResponse<PaginatedResponse<DocumentDTO>>>(`/documents?${params.toString()}`, {
      method: "GET",
    });
  },

  async createDocumentMetadata(payload: CreateDocumentRequest): Promise<ApiResponse<DocumentDTO>> {
    return await docRequest(`/documents`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async uploadDocument(
    file: File,
    subjectId?: number,
    title?: string,
    description?: string,
    notebookId?: number
  ): Promise<ApiResponse<DocumentDTO>> {
    const formData = new FormData();
    formData.append("file", file);
    if (subjectId) formData.append("subjectId", subjectId.toString());
    if (title) formData.append("title", title);
    if (description) formData.append("description", description);
    if (notebookId) formData.append("notebookId", notebookId.toString());

    return await docRequest(`/documents/upload`, {
      method: "POST",
      body: formData,
    });
  },

  async getDocumentDetails(id: number): Promise<ApiResponse<DocumentDTO>> {
    return await docRequest(`/documents/${id}`, { method: "GET" });
  },

  async updateDocument(id: number, payload: Partial<CreateDocumentRequest>): Promise<ApiResponse<DocumentDTO>> {
    return await docRequest(`/documents/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async deleteDocument(id: number): Promise<ApiResponse<{ deleted: boolean }>> {
    return await docRequest(`/documents/${id}`, { method: "DELETE" });
  },

  // ─── 4. NOTEBOOK DOCUMENTS ───

  async getNotebookDocuments(
    notebookId: number,
    page = 0,
    size = 10
  ): Promise<ApiResponse<PaginatedResponse<DocumentDTO>>> {
    return await docRequest(`/notebooks/${notebookId}/documents?page=${page}&size=${size}`, { method: "GET" });
  },

  async addDocumentToNotebook(notebookId: number, documentId: number): Promise<ApiResponse<DocumentDTO>> {
    return await docRequest(`/notebooks/${notebookId}/documents/${documentId}`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  async removeDocumentFromNotebook(
    notebookId: number,
    documentId: number
  ): Promise<ApiResponse<{ deleted: boolean }>> {
    return await docRequest(`/notebooks/${notebookId}/documents/${documentId}`, { method: "DELETE" });
  },

  // ─── 5. TAGS ───

  async getAllTags(): Promise<ApiResponse<TagDTO[]>> {
    return await docRequest(`/tags`, { method: "GET" });
  },

  async createTag(payload: CreateTagRequest): Promise<ApiResponse<TagDTO>> {
    return await docRequest(`/tags`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getDocumentTags(documentId: number): Promise<ApiResponse<TagDTO[]>> {
    return await docRequest(`/documents/${documentId}/tags`, { method: "GET" });
  },

  async addTagToDocument(documentId: number, tagId: number): Promise<ApiResponse<any>> {
    return await docRequest(`/documents/${documentId}/tags/${tagId}`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  async removeTagFromDocument(documentId: number, tagId: number): Promise<ApiResponse<{ deleted: boolean }>> {
    return await docRequest(`/documents/${documentId}/tags/${tagId}`, { method: "DELETE" });
  },

  // ─── 6. DOCUMENT SHARE LINK ───

  async createShareLink(documentId: number, payload: CreateShareLinkRequest): Promise<ApiResponse<ShareLinkDTO>> {
    return await docRequest(`/documents/${documentId}/share-link`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getShareLinkStatus(documentId: number): Promise<ApiResponse<ShareLinkDTO>> {
    return await docRequest(`/documents/${documentId}/share-link`, { method: "GET" });
  },

  async updateShareLink(
    documentId: number,
    payload: UpdateShareLinkRequest & { regenerateToken?: boolean }
  ): Promise<ApiResponse<ShareLinkDTO>> {
    return await docRequest(`/documents/${documentId}/share-link`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async revokeShareLink(documentId: number): Promise<ApiResponse<{ deleted: boolean; documentVisibility: string }>> {
    return await docRequest(`/documents/${documentId}/share-link`, { method: "DELETE" });
  },

  async getPublicSharedDocument(shareToken: string): Promise<ApiResponse<SharedDocumentDTO>> {
    return await docRequest(`/share/documents/${shareToken}`, { method: "GET" });
  },

  async downloadSharedDocument(
    shareToken: string
  ): Promise<
    ApiResponse<{
      documentId: number;
      fileName: string;
      fileType: string;
      fileSize: number;
      downloadUrl: string;
      expiresInSeconds: number;
    }>
  > {
    return await docRequest(`/share/documents/${shareToken}/download`, { method: "GET" });
  },
};
