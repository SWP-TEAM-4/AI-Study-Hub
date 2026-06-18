package com.aistudyhub.module.quiz.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/***
 * DTO nhận yêu cầu nộp bài thi từ client
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmitTestRequest {
    // xác nhận đồng ý nộp bài
    @NotNull(message = "confirmSubmit cannot be null")
    @AssertTrue(message = "You must confirm submission")
    private Boolean confirmSubmit;

}
