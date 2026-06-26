import { Notify } from "notiflix";

/**
 * Xử lý lỗi API tập trung và hiển thị thông báo Notiflix.
 * @param error Lỗi bắt được từ try/catch (unknown/any)
 * @param fallbackMessage Thông báo mặc định nếu không parse được lỗi
 */
export function handleApiError(error: unknown, fallbackMessage: string = "Đã xảy ra lỗi hệ thống"): void {
  let message = fallbackMessage;

  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
  } else if (typeof error === "object" && error !== null) {
    // Thường các api client trả về object chứa message
    const anyError = error as Record<string, unknown>;
    if (typeof anyError.message === "string") {
      message = anyError.message;
    }
  }

  Notify.failure(message);
  console.error("[API Error]:", error);
}
