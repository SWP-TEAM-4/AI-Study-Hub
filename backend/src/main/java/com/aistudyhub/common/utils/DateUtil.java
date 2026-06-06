package com.aistudyhub.common.utils;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;

public final class DateUtil {

    private DateUtil() {
    }

    public static Date toDate(LocalDateTime ldt) {
        return Date.from(ldt.atZone(ZoneId.systemDefault()).toInstant());
    }

    public static LocalDateTime fromDate(Date date) {
        return date.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
    }

    public static boolean isExpired(LocalDateTime expiredAt) {
        return LocalDateTime.now().isAfter(expiredAt);
    }
}
