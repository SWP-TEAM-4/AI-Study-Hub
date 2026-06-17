package com.aistudyhub.module.academic.combo.dto;

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
public class CreateComboRequest {

    @NotBlank(message = "Combo code is required")
    @Size(max = 50, message = "Combo code must not exceed 50 characters")
    private String code;

    @NotBlank(message = "Combo name is required")
    @Size(max = 255, message = "Combo name must not exceed 255 characters")
    private String name;

    private String description;
}
