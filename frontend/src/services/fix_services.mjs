const fs = require('fs');

// Fix authService.ts - update AuthUser and LoginResponseData
const authPath = 'd:\\SWP391\\MindSpace\\AI_Study_Hub-feature-front-end\\AI-Study-Hub\\frontend\\src\\services\\authService.ts';
let authContent = fs.readFileSync(authPath, 'utf8');

// Update AuthUser
const oldAuthUser = `export interface AuthUser {
  userId: number; // Backend: Long userId
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: "STUDENT" | "REVIEWER" | "ADMIN";
  reputationPoints: number;
  createdAt: string;
  // Các field legacy (fallback khi parse từ localStorage cũ)
  id?: number;
}`;

const newAuthUser = `export interface AuthUser {
  userId: number;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: "STUDENT" | "REVIEWER" | "ADMIN";
  reputationPoints: number;
  currentSemesterId: number | null;
  currentSemesterCode: string | null;
  currentSemesterName: string | null;
  comboId: number | null;
  comboCode: string | null;
  comboName: string | null;
  createdAt: string;
  updatedAt: string;
  id?: number;
}`;

if (authContent.includes(oldAuthUser)) {
  authContent = authContent.replace(oldAuthUser, newAuthUser);
  fs.writeFileSync(authPath, authContent, 'utf8');
  console.log('SUCCESS: Updated AuthUser');
} else {
  console.log('ERROR: AuthUser pattern not found');
}

// Fix quizService.ts - update startTest and TestDTO
const quizPath = 'd:\\SWP391\\MindSpace\\AI_Study_Hub-feature-front-end\\AI-Study-Hub\\frontend\\src\\services\\quizService.ts';
let quizContent = fs.readFileSync(quizPath, 'utf8');

// Update startTest request body
const oldStartTest = `async startTest(quizId: number, payload: any): Promise<ApiResponse<TestDTO>> {
    try {
      return await qRequest(\`/quizzes/\${quizId}/tests\`, { method: "POST", body: JSON.stringify(payload) });`;

const newStartTest = `async startTest(quizId: number, payload: {
  title?: string;
  duration: number;
  quizSelectionMode: "ALL" | "RANDOM";
  questionIds?: number[];
  randomCount?: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
}): Promise<ApiResponse<TestDTO>> {
    try {
      return await qRequest(\`/quizzes/\${quizId}/tests\`, { method: "POST", body: JSON.stringify(payload) });`;

if (quizContent.includes(oldStartTest)) {
  quizContent = quizContent.replace(oldStartTest, newStartTest);
  console.log('SUCCESS: Updated startTest signature');
} else {
  console.log('ERROR: startTest pattern not found');
}

// Update TestDTO
const oldTestDTO = `export interface TestDTO {
  id: number;
  quizId: number;
  userId: number;
  title: string;
  duration: number;
  selectionMode: string;
  status: "IN_PROGRESS" | "COMPLETED";
  totalQuestions?: number;
  totalScore?: number;
  questions?: QuestionDTO[]; // Trả về lúc IN_PROGRESS
  correctAnswers?: number;
  items?: any[]; // Trả về lúc COMPLETED (result items)
  createdAt?: string;
}`;

const newTestDTO = `export interface TestDTO {
  id: number;
  quizId: number;
  quizTitle: string;
  userId: number;
  title: string;
  totalScore: number;
  duration: number;
  status: "IN_PROGRESS" | "COMPLETED";
  createdAt: string;
  questions?: TestQuestionDTO[];
  selectionMode: string;
  randomCount: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  totalQuestions: number;
}

export interface TestQuestionDTO {
  id: number;
  questionText: string;
  questionType: string;
  options: { id: number; optionText: string }[];
  userProgress: { selectedOptionId?: number; userAnswerText?: string } | null;
}`;

if (quizContent.includes(oldTestDTO)) {
  quizContent = quizContent.replace(oldTestDTO, newTestDTO);
  console.log('SUCCESS: Updated TestDTO');
} else {
  console.log('ERROR: TestDTO pattern not found');
}

fs.writeFileSync(quizPath, quizContent, 'utf8');
console.log('DONE: quizService.ts updated');
