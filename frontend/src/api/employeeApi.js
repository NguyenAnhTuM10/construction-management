import axiosClient from './axiosClient';

const employeeApi = {
  /**
   * Lấy danh sách tất cả nhân viên
   * @returns {Promise}
   */
  getAll: () => {
    return axiosClient.get('/employees');
  },

  /**
   * Lấy thông tin nhân viên theo ID
   * @param {number} id 
   * @returns {Promise}
   */
  getById: (id) => {
    return axiosClient.get(`/employees/${id}`);
  },

  /**
   * Tạo nhân viên mới
   * @param {object} data - {name, phone?, departmentName, salary, hireDate}
   * @returns {Promise}
   */
  create: (data) => {
    return axiosClient.post('/employees', data);
  },

  /**
   * Cập nhật nhân viên
   * @param {number} id 
   * @param {object} data 
   * @returns {Promise}
   */
  update: (id, data) => {
    return axiosClient.put(`/employees/${id}`, data);
  },

  /**
   * Xóa nhân viên
   * @param {number} id 
   * @returns {Promise}
   */
  delete: (id) => {
    return axiosClient.delete(`/employees/${id}`);
  },

   getWithoutAccount: () => {
    return axiosClient.get('/employees/without-account');
  },
};

export default employeeApi;
