import { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Input, message, Tag,
  Tooltip, Card, Row, Col, Statistic, Select,
  DatePicker, Dropdown, Badge
} from 'antd';
import { 
  PlusOutlined, EyeOutlined, EditOutlined,
  SearchOutlined, ReloadOutlined, ShoppingCartOutlined,
  ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined,
  CarOutlined, MoreOutlined, PrinterOutlined, DollarOutlined
} from '@ant-design/icons';
import { PageHeader, Loading } from '../../components/common';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import OrderFormModal from './OrderFormModal';
import OrderDetailModal from './OrderDetailModal';

const { RangePicker } = DatePicker;

// ===================== MOCK DATA =====================
const ORDER_STATUS = {
  PENDING: { label: 'Chờ xác nhận', color: 'gold', icon: <ClockCircleOutlined /> },
  CONFIRMED: { label: 'Đã xác nhận', color: 'blue', icon: <CheckCircleOutlined /> },
  PROCESSING: { label: 'Đang xử lý', color: 'processing', icon: <ClockCircleOutlined /> },
  SHIPPING: { label: 'Đang giao', color: 'cyan', icon: <CarOutlined /> },
  COMPLETED: { label: 'Hoàn thành', color: 'success', icon: <CheckCircleOutlined /> },
  CANCELLED: { label: 'Đã hủy', color: 'error', icon: <CloseCircleOutlined /> },
};

const MOCK_ORDERS = [
  { 
    id: 1, 
    customerId: 1,
    customerName: 'Công ty TNHH Xây dựng Phú Thịnh',
    customerPhone: '0901234567',
    employeeId: 1,
    employeeName: 'Nguyễn Văn A',
    total: 45000000,
    paidAmount: 45000000,
    status: 'COMPLETED',
    itemCount: 5,
    createdDate: '2024-12-01T08:30:00',
    items: [
      { productId: 1, productName: 'Xi măng Hà Tiên PCB40', quantity: 100, price: 95000, subtotal: 9500000 },
      { productId: 2, productName: 'Thép phi 10', quantity: 200, price: 145000, subtotal: 29000000 },
      { productId: 3, productName: 'Cát vàng loại 1', quantity: 30, price: 220000, subtotal: 6600000 },
    ]
  },
  { 
    id: 2, 
    customerId: 3,
    customerName: 'Công ty CP Đầu tư BĐS Hoàng Gia',
    customerPhone: '0287654321',
    employeeId: 2,
    employeeName: 'Trần Thị B',
    total: 125000000,
    paidAmount: 75000000,
    status: 'SHIPPING',
    itemCount: 8,
    createdDate: '2024-12-10T14:20:00',
    items: [
      { productId: 4, productName: 'Gạch ống 4 lỗ', quantity: 10000, price: 1200, subtotal: 12000000 },
      { productId: 5, productName: 'Xi măng INSEE', quantity: 500, price: 105000, subtotal: 52500000 },
      { productId: 6, productName: 'Thép phi 12', quantity: 300, price: 180000, subtotal: 54000000 },
    ]
  },
  { 
    id: 3, 
    customerId: 2,
    customerName: 'Anh Nguyễn Văn A',
    customerPhone: '0912345678',
    employeeId: 1,
    employeeName: 'Nguyễn Văn A',
    total: 8500000,
    paidAmount: 8500000,
    status: 'COMPLETED',
    itemCount: 3,
    createdDate: '2024-12-12T09:15:00',
    items: [
      { productId: 7, productName: 'Sơn Dulux nội thất', quantity: 10, price: 550000, subtotal: 5500000 },
      { productId: 8, productName: 'Ống PVC phi 21', quantity: 50, price: 35000, subtotal: 1750000 },
    ]
  },
  { 
    id: 4, 
    customerId: 7,
    customerName: 'Công ty Xây dựng Tân Phát',
    customerPhone: '0286543210',
    employeeId: 3,
    employeeName: 'Lê Văn C',
    total: 320000000,
    paidAmount: 200000000,
    status: 'PROCESSING',
    itemCount: 12,
    createdDate: '2024-12-15T11:00:00',
    items: [
      { productId: 9, productName: 'Thép phi 16', quantity: 500, price: 240000, subtotal: 120000000 },
      { productId: 10, productName: 'Xi măng Hà Tiên PCB40', quantity: 1000, price: 95000, subtotal: 95000000 },
      { productId: 11, productName: 'Đá 1x2', quantity: 300, price: 350000, subtotal: 105000000 },
    ]
  },
  { 
    id: 5, 
    customerId: 4,
    customerName: 'Chị Trần Thị B',
    customerPhone: '0923456789',
    employeeId: 2,
    employeeName: 'Trần Thị B',
    total: 15600000,
    paidAmount: 0,
    status: 'PENDING',
    itemCount: 4,
    createdDate: '2024-12-18T16:45:00',
    items: [
      { productId: 12, productName: 'Gạch ống 6 lỗ', quantity: 5000, price: 1500, subtotal: 7500000 },
      { productId: 13, productName: 'Cát đen san lấp', quantity: 50, price: 150000, subtotal: 7500000 },
    ]
  },
  { 
    id: 6, 
    customerId: 6,
    customerName: 'Anh Lê Văn C',
    customerPhone: '0945678901',
    employeeId: 1,
    employeeName: 'Nguyễn Văn A',
    total: 5200000,
    paidAmount: 5200000,
    status: 'COMPLETED',
    itemCount: 2,
    createdDate: '2024-12-19T10:30:00',
    items: [
      { productId: 14, productName: 'Ống PVC phi 27', quantity: 100, price: 48000, subtotal: 4800000 },
    ]
  },
  { 
    id: 7, 
    customerId: 9,
    customerName: 'Công ty TNHH Nội thất Á Đông',
    customerPhone: '0967890123',
    employeeId: 3,
    employeeName: 'Lê Văn C',
    total: 78000000,
    paidAmount: 78000000,
    status: 'CANCELLED',
    itemCount: 6,
    createdDate: '2024-12-20T08:00:00',
    items: []
  },
  { 
    id: 8, 
    customerId: 1,
    customerName: 'Công ty TNHH Xây dựng Phú Thịnh',
    customerPhone: '0901234567',
    employeeId: 2,
    employeeName: 'Trần Thị B',
    total: 92000000,
    paidAmount: 50000000,
    status: 'CONFIRMED',
    itemCount: 7,
    createdDate: '2024-12-22T13:20:00',
    items: [
      { productId: 15, productName: 'Xi măng Hà Tiên PCB40', quantity: 400, price: 95000, subtotal: 38000000 },
      { productId: 16, productName: 'Thép phi 10', quantity: 300, price: 145000, subtotal: 43500000 },
    ]
  },
  { 
    id: 9, 
    customerId: 5,
    customerName: 'Công ty TNHH MTV Xây dựng Minh Đức',
    customerPhone: '0934567890',
    employeeId: 1,
    employeeName: 'Nguyễn Văn A',
    total: 156000000,
    paidAmount: 100000000,
    status: 'SHIPPING',
    itemCount: 9,
    createdDate: '2024-12-25T09:00:00',
    items: []
  },
  { 
    id: 10, 
    customerId: 8,
    customerName: 'Chị Phạm Thị D',
    customerPhone: '0956789012',
    employeeId: 2,
    employeeName: 'Trần Thị B',
    total: 3200000,
    paidAmount: 0,
    status: 'PENDING',
    itemCount: 2,
    createdDate: '2024-12-28T15:30:00',
    items: []
  },
];

