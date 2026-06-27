export type Notebook = {
  id: string;
  title: string;
  subject: string;
  color: string;
  docs: number;
  cards: number;
  quizzes: number;
  updated: string;
};

export const notebooks: Notebook[] = [
  { id: "nb1", title: "SWP391 — Final Sprint", subject: "SWP391", color: "165", docs: 12, cards: 48, quizzes: 4, updated: "Hôm nay" },
  { id: "nb2", title: "SWT301 — Testing", subject: "SWT301", color: "35", docs: 8, cards: 32, quizzes: 3, updated: "Hôm qua" },
  { id: "nb3", title: "SWR302 — Requirements", subject: "SWR302", color: "250", docs: 15, cards: 60, quizzes: 6, updated: "2 ngày trước" },
  { id: "nb4", title: "PRN221 — .NET WinForms", subject: "PRN221", color: "75", docs: 5, cards: 18, quizzes: 2, updated: "3 ngày trước" },
  { id: "nb5", title: "PRJ301 — Java Web", subject: "PRJ301", color: "200", docs: 9, cards: 40, quizzes: 5, updated: "1 tuần trước" },
];

export type Doc = {
  id: string;
  title: string;
  subject: string;
  type: "pdf" | "docx" | "pptx" | "txt";
  size: string;
  tags: string[];
  uploaded: string;
  downloads: number;
  status: "ready" | "processing" | "failed";
};

export const documents: Doc[] = [
  { id: "d1", title: "Software Project — Lecture 01.pdf", subject: "SWP391", type: "pdf", size: "4.2 MB", tags: ["slide", "lecture"], uploaded: "30/11/2026", downloads: 124, status: "ready" },
  { id: "d2", title: "Test cases template.docx", subject: "SWT301", type: "docx", size: "820 KB", tags: ["template", "lab"], uploaded: "28/11/2026", downloads: 56, status: "ready" },
  { id: "d3", title: "Requirements engineering.pptx", subject: "SWR302", type: "pptx", size: "12.4 MB", tags: ["slide"], uploaded: "25/11/2026", downloads: 89, status: "ready" },
  { id: "d4", title: "Mock exam answers.pdf", subject: "SWP391", type: "pdf", size: "2.1 MB", tags: ["exam", "key"], uploaded: "20/11/2026", downloads: 312, status: "ready" },
  { id: "d5", title: "Java Web tutorial.txt", subject: "PRJ301", type: "txt", size: "44 KB", tags: ["tutorial"], uploaded: "18/11/2026", downloads: 18, status: "processing" },
  { id: "d6", title: "WinForms hands-on.pdf", subject: "PRN221", type: "pdf", size: "6.8 MB", tags: ["lab"], uploaded: "15/11/2026", downloads: 47, status: "ready" },
];

export type Quiz = {
  id: string;
  title: string;
  subject: string;
  questions: number;
  level: "Easy" | "Medium" | "Hard";
  attempts: number;
  bestScore: number;
};

export const quizzes: Quiz[] = [
  { id: "q1", title: "SWP391 — Final Review", subject: "SWP391", questions: 20, level: "Hard", attempts: 3, bestScore: 85 },
  { id: "q2", title: "SWT301 — Equivalence Partitioning", subject: "SWT301", questions: 12, level: "Medium", attempts: 2, bestScore: 92 },
  { id: "q3", title: "SWR302 — Use Case Modelling", subject: "SWR302", questions: 15, level: "Medium", attempts: 1, bestScore: 73 },
  { id: "q4", title: "PRN221 — Quick check", subject: "PRN221", questions: 10, level: "Easy", attempts: 5, bestScore: 100 },
];

export type Deck = {
  id: string;
  title: string;
  subject: string;
  cards: number;
  mastered: number;
  updated: string;
};

export const decks: Deck[] = [
  { id: "fd1", title: "SWP391 — Concepts", subject: "SWP391", cards: 48, mastered: 32, updated: "Hôm nay" },
  { id: "fd2", title: "SWT301 — Test types", subject: "SWT301", cards: 24, mastered: 18, updated: "Hôm qua" },
  { id: "fd3", title: "SWR302 — Stakeholders", subject: "SWR302", cards: 30, mastered: 12, updated: "2 ngày trước" },
];

export type Noti = {
  id: string;
  text: string;
  time: string;
  unread: boolean;
  kind: "ai" | "system" | "market" | "social";
};

export const notifications: Noti[] = [
  { id: "1", text: "AI vừa tóm tắt xong tài liệu 'Software Project — Lecture 01'", time: "5 phút trước", unread: true, kind: "ai" },
  { id: "2", text: "Bạn đã duy trì chuỗi học 7 ngày liên tiếp ", time: "2 giờ trước", unread: true, kind: "system" },
  { id: "3", text: "Quiz 'SWP391 Final Review' của bạn đã được duyệt lên Marketplace", time: "Hôm qua", unread: false, kind: "market" },
  { id: "4", text: "Minh Anh vừa bình luận về tài liệu 'Mock exam answers'", time: "2 ngày trước", unread: false, kind: "social" },
];

