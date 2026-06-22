package com.aistudyhub.module.chat.service;

import com.aistudyhub.common.enums.AiPracticeType;
import com.aistudyhub.common.enums.QuestionType;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.module.chat.dto.practice.*;
import com.aistudyhub.module.document.dto.DocumentChunkResponse;
import com.aistudyhub.module.quiz.dto.OptionRequest;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
public class AiPracticePayloadValidator {

    private static final Pattern SOURCE_REF_TEXT_PATTERN =
            Pattern.compile("^(\\d+)\\D+(\\d+)(?:\\D+(\\d+))?$");

    private final ObjectMapper objectMapper;

    public ValidatedPracticePayload validate(AiPracticeType practiceType, String rawJson,
                                             AiPracticeGenerationRequest request) {
        try {
            JsonNode root = objectMapper.readTree(rawJson);
            normalizeRawPayload(root, practiceType, request);
            normalizeRawSourceRefs(root, practiceType, request.relevantChunks());
            return switch (practiceType) {
                case QUIZ -> validateQuizPayload(root, request);
                case FLASHCARD -> validateFlashcardPayload(root, request);
            };
        } catch (JsonProcessingException ex) {
            throw new PracticePayloadValidationException(
                    ErrorCode.AI_PRACTICE_INVALID_JSON,
                    "AI returned invalid JSON",
                    singleError("generatedPayload", "AI returned invalid JSON: " + ex.getOriginalMessage())
            );
        }
    }

    public QuizGeneratedPayload parseQuizPayload(JsonNode payloadNode) {
        try {
            return objectMapper.treeToValue(payloadNode, QuizGeneratedPayload.class);
        } catch (JsonProcessingException ex) {
            throw new PracticePayloadValidationException(
                    ErrorCode.AI_PRACTICE_SCHEMA_INVALID,
                    "Stored quiz payload could not be parsed",
                    singleError("generatedPayload", ex.getOriginalMessage())
            );
        }
    }

    public FlashcardGeneratedPayload parseFlashcardPayload(JsonNode payloadNode) {
        try {
            return objectMapper.treeToValue(payloadNode, FlashcardGeneratedPayload.class);
        } catch (JsonProcessingException ex) {
            throw new PracticePayloadValidationException(
                    ErrorCode.AI_PRACTICE_SCHEMA_INVALID,
                    "Stored flashcard payload could not be parsed",
                    singleError("generatedPayload", ex.getOriginalMessage())
            );
        }
    }

    private ValidatedPracticePayload validateQuizPayload(JsonNode root, AiPracticeGenerationRequest request)
            throws JsonProcessingException {
        QuizGeneratedPayload payload = objectMapper.treeToValue(root, QuizGeneratedPayload.class);
        ArrayNode errors = objectMapper.createArrayNode();

        String title = normalizeText(payload.getTitle());
        if (title == null) {
            errors.add(error("title", "title is required"));
        }

        List<QuizGeneratedQuestion> normalizedQuestions = new ArrayList<>();
        if (payload.getQuestions() == null || payload.getQuestions().isEmpty()) {
            errors.add(error("questions", "At least one quiz question is required"));
        } else if (payload.getQuestions().size() > 30) {
            errors.add(error("questions", "Quiz payload cannot contain more than 30 questions"));
        } else {
            for (int i = 0; i < payload.getQuestions().size(); i++) {
                QuizGeneratedQuestion question = payload.getQuestions().get(i);
                normalizeQuestion(question, i, errors);
                normalizedQuestions.add(question);
            }
        }

        if (!errors.isEmpty()) {
            throw new PracticePayloadValidationException(
                    ErrorCode.AI_PRACTICE_SCHEMA_INVALID,
                    "Quiz practice payload is invalid",
                    errors
            );
        }

        payload.setType("QUIZ");
        payload.setTitle(title);
        payload.setDescription(normalizeText(payload.getDescription(), "Bo cau hoi duoc sinh boi AI tu tai lieu trong notebook."));
        payload.setQuestions(normalizedQuestions);
        payload.setMetadata(normalizeQuizMetadata(payload.getMetadata(), request, normalizedQuestions.size()));

        return new ValidatedPracticePayload(objectMapper.valueToTree(payload), normalizedQuestions.size());
    }

