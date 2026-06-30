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
  visibility: "PRIVATE" | "PUBLIC_LINK" | "MARKETPLACE";
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
  type: "CUSTOM" | "SYSTEM" | string;
  color: string;
}

export interface CreateDocumentRequest {
  subjectId?: number;
  title: string;
  description?: string;
  fileUrl?: string;
  cloudFilePath?: string;
  fileType: string;
  fileSize: number;
  visibility?: "PRIVATE" | "PUBLIC_LINK" | "MARKETPLACE";
}

export interface UpdateDocumentRequest {
  subjectId?: number | null;
  title?: string;
  description?: string | null;
  visibility?: "PRIVATE" | "PUBLIC_LINK" | "MARKETPLACE";
}

export interface ProcessDocumentRequest {
  chunkSize: number;
  overlap: number;
}

export interface ProcessDocumentResponse {
  documentId: number;
  processingStatus: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED";
  chunkCount: number;
  chunks?: ChunkDTO[];
  message?: string;
}

export interface CreateTagRequest {
  name: string;
  type: "CUSTOM" | "SYSTEM" | string;
  color: string;
}

export interface ReviewDocumentRequest {
  voteResult: "APPROVED" | "REJECTED";
  reviewNote?: string;
}

export interface ShareLinkDTO {
  id?: number;
  documentId: number;
  ownerUserId?: number;
  shareToken: string;
  shareUrl: string;
  downloadUrl?: string | null;
  isEnabled: boolean;
  allowPreview: boolean;
  allowDownload: boolean;
  expiresAt: string | null;
  accessCount?: number;
  lastAccessedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  documentVisibility: "PRIVATE" | "PUBLIC_LINK" | "MARKETPLACE";
}

export interface SharedDocumentDTO {
  documentId: number | null;
  title: string;
  description: string | null;
  subjectId: number | null;
  fileType: string;
  fileSize: number;
  allowDownload: boolean;
  downloadUrl: string;
  expiresAt: string | null;
  createdAt: string;
  previewText?: string | null;
  previewSourcePage?: number | null;
}

type SpringPage<T> = {
  content?: T[];
  number?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
};

type BackendShareLinkResponse = {
  id?: number;
  documentId: number;
  ownerUserId?: number;
  shareToken: string;
  shareUrl: string;
  downloadUrl?: string | null;
  isEnabled?: boolean;
  allowPreview?: boolean;
  allowDownload?: boolean;
  expiresAt?: string | null;
  accessCount?: number;
  lastAccessedAt?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
  documentVisibility?: DocumentDTO["visibility"];
};

export type DocumentSearchFilters = {
  subjectId?: number;
  fileType?: string;
  visibility?: DocumentDTO["visibility"];
  processingStatus?: DocumentDTO["processingStatus"];
  sort?: string;
};

// ─── BASE REQUEST ────────────────────────────────────────────────────────────

const BASE_URL = "/api";

async function docRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const headers = new Headers(options.headers);
  if (token) {
    const cleanToken = token.replace(/['"]+/g, "");
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
      errorCode: result.errorCode || "DOC_ERROR",
    };
  }
  return result;
}

function normalizePaginatedResponse<T>(
  response: ApiResponse<PaginatedResponse<T> | SpringPage<T> | T[]>,
  page = 0,
  size = 50,
): ApiResponse<PaginatedResponse<T>> {
  const data = response.data as any;

  if (Array.isArray(data)) {
    return {
      ...response,
      data: { items: data, page, size, totalElements: data.length, totalPages: size ? Math.ceil(data.length / size) : 1 },
    };
  }

  if (Array.isArray(data?.items)) {
    return response as ApiResponse<PaginatedResponse<T>>;
  }

  if (Array.isArray(data?.content)) {
    return {
      ...response,
      data: {
        items: data.content,
        page: data.number ?? page,
        size: data.size ?? size,
        totalElements: data.totalElements ?? data.content.length,
        totalPages: data.totalPages ?? 1,
      },
    };
  }

  return {
    ...response,
    data: { items: [], page, size, totalElements: 0, totalPages: 0 },
  };
}

