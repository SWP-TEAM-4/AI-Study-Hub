import { ApiResponse } from "./types";

// --- DTOs ---

export interface SemesterDTO {
  id: number;
  code: string;
  name: string;
}

export interface SubjectDTO {
  id: number;
  code: string;
  name: string;
  standardSemesterNumber: number;
}

export interface ComboDTO {
  id: number;
  code: string;
  name: string;
  description: string;
}

// --- Mock Data ---
let mockSemesters: SemesterDTO[] = [
  { id: 1, code: "FA25", name: "Fall 2025" },
  { id: 2, code: "SP26", name: "Spring 2026" },
  { id: 3, code: "SU26", name: "Summer 2026" },
];

let mockSubjects: SubjectDTO[] = [
  { id: 10, code: "PRJ301", name: "Java Web Application Development", standardSemesterNumber: 4 },
  { id: 11, code: "SWP391", name: "Application Development Project", standardSemesterNumber: 5 },
  { id: 12, code: "SWR302", name: "Software Requirements", standardSemesterNumber: 5 },
];

let mockCombos: ComboDTO[] = [
  { id: 1, code: "SE_GD", name: "Software Engineering - Game Design", description: "Combo định hướng làm game" },
  { id: 2, code: "SE_AI", name: "Software Engineering - AI", description: "Combo định hướng AI" },
];

// Combo-Subject Relations (comboId -> array of subjectIds)
let mockComboSubjects: Record<number, number[]> = {
  1: [10],
  2: [11, 12],
};

// --- Helper: public fetch (no auth required) ---
async function publicRequest<T>(endpoint: string): Promise<T> {
  const response = await fetch(`/api${endpoint}`);
  const text = await response.text();
  const result = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw { status: response.status, message: result.message || "Lỗi giao tiếp API", errorCode: result.errorCode };
  }
  return result;
}

// --- Service ---

