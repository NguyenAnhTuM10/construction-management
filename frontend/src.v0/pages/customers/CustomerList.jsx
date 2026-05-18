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

const { Text } = Typography;

// ===================== MOCK DATA =====================
const MOCK_CUSTOMERS = [
  { 
    id: 1, 
    name: 'Công ty TNHH Xây dựng Phú Thịnh', 
    email: 'phuthinh@gmail.com', 
    phone: '0901234567', 
    address: '123 Nguyễn Văn Linh, Quận 7, TP.HCM',
    debt: 15000000,
    totalOrders: 25,
    createdDate: '2024-01-10'
  },
  { 
    id: 2, 
    name: 'Anh Nguyễn Văn A', 
    email: 'nguyenvana@gmail.com', 
    phone: '0912345678', 
    address: '456 Lê Văn Việt, Quận 9, TP.HCM',
    debt: 0,
    totalOrders: 12,
    createdDate: '2024-01-15'
  },
  { 
    id: 3, 
    name: 'Công ty CP Đầu tư BĐS Hoàng Gia', 
    email: 'hoanggia.invest@gmail.com', 
    phone: '0287654321', 
    address: '789 Võ Văn Tần, Quận 3, TP.HCM',
    debt: 50000000,
    totalOrders: 45,
    createdDate: '2024-02-01'
  },
  { 
    id: 4, 
    name: 'Chị Trần Thị B', 
    email: 'tranthib@yahoo.com', 
    phone: '0923456789', 
    address: '321 Phan Xích Long, Phú Nhuận, TP.HCM',
    debt: 2500000,
    totalOrders: 8,
    createdDate: '2024-02-10'
  },
  { 
    id: 5, 
    name: 'Công ty TNHH MTV Xây dựng Minh Đức', 
    email: 'minhduc.xd@gmail.com', 
    phone: '0934567890', 
    address: '654 Cách Mạng Tháng 8, Quận 10, TP.HCM',
    debt: 0,
    totalOrders: 32,
    createdDate: '2024-02-20'
  },
  { 
    id: 6, 
    name: 'Anh Lê Văn C', 
    email: 'levanc@gmail.com', 
    phone: '0945678901', 
    address: '987 Nguyễn Thị Minh Khai, Quận 1, TP.HCM',
    debt: 8500000,
    totalOrders: 15,
    createdDate: '2024-03-01'
  },
  { 
    id: 7, 
    name: 'Công ty Xây dựng Tân Phát', 
    email: 'tanphat.xd@gmail.com', 
    phone: '0286543210', 
    address: '147 Điện Biên Phủ, Bình Thạnh, TP.HCM',
    debt: 120000000,
    totalOrders: 68,
    createdDate: '2024-03-05'
  },
  { 
    id: 8, 
    name: 'Chị Phạm Thị D', 
    email: 'phamthid@gmail.com', 
    phone: '0956789012', 
    address: '258 Lý Thường Kiệt, Quận 11, TP.HCM',
    debt: 0,
    totalOrders: 5,
    createdDate: '2024-03-10'
  },
  { 
    id: 9, 
    name: 'Công ty TNHH Nội thất Á Đông', 
    email: 'adong.furniture@gmail.com', 
    phone: '0967890123', 
    address: '369 Trường Chinh, Tân Bình, TP.HCM',
    debt: 35000000,
    totalOrders: 22,
    createdDate: '2024-03-15'
  },
  { 
    id: 10, 
    name: 'Anh Hoàng Văn E', 
    email: 'hoangvane@gmail.com', 
    phone: '0978901234', 
    address: '741 Quang Trung, Gò Vấp, TP.HCM',
    debt: 0,
    totalOrders: 3,
    createdDate: '2024-03-20'
  },
];
// =====================================================

