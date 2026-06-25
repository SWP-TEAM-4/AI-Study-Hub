package com.aistudyhub.module.admin.service;

import java.util.List;

import com.aistudyhub.common.enums.MarketStatus;
import com.aistudyhub.common.enums.Visibility;
import com.aistudyhub.module.admin.dto.AdminContentResponse;

public interface AdminContentService {
        List<AdminContentResponse> getContents(
                        Long ownerId,
                        Long subjectId,
                        Visibility visibility,
                        MarketStatus marketStatus);

        AdminContentResponse getContent(
                        String targetType,
                        Long targetId);

        AdminContentResponse updateVisibility(
                        String targetType,
                        Long targetId,
                        Visibility visibility);

        void updateMarketStatus(
                        String targetType,
                        Long targetId,
                        MarketStatus marketStatus);

        void deleteContent(
                        String targetType,
                        Long targetId);
}
