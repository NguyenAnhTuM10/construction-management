import { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Input, Tag, Card, Row, Col, 
  Statistic, Select, DatePicker, Typography, message
} from 'antd';
import { 
  PlusOutlined, SearchOutlined, ReloadOutlined,
  ArrowDownOutlined, ArrowUpOutlined, SwapOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { PageHeader, Loading } from '../../components/common';
import { formatCurrency, formatDateTime, formatNumber } from '../../utils/formatters';
import TransactionFormModal from './TransactionFormModal';

const { RangePicker } = DatePicker;
const { Text } = Typography;

// ===================== MOCK DATA =====================
const TRANSACTION_TYPES = {
  IMPORT: { label: 'Nhập kho', color: 'green', icon: <ArrowDownOutlined /> },
  EXPORT: { label: 'Xuất kho', color: 'red', icon: <ArrowUpOutlined /> },
  ADJUST: { label: 'Điều chỉnh', color: 'blue', icon: <SwapOutlined /> },
};

const MOCK_TRANSACTIONS = [
  { 
    id: 1, 
    type: 'IMPORT',
    productId: 5,
    productCode: 'XIM001',
    productName: 'Xi măng Hà Tiên PCB40',
    unit: 'bao',
    quantity: 200,
    price: 85000,
    totalAmount: 17000000,
    supplierId: 1,
    supplierName: 'Công ty TNHH Xi măng Hà Tiên',
    note: 'Nhập hàng theo PO#2024001',
    createdBy: 'admin',
    createdDate: '2024-12-01T08:30:00'
  },
  { 
    id: 2, 
    type: 'EXPORT',
    productId: 5,
    productCode: 'XIM001',
    productName: 'Xi măng Hà Tiên PCB40',
    unit: 'bao',
    quantity: 100,
    price: 95000,
    totalAmount: 9500000,
    orderId: 1,
    customerName: 'Công ty TNHH Xây dựng Phú Thịnh',
    note: 'Xuất theo đơn hàng #1',
    createdBy: 'sale01',
    createdDate: '2024-12-01T10:00:00'
  },
  { 
    id: 3, 
    type: 'IMPORT',
    productId: 7,
    productCode: 'THE001',
    productName: 'Thép phi 10',
    unit: 'cây',
    quantity: 500,
    price: 120000,
    totalAmount: 60000000,
    supplierId: 2,
    supplierName: 'Công ty CP Thép Việt Nhật',
    note: 'Nhập bổ sung',
    createdBy: 'admin',
    createdDate: '2024-12-05T09:15:00'
  },
  { 
    id: 4, 
    type: 'EXPORT',
    productId: 7,
    productCode: 'THE001',
    productName: 'Thép phi 10',
    unit: 'cây',
    quantity: 200,
    price: 145000,
    totalAmount: 29000000,
    orderId: 1,
    customerName: 'Công ty TNHH Xây dựng Phú Thịnh',
    note: 'Xuất theo đơn hàng #1',
    createdBy: 'sale01',
    createdDate: '2024-12-01T10:00:00'
  },
  { 
    id: 5, 
    type: 'IMPORT',
    productId: 3,
    productCode: 'GAC001',
    productName: 'Gạch ống 4 lỗ',
    unit: 'viên',
    quantity: 10000,
    price: 800,
    totalAmount: 8000000,
    supplierId: 5,
    supplierName: 'Đại lý Gạch Đồng Tâm',
    note: '',
    createdBy: 'admin',
    createdDate: '2024-12-10T14:00:00'
  },
  { 
    id: 6, 
    type: 'EXPORT',
    productId: 3,
    productCode: 'GAC001',
    productName: 'Gạch ống 4 lỗ',
    unit: 'viên',
    quantity: 5000,
    price: 1200,
    totalAmount: 6000000,
    orderId: 2,
    customerName: 'Công ty CP Đầu tư BĐS Hoàng Gia',
    note: 'Xuất theo đơn hàng #2',
    createdBy: 'sale01',
    createdDate: '2024-12-10T16:30:00'
  },
  { 
    id: 7, 
    type: 'ADJUST',
    productId: 12,
    productCode: 'SON001',
    productName: 'Sơn Dulux nội thất',
    unit: 'thùng',
    quantity: -5,
    price: 450000,
    totalAmount: -2250000,
    note: 'Điều chỉnh giảm do hàng hư hỏng',
    createdBy: 'admin',
    createdDate: '2024-12-15T11:00:00'
  },
  { 
    id: 8, 
    type: 'IMPORT',
    productId: 1,
    productCode: 'CAT001',
    productName: 'Cát vàng loại 1',
    unit: 'm³',
    quantity: 100,
    price: 180000,
    totalAmount: 18000000,
    supplierId: 7,
    supplierName: 'Mỏ Cát Tân Uyên',
    note: '',
    createdBy: 'admin',
    createdDate: '2024-12-18T08:00:00'
  },
  { 
    id: 9, 
    type: 'EXPORT',
    productId: 1,
    productCode: 'CAT001',
    productName: 'Cát vàng loại 1',
    unit: 'm³',
    quantity: 30,
    price: 220000,
    totalAmount: 6600000,
    orderId: 1,
    customerName: 'Công ty TNHH Xây dựng Phú Thịnh',
    note: 'Xuất theo đơn hàng #1',
    createdBy: 'sale01',
    createdDate: '2024-12-01T10:00:00'
  },
  { 
    id: 10, 
    type: 'IMPORT',
    productId: 8,
    productCode: 'THE002',
    productName: 'Thép phi 12',
    unit: 'cây',
    quantity: 300,
    price: 150000,
    totalAmount: 45000000,
    supplierId: 2,
    supplierName: 'Công ty CP Thép Việt Nhật',
    note: 'Nhập hàng đợt 2',
    createdBy: 'admin',
    createdDate: '2024-12-20T09:00:00'
  },
];

const MOCK_PRODUCTS = [
  { id: 1, code: 'CAT001', name: 'Cát vàng loại 1', unit: 'm³', buyPrice: 180000 },
  { id: 3, code: 'GAC001', name: 'Gạch ống 4 lỗ', unit: 'viên', buyPrice: 800 },
  { id: 5, code: 'XIM001', name: 'Xi măng Hà Tiên PCB40', unit: 'bao', buyPrice: 85000 },
  { id: 7, code: 'THE001', name: 'Thép phi 10', unit: 'cây', buyPrice: 120000 },
  { id: 8, code: 'THE002', name: 'Thép phi 12', unit: 'cây', buyPrice: 150000 },
  { id: 12, code: 'SON001', name: 'Sơn Dulux nội thất', unit: 'thùng', buyPrice: 450000 },
];

const MOCK_SUPPLIERS = [
  { id: 1, name: 'Công ty TNHH Xi măng Hà Tiên' },
  { id: 2, name: 'Công ty CP Thép Việt Nhật' },
  { id: 5, name: 'Đại lý Gạch Đồng Tâm' },
  { id: 7, name: 'Mỏ Cát Tân Uyên' },
];
// =====================================================

const TransactionList = () => {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('IMPORT');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    setTimeout(() => {
      setTransactions(MOCK_TRANSACTIONS);
      setLoading(false);
    }, 500);
  };

  // Handlers
  const handleCreateImport = () => {
    setModalType('IMPORT');
    setModalVisible(true);
  };

  const handleCreateExport = () => {
    setModalType('EXPORT');
    setModalVisible(true);
  };

  const handleFormSuccess = (data) => {
    const newTransaction = {
      ...data,
      id: Math.max(...transactions.map(t => t.id)) + 1,
      createdBy: 'admin',
      createdDate: new Date().toISOString()
    };
    setTransactions(prev => [newTransaction, ...prev]);
    message.success(`${data.type === 'IMPORT' ? 'Nhập' : 'Xuất'} kho thành công!`);
    setModalVisible(false);
  };

  // Filter
  const filteredTransactions = transactions.filter(trans => {
    const matchSearch = 
      trans.productName.toLowerCase().includes(searchText.toLowerCase()) ||
      trans.productCode.toLowerCase().includes(searchText.toLowerCase());
    
    const matchType = !filterType || trans.type === filterType;
    
    let matchDate = true;
    if (dateRange && dateRange[0] && dateRange[1]) {
      const transDate = new Date(trans.createdDate);
      matchDate = transDate >= dateRange[0].startOf('day') && 
                  transDate <= dateRange[1].endOf('day');
    }
    
    return matchSearch && matchType && matchDate;
  });

  // Statistics
  const stats = {
    totalImport: transactions.filter(t => t.type === 'IMPORT').reduce((sum, t) => sum + t.totalAmount, 0),
    totalExport: transactions.filter(t => t.type === 'EXPORT').reduce((sum, t) => sum + t.totalAmount, 0),
    importCount: transactions.filter(t => t.type === 'IMPORT').length,
    exportCount: transactions.filter(t => t.type === 'EXPORT').length,
  };

  // Table columns
  const columns = [
    {
      title: 'Mã GD',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id) => <Text strong>#{id}</Text>
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (type) => {
        const config = TRANSACTION_TYPES[type];
        return <Tag color={config.color} icon={config.icon}>{config.label}</Tag>;
      },
      filters: Object.entries(TRANSACTION_TYPES).map(([key, value]) => ({
        text: value.label,
        value: key
      })),
      onFilter: (value, record) => record.type === value
    },
    {
      title: 'Sản phẩm',
      key: 'product',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.productName}</div>
          <small style={{ color: '#1890ff' }}>{record.productCode}</small>
        </div>
      )
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'center',
      render: (qty, record) => (
        <Tag color={qty > 0 ? 'green' : 'red'}>
          {qty > 0 ? '+' : ''}{formatNumber(qty)} {record.unit}
        </Tag>
      )
    },
    {
      title: 'Đơn giá',
      dataIndex: 'price',
      key: 'price',
      width: 110,
      align: 'right',
      render: (price) => formatCurrency(price)
    },
    {
      title: 'Thành tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 130,
      align: 'right',
      render: (amount, record) => (
        <Text strong style={{ color: record.type === 'IMPORT' ? '#52c41a' : '#cf1322' }}>
          {formatCurrency(Math.abs(amount))}
        </Text>
      ),
      sorter: (a, b) => a.totalAmount - b.totalAmount
    },
    {
      title: 'Đối tác',
      key: 'partner',
      width: 180,
      ellipsis: true,
      render: (_, record) => {
        if (record.supplierName) {
          return <Text>{record.supplierName}</Text>;
        }
        if (record.customerName) {
          return <Text>{record.customerName}</Text>;
        }
        return <Text type="secondary">-</Text>;
      }
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdDate',
      key: 'createdDate',
      width: 150,
      render: (date) => formatDateTime(date),
      sorter: (a, b) => new Date(a.createdDate) - new Date(b.createdDate),
      defaultSortOrder: 'descend'
    },
    {
      title: 'Người tạo',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 100,
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
      width: 150,
      ellipsis: true,
      render: (note) => note || <Text type="secondary">-</Text>
    },
  ];

  if (loading) {
    return <Loading tip="Đang tải lịch sử giao dịch..." />;
  }

  return (
    <div>
      <PageHeader
        title="Giao dịch kho"
        subtitle="Lịch sử nhập kho, xuất kho, điều chỉnh"
        breadcrumbs={[
          { title: 'Kho hàng' },
          { title: 'Giao dịch' }
        ]}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchTransactions}>
              Làm mới
            </Button>
            <Button 
              type="primary" 
              icon={<ArrowDownOutlined />}
              onClick={handleCreateImport}
              style={{ background: '#52c41a', borderColor: '#52c41a' }}
            >
              Nhập kho
            </Button>
            <Button 
              type="primary"
              danger
              icon={<ArrowUpOutlined />}
              onClick={handleCreateExport}
            >
              Xuất kho
            </Button>
          </Space>
        }
      />

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic 
              title="Số lần nhập" 
              value={stats.importCount}
              prefix={<ArrowDownOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic 
              title="Tổng nhập" 
              value={stats.totalImport}
              formatter={(value) => formatCurrency(value)}
              valueStyle={{ color: '#52c41a', fontSize: 16 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic 
              title="Số lần xuất" 
              value={stats.exportCount}
              prefix={<ArrowUpOutlined style={{ color: '#cf1322' }} />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic 
              title="Tổng xuất" 
              value={stats.totalExport}
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
            placeholder="Tìm theo mã, tên sản phẩm..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          
          <Select
            placeholder="Loại giao dịch"
            value={filterType}
            onChange={setFilterType}
            style={{ width: 150 }}
            allowClear
          >
            {Object.entries(TRANSACTION_TYPES).map(([key, value]) => (
              <Select.Option key={key} value={key}>
                <Tag color={value.color}>{value.label}</Tag>
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
          dataSource={filteredTransactions}
          rowKey="id"
          scroll={{ x: 1400 }}
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} giao dịch`
          }}
        />
      </Card>

      {/* Modal Create */}
      <TransactionFormModal
        visible={modalVisible}
        type={modalType}
        products={MOCK_PRODUCTS}
        suppliers={MOCK_SUPPLIERS}
        onCancel={() => setModalVisible(false)}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};

export default TransactionList;
