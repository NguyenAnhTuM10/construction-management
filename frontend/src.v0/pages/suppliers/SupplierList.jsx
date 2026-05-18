import { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Input, message, Tag,
  Tooltip, Popconfirm, Card, Row, Col, Statistic,
  Avatar, Typography
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  SearchOutlined, ReloadOutlined, ShopOutlined,
  PhoneOutlined, MailOutlined, HomeOutlined,
  DollarOutlined, BankOutlined
} from '@ant-design/icons';
import { PageHeader, Loading } from '../../components/common';
import { formatCurrency } from '../../utils/formatters';
import SupplierFormModal from './SupplierFormModal';

const { Text } = Typography;

// ===================== MOCK DATA =====================
const MOCK_SUPPLIERS = [
  { 
    id: 1, 
    code: 'NCC001',
    name: 'Công ty TNHH Xi măng Hà Tiên', 
    contactPerson: 'Nguyễn Văn Minh',
    email: 'sales@ximanghatien.vn', 
    phone: '0283456789', 
    address: '123 Nguyễn Tất Thành, Quận 4, TP.HCM',
    bankAccount: '1234567890',
    bankName: 'Vietcombank',
    debt: 0,
    totalPurchases: 450000000,
    totalOrders: 25,
    status: 'active',
    createdDate: '2024-01-10'
  },
  { 
    id: 2, 
    code: 'NCC002',
    name: 'Công ty CP Thép Việt Nhật', 
    contactPerson: 'Trần Thị Hoa',
    email: 'info@thepvietnhat.com', 
    phone: '0287654321', 
    address: '456 Quốc lộ 1A, Bình Tân, TP.HCM',
    bankAccount: '9876543210',
    bankName: 'Techcombank',
    debt: 125000000,
    totalPurchases: 890000000,
    totalOrders: 42,
    status: 'active',
    createdDate: '2024-01-15'
  },
  { 
    id: 3, 
    code: 'NCC003',
    name: 'Cơ sở VLXD Phú Thành', 
    contactPerson: 'Lê Văn Phú',
    email: 'phuthanh.vlxd@gmail.com', 
    phone: '0901234567', 
    address: '789 Tỉnh lộ 10, Bình Chánh, TP.HCM',
    bankAccount: '5555666677',
    bankName: 'BIDV',
    debt: 35000000,
    totalPurchases: 280000000,
    totalOrders: 18,
    status: 'active',
    createdDate: '2024-02-01'
  },
  { 
    id: 4, 
    code: 'NCC004',
    name: 'Công ty Sơn Dulux Việt Nam', 
    contactPerson: 'Phạm Minh Tuấn',
    email: 'dealer@dulux.vn', 
    phone: '0282223333', 
    address: '321 Điện Biên Phủ, Quận 3, TP.HCM',
    bankAccount: '1111222233',
    bankName: 'ACB',
    debt: 0,
    totalPurchases: 156000000,
    totalOrders: 12,
    status: 'active',
    createdDate: '2024-02-15'
  },
  { 
    id: 5, 
    code: 'NCC005',
    name: 'Đại lý Gạch Đồng Tâm', 
    contactPerson: 'Hoàng Thị Mai',
    email: 'dongtam.dai.ly@gmail.com', 
    phone: '0912345678', 
    address: '654 Lê Văn Việt, Quận 9, TP.HCM',
    bankAccount: '4444555566',
    bankName: 'Sacombank',
    debt: 48000000,
    totalPurchases: 320000000,
    totalOrders: 22,
    status: 'active',
    createdDate: '2024-02-20'
  },
  { 
    id: 6, 
    code: 'NCC006',
    name: 'Công ty TNHH Ống nhựa Bình Minh', 
    contactPerson: 'Võ Văn Hùng',
    email: 'sales@binhminh.com.vn', 
    phone: '0284445555', 
    address: '987 Xa lộ Hà Nội, Thủ Đức, TP.HCM',
    bankAccount: '7777888899',
    bankName: 'MB Bank',
    debt: 0,
    totalPurchases: 98000000,
    totalOrders: 8,
    status: 'inactive',
    createdDate: '2024-03-01'
  },
  { 
    id: 7, 
    code: 'NCC007',
    name: 'Mỏ Cát Tân Uyên', 
    contactPerson: 'Nguyễn Văn Cát',
    email: 'mocattanuyen@gmail.com', 
    phone: '0274123456', 
    address: 'Xã Tân Uyên, Bình Dương',
    bankAccount: '3333444455',
    bankName: 'Agribank',
    debt: 22000000,
    totalPurchases: 180000000,
    totalOrders: 35,
    status: 'active',
    createdDate: '2024-03-10'
  },
  { 
    id: 8, 
    code: 'NCC008',
    name: 'Công ty CP Đá Hóa An', 
    contactPerson: 'Trương Văn Đá',
    email: 'dahoaan@gmail.com', 
    phone: '0251789456', 
    address: 'KCN Hóa An, Biên Hòa, Đồng Nai',
    bankAccount: '6666777788',
    bankName: 'VPBank',
    debt: 0,
    totalPurchases: 245000000,
    totalOrders: 28,
    status: 'active',
    createdDate: '2024-03-15'
  },
];
// =====================================================

