# Release notes — DataTalk V2 GD01

**Ứng dụng 2.0.0-rc.1 · Gói source đầy đủ full.1 · 19/09/2026**

## Phạm vi giai đoạn 01

Đăng ký/đăng nhập email và Google, xác nhận email, khôi phục mật khẩu, workspace riêng, lựa chọn workspace/dự án, quản lý lời mời/thành viên, Owner/Admin/Editor/Viewer và Super Admin quản trị tài khoản.

Tài khoản dự kiến cấp Super Admin: `khoa3815@gmail.com`. SQL yêu cầu UUID `1bc0d1b0-4de3-4243-964a-cf49aafee38c`, email khớp và đã xác nhận. Chưa chạy SQL này trên database thật.

Phân quyền toàn hệ thống và workspace tách riêng. Super Admin không tự động được đọc dữ liệu khách hàng; chỉ quản trị tài khoản và nhật ký theo phạm vi đã triển khai. Giữ flow tạo dự án: chọn nền tảng → thông tin/mục tiêu → kết nối tracking.

## Khác gói Upgrade trước

Đã gộp sẵn source MVP và các file nâng cấp. Không cần gói Upgrade, không cần script Python, không có yêu cầu tự copy từng bản vá. Có một thư mục hoàn chỉnh cho backend và một cho frontend. SQL cập nhật database giữ nguyên, có bản sao tiện sử dụng trong `database-setup` của bundle.

Không đóng gói lại file font; giao diện dùng font local hoặc fallback hệ thống. Chưa đối chiếu typography theo Figma. Các tài liệu MVP cũ chỉ giữ để tham khảo và được đánh dấu không dùng làm hướng dẫn triển khai V2.

## Chưa thuộc giai đoạn này

AI vẫn theo quy tắc; chưa tích hợp mô hình. Lời mời workspace hiện ở trong ứng dụng, chưa gửi email tự động. Chưa hoàn thiện heatmap overlay, session replay, funnels thực tế, SDK mobile native, chuyển Owner, cấp thêm Super Admin qua UI hay quyền tùy chỉnh. Còn các bước build, migration, Google/email/browser và kiểm thử bảo mật thực tế trước production.

## Cách dùng

Xem `BAT_DAU.md` ở bundle, hoặc `UPLOAD_GITHUB.md` ở từng repository. Giữ nhánh production đang chạy; upload bản này lên nhánh thử trước. Các gói GD02/GD03 chỉ được tạo khi các phần phát triển tương ứng thực sự hoàn tất.