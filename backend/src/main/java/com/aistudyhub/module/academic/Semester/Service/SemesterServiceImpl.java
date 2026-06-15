package com.aistudyhub.module.academic.Semester.Service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.aistudyhub.common.exception.AppException;
import com.aistudyhub.common.exception.ErrorCode;
import com.aistudyhub.entity.Semester;
import com.aistudyhub.module.academic.Semester.dto.CreateSemesterRequest;
import com.aistudyhub.module.academic.Semester.dto.SemesterResponse;
import com.aistudyhub.module.academic.Semester.dto.UpdateSemesterRequest;
import com.aistudyhub.repository.SemesterRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SemesterServiceImpl implements SemesterService {
        private final SemesterRepository semesterRepository;

        @Override
        public SemesterResponse createSemester(CreateSemesterRequest request) {
                if (semesterRepository.existsByCode(request.getCode())) {
                        throw new AppException(ErrorCode.SEMESTER_CODE_DUPLICATE);
                }
                Semester semester = Semester.builder()
                                .code(request.getCode())
                                .name(request.getName())
                                .build();
                semester = semesterRepository.save(semester);
                return SemesterResponse.builder()
                                .id(semester.getId())
                                .code(semester.getCode())
                                .name(semester.getName())
                                .build();
        }

        @Override
        public List<SemesterResponse> getAllSemesters() {
                return semesterRepository.findAll().stream()
                                .map(semester -> SemesterResponse.builder()
                                                .id(semester.getId())
                                                .code(semester.getCode())
                                                .name(semester.getName())
                                                .build())
                                .toList();
        }

        @Override
        public SemesterResponse getSemesterById(Long id) {
                Semester semester = semesterRepository.findById(id)
                                .orElseThrow(() -> new AppException(ErrorCode.SEMESTER_NOT_FOUND,
                                                "Semester not found with id: " + id));
                return SemesterResponse.builder()
                                .id(semester.getId())
                                .code(semester.getCode())
                                .name(semester.getName())
                                .build();
        }

        @Override
        public SemesterResponse updateSemester(Long id, UpdateSemesterRequest request) {
                Semester semester = semesterRepository.findById(id)
                                .orElseThrow(() -> new AppException(ErrorCode.SEMESTER_NOT_FOUND,
                                                "Semester not found with id: " + id));
                if (semester.getCode().equals(request.getCode())
                                && semesterRepository.existsByCode(request.getCode())) {
                        throw new AppException(ErrorCode.SEMESTER_CODE_DUPLICATE);
                }
                semester.setCode(request.getCode());
                semester.setName(request.getName());
                semester = semesterRepository.save(semester);
                return SemesterResponse.builder()
                                .id(semester.getId())
                                .code(semester.getCode())
                                .name(semester.getName())
                                .build();
        }

        @Override
        public void deleteSemester(Long id) {
                Semester semester = semesterRepository.findById(id)
                                .orElseThrow(() -> new AppException(ErrorCode.SEMESTER_NOT_FOUND));
                semesterRepository.delete(semester);
        }

}
