package com.aistudyhub.module.chat.service;

import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.ChatMessage;
import com.aistudyhub.entity.ChatSession;
import com.aistudyhub.repository.ChatMessageRepository;
import com.aistudyhub.repository.ChatSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ChatAccessService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;

    public ChatSession resolveOwnedSession(Long sessionId, Long userId) {
        return chatSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> {
                    if (chatSessionRepository.existsById(sessionId)) {
                        return new AppException(ErrorCode.CHAT_SESSION_ACCESS_DENIED);
                    }
                    return new AppException(ErrorCode.CHAT_SESSION_NOT_FOUND);
                });
    }

    public ChatMessage resolveOwnedMessage(Long messageId, Long userId) {
        return chatMessageRepository.findByIdAndSessionUserId(messageId, userId)
                .orElseThrow(() -> {
                    if (chatMessageRepository.existsById(messageId)) {
                        return new AppException(ErrorCode.PRACTICE_IMPORT_PERMISSION_DENIED,
                                "You do not have permission to access this chat message");
                    }
                    return new AppException(ErrorCode.CHAT_MESSAGE_NOT_FOUND);
                });
    }
}
