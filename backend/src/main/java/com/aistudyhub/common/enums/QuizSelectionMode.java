package com.aistudyhub.common.enums;

/**
 * Định nghĩa chế độ lựa chọn câu hỏi khi bắt đầu làm bài test.
 * - ALL: Lấy toàn bộ câu hỏi trong Quiz.
 * - SELECTED: Người dùng tự tích chọn danh sách câu hỏi cụ thể.
 * - RANDOM: Bốc ngẫu nhiên một số lượng câu hỏi nhất định từ Quiz.
 */
public enum QuizSelectionMode {
    ALL,
    SELECTED,
    RANDOM
}