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
  { id: "nb1", title: "SWP391 — Dự án Phát triển Phần mềm", subject: "SWP391", color: "165", docs: 12, cards: 48, quizzes: 4, updated: "Hôm nay" },
  { id: "nb2", title: "SWT301 — Kiểm thử Phần mềm", subject: "SWT301", color: "35", docs: 8, cards: 32, quizzes: 3, updated: "Hôm qua" },
  { id: "nb3", title: "SWR302 — Kỹ thuật Yêu cầu Phần mềm", subject: "SWR302", color: "250", docs: 15, cards: 60, quizzes: 6, updated: "2 ngày trước" },
  { id: "nb4", title: "PRN221 — Lập trình C# và .NET", subject: "PRN221", color: "75", docs: 5, cards: 18, quizzes: 2, updated: "3 ngày trước" },
  { id: "nb5", title: "PRJ301 — Phát triển Ứng dụng Java Web", subject: "PRJ301", color: "200", docs: 9, cards: 40, quizzes: 5, updated: "1 tuần trước" },
  { id: "nb6", title: "PRN231 — Dịch vụ Web API với .NET", subject: "PRN231", color: "280", docs: 11, cards: 22, quizzes: 4, updated: "Vừa xong" },
  { id: "nb7", title: "ITS301 — Nhập môn An toàn Thông tin", subject: "ITS301", color: "110", docs: 6, cards: 15, quizzes: 2, updated: "4 ngày trước" },
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
  { id: "d1", title: "SWP391 Software Project — Lecture 01 Sprint.pdf", subject: "SWP391", type: "pdf", size: "4.2 MB", tags: ["slide", "lecture"], uploaded: "30/11/2026", downloads: 124, status: "ready" },
  { id: "d2", title: "SWT301 Test cases template sheet.docx", subject: "SWT301", type: "docx", size: "820 KB", tags: ["template", "lab"], uploaded: "28/11/2026", downloads: 56, status: "ready" },
  { id: "d3", title: "SWR302 Requirements engineering lecture note.pptx", subject: "SWR302", type: "pptx", size: "12.4 MB", tags: ["slide"], uploaded: "25/11/2026", downloads: 89, status: "ready" },
  { id: "d4", title: "SWP391 Mock exam answers key.pdf", subject: "SWP391", type: "pdf", size: "2.1 MB", tags: ["exam", "key"], uploaded: "20/11/2026", downloads: 312, status: "ready" },
  { id: "d5", title: "PRJ301 Java Web tutorial step-by-step.txt", subject: "PRJ301", type: "txt", size: "44 KB", tags: ["tutorial"], uploaded: "18/11/2026", downloads: 18, status: "processing" },
  { id: "d6", title: "PRN221 WinForms hands-on lab task.pdf", subject: "PRN221", type: "pdf", size: "6.8 MB", tags: ["lab"], uploaded: "15/11/2026", downloads: 47, status: "ready" },
  { id: "d7", title: "PRN231 Web API Endpoint controller guidelines.pdf", subject: "PRN231", type: "pdf", size: "3.5 MB", tags: ["API", "restful"], uploaded: "Hôm nay", downloads: 220, status: "ready" },
  { id: "d8", title: "ITS301 Symetric & Asymetric Cryptography.docx", subject: "ITS301", type: "docx", size: "1.1 MB", tags: ["security", "notes"], uploaded: "Hôm qua", downloads: 45, status: "ready" },
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
  { id: "q1", title: "SWP391 — Ôn tập Quy trình Agile cuối kỳ", subject: "SWP391", questions: 20, level: "Hard", attempts: 3, bestScore: 85 },
  { id: "q2", title: "SWT301 — Phân vùng Tương đương & Phân tích Giá trị Biên", subject: "SWT301", questions: 12, level: "Medium", attempts: 2, bestScore: 92 },
  { id: "q3", title: "SWR302 — Mô hình hóa Use Case & Viết tài liệu SRS", subject: "SWR302", questions: 15, level: "Medium", attempts: 1, bestScore: 73 },
  { id: "q4", title: "PRN221 — Đa luồng trong C# & Kiểm tra Async Await", subject: "PRN221", questions: 10, level: "Easy", attempts: 5, bestScore: 100 },
  { id: "q5", title: "PRJ301 — Cơ bản về Servlet, JSP & Mô hình MVC", subject: "PRJ301", questions: 15, level: "Medium", attempts: 0, bestScore: 0 },
  { id: "q6", title: "PRN231 — Trắc nghiệm Giao thức REST API & Xác thực JWT", subject: "PRN231", questions: 20, level: "Hard", attempts: 2, bestScore: 80 },
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
  { id: "fd1", title: "SWP391 — Khái niệm về Scrum & Kế hoạch Sprint", subject: "SWP391", cards: 48, mastered: 32, updated: "Hôm nay" },
  { id: "fd2", title: "SWT301 — Các loại kiểm thử Hộp trắng & Hộp đen", subject: "SWT301", cards: 24, mastered: 18, updated: "Hôm qua" },
  { id: "fd3", title: "SWR302 — Stakeholder chính & Khai thác Yêu cầu", subject: "SWR302", cards: 30, mastered: 12, updated: "2 ngày trước" },
  { id: "fd4", title: "PRN221 — Delegate, Sự kiện & Biểu thức LINQ trong C#", subject: "PRN221", cards: 18, mastered: 15, updated: "5 ngày trước" },
  { id: "fd5", title: "PRN231 — Mã Trạng thái HTTP & Đường ống Middleware", subject: "PRN231", cards: 22, mastered: 10, updated: "Vừa xong" },
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
  { id: "2", text: "Bạn đã duy trì chuỗi học tập 7 ngày liên tiếp! Cố lên nhé", time: "2 giờ trước", unread: true, kind: "system" },
  { id: "3", text: "Quiz 'SWP391 Final Review' của bạn đã được duyệt lên Marketplace", time: "Hôm qua", unread: false, kind: "market" },
  { id: "4", text: "Minh Anh vừa bình luận về tài liệu 'Mock exam answers'", time: "2 ngày trước", unread: false, kind: "social" },
  { id: "5", text: "Daily reminder: Thử thách học tập ngày hôm nay chưa hoàn thành 🔥", time: "3 giờ trước", unread: true, kind: "system" },
  { id: "6", text: "AI đã chuẩn bị 20 Flashcards mới từ giáo trình PRN231 mới tải lên", time: "Hôm qua", unread: true, kind: "ai" },
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
  { id: "m7", title: "PRN231 Web API Cheat Sheet", author: "Nhựt Minh", subject: "PRN231", kind: "doc", rating: 4.9, downloads: 1100 },
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
  { id: "c1", front: "Scrum là gì?", back: "Framework Agile nhẹ để phát triển sản phẩm phức tạp, dựa trên thực nghiệm (empiricism)." },
  { id: "c2", front: "3 trụ cột của empiricism trong Scrum?", back: "Transparency (minh bạch), Inspection (thanh tra), Adaptation (thích nghi)." },
  { id: "c3", front: "Vai trò của Scrum Master?", back: "Phục vụ Scrum Team, tháo gỡ trở ngại, đảm bảo Scrum được áp dụng đúng." },
  { id: "c4", front: "Velocity là gì?", back: "Lượng công việc trung bình team hoàn thành mỗi Sprint, dùng để dự báo năng lực." },
  { id: "c5", front: "Story Points đo lường cái gì?", back: "Đo lường độ phức tạp, rủi ro và nỗ lực tương đối, không trực tiếp quy đổi thành thời gian." },
];

