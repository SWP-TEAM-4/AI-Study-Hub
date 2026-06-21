package com.aistudyhub.module.academic.combo.service;

import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.Combo;
import com.aistudyhub.entity.ComboSubject;
import com.aistudyhub.entity.Subject;
import com.aistudyhub.module.academic.combo.dto.CreateComboRequest;
import com.aistudyhub.module.academic.combo.dto.ComboResponse;
import com.aistudyhub.module.subject.dto.SubjectResponse;
import com.aistudyhub.repository.ComboRepository;
import com.aistudyhub.repository.ComboSubjectRepository;
import com.aistudyhub.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ComboServiceImpl implements ComboService {

    private final ComboRepository comboRepository;
    private final SubjectRepository subjectRepository;
    private final ComboSubjectRepository comboSubjectRepository;

    @Override
    @Transactional
    public ComboResponse createCombo(CreateComboRequest request) {
        if (comboRepository.existsByCode(request.getCode())) {
            throw new AppException(ErrorCode.COMBO_CODE_DUPLICATE);
        }

        Combo combo = Combo.builder()
                .code(request.getCode().trim())
                .name(request.getName().trim())
                .description(request.getDescription())
                .build();

        Combo savedCombo = comboRepository.save(combo);
        return toComboResponse(savedCombo);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ComboResponse> getAllCombos() {
        return comboRepository.findAll().stream()
                .map(this::toComboResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ComboResponse getComboById(Long id) {
        Combo combo = comboRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.COMBO_NOT_FOUND));
        return toComboResponse(combo);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubjectResponse> getSubjectsByComboId(Long comboId) {
        if (!comboRepository.existsById(comboId)) {
            throw new AppException(ErrorCode.COMBO_NOT_FOUND);
        }

        List<ComboSubject> mappings = comboSubjectRepository.findByComboId(comboId);
        return mappings.stream()
                .map(ComboSubject::getSubject)
                .map(this::toSubjectResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void addSubjectToCombo(Long comboId, Long subjectId) {
        Combo combo = comboRepository.findById(comboId)
                .orElseThrow(() -> new AppException(ErrorCode.COMBO_NOT_FOUND));

        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new AppException(ErrorCode.SUBJECT_NOT_FOUND));

        if (comboSubjectRepository.existsByComboIdAndSubjectId(comboId, subjectId)) {
            throw new AppException(ErrorCode.COMBO_SUBJECT_DUPLICATE);
        }

        ComboSubject mapping = ComboSubject.builder()
                .combo(combo)
                .subject(subject)
                .build();

        comboSubjectRepository.save(mapping);
    }

    @Override
    @Transactional
    public void removeSubjectFromCombo(Long comboId, Long subjectId) {
        if (!comboRepository.existsById(comboId)) {
            throw new AppException(ErrorCode.COMBO_NOT_FOUND);
        }

        if (!subjectRepository.existsById(subjectId)) {
            throw new AppException(ErrorCode.SUBJECT_NOT_FOUND);
        }

        ComboSubject mapping = comboSubjectRepository.findByComboIdAndSubjectId(comboId, subjectId)
                .orElseThrow(() -> new AppException(ErrorCode.SUBJECT_NOT_FOUND));

        comboSubjectRepository.delete(mapping);
    }

    private ComboResponse toComboResponse(Combo combo) {
        return ComboResponse.builder()
                .id(combo.getId())
                .code(combo.getCode())
                .name(combo.getName())
                .description(combo.getDescription())
                .createdAt(combo.getCreatedAt())
                .updatedAt(combo.getUpdatedAt())
                .build();
    }

    private SubjectResponse toSubjectResponse(Subject subject) {
        return SubjectResponse.builder()
                .id(subject.getId())
                .code(subject.getCode())
                .name(subject.getName())
                .standardSemesterNumber(subject.getStandardSemesterNumber())
                .build();
    }
}
