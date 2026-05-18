import { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, message, Alert, Divider } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, TeamOutlined } from '@ant-design/icons';
import { userApi, employeeApi } from '../../api';  // ✅ Thêm employeeApi

import { ROLES, ROLE_LABELS } from '../../utils/constants';

const { Option } = Select;

const UserFormModal = ({ visible, user, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // ✅ THÊM MỚI: State cho danh sách nhân viên chưa có tài khoản
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  
  const isEditing = !!user;

  // ✅ THÊM MỚI: Fetch danh sách nhân viên chưa có tài khoản
  const fetchEmployeesWithoutAccount = async () => {
    setLoadingEmployees(true);
    try {
      const response = await employeeApi.getWithoutAccount();
      setEmployees(response.data || []);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  };

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
        // ✅ THÊM MỚI: Fetch employees khi mở modal tạo mới
        fetchEmployeesWithoutAccount();
      }
    }
  }, [visible, user, form]);

  // ✅ THÊM MỚI: Tự động điền email khi chọn nhân viên
  const handleEmployeeChange = (employeeId) => {
    if (employeeId) {
      const selectedEmployee = employees.find(emp => emp.id === employeeId);
      if (selectedEmployee?.email) {
        form.setFieldsValue({ email: selectedEmployee.email });
      }
    }
  };

  // Xử lý submit
const handleSubmit = async () => {
  try {
    const values = await form.validateFields();

      
    // ✅ THÊM DEBUG
    console.log('🔍 All form values:', values);
    console.log('🔍 employeeId from values:', values.employeeId);
    console.log('🔍 employeeId from getFieldValue:', form.getFieldValue('employeeId'));
    console.log('🔍 All fields:', form.getFieldsValue(true)); // true = include all fields
    
    setLoading(true);
    setError(null);

    if (isEditing) {
      await userApi.updateRole({
        userId: user.id,
        roleName: values.role
      });
      message.success('Cập nhật vai trò thành công!');
    } else {
      // ✅ SỬA: Đảm bảo employeeId luôn có trong object
      const registerData = {
        username: values.username.trim(),
        email: values.email.trim(),
        password: values.password,
        roleName: values.role,
        employeeId: values.employeeId !== undefined ? values.employeeId : null  // ✅ SỬA
      };

      console.log('📤 Register data:', registerData); // ✅ THÊM LOG ĐỂ DEBUG

      await userApi.create(registerData);
      message.success('Tạo tài khoản thành công!');
    }

    onSuccess();
  } catch (err) {
    console.error('Submit error:', err);
    // ... rest of error handling
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
        {/* ✅ THÊM MỚI: Dropdown liên kết nhân viên */}
        {!isEditing && (
          <Form.Item
            name="employeeId"
            label="Liên kết nhân viên"
            extra="Chọn nhân viên để liên kết với tài khoản này (không bắt buộc)"
          >
            <Select
              placeholder="Chọn nhân viên (tùy chọn)"
              allowClear
              showSearch
              loading={loadingEmployees}
              onChange={handleEmployeeChange}
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {employees.map(emp => (
                <Option key={emp.id} value={emp.id}>
                  {emp.name} {emp.phone ? `- ${emp.phone}` : ''} {emp.departmentName ? `(${emp.departmentName})` : ''}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

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