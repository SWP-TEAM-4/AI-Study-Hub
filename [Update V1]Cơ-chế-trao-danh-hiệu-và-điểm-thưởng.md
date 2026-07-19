# Cơ chế trao danh hiệu và phần thưởng

Ngày phân tích: 19/07/2026  
Phạm vi: backend hiện tại trong workspace `AI-Study-Hub`, bao gồm phần mở rộng BE-052 về leaderboard, referral, reputation và badge tự động.

## 1. Tóm tắt hiện trạng

Project đang có 4 khái niệm dễ bị nhầm:

| Khái niệm | Ý nghĩa | Có tự động trao không? | Ghi chú |
|---|---|---:|---|
| `Role` trong bảng `users` | Vai trò hệ thống như `STUDENT`, `REVIEWER`, `ADMIN` | Không | Dùng cho phân quyền tổng quát. |
| `community_roles` | Quyền cộng đồng theo phạm vi, ví dụ reviewer theo môn/nội dung | Không | Admin cấp/thu hồi, phục vụ quyền duyệt marketplace. |
| `badges` | Danh mục huy hiệu/danh hiệu | Có thể tự tạo hoặc seed sẵn | Admin có thể tạo badge; BE-052 seed một số badge mặc định. |
| `user_badges` | Huy hiệu đã được gán cho user | Có | Gán thủ công bởi admin hoặc tự động bởi `RewardBadgeService`. |

Cơ chế tự động hiện có tập trung ở các nhóm:

1. Contributor leaderboard: dựa trên `reputationPoints`, số download, số lượt duyệt, tỷ lệ accept và số nội dung marketplace đã approve.
2. Referral: người dùng nhập mã giới thiệu hợp lệ sẽ cộng reputation cho cả hai bên theo config.
3. Reviewer marketplace: reviewer đạt đủ số phiếu duyệt marketplace sẽ nhận badge.
4. Reputation milestone: user đạt mốc reputation cấu hình sẽ nhận badge.

Điểm quan trọng: các mốc như top 10, +20 reputation, 50 downloads, 10 reviews không hardcode trong nghiệp vụ chính; chúng được lấy từ `system_configs` và có seed mặc định ở migration.

## 2. Cấu trúc dữ liệu liên quan

### 2.1. Badge

Bảng/entity: `badges` / `Badge`

Các trường chính:

| Trường | Ý nghĩa |
|---|---|
| `id` | ID badge |
| `name` | Tên badge, ví dụ `Top Contributor` |
| `description` | Mô tả |
| `iconUrl` | Đường dẫn icon |
| `createdAt` | Thời điểm tạo |

Badge có thể được tạo thủ công bởi admin qua API:

- `POST /api/admin/badges`
- Service: `BadgeService.createBadge`

### 2.2. UserBadge

Bảng/entity: `user_badges` / `UserBadge`

Các trường chính:

| Trường | Ý nghĩa |
|---|---|
| `id` | ID bản ghi trao badge |
| `user_id` | User nhận badge |
| `badge_id` | Badge được nhận |
| `earned_at` | Thời điểm nhận |

Ràng buộc quan trọng:

- Unique theo cặp `(user_id, badge_id)`.
- Một user không thể nhận trùng cùng một badge.
- Nếu admin hoặc job tự động gán trùng, backend chặn bằng `existsByUser_IdAndBadge_Id` và/hoặc bắt lỗi unique constraint.

API xem/gán badge:

- `GET /api/badges`: xem tất cả badge.
- `GET /api/users/me/badges`: xem badge của user hiện tại.
- `POST /api/admin/users/{userId}/badges/{badgeId}`: admin gán badge thủ công.

### 2.3. Reputation

Điểm reputation nằm trên entity `User`, trường `reputationPoints`.

Hiện tại reputation được dùng để:

- Xếp hạng contributor leaderboard.
- Kiểm tra badge `Reputation Milestone`.
- Cộng điểm referral cho người nhập mã và chủ mã giới thiệu.

