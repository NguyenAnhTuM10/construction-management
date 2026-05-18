import { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Input, message, Tag,
  Tooltip, Popconfirm, Card, Row, Col, Statistic,
  Avatar, Typography
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  SearchOutlined, ReloadOutlined, UserOutlined,
  PhoneOutlined, MailOutlined, HomeOutlined,
  DollarOutlined, WarningOutlined
} from '@ant-design/icons';
import { PageHeader, Loading } from '../../components/common';
import { formatCurrency } from '../../utils/formatters';
import CustomerFormModal from './CustomerFormModal';
import customerApi from '../../api/customerApi';

const { Text } = Typography;

const CustomerList = () => {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await customerApi.getAll();
      const data = res.data || res;
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Fetch error:', error);
      message.error(error.message || 'Không thể tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCustomer(null);
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingCustomer(record);
    setModalVisible(true);
  };

  const handleDelete = async (record) => {
    if (record.debt > 0) {
      message.warning('Không thể xóa khách hàng còn công nợ!');
      return;
    }
    try {
      await customerApi.delete(record.id);
      setCustomers(prev => prev.filter(c => c.id !== record.id));
      message.success('Đã xóa khách hàng');
    } catch (error) {
      message.error(error.message || 'Không thể xóa khách hàng');
    }
  };

  const handleFormSuccess = async (customerData) => {
    try {
      if (editingCustomer) {
        const res = await customerApi.update(editingCustomer.id, customerData);
        const updated = res.data || res;
        setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? updated : c));
        message.success('Cập nhật khách hàng thành công!');
      } else {
        const res = await customerApi.create(customerData);
        const created = res.data || res;
        setCustomers(prev => [...prev, created]);
        message.success('Tạo khách hàng thành công!');
      }
      setModalVisible(false);
      setEditingCustomer(null);
    } catch (error) {
      message.error(error.message || 'Có lỗi xảy ra');
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchText.toLowerCase()) ||
    customer.phone?.includes(searchText) ||
    customer.email?.toLowerCase().includes(searchText.toLowerCase())
  );

  const stats = {
    total: customers.length,
    withDebt: customers.filter(c => (c.debt || 0) > 0).length,
    totalDebt: customers.reduce((sum, c) => sum + (c.debt || 0), 0),
    totalOrders: customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0)
  };

  const columns = [
    {
      title: 'Khách hàng',
      dataIndex: 'name',
      key: 'name',
      width: 280,
      render: (text, record) => (
        <Space>
          <Avatar style={{ backgroundColor: '#1890ff' }} icon={<UserOutlined />}>
            {text?.charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            <Space size={4}>
              <PhoneOutlined style={{ color: '#666', fontSize: 12 }} />
              <Text type="secondary" style={{ fontSize: 12 }}>{record.phone}</Text>
            </Space>
          </div>
        </Space>
      ),
      sorter: (a, b) => (a.name || '').localeCompare(b.name || '')
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      render: (email) => email ? (
        <Space size={4}>
          <MailOutlined style={{ color: '#1890ff' }} />
          <span>{email}</span>
        </Space>
      ) : <Text type="secondary">-</Text>
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address',
      key: 'address',
      width: 250,
      ellipsis: true,
      render: (address) => address ? (
        <Tooltip title={address}>
          <Space size={4}>
            <HomeOutlined style={{ color: '#52c41a' }} />
            <span>{address}</span>
          </Space>
        </Tooltip>
      ) : <Text type="secondary">-</Text>
    },
    {
      title: 'Công nợ',
      dataIndex: 'debt',
      key: 'debt',
      width: 150,
      align: 'right',
      render: (debt) => (
        <span style={{ 
          color: (debt || 0) > 0 ? '#cf1322' : '#52c41a',
          fontWeight: 500 
        }}>
          {(debt || 0) > 0 && <WarningOutlined style={{ marginRight: 4 }} />}
          {formatCurrency(debt || 0)}
        </span>
      ),
      sorter: (a, b) => (a.debt || 0) - (b.debt || 0)
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Sửa">
            <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Tooltip title={(record.debt || 0) > 0 ? 'Không thể xóa (còn nợ)' : 'Xóa'}>
            <Popconfirm
              title="Xác nhận xóa khách hàng này?"
              onConfirm={() => handleDelete(record)}
              okText="Xóa"
              cancelText="Hủy"
              disabled={(record.debt || 0) > 0}
            >
              <Button type="text" danger icon={<DeleteOutlined />} disabled={(record.debt || 0) > 0} />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  if (loading) return <Loading tip="Đang tải danh sách khách hàng..." />;

  return (
    <div>
      <PageHeader
        title="Quản lý khách hàng"
        subtitle="Quản lý thông tin khách hàng và công nợ"
        breadcrumbs={[{ title: 'Bán hàng' }, { title: 'Khách hàng' }]}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchCustomers}>Làm mới</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>Thêm khách hàng</Button>
          </Space>
        }
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic title="Tổng khách hàng" value={stats.total} prefix={<UserOutlined />} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic title="Khách có nợ" value={stats.withDebt} prefix={<WarningOutlined />} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic title="Tổng công nợ" value={stats.totalDebt} prefix={<DollarOutlined />} formatter={(v) => formatCurrency(v)} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic title="Tổng đơn hàng" value={stats.totalOrders} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Tìm theo tên, SĐT, email..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 350 }}
          allowClear
        />
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredCustomers}
          rowKey="id"
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Tổng ${total} khách hàng` }}
        />
      </Card>

      <CustomerFormModal
        visible={modalVisible}
        customer={editingCustomer}
        onCancel={() => { setModalVisible(false); setEditingCustomer(null); }}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};

export default CustomerList;
