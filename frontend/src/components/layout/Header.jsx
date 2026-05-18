import { Layout, Dropdown, Avatar, Space, Typography } from 'antd';
import { 
  UserOutlined, 
  LogoutOutlined, 
  SettingOutlined,
  KeyOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_LABELS } from '../../utils/constants';
import { stringToColor, getInitials } from '../../utils/formatters';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

const Header = ({ collapsed, onToggle }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Xử lý logout
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Menu dropdown
  const dropdownItems = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: 'Thông tin cá nhân',
        onClick: () => navigate('/profile'),
      },
      {
        key: 'change-password',
        icon: <KeyOutlined />,
        label: 'Đổi mật khẩu',
        onClick: () => navigate('/change-password'),
      },
      {
        type: 'divider',
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Đăng xuất',
        danger: true,
        onClick: handleLogout,
      },
    ],
  };

  const roleLabel = ROLE_LABELS[user?.role] || user?.role || '';

  return (
    <AntHeader style={{
      padding: '0 24px',
      background: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 1px 4px rgba(0, 21, 41, 0.08)',
      position: 'sticky',
      top: 0,
      zIndex: 99
    }}>
      {/* Left side - Toggle button */}
      <div 
        onClick={onToggle}
        style={{ 
          cursor: 'pointer',
          fontSize: 18,
          padding: '0 12px'
        }}
      >
        {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
      </div>

      {/* Right side - User info */}
      <Dropdown menu={dropdownItems} placement="bottomRight">
        <Space style={{ cursor: 'pointer' }}>
          <Avatar 
            style={{ 
              backgroundColor: stringToColor(user?.username),
              verticalAlign: 'middle'
            }}
            size="default"
          >
            {getInitials(user?.username || user?.employeeName || '?')}
          </Avatar>
          <div style={{ lineHeight: 1.2 }}>
            <Text strong style={{ display: 'block' }}>
              {user?.username || 'User'}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {roleLabel}
            </Text>
          </div>
        </Space>
      </Dropdown>
    </AntHeader>
  );
};

export default Header;
