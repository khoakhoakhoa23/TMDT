# Tests Directory

Thư mục này chứa tất cả các file test cho frontend.

## Cấu trúc

```
tests/
├── components/
│   ├── Footer.test.jsx
│   └── CarCard.test.jsx
└── api/
    └── axiosClient.test.js
```

## Chạy tests

```bash
cd frontend
npm test
```

Hoặc với Vitest:
```bash
npm run test
```

## Lưu ý

- File setup.js nằm trong `src/test/setup.js`
- Cấu hình Vitest trong `vite.config.js`
- Tests sử dụng React Testing Library và Vitest

