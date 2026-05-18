import axiosClient from './axiosClient';

// Inventory Balance API
export const inventoryBalanceApi = {
  getAll: () => axiosClient.get('/inventory/balances'),
  getByWarehouse: (warehouseId) => axiosClient.get(`/inventory/balances/warehouse/${warehouseId}`),
  getByProduct: (productId) => axiosClient.get(`/inventory/balances/product/${productId}`),
  getBalance: (warehouseId, productId) => axiosClient.get(`/inventory/balances/warehouse/${warehouseId}/product/${productId}`),
  getLowStock: (threshold = 10) => axiosClient.get('/inventory/balances/low-stock', { params: { threshold } }),
};

// Inventory Transaction API
export const inventoryTransactionApi = {
  getAll: () => axiosClient.get('/inventory/transactions'),
  getById: (id) => axiosClient.get(`/inventory/transactions/${id}`),
  getByWarehouse: (warehouseId) => axiosClient.get(`/inventory/transactions/warehouse/${warehouseId}`),
  getByType: (type) => axiosClient.get(`/inventory/transactions/type/${type}`),
  getByStatus: (status) => axiosClient.get(`/inventory/transactions/status/${status}`),
  getByDateRange: (start, end) => axiosClient.get('/inventory/transactions/date-range', { params: { start, end } }),
  create: (data) => axiosClient.post('/inventory/transactions', data),
  complete: (id) => axiosClient.post(`/inventory/transactions/${id}/complete`),
  cancel: (id) => axiosClient.post(`/inventory/transactions/${id}/cancel`),
  delete: (id) => axiosClient.delete(`/inventory/transactions/${id}`),
};

export default { inventoryBalanceApi, inventoryTransactionApi };
