import { useState } from 'react';
import { Modal, Form, Input, message, Alert, Typography, Button, Space } from 'antd';
import { LockOutlined, CopyOutlined, SyncOutlined } from '@ant-design/icons';
import { userApi } from '../../api';

const { Text, Paragraph } = Typography;

const ResetPasswordModal = ({ visible, user, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedPassword, setGeneratedPassword] = useState('');

  // Tạo mật khẩu ngẫu nhiên
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPassword(password);
    form.setFieldsValue({ newPassword: password });
  };

  // Copy mật khẩu vào clipboard
  const copyPassword = () => {
    const password = form.getFieldValue('newPassword');
    if (password) {
      navigator.clipboard.writeText(password);
      message.success('Đã sao chép mật khẩu');
    }
  };

  // Xử lý submit
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      setError(null);

      await userApi.resetPassword(user.id, values.newPassword);
      
      message.success('Đặt lại mật khẩu thành công!');
      form.resetFields();
      setGeneratedPassword('');
      onSuccess();
    } catch (err) {
      console.error('Reset password error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Có lỗi xảy ra';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý khi đóng modal
  const handleCancel = () => {
    form.resetFields();
    setGeneratedPassword('');
    setError(null);
    onCancel();
  };

  return (
    <Modal
      title="Đặt lại mật khẩu"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="Đặt lại mật khẩu"
      cancelText="Hủy"
      width={450}
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

      <div style={{ 
        padding: 16, 
        background: '#f5f5f5', 
        borderRadius: 8,
        marginBottom: 16 
      }}>
        <Text strong>Tài khoản: </Text>
        <Text>{user?.username}</Text>
        <br />
        <Text strong>Email: </Text>
        <Text>{user?.email}</Text>
      </div>

      <Alert
        message="Lưu ý"
        description="Sau khi đặt lại mật khẩu, người dùng sẽ cần sử dụng mật khẩu mới để đăng nhập. Hãy gửi mật khẩu mới cho người dùng qua kênh an toàn."
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form form={form} layout="vertical">
        <Form.Item
          name="newPassword"
          label="Mật khẩu mới"
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
            { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự!' }
          ]}
        >
          <Input.Password 
            prefix={<LockOutlined />}
            placeholder="Nhập mật khẩu mới"
          />
        </Form.Item>

        <Space style={{ marginBottom: 16 }}>
          <Button 
            icon={<SyncOutlined />} 
            onClick={generatePassword}
          >
            Tạo mật khẩu ngẫu nhiên
          </Button>
          <Button 
            icon={<CopyOutlined />} 
            onClick={copyPassword}
          >
            Sao chép
          </Button>
        </Space>

        {generatedPassword && (
          <Paragraph 
            copyable 
            style={{ 
              background: '#e6f7ff', 
              padding: 12, 
              borderRadius: 4,
              fontFamily: 'monospace',
              fontSize: 16
            }}
          >
            {generatedPassword}
          </Paragraph>
        )}
      </Form>
    </Modal>
  );
};

export default ResetPasswordModal;
