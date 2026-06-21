package com.aistudyhub.module.academic.combo.service;

import com.aistudyhub.module.academic.combo.dto.CreateComboRequest;
import com.aistudyhub.module.academic.combo.dto.ComboResponse;
import com.aistudyhub.module.subject.dto.SubjectResponse;
import java.util.List;

public interface ComboService {
    ComboResponse createCombo(CreateComboRequest request);
    List<ComboResponse> getAllCombos();
    ComboResponse getComboById(Long id);
    List<SubjectResponse> getSubjectsByComboId(Long comboId);
    void addSubjectToCombo(Long comboId, Long subjectId);
    void removeSubjectFromCombo(Long comboId, Long subjectId);
}
