# 🧪 MSW Mock API – Hướng Dẫn Cho Frontend Developer (v2)

> **TL;DR**: Chỉ cần viết **1 file service** → MSW mock sẵn → UI chạy ngay.

---

## 🚀 Quick Start (30 giây)

```bash
# 1. Cài dependencies
npm install

# 2. Chạy dev server
npm run dev

# 3. Mở browser → F12 Console → thấy:
# 🔶 [MSW] Mock API đang hoạt động
# 🔶 [MSW] Tài khoản test: student@fpt.edu.vn / Password123
```

---

## 📋 Quy trình làm 1 chức năng mới (CHỈ 3 BƯỚC)

### Bước 1: Mở file API contract → tìm endpoint

Mở `ai_study_hub_full_api_contract.html` trong browser → search tên module.

**Ví dụ**: Search "notebook" → thấy:

| Method | Endpoint | Chức năng |
|--------|----------|-----------|
| GET | `/api/notebooks` | Danh sách notebooks |
| POST | `/api/notebooks` | Tạo notebook mới |
| GET | `/api/notebooks/{id}` | Xem chi tiết |
| PUT | `/api/notebooks/{id}` | Cập nhật |
| DELETE | `/api/notebooks/{id}` | Xóa |

Nhấn nút **Copy** để copy response mẫu JSON.

### Bước 2: Viết file service (ĐÂY LÀ FILE DUY NHẤT CẦN VIẾT)

Tạo `src/services/notebookService.ts`:

```typescript
// ─────────────────────────────────────────────────────────────────────────────
// notebookService.ts
// ─────────────────────────────────────────────────────────────────────────────
// File này gọi fetch() tới http://localhost:8080 như bình thường.
// MSW sẽ TỰ ĐỘNG intercept và trả mock data.
// Khi backend xong → tắt MSW → fetch() đi thẳng tới backend thật.
// → KHÔNG CẦN SỬA GÌ TRONG FILE NÀY.
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = "http://localhost:8080/api/notebooks";

// ─── Types (copy từ API contract response) ────────────────────────────────────

/** Notebook item — copy fields từ response mẫu trong HTML */
export interface NotebookItem {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Response wrapper — mọi API đều trả về dạng này */
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errorCode?: string;
}

/** Pagination wrapper — dùng cho API có phân trang */
interface PaginatedData<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// ─── Helper: Lấy token từ localStorage ────────────────────────────────────────

function authHeaders(token?: string): HeadersInit {
  const t = token || localStorage.getItem("auth_token") || "";
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${t}`,
  };
}

// ─── API Functions ────────────────────────────────────────────────────────────

