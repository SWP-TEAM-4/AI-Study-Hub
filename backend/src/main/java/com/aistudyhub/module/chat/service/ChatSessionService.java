package com.aistudyhub.module.chat.service;

import com.aistudyhub.common.enums.ActivityActionType;
import com.aistudyhub.common.enums.ActivityTargetType;
import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.ChatSession;
import com.aistudyhub.entity.Notebook;
import com.aistudyhub.module.activitylog.service.ActivityLogService;
import com.aistudyhub.module.chat.dto.ChatSessionResponse;
import com.aistudyhub.module.chat.dto.CreateChatSessionRequest;
import com.aistudyhub.module.chat.dto.DeleteChatSessionResponse;
import com.aistudyhub.module.chat.dto.ReportChatSessionRequest;
import com.aistudyhub.module.chat.dto.UpdateChatSessionAccessRequest;
import com.aistudyhub.repository.ChatSessionRepository;
import com.aistudyhub.repository.NotebookRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatSessionService {

    private final ChatSessionRepository chatSessionRepository;
    private final NotebookRepository notebookRepository;
    private final ActivityLogService activityLogService;

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
    public ChatSessionResponse updateSessionAccess(Long sessionId, Long userId, UpdateChatSessionAccessRequest request) {
        ChatSession session = resolveOwnedSession(sessionId, userId);

        if (request.getIsPrivate() != null) {
            session.setIsPrivate(request.getIsPrivate());
            if (Boolean.TRUE.equals(request.getIsPrivate())) {
                session.setAdminAccessAllowed(false);
            }
        }
        if (request.getAdminAccessAllowed() != null) {
            boolean allowAdminAccess = Boolean.TRUE.equals(request.getAdminAccessAllowed())
                    && !Boolean.TRUE.equals(session.getIsPrivate());
            session.setAdminAccessAllowed(allowAdminAccess);
        }
        if (StringUtils.hasText(request.getAdminReportReason())) {
            session.setAdminReportReason(normalize(request.getAdminReportReason()));
        }

        ChatSession saved = chatSessionRepository.save(session);
        activityLogService.log(userId, ActivityActionType.UPDATE_CHAT_SESSION_GOVERNANCE,
                ActivityTargetType.CHAT_SESSION, saved.getId(),
                Map.of(
                        "isPrivate", Boolean.TRUE.equals(saved.getIsPrivate()),
                        "adminAccessAllowed", Boolean.TRUE.equals(saved.getAdminAccessAllowed())
                ),
                saved.getTitle());
        log.info("Updated chat session access sessionId={} userId={} private={} adminAccessAllowed={}",
                sessionId, userId, saved.getIsPrivate(), saved.getAdminAccessAllowed());
        return toResponse(saved);
    }

    @Transactional
    public ChatSessionResponse reportSession(Long sessionId, Long userId, ReportChatSessionRequest request) {
        ChatSession session = resolveOwnedSession(sessionId, userId);
        session.setReportedToAdmin(true);
        session.setAdminReportReason(normalize(request.getReason()));
        session.setAdminReportedAt(LocalDateTime.now());

        ChatSession saved = chatSessionRepository.save(session);
        activityLogService.log(userId, ActivityActionType.REPORT_CONTENT,
                ActivityTargetType.CHAT_SESSION, saved.getId(),
                Map.of(
                        "reason", saved.getAdminReportReason(),
                        "reportedAt", saved.getAdminReportedAt().toString()
                ),
                saved.getTitle(), saved.getAdminReportReason());
        log.info("User {} reported chat session {} to admin", userId, sessionId);
        return toResponse(saved);
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

    private String normalize(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        String normalized = value.replaceAll("\\s+", " ").trim();
        return normalized.isEmpty() ? null : normalized;
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
                .isPrivate(Boolean.TRUE.equals(session.getIsPrivate()))
                .adminAccessAllowed(Boolean.TRUE.equals(session.getAdminAccessAllowed()))
                .reportedToAdmin(Boolean.TRUE.equals(session.getReportedToAdmin()))
                .adminReportReason(session.getAdminReportReason())
                .adminReportedAt(session.getAdminReportedAt())
                .createdAt(session.getCreatedAt())
                .build();
    }
}
