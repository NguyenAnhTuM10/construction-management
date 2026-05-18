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
import orderApi from '../../api/orderApi';
import customerApi from '../../api/customerApi';
import productApi from '../../api/productApi';

const { RangePicker } = DatePicker;

// Order Status Config
const ORDER_STATUS = {
  PENDING: { label: 'Chờ xác nhận', color: 'gold', icon: <ClockCircleOutlined /> },
  CONFIRMED: { label: 'Đã xác nhận', color: 'blue', icon: <CheckCircleOutlined /> },
  PROCESSING: { label: 'Đang xử lý', color: 'processing', icon: <ClockCircleOutlined /> },
  SHIPPING: { label: 'Đang giao', color: 'cyan', icon: <CarOutlined /> },
  COMPLETED: { label: 'Hoàn thành', color: 'success', icon: <CheckCircleOutlined /> },
  CANCELLED: { label: 'Đã hủy', color: 'error', icon: <CloseCircleOutlined /> },
};

const OrderList = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterCustomer, setFilterCustomer] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, customersRes, productsRes] = await Promise.all([
        orderApi.getAll(),
        customerApi.getAll(),
        productApi.getAll()
      ]);
      
      const ordersData = ordersRes.data || ordersRes;
      const customersData = customersRes.data || customersRes;
      const productsData = productsRes.data || productsRes;
      
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setCustomers(Array.isArray(customersData) ? customersData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (error) {
      console.error('Fetch error:', error);
      message.error(error.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleCreate = () => {
    setSelectedOrder(null);
    setFormModalVisible(true);
  };

  const handleViewDetail = async (record) => {
    try {
      const res = await orderApi.getById(record.id);
      const orderDetail = res.data || res;
      setSelectedOrder(orderDetail);
      setDetailModalVisible(true);
    } catch (error) {
      message.error('Không thể tải chi tiết đơn hàng');
    }
  };

  const handleEdit = (record) => {
    if (record.status !== 'PENDING' && record.status !== 'CONFIRMED') {
      message.warning('Chỉ có thể sửa đơn hàng ở trạng thái Chờ xác nhận hoặc Đã xác nhận!');
      return;
    }
    setSelectedOrder(record);
    setFormModalVisible(true);
  };

  const handleUpdateStatus = async (record, newStatus) => {
    try {
      await orderApi.updateStatus(record.id, newStatus);
      setOrders(prev => prev.map(o => 
        o.id === record.id ? { ...o, status: newStatus } : o
      ));
      message.success(`Cập nhật trạng thái thành công!`);
      setDetailModalVisible(false);
    } catch (error) {
      message.error(error.message || 'Không thể cập nhật trạng thái');
    }
  };

  const handleCancel = async (record) => {
    try {
      await orderApi.cancel(record.id);
      setOrders(prev => prev.map(o => 
        o.id === record.id ? { ...o, status: 'CANCELLED' } : o
      ));
      message.success('Đã hủy đơn hàng');
    } catch (error) {
      message.error(error.message || 'Không thể hủy đơn hàng');
    }
  };

  const handleFormSuccess = async (orderData) => {
    try {
      if (selectedOrder) {
        // Update
        const res = await orderApi.update(selectedOrder.id, orderData);
        const updated = res.data || res;
        setOrders(prev => prev.map(o => o.id === selectedOrder.id ? updated : o));
        message.success('Cập nhật đơn hàng thành công!');
      } else {
        // Create
        const res = await orderApi.create(orderData);
        const created = res.data || res;
        setOrders(prev => [...prev, created]);
        message.success('Tạo đơn hàng thành công!');
      }
      setFormModalVisible(false);
      setSelectedOrder(null);
    } catch (error) {
      message.error(error.message || 'Có lỗi xảy ra');
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchSearch = 
      !searchText || 
      order.customerName?.toLowerCase().includes(searchText.toLowerCase()) ||
      String(order.id).includes(searchText);
    
    const matchStatus = !filterStatus || order.status === filterStatus;
    const matchCustomer = !filterCustomer || order.customerId === filterCustomer;
    
    let matchDate = true;
    if (dateRange && dateRange[0] && dateRange[1]) {
      const orderDate = new Date(order.createdDate);
      matchDate = orderDate >= dateRange[0].startOf('day') && orderDate <= dateRange[1].endOf('day');
    }
    
    return matchSearch && matchStatus && matchCustomer && matchDate;
  });

  // Statistics
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'PENDING').length,
    processing: orders.filter(o => ['CONFIRMED', 'PROCESSING', 'SHIPPING'].includes(o.status)).length,
    completed: orders.filter(o => o.status === 'COMPLETED').length,
    totalRevenue: orders.filter(o => o.status === 'COMPLETED').reduce((sum, o) => sum + (o.total || 0), 0),
    totalDebt: orders.reduce((sum, o) => sum + ((o.total || 0) - (o.paidAmount || 0)), 0)
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
        label: 'Chỉnh sửa',
        icon: <EditOutlined />,
        onClick: () => handleEdit(record),
        disabled: !['PENDING', 'CONFIRMED'].includes(record.status)
      },
      { type: 'divider' },
      // Status transitions
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
        onClick: () => handleCancel(record)
      }] : [])
    ]
  });

  // Table columns
  const columns = [
    {
      title: 'Mã đơn',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      fixed: 'left',
      render: (id) => <span style={{ fontWeight: 500, color: '#1890ff' }}>#{id}</span>
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 200,
      ellipsis: true,
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{name}</div>
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
        const debt = (record.total || 0) - (record.paidAmount || 0);
        const isPaid = debt <= 0;
        return (
          <div>
            <div style={{ color: '#52c41a' }}>{formatCurrency(record.paidAmount || 0)}</div>
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
        const statusConfig = ORDER_STATUS[status] || { label: status, color: 'default' };
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
            <Button icon={<ReloadOutlined />} onClick={fetchData}>
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
            {customers.map(c => (
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
        customers={customers}
        products={products}
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
