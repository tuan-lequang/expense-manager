# Đưa Mơ lên link công khai và dùng như app trên điện thoại

Mục tiêu: có một địa chỉ **HTTPS cố định** để mở Mơ bằng Chrome hoặc Safari, kể cả khi máy tính đã tắt và VS Code không chạy. Sau đó thêm biểu tượng Mơ lên màn hình chính điện thoại hoặc cài thành ứng dụng trên laptop.

Hướng dẫn này dùng **Netlify kết nối GitHub**. Bạn không cần mua tên miền riêng hoặc cài Node.js trên điện thoại. Hosting có thể có gói miễn phí theo chính sách và hạn mức hiện tại; xem thông tin gói khi đăng ký. Repository đã có `netlify.toml` chứa cấu hình build và cache. Chưa có website công khai nào được tạo chỉ bằng việc thêm file này.

## 1. Giữ dữ liệu trước khi đổi cách sử dụng

Nếu đã ghi chi ở bản chạy từ VS Code:

1. Mở app cũ → **Cài đặt → Sao lưu JSON**.
2. Giữ tệp JSON ở nơi riêng tư để chuyển sang link mới.
3. Mở link công khai sau khi deploy, chọn **Khôi phục bản sao lưu** ở màn hình đầu, chọn tệp và kiểm tra số giao dịch trước khi xác nhận.

Địa chỉ chạy trên máy, tên miền Netlify và tên miền riêng là các vùng dữ liệu trình duyệt khác nhau. App không tự chuyển dữ liệu giữa chúng. Tệp JSON có thể chứa thông tin tài chính cá nhân; không đưa tệp vào GitHub hoặc thư mục public của website.

## 2. Tạo website từ GitHub — chỉ làm một lần

1. Đăng nhập hoặc tạo tài khoản tại **https://app.netlify.com/**.
2. Tìm mục **Add new project / Add new site → Import an existing project** hoặc mục nhập dự án từ Git.
3. Chọn **GitHub** và cho phép Netlify truy cập repository **`tuan-lequang/expense-manager`**. Chỉ chọn quyền truy cập repository cần dùng nếu giao diện cho phép.
4. Chọn repository và nhánh triển khai **`main`**.
5. Giữ **Base directory** trống, không đặt thành `src`.
6. Kiểm tra các thiết lập sau; `netlify.toml` đã khai báo chúng:

   | Thiết lập                 | Giá trị                       |
   | ------------------------- | ----------------------------- |
   | Production branch         | `main`                        |
   | Base directory            | Để trống, dùng gốc repository |
   | Build command             | `npm run build`               |
   | Publish directory         | `dist`                        |
   | Node.js                   | `24.19.0`                     |
   | Biến môi trường / API key | App hiện tại không cần        |

7. Chọn **Deploy / Deploy project**. Đợi log cài dependency và build hoàn tất, trạng thái website được publish.
8. Mở **Production URL** Netlify cung cấp. Địa chỉ có dạng `https://<ten-du-an>.netlify.app` — đây là mẫu cấu trúc, không phải link đã được tạo sẵn cho bạn.
9. Có thể đổi tên website trong thiết lập domain/site để link dễ nhớ hơn. Chốt tên trước khi bắt đầu ghi dữ liệu thật. Nếu đổi hostname sau này, xuất JSON ở địa chỉ cũ rồi khôi phục tại địa chỉ mới.

Tên các nút có thể thay đổi theo phiên bản giao diện Netlify. Điều quan trọng là nhập repository từ Git, build nhánh `main`, và phục vụ thư mục `dist` qua HTTPS ở gốc tên miền.

Khi đã deploy thành công, bạn có thể tắt VS Code và máy tính; Netlify tiếp tục phục vụ app. Đây là website tĩnh, không cần giữ lệnh `npm run dev` hoặc `npm run preview` chạy trên máy bạn.

## 3. Kiểm tra link trước khi sử dụng hằng ngày

Mở link production bằng Chrome, không dùng link deploy preview tạm thời để ghi dữ liệu chính:

- Tải lại trang và kiểm tra giao diện xuất hiện, không có màn hình trắng.
- Có thể khám phá bản mẫu trước; thoát bản mẫu sẽ không lưu các giao dịch mẫu vào dữ liệu thật.
- Tạo kế hoạch thật hoặc khôi phục JSON từ app cũ.
- Ghi một khoản chi nhỏ, tải lại trang và kiểm tra khoản đó còn nguyên.
- Vào **Cài đặt → Mang Mơ theo bên mình**, đợi trạng thái **Đã sẵn sàng dùng offline**.
- Tắt kết nối mạng trên thiết bị, mở lại hoặc tải lại app, thử ghi giao dịch rồi bật mạng lại. Chỉ thử sau khi lần mở đầu có mạng đã tải xong.
- Xuất một bản sao lưu JSON và xác nhận tệp đã tải xuống. CSV dùng để đọc trong bảng tính; JSON mới là bản dùng để khôi phục toàn bộ app.

