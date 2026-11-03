# Locket Custom v1.0 + Little Moments Photobooth

Bản sửa cá nhân từ module anh cung cấp, kiểm tra mã ngày 03/11/2026.

**Tình trạng:** script đã được kiểm tra với dữ liệu giả lập. Chưa chạy trên iPhone/Shadowrocket hoặc xác nhận với máy chủ Locket. Bộ Photobooth là công cụ ghép ảnh độc lập; bản này **chưa thêm được bố cục Photobooth vào giao diện Locket**. Không có khóa cấu hình Photobooth đáng tin cậy trong nguồn đã kiểm tra, nên không chèn các khóa đoán tên rồi coi là đã hỗ trợ.

## Có gì trong gói

- `scripts/locket-custom.js`: một script chung xử lý Remote Config, ETag và phản hồi thuê bao.
- `Locket-Custom.local.sgmodule`: module tham chiếu script cục bộ `locket-custom.js`; cần nhập/ánh xạ script trước khi dùng.
- `photobooth/photobooth.html`: công cụ ghép ảnh độc lập, không cần tài khoản, xử lý ngay trên thiết bị.
- `photobooth/frames/`: 48 khung PNG có ô ảnh trong suốt, tạo từ 6 bố cục × 8 kiểu khung.
- `photobooth/layouts.json`: kích thước và tọa độ bố cục cho công cụ ghép ảnh; **không phải schema API Locket**.
- `scripts/locket-diagnostics.js` và `Locket-Diagnostics.local.sgmodule`: đọc cấu trúc khóa liên quan khung/bố cục, không sửa phản hồi; chỉ ghi tên khóa và kiểu dữ liệu.
- `scripts/locket-filter-probe.js` và `Locket-Filter-Probe.local.sgmodule`: bản dò API khi bấm filter trong Locket; xem cách thử tại `experimental/TRY_NATIVE_VI.txt`.
- `experimental/native_photobooth.py`: lõi thử nghiệm giữ ảnh qua nhiều lần chụp và ghép khung, có 8 mẫu với 10 loại sticker. **Chưa có adapter nối với Locket**; ảnh mẫu trong `experimental/demo/` là ảnh giả lập.
- `experimental/photobooth_server.py` và `photobooth_client.py`: dịch vụ HTTP localhost + client nhận ảnh, đổi khung, xem trước và lấy ảnh hoàn tất. API do dự án tự định nghĩa, không phải API Locket. Chạy thử bằng `python experimental/photobooth_http_demo.py`; xem `START_HERE_VI.txt` và `experimental/LOCAL_API_VI.txt`.
- `experimental/frames-ai/`: 8 khung PNG v2 tạo bằng imagegen, có bốn ô ảnh trong suốt. Bộ ghép thử đã dùng chúng mặc định cho bố cục `grid4`; năm bố cục còn lại vẫn dùng khung vẽ bằng code. Prompt đầy đủ ở `frames-ai/prompts.json`; vị trí ô ảnh ở `photobooth_presets.json`. File PNG gốc được giữ nguyên alpha, không khoét hay vẽ lại bằng code.
- `experimental/demo/frames-ai-preview.png`: bảng xem trước 8 khung mới trên nền trung tính. `Photobooth-AI-Frames.zip`: bộ PNG, prompt và thông số đặt ảnh.
- `tools/make_module.py`: tạo module dùng URL HTTPS do anh quản lý hoặc đường dẫn script cục bộ.
- `tests/`: kiểm tra script và giao diện. `VALIDATION.txt`: kết quả kiểm tra trong môi trường này.

## Những điểm đã sửa

