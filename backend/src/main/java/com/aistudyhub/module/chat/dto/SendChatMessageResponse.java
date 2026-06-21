package com.aistudyhub.module.chat.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SendChatMessageResponse {

    private ChatMessageResponse userMessage;
    private ChatMessageResponse aiMessage;
}
