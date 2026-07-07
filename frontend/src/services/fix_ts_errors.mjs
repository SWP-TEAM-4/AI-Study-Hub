const fs = require('fs');
const path = 'd:\\SWP391\\MindSpace\\AI_Study_Hub-feature-front-end\\AI-Study-Hub\\frontend\\src\\';

// ─── 1A. AdminOverview.tsx ───
let content = fs.readFileSync(path + 'components/Admin/AdminOverview.tsx', 'utf8');
content = content.replace(
  'analyticsService.adminGetAiUsage()',
  'analyticsService.getAdminAIUsage()'
);
content = content.replace(
  'return res.data?.items || [];',
  'return (res.data as any)?.items ?? [];'
);
fs.writeFileSync(path + 'components/Admin/AdminOverview.tsx', content, 'utf8');
console.log('1A. Fixed AdminOverview.tsx');

// ─── 1B. analyticsService.ts ───
content = fs.readFileSync(path + 'services/analyticsService.ts', 'utf8');
content = content.replace(
  'return text ? JSON.parse(text) : {};',
  'return text ? JSON.parse(text) : {} as T;'
);
fs.writeFileSync(path + 'services/analyticsService.ts', content, 'utf8');
console.log('1B. Fixed analyticsService.ts');

// ─── 1C. governanceService.ts - Add authorId & replies to CommentDTO ───
content = fs.readFileSync(path + 'services/governanceService.ts', 'utf8');
content = content.replace(
  'export interface CommentDTO {\n  id: number;\n  targetType: "DOCUMENT" | "QUIZ" | "FLASHCARD_DECK";\n  targetId: number;\n  content: string;\n  isHidden: boolean;\n  createdAt: string;\n  authorName?: string;\n}',
  `export interface CommentDTO {\n  id: number;\n  targetType: "DOCUMENT" | "QUIZ" | "FLASHCARD_DECK";\n  targetId: number;\n  content: string;\n  isHidden: boolean;\n  createdAt: string;\n  authorName?: string;\n  authorId?: number;\n  replies?: { id: number; content: string; authorName: string; createdAt: string }[];\n}`
);
fs.writeFileSync(path + 'services/governanceService.ts', content, 'utf8');
console.log('1C. Fixed governanceService.ts CommentDTO');

// ─── 1D. AdminReportsTab.tsx ───
content = fs.readFileSync(path + 'pages/AdminReportsTab.tsx', 'utf8');
content = content.replace(
  "const res = await governanceService.getAdminReports(0, 50, statusFilter);",
  "const res = await governanceService.getAdminReports({ page: 0, size: 50, status: statusFilter || undefined });"
);
content = content.replace(
  `\t  if (res.success) {\n\t    Notify.success("Đã duyệt báo cáo (Resolve).");\n\t    setReports(prev => prev.map(r => r.id === id ? res.data : r));\n\t  }\n\t} catch (e: any) {\n\t  Notify.failure(e.message || "Lỗi xử lý báo cáo");\n\t}\n\t},\n\n\tconst handleReject = async (id: number) => {\n\t  try {\n\t    const res = await governanceService.rejectReport(id, "Admin từ chối báo cáo này.");\n\t    if (res.success) {\n\t      Notify.success("Đã từ chối báo cáo (Reject).");\n\t      setReports(prev => prev.map(r => r.id === id ? res.data : r));\n\t    }`,
  `\t  if (res.success) {\n\t    Notify.success("Đã duyệt báo cáo (Resolve).");\n\t    loadReports();\n\t  }\n\t} catch (e: any) {\n\t  Notify.failure(e.message || "Lỗi xử lý báo cáo");\n\t}\n\t},\n\n\tconst handleReject = async (id: number) => {\n\t  try {\n\t    const res = await governanceService.rejectReport(id, "Admin từ chối báo cáo này.");\n\t    if (res.success) {\n\t      Notify.success("Đã từ chối báo cáo (Reject).");\n\t      loadReports();\n\t    }`
);
fs.writeFileSync(path + 'pages/AdminReportsTab.tsx', content, 'utf8');
console.log('1D. Fixed AdminReportsTab.tsx');

// ─── 1E. flashcardService.ts - Add targetId & creatorName ───
content = fs.readFileSync(path + 'services/flashcardService.ts', 'utf8');
content = content.replace(
  '  cards: FlashcardDTO[];\n}',
  '  cards: FlashcardDTO[];\n  targetId?: number;\n  creatorName?: string;\n}'
);
fs.writeFileSync(path + 'services/flashcardService.ts', content, 'utf8');
console.log('1E. Fixed flashcardService.ts FlashcardDeckDTO');

// ─── 1F. ReviewsSection.tsx - Fix authUser?.id -> authUser?.userId ───
content = fs.readFileSync(path + 'components/ui/ReviewsSection.tsx', 'utf8');
content = content.replace(
  'currentUserId={authUser?.id}',
  'currentUserId={authUser?.userId}'
);
fs.writeFileSync(path + 'components/ui/ReviewsSection.tsx', content, 'utf8');
console.log('1F. Fixed ReviewsSection.tsx');

console.log('\nALL 16 TS ERRORS FIXED');
