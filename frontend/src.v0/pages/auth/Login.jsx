import { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Checkbox, Alert } from 'antd';
import { UserOutlined, LockOutlined, HomeOutlined } from '@ant-design/icons';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { APP_NAME } from '../../utils/constants';

const { Title, Text } = Typography;

const Login = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  // Lấy redirect URL từ state (nếu bị redirect từ protected route)
  const from = location.state?.from?.pathname || '/dashboard';

  // Hiển thị message nếu session expired
  const sessionExpired = location.state?.sessionExpired;

  // Clear error khi user bắt đầu nhập
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Nếu đã đăng nhập, redirect về trang trước đó hoặc dashboard
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  // Xử lý submit form
  const onFinish = async (values) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await login({
        username: values.username.trim(),
        password: values.password
      });

      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.error || 'Đăng nhập thất bại. Vui lòng thử lại.');
      }
    } catch (err) {
      setError('Có lỗi xảy ra. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Clear error khi input thay đổi
  const onValuesChange = () => {
    if (error) {
      setError(null);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: 20
    }}>
      <Card 
        style={{ 
          width: '100%',
          maxWidth: 420,
          borderRadius: 12,
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
        }}
        bordered={false}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <HomeOutlined style={{ fontSize: 32, color: '#fff' }} />
          </div>
          <Title level={3} style={{ marginBottom: 4 }}>
            {APP_NAME}
          </Title>
          <Text type="secondary">
            Đăng nhập để tiếp tục
          </Text>
        </div>

        {/* Thông báo session expired */}
        {sessionExpired && (
          <Alert
            message="Phiên đăng nhập đã hết hạn"
            description="Vui lòng đăng nhập lại để tiếp tục."
            type="warning"
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Thông báo lỗi */}
        {error && (
          <Alert
            message="Đăng nhập thất bại"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Form */}
        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          onValuesChange={onValuesChange}
          autoComplete="off"
          layout="vertical"
          size="large"
          initialValues={{ remember: true }}
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: 'Vui lòng nhập tên đăng nhập!' },
              { min: 3, message: 'Tên đăng nhập phải có ít nhất 3 ký tự!' }
            ]}
          >
            <Input 
              prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="Tên đăng nhập"
              autoFocus
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu!' }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="Mật khẩu"
            />
          </Form.Item>

          <Form.Item>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Ghi nhớ đăng nhập</Checkbox>
            </Form.Item>
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              block
              loading={loading}
              style={{
                height: 48,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                fontWeight: 500
              }}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </Form.Item>
        </Form>

        {/* Thông tin liên hệ Admin */}
        <div style={{ 
          marginTop: 16,
          padding: 16,
          background: '#f5f5f5',
          borderRadius: 8,
          textAlign: 'center'
        }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Chưa có tài khoản? Vui lòng liên hệ <strong>Quản trị viên</strong> để được cấp tài khoản.
          </Text>
        </div>

        {/* Demo accounts - chỉ hiện trong development */}
        {import.meta.env.DEV && (
          <div style={{ 
            marginTop: 16,
            padding: 16,
            background: '#fff7e6',
            borderRadius: 8,
            border: '1px dashed #ffc069'
          }}>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
              <strong>🔧 Demo (Development only):</strong>
            </Text>
            <div style={{ fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Admin:</span>
                <code style={{ background: '#e8e8e8', padding: '2px 6px', borderRadius: 4 }}>
                  admin / admin123
                </code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Sale:</span>
                <code style={{ background: '#e8e8e8', padding: '2px 6px', borderRadius: 4 }}>
                  sale / sale123
                </code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Accountant:</span>
                <code style={{ background: '#e8e8e8', padding: '2px 6px', borderRadius: 4 }}>
                  accountant / acc123
                </code>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Login;
