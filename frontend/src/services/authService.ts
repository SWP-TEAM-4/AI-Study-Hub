export interface AuthUser {
  email: string;
  role?: string;
  // Thêm các trường khác của user nếu có
}

// Đổi từ mockLogin sang hàm login thực tế sử dụng fetch
export const login = async (email: string, password: string) => {
  // Thay URL này bằng địa chỉ API Backend thật của bạn (Ví dụ: Node.js, Java Spring Boot...)
  // Nếu chưa có backend, bạn cứ để URL này để chạy thử, nó sẽ báo đỏ (Fail) nhưng SẼ HIỆN trong tab Fetch/XHR
  const RESPONSE_URL = "http://localhost:8080/api/auth/login"; 

  const response = await fetch(RESPONSE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  // Nếu Server trả về lỗi (4xx, 5xx) thì ném ra lỗi để giao diện bắt được
  if (!response.ok) {
    throw new Error("Đăng nhập thất bại");
  }

  // Trả về dữ liệu JSON (thường chứa { token, user })
  return await response.json();
};