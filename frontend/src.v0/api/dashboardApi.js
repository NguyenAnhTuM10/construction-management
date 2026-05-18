import axiosClient from './axiosClient';

const dashboardApi = {
  /**
   * Lấy tổng quan dashboard
   * @returns {Promise}
   */
  getSummary: () => {
    return axiosClient.get('/dashboard/summary');
  }
};

export default dashboardApi;
