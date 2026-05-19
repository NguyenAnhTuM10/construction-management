import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { authApi } from '../api';
import { ROLES } from '../utils/constants';
import { 
  saveAuthData, 
  clearAuthData, 
  getAccessToken, 
  getRefreshToken,
  getUser,
  setUser as setStoredUser
} from '../utils/storage';

// Tạo context
const AuthContext = createContext(null);

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Kiểm tra authentication khi app load
  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();
      const storedUser = getUser();

      if (token && storedUser) {
        // Có token trong storage - verify với server
        try {
          const response = await authApi.getMyInfo();
          // API trả về ApiResponse<UserResponse>
          const userData = response.data?.data || response.data;

          setUser({
            ...storedUser,
            ...userData
          });
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Token validation failed:', error);
          // Token không hợp lệ - axiosClient đã xử lý clear & dispatch event
          setUser(null);
          setIsAuthenticated(false);
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  // Lắng nghe sự kiện session hết hạn từ axiosClient (thay thế window.location.href)
  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    };

    window.addEventListener('auth:sessionExpired', handleSessionExpired);
    return () => window.removeEventListener('auth:sessionExpired', handleSessionExpired);
  }, []);

  // Login function
  const login = useCallback(async (credentials) => {
    try {
      setLoading(true);
      
      // Gọi API login
      const response = await authApi.login(credentials);
      
      // API trả về ApiResponse<LoginResponse>
      // LoginResponse: {accessToken, refreshToken, tokenType, username, role}
      const loginData = response.data?.data || response.data;
      
      if (!loginData || !loginData.accessToken) {
        return { 
          success: false, 
          error: response.data?.message || 'Đăng nhập thất bại' 
        };
      }

      // Lưu vào storage
      saveAuthData(loginData);
      
      // Cập nhật state
      setUser({
        username: loginData.username,
        role: loginData.role
      });
      setIsAuthenticated(true);
      
      message.success('Đăng nhập thành công!');
      
      return { success: true, role: loginData.role };
    } catch (error) {
      console.error('Login error:', error);
      
      // Xử lý lỗi cụ thể từ API
      let errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = 'Tên đăng nhập hoặc mật khẩu không đúng.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Tài khoản của bạn đã bị khóa.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      const refreshToken = getRefreshToken();
      
      if (refreshToken) {
        // Gọi API logout
        await authApi.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Luôn clear local data dù API có lỗi
      clearAuthData();
      setUser(null);
      setIsAuthenticated(false);
      message.success('Đã đăng xuất!');
    }
  }, []);

  // Update user info
  const updateUser = useCallback((userData) => {
    setUser(prev => {
      const newUser = { ...prev, ...userData };
      setStoredUser(newUser);
      return newUser;
    });
  }, []);

  // Check if user has specific role
  const hasRole = useCallback((roles) => {
    if (!user || !user.role) return false;
    
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  }, [user]);

  // Check if user is admin
  const isAdmin = useCallback(() => {
    return hasRole(ROLES.ADMIN);
  }, [hasRole]);

  // Check if user is sale
  const isSale = useCallback(() => {
    return hasRole(ROLES.SALE);
  }, [hasRole]);

  // Check if user is accountant
  const isAccountant = useCallback(() => {
    return hasRole(ROLES.ACCOUNTANT);
  }, [hasRole]);

  // Context value
  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    hasRole,
    isAdmin,
    isSale,
    isAccountant
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook để sử dụng Auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;
