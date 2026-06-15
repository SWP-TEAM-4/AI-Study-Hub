import type { ApiResponse } from "./authService";

const BASE_URL = "http://localhost:8080/api/documents";

export type ProcessingStatus = "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED";
export type Visibility = "PRIVATE" | "PUBLIC_LINK" | "MARKETPLACE";
export type MarketStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

export interface PaginationData<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface DocumentItem {
  id: number;
  userId: number;
  subjectId: number | null;
  title: string;
  description: string | null;
  fileUrl: string | null;
  cloudFilePath: string | null;
  fileType: string | null;
  fileSize: number | null;
  visibility: Visibility;
  marketStatus: MarketStatus;
  processingStatus: ProcessingStatus;
  downloadCount: number;
  reviewCount: number;
  acceptPercentage: number | null;
  aiVerdictNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentChunk {
  id: number;
  documentId: number;
  documentTitle?: string;
  chunkIndex: number;
  textContent: string;
  tokenEstimate?: number | null;
  sourcePage?: number | null;
  sourceSection?: string | null;
  vectorId?: string | null;
}

export interface ProcessDocumentRequest {
  chunkSize?: number;
  overlap?: number;
  mockText?: string;
}

export interface ProcessDocumentResponse {
  documentId: number;
  processingStatus: ProcessingStatus;
  chunkCount: number;
  chunks: DocumentChunk[];
  message: string;
}

export interface UploadDocumentRequest {
  file: File;
  subjectId?: number;
  title?: string;
  description?: string;
}

export interface DeleteChunksResponse {
  deleted: boolean;
  deletedCount: number;
  processingStatus: ProcessingStatus;
}

export interface DocumentSearchParams {
  keyword?: string;
  subjectId?: number;
  fileType?: string;
  visibility?: Visibility;
  processingStatus?: ProcessingStatus;
  page?: number;
  size?: number;
  sort?: string;
}

const DOCUMENT_ERROR_MESSAGES: Record<string, string> = {
  DOCUMENT_NOT_FOUND: "Không tìm thấy tài liệu này.",
  DOCUMENT_ACCESS_DENIED: "Bạn không có quyền truy cập tài liệu này.",
  DOCUMENT_ALREADY_PROCESSING: "Tài liệu đang được xử lý. Vui lòng đợi thêm một chút.",
  DOCUMENT_EMPTY_CONTENT: "Tài liệu không có nội dung văn bản để tách chunk.",
  DOCUMENT_PROCESSING_FAILED: "Xử lý tài liệu thất bại.",
  DOCUMENT_NO_FILE: "Tài liệu không có file đính kèm.",
  INVALID_FILE_TYPE: "Định dạng file không được hỗ trợ.",
  FILE_TOO_LARGE: "File vượt quá dung lượng cho phép.",
  TOO_MANY_CHUNKS: "Tài liệu tạo quá nhiều chunk. Hãy giảm kích thước nội dung hoặc tăng chunk size.",
  TEXT_EXTRACTION_FAILED: "Không thể trích xuất nội dung từ tài liệu.",
  UNAUTHORIZED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  ACCESS_DENIED: "Bạn không có quyền thực hiện thao tác này.",
  VALIDATION_ERROR: "Dữ liệu không hợp lệ.",
};

function getToken(): string | null {
  return localStorage.getItem("auth_token");
}

function getAuthHeaders(includeJson = true): HeadersInit {
  const token = getToken();
  return {
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleApiError(response: Response, fallback: string): Promise<never> {
  if (response.status >= 500) {
    throw new Error(`Lỗi hệ thống server (${response.status}). Vui lòng thử lại sau.`);
  }

  let body: ApiResponse<unknown> | null = null;
  try {
    body = await response.json();
  } catch {
    // ignore non-JSON body
  }

  const errorCode = body?.errorCode;
  if (errorCode && DOCUMENT_ERROR_MESSAGES[errorCode]) {
    throw new Error(DOCUMENT_ERROR_MESSAGES[errorCode]);
  }
  if (body?.message) {
    throw new Error(body.message);
  }
  throw new Error(fallback);
}

export async function getMyDocuments(
  params: DocumentSearchParams = {}
): Promise<PaginationData<DocumentItem>> {
  const query = new URLSearchParams();
  if (params.keyword) query.set("keyword", params.keyword);
  if (params.subjectId) query.set("subjectId", String(params.subjectId));
  if (params.fileType) query.set("fileType", params.fileType);
  if (params.visibility) query.set("visibility", params.visibility);
  if (params.processingStatus) query.set("processingStatus", params.processingStatus);
  query.set("page", String(params.page ?? 0));
  query.set("size", String(params.size ?? 20));
  query.set("sort", params.sort ?? "createdAt,desc");

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
  } catch {
    throw new Error("Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng!");
  }

  if (!response.ok) {
    await handleApiError(response, "Không thể tải danh sách tài liệu.");
  }

  const body: ApiResponse<PaginationData<DocumentItem>> = await response.json();
  return body.data!;
}

export async function getDocumentChunks(documentId: string | number): Promise<DocumentChunk[]> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/${documentId}/chunks`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
  } catch {
    throw new Error("Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng!");
  }

  if (!response.ok) {
    await handleApiError(response, "Không thể tải danh sách chunk.");
  }

  const body: ApiResponse<DocumentChunk[]> = await response.json();
  return body.data ?? [];
}

export async function processDocument(
  documentId: string | number,
  request: ProcessDocumentRequest = {}
): Promise<ProcessDocumentResponse> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/${documentId}/process`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    });
  } catch {
    throw new Error("Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng!");
  }

  if (!response.ok) {
    await handleApiError(response, "Xử lý tài liệu thất bại.");
  }

  const body: ApiResponse<ProcessDocumentResponse> = await response.json();
  return body.data!;
}

export async function deleteDocumentChunks(documentId: string | number): Promise<DeleteChunksResponse> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/${documentId}/chunks`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  } catch {
    throw new Error("Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng!");
  }

  if (!response.ok) {
    await handleApiError(response, "Xóa chunk thất bại.");
  }

  const body: ApiResponse<DeleteChunksResponse> = await response.json();
  return body.data!;
}

export async function uploadDocument(request: UploadDocumentRequest): Promise<DocumentItem> {
  const formData = new FormData();
  formData.append("file", request.file);
  if (request.subjectId) formData.append("subjectId", request.subjectId.toString());
  if (request.title) formData.append("title", request.title);
  if (request.description) formData.append("description", request.description);

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/upload`, {
      method: "POST",
      headers: getAuthHeaders(false),
      body: formData,
    });
  } catch {
    throw new Error("Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng!");
  }

  if (!response.ok) {
    await handleApiError(response, "Upload tài liệu thất bại.");
  }

  const body: ApiResponse<DocumentItem> = await response.json();
  return body.data!;
}
