package com.aistudyhub.module.quiz.dto;

import com.aistudyhub.common.enums.QuestionType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class QuestionRequest {

    @Schema(description = "Nội dung câu hỏi", example = "Spring Boot là gì?")
    @NotBlank(message = "Question text is required")
    private String questionText;

    @Schema(
        description = "Loại câu hỏi. SINGLE_CHOICE=1 đáp án đúng | MULTIPLE_CHOICE=nhiều đáp án đúng | FILL_IN_THE_BLANK=điền vào chỗ trống",
        example = "SINGLE_CHOICE"
    )
    @NotNull(message = "Question type is required")
    private QuestionType questionType;

    @Schema(description = "Giải thích đáp án (có thể bỏ trống)", example = "Spring Boot là framework giúp tạo ứng dụng Java nhanh chóng")
    private String explanation;

    @Schema(
        description = "Danh sách đáp án. SINGLE_CHOICE/MULTIPLE_CHOICE: cần îdần 2 đáp án, ít nhất 1 isCorrect=true. FILL_IN_THE_BLANK: để rỗng []."
    )
    @Valid
    @NotNull(message = "Options list must not be null")
    private List<OptionRequest> options = new ArrayList<>();
}
