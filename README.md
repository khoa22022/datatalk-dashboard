# DataTalk Dashboard — V2 / GD01 / FULL

**2.0.0-rc.1 · full.1 — source đầy đủ đã gộp MVP và nâng cấp tài khoản/phân quyền.**

Không cần ghép bản vá. Upload NỘI DUNG thư mục này vào gốc repository frontend đang nối với project Vercel **`datatalk-dashboard-qli5`**. `package.json` phải nằm ở gốc repository, không lồng thêm thư mục. Bắt đầu ở nhánh `release/v2-gd01`, chưa đưa thẳng vào production.

## Bắt đầu

Đọc [Hướng dẫn upload](UPLOAD_GITHUB.md), rồi [Cấu hình triển khai](V2_DEPLOY.md). Database V2 và backend V2 phải được chuẩn bị đúng trước khi kiểm thử tài khoản thật.

## Cấu hình

Runtime Node 22. Cấu hình Vercel: Next.js; Install Command `npm install`; Build Command `npm run build`. Nhập các biến trong `.env.example` vào Vercel. Chỉ dùng publishable/anon key ở frontend; tuyệt đối không dùng service role hoặc Google Client Secret.

Sau khi cài được dependencies, chạy `npm test`, `npm run check:syntax`, `npm run typecheck`, `npm run build`. Gói không chứa `node_modules`, build cache hoặc lockfile giả; phiên bản dependency giữ nguyên từ bản RC trước.

## Thiết kế và dữ liệu

Giữ flow tạo dự án và các thành phần của source V2. Các file font nhị phân không được đóng kèm; CSS dùng Poppins nếu có trên máy hoặc font hệ thống dự phòng, không tải file font bị thiếu. Đây chưa phải bản typography đã duyệt theo Figma.

## Trạng thái

Đã chạy lại 18 test đạt; parse 59 file TypeScript/TSX và kiểm tra import nội bộ không có lỗi. **Chưa chạy Next build, kiểm tra kiểu đầy đủ hoặc thử đăng nhập trên trình duyệt.** Xem [Báo cáo](PACKAGING_REPORT.md), [Thay đổi](RELEASE_NOTES.md).

Các tính năng Google, email xác nhận và khôi phục mật khẩu vẫn cần cấu hình dịch vụ trong Supabase. Upload Git không tự cấu hình những dịch vụ này.