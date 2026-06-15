// ═══════════════════════════════════════════════════════════════════════════════
// ⚠️  FILE NÀY ĐƯỢC TỰ ĐỘNG SINH BỞI scripts/generateMswHandlers.cjs
// ⚠️  KHÔNG SỬA TAY FILE NÀY — Chạy lại script khi cập nhật API contract
//
// Generated: 2026-06-12T17:53:42.953Z
// Source:    ai_study_hub_mock_openapi_contract.json
// Total:     154 handlers
// ═══════════════════════════════════════════════════════════════════════════════

import { http, HttpResponse, delay } from "msw";

// ─── Delay config (ms) — giả lập network latency ─────────────────────────────
const MOCK_DELAY = 300;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ACADEMIC MASTER DATA (14 endpoints)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * POST /api/admin/combos
 * Create/Action: Implement Combo and ComboSubject APIs
 * Tag: Academic Master Data
 */
/**
 * DELETE /api/admin/combos/{id}/subjects/{subjectId}
 * Delete: Implement Combo and ComboSubject APIs
 * Tag: Academic Master Data
 */
/**
 * POST /api/admin/combos/{id}/subjects/{subjectId}
 * Create/Action: Implement Combo and ComboSubject APIs
 * Tag: Academic Master Data
 */
/**
 * POST /api/admin/semesters
 * Create/Action: Implement Semester APIs
 * Tag: Academic Master Data
 */
/**
 * DELETE /api/admin/semesters/{id}
 * Delete: Implement Semester APIs
 * Tag: Academic Master Data
 */
/**
 * PUT /api/admin/semesters/{id}
 * Update: Implement Semester APIs
 * Tag: Academic Master Data
 */
/**
 * POST /api/admin/subjects
 * Create/Action: Implement Subject APIs
 * Tag: Academic Master Data
 */
/**
 * DELETE /api/admin/subjects/{id}
 * Delete: Implement Subject APIs
 * Tag: Academic Master Data
 */
/**
 * PUT /api/admin/subjects/{id}
 * Update: Implement Subject APIs
 * Tag: Academic Master Data
 */
/**
 * GET /api/combos
 * Get/List: Implement Combo and ComboSubject APIs
 * Tag: Academic Master Data
 */
/**
 * GET /api/combos/{id}/subjects
 * Get/List: Implement Combo and ComboSubject APIs
 * Tag: Academic Master Data
 */
/**
 * GET /api/semesters
 * Get/List: Implement Semester APIs
 * Tag: Academic Master Data
 */
/**
 * GET /api/subjects
 * Get/List: Implement Subject APIs
 * Tag: Academic Master Data
 */
/**
 * GET /api/subjects/{id}
 * Get/List: Implement Subject APIs
 * Tag: Academic Master Data
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ACTIVITY LOG (1 endpoints)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/admin/activity-logs
 * Get/List: Implement Activity Log Service
 * Tag: Activity Log
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ANALYTICS (1 endpoints)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/admin/analytics/ai-usage
 * Get/List: Optional – Implement AI Usage Analytics
 * Tag: Analytics
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AUTH (4 endpoints)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * POST /api/auth/forgot-password
 * Tạo reset token quên mật khẩu
 * Tag: Auth
 */
/**
 * POST /api/auth/login
 * Đăng nhập và nhận JWT Bearer token
 * Tag: Auth
 */
/**
 * POST /api/auth/register
 * Đăng ký tài khoản student mới
 * Tag: Auth
 */
/**
 * POST /api/auth/reset-password
 * Đổi mật khẩu bằng reset token
 * Tag: Auth
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CHAT/RAG (6 endpoints)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * DELETE /api/chat-sessions/{sessionId}
 * Delete: Implement Chat Session APIs
 * Tag: Chat/RAG
 */
/**
 * GET /api/chat-sessions/{sessionId}
 * Get/List: Implement Chat Session APIs
 * Tag: Chat/RAG
 */
/**
 * GET /api/chat-sessions/{sessionId}/messages
 * Get/List: Implement Chat Message and Mock RAG Answer API
 * Tag: Chat/RAG
 */
/**
 * POST /api/chat-sessions/{sessionId}/messages
 * Gửi câu hỏi và nhận câu trả lời mock RAG kèm citation
 * Tag: Chat/RAG
 */
/**
 * GET /api/notebooks/{notebookId}/chat-sessions
 * Get/List: Implement Chat Session APIs
 * Tag: Chat/RAG
 */
/**
 * POST /api/notebooks/{notebookId}/chat-sessions
 * Create/Action: Implement Chat Session APIs
 * Tag: Chat/RAG
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMMUNITY GROWTH (3 endpoints)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/community/leaderboard/contributors
 * Get/List: Backlog – Implement Referral and Contributor Ranking
 * Tag: Community Growth
 */
/**
 * POST /api/referrals/apply
 * Create/Action: Backlog – Implement Referral and Contributor Ranking
 * Tag: Community Growth
 */
/**
 * GET /api/referrals/me
 * Get/List: Backlog – Implement Referral and Contributor Ranking
 * Tag: Community Growth
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMMUNITY ROLE/PERMISSION (4 endpoints)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/admin/community-roles
 * Quản lý role cộng đồng theo scope
 * Tag: Community Role/Permission
 */
/**
 * POST /api/admin/community-roles
 * Quản lý role cộng đồng theo scope
 * Tag: Community Role/Permission
 */
/**
 * PATCH /api/admin/community-roles/{id}/revoke
 * Quản lý role cộng đồng theo scope
 * Tag: Community Role/Permission
 */
/**
 * GET /api/community-roles/me
 * Quản lý role cộng đồng theo scope
 * Tag: Community Role/Permission
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DOCUMENT (24 endpoints)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * DELETE /api/documents/{documentId}/chunks
 * Delete: Implement DocumentChunk APIs and processing status
 * Tag: Document
 */
/**
 * GET /api/documents/{documentId}/chunks
 * Get/List: Implement DocumentChunk APIs and processing status
 * Tag: Document
 */
/**
 * POST /api/documents/{documentId}/process
 * Process document thành chunks phục vụ RAG
 * Tag: Document
 */
/**
 * GET /api/community/documents
 * Get/List: Implement Public Community Library APIs
 * Tag: Document
 */
/**
 * GET /api/community/documents/top
 * Get/List: Implement Public Community Library APIs
 * Tag: Document
 */
/**
 * GET /api/community/documents/{id}
 * Get/List: Implement Public Community Library APIs
 * Tag: Document
 */
/**
 * GET /api/documents
 * Get/List: Implement Document metadata APIs
 * Tag: Document
 */
/**
 * POST /api/documents
 * Create/Action: Implement Document metadata APIs
 * Tag: Document
 */
/**
 * POST /api/documents/upload
 * Create/Action: Implement Upload file service mock/local
 * Tag: Document
 */
/**
 * GET /api/documents/{documentId}/tags
 * Get/List: Implement Tag and DocumentTag APIs
 * Tag: Document
 */
/**
 * DELETE /api/documents/{documentId}/tags/{tagId}
 * Delete: Implement Tag and DocumentTag APIs
 * Tag: Document
 */
/**
 * POST /api/documents/{documentId}/tags/{tagId}
 * Create/Action: Implement Tag and DocumentTag APIs
 * Tag: Document
 */
/**
 * DELETE /api/documents/{id}
 * Delete: Implement Document metadata APIs
 * Tag: Document
 */
/**
 * GET /api/documents/{id}
 * Get/List: Implement Document metadata APIs
 * Tag: Document
 */
/**
 * PUT /api/documents/{id}
 * Update: Implement Document metadata APIs
 * Tag: Document
 */
/**
 * GET /api/notebooks/{notebookId}/documents
 * Get/List: Implement NotebookDocument APIs
 * Tag: Document
 */
/**
 * DELETE /api/notebooks/{notebookId}/documents/{documentId}
 * Delete: Implement NotebookDocument APIs
 * Tag: Document
 */
/**
 * POST /api/notebooks/{notebookId}/documents/{documentId}
 * Create/Action: Implement NotebookDocument APIs
 * Tag: Document
 */
/**
 * GET /api/tags
 * Get/List: Implement Tag and DocumentTag APIs
 * Tag: Document
 */
/**
 * POST /api/tags
 * Create/Action: Implement Tag and DocumentTag APIs
 * Tag: Document
 */
/**
 * POST /api/admin/marketplace/documents/{id}/review
 * Review/vote content marketplace hoặc flashcard progress
 * Tag: Document
 */
/**
 * GET /api/marketplace/documents
 * Get/List: Implement Marketplace Browse/Search APIs
 * Tag: Document
 */
/**
 * POST /api/marketplace/documents/{id}/clone
 * Clone/download content marketplace về workspace cá nhân
 * Tag: Document
 */
/**
 * POST /api/marketplace/documents/{id}/submit
 * Submit content lên marketplace để chờ duyệt
 * Tag: Document
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FLASHCARD (16 endpoints)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * POST /api/admin/marketplace/flashcard-decks/{id}/review
 * Review/vote content marketplace hoặc flashcard progress
 * Tag: Flashcard
 */
/**
 * GET /api/flashcard-decks
 * Get/List: Implement Flashcard Deck and Card CRUD
 * Tag: Flashcard
 */
/**
 * POST /api/flashcard-decks
 * Create/Action: Implement Flashcard Deck and Card CRUD
 * Tag: Flashcard
 */
/**
 * POST /api/flashcard-decks/generate
 * Generate mock data từ notebook/document chunks
 * Tag: Flashcard
 */
/**
 * POST /api/flashcard-decks/{deckId}/cards
 * Create/Action: Implement Flashcard Deck and Card CRUD
 * Tag: Flashcard
 */
/**
 * GET /api/flashcard-decks/{deckId}/progress
 * Get/List: Implement Flashcard Review Progress
 * Tag: Flashcard
 */
/**
 * DELETE /api/flashcard-decks/{id}
 * Delete: Implement Flashcard Deck and Card CRUD
 * Tag: Flashcard
 */
/**
 * GET /api/flashcard-decks/{id}
 * Get/List: Implement Flashcard Deck and Card CRUD
 * Tag: Flashcard
 */
/**
 * PUT /api/flashcard-decks/{id}
 * Update: Implement Flashcard Deck and Card CRUD
 * Tag: Flashcard
 */
/**
 * GET /api/flashcards/due
 * Get/List: Implement Flashcard Review Progress
 * Tag: Flashcard
 */
/**
 * DELETE /api/flashcards/{cardId}
 * Delete: Implement Flashcard Deck and Card CRUD
 * Tag: Flashcard
 */
/**
 * PUT /api/flashcards/{cardId}
 * Update: Implement Flashcard Deck and Card CRUD
 * Tag: Flashcard
 */
/**
 * POST /api/flashcards/{cardId}/review
 * Review/vote content marketplace hoặc flashcard progress
 * Tag: Flashcard
 */
/**
 * GET /api/marketplace/flashcard-decks
 * Get/List: Implement Marketplace Browse/Search APIs
 * Tag: Flashcard
 */
/**
 * POST /api/marketplace/flashcard-decks/{id}/clone
 * Clone/download content marketplace về workspace cá nhân
 * Tag: Flashcard
 */
/**
 * POST /api/marketplace/flashcard-decks/{id}/submit
 * Submit content lên marketplace để chờ duyệt
 * Tag: Flashcard
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GOVERNANCE/COMMUNITY REVIEW (14 endpoints)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/admin/reports
 * Tạo/xử lý report nội dung
 * Tag: Governance/Community Review
 */
/**
 * GET /api/admin/reports/{id}
 * Tạo/xử lý report nội dung
 * Tag: Governance/Community Review
 */
/**
 * PATCH /api/admin/reports/{id}/reject
 * Tạo/xử lý report nội dung
 * Tag: Governance/Community Review
 */
/**
 * PATCH /api/admin/reports/{id}/resolve
 * Tạo/xử lý report nội dung
 * Tag: Governance/Community Review
 */
/**
 * POST /api/community/comments
 * Create/Action: Optional – Implement Community Comment APIs
 * Tag: Governance/Community Review
 */
/**
 * GET /api/community/comments
 * Get/List: Optional – Implement Community Comment APIs
 * Tag: Governance/Community Review
 */
/**
 * DELETE /api/community/comments/{id}
 * Delete: Optional – Implement Community Comment APIs
 * Tag: Governance/Community Review
 */
/**
 * PATCH /api/community/comments/{id}/hide
 * Partial update: Optional – Implement Community Comment APIs
 * Tag: Governance/Community Review
 */
/**
 * POST /api/community/reviews
 * Review/vote content marketplace hoặc flashcard progress
 * Tag: Governance/Community Review
 */
/**
 * GET /api/community/reviews
 * Review/vote content marketplace hoặc flashcard progress
 * Tag: Governance/Community Review
 */
/**
 * DELETE /api/community/reviews/{id}
 * Review/vote content marketplace hoặc flashcard progress
 * Tag: Governance/Community Review
 */
/**
 * PUT /api/community/reviews/{id}
 * Review/vote content marketplace hoặc flashcard progress
 * Tag: Governance/Community Review
 */
/**
 * POST /api/reports
 * Tạo/xử lý report nội dung
 * Tag: Governance/Community Review
 */
/**
 * GET /api/reports/my
 * Tạo/xử lý report nội dung
 * Tag: Governance/Community Review
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MARKETPLACE/ADMIN CONTENT (12 endpoints)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/admin/contents
 * Get/List: Implement Admin Content Management APIs
 * Tag: Marketplace/Admin Content
 */
