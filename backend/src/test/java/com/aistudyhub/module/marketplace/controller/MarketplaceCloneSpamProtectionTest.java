package com.aistudyhub.module.marketplace.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.ProcessingStatus;
import com.aistudyhub.common.enums.QuestionType;
import com.aistudyhub.common.enums.Role;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.entity.Document;
import com.aistudyhub.entity.Quiz;
import com.aistudyhub.entity.QuizOption;
import com.aistudyhub.entity.QuizQuestion;
import com.aistudyhub.entity.Subject;
import com.aistudyhub.entity.User;
import com.aistudyhub.module.marketplace.model.MarketplaceCloneTargetType;
import com.aistudyhub.module.marketplace.repository.MarketplaceCloneReceiptRepository;
import com.aistudyhub.repository.DocumentRepository;
import com.aistudyhub.repository.NotebookDocumentRepository;
import com.aistudyhub.repository.QuizOptionRepository;
import com.aistudyhub.repository.QuizQuestionRepository;
import com.aistudyhub.repository.QuizRepository;
import com.aistudyhub.repository.SubjectRepository;
import com.aistudyhub.repository.UserRepository;
import com.aistudyhub.security.CustomUserDetails;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class MarketplaceCloneSpamProtectionTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MarketplaceCloneReceiptRepository cloneReceiptRepository;

    @Autowired
    private NotebookDocumentRepository notebookDocumentRepository;

    @Autowired
    private QuizOptionRepository quizOptionRepository;

    @Autowired
    private QuizQuestionRepository quizQuestionRepository;

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private UserRepository userRepository;

    private User owner;
    private User cloner;
    private User secondCloner;
    private Document marketplaceDocument;
    private Quiz marketplaceQuiz;

    @BeforeEach
    void setUp() {
        cloneReceiptRepository.deleteAll();
        notebookDocumentRepository.deleteAll();
        quizOptionRepository.deleteAll();
        quizQuestionRepository.deleteAll();
        quizRepository.deleteAll();
        documentRepository.deleteAll();
        subjectRepository.deleteAll();
        userRepository.deleteAll();

        owner = saveUser("clone-owner@fpt.edu.vn", "Clone Owner");
        cloner = saveUser("clone-user@fpt.edu.vn", "Clone User");
        secondCloner = saveUser("clone-user-2@fpt.edu.vn", "Second Clone User");

        Subject subject = subjectRepository.save(Subject.builder()
                .code("MKT302")
                .name("Marketplace Security")
                .build());

        marketplaceDocument = documentRepository.save(Document.builder()
                .user(owner)
                .subject(subject)
                .title("Marketplace Document")
                .description("Approved source document")
                .fileUrl("/uploads/marketplace.pdf")
                .fileType("pdf")
                .fileSize(1024L)
                .visibility(Visibility.MARKETPLACE)
                .marketStatus(MarketStatus.APPROVED)
                .processingStatus(ProcessingStatus.SUCCESS)
                .downloadCount(5)
                .reviewCount(0)
                .acceptPercentage(BigDecimal.ZERO)
                .build());

        marketplaceQuiz = quizRepository.save(Quiz.builder()
                .creator(owner)
                .subject(subject)
                .title("Marketplace Quiz")
                .description("Approved source quiz")
                .examType("PRACTICE")
                .visibility(Visibility.MARKETPLACE)
                .marketStatus(MarketStatus.APPROVED)
                .downloadCount(10)
                .reviewCount(0)
                .acceptPercentage(BigDecimal.ZERO)
                .build());

        QuizQuestion question = QuizQuestion.builder()
                .quiz(marketplaceQuiz)
                .questionText("Which clone should be reused?")
                .questionType(QuestionType.SINGLE_CHOICE)
                .explanation("The existing personal clone")
                .options(new ArrayList<>())
                .build();
        question.getOptions().add(QuizOption.builder()
                .question(question)
                .optionText("Existing clone")
                .isCorrect(true)
                .build());
        question.getOptions().add(QuizOption.builder()
                .question(question)
                .optionText("New duplicate")
                .isCorrect(false)
                .build());
        quizQuestionRepository.save(question);
    }

    @Test
    void repeatedDocumentCloneReturnsSameResourceAndCountsOnce() throws Exception {
        long firstCloneId = cloneDocument(marketplaceDocument.getId(), cloner);
        long secondCloneId = cloneDocument(marketplaceDocument.getId(), cloner);

        assertEquals(firstCloneId, secondCloneId);
        assertEquals(1, documentClonesOwnedBy(cloner).size());
        assertEquals(6, documentRepository.findById(marketplaceDocument.getId()).orElseThrow().getDownloadCount());
        assertEquals(1, cloneReceiptRepository.count());
    }

    @Test
    void deletingDocumentCloneDoesNotGrantAnotherDownloadCredit() throws Exception {
        long firstCloneId = cloneDocument(marketplaceDocument.getId(), cloner);
        documentRepository.deleteById(firstCloneId);
        documentRepository.flush();

        long replacementCloneId = cloneDocument(marketplaceDocument.getId(), cloner);

        assertNotEquals(firstCloneId, replacementCloneId);
        assertEquals(1, documentClonesOwnedBy(cloner).size());
        assertEquals(6, documentRepository.findById(marketplaceDocument.getId()).orElseThrow().getDownloadCount());
        assertEquals(replacementCloneId, cloneReceiptRepository
                .findByUserIdAndTargetTypeAndSourceId(
                        cloner.getId(), MarketplaceCloneTargetType.DOCUMENT, marketplaceDocument.getId())
                .orElseThrow()
                .getClonedResourceId());
    }

    @Test
    void differentUsersReceiveIndependentCloneCredit() throws Exception {
        cloneDocument(marketplaceDocument.getId(), cloner);
        cloneDocument(marketplaceDocument.getId(), secondCloner);

        assertEquals(7, documentRepository.findById(marketplaceDocument.getId()).orElseThrow().getDownloadCount());
        assertEquals(2, cloneReceiptRepository.count());
    }

    @Test
    void ownerCannotCloneOwnDocumentOrQuiz() throws Exception {
        mockMvc.perform(post("/api/marketplace/documents/{id}/clone", marketplaceDocument.getId())
                        .with(user(new CustomUserDetails(owner)))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        mockMvc.perform(post("/api/marketplace/quizzes/{id}/clone", marketplaceQuiz.getId())
                        .with(user(new CustomUserDetails(owner)))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        assertEquals(0, cloneReceiptRepository.count());
        assertEquals(5, documentRepository.findById(marketplaceDocument.getId()).orElseThrow().getDownloadCount());
        assertEquals(10, quizRepository.findById(marketplaceQuiz.getId()).orElseThrow().getDownloadCount());
    }

    @Test
    void repeatedQuizCloneDoesNotDeepCopyQuestionsAgain() throws Exception {
        long firstCloneId = cloneQuiz(marketplaceQuiz.getId(), cloner);
        long secondCloneId = cloneQuiz(marketplaceQuiz.getId(), cloner);

        assertEquals(firstCloneId, secondCloneId);
        assertEquals(1, quizClonesOwnedBy(cloner).size());
        assertEquals(1, quizQuestionRepository.findByQuizIdOrderById(firstCloneId).size());
        assertEquals(11, quizRepository.findById(marketplaceQuiz.getId()).orElseThrow().getDownloadCount());
        assertEquals(1, cloneReceiptRepository.count());
    }

    private User saveUser(String email, String name) {
        return userRepository.save(User.builder()
                .email(email)
                .fullName(name)
                .role(Role.STUDENT)
                .isActive(true)
                .build());
    }

    private long cloneDocument(Long sourceId, User userAccount) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/marketplace/documents/{id}/clone", sourceId)
                        .with(user(new CustomUserDetails(userAccount)))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();
        return responseResourceId(result);
    }

    private long cloneQuiz(Long sourceId, User userAccount) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/marketplace/quizzes/{id}/clone", sourceId)
                        .with(user(new CustomUserDetails(userAccount)))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();
        return responseResourceId(result);
    }

    private long responseResourceId(MvcResult result) throws Exception {
        JsonNode response = objectMapper.readTree(result.getResponse().getContentAsString());
        return response.path("data").path("id").asLong();
    }

    private List<Document> documentClonesOwnedBy(User userAccount) {
        return documentRepository.findAll().stream()
                .filter(document -> document.getUser().getId().equals(userAccount.getId()))
                .filter(document -> document.getClonedFrom() != null)
                .toList();
    }

    private List<Quiz> quizClonesOwnedBy(User userAccount) {
        return quizRepository.findAll().stream()
                .filter(quiz -> quiz.getCreator().getId().equals(userAccount.getId()))
                .filter(quiz -> quiz.getClonedFrom() != null)
                .toList();
    }
}
