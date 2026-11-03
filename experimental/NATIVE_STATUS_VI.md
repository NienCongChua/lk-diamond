# Photobooth trong Locket: chưa tích hợp xong

Khung trống trước đây là PNG overlay có vùng trong suốt. Nó không có ảnh vì chưa có cầu nối lấy ảnh camera từ Locket. Thêm PNG vào kho GitHub hoặc thêm tên khung vào Remote Config chưa tự tạo được cầu nối này.

## Đã chạy trong dự án

- 13 artwork AI có nơ, ren, mèo, khủng long, hoa, film và sticker trang trí.
- Sáu bố cục: 2×2, dải ba, dải bốn, đôi dọc, một lớn + hai nhỏ và Polaroid.
- Ghép các ảnh đầu vào theo thứ tự; đủ số ảnh mới đánh dấu hoàn tất; gửi lại cùng request không nhân đôi ảnh.
- Giữ tỉ lệ khung hoặc đặt nguyên khung trên nền vuông, không kéo méo artwork.
- Xem trước bằng ảnh mẫu AI, có ghi rõ nguồn minh họa. Bộ ghép không dùng AI để sửa khuôn mặt người dùng.

Các chức năng trên đã kiểm thử với Python/HTTP trên máy tính. `Locket-Custom.sgmodule` hiện chỉ xử lý cấu hình và caption; `Locket-Filter-Probe.sgmodule` chỉ quan sát cấu trúc, không ghép ảnh.

## Phần chưa có

Chưa có request/response filter thật hoặc mã nguồn module Photobooth đang chạy để xác định điểm nhận và trả ảnh. Chưa biết ứng dụng đợi byte ảnh, URL ảnh hay kết quả tác vụ, và cách đăng ký filter tùy chỉnh trong phiên bản đó. Lõi Python cũng không chạy trực tiếp trong runtime JavaScript của Shadowrocket; localhost PC không phải dịch vụ mà iPhone truy cập được.

Để viết và kiểm tra cầu nối, cần bằng chứng giao thức từ một lần dùng filter trên thiết bị hoặc nguồn module hoạt động. Chỉ cần dữ liệu cấu trúc đã lược bỏ thông tin riêng tư; không cần mật khẩu, token tài khoản hoặc ảnh cá nhân. Sau đó mới có thể chọn chỗ chạy bộ ghép, nối thao tác chụp/chụp lại và thử ảnh trả về trong Locket. Không gán ID hay endpoint tự đoán vào module.

## Bằng chứng đã đối chiếu

- [Video người dùng cung cấp](https://www.tiktok.com/@_if.hau.8/video/7703865188545465620) có mục Photobooth và trạng thái lưu ảnh 1/4; chưa có nguồn module hoặc giao thức đi kèm.
- [Google Cloud: Locket](https://cloud.google.com/customers/locket) mô tả Looks xử lý ảnh bằng mô hình trên hạ tầng Google. Tài liệu này không công bố hợp đồng API filter để viết adapter.
- [Module usatalk/nca](https://github.com/usatalk/nca) và các nguồn công khai đã kiểm tra chỉ cho thấy cấu hình danh sách filter trong phần liên quan; chưa tìm được mã thực hiện chuỗi Photobooth trong ứng dụng.

Đây là giới hạn bằng chứng của bản hiện tại, không phải kết luận rằng mọi cách tích hợp Photobooth vào Locket đều bất khả thi.
