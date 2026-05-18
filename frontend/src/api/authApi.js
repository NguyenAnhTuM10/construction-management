import axiosClient from './axiosClient';

const authApi = {
  /**
   * Đăng nhập
   * @param {object} credentials - {username, password}
   * @returns {Promise} - {accessToken, refreshToken, username, role}
   */
  login: (credentials) => {
    return axiosClient.post('/auth/login', credentials);
  },

  /**
   * Đăng ký tài khoản mới
   * @param {object} userData - {username, email, password, roleName?}
   * @returns {Promise}
   */
  register: (userData) => {
    return axiosClient.post('/auth/register', userData);
  },

  /**
   * Đăng xuất
   * @param {string} refreshToken 
   * @returns {Promise}
   */
  logout: (refreshToken) => {
    return axiosClient.post('/auth/logout', { refreshToken });
  },

  /**
   * Refresh access token
   * @param {string} refreshToken 
   * @returns {Promise}
   */
  refreshToken: (refreshToken) => {
    return axiosClient.post('/auth/refresh', { refreshToken });
  },

  /**
   * Lấy thông tin user đang đăng nhập
   * @returns {Promise}
   */
  getCurrentUser: () => {
    return axiosClient.get('/auth/me');
  },

  /**
   * Lấy thông tin profile (từ user service)
   * @returns {Promise}
   */
  getMyInfo: () => {
    return axiosClient.get('/user/me');
  },

  /**
   * Cập nhật thông tin cá nhân
   * @param {object} data - {email?, phone?, name?}
   * @returns {Promise}
   */
  updateMyInfo: (data) => {
    return axiosClient.put('/user/me', data);
  },

  /**
   * Đổi mật khẩu
   * @param {object} data - {oldPassword, newPassword, confirmPassword}
   * @returns {Promise}
   */
  changePassword: (data) => {
    return axiosClient.post('/user/me/change-password', data);
  }
};

export default authApi;
