package com.aistudyhub.common.utils;

import java.util.regex.Pattern;

public final class ValidationUtil {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    private static final int PASSWORD_MIN_LENGTH = 6;
    private static final int PASSWORD_MAX_LENGTH = 100;

    private ValidationUtil() {
    }

    public static boolean isValidEmail(String email) {
        return email != null && EMAIL_PATTERN.matcher(email).matches();
    }

    public static boolean isValidPassword(String password) {
        return password != null
                && password.length() >= PASSWORD_MIN_LENGTH
                && password.length() <= PASSWORD_MAX_LENGTH;
    }

    public static boolean isNotBlank(String value) {
        return value != null && !value.isBlank();
    }
}