1. Chỉ sửa khi URL đúng phạm vi và User-Agent bắt đầu bằng `Locket` hoặc `com.locket.Locket` với ranh giới rõ ràng. Thiếu hoặc không nhận diện User-Agent thì bỏ qua. Bộ lọc này không phải xác thực mật mã; một ứng dụng giả User-Agent vẫn có thể khớp.
2. Không còn nhánh thêm quyền `pro` vào ứng dụng khác. Chỉ xử lý `/v1/receipts` và `/v1/subscribers/{id}`, không sửa các đường dẫn phụ như attributes/offerings.
3. ETag được xóa theo tên header không phân biệt hoa thường và chỉ trong phạm vi Locket. Không xóa Authorization.
4. JSON lỗi, HTTP lỗi, thiếu dữ liệu, dữ liệu sai kiểu hoặc phản hồi quá lớn: trả nguyên phản hồi bằng `$done({})`. Kết thúc đúng một lần.
5. Gom thời lượng, dung lượng, bitrate, bạn bè và nhóm tùy chọn vào `SETTINGS`. Sửa chuỗi bitrate `"0."` thành giá trị hợp lệ `"0.6"`. Giới hạn giá trị nhập để tránh số vô lý.
6. Gộp cấu hình đối tượng với dữ liệu cũ để giữ các trường khác của máy chủ. Cấu hình lồng nhau không đọc được thì giữ nguyên trường đó.
7. Giữ 132 ID caption gốc khác nhau, loại một ID trùng `caption:ua_alo`; thêm 12 caption cá nhân. Tổng mặc định 144 mục khi đầu vào trống. Giữ các caption riêng của máy chủ. Không chèn lặp sau nhiều lần chạy.
8. Bỏ popup quảng bá mặc định, hai URL ảnh i.ibb.co, URL mạng xã hội không hợp lệ, các khung giả định như `royal_crown_frame`, cấu hình paywall/upsell ghi đè toàn bộ, và các cờ ép gợi ý/cấp quyền danh bạ. Khung máy chủ hiện tại được giữ nguyên nếu không nhập URL riêng.
9. Ngày mô phỏng thuê bao thống nhất, bỏ giá và mã giao dịch giả từ bản cũ. Không sửa quyền Gold đang còn hạn/vĩnh viễn hoặc ghi đè bản ghi sản phẩm `locket_1600_1y` đang có.
10. Không tải script của tác giả gốc khi chạy, không gọi API gửi dữ liệu, không lưu thông tin đăng nhập, không log body hoặc token. Debug mặc định tắt.

Các cờ tính năng, danh sách 35 filter và schema caption được kế thừa từ nguồn anh đưa; chưa xác nhận toàn bộ được phiên bản Locket của anh sử dụng. Cờ “priority_support”, “unlimited_friends”... không chứng minh máy chủ cấp các quyền đó. Thay ngày thuê bao trong phản hồi không tạo giao dịch App Store. `goldResponseOverride` có thể tắt riêng; tài khoản có Gold thật đang còn hạn được giữ nguyên.

## Cài bản cục bộ

1. Tắt module Locket cũ để tránh hai bộ rewrite ghi đè nhau. Giữ bản cũ để có thể quay lại.
2. Nhập hoặc tạo script trong nơi quản lý script của Shadowrocket từ `scripts/locket-custom.js`.
3. Đảm bảo `script-path=locket-custom.js` trong cả ba dòng module trỏ đúng đến script đã nhập. Nếu Shadowrocket lưu bằng đường dẫn khác, sửa cả ba dòng thành đường dẫn đó. Chép JS cạnh file module trong ứng dụng Files chưa chắc đã ánh xạ đúng thư mục script của Shadowrocket.
4. Nhập `Locket-Custom.local.sgmodule`, bật module và Shadowrocket. Các rule HTTPS cần HTTPS Decryption/MITM và chứng chỉ CA được thiết bị tin cậy. Module không chứa chứng chỉ và không tự cấu hình proxy.
5. Đóng/mở lại Locket để ứng dụng có cơ hội tải cấu hình mới. Không cần xóa ứng dụng hay dữ liệu tài khoản. Cấu hình cache có thể khiến thay đổi chưa hiện ngay.

**File `.sgmodule` không nhúng mã JS.** Chỉ nhập module mà chưa nhập/ánh xạ script sẽ không hoàn tất cài đặt. Tên menu và cách nhập script tùy phiên bản Shadowrocket; chưa xác nhận các bước UI trên thiết bị của anh. Nếu cách cục bộ không thuận tiện, dùng URL HTTPS dưới đây.

## Cài bằng URL do anh quản lý

Đặt thư mục `scripts` lên repository hoặc host HTTPS của anh. Sau khi có URL gốc trả nội dung file thô, chạy:

```bash
python3 tools/make_module.py --base-url 'URL_GOC_HTTPS_CUA_ANH' --out generated
```

`URL_GOC_HTTPS_CUA_ANH` là chỗ thay bằng URL thực, không phải URL cài sẵn. Công cụ sẽ tạo `generated/Locket-Custom.sgmodule` trỏ tới `URL_GOC_HTTPS_CUA_ANH/scripts/locket-custom.js` và module chẩn đoán tương ứng. Nên dùng URL cố định theo commit để tránh mã tự thay đổi. Không đưa log tài khoản hay dữ liệu cá nhân lên repository.

Link Raw của kho `NienCongChua/lk-diamond` và các gói tải về được liệt kê tại `README.md`. Dùng file không có hậu tố `.local` để cài bằng URL; `script-path` đã trỏ đến commit cụ thể trên GitHub.

## Tùy chỉnh

Mở đầu `scripts/locket-custom.js` và sửa đối tượng `SETTINGS`:

