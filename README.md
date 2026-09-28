# Hướng dẫn sử dụng website SUNÉA

## 1. Khởi động website bằng CMD

Trước khi chạy, hãy mở WampServer và bảo đảm dịch vụ MySQL đang hoạt động.

Mở **Command Prompt (CMD)** rồi chạy toàn bộ các lệnh sau:

```bat
cd /d D:\AI\fashion-store
start "SUNEA Backend" cmd /k "cd /d D:\AI\fashion-store\backend && C:\wamp64\bin\php\php8.3.28\php.exe artisan serve --host=127.0.0.1 --port=8000"
start "SUNEA Frontend" cmd /k "cd /d D:\AI\fashion-store\frontend && npm.cmd run dev -- --host=127.0.0.1"
```

Hai cửa sổ CMD sẽ được mở:

- `SUNEA Backend`: API Laravel tại `http://127.0.0.1:8000`.
- `SUNEA Frontend`: giao diện React tại `http://127.0.0.1:5173`.

Truy cập website tại:

```text
http://127.0.0.1:5173
```

Để dừng website, đóng hai cửa sổ CMD trên hoặc nhấn `Ctrl + C` trong từng cửa sổ.

### Lỗi cổng đang được sử dụng

Nếu cổng `8000` hoặc `5173` đã bị một tiến trình cũ chiếm, mở CMD với quyền quản trị và chạy:

```bat
for /f "tokens=5" %a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /F /PID %a
for /f "tokens=5" %a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do taskkill /F /PID %a
```

Sau đó chạy lại các lệnh khởi động ở trên.

## 2. Cài đặt lần đầu

Yêu cầu:

- WampServer với PHP `8.3` và MySQL.
- Node.js và npm.
- Composer tại `D:\AI\tools\composer.bat`.
- Database MySQL tên `fashion_store`.

### Cài backend

```bat
cd /d D:\AI\fashion-store\backend
D:\AI\tools\composer.bat install
copy .env.example .env
C:\wamp64\bin\php\php8.3.28\php.exe artisan key:generate
C:\wamp64\bin\php\php8.3.28\php.exe artisan migrate --seed
C:\wamp64\bin\php\php8.3.28\php.exe artisan storage:link
```

Nếu `backend\.env` đã tồn tại thì không cần chạy lại lệnh `copy`. Kiểm tra thông tin MySQL trong file này trước khi migrate:

```env
DB_DATABASE=fashion_store
DB_USERNAME=root
DB_PASSWORD=
```

### Cài frontend

```bat
cd /d D:\AI\fashion-store\frontend
npm.cmd install
copy .env.example .env
```

Nếu `frontend\.env` đã tồn tại thì không cần sao chép lại. API mặc định phải là:

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

## 3. Tài khoản mẫu

| Vai trò | Email | Mật khẩu |
| --- | --- | --- |
| Quản trị viên | `admin@example.com` | `Admin@123456` |
| Khách hàng | `minh@example.com` | `Customer@123456` |

Các tài khoản mẫu được tạo bằng `php artisan migrate --seed` hoặc `php artisan db:seed`.

## 4. Chức năng dành cho khách hàng

Khách chưa đăng nhập có thể:

- Xem trang chủ và câu chuyện thương hiệu.
- Xem, tìm kiếm và lọc sản phẩm theo danh mục.
- Xem sản phẩm nổi bật, sản phẩm khuyến mãi và combo mùa hè.
- Xem chi tiết sản phẩm, size, tồn kho, ảnh và đánh giá.
- Đăng ký hoặc đăng nhập tài khoản.

Khách đã đăng nhập có thể:

- Thêm sản phẩm hoặc combo vào giỏ hàng.
- Dùng mã giảm giá và đặt hàng.
- Quản lý địa chỉ nhận hàng.
- Xem lịch sử và trạng thái đơn hàng.
- Hủy đơn khi trạng thái cho phép.
- Gửi yêu cầu đổi hàng, trả hàng hoặc hoàn tiền.
- Quản lý danh sách yêu thích.
- Đánh giá sản phẩm đã mua.
- Đổi mật khẩu tài khoản.

Sản phẩm thời trang sử dụng bốn size: `S`, `M`, `L`, `XL`. Website không sử dụng lựa chọn màu sắc.

## 5. Chức năng dành cho quản trị viên

Đăng nhập bằng tài khoản quản trị sẽ tự chuyển đến:

```text
http://127.0.0.1:5173/admin
```

Quản trị viên có thể:

- Xem tổng quan doanh thu, khách hàng, sản phẩm và đơn hàng.
- Thêm, sửa, xóa và ẩn sản phẩm.
- Tải nhiều ảnh sản phẩm; ảnh đầu tiên là ảnh chính.
- Thay hoặc xóa ảnh, file ảnh cũ được dọn khi không còn sử dụng.
- Quản lý size, SKU và tồn kho của sản phẩm.
- Tạo, sửa và xóa combo sản phẩm.
- Quản lý đơn hàng và cập nhật trạng thái xử lý.
- Duyệt yêu cầu đổi, trả hoặc hoàn tiền.
- Quản lý khách hàng và đánh giá.
- Gắn ưu đãi cho sản phẩm.
- Tạo, sửa, bật, tắt hoặc xóa mã giảm giá.

## 6. Dữ liệu mẫu và ảnh sản phẩm

Chạy lại seeder mà không xóa dữ liệu:

```bat
cd /d D:\AI\fashion-store\backend
C:\wamp64\bin\php\php8.3.28\php.exe artisan db:seed
```

Ảnh nguồn của dữ liệu mẫu nằm tại:

```text
backend\database\seeders\assets
```

Ảnh được website phục vụ qua Laravel Storage. Nếu ảnh không hiển thị, chạy:

```bat
cd /d D:\AI\fashion-store\backend
C:\wamp64\bin\php\php8.3.28\php.exe artisan storage:link
```

## 7. Kiểm tra mã nguồn

### Frontend

```bat
cd /d D:\AI\fashion-store\frontend
npm.cmd run lint
npm.cmd run build
```

### Backend

```bat
cd /d D:\AI\fashion-store\backend
C:\wamp64\bin\php\php8.3.28\php.exe artisan test --compact
```

## 8. Cấu trúc dự án

```text
fashion-store\
├── backend\                 Laravel API, database, ảnh và nghiệp vụ
│   ├── app\                 Controller, model, service, resource
│   ├── database\            Migration, seeder và dữ liệu mẫu
│   ├── routes\api.php       Các API của khách hàng và quản trị viên
│   └── tests\Feature        Kiểm thử nghiệp vụ
├── frontend\                Giao diện React và Vite
│   ├── public\              Video, ảnh thương hiệu và favicon
│   └── src\                 Trang, component, context và API service
└── README.md                File hướng dẫn này
```

Không xóa migration đã được áp dụng, thư mục `backend\vendor`, `frontend\node_modules` hoặc các file `.gitignore` trong `storage`; đây là những thành phần cần thiết để cài đặt và vận hành dự án.