Lưu ý hiện trạng:

- Config `BASE_REPUTATION_PER_UPLOAD` đã có seed mặc định `10`, mô tả là điểm cho approved upload.
- Tuy nhiên trong code hiện tại chưa thấy luồng upload/approve document/quiz/flashcard tự động cộng reputation bằng config này.
- Vì vậy tài liệu này chỉ ghi nhận reputation tự động chắc chắn đang chạy ở referral.

### 2.4. Referral

Bảng/entity: `referrals` / `Referral`

Các trường chính:

| Trường | Ý nghĩa |
|---|---|
| `owner_user_id` | Chủ mã referral |
| `code` | Mã giới thiệu duy nhất |
| `applied_referral_id` | Mã đã được user hiện tại áp dụng |
| `applied_by_user_id` | User đã áp dụng mã |
| `status` | `ACTIVE` hoặc `APPLIED` |
| `reward_points` | Số reputation đã cộng tại thời điểm áp dụng |
| `applied_at` | Thời điểm áp dụng mã |

API:

- `GET /api/referrals/me`: lấy hoặc tạo referral code của user hiện tại.
- `POST /api/referrals/apply`: áp dụng referral code của người khác.

## 3. Config có thể chỉnh bởi admin

Các mốc thưởng và điểm thưởng hiện được lưu trong `system_configs`.

| Config key | Seed mặc định | Ý nghĩa nghiệp vụ |
|---|---:|---|
| `BASE_REPUTATION_PER_UPLOAD` | `10` | Điểm reputation cho approved upload, hiện có seed nhưng chưa thấy code cộng tự động. |
| `GROWTH_REFERRAL_REWARD_POINTS` | `20` | Số reputation cộng cho cả người nhập mã và chủ mã referral khi áp dụng mã thành công. |
| `GROWTH_TOP_CONTRIBUTOR_LIMIT` | `10` | Top N user trên contributor leaderboard được nhận badge `Top Contributor`. |
| `GROWTH_REFERRAL_AMBASSADOR_INVITES` | `5` | Số lượt giới thiệu thành công để chủ mã nhận badge `Referral Ambassador`. |
| `REWARD_MARKETPLACE_CONTRIBUTOR_APPROVED_CONTENTS` | `3` | Số nội dung marketplace đã approve để nhận badge `Marketplace Contributor`. |
| `REWARD_POPULAR_CREATOR_DOWNLOADS` | `50` | Tổng download marketplace để nhận badge `Popular Creator`. |
| `REWARD_TOP_REVIEWER_REVIEWS` | `10` | Số phiếu duyệt marketplace hoàn thành để nhận badge `Top Reviewer`. |
| `REWARD_REPUTATION_MILESTONE_POINTS` | `100` | Mốc reputation để nhận badge `Reputation Milestone`. |

Validation hiện có:

- Các config nhóm Growth/Reward phải là số nguyên không âm.
- `GROWTH_REFERRAL_REWARD_POINTS` được đọc bằng `getRequiredIntValue`, nếu thiếu hoặc không hợp lệ thì nghiệp vụ referral sẽ lỗi.
- Các threshold badge tự động được đọc bằng `getIntValueOrDefault`, nếu config thiếu thì fallback về default trong code.

## 4. Danh sách badge tự động hiện có

Các badge dưới đây được seed ở migration BE-052 và cũng có thể được `RewardBadgeService` tạo tự động nếu thiếu trong bảng `badges`.