| Tùy chọn | Mặc định | Ý nghĩa |
|---|---|---|
| `goldResponseOverride` | `true` | Mô phỏng quyền Gold trong phản hồi cục bộ; không nâng cấp trên máy chủ |
| `videoSeconds` | `45` | Thời lượng yêu cầu, chặn giá trị ngoài khoảng 1–120 giây |
| `maxUploadMiB` | `100` | Dung lượng yêu cầu, giới hạn 1–100 MiB |
| `videoMbps` | `0.6` | Bitrate yêu cầu; chưa chắc ứng dụng đọc khóa này |
| `maxFriends` | `999999` | Giá trị cấu hình; máy chủ có thể giới hạn riêng |
| `hideAds`, `disableSentry` | `true` | Ghi các cờ tương ứng; không đảm bảo chặn toàn bộ quảng cáo/telemetry |
| `includeOriginalCaptions` | `true` | Thêm bộ caption từ bản gốc |
| `includeOriginalFilters` | `true` | Bật các cờ filter; dùng danh sách cũ khi danh sách máy chủ thiếu hoặc rỗng, giữ nguyên danh sách mới đang có |
| `customCaptions` | 12 mục | Sửa chữ, emoji, gradient, màu chữ; ID bắt đầu bằng `nien_` |
| `widgetFrameImageURL` | rỗng | Giữ khung widget máy chủ; chỉ đặt URL HTTPS khi có asset/schema tương thích |
| `debug` | `false` | Chỉ log thông báo chung |

Không dùng trực tiếp các PNG Photobooth làm `widgetFrameImageURL` rồi kỳ vọng có bố cục chụp nhiều ảnh. Khung widget và ảnh ghép Photobooth là hai cơ chế khác nhau; tỷ lệ và cách vẽ asset widget chưa được kiểm tra.

## Dùng Photobooth

Mở `photobooth/photobooth.html` bằng trình duyệt có JavaScript và Canvas. Trên máy tính có thể mở trực tiếp. Nếu ứng dụng Files/Quick Look trên iPhone chỉ hiện bản xem trước hoặc không chạy JS, cần mở file qua một môi trường trình duyệt/host anh tin cậy; gói này chưa có bản website công khai. Có thể thử trên máy tính bằng `python3 -m http.server 8080` tại thư mục gói rồi mở `http://localhost:8080/photobooth/photobooth.html`.

1. Thêm 1–4 ảnh JPG/PNG/WebP (tối đa 20 MB/ảnh). HEIC phụ thuộc khả năng trình duyệt; nếu lỗi thì chuyển ảnh sang JPG/PNG.
2. Chọn bố cục: Polaroid, đôi dọc, dải 3, dải 4, lưới 2×2, một lớn + hai nhỏ.
3. Chọn khung: kem, hồng, film, tím, xanh lá, bầu trời, đen trắng, vàng.
4. Đổi thứ tự ảnh, vị trí cắt, màu/đen trắng, caption và ngày. Có thể thêm 4 ảnh rồi chuyển bố cục; bố cục ít ô dùng các ảnh đầu tiên.
5. Mặc định xuất vuông 1600×1600 để giữ trọn bố cục. Bỏ tùy chọn vuông để xuất tỷ lệ gốc; ảnh dọc có thể bị ứng dụng đích cắt.
6. Bấm **Lưu PNG** hoặc **Chia sẻ ảnh** nếu trình duyệt hỗ trợ. Nếu ảnh tải về nằm trong Files, mở ảnh và lưu vào Photos trước khi chọn trong Locket.
7. Nút **Tải khung PNG trong suốt** hoạt động cả khi chưa thêm ảnh. Những ô để đặt ảnh được khoét trong suốt.

Ảnh không gửi ra mạng. Công cụ không yêu cầu mật khẩu, không tự đăng ảnh lên Locket, không có xử lý AI. Việc chọn ảnh từ thư viện trong Locket phụ thuộc quyền tài khoản và phiên bản của anh.

## Muốn tích hợp Photobooth vào chính Locket

Đã kiểm tra video https://www.tiktok.com/@_if.hau.8/video/7703865188545465620: có bảng chọn Photobooth và trạng thái lưu ảnh 1/4, hướng dẫn bấm X để chụp tiếp. Video chưa cung cấp giao thức xử lý ảnh, mã module hoặc bằng chứng rằng chỉ sửa Remote Config là đủ.

Bản thử ngày 03/11/2026 có hai phần:

