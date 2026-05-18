import { useState } from 'react';
import { Form, Input, Button, Card, message, Alert, Progress, Typography } from 'antd';
import { LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common';
import { authApi } from '../../api';

const { Text } = Typography;

const ChangePassword = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();

  // Tính độ mạnh mật khẩu
  const calculatePasswordStrength = (password) => {
    if (!password) return 0;
    
    let strength = 0;
    
    // Độ dài
    if (password.length >= 6) strength += 20;
    if (password.length >= 8) strength += 10;
    if (password.length >= 12) strength += 10;
    
    // Chứa chữ thường
    if (/[a-z]/.test(password)) strength += 15;
    
    // Chứa chữ hoa
    if (/[A-Z]/.test(password)) strength += 15;
    
    // Chứa số
    if (/\d/.test(password)) strength += 15;
    
    // Chứa ký tự đặc biệt
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 15;
    
    return Math.min(strength, 100);
  };

  // Lấy màu và text cho độ mạnh mật khẩu
  const getStrengthInfo = (strength) => {
    if (strength < 30) return { color: '#ff4d4f', text: 'Yếu' };
    if (strength < 60) return { color: '#faad14', text: 'Trung bình' };
    if (strength < 80) return { color: '#52c41a', text: 'Khá' };
    return { color: '#52c41a', text: 'Mạnh' };
  };

  const onFinish = async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await authApi.changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword
      });
      
      setSuccess(true);
      message.success('Đổi mật khẩu thành công!');
      
      // Redirect sau 2 giây
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      let errorMessage = 'Đổi mật khẩu thất bại';
      
      if (err.status === 400) {
        errorMessage = 'Mật khẩu hiện tại không đúng';
        form.setFields([{ name: 'oldPassword', errors: ['Mật khẩu không đúng'] }]);
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Theo dõi thay đổi password mới
  const onNewPasswordChange = (e) => {
    const strength = calculatePasswordStrength(e.target.value);
    setPasswordStrength(strength);
  };

  // Clear error khi input thay đổi
  const onValuesChange = () => {
    if (error) {
      setError(null);
    }
  };

  if (success) {
    return (
      <div>
        <PageHeader title="Đổi mật khẩu" />
        <Card style={{ maxWidth: 500, textAlign: 'center', padding: '40px 0' }}>
          <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 16 }} />
          <h2 style={{ color: '#52c41a' }}>Đổi mật khẩu thành công!</h2>
          <Text type="secondary">Đang chuyển hướng...</Text>
        </Card>
      </div>
    );
  }

  const strengthInfo = getStrengthInfo(passwordStrength);

  return (
    <div>
      <PageHeader 
        title="Đổi mật khẩu"
        subtitle="Cập nhật mật khẩu tài khoản của bạn"
        breadcrumbs={[
          { title: 'Đổi mật khẩu' }
        ]}
      />

      <Card style={{ maxWidth: 500 }}>
        {/* Thông báo lỗi */}
        {error && (
          <Alert
            message="Lỗi"
            description={error}
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
          onFinish={onFinish}
          onValuesChange={onValuesChange}
          autoComplete="off"
        >
          <Form.Item
            name="oldPassword"
            label="Mật khẩu hiện tại"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu hiện tại!' }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />}
              placeholder="Nhập mật khẩu hiện tại"
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
              { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự!' },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: 'Phải có chữ hoa, chữ thường và số!'
              }
            ]}
            extra={
              passwordStrength > 0 && (
                <div style={{ marginTop: 8 }}>
                  <Progress 
                    percent={passwordStrength} 
                    strokeColor={strengthInfo.color}
                    showInfo={false}
                    size="small"
                  />
                  <Text style={{ color: strengthInfo.color, fontSize: 12 }}>
                    Độ mạnh: {strengthInfo.text}
                  </Text>
                </div>
              )
            }
          >
            <Input.Password 
              prefix={<LockOutlined />}
              placeholder="Nhập mật khẩu mới"
              onChange={onNewPasswordChange}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu mới"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />}
              placeholder="Xác nhận mật khẩu mới"
            />
          </Form.Item>

          {/* Hướng dẫn mật khẩu */}
          <div style={{ 
            marginBottom: 16, 
            padding: 12, 
            background: '#f5f5f5', 
            borderRadius: 8,
            fontSize: 12
          }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              Yêu cầu mật khẩu:
            </Text>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>Ít nhất 8 ký tự</li>
              <li>Có chữ hoa và chữ thường</li>
              <li>Có ít nhất 1 số</li>
              <li>Nên có ký tự đặc biệt (!@#$%...)</li>
            </ul>
          </div>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              block
            >
              {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ChangePassword;
