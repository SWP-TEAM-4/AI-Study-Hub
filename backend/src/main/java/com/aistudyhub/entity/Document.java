package com.aistudyhub.entity;

import java.time.LocalDateTime;

public class Document {
    private long id;
    private long userId;
    private long subjectId;
    private String title;
    private String description;
    private String fileUrl;
    private String cloudFileId;
    private String fileType;
    private long fileSize;
    private String visibility;
    private String marketStatus;
    private int downloadCount;
    private int reviewCount;
    private double acceptPercentage;
    private String aiVerdictNote;
    private String processingStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
