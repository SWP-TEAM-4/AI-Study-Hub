import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

// ─── Bootstrap: Khởi động MSW nếu đang ở chế độ Mock ─────────────────────────
async function bootstrap() {
  // Chỉ cần đổi VITE_USE_MOCK trong file .env để bật/tắt mock
  if (import.meta.env.VITE_USE_MOCK === "true") {
    const { worker } = await import("./mocks/browser");
    await worker.start({
      onUnhandledRequest: "bypass", // Cho phép request không có handler đi qua bình thường
    });
    console.log("🔶 [MSW] Mock API đang hoạt động — Tất cả API calls sẽ được mock");
    console.log("🔶 [MSW] Tài khoản test: student@fpt.edu.vn / Password123");
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

bootstrap();
