# AI Study Hub – Backend
//test boot
## Tech Stack
- **Java 17** + **Spring Boot 3.2.x**
- **Spring Security 6** + **JWT (JJWT 0.12)**
- **Spring Data JPA** + **Hibernate**
- **PostgreSQL 16**
- **Flyway** (DB migration)
- **Springdoc OpenAPI 2** (Swagger UI)
- **Lombok**

## Team Ownership

| Backend | Module chính                                                     |
| ------- | ---------------------------------------------------------------- |
| **BE1** | Foundation, Auth, User, Security, Notification, SystemConfig,... |
| **BE2** | Academic, Notebook, Document, Tag, Chunk, Chat/RAG               |
| **BE3** | Quiz, Test, Flashcard, Marketplace, Governance, Community        |

## Quy tắc bất biến (KHÔNG được vi phạm)

```
1. Không push thẳng vào main/dev – bắt buộc tạo PR
2. Không sửa SecurityConfig, JwtAuthenticationFilter, ApiResponse, ErrorCode mà không báo BE1
3. Không expose Entity ra response – chỉ dùng DTO
4. Controller không gọi Repository trực tiếp
5. Mapping DTO ↔ Entity viết trong Service (private method toResponse()/toEntity())
6. Không hard-code enum string – dùng enum class từ common/enums
7. Không commit file application-local.yml, secret, API key
```

## Quick Start

### 1. Prerequisites
- JDK 17+
- Maven 3.8+
- Docker & Docker Compose

### 2. Start PostgreSQL

```bash
docker-compose up -d postgres
```

### 3. Run application

```bash
cd backend
mvn spring-boot:run
```

Hoặc tạo file `src/main/resources/application-local.yml` (đã gitignore) để override config:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/ai_study_hub
    username: aistudyhub
    password: huyplay
app:
  jwt:
    secret: your-local-dev-secret-key-here
```

Rồi chạy:
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

### 4. Access Swagger UI

```
http://localhost:8080/swagger-ui.html
```

Click **Authorize** → nhập `Bearer <your_jwt_token>`

### 5. Health Check

```
GET http://localhost:8080/api/health
```

## DB Migration

Migration files nằm ở `src/main/resources/db/migration/`:

| File                    | Owner | Nội dung                        |
| ----------------------- | ----- | ------------------------------- |
| `V1__init_schema.sql`   | BE1   | Toàn bộ schema ban đầu          |
| `V2__seed_data.sql`     | BE1   | Dữ liệu mẫu admin + master data |
| `V3__academic_data.sql` | BE2   | Semester, Subject, Combo seed   |

> **Quy tắc migration:** Không sửa file Vx__ đã chạy. Luôn tạo file mới Vx+1__.

## API Response Format

**Success:**
```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

**Error:**
```json
{
  "success": false,
  "message": "Email already exists",
  "errorCode": "EMAIL_ALREADY_EXISTS"
}
```

**Pagination:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "items": [],
    "page": 0,
    "size": 10,
    "totalElements": 100,
    "totalPages": 10
  }
}
```

## Folder Structure

```
src/main/java/com/aistudyhub/
├── AiStudyHubApplication.java
├── config/              # BE1 – SecurityConfig, SwaggerConfig, CorsConfig
├── security/            # BE1 – JWT, UserDetails
├── common/
│   ├── enums/           # BE1 – Role, Visibility, MarketStatus, ...
│   ├── exception/       # BE1 – AppException, ErrorCode, GlobalExceptionHandler
│   ├── response/        # BE1 – ApiResponse, PaginationResponse
│   └── utils/           # Shared utils
├── entity/              # Centralized – mỗi entity owner bởi module owner
├── repository/          # Centralized – theo entity owner
└── module/
    ├── auth/            # BE1
    ├── user/            # BE1
    ├── academic/        # BE2
    ├── notebook/        # BE2
    ├── document/        # BE2
    ├── ai/              # BE2
    ├── chat/            # BE2
    ├── quiz/            # BE3
    ├── flashcard/       # BE3
    ├── marketplace/     # BE3
    ├── governance/      # BE3
    ├── community/       # BE3
    ├── notification/    # BE1
    ├── reward/          # BE3
    ├── feedback/        # BE1
    └── admin/           # BE1/BE2/BE3
```

## Auth Endpoints

| Method | URL                             | Auth   | Description               |
| ------ | ------------------------------- | ------ | ------------------------- |
| POST   | `/api/auth/register`            | Public | Đăng ký tài khoản         |
| POST   | `/api/auth/login`               | Public | Đăng nhập, nhận JWT       |
| POST   | `/api/auth/forgot-password`     | Public | Gửi link reset password   |
| POST   | `/api/auth/reset-password`      | Public | Reset password bằng token |
| GET    | `/api/users/me`                 | Bearer | Xem profile               |
| PUT    | `/api/users/me`                 | Bearer | Cập nhật profile          |
| PATCH  | `/api/users/me/change-password` | Bearer | Đổi mật khẩu              |

## Commit Convention

```
feat(auth): implement register API
feat(auth): implement JWT login
feat(document): add document metadata CRUD
fix(security): allow public auth endpoints
refactor(common): update api response format
```

## Branch Strategy

```
main ← (only from dev via PR)
  └── dev ← (feature branches via PR)
        ├── feature/backend-foundation     (BE1)
        ├── feature/auth-register          (BE1)
        ├── feature/auth-login-jwt         (BE1)
        ├── feature/academic-subjects      (BE2)
        ├── feature/notebook-crud          (BE2)
        ├── feature/quiz-bank              (BE3)
        └── ...
```
