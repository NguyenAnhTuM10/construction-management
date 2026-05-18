import { Navigate, useLocation } from 'react-router-dom';
import { Result, Button } from 'antd';
import { useAuth } from '../hooks/useAuth';
import { Loading } from '../components/common';
import { ROLE_LABELS } from '../utils/constants';

/**
 * Component bảo vệ routes - yêu cầu đăng nhập
 * @param {object} props
 * @param {React.ReactNode} props.children - Component con cần bảo vệ
 * @param {string[]} props.allowedRoles - Danh sách roles được phép truy cập
 */
const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

   // ✅ THÊM DEBUG
  console.log('=== PrivateRoute Debug ===');
  console.log('user:', user);
  console.log('user.role:', user?.role);
  console.log('allowedRoles:', allowedRoles);
  console.log('location:', location.pathname);

  // Đang kiểm tra authentication
  if (loading) {
    return <Loading fullScreen tip="Đang xác thực..." />;
  }

  // Chưa đăng nhập - redirect về login với return URL
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Kiểm tra role nếu có yêu cầu
  if (allowedRoles.length > 0) {
    const userRole = user?.role;
    
    if (!allowedRoles.includes(userRole)) {
      // Không có quyền - hiển thị thông báo
      const allowedRoleNames = allowedRoles
        .map(role => ROLE_LABELS[role] || role)
        .join(', ');
      
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: '100vh',
          background: '#f0f2f5'
        }}>
          <Result
            status="403"
            title="Không có quyền truy cập"
            subTitle={
              <div>
                <p>Bạn không có quyền truy cập trang này.</p>
                <p style={{ fontSize: 12, color: '#999' }}>
                  Trang này chỉ dành cho: {allowedRoleNames}
                </p>
              </div>
            }
            extra={
              <Button 
                type="primary" 
                onClick={() => window.location.href = '/dashboard'}
              >
                Về trang chủ
              </Button>
            }
          />
        </div>
      );
    }
  }

  // Có quyền - render children
  return children;
};

export default PrivateRoute;