    private ValidatedPracticePayload validateFlashcardPayload(JsonNode root, AiPracticeGenerationRequest request)
            throws JsonProcessingException {
        FlashcardGeneratedPayload payload = objectMapper.treeToValue(root, FlashcardGeneratedPayload.class);
        ArrayNode errors = objectMapper.createArrayNode();

        String title = normalizeText(payload.getTitle());
        if (title == null) {
            errors.add(error("title", "title is required"));
        }

        List<FlashcardGeneratedCard> normalizedCards = new ArrayList<>();
        if (payload.getCards() == null || payload.getCards().isEmpty()) {
            errors.add(error("cards", "At least one flashcard is required"));
        } else if (payload.getCards().size() > 50) {
            errors.add(error("cards", "Flashcard payload cannot contain more than 50 cards"));
        } else {
            for (int i = 0; i < payload.getCards().size(); i++) {
                FlashcardGeneratedCard card = payload.getCards().get(i);
                normalizeCard(card, i, errors);
                normalizedCards.add(card);
            }
        }

        if (!errors.isEmpty()) {
            throw new PracticePayloadValidationException(
                    ErrorCode.AI_PRACTICE_SCHEMA_INVALID,
                    "Flashcard practice payload is invalid",
                    errors
            );
        }

        payload.setType("FLASHCARD");
        payload.setTitle(title);
        payload.setDescription(normalizeText(payload.getDescription(), "Bo flashcard duoc sinh boi AI tu tai lieu trong notebook."));
        payload.setCards(normalizedCards);
        payload.setMetadata(normalizeFlashcardMetadata(payload.getMetadata(), request, normalizedCards.size()));

        return new ValidatedPracticePayload(objectMapper.valueToTree(payload), normalizedCards.size());
    }

    private void normalizeQuestion(QuizGeneratedQuestion question, int index, ArrayNode errors) {
        String fieldPrefix = "questions[" + index + "]";
        question.setQuestionText(normalizeText(question.getQuestionText()));
        question.setExplanation(normalizeText(question.getExplanation(), ""));

        if (question.getQuestionText() == null) {
            errors.add(error(fieldPrefix + ".questionText", "questionText is required"));
        }
        if (question.getQuestionType() == null) {
            errors.add(error(fieldPrefix + ".questionType", "questionType is required"));
            return;
        }
        if (question.getQuestionType() == QuestionType.FILL_IN_THE_BLANK) {
            errors.add(error(fieldPrefix + ".questionType", "FILL_IN_THE_BLANK is not supported for BE-055"));
        }

        List<OptionRequest> options = question.getOptions() == null ? List.of() : question.getOptions();
        if (options.size() < 2) {
            errors.add(error(fieldPrefix + ".options", "At least 2 options are required"));
        }

        int correctCount = 0;
        List<OptionRequest> normalizedOptions = new ArrayList<>();
        for (int optionIndex = 0; optionIndex < options.size(); optionIndex++) {
            OptionRequest option = options.get(optionIndex);
            if (option == null) {
                errors.add(error(fieldPrefix + ".options[" + optionIndex + "]", "option is required"));
                continue;
            }
            String optionText = normalizeText(option.getOptionText());
            if (optionText == null) {
                errors.add(error(fieldPrefix + ".options[" + optionIndex + "].optionText", "optionText is required"));
                continue;
            }
            option.setId(null);
            option.setOptionText(optionText);
            option.setIsCorrect(Boolean.TRUE.equals(option.getIsCorrect()));
            if (Boolean.TRUE.equals(option.getIsCorrect())) {
                correctCount++;
            }
            normalizedOptions.add(option);
        }

        if (question.getQuestionType() == QuestionType.SINGLE_CHOICE && correctCount != 1) {
            errors.add(error(fieldPrefix + ".options", "SINGLE_CHOICE requires exactly one correct option"));
        }
        if (question.getQuestionType() == QuestionType.MULTIPLE_CHOICE && correctCount < 1) {
            errors.add(error(fieldPrefix + ".options", "MULTIPLE_CHOICE requires at least one correct option"));
        }

        if (question.getSourceRefs() == null || question.getSourceRefs().isEmpty()) {
            errors.add(error(fieldPrefix + ".sourceRefs", "At least one sourceRef is required"));
        } else {
            question.setSourceRefs(normalizeSourceRefs(question.getSourceRefs(), fieldPrefix + ".sourceRefs", errors));
        }

        question.setOptions(normalizedOptions);
    }

