# Kế hoạch sản phẩm Expense Manager

Trạng thái: người dùng đã duyệt; đã triển khai MVP cá nhân trong repository. Hướng dẫn chạy và giới hạn hiện tại ở [README](../README.md). Chưa triển khai công khai, chưa có tài khoản/đồng bộ và chưa phân tích MoMo thực tế.

## 1. Mục tiêu

Xây dựng một ứng dụng quản lý chi tiêu cá nhân dùng tốt trên laptop và điện thoại, có thể chia sẻ để người khác tự sử dụng. Trải nghiệm tập trung vào ba câu hỏi:

1. Hôm nay mình còn có thể tiêu bao nhiêu?
2. Tiền đang đi đâu?
3. Mình cần điều chỉnh thế nào để đủ tiền đến ngày đã chọn?

Sản phẩm cần nhẹ nhàng, dễ nhập liệu và không làm người dùng cảm thấy bị phán xét khi vượt ngân sách.

## 2. Định hướng nền tảng

- Làm responsive web app hỗ trợ PWA trước: dùng trên trình duyệt laptop và điện thoại; hỗ trợ cài ra màn hình chính ở trình duyệt tương thích.
- Bản đầu dùng cá nhân, lưu dữ liệu trong IndexedDB trên thiết bị và dùng được offline sau lần tải đầu.
- Có xuất/nhập bản sao lưu JSON và xuất giao dịch CSV ngay trong MVP. Dữ liệu trình duyệt có thể mất khi xóa dữ liệu trang; giao diện phải giải thích ngắn gọn và khuyến khích sao lưu.
- Chia sẻ đường dẫn ứng dụng để mọi người dùng với dữ liệu riêng trên thiết bị của họ. Việc chia sẻ app không tự chia sẻ dữ liệu tài chính.
- Tài khoản và đồng bộ nhiều thiết bị thuộc giai đoạn sau. Trước khi có đồng bộ, dùng cùng ứng dụng trên laptop và điện thoại không có nghĩa là dùng chung dữ liệu.

## 3. Thiết kế và thú cưng

### Phong cách

- Nền kem, màu nhấn mint và lavender; hồng đào cho điểm nhấn nhỏ.
- Màu chữ đậm, độ tương phản đủ tốt; không dùng màu pastel nhạt làm chữ nội dung.
- Dùng font hỗ trợ tiếng Việt tốt, đề xuất Be Vietnam Pro; có thể tự lưu font để không cần tải từ bên thứ ba khi sử dụng.
- Bo góc mềm, khoảng trắng thoáng, số tiền là thông tin nổi bật nhất. Chuyển động nhẹ và tôn trọng tùy chọn giảm chuyển động của thiết bị.
- Hiển thị số và tiền theo định dạng Việt Nam; MVP dùng VND, lưu bằng số nguyên đồng.

### Thú cưng trợ lý

Đề xuất mặc định một chú mèo, cho đặt tên. Mèo xuất hiện cạnh ngân sách hôm nay, phản hồi khi thêm giao dịch và giải thích thay đổi hạn mức.

Ví dụ: “Hôm nay bạn còn 85.000 ₫. Nếu chi thêm 20.000 ₫, bạn sẽ còn 65.000 ₫ trong hạn mức.”

MVP dùng lời nhắc theo quy tắc, không cần dịch vụ AI. Cho phép tắt lời nhắc và hiệu ứng. Không dùng cảm giác tội lỗi, thú cưng bị phạt, hay phần thưởng khiến người dùng ngại ghi lại khoản chi thật. Trang trí, phụ kiện và hội thoại AI là tính năng mở rộng; AI chỉ triển khai khi có nhu cầu rõ ràng và cơ chế đồng ý trước khi gửi dữ liệu ra ngoài.

## 4. Ngân sách theo số ngày

### Luồng tạo kế hoạch

1. Nhập số tiền muốn dùng cho kỳ này.
2. Chọn số ngày hoặc ngày kết thúc; hiển thị rõ khoảng ngày bao gồm cả ngày bắt đầu và ngày kết thúc.
3. Có thể nhập khoản muốn giữ lại. Nếu số tiền ban đầu đã là tiền có thể tiêu, để khoản giữ lại bằng 0.
4. Xem số tiền dành cho chi tiêu và hạn mức mỗi ngày trước khi xác nhận.

