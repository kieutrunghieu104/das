# Business Rules - SmileCare

## 1. Tài khoản và phân quyền

- Bảng `users` chỉ lưu thông tin đăng nhập và thông tin chung: họ tên, email, số điện thoại, mật khẩu, vai trò, trạng thái.
- Thông tin riêng của từng vai trò được tách sang `patients`, `dentists`, `nurses`, `receptionists`, `adminprofiles`.
- Collection `roles` chỉ lưu các vai trò thật của hệ thống: `admin`, `receptionist`, `dentist`, `nurse`, `patient`.

## 2. Đặt lịch

- Bệnh nhân hoặc lễ tân được đặt lịch với dịch vụ, ngày khám và slot khám hợp lệ.
- Ngày đặt lịch không được nhỏ hơn ngày hiện tại và không được vượt quá giới hạn đặt trước của hệ thống.
- Một bệnh nhân không được đặt trùng một slot trong cùng một ngày.
- Lịch do lễ tân đặt hộ có kênh `offline` và được đưa vào danh sách chờ xác nhận/xếp lịch.

## 3. Lễ tân

- Lễ tân xác nhận hoặc từ chối lịch hẹn.
- Khi xác nhận, lễ tân sắp xếp bác sĩ, y tá, phòng khám và giờ đến cho bệnh nhân.
- Khi bệnh nhân đến, lễ tân check-in để chuyển lịch sang luồng khám của y tá và bác sĩ.
- Nếu bệnh nhân không đến, lễ tân đánh dấu vắng mặt.

## 4. Khám và hồ sơ điều trị

- Y tá và bác sĩ chỉ xử lý các lịch khám được phân công.
- Y tá cập nhật trạng thái đang khám và hoàn tất theo luồng khám.
- Hồ sơ điều trị được cập nhật theo thứ tự lần 1, lần 2, lần 3...
- Ngày điều trị lấy theo ngày y tá nhập trên form, không tự lấy thời gian local của máy.
- Bác sĩ chỉ xem hồ sơ điều trị, không chỉnh sửa hồ sơ.

## 5. Dịch vụ và hóa đơn

- Giá dịch vụ lưu dạng string để hỗ trợ giá cố định hoặc khoảng giá, ví dụ `200000-500000`.
- Hóa đơn chỉ tạo khi có dịch vụ phát sinh hoặc lễ tân chủ động tạo từ lịch hoàn tất.
- Hóa đơn ghi rõ dịch vụ, số tiền từng dịch vụ, tổng tiền, phương thức thanh toán và lịch sử từng lần thanh toán.
- Khi trả góp theo tháng, hệ thống chia số tiền theo kỳ 3, 6 hoặc 9 tháng và lưu thời gian của từng lần thanh toán.