| Badge | Người nhận | Điều kiện trao | Thời điểm kiểm tra |
|---|---|---|---|
| `Top Contributor` | User contributor | Rank trên leaderboard `<= GROWTH_TOP_CONTRIBUTOR_LIMIT` | Khi gọi contributor leaderboard. |
| `First Approved Content` | Chủ nội dung | Có ít nhất 1 document/quiz/flashcard approved trên marketplace | Khi gọi contributor leaderboard. |
| `Marketplace Contributor` | Chủ nội dung | Tổng approved marketplace content `>= REWARD_MARKETPLACE_CONTRIBUTOR_APPROVED_CONTENTS` | Khi gọi contributor leaderboard. |
| `Popular Creator` | Chủ nội dung | Tổng download marketplace `>= REWARD_POPULAR_CREATOR_DOWNLOADS` | Khi gọi contributor leaderboard. |
| `Top Reviewer` | Reviewer | Tổng số marketplace review có `voteResult != null` `>= REWARD_TOP_REVIEWER_REVIEWS` | Ngay sau khi reviewer vote document/quiz/flashcard. |
| `Referral Starter` | Người nhập mã referral | Áp dụng referral code hợp lệ của người khác thành công | Ngay khi apply referral thành công. |
| `Referral Ambassador` | Chủ mã referral | Có số invite thành công `>= GROWTH_REFERRAL_AMBASSADOR_INVITES` | Ngay khi một user apply mã của họ thành công. |
| `Reputation Milestone` | User bất kỳ trong các flow được kiểm tra | `reputationPoints >= REWARD_REPUTATION_MILESTONE_POINTS` | Sau referral, sau reviewer vote, hoặc khi gọi leaderboard. |

Nguyên tắc chung:

- Badge được trao theo kiểu "đạt một lần, giữ mãi".
- Hiện chưa có cơ chế thu hồi badge nếu user rớt khỏi top N hoặc không còn đạt điều kiện.
- Không có bảng rule động cho từng badge; tên badge tự động đang được định nghĩa trong `RewardBadgeService`, còn threshold lấy từ `system_configs`.

## 5. Contributor leaderboard

API: `GET /api/community/leaderboard/contributors`

Service: `ContributorLeaderboardService.getContributorLeaderboard`

### 5.1. Ai được vào leaderboard?

Leaderboard lấy danh sách:

- User đang active.
- User không có role hệ thống `ADMIN`.
- User có ít nhất một trong hai điều kiện:
  - Có approved marketplace content.
  - Hoặc có `reputationPoints > 0`.

Vì admin bị loại khỏi leaderboard, admin không nhận `Top Contributor` qua cơ chế này, kể cả khi tài khoản admin có nội dung hoặc reputation.

### 5.2. Dữ liệu được cộng vào leaderboard

Leaderboard tổng hợp từ 3 loại tài nguyên:

| Loại tài nguyên | Owner được tính | Điều kiện được tính |
|---|---|---|
| Document | `document.user` | `visibility = MARKETPLACE` và `marketStatus = APPROVED` |
| Quiz | `quiz.creator` | `visibility = MARKETPLACE` và `marketStatus = APPROVED` |
| Flashcard deck | `flashcardDeck.user` | `visibility = MARKETPLACE` và `marketStatus = APPROVED` |

Các chỉ số được cộng:

- `approvedContents`: tổng số nội dung đã approve trên marketplace.
- `downloadCount`: tổng download của nội dung approved marketplace.
- `reviewCount`: tổng số phiếu duyệt marketplace đã ghi trên nội dung.
- `acceptPercentage`: trung bình tỷ lệ approve của các nội dung đã approve.
- `reputationPoints`: lấy từ user.

### 5.3. Thứ tự xếp hạng

Comparator hiện tại xếp theo thứ tự:

1. `reputationPoints` giảm dần.
2. `totalDownloads` giảm dần.
3. `totalReviewCount` giảm dần.
4. `averageAcceptPercentage` giảm dần.
5. `approvedContents` giảm dần.
6. `userId` tăng dần.

Sau khi build danh sách rank đầy đủ, service gọi `RewardBadgeService.awardContributorBadges(rankedItems)`.

Điều này có nghĩa:

