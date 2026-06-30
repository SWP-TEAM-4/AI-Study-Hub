package com.aistudyhub.module.notebook.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.Notebook;
import com.aistudyhub.entity.Subject;
import com.aistudyhub.entity.User;
import com.aistudyhub.module.notebook.dto.CreateNotebookRequest;
import com.aistudyhub.module.notebook.dto.NotebookResponse;
import com.aistudyhub.module.notebook.dto.UpdateNotebookRequest;
import com.aistudyhub.repository.NotebookRepository;
import com.aistudyhub.repository.SubjectRepository;
import com.aistudyhub.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NotebookServiceImpl implements NotebookService {
    private final NotebookRepository notebookRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;

    @Override
    public NotebookResponse createNotebook(long userId, CreateNotebookRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new AppException(ErrorCode.SUBJECT_NOT_FOUND));
        Notebook notebook = Notebook.builder()
                .title(request.getTitle())
                .subject(subject)
                .user(user)
                .build();
        notebook = notebookRepository.save(notebook);
        return mapToResponse(notebook);
    }

    private NotebookResponse mapToResponse(Notebook notebook) {
        return NotebookResponse.builder()
                .id(notebook.getId())
                .title(notebook.getTitle())
                .subjectId(notebook.getSubject() != null ? notebook.getSubject().getId() : null)
                .createdAt(notebook.getCreatedAt())
                .build();
    }

    @Override
    public List<NotebookResponse> getNotebooksByUserId(long userId) {
        return notebookRepository.findByUserId(userId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public NotebookResponse getDetail(long notebookId, long userId) {
        Notebook notebook = notebookRepository.findByIdAndUserId(notebookId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOTEBOOK_NOT_FOUND));
        return mapToResponse(notebook);
    }

    @Override
    public NotebookResponse updateNotebook(long notebookId, long userId, UpdateNotebookRequest request) {
        Notebook notebook = notebookRepository.findByIdAndUserId(notebookId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOTEBOOK_NOT_FOUND));
        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new AppException(ErrorCode.SUBJECT_NOT_FOUND));
        notebook.setTitle(request.getTitle());
        notebook.setSubject(subject);
        notebook = notebookRepository.save(notebook);
        return mapToResponse(notebook);
    }

    @Override
    public void deleteNotebook(long notebookId, long userId) {
        Notebook notebook = notebookRepository.findByIdAndUserId(notebookId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.NOTEBOOK_NOT_FOUND));
        notebookRepository.delete(notebook);
    }

    // Implementation of the methods defined in the NotebookService interface
}
