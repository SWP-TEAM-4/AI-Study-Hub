// ─────────────────────────────────────────────────────────────────────────────
// mockUsers.ts – Dữ liệu mock cho Auth & User service
// ─────────────────────────────────────────────────────────────────────────────

import type { UserRole } from "../../services/authService";

export interface MockUser {
  // Auth fields
  userId: number;
  email: string;
  password: string; // plain text cho mock, backend hash
  fullName: string;
  avatarUrl: string | null;
  role: UserRole;
  reputationPoints: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  // Profile / Academic fields
  currentSemesterId: number | null;
  currentSemesterCode: string | null;
  currentSemesterName: string | null;
  comboId: number | null;
  comboCode: string | null;
  comboName: string | null;
}

// ─── Mock Users Database ──────────────────────────────────────────────────────

export const mockUsers: MockUser[] = [
  {
    userId: 1,
    email: "student@fpt.edu.vn",
    password: "Password123",
    fullName: "Nguyen Van Anh",
    avatarUrl: null,
    role: "STUDENT",
    reputationPoints: 120,
    isActive: true,
    createdAt: "2026-01-15T08:30:00Z",
    updatedAt: "2026-06-10T14:20:00Z",
    currentSemesterId: 3,
    currentSemesterCode: "SU26",
    currentSemesterName: "Summer 2026",
    comboId: 1,
    comboCode: "SE_COMBO_1",
    comboName: "Software Engineering - Combo 1",
  },
  {
    userId: 2,
    email: "reviewer@fpt.edu.vn",
    password: "Password123",
    fullName: "Tran Thi Bich",
    avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=reviewer",
    role: "REVIEWER",
    reputationPoints: 450,
    isActive: true,
    createdAt: "2025-09-01T10:00:00Z",
    updatedAt: "2026-06-08T09:15:00Z",
    currentSemesterId: 3,
    currentSemesterCode: "SU26",
    currentSemesterName: "Summer 2026",
    comboId: 2,
    comboCode: "SE_COMBO_2",
    comboName: "Software Engineering - Combo 2",
  },
  {
    userId: 3,
    email: "admin@fpt.edu.vn",
    password: "Password123",
    fullName: "Le Minh Admin",
    avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=admin",
    role: "ADMIN",
    reputationPoints: 999,
    isActive: true,
    createdAt: "2025-06-01T00:00:00Z",
    updatedAt: "2026-06-12T16:00:00Z",
    currentSemesterId: null,
    currentSemesterCode: null,
    currentSemesterName: null,
    comboId: null,
    comboCode: null,
    comboName: null,
  },
];

// ─── Helper: Generate fake JWT token ──────────────────────────────────────────

let tokenCounter = 0;

export function generateMockToken(userId: number): string {
  tokenCounter++;
  // Fake JWT format – đủ dài để giống thật nhưng rõ ràng là mock
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({
      sub: userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400, // 24h
      mock: true,
      seq: tokenCounter,
    })
  );
  const signature = btoa(`mock-signature-${userId}-${tokenCounter}`);
  return `${header}.${payload}.${signature}`;
}

// ─── Helper: Find user by email ───────────────────────────────────────────────

export function findUserByEmail(email: string): MockUser | undefined {
  return mockUsers.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
}

// ─── Helper: Find user by ID ─────────────────────────────────────────────────

export function findUserById(id: number): MockUser | undefined {
  return mockUsers.find((u) => u.userId === id);
}
