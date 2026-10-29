# DataTalk V2 — Giai đoạn 01: Tài khoản và phân quyền

**Bản giao: 2.0.0-rc.1 / full.1 · Ngày đóng gói: 19/09/2026**

Đây là **source đầy đủ đã gộp MVP + bản nâng cấp V2**. Bạn không phải ghép bản vá, chạy Python hoặc dùng gói Upgrade cũ. Chưa phải bản đã kiểm chứng production; chưa có thay đổi nào được đưa lên Git, Vercel, Render hoặc Supabase của bạn.

## 1. Chọn đúng gói

| Gói/thư mục | Dùng để làm gì? |
| --- | --- |
| `datatalk-backend` | Upload NỘI DUNG vào repository backend đang nối với Render. |
| `datatalk-dashboard` | Upload NỘI DUNG vào repository frontend đang nối với Vercel `datatalk-dashboard-qli5`. |
| `database-setup` | Các file SQL và hướng dẫn chạy riêng trên Supabase; KHÔNG phải repository thứ ba. SQL cũng có sẵn trong backend tại `database/v2`. |

Bản giao chỉ bao gồm giai đoạn tài khoản và quyền đã được viết. Không có gói giả cho các giai đoạn tracking/AI chưa hoàn thành.

## 2. Upload source lên GitHub, không cần tự gộp code

**Bước 1 — Giải nén.** Mở thư mục backend hoặc frontend tương ứng. Bạn phải nhìn thấy `package.json` ngay bên trong.

**Bước 2 — Mở đúng repository trên GitHub.** Trước tiên chọn/tạo nhánh `release/v2-gd01`, không cập nhật `main` đang chạy thật ngay. Đối chiếu phần Git repository trong Render/Vercel; tên project triển khai không nhất thiết là tên repository GitHub.

**Bước 3 — Chọn Add file → Upload files.** Kéo các file/thư mục BÊN TRONG thư mục source vào. `package.json` phải nằm ngay ở gốc repository, không nằm trong một lớp thư mục `datatalk-backend/` hoặc `datatalk-dashboard/` mới lồng thêm. Không upload chính file ZIP rồi chờ dịch vụ tự giải nén. Không upload cả bundle chứa hai ứng dụng vào một repo đang cấu hình cho một ứng dụng.

**Bước 4 — Kiểm tra trước khi commit.** Các file trùng đường dẫn là bản thay thế; các file mới phải xuất hiện đầy đủ. Dùng commit message `DataTalk V2 GD01 - full source accounts and roles`. Trên macOS, dùng Command + Shift + . để hiện các file ẩn như `.gitignore`, `.nvmrc`, `.env.example`. Chỉ `.env.example` là cấu hình mẫu để đưa lên Git; không thêm `.env` hay `.env.local` thật. Mỗi gói source được giữ dưới 100 file để thuận tiện upload bằng trình duyệt.

**Bước 5 — Làm tương tự cho repository còn lại.** Không xóa repo, không xóa lịch sử Git và không đổi project Vercel chính. Không cần upload thêm gói Upgrade cũ.

Nếu đang cập nhật bằng GitHub Desktop: copy nội dung source vào thư mục clone tương ứng, giữ nguyên `.git`, kiểm tra danh sách thay đổi rồi commit/push lên nhánh mới. Không chọn xóa toàn bộ thư mục trước khi copy. Nếu bạn đã chỉnh source sau hai ZIP MVP đã gửi, đối chiếu các thay đổi đó trước để tránh ghi đè phần mới.

## 3. Các việc cần làm một lần ngoài Git

**Upload Git chỉ thay đổi code. Nó không tự cập nhật database, cấp Super Admin, bật Google hoặc gửi email.**

