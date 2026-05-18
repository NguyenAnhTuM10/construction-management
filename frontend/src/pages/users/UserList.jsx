import { useState, useEffect } from 'react';
import { Table, Button, Space, Input, message, Tag, Tooltip, Popconfirm, Card, Row, Col, Statistic, Avatar, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined, UserOutlined, LockOutlined, UnlockOutlined, KeyOutlined } from '@ant-design/icons';
import { PageHeader, Loading } from '../../components/common';
import { formatDateTime } from '../../utils/formatters';
import UserFormModal from './UserFormModal';
import ResetPasswordModal from './ResetPasswordModal';
import userApi from '../../api/userApi';

const ROLE_LABELS = {
  ADMIN: { label: 'Quản trị viên', color: 'red' },
  SALE: { label: 'Bán hàng', color: 'blue' },
  ACCOUNTANT: { label: 'Kế toán', color: 'green' },
  WAREHOUSE: { label: 'Kho', color: 'orange' }
};

const UserList = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [resetPwdModalVisible, setResetPwdModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await userApi.getAll();
      setUsers(Array.isArray(res.data || res) ? (res.data || res) : []);
    } catch (error) { message.error(error.message || 'Không thể tải dữ liệu'); }
    finally { setLoading(false); }
  };

  const handleCreate = () => { setSelectedUser(null); setFormModalVisible(true); };
  
  const handleDelete = async (record) => {
    try {
      await userApi.delete(record.id);
      setUsers(prev => prev.filter(u => u.id !== record.id));
      message.success('Đã xóa tài khoản');
    } catch (error) { message.error(error.message || 'Không thể xóa'); }
  };

  const handleToggleLock = async (record) => {
    try {
      await userApi.toggleLock(record.id, !record.locked);
      setUsers(prev => prev.map(u => u.id === record.id ? { ...u, locked: !u.locked } : u));
      message.success(record.locked ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản');
    } catch (error) { message.error(error.message || 'Có lỗi xảy ra'); }
  };

  const handleResetPassword = (record) => {
    setSelectedUser(record);
    setResetPwdModalVisible(true);
  };

  const handleResetPwdSuccess = async (newPassword) => {
    try {
      await userApi.resetPassword(selectedUser.id, newPassword);
      message.success('Đặt lại mật khẩu thành công!');
      setResetPwdModalVisible(false);
    } catch (error) { message.error(error.message || 'Có lỗi xảy ra'); }
  };

  const handleFormSuccess = async (data) => {
    try {
      const res = await userApi.create(data);
      setUsers(prev => [...prev, res.data || res]);
      message.success('Tạo tài khoản thành công!');
      setFormModalVisible(false);
    } catch (error) { message.error(error.message || 'Có lỗi xảy ra'); }
  };

  const filteredUsers = users.filter(u =>
    (u.username || '').toLowerCase().includes(searchText.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchText.toLowerCase())
  );

  const stats = {
    total: users.length,
    active: users.filter(u => !u.locked).length,
    locked: users.filter(u => u.locked).length
  };

  const columns = [
    { title: 'Tài khoản', dataIndex: 'username', key: 'username', width: 180,
      render: (username, record) => (
        <Space>
          <Avatar style={{ backgroundColor: record.locked ? '#ff4d4f' : '#1890ff' }} icon={<UserOutlined />}>{username?.charAt(0).toUpperCase()}</Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{username}</div>
            <small style={{ color: '#666' }}>{record.email}</small>
          </div>
        </Space>
      )
    },
    { title: 'Vai trò', dataIndex: 'roleName', key: 'roleName', width: 140,
      render: (role) => {
        const config = ROLE_LABELS[role] || { label: role, color: 'default' };
        return <Tag color={config.color}>{config.label}</Tag>;
      }
    },
    { title: 'Trạng thái', key: 'status', width: 120,
      render: (_, record) => record.locked ? <Tag color="error" icon={<LockOutlined />}>Đã khóa</Tag> : <Tag color="success" icon={<UnlockOutlined />}>Hoạt động</Tag>
    },
    { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', width: 150, render: (d) => formatDateTime(d) },
    { title: 'Thao tác', key: 'actions', width: 180,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={record.locked ? 'Mở khóa' : 'Khóa'}>
            <Popconfirm title={`${record.locked ? 'Mở khóa' : 'Khóa'} tài khoản này?`} onConfirm={() => handleToggleLock(record)}>
              <Button type="text" icon={record.locked ? <UnlockOutlined /> : <LockOutlined />} style={{ color: record.locked ? '#52c41a' : '#faad14' }} />
            </Popconfirm>
          </Tooltip>
          <Tooltip title="Đặt lại mật khẩu">
            <Button type="text" icon={<KeyOutlined />} onClick={() => handleResetPassword(record)} />
          </Tooltip>
          <Popconfirm title="Xác nhận xóa?" onConfirm={() => handleDelete(record)}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  if (loading) return <Loading tip="Đang tải danh sách tài khoản..." />;

  return (
    <div>
      <PageHeader title="Quản lý tài khoản" subtitle="Quản lý người dùng hệ thống" breadcrumbs={[{ title: 'Hệ thống' }, { title: 'Tài khoản' }]}
        extra={<Space><Button icon={<ReloadOutlined />} onClick={fetchData}>Làm mới</Button><Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>Thêm tài khoản</Button></Space>}
      />
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={8}><Card size="small" hoverable><Statistic title="Tổng tài khoản" value={stats.total} prefix={<UserOutlined />} valueStyle={{ color: '#1890ff' }} /></Card></Col>
        <Col xs={8}><Card size="small" hoverable><Statistic title="Đang hoạt động" value={stats.active} prefix={<UnlockOutlined />} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col xs={8}><Card size="small" hoverable><Statistic title="Đã khóa" value={stats.locked} prefix={<LockOutlined />} valueStyle={{ color: '#cf1322' }} /></Card></Col>
      </Row>
      <Card style={{ marginBottom: 16 }}><Input.Search placeholder="Tìm theo username, email..." prefix={<SearchOutlined />} value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ width: 300 }} allowClear /></Card>
      <Card><Table columns={columns} dataSource={filteredUsers} rowKey="id" pagination={{ pageSize: 10, showTotal: (t) => `Tổng ${t} tài khoản` }} /></Card>
      <UserFormModal visible={formModalVisible} onCancel={() => setFormModalVisible(false)} onSuccess={handleFormSuccess} />
      <ResetPasswordModal visible={resetPwdModalVisible} user={selectedUser} onCancel={() => setResetPwdModalVisible(false)} onSuccess={handleResetPwdSuccess} />
    </div>
  );
};

export default UserList;