- Sửa việc ghi đè `sheet_filters`/`picker_filters` bằng danh sách 35 ID cũ: giữ nguyên danh sách không rỗng do máy chủ trả về. Đây không phải xác nhận filter đã hoạt động.
- Bộ dò `Locket-Filter-Probe.local.sgmodule` dành cho trường hợp có nút nhưng filter chưa chạy. Mặc định bộ dò chỉ đọc `api.locketcamera.com`, có thể bật cùng module Custom. Nó không đọc request body chứa ảnh, không gọi HTTP mới, không lưu dữ liệu, không ghi giá trị chuỗi hoặc header. Response JSON chỉ ghi tên trường trong danh sách cho phép, kiểu dữ liệu và mã HTTP; ảnh và URL bị lược bỏ. Response quá lớn có thể bị runtime bỏ qua.

Hướng dẫn thử cụ thể: `experimental/TRY_NATIVE_VI.txt`. Chưa có endpoint và mẫu request/response xử lý filter thực tế, nên chưa tạo adapter gửi ảnh, chưa chèn ID Photobooth tự đặt vào Locket. Lõi Python chỉ có thể chạy trên máy/host có Python và Pillow, không chạy trực tiếp trong Shadowrocket. Không có máy chủ ảnh được triển khai, không tự động gửi ảnh của anh đi đâu.

Dịch vụ ảnh thử nghiệm trên localhost đã chạy qua HTTP với 4 ảnh giả lập, gửi lại request và đổi khung sau khi chụp. Dịch vụ tự dọn phiên, kiểm tra token local và không gọi API bên ngoài. Đã dừng dịch vụ sau khi kiểm tra; iPhone chưa kết nối được tới địa chỉ loopback của máy tính. `Locket-Filter-Trial.zip` chứa mã, tài nguyên, kiểm thử và hướng dẫn; `Locket-iPhone-Probe.zip` là gói nhỏ chỉ để thử module dò trên điện thoại.

Bộ ghép mới trong `experimental/` đã có **13 khung AI cho cả sáu bố cục**. Khung dải ba/bốn ảnh, đôi dọc, Polaroid và một lớn + hai nhỏ có artwork riêng; khung và bố cục không phù hợp sẽ bị từ chối để tránh mất ô ảnh. Mặc định xuất đúng tỉ lệ khung với cạnh dài 1600 px; `output=square` thêm nền vuông mà không kéo méo ảnh. Thư viện xem trước `experimental/demo/frames-ai-preview.png` đã có ảnh mẫu AI trong khung. Các chức năng này vẫn thuộc bộ xử lý trên máy tính, chưa nằm trong camera Locket; xem `experimental/NATIVE_STATUS_VI.md`.

Nếu cần kiểm tra riêng cấu hình máy chủ thay vì thao tác filter, vẫn dùng bộ chẩn đoán cấu trúc cũ:

1. Tắt module tùy chỉnh và các module Locket khác.
2. Nhập `locket-diagnostics.js`, ánh xạ đường dẫn trong `Locket-Diagnostics.local.sgmodule`, bật module chẩn đoán.
3. Mở Locket và xem log script nếu có lần tải Remote Config mới.
4. Chỉ lấy dòng bắt đầu `[Locket schema only]`. Script không ghi nội dung chuỗi, header hoặc token. Không cần gửi log mạng đầy đủ.
5. Tắt chẩn đoán sau khi dùng. Thông tin phiên bản Locket/iOS và cấu trúc khóa sẽ giúp xác định tính năng có tồn tại trong app và có thể điều khiển bằng Remote Config hay không.

Ngay cả khi có khóa Photobooth, chưa thể bảo đảm sửa config là đủ: ứng dụng có thể không chứa renderer tương ứng hoặc máy chủ áp quyền riêng.

## Hoàn tác

Tắt module mới; bật lại bản cũ nếu muốn. Chỉnh sửa phản hồi dừng từ thời điểm đó. Cache có thể giữ giao diện cũ cho tới khi ứng dụng lấy cấu hình mới. Không cần xóa tài khoản hay gỡ ứng dụng để hoàn tác mã rewrite.

## Nguồn và giới hạn

- Module nguồn: https://raw.githubusercontent.com/usatalk/nca/main/locket.sgmodule
- Script nguồn: https://raw.githubusercontent.com/usatalk/my-script/main/locket.js
- Script thuê bao nguồn: https://raw.githubusercontent.com/usatalk/my-script/main/locket_sub.js
- ETag nguồn: https://raw.githubusercontent.com/usatalk/my-script/main/deleteHeader.js
- Mô hình Remote Config: https://firebase.google.com/docs/remote-config
- Xác minh entitlement: https://www.revenuecat.com/docs/customers/trusted-entitlements

Giữ ghi nhận tác giả nguyencongan và DINH DUY VINH 09 từ nguồn. Chưa xác minh giấy phép phân phối của nguồn; gói này là bản sửa cá nhân theo yêu cầu của anh, không tuyên bố quyền sở hữu hoặc cấp lại giấy phép cho phần kế thừa.
