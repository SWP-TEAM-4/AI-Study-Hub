package com.aistudyhub.module.quiz.dto;

import com.aistudyhub.entity.Quiz;

public final class QuizResponseMapper {
    private QuizResponseMapper() {
    }

    public static QuizResponse toResponse(Quiz quiz) {
        return QuizResponse.builder()
                .id(quiz.getId())
                .notebookId(quiz.getNotebook() != null ? quiz.getNotebook().getId() : null)
                .notebookTitle(quiz.getNotebook() != null ? quiz.getNotebook().getTitle() : null)
                .subjectId(quiz.getSubject() != null ? quiz.getSubject().getId() : null)
                .subjectName(quiz.getSubject() != null ? quiz.getSubject().getName() : null)
                .creatorId(quiz.getCreator().getId())
                .creatorFullName(quiz.getCreator().getFullName())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .academicTermId(quiz.getAcademicTerm() != null ? quiz.getAcademicTerm().getId() : null)
                .academicTermName(quiz.getAcademicTerm() != null ? quiz.getAcademicTerm().getName() : null)
                .examType(quiz.getExamType())
                .visibility(quiz.getVisibility())
                .marketStatus(quiz.getMarketStatus())
                .downloadCount(quiz.getDownloadCount())
                .reviewCount(quiz.getReviewCount())
                .acceptPercentage(quiz.getAcceptPercentage())
                .aiVerdictNote(quiz.getAiVerdictNote())
                .clonedFromId(quiz.getClonedFrom() != null ? quiz.getClonedFrom().getId() : null)
                .createdAt(quiz.getCreatedAt())
                .updatedAt(quiz.getUpdatedAt())
                .build();
    }
}