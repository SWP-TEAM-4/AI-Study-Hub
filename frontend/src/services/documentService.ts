import { ApiResponse, PaginatedResponse } from "./types";

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface ChunkDTO {
  id: number;
  documentId: number;
  documentTitle?: string | null;
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
  clonedFromId?: number | null;
  processingStatus: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED";
  createdAt: string;
  updatedAt?: string | null;
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

export interface UpdateDocumentChunkRequest {
  textContent: string;
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
  previewText?: string | null;
  previewSourcePage?: number | null;
  createdAt: string;
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
    const cleanToken = token.replace(/['\"]+/g, "");
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
  try {
    result = text ? JSON.parse(text) : {};
  } catch {
    if (!response.ok) {
      throw { status: response.status, message: text || "Backend trả về dữ liệu không hợp lệ", errorCode: "INVALID_RESPONSE" };
    }
    throw { status: response.status, message: "Backend trả về JSON không hợp lệ", errorCode: "INVALID_RESPONSE" };
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
  const frontendShareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/share/documents/${data.shareToken}`
    : `/share/documents/${data.shareToken}`;
  return {
    id: data.id,
    documentId: data.documentId,
    ownerUserId: data.ownerUserId,
    shareToken: data.shareToken,
    shareUrl: frontendShareUrl,
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

const DOWNLOAD_MIME_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  txt: "text/plain",
};

function normalizeDownloadExtension(fileType?: string): string {
  return (fileType || "").toLowerCase().replace(/^\./, "").trim();
}

function fallbackDownloadName(title?: string, fileType?: string): string {
  const extension = normalizeDownloadExtension(fileType);
  const baseName = (title || "document").trim() || "document";
  if (!extension || baseName.toLowerCase().endsWith(`.${extension}`)) return baseName;
  return `${baseName}.${extension}`;
}

function contentDispositionFileName(disposition: string): string | null {
  const encodedMatch = disposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (encodedMatch?.[1]) {
    try {
      return decodeURIComponent(encodedMatch[1].trim().replace(/^"|"$/g, ""));
    } catch {
      // Fall through to the regular filename parameter.
    }
  }
  const plainMatch = disposition.match(/filename\s*=\s*"([^"]+)"/i)
    || disposition.match(/filename\s*=\s*([^;]+)/i);
  return plainMatch?.[1]?.trim().replace(/^"|"$/g, "") || null;
}

async function createDownload(
  response: Response,
  fallbackTitle?: string,
  fallbackFileType?: string,
): Promise<{ blobUrl: string; fileName: string; fileType: string; fileSize: number }> {
  const extension = normalizeDownloadExtension(fallbackFileType);
  const contentType = (response.headers.get("Content-Type") || "").split(";")[0].trim().toLowerCase();
  const buffer = await response.arrayBuffer();

  if (buffer.byteLength === 0) {
    throw { status: response.status, message: "Backend trả về file rỗng", errorCode: "EMPTY_DOCUMENT_FILE" };
  }

  if (contentType === "application/json" || contentType === "text/html") {
    const body = new TextDecoder().decode(buffer);
    let message = "Backend không trả về dữ liệu file hợp lệ";
    try { message = JSON.parse(body).message || message; } catch { /* Keep the safe message. */ }
    throw { status: response.status, message, errorCode: "INVALID_DOCUMENT_FILE" };
  }

  if (extension === "pdf" || contentType === "application/pdf") {
    const signature = new TextDecoder("ascii").decode(buffer.slice(0, 5));
    if (signature !== "%PDF-") {
      throw { status: response.status, message: "Dữ liệu nhận được không phải file PDF hợp lệ", errorCode: "INVALID_PDF_FILE" };
    }
  }

  const fallbackName = fallbackDownloadName(fallbackTitle, extension);
  const headerName = contentDispositionFileName(response.headers.get("Content-Disposition") || "");
  const fileName = extension && headerName && !headerName.toLowerCase().endsWith(`.${extension}`)
    ? fallbackName
    : (headerName || fallbackName);
  const blobType = contentType || DOWNLOAD_MIME_BY_EXTENSION[extension] || "application/octet-stream";
  const blob = new Blob([buffer], { type: blobType });

  return {
    blobUrl: URL.createObjectURL(blob),
    fileName,
    fileType: blob.type,
    fileSize: blob.size,
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

  async updateDocumentChunk(
    documentId: number,
    chunkId: number,
    payload: UpdateDocumentChunkRequest,
  ): Promise<ApiResponse<ChunkDTO>> {
    return docRequest(`/documents/${documentId}/chunks/${chunkId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
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
    const response = await docRequest<ApiResponse<DocumentDTO>>(`/documents/upload`, {
      method: "POST",
      body: formData,
    });

    // Controller hiện tại chưa nhận notebookId trong multipart; gắn bằng API
    // NotebookDocument để cùng một luồng vẫn hoạt động đúng contract.
    if (notebookId && response.data?.id) {
      await docRequest(`/notebooks/${notebookId}/documents/${response.data.id}`, { method: "POST" });
    }
    return response;
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

  async downloadDocument(id: number, fallbackTitle?: string, fallbackFileType?: string): Promise<{ blobUrl: string; fileName: string }> {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const headers = new Headers();
    if (token) headers.set("Authorization", `Bearer ${token.replace(/['\\"]+/g, "")}`);
    const response = await fetch(`${BASE_URL}/documents/${id}/download`, { method: "GET", headers });
    if (!response.ok) {
      let result: any = {};
      try { result = JSON.parse(await response.text()); } catch { /* binary/empty error */ }
      throw { status: response.status, message: result.message || "Không thể tải tài liệu", errorCode: result.errorCode || "DOCUMENT_DOWNLOAD_ERROR" };
    }
    const download = await createDownload(response, fallbackTitle, fallbackFileType);
    return { blobUrl: download.blobUrl, fileName: download.fileName };
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

  async downloadSharedDocument(shareToken: string, fallbackTitle?: string, fallbackFileType?: string): Promise<ApiResponse<{ fileName: string; fileType: string; fileSize: number; downloadUrl: string }>> {
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

    const download = await createDownload(response, fallbackTitle, fallbackFileType);

    return {
      success: true,
      message: "Download ready",
      data: {
        fileName: download.fileName,
        fileType: download.fileType,
        fileSize: download.fileSize,
        downloadUrl: download.blobUrl,
      },
    };
  },
};
