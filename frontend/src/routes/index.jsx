import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '../components/layout';
import PrivateRoute from './PrivateRoute';
import { ROLES } from '../utils/constants';

// Auth pages
import { Login, ChangePassword } from '../pages/auth';

// Main pages
import { Dashboard } from '../pages/dashboard';
import { Profile } from '../pages/profile';
import { UserList } from '../pages/users';
import { CategoryList } from '../pages/categories';
import { ProductList } from '../pages/products';
import { CustomerList } from '../pages/customers';
import { OrderList } from '../pages/orders';
import { PaymentList } from '../pages/payments';
import { SupplierList } from '../pages/suppliers';
import { InventoryList, TransactionList } from '../pages/inventory';
import { EmployeeList } from '../pages/employees';
import { SalaryList } from '../pages/salaries';

import { ReportList, RevenueReport, DebtReport, StockReport, KPIReport } from '../pages/reports';
import NotFound from '../pages/NotFound';
import Unauthorized from '../pages/Unauthorized';
import { TaskList, MyTaskList } from '../pages/tasks';
import { ForecastDashboard } from '../pages/forecast';


// Placeholder components cho các pages chưa implement
const ComingSoon = ({ title }) => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: 400,
    flexDirection: 'column'
  }}>
    <h2>{title}</h2>
    <p>Tính năng đang được phát triển...</p>
  </div>
);

// Router configuration
const router = createBrowserRouter([
  // Public routes
  {
    path: '/login',
    element: <Login />
  },
  
  // Protected routes với layout
  {
    path: '/',
    element: (
      <PrivateRoute>
        <MainLayout />
      </PrivateRoute>
    ),
    children: [
      // Redirect root to dashboard
      {
        index: true,
        element: <Navigate to="/dashboard" replace />
      },
      
      // Dashboard - All roles
      {
        path: 'dashboard',
        element: <Dashboard />
      },
      
      // User Management - Admin only
      {
        path: 'users',
        element: (
          <PrivateRoute allowedRoles={[ROLES.ADMIN]}>
            <UserList />
          </PrivateRoute>
        )
      },
      
      // Categories - All can view
      {
        path: 'categories',
        element: <CategoryList />
      },
      
      // Products - All can view
      {
        path: 'products',
        element: <ProductList />
      },
      
      // Customers - All roles
      {
        path: 'customers',
        element: <CustomerList />
      },
      
      // Orders - All roles with different permissions
      {
        path: 'orders',
        element: <OrderList />
      },
      
      // Inventory - Admin only
      {
        path: 'warehouses',
        element: (
          <PrivateRoute allowedRoles={[ROLES.ADMIN]}>
            <InventoryList />
          </PrivateRoute>
        )
      },
      {
        path: 'inventory-balance',
        element: (
          <PrivateRoute allowedRoles={[ROLES.ADMIN]}>
            <InventoryList />
          </PrivateRoute>
        )
      },
      {
        path: 'transactions',
        element: (
          <PrivateRoute allowedRoles={[ROLES.ADMIN]}>
            <TransactionList />
          </PrivateRoute>
        )
      },
      
      // AI Forecast - Admin only
      {
        path: 'forecast',
        element: (
          <PrivateRoute allowedRoles={[ROLES.ADMIN]}>
            <ForecastDashboard />
          </PrivateRoute>
        )
      },

      // Suppliers - Admin only
      {
        path: 'suppliers',
        element: (
          <PrivateRoute allowedRoles={[ROLES.ADMIN]}>
            <SupplierList />
          </PrivateRoute>
        )
      },
      
      // Employees - Admin only
      {
        path: 'employees',
        element: (
          <PrivateRoute allowedRoles={[ROLES.ADMIN]}>
            <EmployeeList />
          </PrivateRoute>
        )
      },
      
      // Tasks
      {
        path: 'tasks',
        element: (
          <PrivateRoute allowedRoles={[ROLES.ADMIN]}>
            <TaskList />
          </PrivateRoute>
        )
      },
      {
        path: 'my-tasks',
        element: <MyTaskList />
      },
      
      // Payments - Admin & Accountant
      {
        path: 'payments',
        element: (
          <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
            <PaymentList />
          </PrivateRoute>
        )
      },
      
      // Salaries - Admin & Accountant
      {
        path: 'salaries',
        element: (
          <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
            <SalaryList />
          </PrivateRoute>
        )
      },
      
      // Reports - Admin & Accountant
      {
        path: 'reports',
        element: (
          <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
            <ReportList />
          </PrivateRoute>
        )
      },
      {
        path: 'reports/revenue',
        element: (
          <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
            <RevenueReport />
          </PrivateRoute>
        )
      },
      {
        path: 'reports/debt',
        element: (
          <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
            <DebtReport />
          </PrivateRoute>
        )
      },
      {
        path: 'reports/stock',
        element: (
          <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
            <StockReport />
          </PrivateRoute>
        )
      },
      {
        path: 'reports/kpi',
        element: (
          <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
            <KPIReport />
          </PrivateRoute>
        )
      },
      {
        path: 'reports/orders',
        element: (
          <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
            <RevenueReport />
          </PrivateRoute>
        )
      },
      {
        path: 'reports/top-products',
        element: (
          <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
            <RevenueReport />
          </PrivateRoute>
        )
      },
      {
        path: 'reports/payment',
        element: (
          <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
            <DebtReport />
          </PrivateRoute>
        )
      },
      {
        path: 'reports/profit',
        element: (
          <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
            <RevenueReport />
          </PrivateRoute>
        )
      },
      {
        path: 'reports/import-export',
        element: (
          <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
            <StockReport />
          </PrivateRoute>
        )
      },
      {
        path: 'reports/slow-moving',
        element: (
          <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
            <StockReport />
          </PrivateRoute>
        )
      },
      {
        path: 'reports/salary',
        element: (
          <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
            <KPIReport />
          </PrivateRoute>
        )
      },
      {
        path: 'reports/commission',
        element: (
          <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
            <KPIReport />
          </PrivateRoute>
        )
      },
      
      // Profile - All roles
      {
        path: 'profile',
        element: <Profile />
      },
      {
        path: 'change-password',
        element: <ChangePassword />
      },
      
      // Unauthorized
      {
        path: 'unauthorized',
        element: <Unauthorized />
      }
    ]
  },
  
  // 404 Not Found
  {
    path: '*',
    element: <NotFound />
  }
]);

export default router;