    private void normalizeCard(FlashcardGeneratedCard card, int index, ArrayNode errors) {
        String fieldPrefix = "cards[" + index + "]";
        card.setFrontText(normalizeText(card.getFrontText()));
        card.setBackText(normalizeText(card.getBackText()));

        if (card.getFrontText() == null) {
            errors.add(error(fieldPrefix + ".frontText", "frontText is required"));
        }
        if (card.getBackText() == null) {
            errors.add(error(fieldPrefix + ".backText", "backText is required"));
        }
        if (card.getSourceRefs() == null || card.getSourceRefs().isEmpty()) {
            errors.add(error(fieldPrefix + ".sourceRefs", "At least one sourceRef is required"));
        } else {
            card.setSourceRefs(normalizeSourceRefs(card.getSourceRefs(), fieldPrefix + ".sourceRefs", errors));
        }
    }

    private List<PracticeSourceRef> normalizeSourceRefs(List<PracticeSourceRef> sourceRefs, String fieldPrefix,
                                                        ArrayNode errors) {
        List<PracticeSourceRef> normalizedRefs = new ArrayList<>();
        for (int i = 0; i < sourceRefs.size(); i++) {
            PracticeSourceRef ref = sourceRefs.get(i);
            if (ref == null || ref.getDocumentId() == null || ref.getChunkIndex() == null) {
                errors.add(error(fieldPrefix + "[" + i + "]",
                        "sourceRef must include documentId and chunkIndex"));
                continue;
            }
            ref.setExcerpt(normalizeText(ref.getExcerpt(), ""));
            normalizedRefs.add(ref);
        }
        return normalizedRefs;
    }

    private void normalizeRawSourceRefs(JsonNode root, AiPracticeType practiceType,
                                        List<DocumentChunkResponse> relevantChunks) {
        Map<String, DocumentChunkResponse> chunkLookup = buildChunkLookup(relevantChunks);
        if (practiceType == AiPracticeType.QUIZ) {
            JsonNode questionsNode = root.path("questions");
            if (questionsNode.isArray()) {
                for (JsonNode questionNode : questionsNode) {
                    normalizeSourceRefArrayNode(questionNode.path("sourceRefs"), chunkLookup);
                }
            }
            return;
        }

        JsonNode cardsNode = root.path("cards");
        if (cardsNode.isArray()) {
            for (JsonNode cardNode : cardsNode) {
                normalizeSourceRefArrayNode(cardNode.path("sourceRefs"), chunkLookup);
            }
        }
    }

    private void normalizeRawPayload(JsonNode root, AiPracticeType practiceType, AiPracticeGenerationRequest request) {
        if (!(root instanceof ObjectNode rootNode)) {
            return;
        }

        normalizeTitle(rootNode, practiceType, request);
        if (practiceType == AiPracticeType.QUIZ) {
            normalizeQuizRawPayload(rootNode);
            return;
        }
        normalizeFlashcardRawPayload(rootNode);
    }

    private void normalizeTitle(ObjectNode rootNode, AiPracticeType practiceType, AiPracticeGenerationRequest request) {
        if (hasNonBlankText(rootNode, "title")) {
            removeFields(rootNode, "name", "quizTitle", "deckTitle", "topic", "subject", "headline");
            return;
        }

        String aliasTitle = firstNonBlankText(rootNode,
                "name", "quizTitle", "deckTitle", "topic", "subject", "headline");
        if (aliasTitle != null) {
            rootNode.put("title", aliasTitle);
            removeFields(rootNode, "name", "quizTitle", "deckTitle", "topic", "subject", "headline");
            return;
        }

        rootNode.put("title", practiceType == AiPracticeType.QUIZ
                ? buildFallbackQuizTitle(request)
                : buildFallbackFlashcardTitle(request));
        removeFields(rootNode, "name", "quizTitle", "deckTitle", "topic", "subject", "headline");
    }

