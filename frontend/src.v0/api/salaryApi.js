import axiosClient from './axiosClient';

const salaryApi = {
  getAll: () => axiosClient.get('/api/salaries'),
  getById: (id) => axiosClient.get(`/api/salaries/${id}`),
  getByEmployee: (employeeId) => axiosClient.get(`/api/salaries/employee/${employeeId}`),
  getByMonth: (year, month) => axiosClient.get('/api/salaries/month', { params: { year, month } }),
  getUnpaid: () => axiosClient.get('/api/salaries/unpaid'),
  getStatistics: (year, month) => axiosClient.get('/api/salaries/statistics', { params: { year, month } }),
  create: (data) => axiosClient.post('/api/salaries', data),
  update: (id, data) => axiosClient.put(`/api/salaries/${id}`, data),
  markAsPaid: (id) => axiosClient.post(`/api/salaries/${id}/pay`),
  markAsUnpaid: (id) => axiosClient.post(`/api/salaries/${id}/unpay`),
  delete: (id) => axiosClient.delete(`/api/salaries/${id}`),
};

export default salaryApi;