const CustomerList = () => {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Fetch customers (mock)
  const fetchCustomers = async () => {
    setLoading(true);
    setTimeout(() => {
      setCustomers(MOCK_CUSTOMERS);
      setLoading(false);
    }, 500);
  };

  // Handlers
  const handleCreate = () => {
    setEditingCustomer(null);
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingCustomer(record);
    setModalVisible(true);
  };

  const handleDelete = (record) => {
    if (record.debt > 0) {
      message.warning('Không thể xóa khách hàng còn công nợ!');
      return;
    }
    setCustomers(prev => prev.filter(c => c.id !== record.id));
    message.success('Đã xóa khách hàng');
  };

  const handleFormSuccess = (customerData) => {
    if (editingCustomer) {
      setCustomers(prev => prev.map(c => 
        c.id === editingCustomer.id ? { ...c, ...customerData } : c
      ));
      message.success('Cập nhật khách hàng thành công!');
    } else {
      const newCustomer = {
        ...customerData,
        id: Math.max(...customers.map(c => c.id)) + 1,
        debt: 0,
        totalOrders: 0,
        createdDate: new Date().toISOString().split('T')[0]
      };
      setCustomers(prev => [...prev, newCustomer]);
      message.success('Tạo khách hàng thành công!');
    }
    setModalVisible(false);
  };

  // Filter customers
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchText.toLowerCase()) ||
    customer.phone.includes(searchText) ||
    customer.email?.toLowerCase().includes(searchText.toLowerCase())
  );

  // Statistics
  const stats = {
    total: customers.length,
    withDebt: customers.filter(c => c.debt > 0).length,
    totalDebt: customers.reduce((sum, c) => sum + c.debt, 0),
    totalOrders: customers.reduce((sum, c) => sum + c.totalOrders, 0)
  };

  // Table columns
  const columns = [
    {
      title: 'Khách hàng',
      dataIndex: 'name',
      key: 'name',
      width: 280,
      render: (text, record) => (
        <Space>
          <Avatar 
            style={{ backgroundColor: '#1890ff' }}
            icon={<UserOutlined />}
          >
            {text.charAt(0)}
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
      sorter: (a, b) => a.name.localeCompare(b.name)
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
      title: 'Đơn hàng',
      dataIndex: 'totalOrders',
      key: 'totalOrders',
      width: 100,
      align: 'center',
      render: (count) => (
        <Tag color="blue">{count} đơn</Tag>
      ),
      sorter: (a, b) => a.totalOrders - b.totalOrders
    },
    {
      title: 'Công nợ',
      dataIndex: 'debt',
      key: 'debt',
      width: 150,
      align: 'right',
      render: (debt) => (
        <span style={{ 
          color: debt > 0 ? '#cf1322' : '#52c41a',
          fontWeight: 500 
        }}>
          {debt > 0 && <WarningOutlined style={{ marginRight: 4 }} />}
          {formatCurrency(debt)}
        </span>
      ),
      sorter: (a, b) => a.debt - b.debt
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Sửa">
            <Button 
              type="text" 
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          
          <Tooltip title={record.debt > 0 ? 'Không thể xóa (còn nợ)' : 'Xóa'}>
            <Popconfirm
              title="Xác nhận xóa khách hàng này?"
              onConfirm={() => handleDelete(record)}
              okText="Xóa"
              cancelText="Hủy"
              disabled={record.debt > 0}
            >
              <Button 
                type="text" 
                danger
                icon={<DeleteOutlined />}
                disabled={record.debt > 0}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  if (loading) {
    return <Loading tip="Đang tải danh sách khách hàng..." />;
  }

  return (
    <div>
      <PageHeader
        title="Quản lý khách hàng"
        subtitle="Quản lý thông tin khách hàng và công nợ"
        breadcrumbs={[
          { title: 'Bán hàng' },
          { title: 'Khách hàng' }
        ]}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchCustomers}>
              Làm mới
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Thêm khách hàng
            </Button>
          </Space>
        }
      />

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic 
              title="Tổng khách hàng" 
              value={stats.total}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic 
              title="Khách có nợ" 
              value={stats.withDebt}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic 
              title="Tổng công nợ" 
              value={stats.totalDebt}
              prefix={<DollarOutlined />}
              formatter={(value) => formatCurrency(value)}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic 
              title="Tổng đơn hàng" 
              value={stats.totalOrders}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Search */}
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

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredCustomers}
          rowKey="id"
          scroll={{ x: 1100 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} khách hàng`
          }}
        />
      </Card>

      {/* Modal Create/Edit */}
      <CustomerFormModal
        visible={modalVisible}
        customer={editingCustomer}
        onCancel={() => {
          setModalVisible(false);
          setEditingCustomer(null);
        }}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};

export default CustomerList;
