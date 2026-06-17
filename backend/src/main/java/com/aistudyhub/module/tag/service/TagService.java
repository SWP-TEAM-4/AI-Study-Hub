package com.aistudyhub.module.tag.service;

import com.aistudyhub.module.tag.dto.CreateTagRequest;
import com.aistudyhub.module.tag.dto.TagResponse;
import java.util.List;

public interface TagService {
    TagResponse createTag(CreateTagRequest request);
    List<TagResponse> getAllTags();
    List<TagResponse> getTagsByDocumentId(Long documentId);
    void addTagToDocument(Long documentId, Long tagId);
    void removeTagFromDocument(Long documentId, Long tagId);
}