/**
 * DELETE /api/admin/contents/{targetType}/{targetId}
 * Delete: Implement Admin Content Management APIs
 * Tag: Marketplace/Admin Content
 */
/**
 * GET /api/admin/contents/{targetType}/{targetId}
 * Get/List: Implement Admin Content Management APIs
 * Tag: Marketplace/Admin Content
 */
/**
 * PATCH /api/admin/contents/{targetType}/{targetId}/market-status
 * Partial update: Implement Admin Content Management APIs
 * Tag: Marketplace/Admin Content
 */
/**
 * PATCH /api/admin/contents/{targetType}/{targetId}/visibility
 * Partial update: Implement Admin Content Management APIs
 * Tag: Marketplace/Admin Content
 */
/**
 * GET /api/admin/marketplace/pending
 * Get/List: Implement Market Review APIs
 * Tag: Marketplace/Admin Content
 */
/**
 * PATCH /api/admin/marketplace/{targetType}/{targetId}/approve
 * Partial update: Implement Reviewer Marketplace Queue
 * Tag: Marketplace/Admin Content
 */
/**
 * PATCH /api/admin/marketplace/{targetType}/{targetId}/reject
 * Partial update: Implement Reviewer Marketplace Queue
 * Tag: Marketplace/Admin Content
 */
/**
 * GET /api/marketplace/search
 * Get/List: Implement Marketplace Browse/Search APIs
 * Tag: Marketplace/Admin Content
 */
/**
 * GET /api/reviewer/marketplace/pending
 * Review/vote content marketplace hoặc flashcard progress
 * Tag: Marketplace/Admin Content
 */
/**
 * GET /api/reviewer/marketplace/{targetType}/{targetId}
 * Review/vote content marketplace hoặc flashcard progress
 * Tag: Marketplace/Admin Content
 */
/**
 * POST /api/reviewer/marketplace/{targetType}/{targetId}/vote
 * Review/vote content marketplace hoặc flashcard progress
 * Tag: Marketplace/Admin Content
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NOTEBOOK (5 endpoints)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/notebooks
 * Get/List: Implement Notebook CRUD
 * Tag: Notebook
 */
/**
 * POST /api/notebooks
 * Create/Action: Implement Notebook CRUD
 * Tag: Notebook
 */
/**
 * DELETE /api/notebooks/{id}
 * Delete: Implement Notebook CRUD
 * Tag: Notebook
 */
/**
 * GET /api/notebooks/{id}
 * Get/List: Implement Notebook CRUD
 * Tag: Notebook
 */
/**
 * PUT /api/notebooks/{id}
 * Update: Implement Notebook CRUD
 * Tag: Notebook
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NOTIFICATION (4 endpoints)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/notifications
 * Get/List: Implement Notification APIs
 * Tag: Notification
 */
/**
 * PATCH /api/notifications/read-all
 * Partial update: Implement Notification APIs
 * Tag: Notification
 */
/**
 * DELETE /api/notifications/{id}
 * Delete: Implement Notification APIs
 * Tag: Notification
 */
/**
 * PATCH /api/notifications/{id}/read
 * Partial update: Implement Notification APIs
 * Tag: Notification
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// QUIZ/TEST (22 endpoints)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * POST /api/admin/marketplace/quizzes/{id}/review
 * Review/vote content marketplace hoặc flashcard progress
 * Tag: Quiz/Test
 */
/**
 * GET /api/marketplace/quizzes
 * Get/List: Implement Marketplace Browse/Search APIs
 * Tag: Quiz/Test
 */
/**
 * POST /api/marketplace/quizzes/{id}/clone
 * Clone/download content marketplace về workspace cá nhân
 * Tag: Quiz/Test
 */
/**
 * POST /api/marketplace/quizzes/{id}/submit
 * Submit content lên marketplace để chờ duyệt
 * Tag: Quiz/Test
 */
/**
 * DELETE /api/options/{optionId}
 * Delete: Implement Quiz Question and Option APIs
 * Tag: Quiz/Test
 */
/**
 * PUT /api/options/{optionId}
 * Update: Implement Quiz Question and Option APIs
 * Tag: Quiz/Test
 */
/**
 * DELETE /api/questions/{questionId}
 * Delete: Implement Quiz Question and Option APIs
 * Tag: Quiz/Test
 */
/**
 * PUT /api/questions/{questionId}
 * Update: Implement Quiz Question and Option APIs
 * Tag: Quiz/Test
 */
/**
 * POST /api/questions/{questionId}/options
 * Create/Action: Implement Quiz Question and Option APIs
 * Tag: Quiz/Test
 */
/**
 * GET /api/quizzes
 * Get/List: Implement Quiz Bank CRUD
 * Tag: Quiz/Test
 */
/**
 * POST /api/quizzes
 * Create/Action: Implement Quiz Bank CRUD
 * Tag: Quiz/Test
 */
/**
 * POST /api/quizzes/generate
 * Generate mock data từ notebook/document chunks
 * Tag: Quiz/Test
 */
/**
 * DELETE /api/quizzes/{id}
 * Delete: Implement Quiz Bank CRUD
 * Tag: Quiz/Test
 */
/**
 * GET /api/quizzes/{id}
 * Get/List: Implement Quiz Bank CRUD
 * Tag: Quiz/Test
 */
/**
 * PUT /api/quizzes/{id}
 * Update: Implement Quiz Bank CRUD
 * Tag: Quiz/Test
 */
/**
 * GET /api/quizzes/{quizId}/questions
 * Get/List: Implement Quiz Question and Option APIs
 * Tag: Quiz/Test
 */
/**
 * POST /api/quizzes/{quizId}/questions
 * Create/Action: Implement Quiz Question and Option APIs
 * Tag: Quiz/Test
 */
/**
 * POST /api/quizzes/{quizId}/tests
 * Create/Action: Implement Test start and answer APIs
 * Tag: Quiz/Test
 */
/**
 * GET /api/tests/{testId}
 * Get/List: Implement Test start and answer APIs
 * Tag: Quiz/Test
 */
/**
 * POST /api/tests/{testId}/answers
 * Create/Action: Implement Test start and answer APIs
 * Tag: Quiz/Test
 */
/**
 * GET /api/tests/{testId}/result
 * Get/List: Implement Submit Test and Result APIs
 * Tag: Quiz/Test
 */
/**
 * POST /api/tests/{testId}/submit
 * Create/Action: Implement Submit Test and Result APIs
 * Tag: Quiz/Test
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// REWARD/BADGE (2 endpoints)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * POST /api/admin/badges
 * Create/Action: Implement Badge and UserBadge APIs
 * Tag: Reward/Badge
 */
/**
 * GET /api/badges
 * Get/List: Implement Badge and UserBadge APIs
 * Tag: Reward/Badge
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SYSTEM CONFIG (5 endpoints)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/admin/system-configs
 * Get/List: Implement System Config APIs for Admin
 * Tag: System Config
 */
/**
 * POST /api/admin/system-configs
 * Create/Action: Implement System Config APIs for Admin
 * Tag: System Config
 */
/**
 * DELETE /api/admin/system-configs/{id}
 * Delete: Implement System Config APIs for Admin
 * Tag: System Config
 */
/**
 * PUT /api/admin/system-configs/{id}
 * Update: Implement System Config APIs for Admin
 * Tag: System Config
 */
/**
 * GET /api/system-configs/public
 * Get/List: Implement System Config APIs for Admin
 * Tag: System Config
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SYSTEM FEEDBACK (3 endpoints)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/admin/feedbacks
 * Get/List: Implement System Feedback APIs
 * Tag: System Feedback
 */
/**
 * PATCH /api/admin/feedbacks/{id}/status
 * Partial update: Implement System Feedback APIs
 * Tag: System Feedback
 */
/**
 * POST /api/feedbacks
 * Create/Action: Implement System Feedback APIs
 * Tag: System Feedback
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SYSTEM/OTHER (2 endpoints)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * PATCH /api/admin/content/{targetType}/{targetId}/hide
 * Partial update: Implement Report Moderation Actions
 * Tag: System/Other
 */
/**
 * PATCH /api/admin/content/{targetType}/{targetId}/restore
 * Partial update: Implement Report Moderation Actions
 * Tag: System/Other
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// USER (12 endpoints)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/admin/users
 * Get/List: Implement Admin User Management APIs
 * Tag: User
 */
/**
 * GET /api/admin/users/{id}
 * Get/List: Implement Admin User Management APIs
 * Tag: User
 */
/**
 * PATCH /api/admin/users/{id}/active
 * Partial update: Implement Admin User Management APIs
 * Tag: User
 */
/**
 * PATCH /api/admin/users/{id}/role
 * Partial update: Implement Admin User Management APIs
 * Tag: User
 */
/**
 * GET /api/users/me
 * Get/List: Implement User profile APIs
 * Tag: User
 */
/**
 * PUT /api/users/me
 * Update: Implement User profile APIs
 * Tag: User
 */
/**
 * GET /api/users/me/activity-logs
 * Get/List: Implement Activity Log Service
 * Tag: User
 */
/**
 * PATCH /api/users/me/change-password
 * Partial update: Implement User profile APIs
 * Tag: User
 */
/**
 * GET /api/users/me/ai-usage
 * Get/List: Optional – Implement AI Usage Analytics
 * Tag: User
 */
/**
 * POST /api/admin/users/{userId}/badges/{badgeId}
 * Create/Action: Implement Badge and UserBadge APIs
 * Tag: User
 */
/**
 * GET /api/users/me/badges
 * Get/List: Implement Badge and UserBadge APIs
 * Tag: User
 */
/**
 * GET /api/users/me/tests
 * Get/List: Implement Submit Test and Result APIs
 * Tag: User
 */

// ═══════════════════════════════════════════════════════════════════════════════
// HANDLER ARRAY — Import này vào browser.ts hoặc handlers/index.ts
// ═══════════════════════════════════════════════════════════════════════════════

