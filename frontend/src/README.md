1. Thêm toàn bộ thay đổi vào Staging Area
Lệnh này sẽ gom tất cả các file chỉnh sửa, file xóa và cả các file mới tinh (Untracked) vào danh sách chuẩn bị commit:

Bash
git add .
(Nếu muốn kiểm tra lại chắc chắn, ông có thể gõ lại git status, lúc này các file sẽ chuyển sang màu xanh lá cây).

2. Tạo Commit cho các thay đổi
Đóng gói đống thay đổi này lại kèm theo một tin nhắn ngắn gọn ghi nhớ những gì ông vừa làm (ví dụ vừa nâng cấp Dashboard và sửa trang Login):

Bash
git commit -m "feat: upgrade dashboard UI and refactor login components"
3. Đẩy code lên Remote Repository (GitHub/GitLab)
Giờ thì push thoải mái lên branch ông đang đứng:

Bash
git push origin feature/front-end
💡 Mẹo nhỏ: Nếu đây là lần đầu tiên ông đẩy branch feature/front-end này lên server, hãy thêm tham số -u để Git nhớ nhánh đồng bộ cho các lần sau:

Bash
git push -u origin feature/front-end

npm run dev -- --host 