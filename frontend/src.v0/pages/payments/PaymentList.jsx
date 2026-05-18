import { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Input, message, Tag,
  Tooltip, Card, Row, Col, Statistic, Select,
  DatePicker, Typography, Avatar
} from 'antd';
import { 
  PlusOutlined, EyeOutlined, DeleteOutlined,
  SearchOutlined, ReloadOutlined, DollarOutlined,
  CreditCardOutlined, BankOutlined, WalletOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { PageHeader, Loading } from '../../components/common';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import PaymentFormModal from './PaymentFormModal';
import PaymentDetailModal from './PaymentDetailModal';

const { RangePicker } = DatePicker;
const { Text } = Typography;

// ===================== MOCK DATA =====================
const PAYMENT_METHODS = {
  CASH: { label: 'Tiền mặt', color: 'green', icon: <WalletOutlined /> },
  BANK_TRANSFER: { label: 'Chuyển khoản', color: 'blue', icon: <BankOutlined /> },
  CREDIT_CARD: { label: 'Thẻ tín dụng', color: 'purple', icon: <CreditCardOutlined /> },
};

const MOCK_PAYMENTS = [
  { 
    id: 1, 
    orderId: 1,
    customerId: 1,
    customerName: 'Công ty TNHH Xây dựng Phú Thịnh',
    amount: 45000000,
    paymentDate: '2024-12-01T10:30:00',
    paymentMethod: 'BANK_TRANSFER',
    reference: 'VCB123456789',
    note: 'Thanh toán đầy đủ đơn hàng #1',
    createdByUsername: 'admin',
    createdDate: '2024-12-01T10:30:00',
    orderTotal: 45000000,
    orderPaidAmount: 45000000,
    orderRemainingDebt: 0
  },
  { 
    id: 2, 
    orderId: 2,
    customerId: 3,
    customerName: 'Công ty CP Đầu tư BĐS Hoàng Gia',
    amount: 50000000,
    paymentDate: '2024-12-10T15:00:00',
    paymentMethod: 'BANK_TRANSFER',
    reference: 'TCB987654321',
    note: 'Thanh toán đợt 1',
    createdByUsername: 'accountant',
    createdDate: '2024-12-10T15:00:00',
    orderTotal: 125000000,
    orderPaidAmount: 50000000,
    orderRemainingDebt: 75000000
  },
  { 
    id: 3, 
    orderId: 2,
    customerId: 3,
    customerName: 'Công ty CP Đầu tư BĐS Hoàng Gia',
    amount: 25000000,
    paymentDate: '2024-12-15T09:00:00',
    paymentMethod: 'CASH',
    reference: '',
    note: 'Thanh toán đợt 2',
    createdByUsername: 'admin',
    createdDate: '2024-12-15T09:00:00',
    orderTotal: 125000000,
    orderPaidAmount: 75000000,
    orderRemainingDebt: 50000000
  },
  { 
    id: 4, 
    orderId: 3,
    customerId: 2,
    customerName: 'Anh Nguyễn Văn A',
    amount: 8500000,
    paymentDate: '2024-12-12T11:00:00',
    paymentMethod: 'CASH',
    reference: '',
    note: 'Thanh toán đầy đủ',
    createdByUsername: 'sale01',
    createdDate: '2024-12-12T11:00:00',
    orderTotal: 8500000,
    orderPaidAmount: 8500000,
    orderRemainingDebt: 0
  },
  { 
    id: 5, 
    orderId: 4,
    customerId: 7,
    customerName: 'Công ty Xây dựng Tân Phát',
    amount: 100000000,
    paymentDate: '2024-12-16T14:30:00',
    paymentMethod: 'BANK_TRANSFER',
    reference: 'BIDV456789123',
    note: 'Tạm ứng 50%',
    createdByUsername: 'accountant',
    createdDate: '2024-12-16T14:30:00',
    orderTotal: 320000000,
    orderPaidAmount: 100000000,
    orderRemainingDebt: 220000000
  },
  { 
    id: 6, 
    orderId: 4,
    customerId: 7,
    customerName: 'Công ty Xây dựng Tân Phát',
    amount: 100000000,
    paymentDate: '2024-12-20T10:00:00',
    paymentMethod: 'BANK_TRANSFER',
    reference: 'BIDV456789456',
    note: 'Thanh toán đợt 2',
    createdByUsername: 'admin',
    createdDate: '2024-12-20T10:00:00',
    orderTotal: 320000000,
    orderPaidAmount: 200000000,
    orderRemainingDebt: 120000000
  },
  { 
    id: 7, 
    orderId: 6,
    customerId: 6,
    customerName: 'Anh Lê Văn C',
    amount: 5200000,
    paymentDate: '2024-12-19T11:30:00',
    paymentMethod: 'CREDIT_CARD',
    reference: 'VISA****1234',
    note: '',
    createdByUsername: 'sale01',
    createdDate: '2024-12-19T11:30:00',
    orderTotal: 5200000,
    orderPaidAmount: 5200000,
    orderRemainingDebt: 0
  },
  { 
    id: 8, 
    orderId: 8,
    customerId: 1,
    customerName: 'Công ty TNHH Xây dựng Phú Thịnh',
    amount: 50000000,
    paymentDate: '2024-12-23T16:00:00',
    paymentMethod: 'BANK_TRANSFER',
    reference: 'VCB789456123',
    note: 'Thanh toán đợt 1 đơn #8',
    createdByUsername: 'accountant',
    createdDate: '2024-12-23T16:00:00',
    orderTotal: 92000000,
    orderPaidAmount: 50000000,
    orderRemainingDebt: 42000000
  },
  { 
    id: 9, 
    orderId: 9,
    customerId: 5,
    customerName: 'Công ty TNHH MTV Xây dựng Minh Đức',
    amount: 100000000,
    paymentDate: '2024-12-25T10:30:00',
    paymentMethod: 'BANK_TRANSFER',
    reference: 'ACB123789456',
    note: 'Tạm ứng',
    createdByUsername: 'admin',
    createdDate: '2024-12-25T10:30:00',
    orderTotal: 156000000,
    orderPaidAmount: 100000000,
    orderRemainingDebt: 56000000
  },
];

const MOCK_ORDERS_WITH_DEBT = [
  { id: 2, customerName: 'Công ty CP Đầu tư BĐS Hoàng Gia', total: 125000000, paidAmount: 75000000, debt: 50000000 },
  { id: 4, customerName: 'Công ty Xây dựng Tân Phát', total: 320000000, paidAmount: 200000000, debt: 120000000 },
  { id: 5, customerName: 'Chị Trần Thị B', total: 15600000, paidAmount: 0, debt: 15600000 },
  { id: 8, customerName: 'Công ty TNHH Xây dựng Phú Thịnh', total: 92000000, paidAmount: 50000000, debt: 42000000 },
  { id: 9, customerName: 'Công ty TNHH MTV Xây dựng Minh Đức', total: 156000000, paidAmount: 100000000, debt: 56000000 },
  { id: 10, customerName: 'Chị Phạm Thị D', total: 3200000, paidAmount: 0, debt: 3200000 },
];
// =====================================================

const PaymentList = () => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filterMethod, setFilterMethod] = useState(null);
  const [filterCustomer, setFilterCustomer] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    setTimeout(() => {
      setPayments(MOCK_PAYMENTS);
      setLoading(false);
    }, 500);
  };

  // Handlers
  const handleCreate = () => {
    setSelectedPayment(null);
    setFormModalVisible(true);
  };

  const handleViewDetail = (record) => {
    setSelectedPayment(record);
    setDetailModalVisible(true);
  };

  const handleDelete = (record) => {
    setPayments(prev => prev.filter(p => p.id !== record.id));
    message.success('Đã xóa phiếu thu');
  };

  const handleFormSuccess = (paymentData) => {
    const order = MOCK_ORDERS_WITH_DEBT.find(o => o.id === paymentData.orderId);
    const newPayment = {
      ...paymentData,
      id: Math.max(...payments.map(p => p.id)) + 1,
      customerName: order?.customerName,
      orderTotal: order?.total,
      orderPaidAmount: (order?.paidAmount || 0) + paymentData.amount,
      orderRemainingDebt: order?.debt - paymentData.amount,
      createdByUsername: 'admin',
      createdDate: new Date().toISOString(),
    };
    setPayments(prev => [newPayment, ...prev]);
    message.success('Tạo phiếu thu thành công!');
    setFormModalVisible(false);
  };

  // Get unique customers from payments
  const uniqueCustomers = [...new Map(payments.map(p => [p.customerId, { id: p.customerId, name: p.customerName }])).values()];

  // Filter payments
  const filteredPayments = payments.filter(payment => {
    const matchSearch = 
      payment.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
      payment.orderId.toString().includes(searchText) ||
      payment.reference?.toLowerCase().includes(searchText.toLowerCase());
    
    const matchMethod = !filterMethod || payment.paymentMethod === filterMethod;
    const matchCustomer = !filterCustomer || payment.customerId === filterCustomer;
    
    let matchDate = true;
    if (dateRange && dateRange[0] && dateRange[1]) {
      const paymentDate = new Date(payment.paymentDate);
      matchDate = paymentDate >= dateRange[0].startOf('day') && 
                  paymentDate <= dateRange[1].endOf('day');
    }
    
    return matchSearch && matchMethod && matchCustomer && matchDate;
  });

  // Statistics
  const stats = {
    totalPayments: payments.length,
    totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
    cashAmount: payments.filter(p => p.paymentMethod === 'CASH').reduce((sum, p) => sum + p.amount, 0),
    bankAmount: payments.filter(p => p.paymentMethod === 'BANK_TRANSFER').reduce((sum, p) => sum + p.amount, 0),
    todayAmount: payments
      .filter(p => new Date(p.paymentDate).toDateString() === new Date().toDateString())
      .reduce((sum, p) => sum + p.amount, 0)
  };

  // Table columns
  const columns = [
    {
      title: 'Mã PT',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id) => <Text strong style={{ color: '#1890ff' }}>#{id}</Text>
    },
    {
      title: 'Đơn hàng',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 90,
      render: (orderId) => <Tag color="blue">ĐH #{orderId}</Tag>
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 220,
      ellipsis: true,
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      align: 'right',
      render: (amount) => (
        <Text strong style={{ color: '#52c41a', fontSize: 15 }}>
          {formatCurrency(amount)}
        </Text>
      ),
      sorter: (a, b) => a.amount - b.amount
    },
    {
      title: 'Phương thức',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 140,
      render: (method) => {
        const config = PAYMENT_METHODS[method];
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.label}
          </Tag>
        );
      },
      filters: Object.entries(PAYMENT_METHODS).map(([key, value]) => ({
        text: value.label,
        value: key
      })),
      onFilter: (value, record) => record.paymentMethod === value
    },
    {
      title: 'Ngày thanh toán',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      width: 150,
      render: (date) => formatDateTime(date),
      sorter: (a, b) => new Date(a.paymentDate) - new Date(b.paymentDate)
    },
    {
      title: 'Mã giao dịch',
      dataIndex: 'reference',
      key: 'reference',
      width: 140,
      ellipsis: true,
      render: (ref) => ref || <Text type="secondary">-</Text>
    },
    {
      title: 'Người tạo',
      dataIndex: 'createdByUsername',
      key: 'createdByUsername',
      width: 100,
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button 
              type="text" 
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button 
              type="text" 
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  if (loading) {
    return <Loading tip="Đang tải danh sách thanh toán..." />;
  }

  return (
    <div>
      <PageHeader
        title="Quản lý thanh toán"
        subtitle="Quản lý các phiếu thu thanh toán đơn hàng"
        breadcrumbs={[
          { title: 'Kế toán' },
          { title: 'Thanh toán' }
        ]}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchPayments}>
              Làm mới
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Tạo phiếu thu
            </Button>
          </Space>
        }
      />

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" hoverable>
            <Statistic 
              title="Tổng phiếu thu" 
              value={stats.totalPayments}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={5}>
          <Card size="small" hoverable>
            <Statistic 
              title="Tổng thu" 
              value={stats.totalAmount}
              formatter={(value) => formatCurrency(value)}
              valueStyle={{ color: '#52c41a', fontSize: 18 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={5}>
          <Card size="small" hoverable>
            <Statistic 
              title="Tiền mặt" 
              value={stats.cashAmount}
              prefix={<WalletOutlined />}
              formatter={(value) => formatCurrency(value)}
              valueStyle={{ color: '#52c41a', fontSize: 16 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={5}>
          <Card size="small" hoverable>
            <Statistic 
              title="Chuyển khoản" 
              value={stats.bankAmount}
              prefix={<BankOutlined />}
              formatter={(value) => formatCurrency(value)}
              valueStyle={{ color: '#1890ff', fontSize: 16 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={5}>
          <Card size="small" hoverable>
            <Statistic 
              title="Hôm nay" 
              value={stats.todayAmount}
              prefix={<DollarOutlined />}
              formatter={(value) => formatCurrency(value)}
              valueStyle={{ color: '#faad14', fontSize: 16 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input.Search
            placeholder="Tìm theo mã đơn, khách hàng, mã GD..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          
          <Select
            placeholder="Phương thức"
            value={filterMethod}
            onChange={setFilterMethod}
            style={{ width: 150 }}
            allowClear
          >
            {Object.entries(PAYMENT_METHODS).map(([key, value]) => (
              <Select.Option key={key} value={key}>
                <Space>
                  {value.icon}
                  {value.label}
                </Space>
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
            {uniqueCustomers.map(c => (
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
          dataSource={filteredPayments}
          rowKey="id"
          scroll={{ x: 1300 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} phiếu thu`
          }}
          summary={(pageData) => {
            const totalPage = pageData.reduce((sum, p) => sum + p.amount, 0);
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={3}>
                  <Text strong>Tổng trang hiện tại</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <Text strong style={{ color: '#52c41a', fontSize: 16 }}>
                    {formatCurrency(totalPage)}
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} colSpan={5} />
              </Table.Summary.Row>
            );
          }}
        />
      </Card>

      {/* Modal Create */}
      <PaymentFormModal
        visible={formModalVisible}
        ordersWithDebt={MOCK_ORDERS_WITH_DEBT}
        onCancel={() => setFormModalVisible(false)}
        onSuccess={handleFormSuccess}
      />

      {/* Modal Detail */}
      <PaymentDetailModal
        visible={detailModalVisible}
        payment={selectedPayment}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedPayment(null);
        }}
      />
    </div>
  );
};

export default PaymentList;
