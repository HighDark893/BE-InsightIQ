// import { CorsOptions } from 'cors';

// const corsConfig: CorsOptions = {
//   origin: 'http://localhost:4200',
//   'http://127.0.0.1:5500',
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: [
//     'Content-Type',
//     'Authorization',
//     'X-Requested-With',
//     'Accept',
//     'Origin',
//     'Access-Control-Allow-Origin',
//   ],
// };

// export default corsConfig;

//===============================PHẦN PHƯỚC CHỈNH==============================
// File: ./config/cors.config.ts

import { CorsOptions } from 'cors';

// Danh sách các nguồn gốc (domains) được phép truy cập API của bạn
const allowedOrigins: string[] = [
  'http://localhost:4200', // Cho ứng dụng Angular FE_InsightIQ của bạn
  'http://127.0.0.1:5500', // Cho trang ShopX bạn đang test local
  'http://127.0.0.1:5501',
  // Khi có khách hàng thực tế, bạn sẽ thêm domain của họ vào đây, ví dụ:
  // 'https://www.khachhangA.com',
  // 'https://trangwebcuakhachhangB.vn'
];

const corsConfig: CorsOptions = {
  origin: function (origin, callback) {
    // Nếu origin của yêu cầu nằm trong danh sách allowedOrigins, hoặc nếu không có origin (ví dụ: request từ Postman, mobile app)
    // thì cho phép.
    // '!origin' cho phép các request không có header 'Origin' (ví dụ: server-to-server, curl, Postman)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // console.warn(Origin ${origin} không được phép bởi CORS.); // Log lại để debug nếu cần
      // callback(new Error(Origin ${origin} không được phép bởi chính sách CORS.));
    }
  },
  credentials: true, // Rất quan trọng nếu widget của bạn gửi/nhận cookies hoặc headers xác thực
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Các phương thức HTTP được phép
  allowedHeaders: [
    // Các headers được phép trong yêu cầu
    'Content-Type', // Sửa 'Content-type' thành 'Content-Type' (chuẩn hơn)
    'Authorization',
    'X-Requested-With', // Sửa 'X-Requested-with' thành 'X-Requested-With'
    'Accept',
    'Origin',
    // 'Access-Control-Allow-Origin', // Header này do server tự thêm, không cần client gửi lên
  ],
  optionsSuccessStatus: 200, // một số trình duyệt cũ có thể gặp vấn đề với status 204 mặc định
};

export default corsConfig;
