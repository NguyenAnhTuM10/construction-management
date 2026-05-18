import { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, message, Alert, Divider } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { userApi } from '../../api';
import { ROLES, ROLE_LABELS } from '../../utils/constants';

const { Option } = Select;

const UserFormModal = ({ visible, user, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const isEditing = !!user;

  // Reset form khi modal mở
  useEffect(() => {
    if (visible) {
      setError(null);
      if (user) {
        // Edit mode - chỉ cho phép đổi role
        form.setFieldsValue({
          username: user.username,
          email: user.email,
          role: user.role
        });
      } else {
        // Create mode
        form.resetFields();
        form.setFieldsValue({ role: ROLES.SALE });
      }
    }
  }, [visible, user, form]);

  // Xử lý submit
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      setError(null);

      if (isEditing) {
        // Cập nhật role
        // PUT /admin/role với {userId, roleName}
        await userApi.updateRole({
          userId: user.id,
          roleName: values.role
        });
        message.success('Cập nhật vai trò thành công!');
      } else {
        // Tạo user mới
        // POST /auth/register với {username, email, password, roleName}
        await userApi.create({
          username: values.username.trim(),
          email: values.email.trim(),
          password: values.password,
          roleName: values.role
        });
        message.success('Tạo tài khoản thành công!');
      }

      onSuccess();
    } catch (err) {
      console.error('Submit error:', err);
      
      let errorMessage = 'Có lỗi xảy ra';
      
      // Xử lý lỗi từ API
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        // Kiểm tra các lỗi cụ thể
        const msg = err.message.toLowerCase();
        if (msg.includes('username') || msg.includes('user_existed')) {
          errorMessage = 'Tên đăng nhập đã tồn tại';
          form.setFields([{ name: 'username', errors: ['Tên đăng nhập đã tồn tại'] }]);
        } else if (msg.includes('email')) {
          errorMessage = 'Email đã được sử dụng';
          form.setFields([{ name: 'email', errors: ['Email đã được sử dụng'] }]);
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEditing ? `Cập nhật vai trò - ${user?.username}` : 'Tạo tài khoản mới'}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      okText={isEditing ? 'Cập nhật' : 'Tạo tài khoản'}
      cancelText="Hủy"
      width={500}
      destroyOnClose
    >
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          role: ROLES.SALE
        }}
      >
        <Form.Item
          name="username"
          label="Tên đăng nhập"
          rules={[
            { required: true, message: 'Vui lòng nhập tên đăng nhập!' },
            { min: 3, message: 'Tối thiểu 3 ký tự!' },
            { max: 50, message: 'Tối đa 50 ký tự!' },
            { 
              pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, 
              message: 'Bắt đầu bằng chữ, chỉ chứa chữ, số và dấu gạch dưới!' 
            }
          ]}
        >
          <Input 
            prefix={<UserOutlined />}
            placeholder="Nhập tên đăng nhập"
            disabled={isEditing}
          />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Vui lòng nhập email!' },
            { type: 'email', message: 'Email không hợp lệ!' }
          ]}
        >
          <Input 
            prefix={<MailOutlined />}
            placeholder="Nhập địa chỉ email"
            disabled={isEditing}
          />
        </Form.Item>

        {!isEditing && (
          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu!' },
              { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự!' }
            ]}
            extra="Mật khẩu tối thiểu 6 ký tự. Người dùng có thể đổi sau khi đăng nhập."
          >
            <Input.Password 
              prefix={<LockOutlined />}
              placeholder="Nhập mật khẩu"
            />
          </Form.Item>
        )}

        <Divider />

        <Form.Item
          name="role"
          label="Vai trò"
          rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
          extra={
            <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
              <div><strong>Admin:</strong> Toàn quyền quản lý hệ thống</div>
              <div><strong>Sale:</strong> Quản lý đơn hàng, khách hàng</div>
              <div><strong>Kế toán:</strong> Quản lý thanh toán, lương, báo cáo</div>
            </div>
          }
        >
          <Select placeholder="Chọn vai trò">
            <Option value={ROLES.ADMIN}>
              <span style={{ color: '#cf1322' }}>● </span>
              {ROLE_LABELS[ROLES.ADMIN]}
            </Option>
            <Option value={ROLES.SALE}>
              <span style={{ color: '#1890ff' }}>● </span>
              {ROLE_LABELS[ROLES.SALE]}
            </Option>
            <Option value={ROLES.ACCOUNTANT}>
              <span style={{ color: '#52c41a' }}>● </span>
              {ROLE_LABELS[ROLES.ACCOUNTANT]}
            </Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UserFormModal;
