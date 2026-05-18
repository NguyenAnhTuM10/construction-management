import axiosClient from './axiosClient';

const reportApi = {
  // Revenue reports
  getRevenue: (year, month) => axiosClient.get('/reports/revenue', { params: { year, month } }),
  getMonthlyRevenue: (year) => axiosClient.get('/reports/revenue/monthly', { params: { year } }),
  getRevenueByProduct: (year, month) => axiosClient.get('/reports/revenue/by-product', { params: { year, month } }),
  getRevenueByEmployee: (year, month) => axiosClient.get('/reports/revenue/by-employee', { params: { year, month } }),
  getRevenueByCustomer: (year, month) => axiosClient.get('/reports/revenue/by-customer', { params: { year, month } }),

  // Inventory reports
  getInventorySummary: () => axiosClient.get('/reports/inventory/summary'),
  getInventoryByWarehouse: () => axiosClient.get('/reports/inventory/by-warehouse'),

  // Debt reports
  getCustomerDebt: () => axiosClient.get('/reports/debt/customers'),
  getOverdueDebt: () => axiosClient.get('/reports/debt/overdue'),
};

export default reportApi;
