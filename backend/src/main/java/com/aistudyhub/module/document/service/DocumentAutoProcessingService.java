package com.aistudyhub.module.document.service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.concurrent.Semaphore;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentAutoProcessingService {

    private final DocumentChunkService documentChunkService;

    @Value("${app.document.auto-processing.max-concurrency:1}")
    private int maxConcurrency;

    private Semaphore processingSemaphore;

    @PostConstruct
    void init() {
        processingSemaphore = new Semaphore(Math.max(1, maxConcurrency));
    }

    @Async
    public void processUploadedDocument(Long documentId, Long userId) {
        boolean acquired = false;
        try {
            processingSemaphore.acquire();
            acquired = true;
            documentChunkService.autoProcessUploadedDocument(documentId, userId);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            log.warn("Automatic document processing interrupted documentId={} userId={}", documentId, userId);
        } catch (Exception ex) {
            log.error("Unhandled automatic document processing error documentId={} userId={}",
                    documentId, userId, ex);
        } finally {
            if (acquired) {
                processingSemaphore.release();
            }
        }
    }
}