| Thứ tự phát hành | Việc cần làm |
| --- | --- |
| 1. Chuẩn bị database | Sao lưu và kiểm tra trên staging. Chạy `000_preflight_READ_ONLY.sql`; dừng nếu schema không khớp. Xem `database-setup/README.md` hoặc phần Database trong `V2_DEPLOY.md`. |
| 2. Migration và quyền | Kiểm thử `001_accounts_and_permissions.sql`, `004_security_STAGING_ROLLBACK.sql`, `003_verify_READ_ONLY.sql`; chỉ cấp admin qua `002_bootstrap_super_admin.sql` khi UUID + email đã được kiểm chứng. Không chạy hàng loạt mọi SQL trên production. |
| 3. Backend | Dùng Node 22, Build Command `npm install`, Start Command `npm start`; KHÔNG giữ lệnh cũ `node src/server.js`. Nhập biến môi trường trong Render, không trong source. |
| 4. Frontend | Dùng project Vercel `datatalk-dashboard-qli5`. Nhập biến môi trường frontend; chạy kiểm tra type/build trên môi trường cài được thư viện. |
| 5. Đăng nhập thật | Cấu hình Site URL, Redirect URLs, Google Provider và SMTP trong Supabase. Kiểm thử bằng tài khoản admin và hai tài khoản thường trước khi mở công khai. |
| 6. Phát hành có kiểm soát | Sau khi staging đạt, thực hiện cutover database + backend + frontend theo `V2_DEPLOY.md`, rồi mới mở lại truy cập/đăng ký. |

Giữ các giá trị production đã xác nhận: frontend `https://datatalk-dashboard-qli5.vercel.app`, API `https://datatalk-api-h4a1.onrender.com`, Supabase project `qkurxrfmcmonajodnnnx`. Khi thử staging phải dùng database/backend staging và allowlist phù hợp, không để bản thử ghi nhầm production.

Nếu Render/Vercel đang auto-deploy nhánh chính, commit vào nhánh đó có thể kích hoạt deploy trước khi database sẵn sàng. Đừng merge `release/v2-gd01` vào nhánh triển khai chính trước khi hoàn tất kiểm tra/cấu hình. Hãy kiểm tra cả Preview deployment để tránh nhầm nó với production.

## 4. Những điều đã và chưa kiểm tra

Đã xác thực bản ghép 70 file nâng cấp với đúng source MVP đã nhận. Đã chạy lại backend: 68 đạt, 0 lỗi, 1 bỏ qua; frontend: 18 đạt, 0 lỗi. Đã kiểm tra cú pháp/import nội bộ 59 file TypeScript/TSX và cú pháp 28 file JavaScript.

**Chưa build Next.js, chưa typecheck đầy đủ, chưa chạy SQL thực tế và chưa thử Google/email trên trình duyệt.** Môi trường đóng gói không phân giải được `registry.npmjs.org`. Các phiên bản dependency được giữ nguyên như source; chưa có lockfile được tạo từ một lần cài thành công. Không coi những test trên là chứng nhận production. Xem `PACKAGING_REPORT.md`.

Không đóng kèm `node_modules`, `.next`, file môi trường bí mật, backup nội bộ, cache hoặc file font nhị phân. CSS dùng Poppins nếu máy có sẵn, nếu không dùng font hệ thống dự phòng; chưa đối chiếu typography pixel-perfect với Figma. Không cần xóa thư mục font cũ trong repository của bạn.

## 5. Quy ước bàn giao tiếp theo

Mỗi giai đoạn được hoàn thành sẽ có một nhãn riêng `GD02`, `GD03`... cùng source đầy đủ của giai đoạn đó, changelog và SQL khi có thay đổi database. Gói GD01 hiện tại chỉ là nền tảng tài khoản và phân quyền, không phải toàn bộ lộ trình V2.

## Nguồn thao tác dịch vụ

- GitHub — Upload files: https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository
- Render — Deploys: https://render.com/docs/deploys
- Vercel — Git deployments: https://vercel.com/docs/deployments/git
- Supabase — Google login: https://supabase.com/docs/guides/auth/social-login/auth-google
- Supabase — Redirect URLs: https://supabase.com/docs/guides/auth/redirect-urls
- Supabase — SMTP: https://supabase.com/docs/guides/auth/auth-smtp

Các đường dẫn quản trị không thay thế quyền truy cập. Gói này không tự gửi dữ liệu đến tài khoản dịch vụ của bạn.