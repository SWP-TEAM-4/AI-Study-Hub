"use client";

import { db } from "./mockDatabase";
import { safeParseJson } from "../utils/safeParseJson";

const LATENCY = 400; // ms

export async function mockRequest<T>(endpoint: string, options: RequestInit = {}): Promise<{ success: boolean; message: string; data: T }> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                const method = options.method || "GET";
                const body = safeParseJson<any>(options.body as string, null);

                // ─── ROUTING USER SCOPE ──────────────────────────────────────────────
                if (endpoint.startsWith("/admin/users")) {
                    if (method === "GET") {
                        const url = new URL(endpoint, "http://localhost");
                        const keyword = url.searchParams.get("keyword") || "";
                        const page = parseInt(url.searchParams.get("page") || "0");
                        const size = parseInt(url.searchParams.get("size") || "7");

                        const filtered = db.users.filter(u =>
                            u.fullName.toLowerCase().includes(keyword.toLowerCase()) ||
                            u.email.toLowerCase().includes(keyword.toLowerCase())
                        );

                        const totalElements = filtered.length;
                        const totalPages = Math.ceil(totalElements / size);
                        const start = page * size;
                        const items = filtered.slice(start, start + size);

                        return resolve({
                            success: true, message: "Success",
                            data: { items, page, size, totalElements, totalPages } as any
                        });
                    }

                    // Trùng khớp mẫu PATCH /api/admin/users/{id}/active
                    if (method === "PATCH" && endpoint.includes("/active")) {
                        const segments = endpoint.split("/");
                        const id = parseInt(segments[3]);
                        const target = db.users.find(u => u.id === id);
                        if (target) {
                            target.isActive = body.isActive;
                            return resolve({ success: true, message: "Updated active status", data: target as any });
                        }
                    }

                    // Trùng khớp mẫu PATCH /api/admin/users/{id}/role
                    if (method === "PATCH" && endpoint.includes("/role")) {
                        const segments = endpoint.split("/");
                        const id = parseInt(segments[3]);
                        const target = db.users.find(u => u.id === id);
                        if (target) {
                            target.role = body.role;
                            return resolve({ success: true, message: "Updated role successfully", data: target as any });
                        }
                    }
                }

                // ─── ROUTING ACADEMIC DATA SCOPE ──────────────────────────────────────
                if (endpoint === "/combos" && method === "GET") {
                    return resolve({ success: true, message: "Success", data: db.combos as any });
                }
                if (endpoint === "/subjects" && method === "GET") {
                    return resolve({ success: true, message: "Success", data: db.subjects as any });
                }
                if (endpoint === "/semesters" && method === "GET") {
                    return resolve({ success: true, message: "Success", data: db.semesters as any });
                }
                if (endpoint === "/quizzes" && method === "GET") {
                    return resolve({ success: true, message: "Success", data: db.quizzes as any });
                }

                // ─── ROUTING SYSTEM FEEDBACK SCOPE ────────────────────────────────────
                if (endpoint.startsWith("/admin/feedbacks")) {
                    if (method === "GET") {
                        return resolve({ success: true, message: "Success", data: { items: db.feedbacks } as any });
                    }
                    if (method === "PATCH") {
                        const segments = endpoint.split("/");
                        const id = parseInt(segments[3]);
                        const target = db.feedbacks.find(f => f.id === id);
                        if (target) {
                            target.status = body.status;
                            return resolve({ success: true, message: "Status updated", data: target as any });
                        }
                    }
                }

                // ─── ROUTING QUIZ GENERATION SCOPE (AI ENGINE) ────────────────────────
                if (endpoint === "/quizzes/generate" && method === "POST") {
                    const newQuiz: any = {
                        id: Math.floor(Math.random() * 1000) + 900,
                        title: `AI Generated: ${body.prompt.slice(0, 30)}...`,
                        description: "Hệ thống RAG tự động phân tách tài liệu học trình FPT",
                        subject: "AI Engine",
                        level: "Medium",
                        questions: 5,
                        bestScore: 0,
                        attempts: 0
                    };
                    db.quizzes.push(newQuiz);
                    return resolve({ success: true, message: "AI Quiz Generated successfully", data: newQuiz });
                }

                // ─── FALLBACK NOT FOUND CONTRACT ─────────────────────────────────────
                reject({ status: 404, message: "Resource endpoint not found in Mock DB Layer", errorCode: "RESOURCE_NOT_FOUND" });
            } catch (e) {
                reject({ status: 500, message: "Mock Core Runtime Internal Error", errorCode: "UNKNOWN_ERROR" });
            }
        });
    });
}