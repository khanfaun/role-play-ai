# Game Nhập Vai AI

Đây là một game nhập vai được hỗ trợ bởi AI, nơi AI đóng vai trò là Người Quản Trò (Game Master). Phiên bản này đã được tái cấu trúc để sử dụng một máy chủ backend nhằm quản lý API key của Gemini một cách an toàn và hiệu quả.

## Hướng dẫn Chạy Dự án

### Yêu cầu cần có

- [Node.js](https://nodejs.org/) (khuyến nghị phiên bản 18.x trở lên)
- `npm` (thường đi kèm với Node.js)

### 1. Cài đặt API Key của bạn

Trước khi bắt đầu, bạn cần cung cấp (các) API key Google Gemini của mình. Máy chủ được thiết kế để luân phiên sử dụng nhiều key, giúp tăng độ ổn định.

1.  Tạo một file mới tên là `.env` trong thư mục gốc của dự án.
2.  Mở file `.env` và thêm các API key của bạn theo định dạng sau:

    ```
    API_KEYS="KEY_THU_NHAT,KEY_THU_HAI,KEY_THU_BA,..."
    ```

    - Thay thế `KEY_THU_NHAT`, `KEY_THU_HAI` bằng các key thực tế của bạn.
    - Đặt tất cả các key trên cùng một dòng, phân tách bởi dấu phẩy (`,`).
    - **Ví dụ:** `API_KEYS="AIzaSyABC...,AIzaSyXYZ..."`

### 2. Cài đặt các Gói phụ thuộc

Mở terminal của bạn trong thư mục gốc của dự án và chạy lệnh sau để cài đặt tất cả các gói cần thiết cho máy chủ:

```bash
npm install
```

### 3. Khởi động Máy chủ

Sau khi cài đặt hoàn tất, hãy khởi động ứng dụng bằng lệnh này:

```bash
npm start
```

Lệnh này sẽ khởi động máy chủ backend. Bạn sẽ thấy một thông báo trong terminal tương tự như:

```
Server is running on http://localhost:3000
Đã tải thành công 2 API key. Máy chủ sẵn sàng hoạt động.
```

### 4. Chơi Game

Mở trình duyệt web của bạn và truy cập địa chỉ sau:

[http://localhost:3000](http://localhost:3000)

Game sẽ được tải và bạn có thể bắt đầu cuộc phiêu lưu mới của mình!

## Cấu trúc Dự án

- `/public`: Chứa tất cả các file frontend (HTML, CSS, các thành phần React).
- `server.js`: Máy chủ backend Node.js Express phục vụ frontend và làm proxy cho các yêu cầu đến Gemini API, với logic luân phiên và thử lại API key.
- `package.json`: Định nghĩa các gói phụ thuộc và các script của dự án.
- `.env`: (Bạn tự tạo file này) Lưu trữ (các) API key bí mật.