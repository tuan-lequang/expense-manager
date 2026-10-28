# Mơ — Một chút mỗi ngày

Ứng dụng quản lý chi tiêu cá nhân bằng tiếng Việt, dùng trên laptop và điện thoại. Giao diện pastel, font Be Vietnam Pro và mèo Mochi đồng hành. Không cần tài khoản hoặc khóa API để chạy MVP.

## Chạy dự án

Yêu cầu Node.js **24.19.0** (xem `.nvmrc`) và npm. Dùng checkout hiện có; các cloud task đã được cô lập, không cần tạo Git worktree.

```bash
cd /workspace/expense-manager
export NPM_CONFIG_CACHE=/workspace/.cache/npm
npm ci
npm run dev
```

Trên máy cá nhân, thay đường dẫn checkout và có thể bỏ biến cache. Vite in địa chỉ truy cập khi khởi động. Chế độ phát triển hỗ trợ hot reload; service worker được bật ở bản production.

```bash
npm run test       # Công thức, ngày tháng, sao lưu, IndexedDB
npm run build      # Sinh icon, kiểm tra TypeScript, build và tạo service worker
npm run test:e2e   # Playwright tự chạy bản preview trên port 4173
```

Playwright dùng Chromium hệ thống ở `/usr/bin/chromium` nếu có. Trên máy khác, cài trình duyệt bằng `npx playwright install chromium`, hoặc đặt `PLAYWRIGHT_CHROMIUM_EXECUTABLE` đến Chromium đã cài. Máy Linux có thể cần các thư viện hệ thống theo hướng dẫn Playwright. Kiểm thử chạy ở hai cấu hình: desktop 1440px và điện thoại 393px; đây là giả lập trong Chromium, chưa phải kiểm thử thiết bị iOS/Android thật.

Để tự kiểm tra bản build:

```bash
npm run preview -- --port 4173 --strictPort
```

## Đã có trong MVP

- Một kế hoạch ngân sách, số tiền ban đầu, khoản giữ lại, số ngày hoặc ngày kết thúc.
- Hạn mức hôm nay, tiền còn lại và dự báo hạn mức những ngày sau; chuyển ngày theo múi giờ Việt Nam.
- Ghi/sửa/xóa khoản chi, hoàn tiền gắn với khoản chi gốc và bổ sung ngân sách; danh mục, ghi chú và bộ lọc.
- Dashboard theo ngày, danh mục, số liệu dạng bảng và dự báo cuối kỳ.
- Đặt tên, ẩn/hiện mèo; giảm chuyển động và tôn trọng tùy chọn hệ thống.
- Lưu IndexedDB, sao lưu/khôi phục JSON có xem trước và xác nhận; xuất CSV. Khi khôi phục, thay thế dữ liệu hiện tại, không hợp nhất.
- Bản mẫu tách khỏi dữ liệu cá nhân, chỉ ở bộ nhớ; thoát bản mẫu không thay đổi dữ liệu thật.
- PWA có icon, manifest, cập nhật có thông báo và offline sau lần tải thành công đầu tiên.
- Khôi phục JSON ngay màn hình đầu để chuyển dữ liệu sang link công khai/thiết bị mới; Cài đặt có nút cài PWA khi trình duyệt hỗ trợ, hướng dẫn Android/iPhone và trạng thái sẵn sàng offline.
- Biểu mẫu sửa giao dịch, kế hoạch và tùy chọn kiểm tra thay đổi ở tab khác trước khi ghi, tránh dùng bản chỉnh cũ để ghi đè bản mới.

## Quy tắc ngân sách

Tiền phân bổ ban đầu = số tiền đầu kỳ − khoản giữ lại. Đầu mỗi ngày, chia phần chưa chi cho số ngày còn lại, tính cả hôm nay; làm tròn xuống đến đồng.

Trong ngày, giữ hạn mức đó và trừ chi ròng hôm nay. Khoản bổ sung ngân sách chủ động làm tính lại hạn mức; hoàn tiền giảm chi ròng và phải gắn đúng khoản chi gốc, không vượt tổng tiền đã chi. Sửa giao dịch quá khứ hoặc kế hoạch sẽ tính lại kết quả.

