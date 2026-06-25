package com.aistudyhub.module.admin.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.module.admin.dto.AdminContentResponse;
import com.aistudyhub.module.admin.dto.UpdateVisibilityRequest;
import com.aistudyhub.module.admin.service.AdminContentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/contents")
@RequiredArgsConstructor
public class AdminContentController {
        private final AdminContentService adminContentService;

        @GetMapping
        public ApiResponse<List<AdminContentResponse>> getContents(
                        @RequestParam(required = false) Long ownerId,
                        @RequestParam(required = false) Long subjectId,
                        @RequestParam(required = false) Visibility visibility,
                        @RequestParam(required = false) MarketStatus marketStatus) {

                return ApiResponse.success(
                                adminContentService.getContents(
                                                ownerId,
                                                subjectId,
                                                visibility,
                                                marketStatus));
        }

        @GetMapping("/{targetType}/{targetId}")
        public ApiResponse<AdminContentResponse> getContent(
                        @PathVariable String targetType,
                        @PathVariable Long targetId) {

                return ApiResponse.success(
                                adminContentService.getContent(
                                                targetType,
                                                targetId));
        }

        @PatchMapping("/{targetType}/{targetId}/visibility")
        public ApiResponse<AdminContentResponse> updateVisibility(
                        @PathVariable String targetType,
                        @PathVariable Long targetId,
                        @RequestBody UpdateVisibilityRequest request) {

                return ApiResponse.success(adminContentService.updateVisibility(
                                targetType,
                                targetId,
                                request.getVisibility()));
        }

        @DeleteMapping("/{targetType}/{targetId}")
        public ApiResponse<Void> deleteContent(@PathVariable String targetType, @PathVariable Long targetId) {
                adminContentService.deleteContent(
                                targetType,
                                targetId);
                return ApiResponse.success("Delete Content successfully");
        }
}
