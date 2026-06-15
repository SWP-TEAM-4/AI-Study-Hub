package com.aistudyhub.module.academic.Semester.Service;

import java.util.List;

import com.aistudyhub.module.academic.Semester.dto.CreateSemesterRequest;
import com.aistudyhub.module.academic.Semester.dto.SemesterResponse;
import com.aistudyhub.module.academic.Semester.dto.UpdateSemesterRequest;

public interface SemesterService {
    SemesterResponse createSemester(CreateSemesterRequest request);

    List<SemesterResponse> getAllSemesters();

    SemesterResponse getSemesterById(Long id);

    SemesterResponse updateSemester(Long id, UpdateSemesterRequest request);

    void deleteSemester(Long id);
}