Số tiền còn có thể chi hôm nay không vượt tiền thực còn lại của kế hoạch. Nếu trước đó đã âm toàn bộ ngân sách, hoàn tiền trước tiên bù phần âm; app không coi phần tiền chưa bù đủ đó là tiền có thể chi thêm.

Ví dụ có 3.000.000 ₫, giữ lại 300.000 ₫, dùng 30 ngày: ban đầu 90.000 ₫/ngày. Chi 60.000 ₫ hôm đầu thì còn 30.000 ₫ hôm nay; sang hôm sau là `floor(2.640.000 / 29) = 91.034 ₫`.

Cho phép ghi chi vượt hạn mức. Kế hoạch hết hạn không tự mở kỳ mới hoặc tự chuyển số dư; người dùng có thể điều chỉnh kế hoạch và vẫn ghi bổ sung các giao dịch thuộc kỳ. Giao dịch trong tương lai không được chấp nhận. Báo cáo chỉ tính ngày đến hiện tại; biểu đồ theo ngày hiển thị tối đa 31 ngày cuối trong khoảng chọn, còn số tổng tính trên toàn khoảng.

## Dữ liệu và quyền riêng tư

Dữ liệu nằm trong trình duyệt, không có backend, đồng bộ đám mây, analytics hoặc tích hợp ngân hàng/MoMo. Font và tài nguyên được phục vụ cùng ứng dụng. Mỗi trình duyệt/thiết bị có dữ liệu riêng; chia sẻ đường dẫn app không chia sẻ giao dịch.

Xóa dữ liệu trang, dùng chế độ duyệt riêng tư hoặc mất thiết bị có thể làm mất dữ liệu. Xuất JSON định kỳ và giữ tệp ở nơi riêng tư. CSV dành cho bảng tính, không phải bản sao lưu để khôi phục toàn bộ. Tệp JSON tối đa 10 MB, định dạng phiên bản 1; dữ liệu được kiểm tra trước khi nhập. Các tab dùng IndexedDB và kiểm tra trạng thái trước khi ghi để hạn chế ghi đè dữ liệu cũ.

## Đưa lên hosting

**Hướng dẫn từng bước:** [Tạo link công khai, dùng Chrome và cài trên Android/iPhone](docs/PUBLIC_DEPLOYMENT_AND_MOBILE.md). Có thể kết nối GitHub với Netlify để tự build và có link HTTPS, không cần giữ VS Code chạy. Repository đã có `netlify.toml`; bạn cần tạo project trong tài khoản hosting để có URL thực tế.

`npm run build` tạo thư mục **dist/**, có thể phục vụ bằng static hosting tại gốc một tên miền, qua **HTTPS**. Chưa triển khai lên hosting công khai. Bản hiện tại dùng đường dẫn gốc `/`; cần cấu hình lại base/manifest nếu muốn đặt dưới đường dẫn con.

Hosting cần phục vụ đúng MIME, trả `index.html` cho điều hướng ứng dụng, không cache lâu `index.html`, `sw.js` và manifest; asset có hash có thể cache dài hạn. Service worker và khả năng cài PWA cần HTTPS hoặc môi trường phát triển được trình duyệt cho phép. Chuyển hostname hoặc protocol cũng chuyển vùng dữ liệu trình duyệt, nên sao lưu trước.

## Cấu trúc

- `src/lib/model.ts`: schema dữ liệu, ngày tháng, ngân sách, JSON/CSV.
- `src/lib/db.ts`: lưu trạng thái bằng IndexedDB, kiểm tra thay đổi giữa các tab.
- `src/components/`: form, dashboard charts, giao dịch, báo cáo và cài đặt.
- `src/App.tsx`: điều hướng, lưu trạng thái, dashboard và các hộp thoại.
- `src/styles.css`: thiết kế responsive, pastel và hỗ trợ giảm chuyển động.
- `tests/e2e/`: luồng dùng thực tế, offline và kiểm tra truy cập tự động.
- `docs/PRODUCT_PLAN.md`: kế hoạch đã duyệt và phạm vi nghiên cứu REA/MoMo.

Chưa có tài khoản, đồng bộ nhiều thiết bị, OCR, AI hoặc tích hợp MoMo. Nghiên cứu MoMo bằng REA cần nguồn ứng dụng hoặc luồng quan sát thực tế; giao diện hiện tại là thiết kế riêng.
