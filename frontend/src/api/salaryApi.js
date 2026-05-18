// ===== FILE: src/api/salaryApi.js =====
import axiosClient from './axiosClient';

const salaryApi = {
  // GET all salaries
  getAll: () => axiosClient.get('/salaries'),
  
  // GET salary by ID
  getById: (id) => axiosClient.get(`/salaries/${id}`),
  
  // GET salaries by employee
  getByEmployee: (employeeId) => axiosClient.get(`/salaries/employee/${employeeId}`),
  
  // ✅ SỬA: Đổi từ /month sang /period theo Backend
  getByPeriod: (month, year) => axiosClient.get('/salaries/period', { params: { month, year } }),
  
  // GET unpaid salaries (nếu backend có hỗ trợ)
  getUnpaid: () => axiosClient.get('/salaries', { params: { isPaid: false } }),
  
  // GET statistics
  getStatistics: (year, month) => axiosClient.get('/salaries/statistics', { params: { year, month } }),
  
  // CREATE salary
  create: (data) => axiosClient.post('/salaries', data),
  
  // UPDATE salary
  update: (id, data) => axiosClient.put(`/salaries/${id}`, data),
  
  // ✅ SỬA: Đổi từ POST sang PATCH theo Backend
  markAsPaid: (id) => axiosClient.patch(`/salaries/${id}/pay`),
  
  // DELETE salary
  delete: (id) => axiosClient.delete(`/salaries/${id}`),
};

export default salaryApi;