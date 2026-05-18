import { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Descriptions, Divider, Row, Col, Avatar } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, SaveOutlined } from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../api';
import { PageHeader, Loading } from '../../components/common';
import { ROLE_LABELS } from '../../utils/constants';
import { stringToColor, getInitials } from '../../utils/formatters';

const Profile = () => {
  const [form] = Form.useForm();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await authApi.getMyInfo();
      const data = response.data;
      setProfileData(data);
      form.setFieldsValue({
        email: data.email,
        phone: data.phone,
        name: data.employeeName
      });
    } catch (error) {
      message.error('Không thể tải thông tin cá nhân');
      // Dùng data mẫu nếu API lỗi
      setProfileData({
        username: user?.username,
        role: user?.role,
        email: 'user@example.com',
        phone: '0901234567'
      });
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    try {
      setSaving(true);
      await authApi.updateMyInfo(values);
      message.success('Cập nhật thông tin thành công!');
      setIsEditing(false);
      updateUser(values);
      fetchProfile();
    } catch (error) {
      message.error(error.message || 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading tip="Đang tải thông tin..." />;
  }

  const displayName = profileData?.employeeName || profileData?.username || user?.username;
  const roleLabel = ROLE_LABELS[profileData?.role || user?.role] || 'User';

  return (
    <div>
      <PageHeader 
        title="Thông tin cá nhân"
        subtitle="Xem và cập nhật thông tin tài khoản"
        breadcrumbs={[
          { title: 'Thông tin cá nhân' }
        ]}
      />

      <Row gutter={24}>
        {/* Left - Avatar & Basic Info */}
        <Col xs={24} md={8}>
          <Card>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Avatar 
                size={100}
                style={{ 
                  backgroundColor: stringToColor(displayName),
                  fontSize: 36,
                  marginBottom: 16
                }}
              >
                {getInitials(displayName)}
              </Avatar>
              <h2 style={{ marginBottom: 4 }}>{displayName}</h2>
              <p style={{ color: '#666', marginBottom: 8 }}>@{profileData?.username || user?.username}</p>
              <p style={{ 
                display: 'inline-block',
                padding: '4px 12px', 
                background: '#f0f5ff', 
                borderRadius: 4,
                color: '#1890ff'
              }}>
                {roleLabel}
              </p>
            </div>
            
            <Divider />
            
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Phòng ban">
                {profileData?.departmentName || 'Chưa có'}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {profileData?.email || 'Chưa cập nhật'}
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {profileData?.phone || 'Chưa cập nhật'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Right - Edit Form */}
        <Col xs={24} md={16}>
          <Card 
            title="Chỉnh sửa thông tin"
            extra={
              !isEditing && (
                <Button type="primary" onClick={() => setIsEditing(true)}>
                  Chỉnh sửa
                </Button>
              )
            }
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              disabled={!isEditing}
            >
              <Form.Item
                name="name"
                label="Họ và tên"
              >
                <Input 
                  prefix={<UserOutlined />}
                  placeholder="Nhập họ và tên"
                />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { type: 'email', message: 'Email không hợp lệ' }
                ]}
              >
                <Input 
                  prefix={<MailOutlined />}
                  placeholder="Nhập email"
                />
              </Form.Item>

              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[
                  { 
                    pattern: /^(\+84|0)[0-9]{9,10}$/,
                    message: 'Số điện thoại không hợp lệ'
                  }
                ]}
              >
                <Input 
                  prefix={<PhoneOutlined />}
                  placeholder="Nhập số điện thoại"
                />
              </Form.Item>

              {isEditing && (
                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit"
                    loading={saving}
                    icon={<SaveOutlined />}
                    style={{ marginRight: 8 }}
                  >
                    Lưu thay đổi
                  </Button>
                  <Button onClick={() => {
                    setIsEditing(false);
                    form.setFieldsValue({
                      email: profileData?.email,
                      phone: profileData?.phone,
                      name: profileData?.employeeName
                    });
                  }}>
                    Hủy
                  </Button>
                </Form.Item>
              )}
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Profile;
