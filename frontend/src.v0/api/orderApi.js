import axiosClient from './axiosClient';

const orderApi = {
  /**
   * Lấy danh sách tất cả đơn hàng
   * @returns {Promise}
   */
  getAll: () => {
    return axiosClient.get('/orders');
  },

  /**
   * Lấy thông tin đơn hàng theo ID
   * @param {number} id 
   * @returns {Promise}
   */
  getById: (id) => {
    return axiosClient.get(`/orders/${id}`);
  },

  /**
   * Lấy đơn hàng theo trạng thái
   * @param {string} status - PENDING, CONFIRMED, PROCESSING, SHIPPING, COMPLETED, CANCELLED
   * @returns {Promise}
   */
  getByStatus: (status) => {
    return axiosClient.get(`/orders/status/${status}`);
  },

  /**
   * Lấy đơn hàng theo khách hàng
   * @param {number} customerId 
   * @returns {Promise}
   */
  getByCustomer: (customerId) => {
    return axiosClient.get(`/orders/customer/${customerId}`);
  },

  /**
   * Lấy đơn hàng theo nhân viên
   * @param {number} employeeId 
   * @returns {Promise}
   */
  getByEmployee: (employeeId) => {
    return axiosClient.get(`/orders/employee/${employeeId}`);
  },

  /**
   * Lấy đơn hàng theo khoảng thời gian
   * @param {string} start - ISO date string
   * @param {string} end - ISO date string
   * @returns {Promise}
   */
  getByDateRange: (start, end) => {
    return axiosClient.get('/orders/date-range', {
      params: { start, end }
    });
  },

  /**
   * Tạo đơn hàng mới
   * @param {object} data - {customerId, employeeId, items: [{productId, quantity, price}]}
   * @returns {Promise}
   */
  create: (data) => {
    return axiosClient.post('/orders', data);
  },

  /**
   * Cập nhật đơn hàng
   * @param {number} id 
   * @param {object} data - {customerId?, employeeId?, items?}
   * @returns {Promise}
   */
  update: (id, data) => {
    return axiosClient.put(`/orders/${id}`, data);
  },

  /**
   * Cập nhật trạng thái đơn hàng
   * @param {number} id 
   * @param {string} status 
   * @returns {Promise}
   */
  updateStatus: (id, status) => {
    return axiosClient.patch(`/orders/${id}/status`, { status });
  },

  /**
   * Hủy đơn hàng
   * @param {number} id 
   * @returns {Promise}
   */
  cancel: (id) => {
    return axiosClient.post(`/orders/${id}/cancel`);
  },

  /**
   * Xóa đơn hàng
   * @param {number} id 
   * @returns {Promise}
   */
  delete: (id) => {
    return axiosClient.delete(`/orders/${id}`);
  }
};

export default orderApi;
