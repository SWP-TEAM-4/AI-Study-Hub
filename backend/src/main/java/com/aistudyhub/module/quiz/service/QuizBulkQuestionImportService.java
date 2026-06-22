package com.aistudyhub.module.quiz.service;

import com.aistudyhub.common.enums.QuestionType;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.module.chat.dto.practice.QuizGeneratedQuestion;
import com.aistudyhub.module.quiz.dto.OptionRequest;
import com.aistudyhub.module.quiz.dto.QuestionRequest;
import com.aistudyhub.module.quiz.dto.QuestionResponse;
import com.aistudyhub.repository.QuizQuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class QuizBulkQuestionImportService {

    private final QuizQuestionRepository quizQuestionRepository;
    private final QuizQuestionService quizQuestionService;

    @Transactional
    public ImportResult importQuestions(Long quizId, List<QuizGeneratedQuestion> generatedQuestions,
                                        boolean skipDuplicates, boolean shuffleQuestions) {
        List<QuizGeneratedQuestion> sourceQuestions = new ArrayList<>(generatedQuestions);
        if (shuffleQuestions) {
            Collections.shuffle(sourceQuestions);
        }

        Set<String> existingQuestions = quizQuestionRepository.findByQuizIdOrderById(quizId).stream()
                .map(question -> normalize(question.getQuestionText()))
                .collect(HashSet::new, HashSet::add, HashSet::addAll);

        Set<String> seenInPayload = new HashSet<>();
        List<QuestionRequest> requests = new ArrayList<>();
        int skippedDuplicates = 0;

        for (QuizGeneratedQuestion generatedQuestion : sourceQuestions) {
            if (generatedQuestion.getQuestionType() == QuestionType.FILL_IN_THE_BLANK) {
                throw new AppException(ErrorCode.PRACTICE_IMPORT_TARGET_INVALID,
                        "FILL_IN_THE_BLANK is not supported for AI practice import");
            }

            String normalizedQuestion = normalize(generatedQuestion.getQuestionText());
            boolean duplicated = existingQuestions.contains(normalizedQuestion) || !seenInPayload.add(normalizedQuestion);
            if (duplicated) {
                if (skipDuplicates) {
                    skippedDuplicates++;
                    continue;
                }
                throw new AppException(ErrorCode.PRACTICE_IMPORT_DUPLICATE_ITEM,
                        "Duplicate quiz question detected: " + generatedQuestion.getQuestionText());
            }

            requests.add(toQuestionRequest(generatedQuestion));
            existingQuestions.add(normalizedQuestion);
        }

        List<QuestionResponse> createdQuestions = quizQuestionService.addQuestions(quizId, requests);
        int createdOptions = createdQuestions.stream()
                .mapToInt(question -> question.getOptions() == null ? 0 : question.getOptions().size())
                .sum();

        return new ImportResult(createdQuestions.size(), createdOptions, skippedDuplicates);
    }

    private QuestionRequest toQuestionRequest(QuizGeneratedQuestion generatedQuestion) {
        QuestionRequest request = new QuestionRequest();
        request.setQuestionText(generatedQuestion.getQuestionText());
        request.setQuestionType(generatedQuestion.getQuestionType());
        request.setExplanation(generatedQuestion.getExplanation());

        List<OptionRequest> options = generatedQuestion.getOptions() == null ? List.of() : generatedQuestion.getOptions();
        List<OptionRequest> copiedOptions = new ArrayList<>();
        for (OptionRequest option : options) {
            OptionRequest copied = new OptionRequest();
            copied.setOptionText(option.getOptionText());
            copied.setIsCorrect(option.getIsCorrect());
            copiedOptions.add(copied);
        }
        request.setOptions(copiedOptions);
        return request;
    }

    private String normalize(String value) {
        return value == null ? "" : value.replaceAll("\\s+", " ").trim().toLowerCase(Locale.ROOT);
    }

    public record ImportResult(int createdQuestions, int createdOptions, int skippedDuplicates) {
    }
}
