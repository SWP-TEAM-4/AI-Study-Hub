package com.aistudyhub.module.notebook.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.module.notebook.dto.CreateNotebookRequest;
import com.aistudyhub.module.notebook.dto.NotebookResponse;
import com.aistudyhub.module.notebook.dto.UpdateNotebookRequest;
import com.aistudyhub.module.notebook.service.NotebookService;

import io.swagger.v3.oas.annotations.tags.Tag;
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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;

@RestController
@RequestMapping("/api/notebooks")
@RequiredArgsConstructor
@Tag(name = "Notebook", description = "quản lý notebook của user")
public class NotebookController {
    private final NotebookService notebookService;

    @PostMapping
    public ApiResponse<NotebookResponse> createNotebook(@RequestParam Long userId,
            @Valid @RequestBody CreateNotebookRequest request) {
        return ApiResponse.success(notebookService.createNotebook(userId, request));
    }

    @GetMapping
    public ApiResponse<List<NotebookResponse>> getNotebooksByUserId(@RequestParam Long userId) {
        return ApiResponse.success(notebookService.getNotebooksByUserId(userId));
    }

    @GetMapping("/{id}")
    public ApiResponse<NotebookResponse> getDetail(@PathVariable Long id, @RequestParam Long userId) {
        return ApiResponse.success(notebookService.getDetail(id, userId));
    }

    @PutMapping("/{id}")
    public ApiResponse<NotebookResponse> updateNotebook(@PathVariable Long id, @RequestParam Long userId,
            @Valid @RequestBody UpdateNotebookRequest request) {
        return ApiResponse.success(notebookService.updateNotebook(id, userId, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteNotebook(@PathVariable Long id, @RequestParam Long userId) {
        notebookService.deleteNotebook(id, userId);
        return ApiResponse.success("Notebook deleted successfully");
    }
}