export const generatedHandlers = [

  // ── Academic Master Data ──────────────────────────────────────────────

  // POST /api/admin/combos — Create/Action: Implement Combo and ComboSubject APIs
  http.post("http://localhost:8080/api/admin/combos", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 2,
        "code": "SE_AI",
        "name": "Software Engineering - AI",
        "description": "Combo định hướng AI"
      }
    },
    { status: 200 });
  }),

  // DELETE /api/admin/combos/{id}/subjects/{subjectId} — Delete: Implement Combo and ComboSubject APIs
  http.delete("http://localhost:8080/api/admin/combos/:id/subjects/:subjectId", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Deleted successfully",
      "data": {
        "deleted": true
      }
    },
    { status: 200 });
  }),

  // POST /api/admin/combos/{id}/subjects/{subjectId} — Create/Action: Implement Combo and ComboSubject APIs
  http.post("http://localhost:8080/api/admin/combos/:id/subjects/:subjectId", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 12,
        "code": "SWR302",
        "name": "Software Requirements",
        "standardSemesterNumber": 5
      }
    },
    { status: 200 });
  }),

  // POST /api/admin/semesters — Create/Action: Implement Semester APIs
  http.post("http://localhost:8080/api/admin/semesters", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 3,
        "code": "SU26",
        "name": "Summer 2026"
      }
    },
    { status: 200 });
  }),

  // DELETE /api/admin/semesters/{id} — Delete: Implement Semester APIs
  http.delete("http://localhost:8080/api/admin/semesters/:id", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Deleted successfully",
      "data": {
        "deleted": true
      }
    },
    { status: 200 });
  }),

  // PUT /api/admin/semesters/{id} — Update: Implement Semester APIs
  http.put("http://localhost:8080/api/admin/semesters/:id", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 3,
        "code": "SU26",
        "name": "Summer 2026"
      }
    },
    { status: 200 });
  }),

  // POST /api/admin/subjects — Create/Action: Implement Subject APIs
  http.post("http://localhost:8080/api/admin/subjects", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 12,
        "code": "SWR302",
        "name": "Software Requirements",
        "standardSemesterNumber": 5
      }
    },
    { status: 200 });
  }),

  // DELETE /api/admin/subjects/{id} — Delete: Implement Subject APIs
  http.delete("http://localhost:8080/api/admin/subjects/:id", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Deleted successfully",
      "data": {
        "deleted": true
      }
    },
    { status: 200 });
  }),

  // PUT /api/admin/subjects/{id} — Update: Implement Subject APIs
  http.put("http://localhost:8080/api/admin/subjects/:id", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 12,
        "code": "SWR302",
        "name": "Software Requirements",
        "standardSemesterNumber": 5
      }
    },
    { status: 200 });
  }),

  // GET /api/combos — Get/List: Implement Combo and ComboSubject APIs
  http.get("http://localhost:8080/api/combos", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": [
        {
          "id": 2,
          "code": "SE_AI",
          "name": "Software Engineering - AI",
          "description": "Combo định hướng AI"
        }
      ]
    },
    { status: 200 });
  }),

  // GET /api/combos/{id}/subjects — Get/List: Implement Combo and ComboSubject APIs
  http.get("http://localhost:8080/api/combos/:id/subjects", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 12,
        "code": "SWR302",
        "name": "Software Requirements",
        "standardSemesterNumber": 5
      }
    },
    { status: 200 });
  }),

  // GET /api/semesters — Get/List: Implement Semester APIs
  http.get("http://localhost:8080/api/semesters", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": [
        {
          "id": 3,
          "code": "SU26",
          "name": "Summer 2026"
        }
      ]
    },
    { status: 200 });
  }),

  // GET /api/subjects — Get/List: Implement Subject APIs
  http.get("http://localhost:8080/api/subjects", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": [
        {
          "id": 12,
          "code": "SWR302",
          "name": "Software Requirements",
          "standardSemesterNumber": 5
        }
      ]
    },
    { status: 200 });
  }),

  // GET /api/subjects/{id} — Get/List: Implement Subject APIs
  http.get("http://localhost:8080/api/subjects/:id", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 12,
        "code": "SWR302",
        "name": "Software Requirements",
        "standardSemesterNumber": 5
      }
    },
    { status: 200 });
  }),

  // ── Activity Log ──────────────────────────────────────────────

  // GET /api/admin/activity-logs — Get/List: Implement Activity Log Service
  http.get("http://localhost:8080/api/admin/activity-logs", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "items": [
          {
            "id": 2001,
            "actorId": 1,
            "action": "UPLOAD_DOCUMENT",
            "targetType": "DOCUMENT",
            "targetId": 501,
            "metadata": {
              "fileType": "pdf"
            },
            "createdAt": "2026-06-12T23:00:00"
          }
        ],
        "page": 0,
        "size": 10,
        "totalElements": 42,
        "totalPages": 5
      }
    },
    { status: 200 });
  }),

  // ── Analytics ──────────────────────────────────────────────

  // GET /api/admin/analytics/ai-usage — Get/List: Optional – Implement AI Usage Analytics
  http.get("http://localhost:8080/api/admin/analytics/ai-usage", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "items": [
          {
            "userId": 1,
            "period": "2026-06",
            "chatRequests": 32,
            "quizGenerations": 5,
            "flashcardGenerations": 3,
            "estimatedTokens": 18500
          }
        ],
        "page": 0,
        "size": 10,
        "totalElements": 42,
        "totalPages": 5
      }
    },
    { status: 200 });
  }),

  // ── Auth ──────────────────────────────────────────────

  // POST /api/auth/forgot-password — Tạo reset token quên mật khẩu
  http.post("http://localhost:8080/api/auth/forgot-password", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Reset token generated. In production, token is sent by email.",
      "data": {
        "resetTokenPreview": "mock-reset-token-123",
        "expiredAt": "2026-06-12T23:30:00"
      }
    },
    { status: 200 });
  }),

  // POST /api/auth/login — Đăng nhập và nhận JWT Bearer token
  http.post("http://localhost:8080/api/auth/login", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiJ9.mock-token",
        "tokenType": "Bearer",
        "expiresIn": 3600,
        "user": {
          "id": 1,
          "email": "student@fpt.edu.vn",
          "fullName": "Nguyen Van A",
          "avatarUrl": "https://cdn.example.com/avatar/a.png",
          "currentSemesterId": 3,
          "comboId": 2,
          "role": "STUDENT",
          "reputationPoints": 120,
          "isActive": true,
          "createdAt": "2026-06-12T21:30:00"
        }
      }
    },
    { status: 200 });
  }),

  // POST /api/auth/register — Đăng ký tài khoản student mới
  http.post("http://localhost:8080/api/auth/register", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Register successfully",
      "data": {
        "id": 1,
        "email": "student@fpt.edu.vn",
        "fullName": "Nguyen Van A",
        "avatarUrl": "https://cdn.example.com/avatar/a.png",
        "currentSemesterId": 3,
        "comboId": 2,
        "role": "STUDENT",
        "reputationPoints": 120,
        "isActive": true,
        "createdAt": "2026-06-12T21:30:00"
      }
    },
    { status: 200 });
  }),

  // POST /api/auth/reset-password — Đổi mật khẩu bằng reset token
  http.post("http://localhost:8080/api/auth/reset-password", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Password reset successfully",
      "data": {
        "passwordChanged": true
      }
    },
    { status: 200 });
  }),

  // ── Chat/RAG ──────────────────────────────────────────────

  // DELETE /api/chat-sessions/{sessionId} — Delete: Implement Chat Session APIs
  http.delete("http://localhost:8080/api/chat-sessions/:sessionId", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Deleted successfully",
      "data": {
        "deleted": true
      }
    },
    { status: 200 });
  }),

  // GET /api/chat-sessions/{sessionId} — Get/List: Implement Chat Session APIs
  http.get("http://localhost:8080/api/chat-sessions/:sessionId", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 701,
        "sessionId": 301,
        "messageSequence": 1,
        "senderRole": "USER",
        "content": "SRS là gì?",
        "citedSources": [],
        "createdAt": "2026-06-12T21:56:00"
      }
    },
    { status: 200 });
  }),

  // GET /api/chat-sessions/{sessionId}/messages — Get/List: Implement Chat Message and Mock RAG Answer API
  http.get("http://localhost:8080/api/chat-sessions/:sessionId/messages", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 701,
        "sessionId": 301,
        "messageSequence": 1,
        "senderRole": "USER",
        "content": "SRS là gì?",
        "citedSources": [],
        "createdAt": "2026-06-12T21:56:00"
      }
    },
    { status: 200 });
  }),

  // POST /api/chat-sessions/{sessionId}/messages — Gửi câu hỏi và nhận câu trả lời mock RAG kèm citation
  http.post("http://localhost:8080/api/chat-sessions/:sessionId/messages", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "userMessage": {
          "id": 701,
          "sessionId": 301,
          "messageSequence": 1,
          "senderRole": "USER",
          "content": "SRS là gì?",
          "citedSources": [],
          "createdAt": "2026-06-12T21:56:00"
        },
        "aiMessage": {
          "id": 702,
          "sessionId": 301,
          "messageSequence": 2,
          "senderRole": "AI",
          "content": "SRS là tài liệu đặc tả yêu cầu phần mềm, mô tả chức năng, phi chức năng, ràng buộc và tiêu chí chấp nhận.",
          "citedSources": [
            {
              "documentId": 501,
              "documentTitle": "Chapter 10 Requirement Specification",
              "chunkIndex": 0,
              "sourcePage": 12,
              "excerpt": "Requirement specification should be clear..."
            }
          ],
          "createdAt": "2026-06-12T21:56:04"
        }
      }
    },
    { status: 200 });
  }),

  // GET /api/notebooks/{notebookId}/chat-sessions — Get/List: Implement Chat Session APIs
  http.get("http://localhost:8080/api/notebooks/:notebookId/chat-sessions", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "items": [
          {
            "id": 301,
            "notebookId": 101,
            "userId": 1,
            "title": "Ôn tập SRS",
            "createdAt": "2026-06-12T21:55:00"
          }
        ],
        "page": 0,
        "size": 10,
        "totalElements": 42,
        "totalPages": 5
      }
    },
    { status: 200 });
  }),

  // POST /api/notebooks/{notebookId}/chat-sessions — Create/Action: Implement Chat Session APIs
  http.post("http://localhost:8080/api/notebooks/:notebookId/chat-sessions", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 301,
        "notebookId": 101,
        "userId": 1,
        "title": "Ôn tập SRS",
        "createdAt": "2026-06-12T21:55:00"
      }
    },
    { status: 200 });
  }),

  // ── Community Growth ──────────────────────────────────────────────

  // GET /api/community/leaderboard/contributors — Get/List: Backlog – Implement Referral and Contributor Ranking
  http.get("http://localhost:8080/api/community/leaderboard/contributors", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "items": [
          {
            "rank": 1,
            "userId": 2,
            "fullName": "Tran Thi B",
            "reputationPoints": 980,
            "approvedContents": 42
          }
        ],
        "page": 0,
        "size": 10,
        "totalElements": 42,
        "totalPages": 5
      }
    },
    { status: 200 });
  }),

  // POST /api/referrals/apply — Create/Action: Backlog – Implement Referral and Contributor Ranking
  http.post("http://localhost:8080/api/referrals/apply", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 2101,
        "code": "HUY2026",
        "appliedByUserId": 1,
        "status": "APPLIED",
        "rewardPoints": 20
      }
    },
    { status: 200 });
  }),

  // GET /api/referrals/me — Get/List: Backlog – Implement Referral and Contributor Ranking
  http.get("http://localhost:8080/api/referrals/me", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 2101,
        "code": "HUY2026",
        "appliedByUserId": 1,
        "status": "APPLIED",
        "rewardPoints": 20
      }
    },
    { status: 200 });
  }),

  // ── Community Role/Permission ──────────────────────────────────────────────

  // GET /api/admin/community-roles — Quản lý role cộng đồng theo scope
  http.get("http://localhost:8080/api/admin/community-roles", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "items": [
          {
            "id": 1401,
            "userId": 2,
            "grantedByUserId": 99,
            "roleType": "MARKETPLACE_REVIEWER",
            "scopeType": "SUBJECT",
            "scopeId": 12,
            "startAt": "2026-06-12T00:00:00",
            "endAt": "2026-07-12T00:00:00",
            "status": "ACTIVE",
            "createdAt": "2026-06-12T22:30:00"
          }
        ],
        "page": 0,
        "size": 10,
        "totalElements": 42,
        "totalPages": 5
      }
    },
    { status: 200 });
  }),

  // POST /api/admin/community-roles — Quản lý role cộng đồng theo scope
  http.post("http://localhost:8080/api/admin/community-roles", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 1401,
        "userId": 2,
        "grantedByUserId": 99,
        "roleType": "MARKETPLACE_REVIEWER",
        "scopeType": "SUBJECT",
        "scopeId": 12,
        "startAt": "2026-06-12T00:00:00",
        "endAt": "2026-07-12T00:00:00",
        "status": "ACTIVE",
        "createdAt": "2026-06-12T22:30:00"
      }
    },
    { status: 200 });
  }),

  // PATCH /api/admin/community-roles/{id}/revoke — Quản lý role cộng đồng theo scope
  http.patch("http://localhost:8080/api/admin/community-roles/:id/revoke", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 1401,
        "userId": 2,
        "grantedByUserId": 99,
        "roleType": "MARKETPLACE_REVIEWER",
        "scopeType": "SUBJECT",
        "scopeId": 12,
        "startAt": "2026-06-12T00:00:00",
        "endAt": "2026-07-12T00:00:00",
        "status": "ACTIVE",
        "createdAt": "2026-06-12T22:30:00"
      }
    },
    { status: 200 });
  }),

  // GET /api/community-roles/me — Quản lý role cộng đồng theo scope
  http.get("http://localhost:8080/api/community-roles/me", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": [
        {
          "id": 1401,
          "userId": 2,
          "grantedByUserId": 99,
          "roleType": "MARKETPLACE_REVIEWER",
          "scopeType": "SUBJECT",
          "scopeId": 12,
          "startAt": "2026-06-12T00:00:00",
          "endAt": "2026-07-12T00:00:00",
          "status": "ACTIVE",
          "createdAt": "2026-06-12T22:30:00"
        }
      ]
    },
    { status: 200 });
  }),

  // ── Document ──────────────────────────────────────────────

  // DELETE /api/documents/{documentId}/chunks — Delete: Implement DocumentChunk APIs and processing status
  http.delete("http://localhost:8080/api/documents/:documentId/chunks", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Deleted successfully",
      "data": {
        "deleted": true
      }
    },
    { status: 200 });
  }),

  // GET /api/documents/{documentId}/chunks — Get/List: Implement DocumentChunk APIs and processing status
  http.get("http://localhost:8080/api/documents/:documentId/chunks", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": [
        {
          "id": 9001,
          "documentId": 501,
          "chunkIndex": 0,
          "textContent": "Requirement specification should be clear, complete and testable...",
          "tokenEstimate": 96,
          "sourcePage": 12,
          "sourceSection": "Chapter 10",
          "vectorId": "mock-vector-501-0"
        }
      ]
    },
    { status: 200 });
  }),

  // POST /api/documents/{documentId}/process — Process document thành chunks phục vụ RAG
  http.post("http://localhost:8080/api/documents/:documentId/process", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "documentId": 501,
        "processingStatus": "SUCCESS",
        "chunkCount": 12,
        "chunks": [
          {
            "id": 9001,
            "documentId": 501,
            "chunkIndex": 0,
            "textContent": "Requirement specification should be clear, complete and testable...",
            "tokenEstimate": 96,
            "sourcePage": 12,
            "sourceSection": "Chapter 10",
            "vectorId": "mock-vector-501-0"
          }
        ]
      }
    },
    { status: 200 });
  }),

  // GET /api/community/documents — Get/List: Implement Public Community Library APIs
  http.get("http://localhost:8080/api/community/documents", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "items": [
          {
            "id": 501,
            "userId": 1,
            "subjectId": 12,
            "title": "Chapter 10 Requirement Specification",
            "description": "Slide SWR302 chương 10",
            "fileUrl": "/uploads/documents/chapter10.pdf",
            "cloudFilePath": "documents/1/chapter10.pdf",
            "fileType": "pdf",
            "fileSize": 2457600,
            "visibility": "PRIVATE",
            "marketStatus": "NONE",
            "downloadCount": 0,
            "reviewCount": 0,
            "acceptPercentage": 0,
            "aiVerdictNote": null,
            "processingStatus": "SUCCESS",
            "createdAt": "2026-06-12T21:45:00"
          }
        ],
        "page": 0,
        "size": 10,
        "totalElements": 42,
        "totalPages": 5
      }
    },
    { status: 200 });
  }),

  // GET /api/community/documents/top — Get/List: Implement Public Community Library APIs
  http.get("http://localhost:8080/api/community/documents/top", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "items": [
          {
            "id": 501,
            "userId": 1,
            "subjectId": 12,
            "title": "Chapter 10 Requirement Specification",
            "description": "Slide SWR302 chương 10",
            "fileUrl": "/uploads/documents/chapter10.pdf",
            "cloudFilePath": "documents/1/chapter10.pdf",
            "fileType": "pdf",
            "fileSize": 2457600,
            "visibility": "PRIVATE",
            "marketStatus": "NONE",
            "downloadCount": 0,
            "reviewCount": 0,
            "acceptPercentage": 0,
            "aiVerdictNote": null,
            "processingStatus": "SUCCESS",
            "createdAt": "2026-06-12T21:45:00"
          }
        ],
        "page": 0,
        "size": 10,
        "totalElements": 42,
        "totalPages": 5
      }
    },
    { status: 200 });
  }),

  // GET /api/community/documents/{id} — Get/List: Implement Public Community Library APIs
  http.get("http://localhost:8080/api/community/documents/:id", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 501,
        "userId": 1,
        "subjectId": 12,
        "title": "Chapter 10 Requirement Specification",
        "description": "Slide SWR302 chương 10",
        "fileUrl": "/uploads/documents/chapter10.pdf",
        "cloudFilePath": "documents/1/chapter10.pdf",
        "fileType": "pdf",
        "fileSize": 2457600,
        "visibility": "PRIVATE",
        "marketStatus": "NONE",
        "downloadCount": 0,
        "reviewCount": 0,
        "acceptPercentage": 0,
        "aiVerdictNote": null,
        "processingStatus": "SUCCESS",
        "createdAt": "2026-06-12T21:45:00"
      }
    },
    { status: 200 });
  }),

  // GET /api/documents — Get/List: Implement Document metadata APIs
  http.get("http://localhost:8080/api/documents", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "items": [
          {
            "id": 501,
            "userId": 1,
            "subjectId": 12,
            "title": "Chapter 10 Requirement Specification",
            "description": "Slide SWR302 chương 10",
            "fileUrl": "/uploads/documents/chapter10.pdf",
            "cloudFilePath": "documents/1/chapter10.pdf",
            "fileType": "pdf",
            "fileSize": 2457600,
            "visibility": "PRIVATE",
            "marketStatus": "NONE",
            "downloadCount": 0,
            "reviewCount": 0,
            "acceptPercentage": 0,
            "aiVerdictNote": null,
            "processingStatus": "SUCCESS",
            "createdAt": "2026-06-12T21:45:00"
          }
        ],
        "page": 0,
        "size": 10,
        "totalElements": 42,
        "totalPages": 5
      }
    },
    { status: 200 });
  }),

  // POST /api/documents — Create/Action: Implement Document metadata APIs
  http.post("http://localhost:8080/api/documents", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 501,
        "userId": 1,
        "subjectId": 12,
        "title": "Chapter 10 Requirement Specification",
        "description": "Slide SWR302 chương 10",
        "fileUrl": "/uploads/documents/chapter10.pdf",
        "cloudFilePath": "documents/1/chapter10.pdf",
        "fileType": "pdf",
        "fileSize": 2457600,
        "visibility": "PRIVATE",
        "marketStatus": "NONE",
        "downloadCount": 0,
        "reviewCount": 0,
        "acceptPercentage": 0,
        "aiVerdictNote": null,
        "processingStatus": "SUCCESS",
        "createdAt": "2026-06-12T21:45:00"
      }
    },
    { status: 200 });
  }),

  // POST /api/documents/upload — Create/Action: Implement Upload file service mock/local
  http.post("http://localhost:8080/api/documents/upload", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 501,
        "userId": 1,
        "subjectId": 12,
        "title": "Chapter 10 Requirement Specification",
        "description": "Slide SWR302 chương 10",
        "fileUrl": "/uploads/documents/chapter10.pdf",
        "cloudFilePath": "documents/1/chapter10.pdf",
        "fileType": "pdf",
        "fileSize": 2457600,
        "visibility": "PRIVATE",
        "marketStatus": "NONE",
        "downloadCount": 0,
        "reviewCount": 0,
        "acceptPercentage": 0,
        "aiVerdictNote": null,
        "processingStatus": "SUCCESS",
        "createdAt": "2026-06-12T21:45:00"
      }
    },
    { status: 200 });
  }),

  // GET /api/documents/{documentId}/tags — Get/List: Implement Tag and DocumentTag APIs
  http.get("http://localhost:8080/api/documents/:documentId/tags", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "items": [
          {
            "id": 501,
            "userId": 1,
            "subjectId": 12,
            "title": "Chapter 10 Requirement Specification",
            "description": "Slide SWR302 chương 10",
            "fileUrl": "/uploads/documents/chapter10.pdf",
            "cloudFilePath": "documents/1/chapter10.pdf",
            "fileType": "pdf",
            "fileSize": 2457600,
            "visibility": "PRIVATE",
            "marketStatus": "NONE",
            "downloadCount": 0,
            "reviewCount": 0,
            "acceptPercentage": 0,
            "aiVerdictNote": null,
            "processingStatus": "SUCCESS",
            "createdAt": "2026-06-12T21:45:00"
          }
        ],
        "page": 0,
        "size": 10,
        "totalElements": 42,
        "totalPages": 5
      }
    },
    { status: 200 });
  }),

  // DELETE /api/documents/{documentId}/tags/{tagId} — Delete: Implement Tag and DocumentTag APIs
  http.delete("http://localhost:8080/api/documents/:documentId/tags/:tagId", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Deleted successfully",
      "data": {
        "deleted": true
      }
    },
    { status: 200 });
  }),

  // POST /api/documents/{documentId}/tags/{tagId} — Create/Action: Implement Tag and DocumentTag APIs
  http.post("http://localhost:8080/api/documents/:documentId/tags/:tagId", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 501,
        "userId": 1,
        "subjectId": 12,
        "title": "Chapter 10 Requirement Specification",
        "description": "Slide SWR302 chương 10",
        "fileUrl": "/uploads/documents/chapter10.pdf",
        "cloudFilePath": "documents/1/chapter10.pdf",
        "fileType": "pdf",
        "fileSize": 2457600,
        "visibility": "PRIVATE",
        "marketStatus": "NONE",
        "downloadCount": 0,
        "reviewCount": 0,
        "acceptPercentage": 0,
        "aiVerdictNote": null,
        "processingStatus": "SUCCESS",
        "createdAt": "2026-06-12T21:45:00"
      }
    },
    { status: 200 });
  }),

  // DELETE /api/documents/{id} — Delete: Implement Document metadata APIs
  http.delete("http://localhost:8080/api/documents/:id", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Deleted successfully",
      "data": {
        "deleted": true
      }
    },
    { status: 200 });
  }),

  // GET /api/documents/{id} — Get/List: Implement Document metadata APIs
  http.get("http://localhost:8080/api/documents/:id", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 501,
        "userId": 1,
        "subjectId": 12,
        "title": "Chapter 10 Requirement Specification",
        "description": "Slide SWR302 chương 10",
        "fileUrl": "/uploads/documents/chapter10.pdf",
        "cloudFilePath": "documents/1/chapter10.pdf",
        "fileType": "pdf",
        "fileSize": 2457600,
        "visibility": "PRIVATE",
        "marketStatus": "NONE",
        "downloadCount": 0,
        "reviewCount": 0,
        "acceptPercentage": 0,
        "aiVerdictNote": null,
        "processingStatus": "SUCCESS",
        "createdAt": "2026-06-12T21:45:00"
      }
    },
    { status: 200 });
  }),

  // PUT /api/documents/{id} — Update: Implement Document metadata APIs
  http.put("http://localhost:8080/api/documents/:id", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 501,
        "userId": 1,
        "subjectId": 12,
        "title": "Chapter 10 Requirement Specification",
        "description": "Slide SWR302 chương 10",
        "fileUrl": "/uploads/documents/chapter10.pdf",
        "cloudFilePath": "documents/1/chapter10.pdf",
        "fileType": "pdf",
        "fileSize": 2457600,
        "visibility": "PRIVATE",
        "marketStatus": "NONE",
        "downloadCount": 0,
        "reviewCount": 0,
        "acceptPercentage": 0,
        "aiVerdictNote": null,
        "processingStatus": "SUCCESS",
        "createdAt": "2026-06-12T21:45:00"
      }
    },
    { status: 200 });
  }),

  // GET /api/notebooks/{notebookId}/documents — Get/List: Implement NotebookDocument APIs
  http.get("http://localhost:8080/api/notebooks/:notebookId/documents", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "items": [
          {
            "id": 501,
            "userId": 1,
            "subjectId": 12,
            "title": "Chapter 10 Requirement Specification",
            "description": "Slide SWR302 chương 10",
            "fileUrl": "/uploads/documents/chapter10.pdf",
            "cloudFilePath": "documents/1/chapter10.pdf",
            "fileType": "pdf",
            "fileSize": 2457600,
            "visibility": "PRIVATE",
            "marketStatus": "NONE",
            "downloadCount": 0,
            "reviewCount": 0,
            "acceptPercentage": 0,
            "aiVerdictNote": null,
            "processingStatus": "SUCCESS",
            "createdAt": "2026-06-12T21:45:00"
          }
        ],
        "page": 0,
        "size": 10,
        "totalElements": 42,
        "totalPages": 5
      }
    },
    { status: 200 });
  }),

  // DELETE /api/notebooks/{notebookId}/documents/{documentId} — Delete: Implement NotebookDocument APIs
  http.delete("http://localhost:8080/api/notebooks/:notebookId/documents/:documentId", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Deleted successfully",
      "data": {
        "deleted": true
      }
    },
    { status: 200 });
  }),

  // POST /api/notebooks/{notebookId}/documents/{documentId} — Create/Action: Implement NotebookDocument APIs
  http.post("http://localhost:8080/api/notebooks/:notebookId/documents/:documentId", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 501,
        "userId": 1,
        "subjectId": 12,
        "title": "Chapter 10 Requirement Specification",
        "description": "Slide SWR302 chương 10",
        "fileUrl": "/uploads/documents/chapter10.pdf",
        "cloudFilePath": "documents/1/chapter10.pdf",
        "fileType": "pdf",
        "fileSize": 2457600,
        "visibility": "PRIVATE",
        "marketStatus": "NONE",
        "downloadCount": 0,
        "reviewCount": 0,
        "acceptPercentage": 0,
        "aiVerdictNote": null,
        "processingStatus": "SUCCESS",
        "createdAt": "2026-06-12T21:45:00"
      }
    },
    { status: 200 });
  }),

  // GET /api/tags — Get/List: Implement Tag and DocumentTag APIs
  http.get("http://localhost:8080/api/tags", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "items": [
          {
            "id": 501,
            "userId": 1,
            "subjectId": 12,
            "title": "Chapter 10 Requirement Specification",
            "description": "Slide SWR302 chương 10",
            "fileUrl": "/uploads/documents/chapter10.pdf",
            "cloudFilePath": "documents/1/chapter10.pdf",
            "fileType": "pdf",
            "fileSize": 2457600,
            "visibility": "PRIVATE",
            "marketStatus": "NONE",
            "downloadCount": 0,
            "reviewCount": 0,
            "acceptPercentage": 0,
            "aiVerdictNote": null,
            "processingStatus": "SUCCESS",
            "createdAt": "2026-06-12T21:45:00"
          }
        ],
        "page": 0,
        "size": 10,
        "totalElements": 42,
        "totalPages": 5
      }
    },
    { status: 200 });
  }),

  // POST /api/tags — Create/Action: Implement Tag and DocumentTag APIs
  http.post("http://localhost:8080/api/tags", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 501,
        "userId": 1,
        "subjectId": 12,
        "title": "Chapter 10 Requirement Specification",
        "description": "Slide SWR302 chương 10",
        "fileUrl": "/uploads/documents/chapter10.pdf",
        "cloudFilePath": "documents/1/chapter10.pdf",
        "fileType": "pdf",
        "fileSize": 2457600,
        "visibility": "PRIVATE",
        "marketStatus": "NONE",
        "downloadCount": 0,
        "reviewCount": 0,
        "acceptPercentage": 0,
        "aiVerdictNote": null,
        "processingStatus": "SUCCESS",
        "createdAt": "2026-06-12T21:45:00"
      }
    },
    { status: 200 });
  }),

  // POST /api/admin/marketplace/documents/{id}/review — Review/vote content marketplace hoặc flashcard progress
  http.post("http://localhost:8080/api/admin/marketplace/documents/:id/review", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 1201,
        "reviewerId": 2,
        "targetType": "DOCUMENT",
        "targetId": 501,
        "voteResult": "APPROVED",
        "reviewNote": "Nội dung đúng môn học, file đọc được.",
        "createdAt": "2026-06-12T22:20:00"
      }
    },
    { status: 200 });
  }),

  // GET /api/marketplace/documents — Get/List: Implement Marketplace Browse/Search APIs
  http.get("http://localhost:8080/api/marketplace/documents", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "items": [
          {
            "targetType": "DOCUMENT",
            "targetId": 501,
            "title": "Chapter 10 Requirement Specification",
            "subjectId": 12,
            "creatorName": "Nguyen Van A",
            "downloadCount": 15,
            "reviewCount": 4,
            "acceptPercentage": 92.5,
            "marketStatus": "APPROVED",
            "visibility": "MARKETPLACE"
          }
        ],
        "page": 0,
        "size": 10,
        "totalElements": 42,
        "totalPages": 5
      }
    },
    { status: 200 });
  }),

  // POST /api/marketplace/documents/{id}/clone — Clone/download content marketplace về workspace cá nhân
  http.post("http://localhost:8080/api/marketplace/documents/:id/clone", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Cloned successfully",
      "data": {
        "id": 501,
        "userId": 1,
        "subjectId": 12,
        "title": "Chapter 10 Requirement Specification",
        "description": "Slide SWR302 chương 10",
        "fileUrl": "/uploads/documents/chapter10.pdf",
        "cloudFilePath": "documents/1/chapter10.pdf",
        "fileType": "pdf",
        "fileSize": 2457600,
        "visibility": "PRIVATE",
        "marketStatus": "NONE",
        "downloadCount": 0,
        "reviewCount": 0,
        "acceptPercentage": 0,
        "aiVerdictNote": null,
        "processingStatus": "SUCCESS",
        "createdAt": "2026-06-12T21:45:00"
      }
    },
    { status: 200 });
  }),

  // POST /api/marketplace/documents/{id}/submit — Submit content lên marketplace để chờ duyệt
  http.post("http://localhost:8080/api/marketplace/documents/:id/submit", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 501,
        "userId": 1,
        "subjectId": 12,
        "title": "Chapter 10 Requirement Specification",
        "description": "Slide SWR302 chương 10",
        "fileUrl": "/uploads/documents/chapter10.pdf",
        "cloudFilePath": "documents/1/chapter10.pdf",
        "fileType": "pdf",
        "fileSize": 2457600,
        "visibility": "PRIVATE",
        "marketStatus": "NONE",
        "downloadCount": 0,
        "reviewCount": 0,
        "acceptPercentage": 0,
        "aiVerdictNote": null,
        "processingStatus": "SUCCESS",
        "createdAt": "2026-06-12T21:45:00"
      }
    },
    { status: 200 });
  }),

  // ── Flashcard ──────────────────────────────────────────────

  // POST /api/admin/marketplace/flashcard-decks/{id}/review — Review/vote content marketplace hoặc flashcard progress
  http.post("http://localhost:8080/api/admin/marketplace/flashcard-decks/:id/review", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 1201,
        "reviewerId": 2,
        "targetType": "DOCUMENT",
        "targetId": 501,
        "voteResult": "APPROVED",
        "reviewNote": "Nội dung đúng môn học, file đọc được.",
        "createdAt": "2026-06-12T22:20:00"
      }
    },
    { status: 200 });
  }),

  // GET /api/flashcard-decks — Get/List: Implement Flashcard Deck and Card CRUD
  http.get("http://localhost:8080/api/flashcard-decks", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "items": [
          {
            "id": 1001,
            "userId": 1,
            "notebookId": 101,
            "subjectId": 12,
            "title": "SWR302 Key Terms",
            "visibility": "PRIVATE",
            "marketStatus": "NONE",
            "downloadCount": 0,
            "reviewCount": 0,
            "acceptPercentage": 0,
            "createdAt": "2026-06-12T22:10:00",
            "cards": [
              {
                "id": 1011,
                "deckId": 1001,
                "frontText": "SRS",
                "backText": "Software Requirements Specification"
              }
            ]
          }
        ],
        "page": 0,
        "size": 10,
        "totalElements": 42,
        "totalPages": 5
      }
    },
    { status: 200 });
  }),

  // POST /api/flashcard-decks — Create/Action: Implement Flashcard Deck and Card CRUD
  http.post("http://localhost:8080/api/flashcard-decks", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 1001,
        "userId": 1,
        "notebookId": 101,
        "subjectId": 12,
        "title": "SWR302 Key Terms",
        "visibility": "PRIVATE",
        "marketStatus": "NONE",
        "downloadCount": 0,
        "reviewCount": 0,
        "acceptPercentage": 0,
        "createdAt": "2026-06-12T22:10:00",
        "cards": [
          {
            "id": 1011,
            "deckId": 1001,
            "frontText": "SRS",
            "backText": "Software Requirements Specification"
          }
        ]
      }
    },
    { status: 200 });
  }),

  // POST /api/flashcard-decks/generate — Generate mock data từ notebook/document chunks
  http.post("http://localhost:8080/api/flashcard-decks/generate", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 1001,
        "userId": 1,
        "notebookId": 101,
        "subjectId": 12,
        "title": "SWR302 Key Terms",
        "visibility": "PRIVATE",
        "marketStatus": "NONE",
        "downloadCount": 0,
        "reviewCount": 0,
        "acceptPercentage": 0,
        "createdAt": "2026-06-12T22:10:00",
        "cards": [
          {
            "id": 1011,
            "deckId": 1001,
            "frontText": "SRS",
            "backText": "Software Requirements Specification"
          }
        ]
      }
    },
    { status: 200 });
  }),

  // POST /api/flashcard-decks/{deckId}/cards — Create/Action: Implement Flashcard Deck and Card CRUD
  http.post("http://localhost:8080/api/flashcard-decks/:deckId/cards", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 1001,
        "userId": 1,
        "notebookId": 101,
        "subjectId": 12,
        "title": "SWR302 Key Terms",
        "visibility": "PRIVATE",
        "marketStatus": "NONE",
        "downloadCount": 0,
        "reviewCount": 0,
        "acceptPercentage": 0,
        "createdAt": "2026-06-12T22:10:00",
        "cards": [
          {
            "id": 1011,
            "deckId": 1001,
            "frontText": "SRS",
            "backText": "Software Requirements Specification"
          }
        ]
      }
    },
    { status: 200 });
  }),

  // GET /api/flashcard-decks/{deckId}/progress — Get/List: Implement Flashcard Review Progress
  http.get("http://localhost:8080/api/flashcard-decks/:deckId/progress", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "deckId": 1001,
        "reviewedCards": 12,
        "totalCards": 20,
        "rememberedRate": 75
      }
    },
    { status: 200 });
  }),

  // DELETE /api/flashcard-decks/{id} — Delete: Implement Flashcard Deck and Card CRUD
  http.delete("http://localhost:8080/api/flashcard-decks/:id", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Deleted successfully",
      "data": {
        "deleted": true
      }
    },
    { status: 200 });
  }),

  // GET /api/flashcard-decks/{id} — Get/List: Implement Flashcard Deck and Card CRUD
  http.get("http://localhost:8080/api/flashcard-decks/:id", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 1001,
        "userId": 1,
        "notebookId": 101,
        "subjectId": 12,
        "title": "SWR302 Key Terms",
        "visibility": "PRIVATE",
        "marketStatus": "NONE",
        "downloadCount": 0,
        "reviewCount": 0,
        "acceptPercentage": 0,
        "createdAt": "2026-06-12T22:10:00",
        "cards": [
          {
            "id": 1011,
            "deckId": 1001,
            "frontText": "SRS",
            "backText": "Software Requirements Specification"
          }
        ]
      }
    },
    { status: 200 });
  }),

  // PUT /api/flashcard-decks/{id} — Update: Implement Flashcard Deck and Card CRUD
  http.put("http://localhost:8080/api/flashcard-decks/:id", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 1001,
        "userId": 1,
        "notebookId": 101,
        "subjectId": 12,
        "title": "SWR302 Key Terms",
        "visibility": "PRIVATE",
        "marketStatus": "NONE",
        "downloadCount": 0,
        "reviewCount": 0,
        "acceptPercentage": 0,
        "createdAt": "2026-06-12T22:10:00",
        "cards": [
          {
            "id": 1011,
            "deckId": 1001,
            "frontText": "SRS",
            "backText": "Software Requirements Specification"
          }
        ]
      }
    },
    { status: 200 });
  }),

  // GET /api/flashcards/due — Get/List: Implement Flashcard Review Progress
  http.get("http://localhost:8080/api/flashcards/due", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": [
        {
          "id": 1011,
          "deckId": 1001,
          "frontText": "SRS",
          "backText": "Software Requirements Specification"
        }
      ]
    },
    { status: 200 });
  }),

  // DELETE /api/flashcards/{cardId} — Delete: Implement Flashcard Deck and Card CRUD
  http.delete("http://localhost:8080/api/flashcards/:cardId", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Deleted successfully",
      "data": {
        "deleted": true
      }
    },
    { status: 200 });
  }),

  // PUT /api/flashcards/{cardId} — Update: Implement Flashcard Deck and Card CRUD
  http.put("http://localhost:8080/api/flashcards/:cardId", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 1011,
        "deckId": 1001,
        "frontText": "SRS",
        "backText": "Software Requirements Specification"
      }
    },
    { status: 200 });
  }),

  // POST /api/flashcards/{cardId}/review — Review/vote content marketplace hoặc flashcard progress
  http.post("http://localhost:8080/api/flashcards/:cardId/review", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "flashcardId": 1011,
        "boxLevel": 2,
        "lastReviewed": "2026-06-12T22:15:00",
        "nextReviewAt": "2026-06-14T22:15:00"
      }
    },
    { status: 200 });
  }),

  // GET /api/marketplace/flashcard-decks — Get/List: Implement Marketplace Browse/Search APIs
  http.get("http://localhost:8080/api/marketplace/flashcard-decks", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "items": [
          {
            "targetType": "DOCUMENT",
            "targetId": 501,
            "title": "Chapter 10 Requirement Specification",
            "subjectId": 12,
            "creatorName": "Nguyen Van A",
            "downloadCount": 15,
            "reviewCount": 4,
            "acceptPercentage": 92.5,
            "marketStatus": "APPROVED",
            "visibility": "MARKETPLACE"
          }
        ],
        "page": 0,
        "size": 10,
        "totalElements": 42,
        "totalPages": 5
      }
    },
    { status: 200 });
  }),

  // POST /api/marketplace/flashcard-decks/{id}/clone — Clone/download content marketplace về workspace cá nhân
  http.post("http://localhost:8080/api/marketplace/flashcard-decks/:id/clone", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Cloned successfully",
      "data": {
        "id": 1001,
        "userId": 1,
        "notebookId": 101,
        "subjectId": 12,
        "title": "SWR302 Key Terms",
        "visibility": "PRIVATE",
        "marketStatus": "NONE",
        "downloadCount": 0,
        "reviewCount": 0,
        "acceptPercentage": 0,
        "createdAt": "2026-06-12T22:10:00",
        "cards": [
          {
            "id": 1011,
            "deckId": 1001,
            "frontText": "SRS",
            "backText": "Software Requirements Specification"
          }
        ]
      }
    },
    { status: 200 });
  }),

  // POST /api/marketplace/flashcard-decks/{id}/submit — Submit content lên marketplace để chờ duyệt
  http.post("http://localhost:8080/api/marketplace/flashcard-decks/:id/submit", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 1001,
        "userId": 1,
        "notebookId": 101,
        "subjectId": 12,
        "title": "SWR302 Key Terms",
        "visibility": "PRIVATE",
        "marketStatus": "NONE",
        "downloadCount": 0,
        "reviewCount": 0,
        "acceptPercentage": 0,
        "createdAt": "2026-06-12T22:10:00",
        "cards": [
          {
            "id": 1011,
            "deckId": 1001,
            "frontText": "SRS",
            "backText": "Software Requirements Specification"
          }
        ]
      }
    },
    { status: 200 });
  }),

  // ── Governance/Community Review ──────────────────────────────────────────────

  // GET /api/admin/reports — Tạo/xử lý report nội dung
  http.get("http://localhost:8080/api/admin/reports", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "items": [
          {
            "id": 1301,
            "reporterId": 1,
            "targetType": "DOCUMENT",
            "targetId": 501,
            "reasonType": "COPYRIGHT",
            "reportDetails": "Tài liệu có dấu hiệu vi phạm bản quyền",
            "severityLevel": "HIGH",
            "status": "PENDING_ADMIN",
            "createdAt": "2026-06-12T22:25:00"
          }
        ],
        "page": 0,
        "size": 10,
        "totalElements": 42,
        "totalPages": 5
      }
    },
    { status: 200 });
  }),

  // GET /api/admin/reports/{id} — Tạo/xử lý report nội dung
  http.get("http://localhost:8080/api/admin/reports/:id", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 1301,
        "reporterId": 1,
        "targetType": "DOCUMENT",
        "targetId": 501,
        "reasonType": "COPYRIGHT",
        "reportDetails": "Tài liệu có dấu hiệu vi phạm bản quyền",
        "severityLevel": "HIGH",
        "status": "PENDING_ADMIN",
        "createdAt": "2026-06-12T22:25:00"
      }
    },
    { status: 200 });
  }),

  // PATCH /api/admin/reports/{id}/reject — Tạo/xử lý report nội dung
  http.patch("http://localhost:8080/api/admin/reports/:id/reject", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "items": [
          {
            "id": 1301,
            "reporterId": 1,
            "targetType": "DOCUMENT",
            "targetId": 501,
            "reasonType": "COPYRIGHT",
            "reportDetails": "Tài liệu có dấu hiệu vi phạm bản quyền",
            "severityLevel": "HIGH",
            "status": "PENDING_ADMIN",
            "createdAt": "2026-06-12T22:25:00"
          }
        ],
        "page": 0,
        "size": 10,
        "totalElements": 42,
        "totalPages": 5
      }
    },
    { status: 200 });
  }),

  // PATCH /api/admin/reports/{id}/resolve — Tạo/xử lý report nội dung
  http.patch("http://localhost:8080/api/admin/reports/:id/resolve", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "items": [
          {
            "id": 1301,
            "reporterId": 1,
            "targetType": "DOCUMENT",
            "targetId": 501,
            "reasonType": "COPYRIGHT",
            "reportDetails": "Tài liệu có dấu hiệu vi phạm bản quyền",
            "severityLevel": "HIGH",
            "status": "PENDING_ADMIN",
            "createdAt": "2026-06-12T22:25:00"
          }
        ],
        "page": 0,
        "size": 10,
        "totalElements": 42,
        "totalPages": 5
      }
    },
    { status: 200 });
  }),

  // POST /api/community/comments — Create/Action: Optional – Implement Community Comment APIs
  http.post("http://localhost:8080/api/community/comments", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 1951,
        "targetType": "DOCUMENT",
        "targetId": 501,
        "content": "Bạn có file chapter 11 không?",
        "isHidden": false,
        "createdAt": "2026-06-12T22:55:00"
      }
    },
    { status: 200 });
  }),

  // GET /api/community/comments — Get/List: Optional – Implement Community Comment APIs
  http.get("http://localhost:8080/api/community/comments", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "items": [
          {
            "id": 1951,
            "targetType": "DOCUMENT",
            "targetId": 501,
            "content": "Bạn có file chapter 11 không?",
            "isHidden": false,
            "createdAt": "2026-06-12T22:55:00"
          }
        ],
        "page": 0,
        "size": 10,
        "totalElements": 42,
        "totalPages": 5
      }
    },
    { status: 200 });
  }),

  // DELETE /api/community/comments/{id} — Delete: Optional – Implement Community Comment APIs
  http.delete("http://localhost:8080/api/community/comments/:id", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Deleted successfully",
      "data": {
        "deleted": true
      }
    },
    { status: 200 });
  }),

  // PATCH /api/community/comments/{id}/hide — Partial update: Optional – Implement Community Comment APIs
  http.patch("http://localhost:8080/api/community/comments/:id/hide", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 1951,
        "targetType": "DOCUMENT",
        "targetId": 501,
        "content": "Bạn có file chapter 11 không?",
        "isHidden": false,
        "createdAt": "2026-06-12T22:55:00"
      }
    },
    { status: 200 });
  }),

  // POST /api/community/reviews — Review/vote content marketplace hoặc flashcard progress
  http.post("http://localhost:8080/api/community/reviews", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 1901,
        "targetType": "DOCUMENT",
        "targetId": 501,
        "rating": 5,
        "content": "Tài liệu dễ hiểu, đúng môn học.",
        "createdAt": "2026-06-12T22:50:00"
      }
    },
    { status: 200 });
  }),

  // GET /api/community/reviews — Review/vote content marketplace hoặc flashcard progress
  http.get("http://localhost:8080/api/community/reviews", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "items": [
          {
            "id": 1901,
            "targetType": "DOCUMENT",
            "targetId": 501,
            "rating": 5,
            "content": "Tài liệu dễ hiểu, đúng môn học.",
            "createdAt": "2026-06-12T22:50:00"
          }
        ],
        "page": 0,
        "size": 10,
        "totalElements": 42,
        "totalPages": 5
      }
    },
    { status: 200 });
  }),

  // DELETE /api/community/reviews/{id} — Review/vote content marketplace hoặc flashcard progress
  http.delete("http://localhost:8080/api/community/reviews/:id", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Deleted successfully",
      "data": {
        "deleted": true
      }
    },
    { status: 200 });
  }),

  // PUT /api/community/reviews/{id} — Review/vote content marketplace hoặc flashcard progress
  http.put("http://localhost:8080/api/community/reviews/:id", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 1901,
        "targetType": "DOCUMENT",
        "targetId": 501,
        "rating": 5,
        "content": "Tài liệu dễ hiểu, đúng môn học.",
        "createdAt": "2026-06-12T22:50:00"
      }
    },
    { status: 200 });
  }),

  // POST /api/reports — Tạo/xử lý report nội dung
  http.post("http://localhost:8080/api/reports", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Report submitted",
      "data": {
        "id": 1301,
        "reporterId": 1,
        "targetType": "DOCUMENT",
        "targetId": 501,
        "reasonType": "COPYRIGHT",
        "reportDetails": "Tài liệu có dấu hiệu vi phạm bản quyền",
        "severityLevel": "HIGH",
        "status": "PENDING_ADMIN",
        "createdAt": "2026-06-12T22:25:00"
      }
    },
    { status: 200 });
  }),

  // GET /api/reports/my — Tạo/xử lý report nội dung
  http.get("http://localhost:8080/api/reports/my", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "items": [
          {
            "id": 1301,
            "reporterId": 1,
            "targetType": "DOCUMENT",
            "targetId": 501,
            "reasonType": "COPYRIGHT",
            "reportDetails": "Tài liệu có dấu hiệu vi phạm bản quyền",
            "severityLevel": "HIGH",
            "status": "PENDING_ADMIN",
            "createdAt": "2026-06-12T22:25:00"
          }
        ],
        "page": 0,
        "size": 10,
        "totalElements": 42,
        "totalPages": 5
      }
    },
    { status: 200 });
  }),

  // ── Marketplace/Admin Content ──────────────────────────────────────────────

  // GET /api/admin/contents — Get/List: Implement Admin Content Management APIs
  http.get("http://localhost:8080/api/admin/contents", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "items": [
          {
            "targetType": "DOCUMENT",
            "targetId": 501,
            "title": "Chapter 10 Requirement Specification",
            "subjectId": 12,
            "creatorName": "Nguyen Van A",
            "downloadCount": 15,
            "reviewCount": 4,
            "acceptPercentage": 92.5,
            "marketStatus": "APPROVED",
            "visibility": "MARKETPLACE"
          }
        ],
        "page": 0,
        "size": 10,
        "totalElements": 42,
        "totalPages": 5
      }
    },
    { status: 200 });
  }),

  // DELETE /api/admin/contents/{targetType}/{targetId} — Delete: Implement Admin Content Management APIs
  http.delete("http://localhost:8080/api/admin/contents/:targetType/:targetId", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Deleted successfully",
      "data": {
        "deleted": true
      }
    },
    { status: 200 });
  }),

  // GET /api/admin/contents/{targetType}/{targetId} — Get/List: Implement Admin Content Management APIs
  http.get("http://localhost:8080/api/admin/contents/:targetType/:targetId", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "targetType": "DOCUMENT",
        "targetId": 501,
        "title": "Chapter 10 Requirement Specification",
        "subjectId": 12,
        "creatorName": "Nguyen Van A",
        "downloadCount": 15,
        "reviewCount": 4,
        "acceptPercentage": 92.5,
        "marketStatus": "APPROVED",
        "visibility": "MARKETPLACE"
      }
    },
    { status: 200 });
  }),

  // PATCH /api/admin/contents/{targetType}/{targetId}/market-status — Partial update: Implement Admin Content Management APIs
  http.patch("http://localhost:8080/api/admin/contents/:targetType/:targetId/market-status", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "targetType": "DOCUMENT",
        "targetId": 501,
        "title": "Chapter 10 Requirement Specification",
        "subjectId": 12,
        "creatorName": "Nguyen Van A",
        "downloadCount": 15,
        "reviewCount": 4,
        "acceptPercentage": 92.5,
        "marketStatus": "APPROVED",
        "visibility": "MARKETPLACE"
      }
    },
    { status: 200 });
  }),

  // PATCH /api/admin/contents/{targetType}/{targetId}/visibility — Partial update: Implement Admin Content Management APIs
  http.patch("http://localhost:8080/api/admin/contents/:targetType/:targetId/visibility", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "targetType": "DOCUMENT",
        "targetId": 501,
        "title": "Chapter 10 Requirement Specification",
        "subjectId": 12,
        "creatorName": "Nguyen Van A",
        "downloadCount": 15,
        "reviewCount": 4,
        "acceptPercentage": 92.5,
        "marketStatus": "APPROVED",
        "visibility": "MARKETPLACE"
      }
    },
    { status: 200 });
  }),

  // GET /api/admin/marketplace/pending — Get/List: Implement Market Review APIs
  http.get("http://localhost:8080/api/admin/marketplace/pending", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "items": [
          {
            "targetType": "DOCUMENT",
            "targetId": 501,
            "title": "Chapter 10 Requirement Specification",
            "submittedAt": "2026-06-12T22:00:00"
          }
        ],
        "page": 0,
        "size": 10,
        "totalElements": 42,
        "totalPages": 5
      }
    },
    { status: 200 });
  }),

  // PATCH /api/admin/marketplace/{targetType}/{targetId}/approve — Partial update: Implement Reviewer Marketplace Queue
  http.patch("http://localhost:8080/api/admin/marketplace/:targetType/:targetId/approve", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 1201,
        "reviewerId": 2,
        "targetType": "DOCUMENT",
        "targetId": 501,
        "voteResult": "APPROVED",
        "reviewNote": "Nội dung đúng môn học, file đọc được.",
        "createdAt": "2026-06-12T22:20:00"
      }
    },
    { status: 200 });
  }),

  // PATCH /api/admin/marketplace/{targetType}/{targetId}/reject — Partial update: Implement Reviewer Marketplace Queue
  http.patch("http://localhost:8080/api/admin/marketplace/:targetType/:targetId/reject", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 1201,
        "reviewerId": 2,
        "targetType": "DOCUMENT",
        "targetId": 501,
        "voteResult": "APPROVED",
        "reviewNote": "Nội dung đúng môn học, file đọc được.",
        "createdAt": "2026-06-12T22:20:00"
      }
    },
    { status: 200 });
  }),

  // GET /api/marketplace/search — Get/List: Implement Marketplace Browse/Search APIs
  http.get("http://localhost:8080/api/marketplace/search", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "items": [
          {
            "targetType": "DOCUMENT",
            "targetId": 501,
            "title": "Chapter 10 Requirement Specification",
            "subjectId": 12,
            "creatorName": "Nguyen Van A",
            "downloadCount": 15,
            "reviewCount": 4,
            "acceptPercentage": 92.5,
            "marketStatus": "APPROVED",
            "visibility": "MARKETPLACE"
          }
        ],
        "page": 0,
        "size": 10,
        "totalElements": 42,
        "totalPages": 5
      }
    },
    { status: 200 });
  }),

  // GET /api/reviewer/marketplace/pending — Review/vote content marketplace hoặc flashcard progress
  http.get("http://localhost:8080/api/reviewer/marketplace/pending", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "items": [
          {
            "targetType": "DOCUMENT",
            "targetId": 501,
            "title": "Chapter 10 Requirement Specification",
            "submittedAt": "2026-06-12T22:00:00"
          }
        ],
        "page": 0,
        "size": 10,
        "totalElements": 42,
        "totalPages": 5
      }
    },
    { status: 200 });
  }),

  // GET /api/reviewer/marketplace/{targetType}/{targetId} — Review/vote content marketplace hoặc flashcard progress
  http.get("http://localhost:8080/api/reviewer/marketplace/:targetType/:targetId", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "items": [
          {
            "targetType": "DOCUMENT",
            "targetId": 501,
            "title": "Chapter 10 Requirement Specification",
            "subjectId": 12,
            "creatorName": "Nguyen Van A",
            "downloadCount": 15,
            "reviewCount": 4,
            "acceptPercentage": 92.5,
            "marketStatus": "APPROVED",
            "visibility": "MARKETPLACE"
          }
        ],
        "page": 0,
        "size": 10,
        "totalElements": 42,
        "totalPages": 5
      }
    },
    { status: 200 });
  }),

  // POST /api/reviewer/marketplace/{targetType}/{targetId}/vote — Review/vote content marketplace hoặc flashcard progress
  http.post("http://localhost:8080/api/reviewer/marketplace/:targetType/:targetId/vote", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 1201,
        "reviewerId": 2,
        "targetType": "DOCUMENT",
        "targetId": 501,
        "voteResult": "APPROVED",
        "reviewNote": "Nội dung đúng môn học, file đọc được.",
        "createdAt": "2026-06-12T22:20:00"
      }
    },
    { status: 200 });
  }),

  // ── Notebook ──────────────────────────────────────────────

  // GET /api/notebooks — Get/List: Implement Notebook CRUD
  http.get("http://localhost:8080/api/notebooks", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "items": [
          {
            "id": 101,
            "userId": 1,
            "subjectId": 12,
            "subjectCode": "SWR302",
            "title": "SWR302 - Requirements Engineering",
            "documentCount": 3,
            "createdAt": "2026-06-12T21:40:00"
          }
        ],
        "page": 0,
        "size": 10,
        "totalElements": 42,
        "totalPages": 5
      }
    },
    { status: 200 });
  }),

  // POST /api/notebooks — Create/Action: Implement Notebook CRUD
  http.post("http://localhost:8080/api/notebooks", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 101,
        "userId": 1,
        "subjectId": 12,
        "subjectCode": "SWR302",
        "title": "SWR302 - Requirements Engineering",
        "documentCount": 3,
        "createdAt": "2026-06-12T21:40:00"
      }
    },
    { status: 200 });
  }),

  // DELETE /api/notebooks/{id} — Delete: Implement Notebook CRUD
  http.delete("http://localhost:8080/api/notebooks/:id", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Deleted successfully",
      "data": {
        "deleted": true
      }
    },
    { status: 200 });
  }),

  // GET /api/notebooks/{id} — Get/List: Implement Notebook CRUD
  http.get("http://localhost:8080/api/notebooks/:id", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 101,
        "userId": 1,
        "subjectId": 12,
        "subjectCode": "SWR302",
        "title": "SWR302 - Requirements Engineering",
        "documentCount": 3,
        "createdAt": "2026-06-12T21:40:00"
      }
    },
    { status: 200 });
  }),

  // PUT /api/notebooks/{id} — Update: Implement Notebook CRUD
  http.put("http://localhost:8080/api/notebooks/:id", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 101,
        "userId": 1,
        "subjectId": 12,
        "subjectCode": "SWR302",
        "title": "SWR302 - Requirements Engineering",
        "documentCount": 3,
        "createdAt": "2026-06-12T21:40:00"
      }
    },
    { status: 200 });
  }),

  // ── Notification ──────────────────────────────────────────────

  // GET /api/notifications — Get/List: Implement Notification APIs
  http.get("http://localhost:8080/api/notifications", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "items": [
          {
            "id": 1601,
            "userId": 1,
            "title": "Tài liệu đã được duyệt",
            "content": "Chapter 10 đã được approve lên marketplace.",
            "isRead": false,
            "createdAt": "2026-06-12T22:40:00"
          }
        ],
        "page": 0,
        "size": 10,
        "totalElements": 42,
        "totalPages": 5
      }
    },
    { status: 200 });
  }),

  // PATCH /api/notifications/read-all — Partial update: Implement Notification APIs
  http.patch("http://localhost:8080/api/notifications/read-all", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "All notifications marked as read",
      "data": {
        "updatedCount": 5
      }
    },
    { status: 200 });
  }),

  // DELETE /api/notifications/{id} — Delete: Implement Notification APIs
  http.delete("http://localhost:8080/api/notifications/:id", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Deleted successfully",
      "data": {
        "deleted": true
      }
    },
    { status: 200 });
  }),

  // PATCH /api/notifications/{id}/read — Partial update: Implement Notification APIs
  http.patch("http://localhost:8080/api/notifications/:id/read", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 1601,
        "userId": 1,
        "title": "Tài liệu đã được duyệt",
        "content": "Chapter 10 đã được approve lên marketplace.",
        "isRead": true,
        "createdAt": "2026-06-12T22:40:00"
      }
    },
    { status: 200 });
  }),

  // ── Quiz/Test ──────────────────────────────────────────────

  // POST /api/admin/marketplace/quizzes/{id}/review — Review/vote content marketplace hoặc flashcard progress
  http.post("http://localhost:8080/api/admin/marketplace/quizzes/:id/review", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 1201,
        "reviewerId": 2,
        "targetType": "DOCUMENT",
        "targetId": 501,
        "voteResult": "APPROVED",
        "reviewNote": "Nội dung đúng môn học, file đọc được.",
        "createdAt": "2026-06-12T22:20:00"
      }
    },
    { status: 200 });
  }),

  // GET /api/marketplace/quizzes — Get/List: Implement Marketplace Browse/Search APIs
  http.get("http://localhost:8080/api/marketplace/quizzes", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "items": [
          {
            "targetType": "DOCUMENT",
            "targetId": 501,
            "title": "Chapter 10 Requirement Specification",
            "subjectId": 12,
            "creatorName": "Nguyen Van A",
            "downloadCount": 15,
            "reviewCount": 4,
            "acceptPercentage": 92.5,
            "marketStatus": "APPROVED",
            "visibility": "MARKETPLACE"
          }
        ],
        "page": 0,
        "size": 10,
        "totalElements": 42,
        "totalPages": 5
      }
    },
    { status: 200 });
  }),

  // POST /api/marketplace/quizzes/{id}/clone — Clone/download content marketplace về workspace cá nhân
  http.post("http://localhost:8080/api/marketplace/quizzes/:id/clone", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Cloned successfully",
      "data": {
        "id": 801,
        "notebookId": 101,
        "subjectId": 12,
        "creatorId": 1,
        "title": "SWR302 Quiz Chapter 10",
        "description": "Quiz ôn tập SRS",
        "academicTermId": 3,
        "examType": "PRACTICE",
        "visibility": "PRIVATE",
        "marketStatus": "NONE",
        "downloadCount": 0,
        "reviewCount": 0,
        "acceptPercentage": 0,
        "createdAt": "2026-06-12T22:00:00"
      }
    },
    { status: 200 });
  }),

  // POST /api/marketplace/quizzes/{id}/submit — Submit content lên marketplace để chờ duyệt
  http.post("http://localhost:8080/api/marketplace/quizzes/:id/submit", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 801,
        "notebookId": 101,
        "subjectId": 12,
        "creatorId": 1,
        "title": "SWR302 Quiz Chapter 10",
        "description": "Quiz ôn tập SRS",
        "academicTermId": 3,
        "examType": "PRACTICE",
        "visibility": "PRIVATE",
        "marketStatus": "NONE",
        "downloadCount": 0,
        "reviewCount": 0,
        "acceptPercentage": 0,
        "createdAt": "2026-06-12T22:00:00"
      }
    },
    { status: 200 });
  }),

  // DELETE /api/options/{optionId} — Delete: Implement Quiz Question and Option APIs
  http.delete("http://localhost:8080/api/options/:optionId", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Deleted successfully",
      "data": {
        "deleted": true
      }
    },
    { status: 200 });
  }),

  // PUT /api/options/{optionId} — Update: Implement Quiz Question and Option APIs
  http.put("http://localhost:8080/api/options/:optionId", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 821,
        "questionId": 811,
        "optionText": "Rõ ràng và kiểm thử được",
        "isCorrect": true
      }
    },
    { status: 200 });
  }),

  // DELETE /api/questions/{questionId} — Delete: Implement Quiz Question and Option APIs
  http.delete("http://localhost:8080/api/questions/:questionId", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Deleted successfully",
      "data": {
        "deleted": true
      }
    },
    { status: 200 });
  }),

  // PUT /api/questions/{questionId} — Update: Implement Quiz Question and Option APIs
  http.put("http://localhost:8080/api/questions/:questionId", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 811,
        "quizId": 801,
        "questionText": "Yêu cầu tốt cần có đặc điểm nào?",
        "questionType": "SINGLE_CHOICE",
        "explanation": "Yêu cầu nên rõ ràng, đầy đủ, nhất quán và kiểm thử được.",
        "options": [
          {
            "id": 821,
            "questionId": 811,
            "optionText": "Rõ ràng và kiểm thử được",
            "isCorrect": true
          },
          {
            "id": 822,
            "questionId": 811,
            "optionText": "Càng chung chung càng tốt",
            "isCorrect": false
          }
        ]
      }
    },
    { status: 200 });
  }),

  // POST /api/questions/{questionId}/options — Create/Action: Implement Quiz Question and Option APIs
  http.post("http://localhost:8080/api/questions/:questionId/options", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 821,
        "questionId": 811,
        "optionText": "Rõ ràng và kiểm thử được",
        "isCorrect": true
      }
    },
    { status: 200 });
  }),

  // GET /api/quizzes — Get/List: Implement Quiz Bank CRUD
  http.get("http://localhost:8080/api/quizzes", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "items": [
          {
            "id": 801,
            "notebookId": 101,
            "subjectId": 12,
            "creatorId": 1,
            "title": "SWR302 Quiz Chapter 10",
            "description": "Quiz ôn tập SRS",
            "academicTermId": 3,
            "examType": "PRACTICE",
            "visibility": "PRIVATE",
            "marketStatus": "NONE",
            "downloadCount": 0,
            "reviewCount": 0,
            "acceptPercentage": 0,
            "createdAt": "2026-06-12T22:00:00"
          }
        ],
        "page": 0,
        "size": 10,
        "totalElements": 42,
        "totalPages": 5
      }
    },
    { status: 200 });
  }),

  // POST /api/quizzes — Create/Action: Implement Quiz Bank CRUD
  http.post("http://localhost:8080/api/quizzes", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 801,
        "notebookId": 101,
        "subjectId": 12,
        "creatorId": 1,
        "title": "SWR302 Quiz Chapter 10",
        "description": "Quiz ôn tập SRS",
        "academicTermId": 3,
        "examType": "PRACTICE",
        "visibility": "PRIVATE",
        "marketStatus": "NONE",
        "downloadCount": 0,
        "reviewCount": 0,
        "acceptPercentage": 0,
        "createdAt": "2026-06-12T22:00:00"
      }
    },
    { status: 200 });
  }),

  // POST /api/quizzes/generate — Generate mock data từ notebook/document chunks
  http.post("http://localhost:8080/api/quizzes/generate", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 801,
        "notebookId": 101,
        "subjectId": 12,
        "creatorId": 1,
        "title": "SWR302 Quiz Chapter 10",
        "description": "Quiz ôn tập SRS",
        "academicTermId": 3,
        "examType": "PRACTICE",
        "visibility": "PRIVATE",
        "marketStatus": "NONE",
        "downloadCount": 0,
        "reviewCount": 0,
        "acceptPercentage": 0,
        "createdAt": "2026-06-12T22:00:00"
      }
    },
    { status: 200 });
  }),

  // DELETE /api/quizzes/{id} — Delete: Implement Quiz Bank CRUD
  http.delete("http://localhost:8080/api/quizzes/:id", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Deleted successfully",
      "data": {
        "deleted": true
      }
    },
    { status: 200 });
  }),

  // GET /api/quizzes/{id} — Get/List: Implement Quiz Bank CRUD
  http.get("http://localhost:8080/api/quizzes/:id", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 801,
        "notebookId": 101,
        "subjectId": 12,
        "creatorId": 1,
        "title": "SWR302 Quiz Chapter 10",
        "description": "Quiz ôn tập SRS",
        "academicTermId": 3,
        "examType": "PRACTICE",
        "visibility": "PRIVATE",
        "marketStatus": "NONE",
        "downloadCount": 0,
        "reviewCount": 0,
        "acceptPercentage": 0,
        "createdAt": "2026-06-12T22:00:00"
      }
    },
    { status: 200 });
  }),

  // PUT /api/quizzes/{id} — Update: Implement Quiz Bank CRUD
  http.put("http://localhost:8080/api/quizzes/:id", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 801,
        "notebookId": 101,
        "subjectId": 12,
        "creatorId": 1,
        "title": "SWR302 Quiz Chapter 10",
        "description": "Quiz ôn tập SRS",
        "academicTermId": 3,
        "examType": "PRACTICE",
        "visibility": "PRIVATE",
        "marketStatus": "NONE",
        "downloadCount": 0,
        "reviewCount": 0,
        "acceptPercentage": 0,
        "createdAt": "2026-06-12T22:00:00"
      }
    },
    { status: 200 });
  }),

  // GET /api/quizzes/{quizId}/questions — Get/List: Implement Quiz Question and Option APIs
  http.get("http://localhost:8080/api/quizzes/:quizId/questions", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": [
        {
          "id": 811,
          "quizId": 801,
          "questionText": "Yêu cầu tốt cần có đặc điểm nào?",
          "questionType": "SINGLE_CHOICE",
          "explanation": "Yêu cầu nên rõ ràng, đầy đủ, nhất quán và kiểm thử được.",
          "options": [
            {
              "id": 821,
              "questionId": 811,
              "optionText": "Rõ ràng và kiểm thử được",
              "isCorrect": true
            },
            {
              "id": 822,
              "questionId": 811,
              "optionText": "Càng chung chung càng tốt",
              "isCorrect": false
            }
          ]
        }
      ]
    },
    { status: 200 });
  }),

  // POST /api/quizzes/{quizId}/questions — Create/Action: Implement Quiz Question and Option APIs
  http.post("http://localhost:8080/api/quizzes/:quizId/questions", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 811,
        "quizId": 801,
        "questionText": "Yêu cầu tốt cần có đặc điểm nào?",
        "questionType": "SINGLE_CHOICE",
        "explanation": "Yêu cầu nên rõ ràng, đầy đủ, nhất quán và kiểm thử được.",
        "options": [
          {
            "id": 821,
            "questionId": 811,
            "optionText": "Rõ ràng và kiểm thử được",
            "isCorrect": true
          },
          {
            "id": 822,
            "questionId": 811,
            "optionText": "Càng chung chung càng tốt",
            "isCorrect": false
          }
        ]
      }
    },
    { status: 200 });
  }),

  // POST /api/quizzes/{quizId}/tests — Create/Action: Implement Test start and answer APIs
  http.post("http://localhost:8080/api/quizzes/:quizId/tests", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 901,
        "quizId": 801,
        "userId": 1,
        "title": "Attempt 1 - SWR302 Quiz",
        "totalScore": 8.5,
        "duration": 30,
        "status": "IN_PROGRESS",
        "createdAt": "2026-06-12T22:05:00"
      }
    },
    { status: 200 });
  }),

  // GET /api/tests/{testId} — Get/List: Implement Test start and answer APIs
  http.get("http://localhost:8080/api/tests/:testId", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 901,
        "quizId": 801,
        "userId": 1,
        "title": "Attempt 1 - SWR302 Quiz",
        "totalScore": 8.5,
        "duration": 30,
        "status": "IN_PROGRESS",
        "createdAt": "2026-06-12T22:05:00"
      }
    },
    { status: 200 });
  }),

  // POST /api/tests/{testId}/answers — Create/Action: Implement Test start and answer APIs
  http.post("http://localhost:8080/api/tests/:testId/answers", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "testId": 901,
        "questionId": 811,
        "isCorrect": true,
        "answeredAt": "2026-06-12T22:07:00"
      }
    },
    { status: 200 });
  }),

  // GET /api/tests/{testId}/result — Get/List: Implement Submit Test and Result APIs
  http.get("http://localhost:8080/api/tests/:testId/result", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "testId": 901,
        "quizId": 801,
        "totalScore": 8.5,
        "correctAnswers": 17,
        "totalQuestions": 20,
        "status": "COMPLETED",
        "items": [
          {
            "questionId": 811,
            "isCorrect": true,
            "selectedOptionId": 821,
            "explanation": "Yêu cầu phải testable."
          }
        ]
      }
    },
    { status: 200 });
  }),

  // POST /api/tests/{testId}/submit — Create/Action: Implement Submit Test and Result APIs
  http.post("http://localhost:8080/api/tests/:testId/submit", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Test submitted successfully",
      "data": {
        "testId": 901,
        "quizId": 801,
        "totalScore": 8.5,
        "correctAnswers": 17,
        "totalQuestions": 20,
        "status": "COMPLETED",
        "items": [
          {
            "questionId": 811,
            "isCorrect": true,
            "selectedOptionId": 821,
            "explanation": "Yêu cầu phải testable."
          }
        ]
      }
    },
    { status: 200 });
  }),

  // ── Reward/Badge ──────────────────────────────────────────────

  // POST /api/admin/badges — Create/Action: Implement Badge and UserBadge APIs
  http.post("http://localhost:8080/api/admin/badges", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 1501,
        "name": "First Upload",
        "description": "Uploaded first approved content",
        "iconUrl": "/badges/first-upload.svg",
        "createdAt": "2026-06-12T22:35:00"
      }
    },
    { status: 200 });
  }),

  // GET /api/badges — Get/List: Implement Badge and UserBadge APIs
  http.get("http://localhost:8080/api/badges", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": [
        {
          "id": 1501,
          "name": "First Upload",
          "description": "Uploaded first approved content",
          "iconUrl": "/badges/first-upload.svg",
          "createdAt": "2026-06-12T22:35:00"
        }
      ]
    },
    { status: 200 });
  }),

  // ── System Config ──────────────────────────────────────────────

  // GET /api/admin/system-configs — Get/List: Implement System Config APIs for Admin
  http.get("http://localhost:8080/api/admin/system-configs", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": [
        {
          "id": 1801,
          "configKey": "MAX_UPLOAD_SIZE_MB",
          "configValue": "50",
          "description": "Dung lượng upload tối đa"
        }
      ]
    },
    { status: 200 });
  }),

  // POST /api/admin/system-configs — Create/Action: Implement System Config APIs for Admin
  http.post("http://localhost:8080/api/admin/system-configs", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 1801,
        "configKey": "MAX_UPLOAD_SIZE_MB",
        "configValue": "50",
        "description": "Dung lượng upload tối đa"
      }
    },
    { status: 200 });
  }),

  // DELETE /api/admin/system-configs/{id} — Delete: Implement System Config APIs for Admin
  http.delete("http://localhost:8080/api/admin/system-configs/:id", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Deleted successfully",
      "data": {
        "deleted": true
      }
    },
    { status: 200 });
  }),

  // PUT /api/admin/system-configs/{id} — Update: Implement System Config APIs for Admin
  http.put("http://localhost:8080/api/admin/system-configs/:id", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 1801,
        "configKey": "MAX_UPLOAD_SIZE_MB",
        "configValue": "50",
        "description": "Dung lượng upload tối đa"
      }
    },
    { status: 200 });
  }),

  // GET /api/system-configs/public — Get/List: Implement System Config APIs for Admin
  http.get("http://localhost:8080/api/system-configs/public", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": [
        {
          "id": 1801,
          "configKey": "MAX_UPLOAD_SIZE_MB",
          "configValue": "50",
          "description": "Dung lượng upload tối đa"
        }
      ]
    },
    { status: 200 });
  }),

  // ── System Feedback ──────────────────────────────────────────────

  // GET /api/admin/feedbacks — Get/List: Implement System Feedback APIs
  http.get("http://localhost:8080/api/admin/feedbacks", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "items": [
          {
            "id": 1701,
            "userId": 1,
            "title": "Upload bị chậm",
            "content": "Khi upload PDF lớn, hệ thống phản hồi chậm.",
            "screenUrl": "/documents/upload",
            "status": "OPEN",
            "createdAt": "2026-06-12T22:45:00"
          }
        ],
        "page": 0,
        "size": 10,
        "totalElements": 42,
        "totalPages": 5
      }
    },
    { status: 200 });
  }),

  // PATCH /api/admin/feedbacks/{id}/status — Partial update: Implement System Feedback APIs
  http.patch("http://localhost:8080/api/admin/feedbacks/:id/status", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 1701,
        "userId": 1,
        "title": "Upload bị chậm",
        "content": "Khi upload PDF lớn, hệ thống phản hồi chậm.",
        "screenUrl": "/documents/upload",
        "status": "OPEN",
        "createdAt": "2026-06-12T22:45:00"
      }
    },
    { status: 200 });
  }),

  // POST /api/feedbacks — Create/Action: Implement System Feedback APIs
  http.post("http://localhost:8080/api/feedbacks", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 1701,
        "userId": 1,
        "title": "Upload bị chậm",
        "content": "Khi upload PDF lớn, hệ thống phản hồi chậm.",
        "screenUrl": "/documents/upload",
        "status": "OPEN",
        "createdAt": "2026-06-12T22:45:00"
      }
    },
    { status: 200 });
  }),

  // ── System/Other ──────────────────────────────────────────────

  // PATCH /api/admin/content/{targetType}/{targetId}/hide — Partial update: Implement Report Moderation Actions
  http.patch("http://localhost:8080/api/admin/content/:targetType/:targetId/hide", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 1,
        "email": "student@fpt.edu.vn",
        "fullName": "Nguyen Van A",
        "avatarUrl": "https://cdn.example.com/avatar/a.png",
        "currentSemesterId": 3,
        "comboId": 2,
        "role": "STUDENT",
        "reputationPoints": 120,
        "isActive": true,
        "createdAt": "2026-06-12T21:30:00"
      }
    },
    { status: 200 });
  }),

  // PATCH /api/admin/content/{targetType}/{targetId}/restore — Partial update: Implement Report Moderation Actions
  http.patch("http://localhost:8080/api/admin/content/:targetType/:targetId/restore", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 1,
        "email": "student@fpt.edu.vn",
        "fullName": "Nguyen Van A",
        "avatarUrl": "https://cdn.example.com/avatar/a.png",
        "currentSemesterId": 3,
        "comboId": 2,
        "role": "STUDENT",
        "reputationPoints": 120,
        "isActive": true,
        "createdAt": "2026-06-12T21:30:00"
      }
    },
    { status: 200 });
  }),

  // ── User ──────────────────────────────────────────────

  // GET /api/admin/users — Get/List: Implement Admin User Management APIs
  http.get("http://localhost:8080/api/admin/users", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "items": [
          {
            "id": 1,
            "email": "student@fpt.edu.vn",
            "fullName": "Nguyen Van A",
            "avatarUrl": "https://cdn.example.com/avatar/a.png",
            "currentSemesterId": 3,
            "comboId": 2,
            "role": "STUDENT",
            "reputationPoints": 120,
            "isActive": true,
            "createdAt": "2026-06-12T21:30:00"
          }
        ],
        "page": 0,
        "size": 10,
        "totalElements": 42,
        "totalPages": 5
      }
    },
    { status: 200 });
  }),

  // GET /api/admin/users/{id} — Get/List: Implement Admin User Management APIs
  http.get("http://localhost:8080/api/admin/users/:id", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 1,
        "email": "student@fpt.edu.vn",
        "fullName": "Nguyen Van A",
        "avatarUrl": "https://cdn.example.com/avatar/a.png",
        "currentSemesterId": 3,
        "comboId": 2,
        "role": "STUDENT",
        "reputationPoints": 120,
        "isActive": true,
        "createdAt": "2026-06-12T21:30:00"
      }
    },
    { status: 200 });
  }),

  // PATCH /api/admin/users/{id}/active — Partial update: Implement Admin User Management APIs
  http.patch("http://localhost:8080/api/admin/users/:id/active", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 1,
        "email": "student@fpt.edu.vn",
        "fullName": "Nguyen Van A",
        "avatarUrl": "https://cdn.example.com/avatar/a.png",
        "currentSemesterId": 3,
        "comboId": 2,
        "role": "STUDENT",
        "reputationPoints": 120,
        "isActive": true,
        "createdAt": "2026-06-12T21:30:00"
      }
    },
    { status: 200 });
  }),

  // PATCH /api/admin/users/{id}/role — Partial update: Implement Admin User Management APIs
  http.patch("http://localhost:8080/api/admin/users/:id/role", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 1,
        "email": "student@fpt.edu.vn",
        "fullName": "Nguyen Van A",
        "avatarUrl": "https://cdn.example.com/avatar/a.png",
        "currentSemesterId": 3,
        "comboId": 2,
        "role": "STUDENT",
        "reputationPoints": 120,
        "isActive": true,
        "createdAt": "2026-06-12T21:30:00"
      }
    },
    { status: 200 });
  }),

  // GET /api/users/me — Get/List: Implement User profile APIs
  http.get("http://localhost:8080/api/users/me", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 1,
        "email": "student@fpt.edu.vn",
        "fullName": "Nguyen Van A",
        "avatarUrl": "https://cdn.example.com/avatar/a.png",
        "currentSemesterId": 3,
        "comboId": 2,
        "role": "STUDENT",
        "reputationPoints": 120,
        "isActive": true,
        "createdAt": "2026-06-12T21:30:00"
      }
    },
    { status: 200 });
  }),

  // PUT /api/users/me — Update: Implement User profile APIs
  http.put("http://localhost:8080/api/users/me", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 1,
        "email": "student@fpt.edu.vn",
        "fullName": "Nguyen Van A",
        "avatarUrl": "https://cdn.example.com/avatar/a.png",
        "currentSemesterId": 3,
        "comboId": 2,
        "role": "STUDENT",
        "reputationPoints": 120,
        "isActive": true,
        "createdAt": "2026-06-12T21:30:00"
      }
    },
    { status: 200 });
  }),

  // GET /api/users/me/activity-logs — Get/List: Implement Activity Log Service
  http.get("http://localhost:8080/api/users/me/activity-logs", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "items": [
          {
            "id": 2001,
            "actorId": 1,
            "action": "UPLOAD_DOCUMENT",
            "targetType": "DOCUMENT",
            "targetId": 501,
            "metadata": {
              "fileType": "pdf"
            },
            "createdAt": "2026-06-12T23:00:00"
          }
        ],
        "page": 0,
        "size": 10,
        "totalElements": 42,
        "totalPages": 5
      }
    },
    { status: 200 });
  }),

  // PATCH /api/users/me/change-password — Partial update: Implement User profile APIs
  http.patch("http://localhost:8080/api/users/me/change-password", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 1,
        "email": "student@fpt.edu.vn",
        "fullName": "Nguyen Van A",
        "avatarUrl": "https://cdn.example.com/avatar/a.png",
        "currentSemesterId": 3,
        "comboId": 2,
        "role": "STUDENT",
        "reputationPoints": 120,
        "isActive": true,
        "createdAt": "2026-06-12T21:30:00"
      }
    },
    { status: 200 });
  }),

  // GET /api/users/me/ai-usage — Get/List: Optional – Implement AI Usage Analytics
  http.get("http://localhost:8080/api/users/me/ai-usage", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "userId": 1,
        "period": "2026-06",
        "chatRequests": 32,
        "quizGenerations": 5,
        "flashcardGenerations": 3,
        "estimatedTokens": 18500
      }
    },
    { status: 200 });
  }),

  // POST /api/admin/users/{userId}/badges/{badgeId} — Create/Action: Implement Badge and UserBadge APIs
  http.post("http://localhost:8080/api/admin/users/:userId/badges/:badgeId", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "id": 1501,
        "name": "First Upload",
        "description": "Uploaded first approved content",
        "iconUrl": "/badges/first-upload.svg",
        "createdAt": "2026-06-12T22:35:00"
      }
    },
    { status: 200 });
  }),

  // GET /api/users/me/badges — Get/List: Implement Badge and UserBadge APIs
  http.get("http://localhost:8080/api/users/me/badges", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": [
        {
          "id": 1501,
          "name": "First Upload",
          "description": "Uploaded first approved content",
          "iconUrl": "/badges/first-upload.svg",
          "createdAt": "2026-06-12T22:35:00"
        }
      ]
    },
    { status: 200 });
  }),

  // GET /api/users/me/tests — Get/List: Implement Submit Test and Result APIs
  http.get("http://localhost:8080/api/users/me/tests", async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json(
    {
      "success": true,
      "message": "Success",
      "data": {
        "items": [
          {
            "id": 901,
            "quizId": 801,
            "userId": 1,
            "title": "Attempt 1 - SWR302 Quiz",
            "totalScore": 8.5,
            "duration": 30,
            "status": "IN_PROGRESS",
            "createdAt": "2026-06-12T22:05:00"
          }
        ],
        "page": 0,
        "size": 10,
        "totalElements": 42,
        "totalPages": 5
      }
    },
    { status: 200 });
  }),

];