Ví dụ: có 3.000.000 ₫, giữ lại 300.000 ₫, dùng trong 30 ngày → ngân sách chi tiêu 2.700.000 ₫ → ban đầu 90.000 ₫/ngày.

### Quy tắc tính

- Ngân sách chi tiêu ban đầu = số tiền đưa vào kế hoạch − khoản giữ lại.
- Đầu mỗi ngày: hạn mức hôm nay = ngân sách chưa chi / số ngày còn lại, tính cả hôm nay.
- Trong ngày: số còn có thể chi hôm nay = hạn mức đã xác định cho hôm nay − tổng chi ròng hôm nay.
- Sau mỗi giao dịch, cập nhật ngay số còn lại hôm nay và dự báo hạn mức các ngày tiếp theo. Không lấy số dư sau giao dịch chia lại cho số ngày có cả hôm nay rồi tiếp tục trừ chi hôm nay, vì cách này tính trùng ảnh hưởng của khoản chi.
- Sang ngày mới, phân bổ lại ngân sách chưa chi cho số ngày còn lại. Vì vậy tiền tiết kiệm hôm trước được chia cho những ngày tiếp theo, và chi vượt hôm trước làm giảm hạn mức tiếp theo.
- Nếu thêm tiền, đổi ngày kết thúc hoặc sửa giao dịch quá khứ, tính lại kế hoạch và hiển thị rõ tác động; phân biệt sự điều chỉnh này với chi tiêu thông thường trong ngày.
- Làm tròn xuống đến đồng khi hiển thị hạn mức; giữ phần dư trong ngân sách để không phân bổ vượt tổng tiền.
- Khi hết thời hạn hoặc ngân sách hết, hiển thị trạng thái rõ ràng; không chia cho 0 và không âm thầm tạo thêm ngân sách.
- Cho phép ghi giao dịch vượt ngân sách vì ứng dụng phải phản ánh thực tế.
- Kỳ đầu chỉ có một kế hoạch đang hoạt động. Không tự động dồn số dư kỳ cũ sang kỳ mới khi chưa được người dùng chọn.

### Phạm vi tiền và thời gian

- MVP phân biệt chi tiêu, hoàn tiền gắn với khoản chi và bổ sung tiền vào kế hoạch. Không mặc định mọi khoản thu đều thuộc ngân sách đang hoạt động.
- Hoàn tiền làm giảm chi ròng; chuyển tiền giữa các ví ở giai đoạn sau không được tính là chi tiêu.
- Ngày giao dịch và mốc chuyển ngày dùng múi giờ của kế hoạch; mặc định Asia/Ho_Chi_Minh, không phụ thuộc múi giờ máy chủ.
- Khoản giữ lại là tiền không phân bổ để chi. Quản lý hóa đơn định kỳ và khoản phải trả dành cho giai đoạn sau để tránh trừ hai lần khi ghi nhận thanh toán.

## 5. Phạm vi MVP

### A. Thiết lập ban đầu

- Tạo kế hoạch tiền/ngày và khoản giữ lại tùy chọn.
- Đặt tên thú cưng hoặc dùng mặc định.
- Giải thích nơi lưu dữ liệu và cách sao lưu.

### B. Trang Hôm nay

- Số tiền còn có thể chi hôm nay, tổng tiền còn lại và số ngày còn lại.
- Thanh tiến độ chi tiêu hôm nay, có trạng thái vượt hạn mức.
- Nút thêm chi tiêu dễ chạm; danh sách giao dịch gần đây.
- Một lời nhắc hữu ích từ thú cưng, có thể ẩn.

### C. Giao dịch

- Thêm nhanh số tiền, danh mục, ngày và ghi chú tùy chọn.
- Danh mục mặc định: ăn uống, đi lại, mua sắm, nhà ở/hóa đơn, giải trí, sức khỏe và khác.
- Sửa, xóa và tìm/lọc theo thời gian, danh mục.
- Ghi nhận hoàn tiền và bổ sung ngân sách; xác nhận các thao tác xóa quan trọng.

