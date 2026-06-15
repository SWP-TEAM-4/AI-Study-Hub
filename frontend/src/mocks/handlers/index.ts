// ─────────────────────────────────────────────────────────────────────────────
// handlers/index.ts – Export tất cả mock handlers
// ─────────────────────────────────────────────────────────────────────────────
//
// KIẾN TRÚC 2 TẦNG:
// ─────────────────────────────────────────────────────────────────────────────
//
// 1. CUSTOM HANDLERS (ưu tiên cao hơn)
//    - authHandlers, quizHandlers, userHandlers
//    - Viết tay, có logic xử lý thông minh (validate, filter, paginate, CRUD)
//    - Dùng cho những API mà frontend hiện tại ĐANG GỌI
//
// 2. GENERATED HANDLERS (fallback)
//    - Auto-generated từ OpenAPI JSON bằng script generateMswHandlers.cjs
//    - Trả mock data cứng từ file contract
//    - Dùng cho những API mà FE SẼ gọi trong tương lai
//
// ĐẶT CUSTOM TRƯỚC GENERATED → MSW sẽ match handler đầu tiên tìm thấy
// ─────────────────────────────────────────────────────────────────────────────

import { authHandlers } from "./authHandlers";
import { quizHandlers } from "./quizHandlers";
import { userHandlers } from "./userHandlers";
import { generatedHandlers } from "../generated/handlers";

export const handlers = [
  // ─── Custom handlers (có logic thông minh) ────────────────────────────────
  // Đặt TRƯỚC để override generated handlers cho cùng endpoint
  ...authHandlers,
  ...quizHandlers,
  ...userHandlers,

  // ─── Generated handlers (mock data cứng từ OpenAPI contract) ──────────────
  // Fallback cho TẤT CẢ 154 endpoints
  ...generatedHandlers,
];
