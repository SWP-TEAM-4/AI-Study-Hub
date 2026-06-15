package com.aistudyhub.module.notebook.service;

import java.util.List;

import com.aistudyhub.module.notebook.dto.CreateNotebookRequest;
import com.aistudyhub.module.notebook.dto.NotebookResponse;
import com.aistudyhub.module.notebook.dto.UpdateNotebookRequest;

public interface NotebookService {
    NotebookResponse createNotebook(long userId, CreateNotebookRequest request);

    List<NotebookResponse> getNotebooksByUserId(long userId);

    NotebookResponse getDetail(long notebookId, long userId);

    NotebookResponse updateNotebook(long notebookId, long userId, UpdateNotebookRequest request);

    void deleteNotebook(long notebookId, long userId);

}
