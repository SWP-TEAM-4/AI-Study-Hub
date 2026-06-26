"use client";

import { UserDTO, FeedbackDTO, ComboDTO, SubjectDTO, SemesterDTO, QuizDTO, ActivityLogDTO, AIUsageDTO } from "../services/types";

class MockDatabase {
    users: UserDTO[] = [
        { id: 1, email: "khoa.le@fpt.edu.vn", fullName: "Lê Trần Anh Khoa", avatarUrl: null, currentSemesterId: 3, comboId: 1, role: "ADMIN", reputationPoints: 120, isActive: true, createdAt: "2026-06-12T21:30:00" },
        { id: 2, email: "minh.ngo@fpt.edu.vn", fullName: "Ngô Nhựt Minh", avatarUrl: null, currentSemesterId: 3, comboId: 1, role: "STUDENT", reputationPoints: 85, isActive: true, createdAt: "2026-06-12T22:00:00" },
        { id: 3, email: "tram.tram@fpt.edu.vn", fullName: "Trần Bích Trâm", avatarUrl: null, currentSemesterId: 3, comboId: 1, role: "STUDENT", reputationPoints: 95, isActive: true, createdAt: "2026-06-12T22:15:00" },
        { id: 4, email: "reviewer.pro@fpt.edu.vn", fullName: "Nguyễn Văn Review", avatarUrl: null, currentSemesterId: null, comboId: null, role: "REVIEWER", reputationPoints: 450, isActive: true, createdAt: "2026-05-20T08:00:00" },
        { id: 5, email: "ha.nguyen@fpt.edu.vn", fullName: "Nguyễn Hà Ngọc", avatarUrl: null, currentSemesterId: 6, comboId: 2, role: "STUDENT", reputationPoints: 40, isActive: false, createdAt: "2026-06-01T10:00:00" },
        { id: 6, email: "kiet.lam@fpt.edu.vn", fullName: "Lâm Tuấn Kiệt", avatarUrl: null, currentSemesterId: 5, comboId: 1, role: "STUDENT", reputationPoints: 15, isActive: true, createdAt: "2026-06-02T11:00:00" },
        { id: 7, email: "linh.pham@fpt.edu.vn", fullName: "Phạm Hà Linh", avatarUrl: null, currentSemesterId: 5, comboId: 2, role: "STUDENT", reputationPoints: 210, isActive: true, createdAt: "2026-06-03T14:30:00" },
        { id: 8, email: "quang.ha@fpt.edu.vn", fullName: "Nguyễn Quang Hà", avatarUrl: null, currentSemesterId: 4, comboId: 1, role: "STUDENT", reputationPoints: 70, isActive: false, createdAt: "2026-06-04T09:00:00" },
        { id: 9, email: "anh.minh@fpt.edu.vn", fullName: "Lê Minh Anh", avatarUrl: null, currentSemesterId: 3, comboId: 1, role: "STUDENT", reputationPoints: 180, isActive: true, createdAt: "2026-06-05T15:10:00" },
        { id: 10, email: "system.core@fpt.edu.vn", fullName: "Hỗ Trợ Kỹ Thuật", avatarUrl: null, currentSemesterId: null, comboId: null, role: "ADMIN", reputationPoints: 999, isActive: true, createdAt: "2026-01-01T00:00:00" }
    ];

    feedbacks: FeedbackDTO[] = [
        { id: 101, userId: 2, title: "Lỗi UI màn hình chọn Combo", content: "Nút chọn chuyên ngành bị lệch layout trên thiết bị di động khi xem danh sách môn học song ngành.", screenUrl: "/api/combos", status: "OPEN", createdAt: "2026-06-15T08:30:00" },
        { id: 102, userId: 3, title: "Trải nghiệm RAG phản hồi chậm", content: "Khi đặt câu hỏi về tài liệu 'Kiến trúc Java Web', AI mất hơn 10 giây mới trả ra nguồn trích dẫn.", screenUrl: "/api/chat-sessions/1", status: "IN_PROGRESS", createdAt: "2026-06-15T09:15:00" },
        { id: 103, userId: 5, title: "Sai số câu hỏi trong Quiz ESP32", content: "Hệ thống báo bộ đề có 8 câu nhưng khi làm thực tế chỉ hiển thị 5 câu hỏi.", screenUrl: "/api/quizzes/802", status: "RESOLVED", createdAt: "2026-06-14T16:00:00" }
    ];

    combos: ComboDTO[] = [
        { id: 1, code: "SE_AI", name: "Software Engineering - AI", description: "Combo định hướng Trí tuệ nhân tạo chuyên sâu" },
        { id: 2, code: "SE_IOT", name: "Software Engineering - IoT", description: "Combo định hướng Thiết bị tinh khôn và Hệ thống nhúng" }
    ];

    subjects: SubjectDTO[] = [
        { id: 11, code: "PRJ301", name: "Java Web Application Architecture", standardSemesterNumber: 4 },
        { id: 12, code: "IOT102", name: "Embedded Systems Development with ESP32", standardSemesterNumber: 5 },
        { id: 13, code: "SWR302", name: "Software Requirements Engineering", standardSemesterNumber: 5 }
    ];

    semesters: SemesterDTO[] = [
        { id: 1, code: "SP26", name: "Spring 2026" },
        { id: 2, code: "SU26", name: "Summer 2026" },
        { id: 3, code: "FA26", name: "Fall 2026" }
    ];

    quizzes: QuizDTO[] = [
        { id: 801, title: "Kiến trúc ứng dụng web Java", description: "Ôn tập tổng hợp Servlets, JSP, JSTL và MVC Pattern", subject: "Java Web", level: "Medium", questions: 10, bestScore: 85, attempts: 3 },
        { id: 802, title: "Lập trình điều khiển mạch ESP32", description: "Xử lý logic cảm biến khói, điều khiển động cơ servo", subject: "IoT Embedded", level: "Hard", questions: 8, bestScore: 90, attempts: 2 }
    ];

    activityLogs: ActivityLogDTO[] = [
        { id: 2001, actorId: 1, action: "UPLOAD_DOCUMENT", targetType: "DOCUMENT", targetId: 501, metadata: { fileType: "pdf" }, createdAt: "2026-06-16T06:00:00" },
        { id: 2002, actorId: 2, action: "GENERATE_QUIZ", targetType: "QUIZ", targetId: 801, metadata: { engine: "DeepSeek-R1" }, createdAt: "2026-06-16T06:15:00" }
    ];

    aiUsage: AIUsageDTO[] = [
        { userId: 1, period: "2026-06", chatRequests: 45, quizGenerations: 7, flashcardGenerations: 4, estimatedTokens: 24500 },
        { userId: 2, period: "2026-06", chatRequests: 32, quizGenerations: 5, flashcardGenerations: 3, estimatedTokens: 18500 }
    ];
}

export const db = new MockDatabase();