const MOCK_CUSTOMERS = [
  { id: 1, name: 'Công ty TNHH Xây dựng Phú Thịnh', phone: '0901234567' },
  { id: 2, name: 'Anh Nguyễn Văn A', phone: '0912345678' },
  { id: 3, name: 'Công ty CP Đầu tư BĐS Hoàng Gia', phone: '0287654321' },
  { id: 4, name: 'Chị Trần Thị B', phone: '0923456789' },
  { id: 5, name: 'Công ty TNHH MTV Xây dựng Minh Đức', phone: '0934567890' },
];

const MOCK_PRODUCTS = [
  { id: 1, code: 'XIM001', name: 'Xi măng Hà Tiên PCB40', unit: 'bao', sellPrice: 95000, stock: 500 },
  { id: 2, code: 'THE001', name: 'Thép phi 10', unit: 'cây', sellPrice: 145000, stock: 800 },
  { id: 3, code: 'CAT001', name: 'Cát vàng loại 1', unit: 'm³', sellPrice: 220000, stock: 150 },
  { id: 4, code: 'GAC001', name: 'Gạch ống 4 lỗ', unit: 'viên', sellPrice: 1200, stock: 5000 },
  { id: 5, code: 'XIM002', name: 'Xi măng INSEE', unit: 'bao', sellPrice: 105000, stock: 300 },
  { id: 6, code: 'THE002', name: 'Thép phi 12', unit: 'cây', sellPrice: 180000, stock: 600 },
  { id: 7, code: 'SON001', name: 'Sơn Dulux nội thất', unit: 'thùng', sellPrice: 550000, stock: 25 },
  { id: 8, code: 'ONG001', name: 'Ống PVC phi 21', unit: 'cây', sellPrice: 35000, stock: 200 },
];
// =====================================================

