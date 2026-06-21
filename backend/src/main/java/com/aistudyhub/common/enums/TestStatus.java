package com.aistudyhub.common.enums;

/**
 * Định nghĩa các trạng thái của một bài kiểm tra (Test)
 * - IN_PROGRESS: User đang trong quá trình làm bài, chưa nộp.
 * - COMPLETED: User đã bấm nộp bài (submit) và bài thi đã được tính điểm.
 */
public enum TestStatus {
    IN_PROGRESS,
    COMPLETED
}