export const leaderboard = [
  { rank: 1, name: "Ngô Nhựt Minh", points: 65322, avatar: "NM", level: 12 },
  { rank: 2, name: "Lê Trần Anh Khoa", points: 48105, avatar: "AK", level: 9 },
  { rank: 3, name: "Trần Bích Trâm", points: 21780, avatar: "BT", level: 8 },
  { rank: 4, name: "Sam Kim", points: 19231, avatar: "SK", level: 7 },
  { rank: 5, name: "Anna Doe", points: 15322, avatar: "AD", level: 6 },
];

export type ForumPost = {
  id: string;
  title: string;
  author: string;
  subject: string;
  comments: number;
  likes: number;
  date: string;
};

export const sampleForumPosts: ForumPost[] = [
  { id: "fp1", title: "Xin tài liệu ôn thi Final SWT301 của thầy Hoàng", author: "Huy FPT", subject: "SWT301", comments: 12, likes: 25, date: "3 giờ trước" },
  { id: "fp2", title: "Mẹo làm Lab 3 PRN221 nhanh chóng không lo bị lỗi", author: "Minh Ngô", subject: "PRN221", comments: 18, likes: 42, date: "Hôm qua" },
  { id: "fp3", title: "Sự khác biệt giữa Dependency Injection và Service Locator trong PRN231", author: "Khoa Lê", subject: "PRN231", comments: 7, likes: 19, date: "2 ngày trước" },
  { id: "fp4", title: "Lộ trình học Java Web PRJ301 hiệu quả cho người mất gốc", author: "Trâm Trần", subject: "PRJ301", comments: 34, likes: 88, date: "1 tuần trước" },
];
