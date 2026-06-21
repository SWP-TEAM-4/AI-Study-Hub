package com.aistudyhub.module.quiz.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OptionRequest {

    @Schema(
        description = "ID của đáp án. BỎ TRỐNG khi tạo mới. Điền ID khi muốn cập nhật đáp án đã có (chỉ dùng cho PUT).",
        example = "null"
    )
    private Long id;

    @Schema(description = "Nội dung đáp án", example = "Spring Boot là một framework Java")
    @NotBlank(message = "Option text is required")
    private String optionText;

    @Schema(description = "Đáp án này có đúng không?", example = "true")
    @NotNull(message = "isCorrect is required")
    private Boolean isCorrect;
}
