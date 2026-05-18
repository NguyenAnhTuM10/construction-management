# Construction Materials Management System

Hệ thống quản lý bán vật liệu xây dựng - ReactJS Frontend

## 📋 Tổng quan

Ứng dụng quản lý bán vật liệu xây dựng với 3 role chính:
- **Admin**: Quản trị viên (Chủ cửa hàng) - Full quyền
- **Sale**: Nhân viên bán hàng - Quản lý đơn hàng, khách hàng
- **Accountant**: Kế toán - Quản lý thanh toán, lương, báo cáo

## 🛠️ Tech Stack

- **React 18** - Framework chính
- **React Router v6** - Routing
- **Ant Design 5** - UI Components
- **Axios** - HTTP Client
- **Recharts** - Charts & Graphs
- **Day.js** - Date manipulation

## 📁 Cấu trúc dự án

```
src/
├── api/                 # API modules
├── components/          # Reusable components
│   ├── common/          # Common components (Loading, PageHeader, etc.)
│   ├── layout/          # Layout components (Sidebar, Header, MainLayout)
│   └── forms/           # Form components
├── contexts/            # React Context (Auth)
├── hooks/               # Custom hooks
├── pages/               # Page components
│   ├── auth/            # Login, ChangePassword
│   ├── dashboard/       # Dashboard
│   ├── products/        # Product management
│   ├── orders/          # Order management
│   └── ...
├── routes/              # Router configuration
├── utils/               # Utility functions
└── styles/              # Global styles
```

## 🚀 Bắt đầu

### Yêu cầu
- Node.js 18+
- npm hoặc yarn

### Cài đặt

```bash
# Clone repo
git clone <repo-url>
cd construction-management

# Cài đặt dependencies
npm install

# Tạo file .env từ .env.example
cp .env.example .env

# Chạy development server
npm run dev
```

### Scripts

```bash
npm run dev      # Chạy development server
npm run build    # Build production
npm run preview  # Preview production build
```

## 🔐 Authentication

Hệ thống sử dụng JWT với Access Token và Refresh Token:

- Access Token được lưu trong localStorage
- Refresh Token tự động được gọi khi Access Token hết hạn
- Axios interceptors xử lý authentication tự động

### Tài khoản demo

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Sale | sale | sale123 |
| Accountant | accountant | accountant123 |

## 📱 Các tính năng chính

### Đã hoàn thành (Phase 1)
- ✅ Authentication (Login/Logout)
- ✅ Dashboard với statistics
- ✅ Layout responsive với Sidebar
- ✅ Phân quyền theo role
- ✅ Profile management
- ✅ Change password

### Đang phát triển (Phase 2)
- 🔄 Quản lý sản phẩm
- 🔄 Quản lý danh mục
- 🔄 Quản lý khách hàng
- 🔄 Quản lý đơn hàng

### Sắp tới (Phase 3)
- ⏳ Quản lý kho hàng
- ⏳ Quản lý thanh toán
- ⏳ Quản lý lương
- ⏳ Báo cáo thống kê

## 📝 API Documentation

API Base URL: `http://localhost:8080/construction`

Xem chi tiết API trong file OpenAPI specification.

## 🎨 UI Components

Sử dụng Ant Design với custom theme:
- Primary Color: #1890ff
- Border Radius: 6px
- Locale: Vietnamese (vi_VN)

## 📄 License

MIT License