- Badge contributor không được trao ngay lúc nội dung vừa approved.
- Badge được trao khi leaderboard được truy cập/tính lại.
- Hệ thống trao badge trên toàn bộ danh sách đã rank, không chỉ page hiện tại.

## 6. Nghiệp vụ user upload/create document, quiz, flashcard

### 6.1. Document upload/create

Luồng chính:

1. User upload file document qua `DocumentUploadService.uploadDocument`.
2. Backend validate file, subject, user.
3. Tạo `Document` với trạng thái ban đầu:
   - `visibility = PRIVATE`.
   - `marketStatus = NONE`.
   - `downloadCount = 0`.
   - `reviewCount = 0`.
   - `acceptPercentage = 0`.
   - `processingStatus = PENDING` hoặc trạng thái xử lý tương ứng.
4. Ghi activity log upload.

Cơ chế danh hiệu/reputation:

- Không trao badge ngay khi upload.
- Không cộng reputation ngay khi upload.
- Không tự động đưa vào leaderboard vì chưa phải approved marketplace content.

### 6.2. Quiz create

Luồng chính:

1. User tạo quiz qua `QuizService.createQuiz`.
2. Quiz thuộc owner/creator hiện tại.
3. Trạng thái ban đầu thường là private hoặc theo request, `marketStatus = NONE`, các chỉ số review/download reset về 0.

Cơ chế danh hiệu/reputation:

- Không trao badge ngay khi tạo quiz.
- Không cộng reputation ngay khi tạo quiz.
- Chỉ được tính vào contributor leaderboard sau khi submit marketplace và được approve.

### 6.3. Flashcard deck create

Luồng chính:

1. User tạo deck qua `FlashcardService.createDeck`.
2. Deck thuộc user hiện tại.
3. Trạng thái ban đầu tương tự: private/none, download/review reset về 0.

Cơ chế danh hiệu/reputation:

- Không trao badge ngay khi tạo flashcard deck.
- Không cộng reputation ngay khi tạo flashcard deck.
- Chỉ được tính vào contributor leaderboard sau khi submit marketplace và được approve.

## 7. Nghiệp vụ submit marketplace

Service: `MarketPlaceService`

User có thể submit:

- Document: `submitDocument`
- Quiz: `submitQuiz`
- Flashcard deck: `submitFlashcardDeck`

Điều kiện chung:

- User phải là owner của tài nguyên.
- Không cho publish lại nội dung clone từ marketplace.
- Tài nguyên phải đủ metadata bắt buộc.
- Tạo marketplace submission.
- Set trạng thái:
  - `visibility = MARKETPLACE`
  - `marketStatus = PENDING`

Điều kiện metadata đáng chú ý:

| Loại | Điều kiện chính |
|---|---|
| Document | Có subject, title, description, fileUrl, xử lý file thành công. |
| Quiz | Có subject, title, description, examType, có ít nhất 1 câu hỏi. |
| Flashcard deck | Có subject, title, có ít nhất 1 flashcard. |

Cơ chế danh hiệu/reputation:

- Không trao badge khi submit.
- Không cộng reputation khi submit.
- Chỉ khi nội dung được approve thì mới có thể đóng góp vào leaderboard và các badge contributor.

## 8. Nghiệp vụ reviewer đánh giá marketplace

Service: `MarketReviewService.vote`

Reviewer có thể vote:

- `DOCUMENT`
- `QUIZ`
- `FLASHCARD_DECK`

Điều kiện reviewer:

- Phải có quyền reviewer phù hợp theo `CommunityPermissionService`.
- Quyền này đến từ cơ chế `community_roles` do admin cấp.
- Reviewer không được vote nội dung của chính mình.
- Mỗi reviewer chỉ được vote một lần cho cùng một submission.
- Nội dung phải đang `marketStatus = PENDING`.

Khi reviewer vote:

1. Lưu `MarketReview` với `voteResult = APPROVED` hoặc `REJECTED`.
2. Tính lại:
   - `reviewCount`: số review có `voteResult != null`.
   - `acceptPercentage`: số phiếu approve / tổng phiếu * 100.
3. Gọi review policy để quyết định auto approve/reject khi đủ ngưỡng.
4. Nếu approved:
   - `marketStatus = APPROVED`.
   - `visibility = MARKETPLACE`.
   - Notify author.
5. Nếu rejected:
   - `marketStatus = REJECTED`.
   - `visibility = PRIVATE`.
   - Notify author.
6. Ghi activity log.
7. Gọi `RewardBadgeService.awardReviewerBadges(reviewer)`.

Badge cho reviewer:

| Badge | Điều kiện |
|---|---|
| `Top Reviewer` | Tổng số marketplace review có `voteResult != null` đạt `REWARD_TOP_REVIEWER_REVIEWS`. |
| `Reputation Milestone` | Nếu reviewer đã có reputation đạt `REWARD_REPUTATION_MILESTONE_POINTS`. |

Lưu ý:

- Hiện chưa thấy code cộng reputation cho reviewer sau mỗi review.
- `Top Reviewer` dựa trên số phiếu duyệt marketplace hoàn thành, không dựa trên review cộng đồng/rating sao.

## 9. Nghiệp vụ admin duyệt marketplace

Service: `MarketReviewService.adminApprove` và `MarketReviewService.adminReject`

Admin có thể override:

- Approve trực tiếp document/quiz/flashcard deck đang pending.
- Reject trực tiếp document/quiz/flashcard deck đang pending.

Khi admin approve:

- Set `marketStatus = APPROVED`.
- Set `visibility = MARKETPLACE`.
- Lưu một `MarketReview` dạng admin review với `voteResult = APPROVED`.
- Notify author.
- Ghi activity log.

Khi admin reject:

- Set `marketStatus = REJECTED`.
- Set `visibility = PRIVATE`.
- Lưu một `MarketReview` dạng admin review với `voteResult = REJECTED`.
- Notify author.
- Ghi activity log.

Cơ chế danh hiệu/reputation cho admin:

- Hiện không có badge tự động riêng cho admin.
- Admin override không gọi `awardReviewerBadges`.
- Admin role bị loại khỏi contributor leaderboard.
- Admin chỉ có thể nhận badge nếu được gán thủ công hoặc nếu code khác gọi `RewardBadgeService` cho user admin trong tương lai.

## 10. Nghiệp vụ tài liệu được download / được nhiều người dùng

### 10.1. Clone từ marketplace

Service: `MarketplaceCloneService`

Khi user clone tài nguyên marketplace đã approved:

- Tạo bản copy private cho user clone.
- Bản copy reset `downloadCount`, `reviewCount`, `acceptPercentage`.
- Tài nguyên gốc trên marketplace tăng `downloadCount` thêm 1.

Áp dụng cho:

- Document
- Quiz
- Flashcard deck

Tác động badge:

- `downloadCount` của nội dung gốc được cộng vào contributor leaderboard.
- Chủ nội dung có thể nhận `Popular Creator` nếu tổng download approved marketplace đạt `REWARD_POPULAR_CREATOR_DOWNLOADS`.
- Badge này cũng chỉ được kiểm tra khi contributor leaderboard chạy.

### 10.2. Download qua public document share link

Service: `DocumentShareLinkService`

Khi download shared document:

- `accessCount` của share link tăng 1.
- Nếu là download, `document.downloadCount` tăng 1.

Tác động badge:

- Leaderboard chỉ tổng hợp document có `visibility = MARKETPLACE` và `marketStatus = APPROVED`.
- Vì vậy download qua share link chỉ ảnh hưởng contributor leaderboard nếu document đó cũng đang là approved marketplace document.

## 11. Nghiệp vụ tài liệu được đánh giá cao

Project hiện có hai kiểu "review/đánh giá" khác nhau:

| Loại đánh giá | Service | Mục đích | Có tác động badge hiện tại? |
|---|---|---|---|
| Marketplace review/vote | `MarketReviewService` | Reviewer duyệt nội dung pending bằng APPROVED/REJECTED | Có, cho reviewer qua `Top Reviewer`; cho owner gián tiếp qua leaderboard. |
| Community review/rating/comment | `CommunityReviewService` | User đánh giá nội dung bằng rating/comment cộng đồng | Chưa có rule badge tự động. |

### 11.1. Marketplace accept percentage

Khi reviewer vote marketplace, hệ thống cập nhật:

- `reviewCount`
- `acceptPercentage`

Các chỉ số này được dùng trong contributor leaderboard:

- `reviewCount` là tiêu chí tie-break thứ 3.
- `acceptPercentage` là tiêu chí tie-break thứ 4.

Điều này nghĩa là tài liệu được reviewer đánh giá tốt có thể giúp owner xếp hạng cao hơn khi các tiêu chí trước đó bằng nhau.

Hiện chưa có badge riêng kiểu:

- `Highly Rated Creator`
- `High Quality Content`
- `Trusted Author`

Nếu muốn có badge cho tài liệu được đánh giá cao, cần bổ sung rule dựa trên `acceptPercentage`, số review tối thiểu, hoặc rating cộng đồng.

### 11.2. Community rating/comment

`CommunityReviewService` tạo review cộng đồng bằng cách lưu `MarketReview` với `voteResult = null`.

Hiện trạng:

- User có thể tạo/sửa/xóa review cộng đồng.
- Có chống duplicate review theo user/resource.
- Review cộng đồng không được tính là marketplace vote.
- Review cộng đồng không làm tăng điều kiện `Top Reviewer`.
- Review cộng đồng chưa tạo badge cho người viết review.
- Review cộng đồng chưa tạo badge cho owner tài nguyên được rating cao.

## 12. Nghiệp vụ referral

Service: `ReferralService`

### 12.1. Lấy mã referral

Khi user gọi `GET /api/referrals/me`:

- Nếu user chưa có referral row, hệ thống tạo mã mới.
- Mã được build từ tên/email của user và userId.
- Mã là duy nhất.
- Trạng thái ban đầu là `ACTIVE`.

Không có badge/reputation khi chỉ lấy mã.

### 12.2. Áp dụng mã referral

Khi user gọi `POST /api/referrals/apply`:

Điều kiện:

- User hiện tại active.
- User hiện tại chưa từng apply referral thành công.
- Referral code tồn tại.
- Không được apply mã của chính mình.

Khi apply thành công:

1. Referral của user hiện tại chuyển sang `APPLIED`.
2. Ghi mã đã apply vào `appliedReferral`.
3. Ghi `appliedAt`.
4. Đọc `GROWTH_REFERRAL_REWARD_POINTS` từ `system_configs`.
5. Cộng reputation cho người apply mã.
6. Cộng reputation cho chủ mã referral.
7. Gọi `RewardBadgeService.awardReferralBadges(invitee, inviter)`.

Badge/referral được trao:

| Người nhận | Badge | Điều kiện |
|---|---|---|
| Người apply mã | `Referral Starter` | Apply mã referral hợp lệ thành công. |
| Chủ mã referral | `Referral Ambassador` | Tổng số user apply mã của họ đạt `GROWTH_REFERRAL_AMBASSADOR_INVITES`. |
| Cả hai bên | `Reputation Milestone` | Sau khi cộng điểm, reputation đạt `REWARD_REPUTATION_MILESTONE_POINTS`. |

Điểm reputation:

- Seed mặc định là `20`.
- Đây là giá trị config `GROWTH_REFERRAL_REWARD_POINTS`, không phải hardcode trong service.
- Admin có thể chỉnh trong bảng/config admin tương ứng.

