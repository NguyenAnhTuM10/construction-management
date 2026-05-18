import { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Input, message, Tag,
  Tooltip, Card, Row, Col, Statistic, Select,
  DatePicker, Typography, Avatar, Popconfirm
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
import paymentApi from '../../api/paymentApi';
import orderApi from '../../api/orderApi';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const PAYMENT_METHODS = {
  CASH: { label: 'Tiền mặt', color: 'green', icon: <WalletOutlined /> },
  BANK_TRANSFER: { label: 'Chuyển khoản', color: 'blue', icon: <BankOutlined /> },
  TRANSFER: { label: 'Chuyển khoản', color: 'blue', icon: <BankOutlined /> },
  CREDIT_CARD: { label: 'Thẻ tín dụng', color: 'purple', icon: <CreditCardOutlined /> },
};

const PaymentList = () => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filterMethod, setFilterMethod] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [paymentsRes, ordersRes] = await Promise.all([
        paymentApi.getAll(),
        orderApi.getAll()
      ]);
      const paymentsData = paymentsRes.data || paymentsRes;
      const ordersData = ordersRes.data || ordersRes;
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (error) {
      console.error('Fetch error:', error);
      message.error(error.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedPayment(null);
    setFormModalVisible(true);
  };

  const handleViewDetail = async (record) => {
    try {
      const res = await paymentApi.getById(record.id);
      setSelectedPayment(res.data || res);
      setDetailModalVisible(true);
    } catch (error) {
      message.error('Không thể tải chi tiết phiếu thu');
    }
  };

  const handleDelete = async (record) => {
    try {
      await paymentApi.delete(record.id);
      setPayments(prev => prev.filter(p => p.id !== record.id));
      message.success('Đã xóa phiếu thu');
    } catch (error) {
      message.error(error.message || 'Không thể xóa phiếu thu');
    }
  };

  const handleFormSuccess = async (paymentData) => {
    try {
      const res = await paymentApi.create(paymentData);
      const created = res.data || res;
      setPayments(prev => [...prev, created]);
      message.success('Tạo phiếu thu thành công!');
      setFormModalVisible(false);
      fetchData(); // Refresh to update order data
    } catch (error) {
      message.error(error.message || 'Có lỗi xảy ra');
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchSearch = !searchText || 
      payment.customerName?.toLowerCase().includes(searchText.toLowerCase()) ||
      String(payment.orderId).includes(searchText);
    const matchMethod = !filterMethod || payment.paymentMethod === filterMethod;
    let matchDate = true;
    if (dateRange && dateRange[0] && dateRange[1]) {
      const paymentDate = new Date(payment.paymentDate);
      matchDate = paymentDate >= dateRange[0].startOf('day') && paymentDate <= dateRange[1].endOf('day');
    }
    return matchSearch && matchMethod && matchDate;
  });

  const stats = {
    total: payments.length,
    totalAmount: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
    cash: payments.filter(p => p.paymentMethod === 'CASH').reduce((sum, p) => sum + (p.amount || 0), 0),
    transfer: payments.filter(p => ['BANK_TRANSFER', 'TRANSFER'].includes(p.paymentMethod)).reduce((sum, p) => sum + (p.amount || 0), 0)
  };

  const columns = [
    {
      title: 'Mã',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      render: (id) => <span style={{ fontWeight: 500, color: '#1890ff' }}>#{id}</span>
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
      width: 200,
      ellipsis: true
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      align: 'right',
      render: (amount) => <span style={{ fontWeight: 600, color: '#52c41a' }}>{formatCurrency(amount)}</span>,
      sorter: (a, b) => (a.amount || 0) - (b.amount || 0)
    },
    {
      title: 'Phương thức',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 140,
      render: (method) => {
        const config = PAYMENT_METHODS[method] || { label: method, color: 'default' };
        return <Tag color={config.color} icon={config.icon}>{config.label}</Tag>;
      }
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
      title: 'Người tạo',
      dataIndex: 'createdByUsername',
      key: 'createdByUsername',
      width: 100
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} />
          </Tooltip>
          <Popconfirm
            title="Xác nhận xóa phiếu thu?"
            onConfirm={() => handleDelete(record)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  if (loading) return <Loading tip="Đang tải danh sách phiếu thu..." />;

  return (
    <div>
      <PageHeader
        title="Quản lý thanh toán"
        subtitle="Quản lý phiếu thu tiền từ khách hàng"
        breadcrumbs={[{ title: 'Bán hàng' }, { title: 'Thanh toán' }]}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchData}>Làm mới</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>Tạo phiếu thu</Button>
          </Space>
        }
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic title="Tổng phiếu thu" value={stats.total} prefix={<DollarOutlined />} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic title="Tổng tiền thu" value={stats.totalAmount} formatter={(v) => formatCurrency(v)} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic title="Tiền mặt" value={stats.cash} prefix={<WalletOutlined />} formatter={(v) => formatCurrency(v)} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic title="Chuyển khoản" value={stats.transfer} prefix={<BankOutlined />} formatter={(v) => formatCurrency(v)} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input.Search
            placeholder="Tìm theo khách hàng, mã đơn..."
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
              <Select.Option key={key} value={key}>{value.label}</Select.Option>
            ))}
          </Select>
          <RangePicker placeholder={['Từ ngày', 'Đến ngày']} onChange={setDateRange} format="DD/MM/YYYY" />
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredPayments}
          rowKey="id"
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Tổng ${total} phiếu thu` }}
        />
      </Card>

      <PaymentFormModal
        visible={formModalVisible}
        orders={orders.filter(o => (o.total || 0) - (o.paidAmount || 0) > 0)}
        onCancel={() => setFormModalVisible(false)}
        onSuccess={handleFormSuccess}
      />

      <PaymentDetailModal
        visible={detailModalVisible}
        payment={selectedPayment}
        onCancel={() => { setDetailModalVisible(false); setSelectedPayment(null); }}
      />
    </div>
  );
};

export default PaymentList;
