package com.aistudyhub.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * Owner: BE2 – AI / OpenAI config
 */
@Getter
@Configuration
public class OpenAIConfig {

    @Value("${app.ai.openai.api-key:}")
    private String apiKey;

    @Value("${app.ai.openai.model:gpt-4o-mini}")
    private String model;

    @Value("${app.ai.openai.base-url:https://api.openai.com/v1}")
    private String baseUrl;
}
