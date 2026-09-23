# Toeic.Web

Frontend React + TypeScript cho nền tảng luyện TOEIC.

## Phạm vi

- `/auth/*`: đăng nhập, đăng ký và xác minh tài khoản.
- `/learn/*`: dashboard, luyện tập, attempt, kết quả và sổ lỗi.
- `/admin/*`: content operations và quality dashboard.

Ứng dụng gọi `Toeic.Api` qua biến môi trường `VITE_API_BASE_URL`. Không đặt credential, answer key, solver evidence hoặc quyền người dùng trong source frontend.

## Cấu trúc dự kiến

```text
src/Toeic.Web/
├── public/                  # Static assets công khai
├── src/
│   ├── app/                 # Router, providers, app shell
│   ├── assets/              # Ảnh và font do dự án sở hữu/quyền sử dụng
│   ├── components/          # UI dùng chung, không chứa nghiệp vụ trang
│   ├── features/            # Module auth, practice, review, admin...
│   ├── layouts/             # Learner và admin layouts
│   ├── lib/                 # API client, date, validation, telemetry
│   ├── styles/              # Tokens, reset và global styles
│   ├── types/               # Kiểu dùng chung ở transport boundary
│   └── main.tsx
├── .env.example
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

Chưa scaffold dependency ở mốc này. Trước khi code giao diện, đọc [UI_GUIDE.md](./UI_GUIDE.md).
