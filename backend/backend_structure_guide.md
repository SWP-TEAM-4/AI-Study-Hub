# 🗂️ Phân Tích Chi Tiết Cấu Trúc Thư Mục Backend

**Project:** AI Study Hub – Spring Boot 3 + PostgreSQL  
**Package gốc:** `com.aistudyhub`

---

## Sơ Đồ Tổng Quan

```
backend/src/main/java/com/aistudyhub/
│
├── AiStudyHubApplication.java      ← Điểm khởi động app
│
├── common/                         ← Code dùng chung toàn hệ thống
│   ├── enums/                      ← Các kiểu liệt kê (Role, Status...)
│   ├── exception/                  ← Xử lý lỗi tập trung
│   ├── response/                   ← Chuẩn format response API
│   └── utils/                      ← Hàm tiện ích (Date, File, Validation)
│
├── config/                         ← Cấu hình Spring (CORS, Security, Swagger...)
│
├── entity/                         ← Ánh xạ bảng DB thành Java Object
│
├── repository/                     ← Truy vấn database (JPA)
│
├── security/                       ← JWT Filter, UserDetails, Constants
│
└── module/                         ← Tính năng nghiệp vụ (chia theo chức năng)
    ├── auth/                       ← Đăng ký, đăng nhập, reset password
    ├── user/                       ← Xem/sửa profile
    ├── document/                   ← Tài liệu học tập
    ├── quiz/                       ← Bài kiểm tra
    ├── flashcard/                  ← Flashcard học từ vựng
    ├── chat/                       ← Chat với AI
    ├── notebook/                   ← Ghi chú
    ├── community/                  ← Cộng đồng
    ├── marketplace/                ← Mua bán tài liệu
    ├── admin/                      ← Quản trị hệ thống
    └── ...
```

---

## Mục Lục