/** GET /api/notebooks — Lấy danh sách notebooks */
export async function getMyNotebooks(
  token: string,
  page = 0,
  size = 10
): Promise<PaginatedData<NotebookItem>> {
  const res = await fetch(`${BASE_URL}?page=${page}&size=${size}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Lấy danh sách notebook thất bại");
  const body: ApiResponse<PaginatedData<NotebookItem>> = await res.json();
  return body.data!;
}

/** GET /api/notebooks/:id — Xem chi tiết notebook */
export async function getNotebookById(
  token: string,
  id: number
): Promise<NotebookItem> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Không tìm thấy notebook");
  const body: ApiResponse<NotebookItem> = await res.json();
  return body.data!;
}

/** POST /api/notebooks — Tạo notebook mới */
export async function createNotebook(
  token: string,
  data: { title: string; description?: string }
): Promise<NotebookItem> {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Tạo notebook thất bại");
  const body: ApiResponse<NotebookItem> = await res.json();
  return body.data!;
}

/** PUT /api/notebooks/:id — Cập nhật notebook */
export async function updateNotebook(
  token: string,
  id: number,
  data: { title?: string; description?: string }
): Promise<NotebookItem> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Cập nhật notebook thất bại");
  const body: ApiResponse<NotebookItem> = await res.json();
  return body.data!;
}

/** DELETE /api/notebooks/:id — Xóa notebook */
export async function deleteNotebook(
  token: string,
  id: number
): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Xóa notebook thất bại");
}
```

### Bước 3: Gọi trong component — bình thường

```tsx
import { getMyNotebooks } from "../../services/notebookService";
import { useAuthStore } from "../../store/authStore";

function NotebookPage() {
  const token = useAuthStore((s) => s.accessToken);
  const [notebooks, setNotebooks] = useState([]);

  useEffect(() => {
    if (token) {
      getMyNotebooks(token).then(data => setNotebooks(data.items));
    }
  }, [token]);

  return (
    <div>
      {notebooks.map(nb => <div key={nb.id}>{nb.title}</div>)}
    </div>
  );
}
```

**✅ XONG! MSW tự động trả mock data → UI render → Dev tiếp UI!**

---

## 🔑 Chuyển sang Backend thật (1 dòng)

Mở file `.env`:

```diff
- VITE_USE_MOCK=true
+ VITE_USE_MOCK=false
```

Restart `npm run dev`. **Xong.** Không sửa file service hay component nào.

---

## 📝 Checklist khi làm chức năng mới

```
□ Mở HTML contract → tìm endpoint của module
□ Copy response mẫu → tạo TypeScript interface
□ Viết file services/xxxService.ts (copy template ở trên)
□ Gọi service trong component → test UI
□ Commit & push
```

**Chỉ 1 file. Không cần viết handler. Không cần viết mock data.**

---

## 👤 Tài khoản test

| Email | Password | Role |
|-------|----------|------|
| `student@fpt.edu.vn` | `Password123` | STUDENT |
| `reviewer@fpt.edu.vn` | `Password123` | REVIEWER |
| `admin@fpt.edu.vn` | `Password123` | ADMIN |

---

## ❓ FAQ

**Q: Tại sao không cần viết mock data hay handler?**
> Script `generateMswHandlers.cjs` đã tự động sinh **154 handlers** từ file OpenAPI contract. Mỗi handler trả response mẫu cứng. FE chỉ cần viết service gọi đúng URL → MSW match → trả data.

**Q: Mock data luôn trả giống nhau, không filter/pagination được?**
> Đúng, generated handler trả data cứng. Giai đoạn đầu **không sao** — mục tiêu là render UI trước. Khi cần logic phức tạp (filter, CRUD in-memory), viết thêm custom handler (xem mẫu `quizHandlers.ts`).

**Q: Backend thay đổi response thì sao?**
> Chạy `npm run mock:generate` để sinh lại handlers từ file JSON contract mới.

**Q: Sao login vẫn kiểm tra password được?**
> Login, Register, Quiz CRUD, Profile — những API frontend ĐANG DÙNG có custom handler riêng với logic thông minh. Các API mới chỉ dùng generated handler (data cứng).

---

## 📂 Tham khảo nhanh — Danh sách modules có sẵn mock

| Module | Endpoints | Ví dụ URL |
|--------|-----------|-----------|
| Auth | 4 | `/api/auth/login`, `/api/auth/register` |
| User | 12 | `/api/users/me`, `/api/admin/users` |
| Notebook | 5 | `/api/notebooks`, `/api/notebooks/{id}` |
| Document | 24 | `/api/documents`, `/api/documents/upload` |
| Quiz/Test | 22 | `/api/quizzes`, `/api/tests/{testId}` |
| Flashcard | 16 | `/api/flashcard-decks`, `/api/flashcards/due` |
| Chat/RAG | 6 | `/api/chat-sessions/{id}/messages` |
| Marketplace | 12 | `/api/marketplace/search` |
| Notification | 4 | `/api/notifications` |
| Academic Data | 14 | `/api/semesters`, `/api/subjects`, `/api/combos` |
| Governance | 14 | `/api/reports`, `/api/community/reviews` |
| Community | 7 | `/api/community-roles/me`, `/api/referrals` |
| Admin | 13 | `/api/admin/system-configs`, `/api/admin/feedbacks` |
| **Tổng** | **154** | **Tất cả đều đã mock sẵn** |

---

> **Nhớ: Viết 1 file service → MSW lo phần còn lại → Backend xong đổi 1 dòng `.env` → Ship 🚀**
