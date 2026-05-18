import axiosClient from './axiosClient';

const paymentApi = {
  getAll: () => axiosClient.get('/payments'),
  getById: (id) => axiosClient.get(`/payments/${id}`),
  getByOrder: (orderId) => axiosClient.get(`/payments/order/${orderId}`),
  getByCustomer: (customerId) => axiosClient.get(`/payments/customer/${customerId}`),
  getByDateRange: (start, end) => axiosClient.get('/payments/date-range', { params: { start, end } }),
  create: (data) => axiosClient.post('/payments', data),
  delete: (id) => axiosClient.delete(`/payments/${id}`),
};

export default paymentApi;