const OrderList = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterCustomer, setFilterCustomer] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setTimeout(() => {
      setOrders(MOCK_ORDERS);
      setLoading(false);
    }, 500);
  };

  // Handlers
  const handleCreate = () => {
    setSelectedOrder(null);
    setFormModalVisible(true);
  };

  const handleViewDetail = (record) => {
    setSelectedOrder(record);
    setDetailModalVisible(true);
  };

  const handleEdit = (record) => {
    if (record.status !== 'PENDING' && record.status !== 'CONFIRMED') {
      message.warning('Chỉ có thể sửa đơn hàng ở trạng thái Chờ xác nhận hoặc Đã xác nhận!');
      return;
    }
    setSelectedOrder(record);
    setFormModalVisible(true);
  };

  const handleUpdateStatus = (record, newStatus) => {
    setOrders(prev => prev.map(o => 
      o.id === record.id ? { ...o, status: newStatus } : o
    ));
    message.success(`Cập nhật trạng thái thành ${ORDER_STATUS[newStatus].label}`);
  };

  const handleFormSuccess = (orderData) => {
    if (selectedOrder) {
      setOrders(prev => prev.map(o => 
        o.id === selectedOrder.id ? { ...o, ...orderData } : o
      ));
      message.success('Cập nhật đơn hàng thành công!');
    } else {
      const newOrder = {
        ...orderData,
        id: Math.max(...orders.map(o => o.id)) + 1,
        status: 'PENDING',
        paidAmount: 0,
        createdDate: new Date().toISOString(),
      };
      setOrders(prev => [newOrder, ...prev]);
      message.success('Tạo đơn hàng thành công!');
    }
    setFormModalVisible(false);
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchSearch = 
      order.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
      order.id.toString().includes(searchText);
    
    const matchStatus = !filterStatus || order.status === filterStatus;
    const matchCustomer = !filterCustomer || order.customerId === filterCustomer;
    
    let matchDate = true;
    if (dateRange && dateRange[0] && dateRange[1]) {
      const orderDate = new Date(order.createdDate);
      matchDate = orderDate >= dateRange[0].startOf('day') && 
                  orderDate <= dateRange[1].endOf('day');
    }
    
    return matchSearch && matchStatus && matchCustomer && matchDate;
  });

  // Statistics
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'PENDING').length,
    processing: orders.filter(o => ['CONFIRMED', 'PROCESSING', 'SHIPPING'].includes(o.status)).length,
    completed: orders.filter(o => o.status === 'COMPLETED').length,
    totalRevenue: orders.filter(o => o.status === 'COMPLETED').reduce((sum, o) => sum + o.total, 0),
    totalDebt: orders.reduce((sum, o) => sum + (o.total - o.paidAmount), 0)
  };

  // Action menu for each row
  const getActionMenu = (record) => ({
    items: [
      {
        key: 'view',
        label: 'Xem chi tiết',
        icon: <EyeOutlined />,
        onClick: () => handleViewDetail(record)
      },
      {
        key: 'edit',
        label: 'Sửa đơn hàng',
        icon: <EditOutlined />,
        disabled: !['PENDING', 'CONFIRMED'].includes(record.status),
        onClick: () => handleEdit(record)
      },
      {
        key: 'print',
        label: 'In đơn hàng',
        icon: <PrinterOutlined />,
      },
      { type: 'divider' },
      ...(record.status === 'PENDING' ? [{
        key: 'confirm',
        label: 'Xác nhận đơn',
        onClick: () => handleUpdateStatus(record, 'CONFIRMED')
      }] : []),
      ...(record.status === 'CONFIRMED' ? [{
        key: 'process',
        label: 'Bắt đầu xử lý',
        onClick: () => handleUpdateStatus(record, 'PROCESSING')
      }] : []),
      ...(record.status === 'PROCESSING' ? [{
        key: 'ship',
        label: 'Giao hàng',
        onClick: () => handleUpdateStatus(record, 'SHIPPING')
      }] : []),
      ...(record.status === 'SHIPPING' ? [{
        key: 'complete',
        label: 'Hoàn thành',
        onClick: () => handleUpdateStatus(record, 'COMPLETED')
      }] : []),
      ...(['PENDING', 'CONFIRMED'].includes(record.status) ? [{
        key: 'cancel',
        label: 'Hủy đơn',
        danger: true,
        onClick: () => handleUpdateStatus(record, 'CANCELLED')
      }] : []),
    ]
  });

  // Table columns
  const columns = [
    {
      title: 'Mã đơn',
      dataIndex: 'id',
      key: 'id',
      width: 90,
      render: (id) => <span style={{ fontWeight: 600, color: '#1890ff' }}>#{id}</span>
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 220,
      ellipsis: true,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <small style={{ color: '#666' }}>{record.customerPhone}</small>
        </div>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdDate',
      key: 'createdDate',
      width: 150,
      render: (date) => formatDateTime(date),
      sorter: (a, b) => new Date(a.createdDate) - new Date(b.createdDate)
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total',
      key: 'total',
      width: 130,
      align: 'right',
      render: (total) => <span style={{ fontWeight: 600 }}>{formatCurrency(total)}</span>,
      sorter: (a, b) => a.total - b.total
    },
    {
      title: 'Thanh toán',
      key: 'payment',
      width: 140,
      align: 'right',
      render: (_, record) => {
        const debt = record.total - record.paidAmount;
        const isPaid = debt === 0;
        return (
          <div>
            <div style={{ color: '#52c41a' }}>{formatCurrency(record.paidAmount)}</div>
            {!isPaid && (
              <small style={{ color: '#cf1322' }}>Còn nợ: {formatCurrency(debt)}</small>
            )}
          </div>
        );
      }
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status) => {
        const statusConfig = ORDER_STATUS[status];
        return (
          <Tag color={statusConfig.color} icon={statusConfig.icon}>
            {statusConfig.label}
          </Tag>
        );
      },
      filters: Object.entries(ORDER_STATUS).map(([key, value]) => ({
        text: value.label,
        value: key
      })),
      onFilter: (value, record) => record.status === value
    },
    {
      title: 'NV bán hàng',
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: 120,
      ellipsis: true
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      fixed: 'right',
      render: (_, record) => (
        <Dropdown menu={getActionMenu(record)} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      )
    }
  ];

  if (loading) {
    return <Loading tip="Đang tải đơn hàng..." />;
  }

  return (
    <div>
      <PageHeader
        title="Quản lý đơn hàng"
        subtitle="Tạo và quản lý đơn hàng bán vật liệu xây dựng"
        breadcrumbs={[
          { title: 'Bán hàng' },
          { title: 'Đơn hàng' }
        ]}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchOrders}>
              Làm mới
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Tạo đơn hàng
            </Button>
          </Space>
        }
      />

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" hoverable>
            <Statistic 
              title="Tổng đơn" 
              value={stats.total}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" hoverable>
            <Statistic 
              title="Chờ xử lý" 
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" hoverable>
            <Statistic 
              title="Đang xử lý" 
              value={stats.processing}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" hoverable>
            <Statistic 
              title="Hoàn thành" 
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" hoverable>
            <Statistic 
              title="Doanh thu" 
              value={stats.totalRevenue}
              formatter={(value) => formatCurrency(value)}
              valueStyle={{ color: '#52c41a', fontSize: 16 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" hoverable>
            <Statistic 
              title="Công nợ" 
              value={stats.totalDebt}
              prefix={<DollarOutlined />}
              formatter={(value) => formatCurrency(value)}
              valueStyle={{ color: '#cf1322', fontSize: 16 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input.Search
            placeholder="Tìm theo mã đơn, tên khách..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 220 }}
            allowClear
          />
          
          <Select
            placeholder="Trạng thái"
            value={filterStatus}
            onChange={setFilterStatus}
            style={{ width: 150 }}
            allowClear
          >
            {Object.entries(ORDER_STATUS).map(([key, value]) => (
              <Select.Option key={key} value={key}>
                <Tag color={value.color}>{value.label}</Tag>
              </Select.Option>
            ))}
          </Select>
          
          <Select
            placeholder="Khách hàng"
            value={filterCustomer}
            onChange={setFilterCustomer}
            style={{ width: 200 }}
            allowClear
            showSearch
            optionFilterProp="children"
          >
            {MOCK_CUSTOMERS.map(c => (
              <Select.Option key={c.id} value={c.id}>
                {c.name}
              </Select.Option>
            ))}
          </Select>
          
          <RangePicker 
            placeholder={['Từ ngày', 'Đến ngày']}
            onChange={setDateRange}
            format="DD/MM/YYYY"
          />
        </Space>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredOrders}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} đơn hàng`
          }}
        />
      </Card>

      {/* Modal Create/Edit */}
      <OrderFormModal
        visible={formModalVisible}
        order={selectedOrder}
        customers={MOCK_CUSTOMERS}
        products={MOCK_PRODUCTS}
        onCancel={() => {
          setFormModalVisible(false);
          setSelectedOrder(null);
        }}
        onSuccess={handleFormSuccess}
      />

      {/* Modal Detail */}
      <OrderDetailModal
        visible={detailModalVisible}
        order={selectedOrder}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedOrder(null);
        }}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
};

export default OrderList;