    private void normalizeQuizRawPayload(ObjectNode rootNode) {
        JsonNode questionsNode = firstArrayNode(rootNode, "questions", "items");
        if (!(questionsNode instanceof ArrayNode arrayNode)) {
            return;
        }

        if (!rootNode.has("questions")) {
            rootNode.set("questions", arrayNode);
        }

        for (JsonNode questionNode : arrayNode) {
            if (!(questionNode instanceof ObjectNode questionObject)) {
                continue;
            }
            normalizeQuestionNode(questionObject);
        }
    }

    private void normalizeQuestionNode(ObjectNode questionObject) {
        copyTextAlias(questionObject, "questionText", "text", "question", "prompt", "stem");
        copyTextAlias(questionObject, "explanation", "reason", "rationale", "answerExplanation");
        normalizeQuestionTypeAlias(questionObject);
        normalizeQuestionOptions(questionObject);
        removeFields(questionObject, "text", "question", "prompt", "stem",
                "reason", "rationale", "answerExplanation");
    }

    private void normalizeQuestionTypeAlias(ObjectNode questionObject) {
        if (hasNonBlankText(questionObject, "questionType")) {
            String normalized = normalizeQuestionTypeValue(questionObject.path("questionType").asText());
            if (normalized != null) {
                questionObject.put("questionType", normalized);
            }
            removeFields(questionObject, "type", "kind");
            return;
        }

        String aliasValue = firstNonBlankText(questionObject, "type", "kind");
        String normalized = normalizeQuestionTypeValue(aliasValue);
        if (normalized != null) {
            questionObject.put("questionType", normalized);
        }
        removeFields(questionObject, "type", "kind");
    }

