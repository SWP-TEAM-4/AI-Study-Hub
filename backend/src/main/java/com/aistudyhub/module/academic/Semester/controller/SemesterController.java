package com.aistudyhub.module.academic.Semester.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.module.academic.Semester.Service.SemesterService;
import com.aistudyhub.module.academic.Semester.dto.CreateSemesterRequest;
import com.aistudyhub.module.academic.Semester.dto.SemesterResponse;
import com.aistudyhub.module.academic.Semester.dto.UpdateSemesterRequest;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PutMapping;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SemesterController {
    private final SemesterService semesterService;

    @PostMapping("/admin/semesters")
    public ApiResponse<SemesterResponse> createSemester(@RequestBody CreateSemesterRequest request) {
        SemesterResponse response = semesterService.createSemester(request);
        return ApiResponse.success(response);
    }

    @GetMapping("/semesters")
    public ApiResponse<List<SemesterResponse>> getAllSemesters() {
        List<SemesterResponse> response = semesterService.getAllSemesters();
        return ApiResponse.success(response);
    }

    @GetMapping("/admin/semesters/{id}")
    public ApiResponse<SemesterResponse> getSemesterById(@PathVariable Long id) {
        SemesterResponse response = semesterService.getSemesterById(id);
        return ApiResponse.success(response);
    }

    @PutMapping("/admin/semesters/{id}")
    public ApiResponse<SemesterResponse> updateSemester(@PathVariable Long id,
            @RequestBody UpdateSemesterRequest request) {
        SemesterResponse response = semesterService.updateSemester(id, request);
        return ApiResponse.success(response);
    }

    @DeleteMapping("/admin/semesters/{id}")
    public ApiResponse<Void> deleteSemester(@PathVariable Long id) {
        semesterService.deleteSemester(id);
        return ApiResponse.success("Semester deleted successfully");
    }
}