Nếu link chạy qua HTTP, bị cảnh báo chứng chỉ hoặc chưa được publish thành công, hoàn tất HTTPS của hosting trước khi cài app. Không cần mở cổng router hoặc dùng địa chỉ mạng nội bộ của máy tính.

## 4. Dùng bằng Chrome trên laptop

Bạn có thể bookmark link và mở như website thông thường. Để có cửa sổ riêng và biểu tượng ứng dụng:

1. Mở link HTTPS production bằng Chrome.
2. Tạo/khôi phục kế hoạch, vào **Cài đặt**.
3. Nếu có nút **Cài Mơ trên thiết bị**, bấm nút và xác nhận trong cửa sổ của Chrome.
4. Nếu không thấy nút, tìm biểu tượng cài đặt trên thanh địa chỉ; hoặc mở menu **⋮ → Truyền, lưu và chia sẻ → Cài đặt trang dưới dạng ứng dụng**. Tên mục có thể khác theo phiên bản Chrome.
5. Mở Mơ từ danh sách ứng dụng/Start menu/Dock hoặc shortcut mà hệ điều hành tạo.

Nếu Chrome đã cài Mơ, có thể không còn nút cài mới. Dùng mục mở app hiện có hoặc biểu tượng ứng dụng đã tạo. Website vẫn dùng được mà không cần cài.

## 5. Cài trên điện thoại Android

1. Gửi link production cho điện thoại và mở trực tiếp bằng **Chrome**. Nếu mở trong Zalo/Facebook/Messenger, chọn **Mở bằng Chrome** trước.
2. Chờ tải xong. Tạo kế hoạch mới hoặc chọn **Khôi phục bản sao lưu** ở màn hình đầu nếu muốn dùng dữ liệu đã xuất.
3. Vào **Cài đặt → Cài Mơ trên thiết bị** nếu có nút; hoặc menu Chrome **⋮ → Cài đặt ứng dụng / Thêm vào màn hình chính**.
4. Xác nhận thêm/cài. Mở **Mơ** từ biểu tượng mới.
5. Kiểm tra lại dữ liệu trong app vừa cài và xuất JSON dự phòng. Nếu dữ liệu chưa có, khôi phục tệp JSON tại nơi bạn sẽ sử dụng hằng ngày.

Đây là **PWA**, cài từ trình duyệt; không cần tải APK hoặc tìm trên CH Play. Khả năng hiển thị trong danh sách ứng dụng và kiểu cửa sổ phụ thuộc trình duyệt/hệ điều hành.

## 6. Cài trên iPhone hoặc iPad

1. Mở link production bằng **Safari** để dùng luồng cài này.
2. Chờ app tải xong; xuất JSON trước nếu đang chuyển từ một nơi đã có dữ liệu.
3. Bấm nút **Chia sẻ** (hình vuông có mũi tên đi lên).
4. Chọn **Thêm vào Màn hình chính / Add to Home Screen**. Nếu chưa thấy, xem thêm các mục trong bảng Chia sẻ.
5. Giữ tên **Mơ**; bật **Mở dưới dạng ứng dụng web / Open as Web App** nếu phiên bản iOS hiển thị tùy chọn này, rồi bấm **Thêm**.
6. Mở biểu tượng Mơ ở màn hình chính, kiểm tra dữ liệu. Nếu chưa thấy, dùng **Khôi phục bản sao lưu** ngay màn hình đầu và chọn tệp JSON từ ứng dụng Tệp/Files.

Không cần tài khoản nhà phát triển Apple hoặc App Store. Mơ chưa có bản native riêng. Không mặc định dữ liệu trong mọi trình duyệt và app cài đặt đều giống nhau; kiểm tra tại biểu tượng bạn sẽ sử dụng và giữ bản sao lưu.

## 7. Dùng laptop và điện thoại cùng lúc

**App chưa có tài khoản hoặc đồng bộ tự động.** Cùng mở một link không có nghĩa hai thiết bị dùng chung dữ liệu. Chia sẻ link cho người khác cũng không chia sẻ giao dịch của bạn.

Nếu muốn chuyển dữ liệu thủ công:

1. Chọn một thiết bị làm nơi ghi dữ liệu chính.
2. **Sao lưu JSON** trên thiết bị đó, chuyển tệp qua kênh riêng tư sang thiết bị còn lại.
3. **Khôi phục JSON** trên thiết bị đích. Xem trước rồi xác nhận; thao tác này **thay thế**, không hợp nhất giao dịch hai bên.
4. Nếu có dữ liệu mới ở cả hai thiết bị, giữ bản sao lưu của cả hai trước. Hiện chưa có chức năng tự hợp nhất; không nhập đè nếu chưa quyết định bản nào cần giữ.

Ưu tiên mở rộng tiếp theo nếu bạn muốn ghi trên nhiều thiết bị thường xuyên là đăng nhập và đồng bộ. Việc cài PWA hoặc dùng hosting không tự tạo khả năng này.

## 8. Cập nhật app sau này

Với GitHub đã kết nối Netlify, mỗi lần mã nguồn được push vào `main`, Netlify sẽ build và triển khai theo thiết lập của project. Kiểm tra deploy đã thành công trước khi báo cho người khác có bản mới.

- Người dùng tiếp tục mở **cùng link production**, không chuyển sang URL preview của từng lần deploy.
- Khi Mơ báo có phiên bản mới, lưu xong giao dịch đang nhập rồi chọn **Cập nhật**. Nếu chưa thấy thông báo, mở lại khi có mạng hoặc tải lại trang.
- Cập nhật thông thường cùng hostname không yêu cầu xóa dữ liệu. Không xóa site data để cập nhật app nếu chưa sao lưu.
- `netlify.toml` yêu cầu kiểm tra lại HTML, manifest và `sw.js`, đồng thời cho phép cache dài hạn asset có hash. Cấu hình này giúp nhận bản mới và vẫn dùng được offline.
- Trước một thay đổi lớn hoặc đổi domain, xuất JSON. Nếu deploy lỗi, dùng chức năng rollback về bản deploy thành công trước trong Netlify; rollback mã nguồn không khôi phục dữ liệu đã xóa trên thiết bị.

## 9. Xử lý các lỗi thường gặp

| Hiện tượng                                    | Cách kiểm tra                                                                                                                                                                |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Netlify build thất bại                        | Mở deploy log; kiểm tra branch `main`, Node 24.19.0, `package-lock.json`, build command và publish directory. Không tắt kiểm tra TypeScript hoặc bỏ qua lỗi build.           |
| Trang trắng hoặc asset 404                    | Kiểm tra publish đúng `dist`, triển khai ở gốc hostname, không dùng cấu hình GitHub Pages dưới `/expense-manager/` với bản hiện tại.                                         |
| Không có nút cài                              | Mở link HTTPS bằng Chrome/Safari chính, kiểm tra đã cài chưa, dùng menu trình duyệt. Nút cài tự động phụ thuộc browser; không có nút không có nghĩa website không dùng được. |
| Offline chưa hoạt động                        | Mở lại khi có mạng, chờ trạng thái sẵn sàng offline trong Cài đặt, rồi mới ngắt mạng. Kiểm tra không dùng chế độ ẩn danh.                                                    |
| Link mới trông như mất dữ liệu                | Dữ liệu thuộc địa chỉ/trình duyệt trước đó. Mở app cũ, xuất JSON và khôi phục ở địa chỉ mới.                                                                                 |
| Laptop không có khoản vừa ghi trên điện thoại | Chưa có đồng bộ. Chọn một thiết bị chính hoặc chuyển JSON thủ công, không nhập đè hai bản chưa sao lưu.                                                                      |
| Mất dữ liệu sau khi xóa cache/site data       | Nếu IndexedDB bị xóa, dùng bản JSON đã lưu. Hosting và GitHub không chứa bản sao dữ liệu cá nhân của bạn.                                                                    |

## 10. Phạm vi đã kiểm tra

Kiểm thử tự động chạy trên bản production bằng Chromium ở kích thước laptop và điện thoại, có thử tải lại offline và ghi giao dịch. Việc xác nhận cửa sổ cài đặt, biểu tượng hệ điều hành, Safari iOS và chính sách trình duyệt cần thực hiện trên thiết bị thật theo các bước ở trên. Chưa thực hiện deploy vào tài khoản Netlify của bạn; URL thực tế chỉ có sau khi bạn kết nối và publish project.

Tài liệu tham khảo khi cần: [Netlify file-based configuration](https://docs.netlify.com/build/configure-builds/file-based-configuration/), [Chrome web apps](https://support.google.com/chrome/answer/9658361), [Apple: Turn a website into an app](https://support.apple.com/guide/iphone/turn-a-website-into-an-app-iph42ab2f3a7/ios).
