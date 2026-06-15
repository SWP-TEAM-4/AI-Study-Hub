package com.aistudyhub.module.subject.service;

import java.util.List;

import com.aistudyhub.module.subject.dto.CreateSubjectRequest;
import com.aistudyhub.module.subject.dto.SubjectResponse;
import com.aistudyhub.module.subject.dto.UpdateSubjectRequest;

public interface SubjectService {
    SubjectResponse createSubject(CreateSubjectRequest request);

    List<SubjectResponse> searchSubjects(String keyword, Integer StandardSemesterNumber);

    SubjectResponse getSubjectById(Long id);

    SubjectResponse updateSubject(Long id, UpdateSubjectRequest request);

    void deleteSubject(Long id);
}
