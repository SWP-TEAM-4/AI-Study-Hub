package com.aistudyhub.module.tag.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTagRequest {

    @NotBlank(message = "Tag name is required")
    @Size(max = 100, message = "Tag name must not exceed 100 characters")
    private String name;

    @Size(max = 50, message = "Tag type must not exceed 50 characters")
    private String type;

    @Size(max = 20, message = "Color must not exceed 20 characters")
    private String color;
}
