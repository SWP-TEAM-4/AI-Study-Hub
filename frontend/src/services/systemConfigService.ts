import { ApiResponse } from "./types";

const BASE_URL = "/api";

async function sysRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && options.method !== "GET" && options.method !== "DELETE") {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const text = await response.text();
  const result = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw {
      status: response.status,
      message: result.message || "Lỗi giao tiếp API System Config",
      errorCode: result.errorCode || "SYS_CONFIG_ERROR"
    };
  }
  return result;
}

export interface SystemConfigDTO {
  id: number;
  configKey: string;
  configValue: string;
  description?: string;
}

let mockConfigs: SystemConfigDTO[] = [
  { id: 1801, configKey: "MAX_UPLOAD_SIZE_MB", configValue: "50", description: "Dung lượng upload tối đa cho tài liệu" },
  { id: 1802, configKey: "AI_FREE_LIMIT_DAILY", configValue: "10", description: "Số lượt gọi AI miễn phí mỗi ngày" },
  { id: 1803, configKey: "MAINTENANCE_MODE", configValue: "false", description: "Bật chế độ bảo trì hệ thống" }
];

export const systemConfigService = {
  // 1. Admin lấy danh sách cấu hình
  async getAdminConfigs(): Promise<ApiResponse<SystemConfigDTO[]>> {
    try {
      return await sysRequest(`/admin/system-configs`);
    } catch {
      return new Promise((res) => setTimeout(() => {
        res({ success: true, message: "Success", data: [...mockConfigs] });
      }, 300));
    }
  },

  // 2. Admin tạo cấu hình mới
  async createConfig(payload: { configKey: string; configValue: string; description?: string }): Promise<ApiResponse<SystemConfigDTO>> {
    try {
      return await sysRequest(`/admin/system-configs`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
    } catch {
      return new Promise((res) => setTimeout(() => {
        const newCfg: SystemConfigDTO = { id: Date.now(), ...payload };
        mockConfigs.push(newCfg);
        res({ success: true, message: "Success", data: newCfg });
      }, 300));
    }
  },

  // 3. Admin cập nhật cấu hình
  async updateConfig(id: number, payload: { configKey: string; configValue: string; description?: string }): Promise<ApiResponse<SystemConfigDTO>> {
    try {
      return await sysRequest(`/admin/system-configs/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
    } catch {
      return new Promise((res) => setTimeout(() => {
        const idx = mockConfigs.findIndex(c => c.id === id);
        if (idx !== -1) mockConfigs[idx] = { id, ...payload };
        res({ success: true, message: "Success", data: { id, ...payload } });
      }, 300));
    }
  },

  // 4. Admin xóa cấu hình
  async deleteConfig(id: number): Promise<ApiResponse<{ deleted: boolean }>> {
    try {
      return await sysRequest(`/admin/system-configs/${id}`, { method: "DELETE" });
    } catch {
      return new Promise((res) => setTimeout(() => {
        mockConfigs = mockConfigs.filter(c => c.id !== id);
        res({ success: true, message: "Deleted successfully", data: { deleted: true } });
      }, 300));
    }
  },

  // 5. Lấy danh sách cấu hình hệ thống công khai
  async getPublicConfigs(): Promise<ApiResponse<SystemConfigDTO[]>> {
    try {
      return await sysRequest(`/system-configs/public`);
    } catch {
      return new Promise((res) => setTimeout(() => {
        // Chỉ trả về những config không nhạy cảm (vd: loại trừ khóa bí mật)
        res({ success: true, message: "Success", data: mockConfigs.filter(c => !c.configKey.includes("SECRET")) });
      }, 200));
    }
  }
};
