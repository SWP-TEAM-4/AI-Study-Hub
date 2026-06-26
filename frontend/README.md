<h1 align="center"> MindSpace - AI Study Hub</h1>

<p align="center">
  Nền tảng học tập thông minh ứng dụng Trí tuệ Nhân tạo (AI) và hệ thống RAG (Retrieval-Augmented Generation) để tối ưu hóa việc quản lý học liệu, tự động tạo Quiz, Flashcard và giải đáp thắc mắc.
</p>

---

##  Danh mục
1. [Giới thiệu tổng quan](#1-giới-thiệu-tổng-quan)
2. [Cấu trúc Màn hình và Chức năng](#2-cấu-trúc-màn-hình-và-chức-năng)
3. [Công nghệ và Công cụ sử dụng](#3-công-nghệ-và-công-cụ-sử-dụng)
4. [Kiến trúc & Định hướng thiết kế](#4-kiến-trúc--định-hướng-thiết-kế)

---

## 1. Giới thiệu tổng quan

**MindSpace** (AI Study Hub) là dự án cung cấp không gian học tập cá nhân hóa cho sinh viên (đặc biệt là sinh viên FPT University). Thay vì phải học chay hoặc nhồi nhét lý thuyết từ các tệp PDF dài hàng trăm trang, MindSpace tích hợp AI để đọc hiểu tài liệu (OCR/Vector Database), từ đó cung cấp một "Gia sư ảo" trực tiếp giải đáp bài học, tự động trích xuất các bài kiểm tra (Quiz) và bộ thẻ ghi nhớ (Flashcards). Hệ thống cũng mang tính mạng xã hội học thuật thông qua Marketplace (Cộng đồng).

---

## 2. Cấu trúc Màn hình và Chức năng

Dự án có cấu trúc điều hướng đa dạng với các trang (Screens) chính như sau:

| Tên Màn hình | Tệp tin (Component) | Chức năng chính |
| :--- | :--- | :--- |
| **Landing & Login** | `OrbisLanding.tsx`, `LoginPanel.tsx` | Trang đích với hiệu ứng vũ trụ 3D (Orbis) thu hút ánh nhìn. Cung cấp chức năng đăng nhập tài khoản an toàn (Email/Google), bao gồm màn hình Loader thẩm mỹ cao. |
| **Dashboard** | `DashboardPage.tsx` | Bảng điều khiển trung tâm. Tóm tắt biểu đồ học tập trong tuần (Recharts), hiển thị tài liệu tải lên gần đây, lối tắt mở Chat AI nhanh, và bảng xếp hạng danh dự (Top Contributors) dạng Modal. |
| **Notebooks** | `NotebooksPage.tsx`, `NotebookDetailPage.tsx` | Quản lý học liệu theo dạng thư mục (Notebooks) phân theo môn học (Subject). Màn hình chi tiết cho phép xem tất cả tài liệu, quiz, flashcard thuộc thư mục đó. |
| **Documents** | `DocumentsPage.tsx`, `SharedDocumentPage.tsx` | Nơi tải lên (Upload) các tài liệu (.pdf, .docx). Có chức năng xử lý trạng thái (Processing/Ready) khi hệ thống RAG đang trích xuất. `SharedDocumentPage` là giao diện Public khi người dùng chia sẻ link tài liệu ra bên ngoài. |
| **Chat Assistant** | `ChatPage.tsx` | Cửa sổ trò chuyện trực tiếp với AI. Người dùng có thể hỏi bất cứ khái niệm nào trong tài liệu của họ. AI sẽ truy xuất Vector DB và trả lời, kèm theo "Nguồn trích dẫn" từ các trang tài liệu. |
| **Quiz & Practice** | `QuizPage.tsx`, `QuizPracticePage.tsx` | Quản lý các bài trắc nghiệm tự động tạo bởi AI. Màn hình Practice hiển thị giao diện làm bài thi trực quan, có đếm thời gian và chấm điểm ngay lập tức. |
| **Flashcards** | `FlashcardsPage.tsx`, `FlashcardStudyPage.tsx` | Quản lý các bộ thẻ ghi nhớ. Sử dụng thuật toán lặp lại ngắt quãng (Spaced Repetition). Màn hình Study hiển thị thẻ 3D lật (Flip 3D) vô cùng trực quan. |
| **Community** | `CommunityPage.tsx`, `CommunityItemModal.tsx` | Chợ học liệu (Marketplace). Nơi sinh viên có thể chia sẻ tài liệu hay cho người khác, đánh giá (Rating 5 sao), và tích lũy điểm danh tiếng (Reputation Points). |
| **Profile** | `ProfilePage.tsx` | Quản lý thông tin cá nhân, cập nhật Avatar, mật khẩu. Tích hợp biểu đồ Recharts Radar hiển thị các "Kỹ năng / Môn học" nổi bật và Nhật ký hoạt động (Timeline). Nơi xin cấp quyền Reviewer. |
| **Admin** | `AdminPage.tsx` | Dành cho Quản trị viên. Gồm hệ thống Tabs con: Quản lý Users, Quản lý Hệ đào tạo (Majors/Combos), Marketplace, Badges, Báo cáo (Reports) và Cấu hình Hệ thống (System Configs). |
| **NotFound** | `NotFoundPage.tsx` | Giao diện hiển thị lỗi 404 (Không tìm thấy trang) với thiết kế hiện đại và nút điều hướng về trang chủ. |

---

## 3. Công nghệ và Công cụ sử dụng

Dưới đây là danh sách các công nghệ (Tech Stack) được sử dụng cho Frontend, lý do lựa chọn và định lượng minh chứng:

###  Framework & Build Tool
* **React 19**: Phiên bản mới nhất của React với Server Components, Actions, và các Hooks mới như `useActionState`.
  * **Tại sao?**: Giảm thiểu việc phải viết boilerplate code cho các tác vụ bất đồng bộ (async), cải thiện hiệu năng DOM diffing.
* **Vite 8**: Build tool thế hệ mới thay thế Webpack/CRA.
  * **Định lượng**: Tốc độ cold start chỉ từ **100-300ms** và tốc độ Hot Module Replacement (HMR) tính bằng mili-giây, nhanh hơn Webpack từ **10-100 lần** (Nguồn: Vitejs.dev). https://viblo.asia/p/so-sanh-vite-va-webpack-x7Z4D1yyJnX or https://www.mindsing.com/blog/technology-innovation/vite-replacing-webpack-modern-builds/
* **TypeScript 5.6**: Static typing cho JavaScript.
  * **Tại sao?**: Ngăn chặn đến **15%** các lỗi bugs cơ bản trước khi chạy thực tế (Nguồn: Microsoft Research), đặc biệt quan trọng khi gọi hơn 20+ API endpoints trong hệ thống. https://discovery.ucl.ac.uk/id/eprint/10064729/1/typestudy.pdf

###  Styling & UI System
* **Tailwind CSS v4**: Thư viện Utility-first CSS thế hệ thứ 4.
  * **Định lượng**: Tiết kiệm khoảng **70%** thời gian viết mã CSS thuần, tự động loại bỏ CSS thừa (Purge) giúp file CSS build ra thường nhỏ hơn **10KB** (Nguồn: Tailwind Labs). https://v3.tailwindcss.com/docs/optimizing-for-production#basic-usage
* **Shadcn UI (v4.11) & Radix UI**: Hệ thống components Unstyled nhưng có khả năng truy cập (Accessibility) xuất sắc.
  * **Tại sao?**: Thay vì bị gò bó bởi Material UI hay Ant Design, Shadcn UI cho phép copy-paste logic component và tự do định kiểu với Tailwind. Tuân thủ **100% WAI-ARIA** standard. Cấu trúc Component được quản lý thông qua **`class-variance-authority` (cva)** & `clsx`.

###  Animations & 3D
* **Framer Motion (v12.40)**: Thư viện tạo chuyển động chuẩn mực nhất trong React.
  * **Tại sao?**: Được sử dụng cho toàn bộ Page Transitions (chuyển trang mượt mà) và Shared Layout Animations, mang đến trải nghiệm App Native trên web.
* **GSAP (v3.15)**: Thư viện chuyển động siêu hiệu suất.
  * **Tại sao?**: Framer Motion dùng cho component, còn GSAP dùng cho các micro-interaction (như hiệu ứng đếm số CountUp ở màn hình Dashboard). GSAP có thể duy trì hoạt ảnh ổn định **60FPS** kể cả với hàng trăm phần tử.
* **Spline 3D (`@splinetool/react-spline`)**: Thư viện nhúng mô hình 3D tương tác.
  * **Tại sao?**: Nhúng các mô hình Robot 3D (kích thước nén chỉ khoảng ~2MB) tại Dashboard và Landing Page, tăng tỷ lệ người dùng tương tác ngay từ cái nhìn đầu tiên lên tới **40%** nhờ thiết kế hiện đại (Modern Web Design).

###  State Management & Data Fetching
* **Zustand (v5.0)**: Quản lý Global State.
  * **Tại sao?**: Dung lượng file cực kỳ nhỏ (chỉ khoảng **1.5KB gzipped**), nhẹ hơn Redux gấp 20 lần (Nguồn: Bundlephobia). Không yêu cầu Boilerplate phức tạp như Redux, phù hợp cho việc lưu trữ UI State (Theme, Sidebar, activeTabs).
* **Axios (v1.16)**: HTTP Client.
  * **Tại sao?**: Hỗ trợ Interceptors, rất thích hợp để quản lý luồng gắn JWT Bearer Token, kiểm tra hết hạn Token và Refresh token tự động.

###  Data Visualization & Utilities
* **Recharts (v3.8)**: Thư viện vẽ biểu đồ.
  * **Tại sao?**: Hoạt động dưới dạng các React Components có thể kết hợp (Composable), cho phép tái sử dụng màu CSS Variables của Tailwind (`var(--color-primary)`). Được dùng để vẽ Activity Bar Chart và Skills Radar Chart.
* **Notiflix (v3.2)**: Thư viện hiển thị Toast Notifications và Confirm Modals.
  * **Tại sao?**: Cực kỳ nhẹ, không phụ thuộc framework, cung cấp các hàm gọi thủ tục nhanh chóng `Notiflix.Notify.success()` không cần render JSX ở Root.
* **React Markdown**: Dành riêng cho màn hình Chat AI.
  * **Tại sao?**: AI trả về nội dung dưới dạng Markdown (bao gồm in đậm, code blocks, tables). Thư viện giúp phân tích cú pháp (parse) và kết xuất (render) an toàn tránh lỗi XSS.

---

## 4. Kiến trúc & Định hướng thiết kế

Dự án áp dụng phong cách thiết kế **Glassmorphism** kết hợp **Dark Mode mặc định (Midnight Ink & Cream)**:
* **Hệ màu (Color Palette)**: Sử dụng không gian màu `oklch` (chuẩn màu mới của CSS4) giúp độ bão hòa (chroma) và độ sáng (lightness) luôn ổn định giữa các màn hình, không bị chói mắt.
* **Kiến trúc AppShell**: Cấu trúc ứng dụng một trang (SPA) được bọc bởi lớp `AppShell` gồm Sidebar (dành cho PC) và Bottom Navigation (dành cho Mobile), giúp phân tách rõ ràng luồng UI cố định và luồng nội dung động.
* **Xử lý Z-Index linh hoạt bằng React Portal**: Hầu hết các Modals quan trọng (Settings, Bảng vàng) đều được `createPortal` chèn thẳng vào gốc HTML `body` để giải quyết triệt để sự cố Clipping và xung đột Context Transform từ hoạt ảnh.

> **Trạng thái**: Frontend Feature hoàn thiện. Sẵn sàng kết nối hoàn toàn với Hệ thống Microservices Backend (Java Spring Boot/Golang) và Cấu trúc dữ liệu Vector Qdrant/Milvus.
