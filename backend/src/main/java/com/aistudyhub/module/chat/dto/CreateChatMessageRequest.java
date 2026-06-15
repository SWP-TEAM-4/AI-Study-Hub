package com.aistudyhub.module.chat.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateChatMessageRequest {

    @NotBlank(message = "Content is required")
    @Size(max = 4000, message = "Content must be at most 4000 characters")
    private String content;

    @Min(value = 1, message = "topK must be at least 1")
    @Max(value = 10, message = "topK must be at most 10")
    private Integer topK;
}
