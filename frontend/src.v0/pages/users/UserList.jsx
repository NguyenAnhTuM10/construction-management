import { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Tag, Input, message, 
  Tooltip, Popconfirm, Card, Row, Col, Statistic, Alert
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  SearchOutlined, UserOutlined, LockOutlined,
  UnlockOutlined, KeyOutlined, ReloadOutlined
} from '@ant-design/icons';
import { PageHeader, Loading } from '../../components/common';
import { userApi } from '../../api';
import { ROLE_LABELS, ROLES } from '../../utils/constants';
import UserFormModal from './UserFormModal';
import ResetPasswordModal from './ResetPasswordModal';

const UserList = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [resetPasswordVisible, setResetPasswordVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch users từ API
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await userApi.getAll();
      const userData = Array.isArray(response) ? response : (response.data || []);
      setUsers(userData);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Không thể tải danh sách tài khoản. Vui lòng thử lại.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý tạo user mới
  const handleCreate = () => {
    setSelectedUser(null);
    setModalVisible(true);
  };

  // Xử lý sửa user (chỉ đổi role)
  const handleEdit = (user) => {
    setSelectedUser(user);
    setModalVisible(true);
  };

  // Xử lý reset password
  const handleResetPassword = (user) => {
    setSelectedUser(user);
    setResetPasswordVisible(true);
  };

  // Xử lý khóa/mở khóa user
  const handleToggleLock = async (user) => {
    try {
      await userApi.toggleLock(user.id, !user.locked);
      message.success(user.locked ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản');
      fetchUsers();
    } catch (err) {
      console.error('Toggle lock error:', err);
      const errorMsg = err.response?.data?.message || 'Có lỗi xảy ra';
      message.error(errorMsg);
    }
  };

  // Xử lý xóa user
  const handleDelete = async (user) => {
    try {
      await userApi.delete(user.id);
      message.success('Đã xóa tài khoản');
      fetchUsers();
    } catch (err) {
      console.error('Delete error:', err);
      const errorMsg = err.response?.data?.message || 'Không thể xóa tài khoản';
      message.error(errorMsg);
    }
  };

  // Xử lý sau khi submit form thành công
  const handleFormSuccess = () => {
    setModalVisible(false);
    setSelectedUser(null);
    fetchUsers();
  };

  // Xử lý sau khi reset password
  const handleResetPasswordSuccess = () => {
    setResetPasswordVisible(false);
    setSelectedUser(null);
  };

  // Lọc users theo search
  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchText.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchText.toLowerCase()) ||
    user.employeeName?.toLowerCase().includes(searchText.toLowerCase())
  );

  // Thống kê
  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === ROLES.ADMIN).length,
    sales: users.filter(u => u.role === ROLES.SALE).length,
    accountants: users.filter(u => u.role === ROLES.ACCOUNTANT).length,
    locked: users.filter(u => u.locked).length
  };

  // Columns cho table
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      sorter: (a, b) => a.id - b.id
    },
    {
      title: 'Tên đăng nhập',
      dataIndex: 'username',
      key: 'username',
      render: (text, record) => (
        <Space>
          <UserOutlined />
          <span style={{ fontWeight: 500 }}>{text}</span>
          {record.locked && <Tag color="error">Đã khóa</Tag>}
        </Space>
      ),
      sorter: (a, b) => a.username.localeCompare(b.username)
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Nhân viên',
      dataIndex: 'employeeName',
      key: 'employeeName',
      render: (text, record) => (
        <div>
          <div>{text || <span style={{ color: '#999' }}>Chưa liên kết</span>}</div>
          {record.departmentName && (
            <small style={{ color: '#666' }}>{record.departmentName}</small>
          )}
        </div>
      )
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        const colors = {
          [ROLES.ADMIN]: 'red',
          [ROLES.SALE]: 'blue',
          [ROLES.ACCOUNTANT]: 'green'
        };
        return <Tag color={colors[role]}>{ROLE_LABELS[role] || role}</Tag>;
      },
      filters: [
        { text: 'Admin', value: ROLES.ADMIN },
        { text: 'Sale', value: ROLES.SALE },
        { text: 'Kế toán', value: ROLES.ACCOUNTANT },
      ],
      onFilter: (value, record) => record.role === value
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Sửa vai trò">
            <Button 
              type="text" 
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          
          <Tooltip title="Đặt lại mật khẩu">
            <Button 
              type="text" 
              icon={<KeyOutlined />}
              onClick={() => handleResetPassword(record)}
            />
          </Tooltip>
          
          <Tooltip title={record.locked ? 'Mở khóa' : 'Khóa tài khoản'}>
            <Popconfirm
              title={record.locked ? 'Mở khóa tài khoản này?' : 'Khóa tài khoản này?'}
              onConfirm={() => handleToggleLock(record)}
              okText="Xác nhận"
              cancelText="Hủy"
              disabled={record.role === ROLES.ADMIN}
            >
              <Button 
                type="text" 
                icon={record.locked ? <UnlockOutlined /> : <LockOutlined />}
                style={{ color: record.locked ? '#52c41a' : '#faad14' }}
                disabled={record.role === ROLES.ADMIN}
              />
            </Popconfirm>
          </Tooltip>
          
          {record.role !== ROLES.ADMIN && (
            <Tooltip title="Xóa">
              <Popconfirm
                title="Xác nhận xóa tài khoản này?"
                description="Hành động này không thể hoàn tác"
                onConfirm={() => handleDelete(record)}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Button 
                  type="text" 
                  danger
                  icon={<DeleteOutlined />}
                />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  if (loading) {
    return <Loading tip="Đang tải danh sách tài khoản..." />;
  }

  return (
    <div>
      <PageHeader
        title="Quản lý tài khoản"
        subtitle="Tạo và quản lý tài khoản người dùng trong hệ thống"
        breadcrumbs={[{ title: 'Quản lý tài khoản' }]}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchUsers}>
              Làm mới
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Tạo tài khoản
            </Button>
          </Space>
        }
      />

      {/* Error Alert */}
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

      {/* Thống kê */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" hoverable>
            <Statistic 
              title="Tổng cộng" 
              value={stats.total}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" hoverable>
            <Statistic 
              title="Admin" 
              value={stats.admins} 
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" hoverable>
            <Statistic 
              title="Sale" 
              value={stats.sales}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" hoverable>
            <Statistic 
              title="Kế toán" 
              value={stats.accountants}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" hoverable>
            <Statistic 
              title="Đã khóa" 
              value={stats.locked}
              valueStyle={{ color: stats.locked > 0 ? '#faad14' : '#999' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Search */}
      <Card style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Tìm kiếm theo tên đăng nhập, email, tên nhân viên..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 400 }}
          allowClear
        />
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} tài khoản`
          }}
        />
      </Card>

      {/* Modal tạo/sửa user */}
      <UserFormModal
        visible={modalVisible}
        user={selectedUser}
        onCancel={() => {
          setModalVisible(false);
          setSelectedUser(null);
        }}
        onSuccess={handleFormSuccess}
      />

      {/* Modal reset password */}
      <ResetPasswordModal
        visible={resetPasswordVisible}
        user={selectedUser}
        onCancel={() => {
          setResetPasswordVisible(false);
          setSelectedUser(null);
        }}
        onSuccess={handleResetPasswordSuccess}
      />
    </div>
  );
};

export default UserList;
