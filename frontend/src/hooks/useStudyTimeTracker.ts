import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";

export function useStudyTimeTracker() {
  const { isLoggedIn, user } = useAuthStore();
  const userId = user?.userId;
  const lastActiveRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!isLoggedIn || !userId) return;

    // Reset last active timestamp on mount or when auth changes
    lastActiveRef.current = Date.now();

    const handleActivity = () => {
      lastActiveRef.current = Date.now();
    };

    // Listen to user interaction events to detect active state
    const events = ["mousemove", "keydown", "scroll", "click", "mousedown", "touchstart"];
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Check active state and update study time every 10 seconds
    const interval = setInterval(() => {
      const now = Date.now();
      const isTabFocused = document.hasFocus();
      // User is active if there was interaction in the last 60 seconds
      const isUserActive = now - lastActiveRef.current < 60000;

      if (isTabFocused && isUserActive) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const date = String(today.getDate()).padStart(2, "0");
        const dateString = `${year}-${month}-${date}`; // YYYY-MM-DD in local time
        
        const storageKey = `study_seconds_${userId}_${dateString}`;
        const currentSeconds = parseInt(localStorage.getItem(storageKey) || "0", 10);
        
        // Add 10 seconds of active time
        const newSeconds = currentSeconds + 10;
        localStorage.setItem(storageKey, String(newSeconds));

        // Dispatch a custom event to notify components about the update
        window.dispatchEvent(new CustomEvent("studyTimeUpdated", { detail: { dateString, seconds: newSeconds } }));
      }
    }, 10000);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(interval);
    };
  }, [isLoggedIn, userId]);
}