### D. Dashboard

- Tổng chi, ngân sách còn lại và mức chi trung bình theo ngày trong khoảng được chọn.
- Biểu đồ chi theo danh mục, kèm số tiền và tỷ trọng.
- Biểu đồ chi theo ngày so với hạn mức tương ứng; phân biệt ngày không chi với ngày chưa đến.
- Dự báo ngân sách cuối kỳ theo mức chi trung bình khi đã đủ dữ liệu; ghi rõ đây là ước tính.
- Trạng thái chưa có dữ liệu và kỳ chưa hoàn thành phải được trình bày đúng, không tạo kết luận giả.

### E. Cài đặt và dữ liệu

- Chỉnh kế hoạch, bật/tắt thú cưng và chuyển động.
- Xuất/nhập JSON có phiên bản định dạng, kiểm tra dữ liệu trước khi khôi phục; xuất CSV.
- MVP hỗ trợ khôi phục bằng cách thay thế dữ liệu sau bước xem trước và xác nhận; hợp nhất dữ liệu để giai đoạn sau.
- Xóa toàn bộ dữ liệu với bước xác nhận rõ ràng.

## 6. Bố cục

- Điện thoại: thanh điều hướng dưới gồm Hôm nay, Giao dịch, Phân tích, Cài đặt; nút thêm chi tiêu luôn dễ tiếp cận.
- Laptop: thanh điều hướng bên trái, dashboard có nhiều cột, danh sách giao dịch rộng hơn.
- Form nhập tiền ưu tiên bàn phím số trên điện thoại; hỗ trợ bàn phím và nhãn truy cập trên laptop.
- Thông báo trạng thái không chỉ dùng màu sắc. Tránh để thú cưng che số tiền, biểu đồ hoặc nút thao tác.

## 7. Tham khảo MoMo

