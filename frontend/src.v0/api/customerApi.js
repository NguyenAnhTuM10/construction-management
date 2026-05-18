import axiosClient from './axiosClient';

const customerApi = {
  /**
   * Lấy danh sách tất cả khách hàng
   * @returns {Promise}
   */
  getAll: () => {
    return axiosClient.get('/customers');
  },

  /**
   * Lấy thông tin khách hàng theo ID
   * @param {number} id 
   * @returns {Promise}
   */
  getById: (id) => {
    return axiosClient.get(`/customers/${id}`);
  },

  /**
   * Tạo khách hàng mới
   * @param {object} data - {name, email?, phone?, address?, debt?}
   * @returns {Promise}
   */
  create: (data) => {
    return axiosClient.post('/customers', data);
  },

  /**
   * Cập nhật khách hàng
   * @param {number} id 
   * @param {object} data - {name, email?, phone?, address?, debt?}
   * @returns {Promise}
   */
  update: (id, data) => {
    return axiosClient.put(`/customers/${id}`, data);
  },

  /**
   * Xóa khách hàng
   * @param {number} id 
   * @returns {Promise}
   */
  delete: (id) => {
    return axiosClient.delete(`/customers/${id}`);
  }
};

export default customerApi;
