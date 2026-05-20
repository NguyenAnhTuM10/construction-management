import { useState, useMemo } from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  ShoppingOutlined,
  AppstoreOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  DatabaseOutlined,
  ShopOutlined,
  UserOutlined,
  CheckSquareOutlined,
  DollarOutlined,
  WalletOutlined,
  BarChartOutlined,
  HomeOutlined,
  SettingOutlined,
  UsergroupAddOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';

const { Sider } = Layout;

const Sidebar = ({ collapsed, onCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Lấy selected key từ path
  const selectedKey = useMemo(() => {
    const path = location.pathname;
    // Lấy phần đầu tiên của path sau /
    const segments = path.split('/').filter(Boolean);
    const firstSegment = segments[0] || 'dashboard';
    return firstSegment;
  }, [location.pathname]);

  // Menu items theo role
  const menuItems = useMemo(() => {
    const role = user?.role;

    // Menu chung
    const commonItems = [
      {
        key: 'dashboard',
        icon: <DashboardOutlined />,
        label: 'Tổng quan',
      },
    ];

    // Menu ADMIN
    const adminItems = [
      ...commonItems,
      {
        key: 'products',
        icon: <ShoppingOutlined />,
        label: 'Sản phẩm',
      },
      {
        key: 'categories',
        icon: <AppstoreOutlined />,
        label: 'Danh mục',
      },
      {
        key: 'orders',
        icon: <ShoppingCartOutlined />,
        label: 'Đơn hàng',
      },
      {
        key: 'customers',
        icon: <TeamOutlined />,
        label: 'Khách hàng',
      },
      {
        key: 'inventory',
        icon: <DatabaseOutlined />,
        label: 'Kho hàng',
        children: [
          {
            key: 'warehouses',
            label: 'Danh sách kho',
          },
          {
            key: 'inventory-balance',
            label: 'Tồn kho',
          },
          {
            key: 'transactions',
            label: 'Giao dịch kho',
          },
          {
            key: 'forecast',
            icon: <RobotOutlined style={{ color: '#722ed1' }} />,
            label: 'Dự Báo AI',
          },
        ],
      },
      {
        key: 'suppliers',
        icon: <ShopOutlined />,
        label: 'Nhà cung cấp',
      },
      {
        type: 'divider'
      },
      {
        key: 'employees',
        icon: <UserOutlined />,
        label: 'Nhân viên',
      },
      {
        key: 'users',
        icon: <UsergroupAddOutlined />,
        label: 'Tài khoản',
      },
      {
        key: 'tasks',
        icon: <CheckSquareOutlined />,
        label: 'Công việc',
      },
      {
        type: 'divider'
      },
      {
        key: 'payments',
        icon: <DollarOutlined />,
        label: 'Thanh toán',
      },
      {
        key: 'salaries',
        icon: <WalletOutlined />,
        label: 'Lương',
      },
      {
        key: 'reports',
        icon: <BarChartOutlined />,
        label: 'Báo cáo',
      },
    ];

    // Menu SALE
    const saleItems = [
      ...commonItems,
      {
        key: 'products',
        icon: <ShoppingOutlined />,
        label: 'Sản phẩm',
      },
      {
        key: 'orders',
        icon: <ShoppingCartOutlined />,
        label: 'Đơn hàng',
      },
      {
        key: 'customers',
        icon: <TeamOutlined />,
        label: 'Khách hàng',
      },
      {
        key: 'my-tasks',
        icon: <CheckSquareOutlined />,
        label: 'Công việc của tôi',
      },
    ];

    // Menu ACCOUNTANT
    const accountantItems = [
      ...commonItems,
      {
        key: 'orders',
        icon: <ShoppingCartOutlined />,
        label: 'Đơn hàng',
      },
      {
        key: 'payments',
        icon: <DollarOutlined />,
        label: 'Thanh toán',
      },
      {
        key: 'customers',
        icon: <TeamOutlined />,
        label: 'Công nợ KH',
      },
      {
        key: 'salaries',
        icon: <WalletOutlined />,
        label: 'Lương nhân viên',
      },
      {
        key: 'reports',
        icon: <BarChartOutlined />,
        label: 'Báo cáo',
      },
      {
        key: 'my-tasks',
        icon: <CheckSquareOutlined />,
        label: 'Công việc của tôi',
      },
    ];

    // Trả về menu theo role
    switch (role) {
      case ROLES.ADMIN:
        return adminItems;
      case ROLES.SALE:
        return saleItems;
      case ROLES.ACCOUNTANT:
        return accountantItems;
      default:
        return commonItems;
    }
  }, [user?.role]);

  // Handle menu click
  const handleMenuClick = ({ key }) => {
    navigate(`/${key}`);
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
        paddingBottom: 48
      }}
      theme="dark"
    >
      {/* Logo */}
      <div style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255, 255, 255, 0.1)',
        margin: 0,
        position: 'sticky',
        top: 0,
        zIndex: 1
      }}>
        <HomeOutlined style={{ 
          fontSize: collapsed ? 24 : 28, 
          color: '#fff' 
        }} />
        {!collapsed && (
          <span style={{ 
            color: '#fff', 
            marginLeft: 10, 
            fontSize: 16,
            fontWeight: 'bold',
            whiteSpace: 'nowrap'
          }}>
            VLXD Manager
          </span>
        )}
      </div>

      {/* Menu */}
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ borderRight: 0, paddingBottom: 50 }}
      />
    </Sider>
  );
};

export default Sidebar;