## 13. Nghiệp vụ admin quản lý danh hiệu và quyền reviewer

### 13.1. Admin quản lý badge

Admin có thể:

- Tạo badge mới.
- Gán badge bất kỳ cho user.

Đây là cơ chế thủ công, độc lập với `RewardBadgeService`.

Ví dụ nghiệp vụ phù hợp:

- Admin tạo badge sự kiện.
- Admin trao badge đặc biệt cho user.
- Admin sửa dữ liệu badge trực tiếp trong database nếu cần seed/icon khác.

### 13.2. Admin quản lý community role

API: `/api/admin/community-roles`

Admin có thể:

- Cấp community role.
- Xem danh sách community role.
- Thu hồi community role.

Community role dùng để cấp quyền, không phải danh hiệu.

Ví dụ:

- Cấp quyền reviewer theo toàn hệ thống hoặc theo scope.
- Thu hồi quyền reviewer khi hết hạn hoặc vi phạm.

Cơ chế này có notification và activity log, nhưng không tự động tạo badge.

## 14. Matrix trao thưởng theo hành động

| Hành động | Actor | Tài nguyên | Trạng thái/kết quả | Badge/reputation hiện tại |
|---|---|---|---|---|
| Upload document | User/Admin | Document | Private, market none/pending processing | Không badge, không reputation. |
| Create quiz | User/Admin | Quiz | Private hoặc visibility theo request, market none | Không badge, không reputation. |
| Create flashcard deck | User/Admin | Flashcard | Private hoặc visibility theo request, market none | Không badge, không reputation. |
| Submit marketplace | Owner | Document/Quiz/Flashcard | `PENDING` | Không badge, không reputation. |
| Reviewer vote approve/reject | Reviewer | Document/Quiz/Flashcard | Cập nhật `reviewCount`, `acceptPercentage`; có thể auto approve/reject | Có thể trao `Top Reviewer`, `Reputation Milestone`. |
| Admin approve/reject | Admin | Document/Quiz/Flashcard | Override `APPROVED`/`REJECTED` | Không badge tự động cho admin. |
| Content được approve | Owner | Document/Quiz/Flashcard | `APPROVED`, `MARKETPLACE` | Owner có thể nhận `First Approved Content`, `Marketplace Contributor`, `Top Contributor`, `Popular Creator`, `Reputation Milestone` khi leaderboard chạy. |
| Clone marketplace content | User clone | Document/Quiz/Flashcard | Tạo private copy, tăng download gốc | Owner có thể tiến tới `Popular Creator` khi leaderboard chạy. |
| Download shared document | Public/user | Document | Tăng `accessCount`, có thể tăng `downloadCount` document | Chỉ ảnh hưởng leaderboard nếu document là approved marketplace. |
| Community review/rating/comment | User | Document/Quiz/Flashcard | Lưu review cộng đồng | Chưa có badge/reputation tự động. |
| Apply referral code | User | Referral | Thành công | Cộng reputation cho cả hai bên; trao `Referral Starter`, có thể `Referral Ambassador`, `Reputation Milestone`. |
| Admin gán badge thủ công | Admin | User/Badge | Tạo `user_badges` | User nhận badge ngay. |

## 15. Điểm còn thiếu hoặc cần quyết định thêm nếu muốn hoàn thiện sâu hơn

Các điểm dưới đây là khoảng trống của cơ chế hiện tại, không phải lỗi runtime bắt buộc:

