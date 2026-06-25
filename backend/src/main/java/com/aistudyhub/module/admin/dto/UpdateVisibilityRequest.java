package com.aistudyhub.module.admin.dto;

import com.aistudyhub.common.enums.Visibility;

import lombok.Data;

@Data
public class UpdateVisibilityRequest {
    private Visibility visibility;
}
