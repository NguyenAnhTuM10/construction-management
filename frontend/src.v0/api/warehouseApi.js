import axiosClient from './axiosClient';

const warehouseApi = {
  getAll: () => axiosClient.get('/warehouses'),
  getById: (id) => axiosClient.get(`/warehouses/${id}`),
  create: (data) => axiosClient.post('/warehouses', data),
  update: (id, data) => axiosClient.put(`/warehouses/${id}`, data),
  delete: (id) => axiosClient.delete(`/warehouses/${id}`),
};

export default warehouseApi;