export type MarketItem = {
  id: string;
  title: string;
  author: string;
  subject: string;
  kind: "doc" | "quiz" | "deck";
  rating: number;
  downloads: number;
};

export const marketItems: MarketItem[] = [
  { id: "m1", title: "SWP391 — Đề thi cuối kỳ Fall 2025", author: "Anh Khoa", subject: "SWP391", kind: "doc", rating: 4.8, downloads: 1240 },
  { id: "m2", title: "Bộ flashcard Testing kinh điển", author: "Minh Anh", subject: "SWT301", kind: "deck", rating: 4.6, downloads: 870 },
  { id: "m3", title: "Quiz Requirement Engineering (100 câu)", author: "Quang Hà", subject: "SWR302", kind: "quiz", rating: 4.9, downloads: 1530 },
  { id: "m4", title: "Slide tổng hợp PRJ301", author: "Tuấn Kiệt", subject: "PRJ301", kind: "doc", rating: 4.4, downloads: 612 },
  { id: "m5", title: "Flashcard WinForms cơ bản", author: "Hà Linh", subject: "PRN221", kind: "deck", rating: 4.3, downloads: 388 },
  { id: "m6", title: "Mini quiz Java OOP", author: "Bảo Trân", subject: "PRJ301", kind: "quiz", rating: 4.7, downloads: 920 },
];

export type QuizQuestion = {
  id: string;
  text: string;
  options: string[];
  correct: number;
  explanation: string;
};

export const sampleQuestions: QuizQuestion[] = [
  {
    id: "qq1",
    text: "Trong Scrum, ai chịu trách nhiệm tối đa hóa giá trị của sản phẩm?",
    options: ["Scrum Master", "Product Owner", "Developer", "Stakeholder"],
    correct: 1,
    explanation: "Product Owner là người quản trị Product Backlog và tối đa hóa giá trị sản phẩm theo Scrum Guide.",
  },
  {
    id: "qq2",
    text: "Sprint trong Scrum thường kéo dài tối đa bao lâu?",
    options: ["1 tuần", "2 tuần", "1 tháng", "3 tháng"],
    correct: 2,
    explanation: "Sprint kéo dài tối đa 1 tháng (4 tuần) theo Scrum Guide.",
  },
  {
    id: "qq3",
    text: "Sự kiện nào KHÔNG thuộc Scrum events?",
    options: ["Sprint Planning", "Daily Scrum", "Code Review", "Sprint Retrospective"],
    correct: 2,
    explanation: "Code Review không phải Scrum event chính thức.",
  },
  {
    id: "qq4",
    text: "Artifact nào thể hiện mục tiêu Sprint?",
    options: ["Product Backlog", "Sprint Backlog", "Increment", "Burn-down chart"],
    correct: 1,
    explanation: "Sprint Backlog chứa Sprint Goal và các công việc đã chọn.",
  },
  {
    id: "qq5",
    text: "Definition of Done được sở hữu bởi ai?",
    options: ["Product Owner", "Scrum Master", "Developers", "Cả Scrum Team"],
    correct: 3,
    explanation: "DoD được toàn bộ Scrum Team cùng thống nhất và sở hữu.",
  },
];

export type Flashcard = { id: string; front: string; back: string };
export const sampleCards: Flashcard[] = [
  { id: "c1", front: "Scrum là gì?", back: "Framework Agile nhẹ để phát triển sản phẩm phức tạp, dựa trên empiricism." },
  { id: "c2", front: "3 trụ cột của empiricism trong Scrum?", back: "Transparency, Inspection, Adaptation." },
  { id: "c3", front: "Vai trò của Scrum Master?", back: "Phục vụ Scrum Team, gỡ trở ngại, đảm bảo Scrum được áp dụng đúng." },
  { id: "c4", front: "Velocity là gì?", back: "Lượng công việc trung bình team hoàn thành mỗi Sprint, dùng để dự báo." },
  { id: "c5", front: "Story Points đo gì?", back: "Đo độ phức tạp/effort tương đối, không phải thời gian." },
];

export const leaderboard = [
  { rank: 1, name: "Minh Anh", points: 12480, avatar: "MA" },
  { rank: 2, name: "Anh Khoa", points: 11320, avatar: "AK" },
  { rank: 3, name: "Quang Hà", points: 10870, avatar: "QH" },
  { rank: 4, name: "Tuấn Kiệt", points: 9450, avatar: "TK" },
  { rank: 5, name: "Hà Linh", points: 8910, avatar: "HL" },
];
