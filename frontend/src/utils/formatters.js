import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { DATE_FORMAT, DATETIME_FORMAT } from './constants';

// Set Vietnamese locale
dayjs.locale('vi');

/**
 * Format số tiền theo định dạng Việt Nam
 * @param {number} amount - Số tiền cần format
 * @param {string} currency - Đơn vị tiền tệ (mặc định: đ)
 * @returns {string} Số tiền đã format
 */
export const formatCurrency = (amount, currency = 'đ') => {
  if (amount === null || amount === undefined) return '0 ' + currency;
  
  return new Intl.NumberFormat('vi-VN').format(amount) + ' ' + currency;
};

/**
 * Format số tiền không có đơn vị
 * @param {number} amount 
 * @returns {string}
 */
export const formatNumber = (amount) => {
  if (amount === null || amount === undefined) return '0';
  
  return new Intl.NumberFormat('vi-VN').format(amount);
};

/**
 * Format ngày tháng
 * @param {string|Date} date - Ngày cần format
 * @param {string} format - Định dạng output
 * @returns {string}
 */
export const formatDate = (date, format = DATE_FORMAT) => {
  if (!date) return '-';
  return dayjs(date).format(format);
};

/**
 * Format ngày giờ
 * @param {string|Date} datetime 
 * @param {string} format 
 * @returns {string}
 */
export const formatDateTime = (datetime, format = DATETIME_FORMAT) => {
  if (!datetime) return '-';
  return dayjs(datetime).format(format);
};

/**
 * Format số điện thoại Việt Nam
 * @param {string} phone 
 * @returns {string}
 */
export const formatPhone = (phone) => {
  if (!phone) return '-';
  
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Format: 0xxx xxx xxx or +84 xxx xxx xxx
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
  }
  if (cleaned.length === 11 && cleaned.startsWith('84')) {
    return '+84 ' + cleaned.slice(2).replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
  }
  
  return phone;
};

/**
 * Rút gọn text dài
 * @param {string} text 
 * @param {number} maxLength 
 * @returns {string}
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Tính thời gian tương đối (vd: "2 giờ trước")
 * @param {string|Date} date 
 * @returns {string}
 */
export const timeAgo = (date) => {
  if (!date) return '';
  
  const now = dayjs();
  const target = dayjs(date);
  const diffMinutes = now.diff(target, 'minute');
  const diffHours = now.diff(target, 'hour');
  const diffDays = now.diff(target, 'day');
  
  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  
  return formatDate(date);
};

/**
 * Format phần trăm
 * @param {number} value 
 * @param {number} decimals 
 * @returns {string}
 */
export const formatPercent = (value, decimals = 1) => {
  if (value === null || value === undefined) return '0%';
  return value.toFixed(decimals) + '%';
};

/**
 * Parse số từ string (loại bỏ dấu phẩy, chấm)
 * @param {string} value 
 * @returns {number}
 */
export const parseNumber = (value) => {
  if (!value) return 0;
  // Remove dots (thousand separators in VN format) and replace comma with dot for decimals
  const cleaned = value.toString().replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

/**
 * Tạo màu từ string (cho avatar)
 * @param {string} str 
 * @returns {string}
 */
export const stringToColor = (str) => {
  if (!str) return '#1890ff';
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    '#f56a00', '#7265e6', '#ffbf00', '#00a2ae',
    '#1890ff', '#52c41a', '#eb2f96', '#722ed1'
  ];
  
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Lấy chữ cái đầu của tên (cho avatar)
 * @param {string} name 
 * @returns {string}
 */
export const getInitials = (name) => {
  if (!name) return '?';
  
  const words = name.trim().split(' ');
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};
