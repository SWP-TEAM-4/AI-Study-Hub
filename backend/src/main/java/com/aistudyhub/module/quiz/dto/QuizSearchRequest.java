package com.aistudyhub.module.quiz.dto;

import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.Visibility;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class QuizSearchRequest {
    private String keyword;        // Tìm kiếm theo title/description
    private Long subjectId;        // Lọc theo môn học
    private Long notebookId;       // Lọc theo notebook liên kết
    private Long academicTermId;   // Lọc theo học kỳ (semester)
    private String examType;       // Lọc theo loại đề thi (Midterm, Final...)
    private Visibility visibility; // Lọc theo visibility (PRIVATE, PUBLIC_LINK...)
    private MarketStatus marketStatus; // Lọc theo trạng thái marketplace
}
