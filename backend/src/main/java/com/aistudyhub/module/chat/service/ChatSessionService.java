package com.aistudyhub.module.chat.service;

import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.ChatSession;
import com.aistudyhub.entity.Notebook;
import com.aistudyhub.module.chat.dto.ChatSessionResponse;
import com.aistudyhub.module.chat.dto.CreateChatSessionRequest;
import com.aistudyhub.module.chat.dto.DeleteChatSessionResponse;
import com.aistudyhub.repository.ChatSessionRepository;
import com.aistudyhub.repository.NotebookRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatSessionService {

    private final ChatSessionRepository chatSessionRepository;
    private final NotebookRepository notebookRepository;

    @Transactional
    public ChatSessionResponse createSession(Long notebookId, Long userId, CreateChatSessionRequest request) {
        Notebook notebook = resolveOwnedNotebook(notebookId, userId);

        ChatSession session = ChatSession.builder()
                .notebook(notebook)
                .user(notebook.getUser())
                .title(request.getTitle().trim())
                .build();

        session = chatSessionRepository.save(session);
        log.info("Created chat session {} for notebook {} and user {}", session.getId(), notebookId, userId);
        return toResponse(session);
    }

    @Transactional(readOnly = true)
    public Page<ChatSessionResponse> listSessions(Long notebookId, Long userId, int page, int size) {
        validatePaging(page, size);
        resolveOwnedNotebook(notebookId, userId);

        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return chatSessionRepository.findByNotebookIdAndUserId(notebookId, userId, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public ChatSessionResponse getSession(Long sessionId, Long userId) {
        return toResponse(resolveOwnedSession(sessionId, userId));
    }

    @Transactional
    public DeleteChatSessionResponse deleteSession(Long sessionId, Long userId) {
        ChatSession session = resolveOwnedSession(sessionId, userId);
        chatSessionRepository.delete(session);
        log.info("Deleted chat session {} for user {}", sessionId, userId);

        return DeleteChatSessionResponse.builder()
                .deleted(true)
                .build();
    }

    private Notebook resolveOwnedNotebook(Long notebookId, Long userId) {
        return notebookRepository.findByIdAndUserId(notebookId, userId)
                .orElseThrow(() -> {
                    if (notebookRepository.existsById(notebookId)) {
                        return new AppException(ErrorCode.NOTEBOOK_ACCESS_DENIED);
                    }
                    return new AppException(ErrorCode.NOTEBOOK_NOT_FOUND);
                });
    }

    private ChatSession resolveOwnedSession(Long sessionId, Long userId) {
        return chatSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> {
                    if (chatSessionRepository.existsById(sessionId)) {
                        return new AppException(ErrorCode.CHAT_SESSION_ACCESS_DENIED);
                    }
                    return new AppException(ErrorCode.CHAT_SESSION_NOT_FOUND);
                });
    }

    private void validatePaging(int page, int size) {
        if (page < 0 || size <= 0) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "page must be >= 0 and size must be > 0");
        }
    }

    private ChatSessionResponse toResponse(ChatSession session) {
        return ChatSessionResponse.builder()
                .id(session.getId())
                .notebookId(session.getNotebook().getId())
                .userId(session.getUser().getId())
                .title(session.getTitle())
                .createdAt(session.getCreatedAt())
                .build();
    }
}
