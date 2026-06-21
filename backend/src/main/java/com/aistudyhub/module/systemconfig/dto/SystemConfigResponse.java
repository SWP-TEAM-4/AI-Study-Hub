package com.aistudyhub.module.systemconfig.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemConfigResponse {

    private Long id;
    private String configKey;
    private String configValue;
    private String description;
}
