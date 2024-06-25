# Triển khai

## Cách mở ứng dụng
Ứng dụng của em được triển khai và thử nghiệm trên localhost. Dưới đây là hướng dẫn chi tiết về cách mở và chạy ứng dụng:
### Backend (Phía máy chủ)
1. Cài đặt các thư viện cần thiết bằng cách chạy lệnh `npm install` trong thư mục dự án Express.js.
2. Cấu hình Firebase Firestore bằng cách tạo tệp `.env` và thêm các biến môi trường liên quan đến Firebase:
    ```plaintext
    TOKEN_SECRET="jwt_key"
    EXPO_PUSH_NOTIFICATION="link_expo_notification"
    SERVICE_ACCOUNT_KEY_PATH="your_path_service_firebase"
    DATABASE_URL="your_database_link"
    ADMIN_EMAIL="email_for_sender"
    ADMIN_PASSWORD="email_password"
    SECRET_KEY_STRIPE="your_secret_key_stripe"
    ```
3. Sau khi cài đặt và cấu hình xong, chạy lệnh `npm start` để khởi động server backend trên localhost.
4. Backend sẽ chạy trên địa chỉ `http://localhost:3000` hoặc cổng được chỉ định trong tệp cấu hình.

### Cơ sở dữ liệu
Firebase Firestore được cấu hình trong cả frontend và backend, không cần thao tác thủ công để khởi động. Chỉ cần đảm bảo rằng các biến môi trường và cấu hình Firebase được thiết lập đúng trong cả hai dự án.

## Lưu ý khi mở ứng dụng
1. Đảm bảo rằng các phần mềm và công cụ như Node.js, npm và Expo CLI đã được cài đặt trên máy tính của bạn.
2. Kiểm tra kết nối internet để đảm bảo rằng ứng dụng có thể kết nối với Firebase Firestore.
3. Đảm bảo rằng các cổng (như 5173 cho frontend và 5000 cho backend) không bị các dịch vụ khác chiếm dụng.
4. Khi chạy ứng dụng di động trên Expo, đảm bảo thiết bị di động và máy tính đang kết nối cùng một mạng WiFi.
