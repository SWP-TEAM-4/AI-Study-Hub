package com.aistudyhub.module.subject.controller;

import org.springframework.web.bind.annotation.RestController;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.module.subject.dto.CreateSubjectRequest;
import com.aistudyhub.module.subject.dto.SubjectResponse;
import com.aistudyhub.module.subject.dto.UpdateSubjectRequest;
import com.aistudyhub.module.subject.service.SubjectService;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;

@RestController
@RequiredArgsConstructor
@Tag(name = "Subject", description = "lấy môn học có trong danh sách")
public class SubjectController {
    private final SubjectService subjectService;

    @GetMapping("/api/subjects")
    public ApiResponse<List<SubjectResponse>> searchSubjects(@RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer standardSemesterNumber) {
        return ApiResponse.success(subjectService.searchSubjects(keyword, standardSemesterNumber));
    }

    @GetMapping("/api/subjects/{id}")
    public ApiResponse<SubjectResponse> getSubjectById(@RequestParam Long id) {
        return ApiResponse.success(subjectService.getSubjectById(id));
    }

    @PostMapping("/api/admin/subjects")
    public ApiResponse<SubjectResponse> createSubject(@RequestBody CreateSubjectRequest request) {
        return ApiResponse.success(subjectService.createSubject(request));
    }

    @PutMapping("/api/admin/subjects/{id}")
    public ApiResponse<SubjectResponse> updateSubject(@PathVariable Long id,
            @Valid @RequestBody UpdateSubjectRequest request) {
        return ApiResponse.success(subjectService.updateSubject(id, request));
    }

    @DeleteMapping("/api/admin/subjects/{id}")
    public ApiResponse<Void> deleteSubject(@PathVariable Long id) {
        subjectService.deleteSubject(id);
        return ApiResponse.success("Delete Subject is successfully");
    }
}