1. [AiStudyHubApplication.java – File khởi động](#1-aistudyhubapplicationjava--file-khởi-động)
2. [common/ – Code dùng chung](#2-common--code-dùng-chung)
3. [config/ – Cấu hình hệ thống](#3-config--cấu-hình-hệ-thống)
4. [entity/ – Ánh xạ Database](#4-entity--ánh-xạ-database)
5. [repository/ – Truy vấn Database](#5-repository--truy-vấn-database)
6. [security/ – Bảo mật JWT](#6-security--bảo-mật-jwt)
7. [module/ – Tính năng nghiệp vụ](#7-module--tính-năng-nghiệp-vụ)
8. [resources/ – Cấu hình và Migration](#8-resources--cấu-hình-và-migration)
9. [Luồng dữ liệu một request](#9-luồng-dữ-liệu-một-request)

---

## 1. `AiStudyHubApplication.java` – File Khởi Động

```
com/aistudyhub/AiStudyHubApplication.java
```

### Làm gì?
Đây là **điểm vào (entry point)** duy nhất của ứng dụng Spring Boot. Khi chạy lệnh `mvn spring-boot:run` hoặc nhấn Run trong IDE, JVM bắt đầu từ file này.

### Code:
```java
@SpringBootApplication
public class AiStudyHubApplication {
    public static void main(String[] args) {
        SpringApplication.run(AiStudyHubApplication.class, args);
    }
}
```

### `@SpringBootApplication` làm gì?
Annotation này gộp 3 annotation lại:
| Annotation | Tác dụng |
|---|---|
| `@SpringBootConfiguration` | Đây là class cấu hình Spring |
| `@EnableAutoConfiguration` | Spring tự động cấu hình dựa vào các dependency trong `pom.xml` |
| `@ComponentScan` | Quét toàn bộ package `com.aistudyhub` để tìm `@Component`, `@Service`, `@Repository`, `@Controller` |

> **Quy tắc:** File này **không bao giờ được sửa** trừ khi thêm annotation đặc biệt ở mức toàn app.

---

## 2. `common/` – Code Dùng Chung

```
common/
├── enums/
│   ├── Role.java
│   ├── ProcessingStatus.java
│   └── Visibility.java  ...
├── exception/
│   ├── AppException.java
│   ├── ErrorCode.java
│   └── GlobalExceptionHandler.java
├── response/
│   └── ApiResponse.java
└── utils/
    ├── DateUtil.java
    ├── FileUtil.java
    └── ValidationUtil.java
```

### `common/enums/` – Kiểu Liệt Kê

#### Làm gì?
Định nghĩa các **tập hợp giá trị cố định** được dùng ở nhiều nơi trong hệ thống.

#### Ví dụ thực tế: `Role.java`
```java
package com.aistudyhub.common.enums;

public enum Role {
    STUDENT,    // Sinh viên thường
    REVIEWER,   // Người kiểm duyệt tài liệu
    ADMIN       // Quản trị viên
}
```

**Tại sao dùng enum thay vì String?**  
Nếu dùng `String`, lập trình viên có thể viết `"student"`, `"STUDENT"`, `"Student"` – không nhất quán và dễ lỗi. Enum đảm bảo chỉ tồn tại đúng 3 giá trị trên.

#### File nên để ở đây:
- `Role.java` – Phân quyền người dùng
- `ProcessingStatus.java` – Trạng thái xử lý tài liệu AI
- `Visibility.java` – Hiển thị công khai/riêng tư
- `QuestionType.java` – Loại câu hỏi quiz
- Bất kỳ enum nào được dùng ở **nhiều hơn 1 module**

---

### `common/exception/` – Xử Lý Lỗi Tập Trung

#### Làm gì?
Thay vì mỗi Controller phải tự `try-catch` và format lỗi, tất cả lỗi được xử lý tại một chỗ duy nhất.

#### File 1: `AppException.java` – Lỗi nghiệp vụ tùy chỉnh

```java
public class AppException extends RuntimeException {
    private final ErrorCode errorCode;

    public AppException(ErrorCode errorCode) {
        super(errorCode.getMessage());  // message mặc định
        this.errorCode = errorCode;
    }

    public AppException(ErrorCode errorCode, String customMessage) {
        super(customMessage);           // message tùy chỉnh
        this.errorCode = errorCode;
    }
}
```

**Cách dùng trong Service:**
```java
// Thay vì throw RuntimeException("Email đã tồn tại")
throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
// → Spring tự xử lý, trả HTTP 409 + JSON đúng format
```

---

#### File 2: `ErrorCode.java` – Danh Sách Mã Lỗi

```java
@Getter
public enum ErrorCode {
    // Mỗi error code gồm: mã string, message, HTTP status
    EMAIL_ALREADY_EXISTS("EMAIL_ALREADY_EXISTS", "Email already exists", HttpStatus.CONFLICT),
    INVALID_CREDENTIALS ("INVALID_CREDENTIALS",  "Invalid email or password", HttpStatus.UNAUTHORIZED),
    USER_NOT_FOUND      ("USER_NOT_FOUND",        "User not found",           HttpStatus.NOT_FOUND),
    // ...
    
    private final String code;
    private final String message;
    private final HttpStatus httpStatus;
}
```

**Tại sao cần file này?**  
- Tập trung toàn bộ mã lỗi → dễ tìm, dễ thêm
- Frontend dùng `errorCode` để map thành tiếng Việt
- HTTP status được định nghĩa đúng chuẩn REST

---

#### File 3: `GlobalExceptionHandler.java` – "Cảnh Sát" Xử Lý Lỗi

```java
@RestControllerAdvice  // ← Áp dụng cho mọi Controller
public class GlobalExceptionHandler {

    // Bắt lỗi nghiệp vụ (AppException)
    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Void>> handleAppException(AppException ex) {
        ErrorCode errorCode = ex.getErrorCode();
        return ResponseEntity
                .status(errorCode.getHttpStatus())  // ← HTTP status đúng
                .body(ApiResponse.error(ex.getMessage(), errorCode.getCode()));
    }

    // Bắt lỗi validation (@Valid thất bại)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining("; "));
        return ResponseEntity.badRequest()
                .body(ApiResponse.error(message, "VALIDATION_ERROR"));
    }

    // Bắt mọi lỗi không mong đợi (Fallback)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneric(Exception ex) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.internalServerError()
                .body(ApiResponse.error("An unexpected error occurred", "INTERNAL_ERROR"));
    }
}
```

---

### `common/response/` – Chuẩn Format Response

#### `ApiResponse.java`

Mọi API trong hệ thống đều trả về cùng một cấu trúc JSON:

```java
@Getter @Builder
@JsonInclude(JsonInclude.Include.NON_NULL)  // ← Không serialize field null
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;           // null khi có lỗi
    private String errorCode; // null khi thành công
}
```

**Response thành công:**
```json
{ "success": true, "message": "Login successful", "data": { "accessToken": "..." } }
```

**Response lỗi:**
```json
{ "success": false, "message": "Email already exists", "errorCode": "EMAIL_ALREADY_EXISTS" }
```

**Cách dùng trong Controller:**
```java
return ResponseEntity.ok(ApiResponse.success("Login successful", authResponse));
return ResponseEntity.status(404).body(ApiResponse.error("Not found", "USER_NOT_FOUND"));
```

---

### `common/utils/` – Hàm Tiện Ích

#### File nên để ở đây:
```java
// DateUtil.java – Xử lý ngày tháng
public class DateUtil {
    public static boolean isExpired(LocalDateTime dateTime) {
        return LocalDateTime.now().isAfter(dateTime);
    }
}

// FileUtil.java – Validate và xử lý file
public class FileUtil {
    public static String getExtension(String filename) { ... }
    public static boolean isAllowedType(String ext, List<String> allowed) { ... }
}

// ValidationUtil.java – Kiểm tra dữ liệu
public class ValidationUtil {
    public static boolean isValidEmail(String email) { ... }
}
```

> **Quy tắc:** Chỉ để các hàm **static**, **không có state**, dùng được ở nhiều nơi.

---

## 3. `config/` – Cấu Hình Hệ Thống

```
config/
├── CorsConfig.java       ← Cho phép frontend gọi API
├── SecurityConfig.java   ← Cấu hình Spring Security + JWT
├── SwaggerConfig.java    ← Tài liệu API tự động
├── OpenAIConfig.java     ← Kết nối OpenAI
└── StorageConfig.java    ← Upload file
```

### `CorsConfig.java` – Cho Phép Frontend Gọi API

```java
@Configuration
public class CorsConfig {
    
    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String allowedOriginsRaw;
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        
        // Cho phép frontend ở port 5173 gọi backend ở port 8080
        config.setAllowedOrigins(Arrays.asList(allowedOriginsRaw.split(",")));
        config.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization","Content-Type","Accept"));
        config.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config); // Áp dụng cho mọi endpoint
        return source;
    }
}
```

---

### `SecurityConfig.java` – Ai Được Phép Làm Gì

```java
@Configuration @EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)    // ← API stateless không cần CSRF
            .cors(cors -> cors.configure(http))        // ← Dùng CorsConfig bean
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // ← Không dùng session
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()   // ← Không cần token
                .requestMatchers("/api/admin/**").hasRole("ADMIN") // ← Chỉ ADMIN
                .anyRequest().authenticated())                 // ← Còn lại cần JWT
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10); // ← BCrypt cost factor = 10
    }
}
```

---

## 4. `entity/` – Ánh Xạ Database

```
entity/
├── User.java
├── Semester.java
├── Combo.java
├── PasswordReset.java
├── Notification.java
├── Badge.java
└── ...
```

### Làm gì?
Mỗi file `Entity` tương ứng với **một bảng** trong database. JPA (Hibernate) tự động ánh xạ Java Object ↔ SQL Row.

### Ví dụ: `User.java`

```java
@Entity                          // ← Đây là entity JPA
@Table(name = "users", indexes = {
    @Index(name = "idx_users_email", columnList = "email")  // ← Index tăng tốc query
})
@Getter @Setter @Builder         // ← Lombok tự generate code
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)  // ← Auto increment (BIGSERIAL)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", length = 255)
    private String passwordHash;  // ← Đã hash BCrypt, KHÔNG bao giờ lưu plaintext

    @Column(name = "full_name", nullable = false, length = 255)
    private String fullName;

    @ManyToOne(fetch = FetchType.LAZY)  // ← Lazy: chỉ load khi cần
    @JoinColumn(name = "current_semester_id")
    private Semester currentSemester;   // ← Quan hệ Many-to-One với bảng semesters

    @Enumerated(EnumType.STRING)        // ← Lưu "STUDENT" thay vì 0,1,2
    @Builder.Default
    private Role role = Role.STUDENT;   // ← Giá trị mặc định

    @CreationTimestamp                  // ← Tự động set khi INSERT
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp                    // ← Tự động update khi UPDATE
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
```

### Quy Tắc Đặt Tên
| Trong Java | Trong DB |
|---|---|
| `fullName` (camelCase) | `full_name` (snake_case) |
| `passwordHash` | `password_hash` |
| `isActive` | `is_active` |
| `createdAt` | `created_at` |

### File nên để ở `entity/`:
- Mỗi bảng SQL → 1 file Entity
- `@ManyToOne`, `@OneToMany`, `@ManyToMany` để quan hệ giữa bảng
- **KHÔNG** chứa logic nghiệp vụ (tính toán, kiểm tra...)

---

## 5. `repository/` – Truy Vấn Database

```
repository/
├── UserRepository.java
├── PasswordResetRepository.java
├── SemesterRepository.java
├── ComboRepository.java
├── NotificationRepository.java
└── SystemConfigRepository.java
```

### Làm gì?
Repository là **lớp duy nhất được phép nói chuyện với database**. Spring Data JPA tự generate SQL từ tên method.

### Ví dụ: `UserRepository.java`

```java
// Extends JpaRepository<Entity, ID_Type>
public interface UserRepository extends JpaRepository<User, Long> {

    // Spring tự generate: SELECT * FROM users WHERE email = ?
    Optional<User> findByEmail(String email);

    // Spring tự generate: SELECT COUNT(*) > 0 FROM users WHERE email = ?
    boolean existsByEmail(String email);

    // Chỉ lấy user đang active
    Optional<User> findByIdAndIsActiveTrue(Long id);

    // Query phức tạp → viết JPQL thủ công
    @Query("""
            SELECT u FROM User u
            WHERE (:keyword IS NULL
                OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(u.email)    LIKE LOWER(CONCAT('%', :keyword, '%')))
            """)
    Page<User> searchUsers(@Param("keyword") String keyword, Pageable pageable);
}
```

### "Magic" Naming Convention của Spring Data:

| Tên Method | SQL được generate |
|---|---|
| `findByEmail(String email)` | `WHERE email = ?` |
| `findByEmailAndIsActive(String, Boolean)` | `WHERE email = ? AND is_active = ?` |
| `existsByEmail(String)` | `SELECT COUNT(*) > 0 WHERE email = ?` |
| `findByIdAndIsActiveTrue(Long)` | `WHERE id = ? AND is_active = true` |
| `deleteAllByUserId(Long)` | `DELETE WHERE user_id = ?` |
| `countByRole(Role)` | `SELECT COUNT(*) WHERE role = ?` |

### Quy Tắc:
- Mỗi Entity → 1 Repository
- **KHÔNG** viết raw SQL trừ khi cực kỳ cần thiết
- Dùng `Page<T> + Pageable` cho API có phân trang
- Dùng `Optional<T>` thay vì trả `null`

---

## 6. `security/` – Bảo Mật JWT

```
security/
├── JwtTokenProvider.java        ← Tạo, validate, đọc JWT token
├── JwtAuthenticationFilter.java ← Chặn mọi request, kiểm tra token
├── CustomUserDetails.java       ← Wrapper thông tin user cho Spring Security
├── CustomUserDetailsService.java← Load user từ DB theo userId
└── SecurityConstants.java       ← Hằng số: Header name, public URLs...
```

### Cách hoạt động (theo thứ tự):

```
HTTP Request đến server
        ↓
JwtAuthenticationFilter.doFilterInternal()
        ├── Đọc header: "Authorization: Bearer eyJhbGci..."
        ├── Cắt bỏ "Bearer " → lấy token thuần
        ├── JwtTokenProvider.validateToken(token)  → true/false
        ├── JwtTokenProvider.getUserIdFromToken(token) → 42L
        ├── CustomUserDetailsService.loadUserById(42L)
        │     └── userRepository.findById(42L)  → User entity
        ├── Tạo UsernamePasswordAuthenticationToken
        └── SecurityContextHolder.setAuthentication(auth)
        ↓
Request được cho phép đi tiếp đến Controller
```

### `JwtTokenProvider.java` – Tạo và Đọc Token

```java
@Component
public class JwtTokenProvider {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs; // 86400000 = 24 giờ

    // Tạo token sau khi login thành công
    public String generateToken(Long userId) {
        return Jwts.builder()
                .subject(String.valueOf(userId))  // ← Nhúng userId vào token
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(getSigningKey())         // ← Ký bằng secret key
                .compact();
    }

    // Lấy userId từ token (khi request đến)
    public Long getUserIdFromToken(String token) {
        String subject = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
        return Long.parseLong(subject);
    }
}
```

### `SecurityConstants.java` – Hằng Số

```java
public final class SecurityConstants {
    public static final String TOKEN_PREFIX    = "Bearer ";    // ← Prefix trong header
    public static final String HEADER_STRING   = "Authorization"; // ← Tên header

    // Các URL không cần JWT (public)
    public static final String[] PUBLIC_URLS = {
        "/api/auth/**",      // ← Login, register, forgot-password
        "/api/health",
        "/swagger-ui/**",    // ← Tài liệu API
        "/v3/api-docs/**",
        "/files/**"          // ← File tĩnh
    };
}
```

---

## 7. `module/` – Tính Năng Nghiệp Vụ

Đây là phần **quan trọng nhất**. Mỗi module là một chức năng độc lập.

```
module/
├── auth/
│   ├── controller/AuthController.java
│   ├── service/AuthService.java
│   └── dto/
│       ├── LoginRequest.java
│       ├── RegisterRequest.java
│       ├── AuthResponse.java
│       ├── ForgotPasswordRequest.java
│       └── ResetPasswordRequest.java
│
├── user/
│   ├── controller/UserController.java
│   ├── service/UserService.java
│   └── dto/
│       ├── UpdateProfileRequest.java
│       ├── UserProfileResponse.java
│       └── ChangePasswordRequest.java
│
└── document/  (Cấu trúc tương tự)
    ├── controller/
    ├── service/
    └── dto/
```

### Cấu Trúc Mỗi Module: **Controller → Service → Repository**

```
Request từ Frontend
      ↓
[Controller]  ← Nhận request, validate đầu vào, gọi Service
      ↓
[Service]     ← Xử lý logic nghiệp vụ, gọi Repository
      ↓
[Repository]  ← Truy vấn Database
      ↓
[Entity]      ← Đối tượng ánh xạ DB
      ↑
[Service]     ← Chuyển Entity → DTO (Response)
      ↑
[Controller]  ← Bọc trong ApiResponse, trả về
      ↑
Response cho Frontend
```

---

### 7a. `controller/` – Cửa Ngõ Nhận Request

#### Làm gì?
- Nhận HTTP request từ frontend
- Validate dữ liệu đầu vào (`@Valid`)
- Gọi Service xử lý
- Bọc kết quả vào `ApiResponse` và trả về

#### Ví dụ: `AuthController.java`

```java
@Tag(name = "Authentication")      // ← Hiện trong Swagger UI
@RestController                    // ← Là REST controller, tự serialize JSON
@RequestMapping("/api/auth")       // ← Base URL cho mọi endpoint trong class
@RequiredArgsConstructor           // ← Lombok inject AuthService qua constructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Đăng nhập – nhận JWT access token")
    @PostMapping("/login")         // ← POST /api/auth/login
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {  // ← @Valid kích hoạt validation
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }
}
```

#### Quy Tắc Controller:
- **KHÔNG** chứa logic nghiệp vụ (tính toán, kiểm tra DB...)
- **KHÔNG** gọi Repository trực tiếp
- Chỉ gọi Service rồi wrap kết quả
- Annotation phải đầy đủ để Swagger hiển thị đúng

---

### 7b. `service/` – Trái Tim Nghiệp Vụ

#### Làm gì?
- Xử lý toàn bộ logic nghiệp vụ
- Kiểm tra điều kiện, ném exception nếu sai
- Gọi Repository để đọc/ghi DB
- Chuyển đổi Entity → DTO

#### Ví dụ: `AuthService.java` – Phương thức login

```java
@Service              // ← Spring quản lý, có thể inject vào Controller
@RequiredArgsConstructor
@Transactional(readOnly = true)  // ← Tối ưu cho toàn class (chỉ đọc)
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthResponse login(LoginRequest request) {
        // 1. Tìm user trong DB
        User user = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_CREDENTIALS));
                // ↑ Không tìm thấy → ném lỗi 401

        // 2. So sánh mật khẩu (BCrypt)
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }

        // 3. Kiểm tra tài khoản có active không
        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new AppException(ErrorCode.USER_INACTIVE);
        }

        // 4. Tạo JWT token
        String token = jwtTokenProvider.generateToken(user.getId());

        // 5. Chuyển Entity → DTO Response (KHÔNG bao gồm passwordHash)
        return toAuthResponse(user, token);
    }
}
```

#### Quy Tắc Service:
- Đặt `@Transactional` cho method ghi DB (INSERT/UPDATE/DELETE)
- Đặt `@Transactional(readOnly = true)` cho method chỉ đọc (SELECT)
- Ném `AppException` với `ErrorCode` tương ứng khi có lỗi
- Chuyển Entity → DTO trước khi return (KHÔNG expose Entity ra ngoài)

---

### 7c. `dto/` – Data Transfer Object

#### Làm gì?
DTO là **bao bì** cho dữ liệu truyền qua lại giữa frontend và backend. Có 2 loại:

**Request DTO** – nhận dữ liệu từ Frontend:
```java
@Getter @Setter
public class LoginRequest {
    
    @NotBlank(message = "Email is required")   // ← @Valid sẽ kiểm tra
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;
}
```

**Response DTO** – gửi dữ liệu ra Frontend:
```java
@Getter @Builder
public class AuthResponse {
    private String accessToken;
    private String tokenType;  // "Bearer"
    
    // Thông tin user cơ bản
    private Long userId;
    private String email;
    private String fullName;
    private String avatarUrl;
    private Role role;
    private Integer reputationPoints;
    private LocalDateTime createdAt;
    
    // ← KHÔNG có passwordHash!
}
```

#### Quy Tắc DTO:
- **Request DTO**: dùng `@Getter @Setter`, thêm annotation validation
- **Response DTO**: dùng `@Getter @Builder`, **KHÔNG bao giờ** chứa `passwordHash`
- Đặt tên rõ ràng: `LoginRequest`, `UserProfileResponse`, `UpdateProfileRequest`

---

## 8. `resources/` – Cấu Hình và Migration

```
resources/
├── application.yml          ← Cấu hình Spring Boot
└── db/
    └── migration/
        ├── V1__init_schema.sql   ← Tạo bảng (đã chạy, KHÔNG sửa)
        ├── V2__seed_data.sql     ← Dữ liệu mẫu
        └── V3__them_bang_moi.sql ← Thay đổi mới (thêm version tiếp theo)
```

### `application.yml` – Cấu Hình Trung Tâm

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/aistudyhub
    username: postgres
    password: huyplay

server:
  port: 8080                    # ← Backend chạy ở port này

app:
  jwt:
    secret: "ai-study-hub-jwt-secret..."
    expiration-ms: 86400000     # 24 giờ

  cors:
    allowed-origins: "http://localhost:5173"  # ← URL frontend được phép gọi
```

### `db/migration/` – Flyway Migration

**Flyway** là công cụ quản lý lịch sử thay đổi database, như Git nhưng cho SQL.

#### Quy tắc đặt tên file:
```
V{version}__{mô_tả}.sql
V1__init_schema.sql      ← Version 1: Tạo schema
V2__seed_data.sql        ← Version 2: Thêm dữ liệu mẫu
V3__add_tags_table.sql   ← Version 3: Thêm bảng tags (ví dụ tương lai)
```

> ⚠️ **QUAN TRỌNG:** File V1, V2 đã chạy = **KHÔNG được sửa**. Muốn thay đổi DB → tạo file V3+ mới.

---

## 9. Luồng Dữ Liệu Một Request

Ví dụ: Người dùng đăng nhập `POST /api/auth/login`

```
Frontend (React)
    │  POST /api/auth/login
    │  Body: { "email": "demo@fpt.edu.vn", "password": "Demo@123" }
    │  Header: (chưa có Authorization)
    ▼
[Vite Proxy] localhost:5173 → localhost:8080
    ▼
[JwtAuthenticationFilter]
    │  Đọc header Authorization → không có token
    │  Bỏ qua (endpoint public)
    ▼
[SecurityConfig]
    │  /api/auth/** → permitAll() → cho phép đi tiếp
    ▼
[AuthController.login()]
    │  @Valid kiểm tra: email format đúng? password không rỗng?
    │  Gọi authService.login(request)
    ▼
[AuthService.login()]
    │  1. userRepository.findByEmail("demo@fpt.edu.vn")
    │     → Trả về User entity từ DB
    │  2. passwordEncoder.matches("Demo@123", "$2a$10$...")
    │     → true ✅
    │  3. user.getIsActive() → true ✅
    │  4. jwtTokenProvider.generateToken(userId=1)
    │     → "eyJhbGciOiJIUzI1NiJ9..."
    │  5. toAuthResponse(user, token) → AuthResponse DTO
    ▼
[AuthController]
    │  ApiResponse.success("Login successful", authResponse)
    ▼
HTTP Response 200:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "tokenType": "Bearer",
    "userId": 1,
    "email": "demo@fpt.edu.vn",
    "fullName": "Demo Student",
    "role": "STUDENT"
  }
}
    ▼
Frontend nhận → authStore.setAuth(data) → lưu token → vào Dashboard
```

---

## Tổng Kết Nhanh

| Folder | Trách nhiệm | Ai được sửa |
|---|---|---|
| `AiStudyHubApplication.java` | Entry point | Chỉ khi thêm annotation global |
| `common/enums/` | Hằng số kiểu liệt kê | Thêm mới thoải mái, không xóa |
| `common/exception/` | Chuẩn hóa lỗi | Thêm ErrorCode thoải mái |
| `common/response/` | Format JSON chuẩn | **Không sửa format** |
| `common/utils/` | Hàm tiện ích static | Thêm thoải mái |
| `config/` | Cấu hình Spring | Thận trọng, báo team |
| `entity/` | Ánh xạ bảng DB | Thêm field → cần migration file mới |
| `repository/` | Truy vấn DB | Thêm method theo nhu cầu |
| `security/` | JWT + phân quyền | **Chỉ BE1** |
| `module/{tên}/controller/` | Nhận request | Developer của module đó |
| `module/{tên}/service/` | Logic nghiệp vụ | Developer của module đó |
| `module/{tên}/dto/` | Dữ liệu in/out | Developer của module đó |
| `resources/db/migration/` | Thay đổi DB | Tạo file V(n+1) mới |
