package com.aistudyhub.module.quiz.service;

import com.aistudyhub.common.enums.PracticeImportTargetMode;
import com.aistudyhub.common.enums.PracticeImportTargetType;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.ChatSession;
import com.aistudyhub.entity.Quiz;
import com.aistudyhub.module.chat.dto.practice.PracticeImportRequest;
import com.aistudyhub.module.chat.dto.practice.QuizGeneratedPayload;
import com.aistudyhub.module.quiz.dto.QuizRequest;
import com.aistudyhub.module.quiz.dto.QuizResponse;
import com.aistudyhub.module.user.service.UserService;
import com.aistudyhub.repository.QuizRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class QuizAiImportService {

    private final QuizRepository quizRepository;
    private final QuizService quizService;
    private final QuizBulkQuestionImportService quizBulkQuestionImportService;
    private final UserService userService;

    @Transactional
    public ImportResult importFromChatDraft(ChatSession session, QuizGeneratedPayload payload, PracticeImportRequest request) {
        try {
            Long targetQuizId;
            Long createdQuizId = null;

            if (request.getTargetMode() == PracticeImportTargetMode.CREATE_NEW) {
                QuizRequest quizRequest = new QuizRequest();
                String title = normalize(request.getTarget().getTitle());
                if (title == null) {
                    throw new AppException(ErrorCode.PRACTICE_IMPORT_TARGET_INVALID,
                            "title is required when creating a new quiz");
                }
                quizRequest.setTitle(title);
                quizRequest.setDescription(normalize(request.getTarget().getDescription(), payload.getDescription()));
                quizRequest.setNotebookId(request.getTarget().getNotebookId() != null
                        ? request.getTarget().getNotebookId()
                        : session.getNotebook().getId());
                quizRequest.setSubjectId(request.getTarget().getSubjectId() != null
                        ? request.getTarget().getSubjectId()
                        : (session.getNotebook().getSubject() != null ? session.getNotebook().getSubject().getId() : null));
                quizRequest.setVisibility(request.getTarget().getVisibility() != null
                        ? request.getTarget().getVisibility()
                        : Visibility.PRIVATE);

                QuizResponse createdQuiz = quizService.createQuiz(quizRequest);
                targetQuizId = createdQuiz.getId();
                createdQuizId = createdQuiz.getId();
            } else {
                if (request.getTarget().getQuizId() == null) {
                    throw new AppException(ErrorCode.PRACTICE_IMPORT_TARGET_INVALID,
                            "quizId is required when appending to an existing quiz");
                }
                Quiz quiz = quizRepository.findById(request.getTarget().getQuizId())
                        .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));
                if (!quiz.getCreator().getId().equals(userService.getCurrentUserId())) {
                    throw new AppException(ErrorCode.PRACTICE_IMPORT_PERMISSION_DENIED,
                            "You do not own the target quiz");
                }
                targetQuizId = quiz.getId();
            }

            boolean skipDuplicates = request.getImportOptions() != null
                    && Boolean.TRUE.equals(request.getImportOptions().getSkipDuplicateQuestions());
            boolean shuffleQuestions = request.getImportOptions() != null
                    && Boolean.TRUE.equals(request.getImportOptions().getShuffleQuestions());

            QuizBulkQuestionImportService.ImportResult importResult = quizBulkQuestionImportService.importQuestions(
                    targetQuizId,
                    payload.getQuestions(),
                    skipDuplicates,
                    shuffleQuestions
            );

            return new ImportResult(
                    PracticeImportTargetType.QUIZ,
                    targetQuizId,
                    createdQuizId,
                    importResult.createdQuestions(),
                    importResult.createdOptions(),
                    importResult.skippedDuplicates()
            );
        } catch (AppException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new AppException(ErrorCode.QUIZ_IMPORT_FAILED, ex.getMessage());
        }
    }

    private String normalize(String value) {
        return normalize(value, null);
    }

    private String normalize(String value, String fallback) {
        if (value == null) {
            return fallback;
        }
        String normalized = value.replaceAll("\\s+", " ").trim();
        return normalized.isEmpty() ? fallback : normalized;
    }

    public record ImportResult(
            PracticeImportTargetType targetType,
            Long targetId,
            Long createdQuizId,
            int createdQuestions,
            int createdOptions,
            int skippedDuplicates
    ) {
    }
}
