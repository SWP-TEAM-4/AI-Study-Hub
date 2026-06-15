package com.aistudyhub.module.chat.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DeleteChatSessionResponse {

    private boolean deleted;
}
