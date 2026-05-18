// src/api/taskApi.js
import axiosClient from './axiosClient';

const taskApi = {
  // ========== ADMIN APIs ==========
  getAll: () => axiosClient.get('/tasks'),
  getById: (id) => axiosClient.get(`/tasks/${id}`),
  getByEmployee: (employeeId) => axiosClient.get(`/tasks/employee/${employeeId}`),
  getByStatus: (status) => axiosClient.get(`/tasks/status/${status}`),
  getOverdue: () => axiosClient.get('/tasks/overdue'),
  getUpcoming: () => axiosClient.get('/tasks/upcoming'),
  create: (data) => axiosClient.post('/tasks', data),
  update: (id, data) => axiosClient.put(`/tasks/${id}`, data),
  updateStatus: (id, status) => axiosClient.patch(`/tasks/${id}/status`, { status }),
  delete: (id) => axiosClient.delete(`/tasks/${id}`),

  // ========== EMPLOYEE APIs ==========
  getMyTasks: () => axiosClient.get('/tasks/my-tasks'),
  getMyTasksByStatus: (status) => axiosClient.get(`/tasks/my-tasks/status/${status}`),
  submitResult: (id, data) => axiosClient.post(`/tasks/${id}/submit-result`, data),
};

export default taskApi;