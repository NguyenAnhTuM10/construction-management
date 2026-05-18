import axios from 'axios';
import { API_URL } from '../utils/constants';
import { 
  getAccessToken, 
  getRefreshToken, 
  setTokens, 
  clearAuthData 
} from '../utils/storage';

// Tạo axios instance
const axiosClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Flag để tránh gọi refresh token nhiều lần
let isRefreshing = false;
let failedQueue = [];

// Xử lý queue khi refresh token xong
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ==================== Request Interceptor ====================
axiosClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request trong development
    if (import.meta.env.DEV) {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==================== Response Interceptor ====================
axiosClient.interceptors.response.use(
  (response) => {
    // Log response trong development
    if (import.meta.env.DEV) {
      console.log(`✅ Response:`, response.data);
    }
    
    // Trả về data trực tiếp nếu API wrap trong {success, data, message}
    // Hoặc trả về nguyên response.data
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log error trong development
    if (import.meta.env.DEV) {
      console.error(`❌ Error:`, error.response?.data || error.message);
    }
    
    // Xử lý 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Nếu đang refresh token, thêm request vào queue
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      const refreshToken = getRefreshToken();
      
      if (refreshToken) {
        try {
          // Gọi API refresh token
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken: refreshToken
          });
          
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          
          // Lưu tokens mới
          setTokens(accessToken, newRefreshToken);
          
          // Cập nhật header và xử lý queue
          axiosClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          processQueue(null, accessToken);
          
          // Retry request ban đầu
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axiosClient(originalRequest);
          
        } catch (refreshError) {
          // Refresh token thất bại - logout user
          processQueue(refreshError, null);
          clearAuthData();
          
          // Redirect to login
          window.location.href = '/login';
          
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // Không có refresh token - logout
        clearAuthData();
        window.location.href = '/login';
      }
    }
    
    // Xử lý các lỗi khác
    const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra';
    
    return Promise.reject({
      status: error.response?.status,
      message: errorMessage,
      data: error.response?.data
    });
  }
);

export default axiosClient;
