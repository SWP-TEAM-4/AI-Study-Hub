package com.aistudyhub.repository;

import com.aistudyhub.entity.Test;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TestRepository extends JpaRepository<Test, Long> {
    // đã có sẵn trong JpaRepository nên không cần khai báo thêm hàm gì ở đây.

}
