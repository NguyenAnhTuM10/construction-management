import axiosClient from './axiosClient';

const userApi = {
  /**
   * Lấy danh sách tất cả users (Admin only)
   * GET /admin/users
   * Response: List<UserResponse>
   */
  getAll: () => {
    return axiosClient.get('/admin/users');
  },

  /**
   * Lấy user theo ID (Admin only)
   * GET /admin/users/{id}
   * Response: ApiResponse<UserResponse>
   */
  getById: (id) => {
    return axiosClient.get(`/admin/users/${id}`);
  },

  /**
   * Tạo user mới (Admin only)
   * POST /auth/register
   * Request: {username, email, password, roleName}
   * Response: ApiResponse<RegisterResponse>
   */
  create: (data) => {
    return axiosClient.post('/auth/register', {
      username: data.username,
      email: data.email,
      password: data.password,
      roleName: data.roleName,
        employeeId: data.employeeId  
    });
  },

  /**
   * Cập nhật role của user (Admin only)
   * PUT /admin/role
   * Request: {userId, roleName}
   * Response: UserResponse
   */
  updateRole: (data) => {
    return axiosClient.put('/admin/role', {
      userId: data.userId,
      roleName: data.roleName
    });
  },

  /**
   * Xóa user (Admin only)
   * DELETE /admin/users/{id}
   * Response: ApiResponse<Void>
   */
  delete: (id) => {
    return axiosClient.delete(`/admin/users/${id}`);
  },

  /**
   * Reset password cho user (Admin only)
   * POST /admin/users/{id}/reset-password
   * Request: {newPassword}
   * Response: ApiResponse<Void>
   */
  resetPassword: (userId, newPassword) => {
    return axiosClient.post(`/admin/users/${userId}/reset-password`, { 
      newPassword 
    });
  },

  /**
   * Khóa/Mở khóa tài khoản user (Admin only)
   * PATCH /admin/users/{id}/lock
   * Request: {locked}
   * Response: ApiResponse<UserResponse>
   */
  toggleLock: (userId, locked) => {
    return axiosClient.patch(`/admin/users/${userId}/lock`, { locked });
  }
};

export default userApi;
