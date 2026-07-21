/**
 * Parse JSON một cách an toàn — trả về fallback nếu input rỗng hoặc không hợp lệ.
 *
 * Tại sao cần: Khi backend / proxy / CDN (Cloudflare, nginx) trả về HTML
 * thay vì JSON (502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout,
 * trang error mặc định), `JSON.parse(...)` sẽ throw `SyntaxError`. Nếu
 * không catch, error văng ra ngoài, toast lỗi nhảy lung tung và request
 * không xử lý đúng cách.
 *
 * Adapter này luôn trả về object hợp lệ, không bao giờ throw.
 */
export function safeParseJson<T>(text: string | null | undefined, fallback: T): T {
  if (!text) return fallback;
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}