Nguồn công cụ do người dùng cung cấp: [morluto/rea](https://github.com/morluto/rea). Đã đọc README, skill `reverse-engineer-anything` và tài liệu Android/ADB tại commit `bcc6775dc1c29c06a08798b73049d0bf506e6b55`. REA là bộ công cụ phân tích, không phải mã nguồn MoMo hoặc một báo cáo phân tích MoMo có sẵn.

### Khả năng đã xác minh từ tài liệu REA

- Có skill [reverse-engineer-anything](https://github.com/morluto/rea/blob/bcc6775dc1c29c06a08798b73049d0bf506e6b55/.agents/skills/reverse-engineer-anything/SKILL.md), cùng giao diện MCP và CLI. Đọc hoặc cài skill không tự kết nối MCP trong phiên hiện tại.
- Phân tích APK Android dùng JADX headless và JDK 17+ để đọc manifest, lớp, phương thức và tham chiếu tĩnh. Luồng này không chạy APK và không cần emulator.
- Quan sát thiết bị Android dùng ADB do môi trường cung cấp, hỗ trợ thiết bị thật hoặc emulator đã kết nối, lấy APK và chụp màn hình. REA không tự cài Android SDK hoặc khởi tạo emulator.
- Tài nguyên, chuỗi và mã decompile cung cấp bằng chứng tĩnh; không chứng minh giao diện đang hiển thị hay hành vi thực tế. Đối chiếu bằng quan sát luồng khi cần.

Nguồn kỹ thuật: [Android APK analysis](https://github.com/morluto/rea/blob/bcc6775dc1c29c06a08798b73049d0bf506e6b55/docs/android-analysis.md), [ADB device analysis](https://github.com/morluto/rea/blob/bcc6775dc1c29c06a08798b73049d0bf506e6b55/docs/adb-device-analysis.md).

### Nghiên cứu tập trung cho Expense Manager

| Câu hỏi                                             | Nguồn cần có                                            | Đầu ra thiết kế                                     |
| --------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------- |
| Thông tin tài chính nào nổi bật đầu tiên?           | Màn hình tổng quan thực tế                              | Thứ tự số tiền hôm nay, số dư kỳ, giao dịch gần đây |
| Ghi một khoản chi cần bao nhiêu thao tác?           | Video hoặc quan sát luồng tương ứng, nếu MoMo có hỗ trợ | Form ghi chi và giá trị mặc định                    |
| Danh mục, lịch sử và bộ lọc được tổ chức ra sao?    | Màn hình và thao tác lọc thực tế                        | Danh sách giao dịch và bộ lọc                       |
| Báo cáo giải thích xu hướng bằng cách nào?          | Màn hình phân tích có dữ liệu và trạng thái trống       | Biểu đồ, nhãn và thông điệp dashboard               |
| Tài nguyên APK có giúp giải thích điểm còn chưa rõ? | APK xác định được phiên bản; phân tích tĩnh có mục tiêu | Bằng chứng bổ sung, ghi rõ giới hạn                 |

Ưu tiên quan sát giao diện và luồng cho mục tiêu lên ý tưởng. Chỉ dùng phân tích APK cho câu hỏi cụ thể chưa trả lời được; không cần phân tích toàn bộ ứng dụng để thiết kế MVP.

Mỗi kết luận nghiên cứu phải có nguồn, phiên bản/thời điểm khi xác định được, phân biệt quan sát với suy luận, và nêu cách áp dụng vào sản phẩm. Các điểm chưa quan sát không được mô tả thành tính năng đã xác minh của MoMo.

### Trạng thái và đầu vào còn thiếu

- Đã xác minh tài liệu và cách dùng REA; chưa cài hoặc đăng ký MCP, chưa chạy phân tích MoMo.
- Chưa có APK MoMo, thiết bị Android kết nối hoặc ảnh/video các luồng cần tham khảo trong workspace. Các câu hỏi về trải nghiệm MoMo ở bảng trên vẫn chưa được trả lời.
- Để nghiên cứu giao diện cụ thể, cần ảnh/video các màn hình liên quan, hoặc môi trường Android có MoMo để quan sát. Nếu cần phân tích tĩnh, cần APK có nguồn gốc xác định được. Chỉ giữ thông tin cần cho thiết kế, che dữ liệu tài chính cá nhân trong tài liệu nghiên cứu.
- Việc thiếu nguồn MoMo không chặn wireframe và phát triển các tính năng ngân sách đã đề xuất; các quyết định đó là thiết kế riêng, chưa phải kết quả reverse engineering.

Giữ bản sắc pastel và thú cưng riêng, không sao chép logo, tài sản đồ họa hay bố cục đặc thù. Tích hợp tài khoản MoMo, tự đọc giao dịch và tự động nhập lịch sử không thuộc MVP. Nhập CSV thủ công có thể bổ sung sau khi có mẫu dữ liệu và quy tắc chống trùng.

## 8. Kiến trúc đề xuất

| Thành phần       | Lựa chọn ban đầu                       | Lý do                                                                |
| ---------------- | -------------------------------------- | -------------------------------------------------------------------- |
| Ứng dụng         | React + TypeScript + Vite              | Phù hợp ứng dụng cá nhân tương tác nhiều, triển khai tĩnh thuận tiện |
| Giao diện        | Tailwind CSS + component truy cập được | Dễ xây ngôn ngữ pastel nhất quán                                     |
| Biểu đồ          | Recharts                               | Đủ cho dashboard MVP                                                 |
| Dữ liệu cục bộ   | IndexedDB qua Dexie                    | Hỗ trợ truy vấn, migration và sử dụng offline                        |
| Kiểm tra dữ liệu | Zod                                    | Kiểm tra form và file sao lưu                                        |
| PWA              | Plugin PWA cho Vite                    | Cache ứng dụng và luồng cập nhật có kiểm soát                        |
| Kiểm thử         | Vitest + Playwright                    | Kiểm tra công thức và các luồng người dùng chính                     |
| Đồng bộ về sau   | Supabase Auth + Postgres               | Có đường mở rộng tài khoản và phân quyền theo người dùng             |

Tách hàm tính ngân sách khỏi giao diện và lớp lưu trữ để kiểm thử độc lập. Dữ liệu chính gồm kế hoạch ngân sách, giao dịch, danh mục và tùy chọn. Lưu thời gian tạo/sửa, ngày giao dịch và múi giờ đủ rõ để tính lại được. Khoản còn lại và báo cáo là dữ liệu suy ra, tránh lưu nhiều số tổng không nhất quán.

Chọn phiên bản package ổn định và runtime Node được hỗ trợ tại thời điểm khởi tạo; pin runtime và lockfile khi triển khai. Không cần backend hay khóa dịch vụ cho MVP. Trước khi mở đồng bộ cần thiết kế migration từ dữ liệu cục bộ, xử lý xung đột, xác thực và kiểm tra quyền truy cập giữa các tài khoản.

## 9. Lộ trình và điều kiện hoàn thành

### Giai đoạn 1 — Chốt trải nghiệm

- Nghiên cứu các luồng MoMo theo mục 7 khi có nguồn, ghi lại bằng chứng và điểm áp dụng; có thể tiến hành song song với thiết kế riêng.
- Wireframe: thiết lập, Hôm nay, thêm giao dịch, dashboard và cài đặt.
- Chốt bảng màu, font, một thú cưng và các trạng thái chính.
- Kiểm tra tính dễ đọc và luồng nhập trên cả màn hình nhỏ lẫn laptop.

### Giai đoạn 2 — Luồng ngân sách hoạt động

- Khởi tạo dự án, lưu trữ, công thức ngân sách, thêm/sửa/xóa giao dịch.
- Hoàn thành một luồng dùng được từ tạo kế hoạch đến xem hạn mức thay đổi qua ngày mới.
- Kiểm thử số ngày bao gồm ngày đầu/cuối, làm tròn, vượt ngân sách, hoàn tiền và sửa giao dịch quá khứ.

### Giai đoạn 3 — Hoàn thiện MVP cá nhân

- Dashboard, thú cưng theo quy tắc, bộ lọc và xuất/nhập sao lưu.
- PWA, offline, xử lý lỗi và thông báo khi có phiên bản ứng dụng mới.
- Kiểm tra giao diện và chức năng ở kích thước điện thoại/laptop; kiểm tra bàn phím và độ tương phản.
- Kiểm tra end-to-end: tạo kế hoạch → ghi chi → tải lại → xem báo cáo → xuất → khôi phục dữ liệu.
- Kiểm tra mở lại offline sau lần tải đầu trên bản build chạy thực tế.

### Giai đoạn 4 — Chia sẻ và đồng bộ

- Triển khai bản PWA công khai với dữ liệu riêng trên mỗi thiết bị trước.
- Thu thập phản hồi trước khi thêm tài khoản, đồng bộ laptop/điện thoại và sao lưu đám mây.
- Khi có tài khoản: kiểm tra người dùng A không đọc/sửa dữ liệu người dùng B; có xuất và xóa dữ liệu cá nhân.

### Sau MVP, ưu tiên theo nhu cầu thực tế

1. Khoản chi định kỳ và khoản phải trả.
2. Nhiều ví và nhiều kế hoạch ngân sách.
3. Mục tiêu tiết kiệm và phụ kiện cho thú cưng.
4. Nhập CSV, đọc hóa đơn bằng OCR.
5. Trợ lý AI tùy chọn khi giải quyết được nhu cầu cụ thể.

Chưa lên lịch cam kết theo ngày trước khi chốt phạm vi và bắt đầu thực hiện. Mỗi giai đoạn cần có bản dùng được hoặc kết quả kiểm tra rõ ràng trước khi mở rộng.

## 10. Đề xuất để bắt đầu

Bắt đầu bằng một PWA tiếng Việt, VND, một kế hoạch đang hoạt động, một chú mèo, ghi chi thủ công và dashboard cơ bản. Đầu tư sớm vào tính đúng của ngân sách và sao lưu. Sau khi luồng “mở app → biết hôm nay còn bao nhiêu → ghi một khoản chi” thật thuận tiện mới mở rộng đồng bộ và tự động hóa.