function normalizeShareLink(data: BackendShareLinkResponse): ShareLinkDTO {
  return {
    id: data.id,
    documentId: data.documentId,
    ownerUserId: data.ownerUserId,
    shareToken: data.shareToken,
    shareUrl: data.shareUrl,
    downloadUrl: data.downloadUrl ?? null,
    isEnabled: data.isEnabled ?? true,
    allowPreview: data.allowPreview ?? true,
    allowDownload: data.allowDownload ?? true,
    expiresAt: data.expiresAt ?? null,
    accessCount: data.accessCount,
    lastAccessedAt: data.lastAccessedAt ?? null,
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? null,
    documentVisibility: data.documentVisibility ?? "PRIVATE",
  };
}

// ─── SERVICE IMPLEMENTATION ──────────────────────────────────────────────────

export const documentService = {
  // ─── 1. CHUNKS (RAG) ───

  async deleteDocumentChunks(documentId: number): Promise<ApiResponse<{ deleted: boolean }>> {
    const res = await docRequest<ApiResponse<{ deleted?: boolean } | boolean | null>>(`/documents/${documentId}/chunks`, { method: "DELETE" });
    return {
      success: res.success,
      message: res.message,
      data: typeof res.data === "boolean" ? { deleted: res.data } : { deleted: res.data?.deleted ?? true },
    };
  },

  async getDocumentChunks(documentId: number): Promise<ApiResponse<ChunkDTO[]>> {
    return docRequest(`/documents/${documentId}/chunks`, { method: "GET" });
  },

  async processDocumentChunks(
    documentId: number,
    payload: ProcessDocumentRequest = { chunkSize: 800, overlap: 120 },
  ): Promise<ApiResponse<ProcessDocumentResponse>> {
    return docRequest(`/documents/${documentId}/process`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // ─── 2. COMMUNITY & MARKETPLACE ───

  async getCommunityDocuments(page = 0, size = 10, keyword = ""): Promise<ApiResponse<PaginatedResponse<DocumentDTO>>> {
    const query = new URLSearchParams({ page: String(page), size: String(size), sort: "latest" });
    if (keyword.trim()) query.set("keyword", keyword.trim());
    const res = await docRequest<ApiResponse<PaginatedResponse<DocumentDTO> | SpringPage<DocumentDTO>>>(`/community/documents?${query.toString()}`, { method: "GET" });
    return normalizePaginatedResponse(res, page, size);
  },

  async getTopCommunityDocuments(): Promise<ApiResponse<PaginatedResponse<DocumentDTO>>> {
    const res = await docRequest<ApiResponse<DocumentDTO[]>>(`/community/documents/top`, { method: "GET" });
    return normalizePaginatedResponse(res, 0, 5);
  },

  async getCommunityDocumentDetails(id: number): Promise<ApiResponse<DocumentDTO>> {
    return docRequest(`/community/documents/${id}`, { method: "GET" });
  },

  async getMarketplaceDocuments(page = 0, size = 10, keyword = ""): Promise<ApiResponse<PaginatedResponse<MarketplaceDocumentDTO>>> {
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    if (keyword.trim()) query.set("keyword", keyword.trim());
    const res = await docRequest<ApiResponse<PaginatedResponse<MarketplaceDocumentDTO> | SpringPage<MarketplaceDocumentDTO>>>(`/marketplace/documents?${query.toString()}`, { method: "GET" });
    return normalizePaginatedResponse(res, page, size);
  },

  async cloneMarketplaceDocument(id: number, targetNotebookId?: number): Promise<ApiResponse<DocumentDTO>> {
    return docRequest(`/marketplace/documents/${id}/clone`, {
      method: "POST",
      body: JSON.stringify({ targetNotebookId }),
    });
  },

  async submitToMarketplace(id: number, note = "Submit for marketplace review"): Promise<ApiResponse<DocumentDTO>> {
    return docRequest(`/marketplace/documents/${id}/submit`, {
      method: "POST",
      body: JSON.stringify({ note }),
    });
  },

  async reviewMarketplaceDocument(id: number, payload: ReviewDocumentRequest): Promise<ApiResponse<any>> {
    return docRequest(`/reviewer/marketplace/DOCUMENT/${id}/vote`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // ─── 3. WORKSPACE DOCUMENTS ───

  async getWorkspaceDocuments(
    page = 0,
    size = 50,
    keyword = "",
    filters: DocumentSearchFilters = {},
  ): Promise<ApiResponse<PaginatedResponse<DocumentDTO>>> {
    const query = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sort: filters.sort ?? "createdAt,desc",
    });
    if (keyword.trim()) query.set("keyword", keyword.trim());
    if (filters.subjectId) query.set("subjectId", String(filters.subjectId));
    if (filters.fileType) query.set("fileType", filters.fileType);
    if (filters.visibility) query.set("visibility", filters.visibility);
    if (filters.processingStatus) query.set("processingStatus", filters.processingStatus);

    const res = await docRequest<ApiResponse<PaginatedResponse<DocumentDTO>>>(`/documents?${query.toString()}`, { method: "GET" });
    return normalizePaginatedResponse(res, page, size);
  },

  async createDocumentMetadata(payload: CreateDocumentRequest): Promise<ApiResponse<DocumentDTO>> {
    return docRequest(`/documents`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async uploadDocument(file: File, subjectId?: number, title?: string, description?: string, notebookId?: number): Promise<ApiResponse<DocumentDTO>> {
    const formData = new FormData();
    formData.append("file", file);
    if (subjectId) formData.append("subjectId", subjectId.toString());
    if (title) formData.append("title", title);
    if (description) formData.append("description", description);
    if (notebookId) formData.append("notebookId", notebookId.toString());

    return docRequest(`/documents/upload`, {
      method: "POST",
      body: formData,
    });
  },

  async getDocumentDetails(id: number): Promise<ApiResponse<DocumentDTO>> {
    return docRequest(`/documents/${id}`, { method: "GET" });
  },

  async updateDocument(id: number, payload: UpdateDocumentRequest): Promise<ApiResponse<DocumentDTO>> {
    return docRequest(`/documents/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async deleteDocument(id: number): Promise<ApiResponse<{ deleted: boolean }>> {
    const res = await docRequest<ApiResponse<boolean | { deleted?: boolean } | null>>(`/documents/${id}`, { method: "DELETE" });
    return {
      success: res.success,
      message: res.message,
      data: typeof res.data === "boolean" ? { deleted: res.data } : { deleted: res.data?.deleted ?? true },
    };
  },

  // ─── 4. NOTEBOOK DOCUMENTS ───

  async getNotebookDocuments(notebookId: number, page = 0, size = 10): Promise<ApiResponse<PaginatedResponse<DocumentDTO>>> {
    const res = await docRequest<ApiResponse<PaginatedResponse<DocumentDTO>>>(`/notebooks/${notebookId}/documents?page=${page}&size=${size}&sort=newest`, { method: "GET" });
    return normalizePaginatedResponse(res, page, size);
  },

  async addDocumentToNotebook(notebookId: number, documentId: number): Promise<ApiResponse<DocumentDTO>> {
    return docRequest(`/notebooks/${notebookId}/documents/${documentId}`, { method: "POST" });
  },

  async removeDocumentFromNotebook(notebookId: number, documentId: number): Promise<ApiResponse<{ deleted: boolean }>> {
    const res = await docRequest<ApiResponse<{ deleted?: boolean } | boolean | null>>(`/notebooks/${notebookId}/documents/${documentId}`, { method: "DELETE" });
    return {
      success: res.success,
      message: res.message,
      data: typeof res.data === "boolean" ? { deleted: res.data } : { deleted: res.data?.deleted ?? true },
    };
  },

  // ─── 5. TAGS ───

  async getAllTags(): Promise<ApiResponse<PaginatedResponse<TagDTO>>> {
    const res = await docRequest<ApiResponse<TagDTO[] | PaginatedResponse<TagDTO>>>(`/tags`, { method: "GET" });
    return normalizePaginatedResponse(res, 0, 50);
  },

  async createTag(payload: CreateTagRequest): Promise<ApiResponse<TagDTO>> {
    return docRequest(`/tags`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getDocumentTags(documentId: number): Promise<ApiResponse<PaginatedResponse<TagDTO>>> {
    const res = await docRequest<ApiResponse<TagDTO[] | PaginatedResponse<TagDTO>>>(`/documents/${documentId}/tags`, { method: "GET" });
    return normalizePaginatedResponse(res, 0, 50);
  },

  async addTagToDocument(documentId: number, tagId: number): Promise<ApiResponse<any>> {
    return docRequest(`/documents/${documentId}/tags/${tagId}`, { method: "POST" });
  },

  async removeTagFromDocument(documentId: number, tagId: number): Promise<ApiResponse<{ deleted: boolean }>> {
    const res = await docRequest<ApiResponse<unknown>>(`/documents/${documentId}/tags/${tagId}`, { method: "DELETE" });
    return { success: res.success, message: res.message, data: { deleted: true } };
  },

  // ─── 6. DOCUMENT SHARE LINK ───

  async createShareLink(documentId: number, payload: { expiresAt?: string | null; allowDownload: boolean; allowPreview?: boolean }): Promise<ApiResponse<ShareLinkDTO>> {
    const res = await docRequest<ApiResponse<BackendShareLinkResponse>>(`/documents/${documentId}/share-link`, {
      method: "POST",
      body: JSON.stringify({
        allowPreview: payload.allowPreview ?? true,
        allowDownload: payload.allowDownload,
        expiresAt: payload.expiresAt ?? null,
      }),
    });
    return { ...res, data: normalizeShareLink(res.data) };
  },

  async getShareLinkStatus(documentId: number): Promise<ApiResponse<ShareLinkDTO>> {
    const res = await docRequest<ApiResponse<BackendShareLinkResponse>>(`/documents/${documentId}/share-link`, { method: "GET" });
    return { ...res, data: normalizeShareLink(res.data) };
  },

  async updateShareLink(documentId: number, payload: { expiresAt?: string | null; allowDownload: boolean; allowPreview?: boolean; isEnabled?: boolean }): Promise<ApiResponse<ShareLinkDTO>> {
    const res = await docRequest<ApiResponse<BackendShareLinkResponse>>(`/documents/${documentId}/share-link`, {
      method: "PATCH",
      body: JSON.stringify({
        isEnabled: payload.isEnabled ?? true,
        allowPreview: payload.allowPreview ?? true,
        allowDownload: payload.allowDownload,
        expiresAt: payload.expiresAt ?? null,
      }),
    });
    return { ...res, data: normalizeShareLink(res.data) };
  },

  async revokeShareLink(documentId: number): Promise<ApiResponse<{ deleted: boolean; documentVisibility: string }>> {
    const res = await docRequest<ApiResponse<{ deleted?: boolean; documentVisibility?: string }>>(`/documents/${documentId}/share-link`, { method: "DELETE" });
    return {
      success: res.success,
      message: res.message,
      data: {
        deleted: res.data?.deleted ?? true,
        documentVisibility: res.data?.documentVisibility ?? "PRIVATE",
      },
    };
  },

  async getPublicSharedDocument(shareToken: string): Promise<ApiResponse<SharedDocumentDTO>> {
    const res = await docRequest<ApiResponse<any>>(`/share/documents/${shareToken}`, { method: "GET" });
    const data = res.data;
    return {
      ...res,
      data: {
        documentId: data.documentId ?? null,
        title: data.title,
        description: data.description ?? null,
        subjectId: data.subjectId ?? null,
        fileType: data.fileType,
        fileSize: data.fileSize,
        allowDownload: data.allowDownload,
        downloadUrl: data.downloadUrl || `/api/share/documents/${shareToken}/download`,
        expiresAt: data.expiresAt ?? null,
        createdAt: data.createdAt,
        previewText: data.previewText ?? null,
        previewSourcePage: data.previewSourcePage ?? null,
      },
    };
  },

  async downloadSharedDocument(shareToken: string): Promise<ApiResponse<{ fileName: string; fileType: string; fileSize: number; downloadUrl: string }>> {
    const response = await fetch(`${BASE_URL}/share/documents/${shareToken}/download`, { method: "GET" });
    if (!response.ok) {
      let message = "Không thể tải tài liệu chia sẻ";
      let errorCode = "SHARED_DOCUMENT_DOWNLOAD_ERROR";
      try {
        const result = JSON.parse(await response.text());
        message = result.message || message;
        errorCode = result.errorCode || errorCode;
      } catch {
        // Ignore parsing errors for binary/empty responses.
      }
      throw {
        status: response.status,
        message,
        errorCode,
      };
    }

    const blob = await response.blob();
    const disposition = response.headers.get("Content-Disposition") || "";
    const fileNameMatch = disposition.match(/filename=\"?([^"]+)\"?/i);
    const fileName = fileNameMatch?.[1] || "document";
    const downloadUrl = URL.createObjectURL(blob);

    return {
      success: true,
      message: "Download ready",
      data: {
        fileName,
        fileType: blob.type,
        fileSize: blob.size,
        downloadUrl,
      },
    };
  },
};
