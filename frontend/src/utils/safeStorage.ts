/**
 * Safe wrapper around Web Storage (localStorage / sessionStorage).
 *
 * Tại sao cần: trên Safari/Firefox Private Mode, khi cookie bị block, hoặc
 * khi quota đầy, các method của `localStorage` sẽ throw
 * `SecurityError` / `QuotaExceededError`. Nếu gọi trực tiếp trong code
 * nghiệp vụ (login, fetch token, persist session) thì app sẽ crash.
 *
 * Adapter này nuốt hết error và fallback về giá trị mặc định an toàn.
 * Mọi call-site trong services / pages nên dùng thay vì `localStorage.*` trực tiếp.
 */

const isBrowser = (): boolean => typeof window !== "undefined";

function tryRun<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export const safeLocalStorage = {
  /** Trả về null nếu storage không khả dụng hoặc key không tồn tại. */
  getItem(key: string): string | null {
    if (!isBrowser()) return null;
    return tryRun(() => window.localStorage.getItem(key), null);
  },

  /** Trả về true nếu ghi thành công, false nếu storage bị block / quota đầy. */
  setItem(key: string, value: string): boolean {
    if (!isBrowser()) return false;
    return tryRun(() => {
      window.localStorage.setItem(key, value);
      return true;
    }, false);
  },

  removeItem(key: string): void {
    if (!isBrowser()) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },

  /**
   * Parse JSON an toàn. Trả về `fallback` nếu:
   *   - storage không khả dụng
   *   - key không tồn tại hoặc rỗng
   *   - value là chuỗi "undefined" / "null" (do bug set trước đó)
   *   - JSON.parse throw (data corrupt)
   */
  getJSON<T>(key: string, fallback: T): T {
    const raw = safeLocalStorage.getItem(key);
    if (!raw || raw === "undefined" || raw === "null") return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },

  /** Stringify + set. Trả về true nếu ghi thành công. */
  setJSON(key: string, value: unknown): boolean {
    try {
      return safeLocalStorage.setItem(key, JSON.stringify(value));
    } catch {
      return false;
    }
  },
};

export const safeSessionStorage = {
  getItem(key: string): string | null {
    if (!isBrowser()) return null;
    return tryRun(() => window.sessionStorage.getItem(key), null);
  },

  setItem(key: string, value: string): boolean {
    if (!isBrowser()) return false;
    return tryRun(() => {
      window.sessionStorage.setItem(key, value);
      return true;
    }, false);
  },

  removeItem(key: string): void {
    if (!isBrowser()) return;
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  },

  getJSON<T>(key: string, fallback: T): T {
    const raw = safeSessionStorage.getItem(key);
    if (!raw || raw === "undefined" || raw === "null") return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },

  setJSON(key: string, value: unknown): boolean {
    try {
      return safeSessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      return false;
    }
  },
};