export const academicService = {
  // ================= SEMESTERS =================
  getSemesters: async (): Promise<ApiResponse<SemesterDTO[]>> => {
    try {
      return await publicRequest<ApiResponse<SemesterDTO[]>>("/semesters");
    } catch {
      return new Promise(resolve => setTimeout(() => resolve({ success: true, message: "Success", data: [...mockSemesters] }), 300));
    }
  },
  adminCreateSemester: async (data: Omit<SemesterDTO, "id">): Promise<ApiResponse<SemesterDTO>> => {
    return new Promise(resolve => setTimeout(() => {
      const newSem = { ...data, id: Date.now() };
      mockSemesters.push(newSem);
      resolve({ success: true, message: "Success", data: newSem });
    }, 300));
  },
  adminUpdateSemester: async (id: number, data: Omit<SemesterDTO, "id">): Promise<ApiResponse<SemesterDTO>> => {
    return new Promise((resolve, reject) => setTimeout(() => {
      const idx = mockSemesters.findIndex(s => s.id === id);
      if (idx === -1) return reject(new Error("Resource not found"));
      mockSemesters[idx] = { ...data, id };
      resolve({ success: true, message: "Success", data: mockSemesters[idx] });
    }, 300));
  },
  adminDeleteSemester: async (id: number): Promise<ApiResponse<{ deleted: boolean }>> => {
    return new Promise((resolve, reject) => setTimeout(() => {
      const idx = mockSemesters.findIndex(s => s.id === id);
      if (idx === -1) return reject(new Error("Resource not found"));
      mockSemesters.splice(idx, 1);
      resolve({ success: true, message: "Deleted successfully", data: { deleted: true } });
    }, 300));
  },

  // ================= SUBJECTS =================
  getSubjects: async (subjectId?: number): Promise<ApiResponse<SubjectDTO[]>> => {
    return new Promise(resolve => setTimeout(() => {
      let result = [...mockSubjects];
      if (subjectId) result = result.filter(s => s.id === subjectId);
      resolve({ success: true, message: "Success", data: result });
    }, 300));
  },
  getSubjectById: async (id: number): Promise<ApiResponse<SubjectDTO>> => {
    return new Promise((resolve, reject) => setTimeout(() => {
      const subj = mockSubjects.find(s => s.id === id);
      if (!subj) return reject(new Error("Resource not found"));
      resolve({ success: true, message: "Success", data: subj });
    }, 300));
  },
  adminCreateSubject: async (data: Omit<SubjectDTO, "id">): Promise<ApiResponse<SubjectDTO>> => {
    return new Promise(resolve => setTimeout(() => {
      const newSubj = { ...data, id: Date.now() };
      mockSubjects.push(newSubj);
      resolve({ success: true, message: "Success", data: newSubj });
    }, 300));
  },
  adminUpdateSubject: async (id: number, data: Omit<SubjectDTO, "id">): Promise<ApiResponse<SubjectDTO>> => {
    return new Promise((resolve, reject) => setTimeout(() => {
      const idx = mockSubjects.findIndex(s => s.id === id);
      if (idx === -1) return reject(new Error("Resource not found"));
      mockSubjects[idx] = { ...data, id };
      resolve({ success: true, message: "Success", data: mockSubjects[idx] });
    }, 300));
  },
  adminDeleteSubject: async (id: number): Promise<ApiResponse<{ deleted: boolean }>> => {
    return new Promise((resolve, reject) => setTimeout(() => {
      const idx = mockSubjects.findIndex(s => s.id === id);
      if (idx === -1) return reject(new Error("Resource not found"));
      mockSubjects.splice(idx, 1);
      resolve({ success: true, message: "Deleted successfully", data: { deleted: true } });
    }, 300));
  },

  // ================= COMBOS =================
  getCombos: async (): Promise<ApiResponse<ComboDTO[]>> => {
    try {
      return await publicRequest<ApiResponse<ComboDTO[]>>("/combos");
    } catch {
      return new Promise(resolve => setTimeout(() => resolve({ success: true, message: "Success", data: [...mockCombos] }), 300));
    }
  },
  adminCreateCombo: async (data: Omit<ComboDTO, "id">): Promise<ApiResponse<ComboDTO>> => {
    return new Promise(resolve => setTimeout(() => {
      const newCombo = { ...data, id: Date.now() };
      mockCombos.push(newCombo);
      mockComboSubjects[newCombo.id] = [];
      resolve({ success: true, message: "Success", data: newCombo });
    }, 300));
  },
  getSubjectsOfCombo: async (id: number): Promise<ApiResponse<SubjectDTO[]>> => {
    try {
      return await publicRequest<ApiResponse<SubjectDTO[]>>(`/combos/${id}/subjects`);
    } catch {
      return new Promise((resolve, reject) => setTimeout(() => {
        const combo = mockCombos.find(c => c.id === id);
        if (!combo) return reject(new Error("Resource not found"));
        const subjectIds = mockComboSubjects[id] || [];
        const subjects = mockSubjects.filter(s => subjectIds.includes(s.id));
        resolve({ success: true, message: "Success", data: subjects });
      }, 300));
    }
  },
  adminAddSubjectToCombo: async (id: number, subjectId: number): Promise<ApiResponse<SubjectDTO>> => {
    return new Promise((resolve, reject) => setTimeout(() => {
      const combo = mockCombos.find(c => c.id === id);
      const subject = mockSubjects.find(s => s.id === subjectId);
      if (!combo || !subject) return reject(new Error("Resource not found"));
      
      if (!mockComboSubjects[id]) mockComboSubjects[id] = [];
      if (!mockComboSubjects[id].includes(subjectId)) {
        mockComboSubjects[id].push(subjectId);
      }
      resolve({ success: true, message: "Success", data: subject });
    }, 300));
  },
  adminRemoveSubjectFromCombo: async (id: number, subjectId: number): Promise<ApiResponse<{ deleted: boolean }>> => {
    return new Promise((resolve, reject) => setTimeout(() => {
      const combo = mockCombos.find(c => c.id === id);
      if (!combo) return reject(new Error("Resource not found"));
      
      if (mockComboSubjects[id]) {
        mockComboSubjects[id] = mockComboSubjects[id].filter(sid => sid !== subjectId);
      }
      resolve({ success: true, message: "Deleted successfully", data: { deleted: true } });
    }, 300));
  }
};
