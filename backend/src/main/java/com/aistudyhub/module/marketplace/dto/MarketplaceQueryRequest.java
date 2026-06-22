package com.aistudyhub.module.marketplace.dto;

import lombok.*;

/**
 * DTO đóng gói toàn bộ các tham số tìm kiếm, bộ lọc và phân trang từ Frontend
 * gửi lên.
 * Giúp thu gọn tham số đầu vào cho cả Controller và Service.
 * 
 * Owner: BE3 (Task BE-028)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketplaceQueryRequest {

    private Integer page;
    private Integer size;
    private String keyword;

    // Tiêu chí sắp xếp: "newest", "downloadCount", hoặc "acceptPercentage"
    private String sort;

    private Long subjectId;
    private Long academicTermId;
    private String examType;
}