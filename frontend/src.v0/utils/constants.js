// API Endpoints
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/construction';

// App Info
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Quản Lý Vật Liệu Xây Dựng';

// User Roles - Match với API backend
export const ROLES = {
  ADMIN: 'ADMIN',
  SALE: 'SALE', 
  ACCOUNTANT: 'ACCOUNTANT'
};

// Role Labels (Tiếng Việt)
export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Quản trị viên',
  [ROLES.SALE]: 'Nhân viên bán hàng',
  [ROLES.ACCOUNTANT]: 'Kế toán',
  // Hỗ trợ cả format cũ nếu cần
  'ROLE_ADMIN': 'Quản trị viên',
  'ROLE_SALE': 'Nhân viên bán hàng',
  'ROLE_ACCOUNTANT': 'Kế toán'
};

// Order Status
export const ORDER_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  SHIPPING: 'SHIPPING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

// Order Status Labels (Tiếng Việt)
export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: 'Chờ xử lý',
  [ORDER_STATUS.CONFIRMED]: 'Đã xác nhận',
  [ORDER_STATUS.PROCESSING]: 'Đang xử lý',
  [ORDER_STATUS.SHIPPING]: 'Đang giao hàng',
  [ORDER_STATUS.COMPLETED]: 'Hoàn thành',
  [ORDER_STATUS.CANCELLED]: 'Đã hủy'
};

// Order Status Colors (Ant Design)
export const ORDER_STATUS_COLORS = {
  [ORDER_STATUS.PENDING]: 'orange',
  [ORDER_STATUS.CONFIRMED]: 'blue',
  [ORDER_STATUS.PROCESSING]: 'processing',
  [ORDER_STATUS.SHIPPING]: 'cyan',
  [ORDER_STATUS.COMPLETED]: 'success',
  [ORDER_STATUS.CANCELLED]: 'error'
};

// Task Status
export const TASK_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

// Task Status Labels
export const TASK_STATUS_LABELS = {
  [TASK_STATUS.PENDING]: 'Chờ thực hiện',
  [TASK_STATUS.IN_PROGRESS]: 'Đang thực hiện',
  [TASK_STATUS.COMPLETED]: 'Hoàn thành',
  [TASK_STATUS.CANCELLED]: 'Đã hủy'
};

// Task Priority
export const TASK_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
};

// Task Priority Labels
export const TASK_PRIORITY_LABELS = {
  [TASK_PRIORITY.LOW]: 'Thấp',
  [TASK_PRIORITY.MEDIUM]: 'Trung bình',
  [TASK_PRIORITY.HIGH]: 'Cao',
  [TASK_PRIORITY.URGENT]: 'Khẩn cấp'
};

// Task Priority Colors
export const TASK_PRIORITY_COLORS = {
  [TASK_PRIORITY.LOW]: 'default',
  [TASK_PRIORITY.MEDIUM]: 'blue',
  [TASK_PRIORITY.HIGH]: 'orange',
  [TASK_PRIORITY.URGENT]: 'red'
};

// Inventory Transaction Types
export const TRANSACTION_TYPE = {
  IMPORT: 'IMPORT',
  EXPORT: 'EXPORT'
};

// Transaction Type Labels
export const TRANSACTION_TYPE_LABELS = {
  [TRANSACTION_TYPE.IMPORT]: 'Nhập kho',
  [TRANSACTION_TYPE.EXPORT]: 'Xuất kho'
};

// Transaction Status
export const TRANSACTION_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

// Payment Methods
export const PAYMENT_METHODS = {
  CASH: 'CASH',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CARD: 'CARD'
};

// Payment Method Labels
export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHODS.CASH]: 'Tiền mặt',
  [PAYMENT_METHODS.BANK_TRANSFER]: 'Chuyển khoản',
  [PAYMENT_METHODS.CARD]: 'Thẻ'
};

// Local Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user'
};

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = ['10', '20', '50', '100'];

// Date Formats
export const DATE_FORMAT = 'DD/MM/YYYY';
export const DATETIME_FORMAT = 'DD/MM/YYYY HH:mm';
export const DATE_FORMAT_API = 'YYYY-MM-DD';

// Low Stock Threshold
export const LOW_STOCK_THRESHOLD = 10;
