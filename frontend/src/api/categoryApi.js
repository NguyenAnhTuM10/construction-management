import axiosClient from './axiosClient';

const categoryApi = {
  /**
   * Lấy danh sách tất cả danh mục
   * @returns {Promise}
   */
  getAll: () => {
    return axiosClient.get('/categories');
  },

  /**
   * Lấy thông tin danh mục theo ID
   * @param {number} id 
   * @returns {Promise}
   */
  getById: (id) => {
    return axiosClient.get(`/categories/${id}`);
  },

  /**
   * Tạo danh mục mới
   * @param {object} data - {name}
   * @returns {Promise}
   */
  create: (data) => {
    return axiosClient.post('/categories', data);
  },

  /**
   * Cập nhật danh mục
   * @param {number} id 
   * @param {object} data - {name}
   * @returns {Promise}
   */
  update: (id, data) => {
    return axiosClient.put(`/categories/${id}`, data);
  },

  /**
   * Xóa danh mục
   * @param {number} id 
   * @returns {Promise}
   */
  delete: (id) => {
    return axiosClient.delete(`/categories/${id}`);
  }
};

export default categoryApi;
