package com.aistudyhub.module.chat.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.common.response.PaginationResponse;
import com.aistudyhub.module.chat.dto.ChatSessionResponse;
import com.aistudyhub.module.chat.dto.CreateChatSessionRequest;
import com.aistudyhub.module.chat.dto.DeleteChatSessionResponse;
import com.aistudyhub.module.chat.service.ChatSessionService;
import com.aistudyhub.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Chat Sessions", description = "Quản lý chat session cho notebook AI/RAG")
@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequiredArgsConstructor
public class ChatSessionController {

    private final ChatSessionService chatSessionService;

    @Operation(summary = "Tạo chat session mới trong notebook")
    @PostMapping("/api/notebooks/{notebookId}/chat-sessions")
    public ResponseEntity<ApiResponse<ChatSessionResponse>> createSession(
            @PathVariable Long notebookId,
            @Valid @RequestBody CreateChatSessionRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {

        ChatSessionResponse response = chatSessionService.createSession(notebookId, principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Chat session created successfully", response));
    }

    @Operation(summary = "Lấy danh sách chat session theo notebook")
    @GetMapping("/api/notebooks/{notebookId}/chat-sessions")
    public ResponseEntity<ApiResponse<PaginationResponse<ChatSessionResponse>>> listSessions(
            @PathVariable Long notebookId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal CustomUserDetails principal) {

        Page<ChatSessionResponse> result = chatSessionService.listSessions(notebookId, principal.getId(), page, size);
        return ResponseEntity.ok(ApiResponse.success(PaginationResponse.of(result)));
    }

    @Operation(summary = "Lấy chi tiết một chat session")
    @GetMapping("/api/chat-sessions/{sessionId}")
    public ResponseEntity<ApiResponse<ChatSessionResponse>> getSession(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal CustomUserDetails principal) {

        ChatSessionResponse response = chatSessionService.getSession(sessionId, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Xóa chat session")
    @DeleteMapping("/api/chat-sessions/{sessionId}")
    public ResponseEntity<ApiResponse<DeleteChatSessionResponse>> deleteSession(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal CustomUserDetails principal) {

        DeleteChatSessionResponse response = chatSessionService.deleteSession(sessionId, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Deleted successfully", response));
    }
}
