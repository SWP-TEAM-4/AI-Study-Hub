package com.aistudyhub.module.subject.service;

import com.aistudyhub.repository.NotebookRepository;
import java.util.List;

import org.springframework.stereotype.Service;

import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.Subject;
import com.aistudyhub.module.subject.dto.CreateSubjectRequest;
import com.aistudyhub.module.subject.dto.SubjectResponse;
import com.aistudyhub.module.subject.dto.UpdateSubjectRequest;
import com.aistudyhub.repository.SubjectRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SubjectServiceImpl implements SubjectService {
    private final NotebookRepository notebookRepository;
    private final SubjectRepository subjectRepository;

    @Override
    public SubjectResponse createSubject(CreateSubjectRequest request) {
        if (subjectRepository.existsByCode(request.getCode())) {
            throw new AppException(ErrorCode.SUBJECT_CODE_DUPLICATE);
        }
        Subject subject = Subject.builder()
                .code(request.getCode())
                .name(request.getName())
                .standardSemesterNumber(request.getStandardSemesterNumber())
                .build();
        subject = subjectRepository.save(subject);
        return SubjectResponse.builder()
                .id(subject.getId())
                .code(subject.getCode())
                .name(subject.getName())
                .standardSemesterNumber(subject.getStandardSemesterNumber())
                .build();
    }

    @Override
    public List<SubjectResponse> searchSubjects(String keyword, Integer standardSemesterNumber) {
        String normalizedKeyword = keyword == null || keyword.isBlank() ? null : keyword.trim();
        List<Subject> subjects;

        if (normalizedKeyword == null && standardSemesterNumber == null) {
            subjects = subjectRepository.findAllByOrderByCodeAsc();
        } else if (normalizedKeyword == null) {
            subjects = subjectRepository.findByStandardSemesterNumberOrderByCodeAsc(standardSemesterNumber);
        } else if (standardSemesterNumber == null) {
            subjects = subjectRepository.searchByKeyword(normalizedKeyword);
        } else {
            subjects = subjectRepository.searchByKeywordAndSemester(normalizedKeyword, standardSemesterNumber);
        }

        return subjects.stream()
                .map(subject -> SubjectResponse.builder()
                        .id(subject.getId())
                        .code(subject.getCode())
                        .name(subject.getName())
                        .standardSemesterNumber(subject.getStandardSemesterNumber())
                        .build())
                .toList();
    }

    @Override
    public SubjectResponse getSubjectById(Long id) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SUBJECT_NOT_FOUND));
        return SubjectResponse.builder()
                .id(subject.getId())
                .code(subject.getCode())
                .name(subject.getName())
                .standardSemesterNumber(subject.getStandardSemesterNumber())
                .build();
    }

    @Override
    public SubjectResponse updateSubject(Long id, UpdateSubjectRequest request) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SUBJECT_NOT_FOUND));
        if (!subject.getCode().equals(request.getCode()) && subjectRepository.existsByCode(request.getCode())) {
            throw new AppException(ErrorCode.SUBJECT_CODE_DUPLICATE);
        }
        subject.setCode(request.getCode());
        subject.setName(request.getName());
        subject.setStandardSemesterNumber(request.getStandardSemesterNumber());
        subject = subjectRepository.save(subject);
        return SubjectResponse.builder()
                .id(subject.getId())
                .code(subject.getCode())
                .name(subject.getName())
                .standardSemesterNumber(subject.getStandardSemesterNumber())
                .build();
    }

    @Override
    public void deleteSubject(Long id) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SUBJECT_NOT_FOUND));
        if (notebookRepository.existsBySubjectId(id)) {
            throw new RuntimeException("Cannot delete subject because it is being used by notebooks");
        }
        subjectRepository.delete(subject);
    }
}
