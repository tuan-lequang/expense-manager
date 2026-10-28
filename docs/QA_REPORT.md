# Kiểm tra và hoàn thiện Mơ — 28/10/2026

Phạm vi: MVP cá nhân trên Chromium, giao diện laptop và điện thoại; không coi giả lập trình duyệt là kiểm chứng thiết bị iOS/Android thật.

## Lỗi đã tái hiện và sửa

| Lỗi                                           | Tình huống trước khi sửa                                                                               | Kết quả sau sửa                                                                  |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Hoàn tiền làm số có thể chi lớn hơn tiền thực | Kế hoạch 3.000 ₫ đã chi 6.000 ₫; hôm sau hoàn 1.000 ₫, app báo có thể chi 1.000 ₫ dù tổng còn −2.000 ₫ | Tiền hoàn bù âm trước; số có thể chi không vượt phần tiền thực còn lại           |
| Dự báo cuối kỳ phụ thuộc bộ lọc               | Đổi ngày kết thúc báo cáo về quá khứ làm thay đổi dự báo dù không đổi giao dịch                        | Dự báo tính từ đầu kế hoạch đến hiện tại, tách khỏi khoảng báo cáo được chọn     |
| Tìm kiếm chữ Đ viết hoa                       | Khoản “ĐI CHỢ” không xuất hiện khi tìm “di cho”                                                        | Chuẩn hóa chữ hoa/thường trước khi bỏ dấu và chuyển đ → d                        |
| Ghi đè khi dùng nhiều tab                     | Mở biểu mẫu cũ ở tab A, sửa dữ liệu ở B rồi lưu A có thể ghi đè bản B                                  | Chặn biểu mẫu giao dịch/kế hoạch/tùy chọn cũ; xác nhận xóa cũng kiểm tra bản mới |
| Reset từ tab khác làm lỗi màn hình đang nhập  | Tab A đang thêm giao dịch, B xóa toàn bộ dữ liệu                                                       | Đóng biểu mẫu không còn thuộc kế hoạch; trở về màn hình thiết lập, không crash   |
| Cắt mất số tiền lớn trên điện thoại           | Hạn mức 1.000.000.000.000 ₫ bị cắt cuối ở 320px/393px                                                  | Số tiền có vùng riêng và cỡ chữ phù hợp, hiển thị đủ giá trị                     |
| Không về đầu trang sau thiết lập              | Vị trí cuộn ở form cũ có thể được giữ khi chuyển sang dashboard                                        | Điều hướng về đầu dashboard sau khi tạo kế hoạch                                 |
| Đọc sai dấu phân cách tiền                    | `1,5` hoặc `1.5` có thể bị biến thành 15 ₫                                                             | Chỉ nhận số nguyên hoặc nhóm nghìn hợp lệ; không âm thầm đổi giá trị             |

Đã chạy kiểm thử tái hiện thất bại trên bản cũ cho hai trường hợp hoàn tiền, tìm kiếm chữ Đ, dự báo theo bộ lọc và biểu mẫu giao dịch cũ; sau sửa đều đạt. Các trường hợp bổ sung được giữ trong bộ kiểm thử hồi quy.

## Tính năng bổ sung để dùng bằng link public

- Khôi phục JSON ngay màn hình đầu, không cần tạo kế hoạch tạm trước khi chuyển dữ liệu từ laptop sang điện thoại/link mới.
- Mục **Mang Mơ theo bên mình** trong Cài đặt: nút cài khi Chrome cung cấp, hướng dẫn thủ công cho Chrome/Android/iPhone, trạng thái offline và xử lý khi bỏ qua cửa sổ cài đặt.
- `netlify.toml` khai báo build, publish directory, Node và cache; [hướng dẫn public và điện thoại](PUBLIC_DEPLOYMENT_AND_MOBILE.md) giải thích toàn bộ thao tác thiết lập hosting, chuyển dữ liệu, cài PWA, cập nhật và xử lý lỗi.

## Kiểm tra thực hiện

- `npm run test`: **22 kiểm thử logic/lưu trữ đạt**, gồm công thức ngày, hoàn tiền, làm tròn, ngày Việt Nam, định dạng sao lưu, CSV và chặn ghi đè IndexedDB.
- `npm run build`: đạt kiểm tra TypeScript, tạo icon, build production và service worker.
- `npm run test:e2e`: **38 kiểm thử trình duyệt đạt** ở hai cấu hình desktop/mobile, gồm các luồng dùng thật, offline reload/ghi chi, khôi phục, dữ liệu mẫu, ngày mới, nhiều tab và các lỗi hồi quy ở trên. Sau thay đổi nhỏ cuối, chạy lại các kiểm thử liên quan.
- Kiểm tra truy cập tự động bằng axe cho thiết lập, dashboard, giao dịch, phân tích và cài đặt; không có lỗi trong các rule được chọn. Đây không phải chứng nhận truy cập đầy đủ.
- Tự mở bản production bằng Chromium, xem ảnh chụp, kiểm tra thêm số tiền lớn ở 320px, 393px và 1440px. Hạn mức 1.000 tỷ ở 320px không còn tràn; vị trí cuộn sau thiết lập là đầu trang.
- Parse `netlify.toml` thành công, đối chiếu Node với `.nvmrc`, kiểm tra thư mục `dist` có manifest/service worker. Chưa chạy build trên máy Netlify thực tế.
- Kiểm tra định dạng mã và whitespace trước commit.

## Giới hạn và ưu tiên tiếp theo

1. **Chưa deploy vào tài khoản hosting của người dùng.** Cần thực hiện hướng dẫn kết nối GitHub/Netlify để có URL production thật. Thêm cấu hình hosting và push code không tự tạo tài khoản hoặc website.
2. **Chưa có đồng bộ laptop–điện thoại.** Hiện chọn một thiết bị chính hoặc chuyển JSON thủ công; nhập JSON thay thế, không hợp nhất. Nếu thường ghi trên nhiều thiết bị, đăng nhập/đồng bộ là tính năng nên làm tiếp theo.
3. **Cần kiểm tra cài PWA trên thiết bị thật.** Kiểm thử sự kiện cài đặt bằng sự kiện mô phỏng xác nhận UI của app; không chứng minh hộp thoại hoặc biểu tượng của hệ điều hành hoạt động. Hướng dẫn có các bước kiểm tra Chrome/Android và Safari/iPhone thực tế.
4. **Vẫn cần sao lưu.** Dữ liệu nằm trên thiết bị; hosting không sao lưu giao dịch cá nhân. Các tính năng nhắc sao lưu hoặc bản sao lưu đám mây có thể bổ sung sau khi chọn cách lưu/sync.

Trong phạm vi các luồng đã thử, không còn lỗi chặn đã biết. Không mở rộng thêm AI, OCR hoặc tích hợp MoMo trong lượt này; chúng chưa cần thiết để ổn định workflow cá nhân và dùng link công khai.
