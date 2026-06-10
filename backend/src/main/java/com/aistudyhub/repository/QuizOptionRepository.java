package com.aistudyhub.repository;

import com.aistudyhub.entity.QuizOption;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuizOptionRepository extends JpaRepository<QuizOption, Long> {
    // Các thao tác CRUD cơ bản đã đủ thông qua JpaRepository.
    // Việc xử lý options theo cascade được thực hiện qua QuizQuestion entity.
}