    private String normalizeQuestionTypeValue(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            return null;
        }
        String normalized = rawValue.trim().toUpperCase()
                .replace('-', '_')
                .replace(' ', '_');
        if ("SINGLE".equals(normalized) || "SINGLEANSWER".equals(normalized)
                || "SINGLE_ANSWER".equals(normalized) || "MULTIPLE_CHOICE_SINGLE_ANSWER".equals(normalized)) {
            return "SINGLE_CHOICE";
        }
        if ("MULTI".equals(normalized) || "MULTIPLE".equals(normalized)
                || "MULTIPLEANSWER".equals(normalized) || "MULTIPLE_ANSWER".equals(normalized)) {
            return "MULTIPLE_CHOICE";
        }
        if ("SINGLE_CHOICE".equals(normalized) || "MULTIPLE_CHOICE".equals(normalized)
                || "FILL_IN_THE_BLANK".equals(normalized)) {
            return normalized;
        }
        return null;
    }

    private void normalizeQuestionOptions(ObjectNode questionObject) {
        JsonNode optionsNode = firstArrayNode(questionObject, "options", "choices", "answers");
        if (!(optionsNode instanceof ArrayNode optionsArray)) {
            return;
        }

        if (!questionObject.has("options")) {
            questionObject.set("options", optionsArray);
        }

        Set<Integer> correctIndexes = resolveCorrectOptionIndexes(questionObject, optionsArray);
        String correctAnswerText = firstNonBlankText(questionObject,
                "correctAnswer", "answer", "correctOption", "correctChoice");

        for (int optionIndex = 0; optionIndex < optionsArray.size(); optionIndex++) {
            JsonNode optionNode = optionsArray.get(optionIndex);

            if (optionNode != null && optionNode.isTextual()) {
                ObjectNode normalizedOption = objectMapper.createObjectNode();
                normalizedOption.put("optionText", optionNode.asText());
                normalizedOption.put("isCorrect",
                        correctIndexes.contains(optionIndex)
                                || textMatchesAnswer(optionNode.asText(), correctAnswerText));
                optionsArray.set(optionIndex, normalizedOption);
                continue;
            }

            if (!(optionNode instanceof ObjectNode optionObject)) {
                continue;
            }

            copyTextAlias(optionObject, "optionText", "text", "label", "content", "answerText", "value");
            if (!optionObject.has("isCorrect")) {
                Boolean aliasBoolean = firstBoolean(optionObject,
                        "correct", "isAnswer", "answer", "right", "isRight", "is_answer");
                if (aliasBoolean != null) {
                    optionObject.put("isCorrect", aliasBoolean);
                } else {
                    boolean derived = correctIndexes.contains(optionIndex)
                            || textMatchesAnswer(optionObject.path("optionText").asText(null), correctAnswerText);
                    optionObject.put("isCorrect", derived);
                }
            }
            removeFields(optionObject, "text", "label", "content", "answerText", "value",
                    "correct", "isAnswer", "answer", "right", "isRight", "is_answer");
        }

        removeFields(questionObject, "choices", "answers", "correctOptionIndex", "correctAnswerIndex",
                "answerIndex", "correctOptionIndexes", "correctAnswerIndexes", "answerIndexes",
                "correctAnswer", "answer", "correctOption", "correctChoice");
    }

    private Set<Integer> resolveCorrectOptionIndexes(ObjectNode questionObject, ArrayNode optionsArray) {
        Set<Integer> indexes = new HashSet<>();
        addIndexIfPresent(indexes, questionObject.get("correctOptionIndex"));
        addIndexIfPresent(indexes, questionObject.get("correctAnswerIndex"));
        addIndexIfPresent(indexes, questionObject.get("answerIndex"));

        addIndexesIfPresent(indexes, questionObject.get("correctOptionIndexes"));
        addIndexesIfPresent(indexes, questionObject.get("correctAnswerIndexes"));
        addIndexesIfPresent(indexes, questionObject.get("answerIndexes"));

        if (!indexes.isEmpty()) {
            return normalizePossibleOneBasedIndexes(indexes, optionsArray.size());
        }
        return indexes;
    }

    private void addIndexIfPresent(Set<Integer> indexes, JsonNode node) {
        if (node != null && node.canConvertToInt()) {
            indexes.add(node.intValue());
        }
    }

    private void addIndexesIfPresent(Set<Integer> indexes, JsonNode node) {
        if (node == null || !node.isArray()) {
            return;
        }
        for (JsonNode item : node) {
            if (item != null && item.canConvertToInt()) {
                indexes.add(item.intValue());
            }
        }
    }

    private Set<Integer> normalizePossibleOneBasedIndexes(Set<Integer> indexes, int optionCount) {
        boolean allOneBased = !indexes.isEmpty() && indexes.stream().allMatch(index -> index >= 1 && index <= optionCount);
        if (!allOneBased) {
            return indexes;
        }

        Set<Integer> normalized = new HashSet<>();
        for (Integer index : indexes) {
            normalized.add(index - 1);
        }
        return normalized;
    }

    private boolean textMatchesAnswer(String optionText, String correctAnswerText) {
        String normalizedOption = normalizeText(optionText);
        String normalizedAnswer = normalizeText(correctAnswerText);
        return normalizedOption != null && normalizedAnswer != null
                && normalizedOption.equalsIgnoreCase(normalizedAnswer);
    }

    private void normalizeFlashcardRawPayload(ObjectNode rootNode) {
        JsonNode cardsNode = firstArrayNode(rootNode, "cards", "items", "flashcards");
        if (!(cardsNode instanceof ArrayNode arrayNode)) {
            return;
        }

        if (!rootNode.has("cards")) {
            rootNode.set("cards", arrayNode);
        }

        for (JsonNode cardNode : arrayNode) {
            if (!(cardNode instanceof ObjectNode cardObject)) {
                continue;
            }
            copyTextAlias(cardObject, "frontText", "front", "term", "question", "prompt");
            copyTextAlias(cardObject, "backText", "back", "definition", "answer", "explanation");
            removeFields(cardObject, "front", "term", "question", "prompt", "back", "definition",
                    "answer", "explanation");
        }
    }

    private JsonNode firstArrayNode(ObjectNode node, String... fieldNames) {
        for (String fieldName : fieldNames) {
            JsonNode child = node.get(fieldName);
            if (child != null && child.isArray()) {
                return child;
            }
        }
        return null;
    }

    private void copyTextAlias(ObjectNode node, String targetField, String... aliases) {
        if (hasNonBlankText(node, targetField)) {
            return;
        }
        String aliasValue = firstNonBlankText(node, aliases);
        if (aliasValue != null) {
            node.put(targetField, aliasValue);
        }
    }

    private String firstNonBlankText(ObjectNode node, String... fieldNames) {
        for (String fieldName : fieldNames) {
            JsonNode candidate = node.get(fieldName);
            if (candidate != null && candidate.isValueNode()) {
                String normalized = normalizeText(candidate.asText());
                if (normalized != null) {
                    return normalized;
                }
            }
        }
        return null;
    }

    private Boolean firstBoolean(ObjectNode node, String... fieldNames) {
        for (String fieldName : fieldNames) {
            JsonNode candidate = node.get(fieldName);
            if (candidate == null || candidate.isNull()) {
                continue;
            }
            if (candidate.isBoolean()) {
                return candidate.booleanValue();
            }
            if (candidate.isTextual()) {
                String text = candidate.asText().trim();
                if ("true".equalsIgnoreCase(text)) {
                    return true;
                }
                if ("false".equalsIgnoreCase(text)) {
                    return false;
                }
            }
            if (candidate.canConvertToInt()) {
                return candidate.intValue() != 0;
            }
        }
        return null;
    }

    private boolean hasNonBlankText(ObjectNode node, String fieldName) {
        JsonNode child = node.get(fieldName);
        return child != null && normalizeText(child.asText()) != null;
    }

    private void removeFields(ObjectNode node, String... fieldNames) {
        for (String fieldName : fieldNames) {
            if (fieldName != null) {
                node.remove(fieldName);
            }
        }
    }

    private String buildFallbackQuizTitle(AiPracticeGenerationRequest request) {
        String prompt = normalizeText(request.userPrompt(), "tu tai lieu");
        return "AI Quiz - " + abbreviate(prompt, 48);
    }

    private String buildFallbackFlashcardTitle(AiPracticeGenerationRequest request) {
        String prompt = normalizeText(request.userPrompt(), "tu tai lieu");
        return "AI Flashcards - " + abbreviate(prompt, 48);
    }

    private String abbreviate(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, Math.max(0, maxLength - 3)).trim() + "...";
    }

    private Map<String, DocumentChunkResponse> buildChunkLookup(List<DocumentChunkResponse> relevantChunks) {
        Map<String, DocumentChunkResponse> lookup = new HashMap<>();
        if (relevantChunks == null) {
            return lookup;
        }

        for (DocumentChunkResponse chunk : relevantChunks) {
            if (chunk == null || chunk.getDocumentId() == null || chunk.getChunkIndex() == null) {
                continue;
            }
            lookup.put(buildChunkKey(chunk.getDocumentId(), chunk.getChunkIndex()), chunk);
        }
        return lookup;
    }

    private void normalizeSourceRefArrayNode(JsonNode sourceRefsNode, Map<String, DocumentChunkResponse> chunkLookup) {
        if (!(sourceRefsNode instanceof ArrayNode arrayNode)) {
            return;
        }

        for (int i = 0; i < arrayNode.size(); i++) {
            JsonNode node = arrayNode.get(i);
            if (node == null) {
                continue;
            }

            if (node.isTextual()) {
                ObjectNode normalizedNode = convertSourceRefText(node.asText(), chunkLookup);
                if (normalizedNode != null) {
                    arrayNode.set(i, normalizedNode);
                }
                continue;
            }

            if (node instanceof ObjectNode objectNode) {
                enrichSourceRefObject(objectNode, chunkLookup);
            }
        }
    }

    private ObjectNode convertSourceRefText(String rawValue, Map<String, DocumentChunkResponse> chunkLookup) {
        if (rawValue == null || rawValue.isBlank()) {
            return null;
        }

        Matcher matcher = SOURCE_REF_TEXT_PATTERN.matcher(rawValue.trim());
        if (!matcher.matches()) {
            return null;
        }

        Long documentId = Long.valueOf(matcher.group(1));
        Integer chunkIndex = Integer.valueOf(matcher.group(2));
        Integer sourcePage = matcher.group(3) != null ? Integer.valueOf(matcher.group(3)) : null;

        ObjectNode node = objectMapper.createObjectNode();
        node.put("documentId", documentId);
        node.put("chunkIndex", chunkIndex);
        if (sourcePage != null) {
            node.put("sourcePage", sourcePage);
        }

        DocumentChunkResponse chunk = chunkLookup.get(buildChunkKey(documentId, chunkIndex));
        if (chunk != null) {
            if (sourcePage == null && chunk.getSourcePage() != null) {
                node.put("sourcePage", chunk.getSourcePage());
            }
            String excerpt = normalizeText(chunk.getTextContent(), "");
            if (excerpt != null && !excerpt.isBlank()) {
                node.put("excerpt", excerpt);
            }
        }
        return node;
    }

    private void enrichSourceRefObject(ObjectNode node, Map<String, DocumentChunkResponse> chunkLookup) {
        JsonNode documentIdNode = node.get("documentId");
        JsonNode chunkIndexNode = node.get("chunkIndex");
        if (documentIdNode == null || chunkIndexNode == null || !documentIdNode.canConvertToLong()
                || !chunkIndexNode.canConvertToInt()) {
            return;
        }

        Long documentId = documentIdNode.longValue();
        Integer chunkIndex = chunkIndexNode.intValue();
        DocumentChunkResponse chunk = chunkLookup.get(buildChunkKey(documentId, chunkIndex));
        if (chunk == null) {
            return;
        }

        if ((!node.hasNonNull("sourcePage")) && chunk.getSourcePage() != null) {
            node.put("sourcePage", chunk.getSourcePage());
        }
        if ((!node.hasNonNull("excerpt") || node.path("excerpt").asText().isBlank())
                && chunk.getTextContent() != null && !chunk.getTextContent().isBlank()) {
            node.put("excerpt", normalizeText(chunk.getTextContent(), ""));
        }
    }

    private String buildChunkKey(Long documentId, Integer chunkIndex) {
        return documentId + "-" + chunkIndex;
    }

    private PracticeGenerationMetadata normalizeQuizMetadata(PracticeGenerationMetadata metadata,
                                                             AiPracticeGenerationRequest request,
                                                             int generatedCount) {
        PracticeGenerationMetadata normalized = metadata == null ? new PracticeGenerationMetadata() : metadata;
        normalized.setLanguage(request.languageOrDefault());
        normalized.setDifficulty(request.difficultyOrDefault());
        normalized.setRequestedQuestionCount(request.requestedQuestionCount());
        normalized.setGeneratedQuestionCount(generatedCount);
        normalized.setRequestedCardCount(null);
        normalized.setGeneratedCardCount(null);
        normalized.setWarnings(normalized.getWarnings() == null ? new ArrayList<>() : normalized.getWarnings());
        return normalized;
    }

    private PracticeGenerationMetadata normalizeFlashcardMetadata(PracticeGenerationMetadata metadata,
                                                                  AiPracticeGenerationRequest request,
                                                                  int generatedCount) {
        PracticeGenerationMetadata normalized = metadata == null ? new PracticeGenerationMetadata() : metadata;
        normalized.setLanguage(request.languageOrDefault());
        normalized.setDifficulty(request.difficultyOrDefault());
        normalized.setRequestedQuestionCount(null);
        normalized.setGeneratedQuestionCount(null);
        normalized.setRequestedCardCount(request.requestedCardCount());
        normalized.setGeneratedCardCount(generatedCount);
        normalized.setWarnings(normalized.getWarnings() == null ? new ArrayList<>() : normalized.getWarnings());
        return normalized;
    }

    private ArrayNode singleError(String field, String message) {
        ArrayNode errors = objectMapper.createArrayNode();
        errors.add(error(field, message));
        return errors;
    }

    private ObjectNode error(String field, String message) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("field", field);
        node.put("message", message);
        return node;
    }

    private String normalizeText(String value) {
        return normalizeText(value, null);
    }

    private String normalizeText(String value, String fallback) {
        if (value == null) {
            return fallback;
        }
        String normalized = value.replaceAll("\\s+", " ").trim();
        if (normalized.isEmpty()) {
            return fallback;
        }
        return normalized;
    }

    public record ValidatedPracticePayload(JsonNode normalizedPayload, int itemCount) {
    }
}
