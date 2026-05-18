import axiosClient from './axiosClient';

const productApi = {
  /**
   * Lấy danh sách tất cả sản phẩm
   * @returns {Promise}
   */
  getAll: () => {
    return axiosClient.get('/products');
  },

  /**
   * Lấy thông tin sản phẩm theo ID
   * @param {number} id 
   * @returns {Promise}
   */
  getById: (id) => {
    return axiosClient.get(`/products/${id}`);
  },

  /**
   * Tạo sản phẩm mới
   * @param {object} data - {code, name, categoryId, unit, buyPrice, sellPrice, stock}
   * @returns {Promise}
   */
  create: (data) => {
    return axiosClient.post('/products', data);
  },

  /**
   * Cập nhật sản phẩm
   * @param {number} id 
   * @param {object} data 
   * @returns {Promise}
   */
  update: (id, data) => {
    return axiosClient.put(`/products/${id}`, data);
  },

  /**
   * Xóa sản phẩm
   * @param {number} id 
   * @returns {Promise}
   */
  delete: (id) => {
    return axiosClient.delete(`/products/${id}`);
  }
};

export default productApi;
