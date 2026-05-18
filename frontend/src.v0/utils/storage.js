import { STORAGE_KEYS } from './constants';

/**
 * Lưu data vào localStorage
 * @param {string} key 
 * @param {any} value 
 */
export const setItem = (key, value) => {
  try {
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

/**
 * Lấy data từ localStorage
 * @param {string} key 
 * @param {any} defaultValue 
 * @returns {any}
 */
export const getItem = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
};

/**
 * Xóa item từ localStorage
 * @param {string} key 
 */
export const removeItem = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

/**
 * Xóa tất cả data trong localStorage
 */
export const clearAll = () => {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
};

// ==================== Token Management ====================

/**
 * Lưu access token
 * @param {string} token 
 */
export const setAccessToken = (token) => {
  setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
};

/**
 * Lấy access token
 * @returns {string|null}
 */
export const getAccessToken = () => {
  return getItem(STORAGE_KEYS.ACCESS_TOKEN);
};

/**
 * Lưu refresh token
 * @param {string} token 
 */
export const setRefreshToken = (token) => {
  setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
};

/**
 * Lấy refresh token
 * @returns {string|null}
 */
export const getRefreshToken = () => {
  return getItem(STORAGE_KEYS.REFRESH_TOKEN);
};

/**
 * Lưu cả access và refresh token
 * @param {string} accessToken 
 * @param {string} refreshToken 
 */
export const setTokens = (accessToken, refreshToken) => {
  setAccessToken(accessToken);
  setRefreshToken(refreshToken);
};

/**
 * Xóa tất cả tokens
 */
export const clearTokens = () => {
  removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  removeItem(STORAGE_KEYS.REFRESH_TOKEN);
};

// ==================== User Management ====================

/**
 * Lưu thông tin user
 * @param {object} user 
 */
export const setUser = (user) => {
  setItem(STORAGE_KEYS.USER, user);
};

/**
 * Lấy thông tin user
 * @returns {object|null}
 */
export const getUser = () => {
  return getItem(STORAGE_KEYS.USER);
};

/**
 * Xóa thông tin user
 */
export const clearUser = () => {
  removeItem(STORAGE_KEYS.USER);
};

// ==================== Auth Helpers ====================

/**
 * Kiểm tra đã đăng nhập chưa
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return !!getAccessToken();
};

/**
 * Xóa tất cả auth data (logout)
 */
export const clearAuthData = () => {
  clearTokens();
  clearUser();
};

/**
 * Lưu tất cả auth data sau khi login
 * @param {object} loginResponse 
 */
export const saveAuthData = (loginResponse) => {
  const { accessToken, refreshToken, username, role } = loginResponse;
  setTokens(accessToken, refreshToken);
  setUser({ username, role });
};
