import { useCallback, useEffect, useState } from "react";
import { notificationService } from "../services/notificationService";

export const NOTIFICATION_COUNT_EVENT = "notification-unread-count-changed";

export function publishUnreadNotificationCount(count: number) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<number>(NOTIFICATION_COUNT_EVENT, {
        detail: Math.max(0, count),
      }),
    );
  }
}

export function useUnreadNotificationCount() {
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const response = await notificationService.getMyNotifications({ page: 0, size: 100 });
      if (response.success) {
        setUnreadCount(response.data.items.filter((notification) => !notification.isRead).length);
      }
    } catch {
      // The notifications page already handles and displays request errors.
    }
  }, []);

  useEffect(() => {
    void refresh();

    const handleCountChanged = (event: Event) => {
      const count = (event as CustomEvent<number>).detail;
      if (typeof count === "number") setUnreadCount(Math.max(0, count));
      else void refresh();
    };

    window.addEventListener(NOTIFICATION_COUNT_EVENT, handleCountChanged);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(NOTIFICATION_COUNT_EVENT, handleCountChanged);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  return unreadCount;
}
