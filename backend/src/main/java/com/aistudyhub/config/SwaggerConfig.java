package com.aistudyhub.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Owner: BE1
 * Swagger UI: http://localhost:8080/swagger-ui.html
 * OpenAPI JSON: http://localhost:8080/v3/api-docs
 */
@Configuration
public class SwaggerConfig {

    private static final String SECURITY_SCHEME_NAME = "Bearer Authentication";

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("AI Study Hub API")
                        .version("1.0.0")
                        .description("Backend API cho hệ thống AI Study Hub – FPT University SWP391")
                        .contact(new Contact()
                                .name("AI Study Hub Team")
                                .email("team@aistudyhub.com")))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME,
                                new SecurityScheme()
                                        .name(SECURITY_SCHEME_NAME)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Paste JWT token vào đây (không cần prefix 'Bearer ')")));
    }
}
