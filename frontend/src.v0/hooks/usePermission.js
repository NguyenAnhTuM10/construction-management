import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { ROLES } from '../utils/constants';

/**
 * Hook để kiểm tra quyền truy cập
 */
export const usePermission = () => {
  const { user, hasRole, isAdmin, isSale, isAccountant } = useAuth();

  // Định nghĩa quyền cho từng module
  const permissions = useMemo(() => ({
    // Dashboard
    dashboard: {
      view: true, // Tất cả đều có thể xem dashboard
    },

    // Products
    products: {
      view: true,
      create: hasRole([ROLES.ADMIN]),
      edit: hasRole([ROLES.ADMIN]),
      delete: hasRole([ROLES.ADMIN]),
    },

    // Categories
    categories: {
      view: true,
      create: hasRole([ROLES.ADMIN]),
      edit: hasRole([ROLES.ADMIN]),
      delete: hasRole([ROLES.ADMIN]),
    },

    // Orders
    orders: {
      view: true,
      create: hasRole([ROLES.ADMIN, ROLES.SALE]),
      edit: hasRole([ROLES.ADMIN]),
      delete: hasRole([ROLES.ADMIN]),
      updateStatus: hasRole([ROLES.ADMIN]),
      viewAll: hasRole([ROLES.ADMIN, ROLES.ACCOUNTANT]), // Sale chỉ xem của mình
    },

    // Customers
    customers: {
      view: true,
      create: hasRole([ROLES.ADMIN, ROLES.SALE]),
      edit: hasRole([ROLES.ADMIN, ROLES.SALE]),
      delete: hasRole([ROLES.ADMIN]),
    },

    // Inventory
    inventory: {
      view: hasRole([ROLES.ADMIN]),
      create: hasRole([ROLES.ADMIN]),
      edit: hasRole([ROLES.ADMIN]),
      delete: hasRole([ROLES.ADMIN]),
    },

    // Warehouses
    warehouses: {
      view: hasRole([ROLES.ADMIN]),
      create: hasRole([ROLES.ADMIN]),
      edit: hasRole([ROLES.ADMIN]),
      delete: hasRole([ROLES.ADMIN]),
    },

    // Suppliers
    suppliers: {
      view: hasRole([ROLES.ADMIN]),
      create: hasRole([ROLES.ADMIN]),
      edit: hasRole([ROLES.ADMIN]),
      delete: hasRole([ROLES.ADMIN]),
    },

    // Employees
    employees: {
      view: hasRole([ROLES.ADMIN]),
      create: hasRole([ROLES.ADMIN]),
      edit: hasRole([ROLES.ADMIN]),
      delete: hasRole([ROLES.ADMIN]),
    },

    // Tasks
    tasks: {
      view: true,
      create: hasRole([ROLES.ADMIN]),
      edit: hasRole([ROLES.ADMIN]),
      delete: hasRole([ROLES.ADMIN]),
      submitResult: hasRole([ROLES.ADMIN, ROLES.SALE, ROLES.ACCOUNTANT]),
      viewAll: hasRole([ROLES.ADMIN]),
    },

    // Payments
    payments: {
      view: hasRole([ROLES.ADMIN, ROLES.ACCOUNTANT]),
      create: hasRole([ROLES.ADMIN, ROLES.ACCOUNTANT]),
      delete: hasRole([ROLES.ADMIN]),
    },

    // Salaries
    salaries: {
      view: hasRole([ROLES.ADMIN, ROLES.ACCOUNTANT]),
      create: hasRole([ROLES.ADMIN, ROLES.ACCOUNTANT]),
      edit: hasRole([ROLES.ADMIN, ROLES.ACCOUNTANT]),
      delete: hasRole([ROLES.ADMIN]),
      pay: hasRole([ROLES.ADMIN, ROLES.ACCOUNTANT]),
    },

    // Reports
    reports: {
      view: hasRole([ROLES.ADMIN, ROLES.ACCOUNTANT]),
      revenue: hasRole([ROLES.ADMIN, ROLES.ACCOUNTANT]),
      inventory: hasRole([ROLES.ADMIN]),
      debt: hasRole([ROLES.ADMIN, ROLES.ACCOUNTANT]),
    },

    // Admin features
    admin: {
      view: hasRole([ROLES.ADMIN]),
      manageUsers: hasRole([ROLES.ADMIN]),
    },
  }), [user, hasRole]);

  /**
   * Kiểm tra quyền cụ thể
   * @param {string} module - Tên module (products, orders, ...)
   * @param {string} action - Hành động (view, create, edit, delete)
   * @returns {boolean}
   */
  const can = (module, action) => {
    return permissions[module]?.[action] || false;
  };

  /**
   * Kiểm tra có quyền truy cập module không
   * @param {string} module 
   * @returns {boolean}
   */
  const canAccess = (module) => {
    return can(module, 'view');
  };

  return {
    permissions,
    can,
    canAccess,
    isAdmin,
    isSale,
    isAccountant,
    role: user?.role
  };
};

export default usePermission;
