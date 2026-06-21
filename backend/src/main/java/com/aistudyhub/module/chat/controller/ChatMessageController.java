package com.aistudyhub.module.chat.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.module.chat.dto.ChatMessageResponse;
import com.aistudyhub.module.chat.dto.CreateChatMessageRequest;
import com.aistudyhub.module.chat.dto.SendChatMessageResponse;
import com.aistudyhub.module.chat.service.ChatMessageService;
import com.aistudyhub.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
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

    @Operation(summary = "Gửi câu hỏi và nhận câu trả lời mock RAG")
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
}
