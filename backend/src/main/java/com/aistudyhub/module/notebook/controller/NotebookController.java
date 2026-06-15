package com.aistudyhub.module.notebook.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.module.notebook.dto.CreateNotebookRequest;
import com.aistudyhub.module.notebook.dto.NotebookResponse;
import com.aistudyhub.module.notebook.dto.UpdateNotebookRequest;
import com.aistudyhub.module.notebook.service.NotebookService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PutMapping;

@RestController
@RequestMapping("/api/notebooks")
@RequiredArgsConstructor
public class NotebookController {
    private final NotebookService notebookService;

    @PostMapping

    public ApiResponse<NotebookResponse> createNotebook(@RequestParam long userId,
            @Valid @RequestBody CreateNotebookRequest request) {
        return ApiResponse.success(notebookService.createNotebook(userId, request));
    }

    public ApiResponse<List<NotebookResponse>> getNotebooksByUserId(long userId) {
        return ApiResponse.success(notebookService.getNotebooksByUserId(userId));
    }

    public ApiResponse<NotebookResponse> getDetail(long notebookId, long userId) {
        return ApiResponse.success(notebookService.getDetail(notebookId, userId));
    }

    @PutMapping("/{notebookId}")
    public ApiResponse<NotebookResponse> updateNotebook(@PathVariable long notebookId, @RequestParam long userId,
            @Valid @RequestBody UpdateNotebookRequest request) {
        return ApiResponse.success(notebookService.updateNotebook(notebookId, userId, request));
    }

    public ApiResponse<Void> deleteNotebook(long notebookId, long userId) {
        notebookService.deleteNotebook(notebookId, userId);
        return ApiResponse.success("Notebook deleted successfully");
    }
}
