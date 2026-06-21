package com.aistudyhub.module.tag.service;

import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.Document;
import com.aistudyhub.entity.DocumentTag;
import com.aistudyhub.entity.Tag;
import com.aistudyhub.module.tag.dto.CreateTagRequest;
import com.aistudyhub.module.tag.dto.TagResponse;
import com.aistudyhub.repository.DocumentRepository;
import com.aistudyhub.repository.DocumentTagRepository;
import com.aistudyhub.repository.TagRepository;
import com.aistudyhub.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TagServiceImpl implements TagService {

    private final TagRepository tagRepository;
    private final DocumentRepository documentRepository;
    private final DocumentTagRepository documentTagRepository;

    @Override
    @Transactional
    public TagResponse createTag(CreateTagRequest request) {
        if (tagRepository.existsByName(request.getName())) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Tag name already exists");
        }

        Tag tag = Tag.builder()
                .name(request.getName().trim())
                .type(request.getType() != null ? request.getType().trim() : null)
                .color(request.getColor() != null ? request.getColor().trim() : null)
                .build();

        Tag savedTag = tagRepository.save(tag);
        return toTagResponse(savedTag);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TagResponse> getAllTags() {
        return tagRepository.findAll().stream()
                .map(this::toTagResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TagResponse> getTagsByDocumentId(Long documentId) {
        if (!documentRepository.existsById(documentId)) {
            throw new AppException(ErrorCode.DOCUMENT_NOT_FOUND);
        }

        List<DocumentTag> mappings = documentTagRepository.findByDocumentId(documentId);
        return mappings.stream()
                .map(DocumentTag::getTag)
                .map(this::toTagResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void addTagToDocument(Long documentId, Long tagId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));

        validateDocumentOwnershipOrAdmin(document);

        Tag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new AppException(ErrorCode.TAG_NOT_FOUND));

        if (documentTagRepository.existsByDocumentIdAndTagId(documentId, tagId)) {
            throw new AppException(ErrorCode.DOCUMENT_TAG_DUPLICATE);
        }

        DocumentTag mapping = DocumentTag.builder()
                .document(document)
                .tag(tag)
                .build();

        documentTagRepository.save(mapping);
    }

    @Override
    @Transactional
    public void removeTagFromDocument(Long documentId, Long tagId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new AppException(ErrorCode.DOCUMENT_NOT_FOUND));

        validateDocumentOwnershipOrAdmin(document);

        if (!tagRepository.existsById(tagId)) {
            throw new AppException(ErrorCode.TAG_NOT_FOUND);
        }

        DocumentTag mapping = documentTagRepository.findByDocumentIdAndTagId(documentId, tagId)
                .orElseThrow(() -> new AppException(ErrorCode.TAG_NOT_FOUND));

        documentTagRepository.delete(mapping);
    }

    private void validateDocumentOwnershipOrAdmin(Document document) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof CustomUserDetails userDetails) {
            boolean isAdmin = userDetails.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            if (isAdmin) {
                return;
            }
            if (document.getUser() != null && document.getUser().getId().equals(userDetails.getId())) {
                return;
            }
        }
        throw new AppException(ErrorCode.DOCUMENT_ACCESS_DENIED);
    }

    private TagResponse toTagResponse(Tag tag) {
        return TagResponse.builder()
                .id(tag.getId())
                .name(tag.getName())
                .type(tag.getType())
                .color(tag.getColor())
                .build();
    }
}