const SupplierList = () => {
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    setTimeout(() => {
      setSuppliers(MOCK_SUPPLIERS);
      setLoading(false);
    }, 500);
  };

  // Handlers
  const handleCreate = () => {
    setEditingSupplier(null);
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingSupplier(record);
    setModalVisible(true);
  };

  const handleDelete = (record) => {
    if (record.debt > 0) {
      message.warning('Không thể xóa nhà cung cấp còn công nợ!');
      return;
    }
    setSuppliers(prev => prev.filter(s => s.id !== record.id));
    message.success('Đã xóa nhà cung cấp');
  };

  const handleToggleStatus = (record) => {
    setSuppliers(prev => prev.map(s => 
      s.id === record.id 
        ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' }
        : s
    ));
    message.success(`Đã ${record.status === 'active' ? 'ngừng hợp tác' : 'kích hoạt'} nhà cung cấp`);
  };

  const handleFormSuccess = (supplierData) => {
    if (editingSupplier) {
      setSuppliers(prev => prev.map(s => 
        s.id === editingSupplier.id ? { ...s, ...supplierData } : s
      ));
      message.success('Cập nhật nhà cung cấp thành công!');
    } else {
      const newSupplier = {
        ...supplierData,
        id: Math.max(...suppliers.map(s => s.id)) + 1,
        code: `NCC${String(suppliers.length + 1).padStart(3, '0')}`,
        debt: 0,
        totalPurchases: 0,
        totalOrders: 0,
        status: 'active',
        createdDate: new Date().toISOString().split('T')[0]
      };
      setSuppliers(prev => [...prev, newSupplier]);
      message.success('Tạo nhà cung cấp thành công!');
    }
    setModalVisible(false);
  };

  // Filter suppliers
  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchText.toLowerCase()) ||
    supplier.code.toLowerCase().includes(searchText.toLowerCase()) ||
    supplier.phone.includes(searchText) ||
    supplier.contactPerson?.toLowerCase().includes(searchText.toLowerCase())
  );

  // Statistics
  const stats = {
    total: suppliers.length,
    active: suppliers.filter(s => s.status === 'active').length,
    withDebt: suppliers.filter(s => s.debt > 0).length,
    totalDebt: suppliers.reduce((sum, s) => sum + s.debt, 0),
    totalPurchases: suppliers.reduce((sum, s) => sum + s.totalPurchases, 0)
  };

  // Table columns
  const columns = [
    {
      title: 'Mã NCC',
      dataIndex: 'code',
      key: 'code',
      width: 100,
      render: (code) => <Text strong style={{ color: '#1890ff' }}>{code}</Text>
    },
    {
      title: 'Nhà cung cấp',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      render: (text, record) => (
        <Space>
          <Avatar 
            style={{ backgroundColor: record.status === 'active' ? '#52c41a' : '#d9d9d9' }}
            icon={<ShopOutlined />}
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
      title: 'Người liên hệ',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
      width: 150,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      ellipsis: true,
      render: (email) => email ? (
        <Space size={4}>
          <MailOutlined style={{ color: '#1890ff' }} />
          <span>{email}</span>
        </Space>
      ) : <Text type="secondary">-</Text>
    },
    {
      title: 'Tổng mua',
      dataIndex: 'totalPurchases',
      key: 'totalPurchases',
      width: 140,
      align: 'right',
      render: (amount) => (
        <Text style={{ color: '#1890ff' }}>{formatCurrency(amount)}</Text>
      ),
      sorter: (a, b) => a.totalPurchases - b.totalPurchases
    },
    {
      title: 'Công nợ',
      dataIndex: 'debt',
      key: 'debt',
      width: 130,
      align: 'right',
      render: (debt) => (
        <Text style={{ 
          color: debt > 0 ? '#cf1322' : '#52c41a',
          fontWeight: debt > 0 ? 600 : 400 
        }}>
          {formatCurrency(debt)}
        </Text>
      ),
      sorter: (a, b) => a.debt - b.debt
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? 'Đang hợp tác' : 'Ngừng hợp tác'}
        </Tag>
      ),
      filters: [
        { text: 'Đang hợp tác', value: 'active' },
        { text: 'Ngừng hợp tác', value: 'inactive' },
      ],
      onFilter: (value, record) => record.status === value
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 130,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Sửa">
            <Button 
              type="text" 
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          
          <Tooltip title={record.status === 'active' ? 'Ngừng hợp tác' : 'Kích hoạt'}>
            <Button 
              type="text" 
              onClick={() => handleToggleStatus(record)}
              style={{ color: record.status === 'active' ? '#faad14' : '#52c41a' }}
            >
              {record.status === 'active' ? '🚫' : '✓'}
            </Button>
          </Tooltip>
          
          <Tooltip title={record.debt > 0 ? 'Không thể xóa (còn nợ)' : 'Xóa'}>
            <Popconfirm
              title="Xác nhận xóa nhà cung cấp này?"
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
    return <Loading tip="Đang tải danh sách nhà cung cấp..." />;
  }

  return (
    <div>
      <PageHeader
        title="Quản lý nhà cung cấp"
        subtitle="Quản lý thông tin nhà cung cấp vật liệu xây dựng"
        breadcrumbs={[
          { title: 'Mua hàng' },
          { title: 'Nhà cung cấp' }
        ]}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchSuppliers}>
              Làm mới
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Thêm NCC
            </Button>
          </Space>
        }
      />

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" hoverable>
            <Statistic 
              title="Tổng NCC" 
              value={stats.total}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" hoverable>
            <Statistic 
              title="Đang hợp tác" 
              value={stats.active}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" hoverable>
            <Statistic 
              title="Có công nợ" 
              value={stats.withDebt}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card size="small" hoverable>
            <Statistic 
              title="Tổng nợ NCC" 
              value={stats.totalDebt}
              prefix={<DollarOutlined />}
              formatter={(value) => formatCurrency(value)}
              valueStyle={{ color: '#cf1322', fontSize: 16 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card size="small" hoverable>
            <Statistic 
              title="Tổng mua hàng" 
              value={stats.totalPurchases}
              prefix={<BankOutlined />}
              formatter={(value) => formatCurrency(value)}
              valueStyle={{ color: '#1890ff', fontSize: 16 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Search */}
      <Card style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Tìm theo mã, tên, SĐT, người liên hệ..."
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
          dataSource={filteredSuppliers}
          rowKey="id"
          scroll={{ x: 1300 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} nhà cung cấp`
          }}
        />
      </Card>

      {/* Modal Create/Edit */}
      <SupplierFormModal
        visible={modalVisible}
        supplier={editingSupplier}
        onCancel={() => {
          setModalVisible(false);
          setEditingSupplier(null);
        }}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};

export default SupplierList;
