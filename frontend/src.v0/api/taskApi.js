import axiosClient from './axiosClient';

const taskApi = {
  // Admin endpoints
  getAll: () => axiosClient.get('/tasks'),
  getById: (id) => axiosClient.get(`/tasks/${id}`),
  getByStatus: (status) => axiosClient.get(`/tasks/status/${status}`),
  getByEmployee: (employeeId) => axiosClient.get(`/tasks/employee/${employeeId}`),
  getUpcoming: () => axiosClient.get('/tasks/upcoming'),
  getOverdue: () => axiosClient.get('/tasks/overdue'),
  create: (data) => axiosClient.post('/tasks', data),
  update: (id, data) => axiosClient.put(`/tasks/${id}`, data),
  updateStatus: (id, status) => axiosClient.patch(`/tasks/${id}/status`, { status }),
  delete: (id) => axiosClient.delete(`/tasks/${id}`),

  // Employee endpoints
  getMyTasks: () => axiosClient.get('/tasks/my-tasks'),
  getMyTasksByStatus: (status) => axiosClient.get(`/tasks/my-tasks/status/${status}`),
  submitResult: (id, result) => axiosClient.post(`/tasks/${id}/submit-result`, { result }),
};

export default taskApi;
