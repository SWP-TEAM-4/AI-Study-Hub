package com.aistudyhub.module.chat.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.module.chat.dto.ChatMessageResponse;
import com.aistudyhub.module.chat.dto.CreateChatMessageRequest;
import com.aistudyhub.module.chat.dto.SendChatMessageResponse;
import com.aistudyhub.module.chat.dto.practice.PracticeImportRequest;
import com.aistudyhub.module.chat.dto.practice.PracticeImportResponse;
import com.aistudyhub.module.chat.service.ChatPracticeDraftService;
import com.aistudyhub.module.chat.service.ChatPracticeImportService;
import com.aistudyhub.module.chat.service.ChatMessageService;
import com.fasterxml.jackson.databind.JsonNode;
import com.aistudyhub.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Chat Messages", description = "Quản lý hội thoại chat và mock RAG answer")
@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequiredArgsConstructor
public class ChatMessageController {

    private final ChatMessageService chatMessageService;
    private final ChatPracticeDraftService chatPracticeDraftService;
    private final ChatPracticeImportService chatPracticeImportService;

    @Operation(summary = "Gửi câu hỏi chat hoặc tạo AI practice draft",
            description = "Hỗ trợ chat thường và prefix [QUIZ]/[FLASHCARD] để sinh draft practice từ tài liệu.")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            required = true,
            content = @Content(
                    mediaType = "application/json",
                    examples = {
                            @ExampleObject(
                                    name = "Normal chat",
                                    value = """
                                            {
                                              "content": "SRS la gi?",
                                              "topK": 3
                                            }
                                            """
                            ),
                            @ExampleObject(
                                    name = "Quiz practice draft",
                                    value = """
                                            {
                                              "content": "[QUIZ] Tao cho toi 5 cau trac nghiem chuong 1",
                                              "documentIds": [501, 502],
                                              "topK": 8,
                                              "language": "vi",
                                              "options": {
                                                "numberOfQuestions": 5,
                                                "questionType": "SINGLE_CHOICE",
                                                "difficulty": "MEDIUM"
                                              }
                                            }
                                            """
                            ),
                            @ExampleObject(
                                    name = "Flashcard practice draft",
                                    value = """
                                            {
                                              "content": "[FLASHCARD] Tao cho toi 10 flashcard chuong 1",
                                              "topK": 8,
                                              "language": "vi",
                                              "options": {
                                                "numberOfCards": 10,
                                                "difficulty": "MEDIUM"
                                              }
                                            }
                                            """
                            )
                    }
            )
    )
    @PostMapping("/api/chat-sessions/{sessionId}/messages")
    public ResponseEntity<ApiResponse<SendChatMessageResponse>> sendMessage(
            @PathVariable Long sessionId,
            @Valid @RequestBody CreateChatMessageRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {

        SendChatMessageResponse response = chatMessageService.sendMessage(sessionId, principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Lấy danh sách messages của chat session theo thứ tự hội thoại")
    @GetMapping("/api/chat-sessions/{sessionId}/messages")
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> listMessages(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal CustomUserDetails principal) {

        List<ChatMessageResponse> response = chatMessageService.listMessages(sessionId, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Xem JSON practice draft của một chat message")
    @GetMapping("/api/chat-messages/{messageId}/practice-draft")
    public ResponseEntity<ApiResponse<JsonNode>> previewPracticeDraft(
            @PathVariable Long messageId,
            @AuthenticationPrincipal CustomUserDetails principal) {

        JsonNode response = chatPracticeDraftService.previewDraft(messageId, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Import practice draft vao quiz bank hoac flashcard deck")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            required = true,
            content = @Content(
                    mediaType = "application/json",
                    examples = {
                            @ExampleObject(
                                    name = "Create new quiz",
                                    value = """
                                            {
                                              "targetMode": "CREATE_NEW",
                                              "target": {
                                                "title": "Quiz chuong 1",
                                                "description": "Quiz tao tu Chat AI",
                                                "visibility": "PRIVATE"
                                              },
                                              "importOptions": {
                                                "skipDuplicateQuestions": true,
                                                "shuffleQuestions": false
                                              }
                                            }
                                            """
                            ),
                            @ExampleObject(
                                    name = "Append existing flashcard deck",
                                    value = """
                                            {
                                              "targetMode": "APPEND_EXISTING",
                                              "target": {
                                                "deckId": 1001
                                              },
                                              "importOptions": {
                                                "skipDuplicateCards": true
                                              }
                                            }
                                            """
                            )
                    }
            )
    )
    @PostMapping("/api/chat-messages/{messageId}/practice-import")
    public ResponseEntity<ApiResponse<PracticeImportResponse>> importPracticeDraft(
            @PathVariable Long messageId,
            @Valid @RequestBody PracticeImportRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {

        PracticeImportResponse response = chatPracticeImportService.importPractice(messageId, principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Practice draft imported successfully", response));
    }
}
