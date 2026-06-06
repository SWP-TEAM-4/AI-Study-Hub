package com.aistudyhub.common.response;

import lombok.Builder;
import lombok.Getter;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Chuẩn phân trang – dùng khi API trả danh sách có phân trang.
 * <p>
 * Wrap trong ApiResponse: ApiResponse.success(PaginationResponse.of(page))
 */
@Getter
@Builder
public class PaginationResponse<T> {

    private List<T> items;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;

    public static <T> PaginationResponse<T> of(Page<T> page) {
        return PaginationResponse.<T>builder()
                .items(page.getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }

    public static <T> PaginationResponse<T> of(List<T> items, int page, int size, long totalElements) {
        int totalPages = size == 0 ? 0 : (int) Math.ceil((double) totalElements / size);
        return PaginationResponse.<T>builder()
                .items(items)
                .page(page)
                .size(size)
                .totalElements(totalElements)
                .totalPages(totalPages)
                .build();
    }
}