1. Chưa tự động cộng reputation khi document/quiz/flashcard được approve, dù đã có config `BASE_REPUTATION_PER_UPLOAD`.
2. Badge contributor được trao khi leaderboard được gọi, không phải ngay tại thời điểm approve/download.
3. Chưa có badge riêng cho nội dung được đánh giá cao dựa trên `acceptPercentage` hoặc rating cộng đồng.
4. Chưa có badge/reputation cho người viết community review/rating/comment.
5. Admin chưa có badge tự động cho các nghiệp vụ moderation/approval.
6. Chưa có rule engine động trong database cho điều kiện badge; hiện mới có bảng `badges` để lưu danh mục badge, còn điều kiện trao nằm trong code và threshold nằm trong `system_configs`.
7. Badge không bị thu hồi khi điều kiện không còn đúng, ví dụ user từng top 10 nhưng sau đó tụt rank.
8. Tự động trao badge hiện chỉ log bằng application log, chưa thấy activity log/notification riêng cho sự kiện nhận badge.

## 16. Gợi ý nghiệp vụ nếu muốn mở rộng tiếp

Nếu product muốn cơ chế danh hiệu đầy đủ hơn, có thể bổ sung:

| Nhu cầu | Hướng triển khai đề xuất |
|---|---|
| Cộng reputation khi approved upload | Dùng `BASE_REPUTATION_PER_UPLOAD` trong điểm approve cuối cùng của marketplace, cộng cho owner một lần theo submission/resource. |
| Badge nội dung chất lượng cao | Thêm rule `acceptPercentage >= X` và `reviewCount >= Y` cho owner. |
| Badge review cộng đồng | Đếm review cộng đồng có `voteResult = null`, trao badge cho user viết review khi đạt mốc. |
| Badge admin/moderator | Đếm số lượt approve/reject admin hoặc số role đã cấp hợp lệ, trao badge moderation. |
| Rule badge chỉnh hoàn toàn trong admin | Tạo bảng `badge_rules` gồm badge, metric, operator, threshold, trigger và scope. |
| Trao badge real-time hơn | Gọi `RewardBadgeService` ngay sau approve/download/community review thay vì phụ thuộc leaderboard endpoint. |
| Thông báo nhận badge | Tích hợp `NotificationService` và `ActivityLogService` trong `awardBadgeIfMissing`. |

## 17. File code tham chiếu chính

| Nhóm | File |
|---|---|
| Badge entity | `backend/src/main/java/com/aistudyhub/entity/Badge.java` |
| UserBadge entity | `backend/src/main/java/com/aistudyhub/entity/UserBadge.java` |
| Badge service/admin manual assign | `backend/src/main/java/com/aistudyhub/module/badge/service/BadgeService.java` |
| Badge controller | `backend/src/main/java/com/aistudyhub/module/badge/controller/BadgeController.java` |
| Admin badge controller | `backend/src/main/java/com/aistudyhub/module/badge/controller/AdminBadgeController.java` |
| Auto badge engine | `backend/src/main/java/com/aistudyhub/module/community/service/RewardBadgeService.java` |
| Contributor leaderboard | `backend/src/main/java/com/aistudyhub/module/community/service/ContributorLeaderboardService.java` |
| Referral service | `backend/src/main/java/com/aistudyhub/module/community/service/ReferralService.java` |
| Referral controller | `backend/src/main/java/com/aistudyhub/module/community/controller/ReferralController.java` |
| Marketplace submit | `backend/src/main/java/com/aistudyhub/module/marketplace/service/MarketPlaceService.java` |
| Marketplace review/admin approval | `backend/src/main/java/com/aistudyhub/module/marketplace/service/MarketReviewService.java` |
| Marketplace clone/download count | `backend/src/main/java/com/aistudyhub/module/marketplace/service/MarketplaceCloneService.java` |
| Community review/rating | `backend/src/main/java/com/aistudyhub/module/community/service/CommunityReviewService.java` |
| Community role | `backend/src/main/java/com/aistudyhub/module/community/service/CommunityRoleService.java` |
| System config keys | `backend/src/main/java/com/aistudyhub/module/systemconfig/SystemConfigKeys.java` |
| Referral/config/badge seed | `backend/src/main/resources/db/migration/V20__create_referrals.sql` |
| Base system config seed | `backend/src/main/resources/db/migration/V2__seed_data.sql` |

