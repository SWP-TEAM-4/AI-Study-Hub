package com.aistudyhub.module.academic.combo.controller;

import com.aistudyhub.common.response.ApiResponse;
import com.aistudyhub.module.academic.combo.dto.CreateComboRequest;
import com.aistudyhub.module.academic.combo.dto.ComboResponse;
import com.aistudyhub.module.academic.combo.service.ComboService;
import com.aistudyhub.module.subject.dto.SubjectResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ComboController {

    private final ComboService comboService;

    @PostMapping("/admin/combos")
    public ApiResponse<ComboResponse> createCombo(@Valid @RequestBody CreateComboRequest request) {
        ComboResponse response = comboService.createCombo(request);
        return ApiResponse.success(response);
    }

    @GetMapping("/combos")
    public ApiResponse<List<ComboResponse>> getAllCombos() {
        List<ComboResponse> response = comboService.getAllCombos();
        return ApiResponse.success(response);
    }

    @GetMapping("/combos/{id}/subjects")
    public ApiResponse<List<SubjectResponse>> getSubjectsByComboId(@PathVariable Long id) {
        List<SubjectResponse> response = comboService.getSubjectsByComboId(id);
        return ApiResponse.success(response);
    }

    @PostMapping("/admin/combos/{comboId}/subjects/{subjectId}")
    public ApiResponse<Void> addSubjectToCombo(@PathVariable Long comboId, @PathVariable Long subjectId) {
        comboService.addSubjectToCombo(comboId, subjectId);
        return ApiResponse.success("Subject added to combo successfully");
    }

    @DeleteMapping("/admin/combos/{comboId}/subjects/{subjectId}")
    public ApiResponse<Void> removeSubjectFromCombo(@PathVariable Long comboId, @PathVariable Long subjectId) {
        comboService.removeSubjectFromCombo(comboId, subjectId);
        return ApiResponse.success("Subject removed from combo successfully");
    }
}
