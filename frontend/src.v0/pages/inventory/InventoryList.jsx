import { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Input, Tag, Card, Row, Col, 
  Statistic, Select, Progress, Typography, Tooltip
} from 'antd';
import { 
  SearchOutlined, ReloadOutlined, DatabaseOutlined,
  WarningOutlined, InboxOutlined, ArrowUpOutlined,
  ArrowDownOutlined, HistoryOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Loading } from '../../components/common';
import { formatCurrency, formatNumber } from '../../utils/formatters';

const { Text } = Typography;

// ===================== MOCK DATA =====================
const MOCK_INVENTORY = [
  { id: 1, productId: 1, code: 'CAT001', name: 'Cát vàng loại 1', categoryName: 'Cát xây dựng', unit: 'm³', buyPrice: 180000, stock: 150, minStock: 50, maxStock: 300, warehouseName: 'Kho chính' },
  { id: 2, productId: 2, code: 'CAT002', name: 'Cát đen san lấp', categoryName: 'Cát xây dựng', unit: 'm³', buyPrice: 120000, stock: 200, minStock: 100, maxStock: 400, warehouseName: 'Kho chính' },
  { id: 3, productId: 3, code: 'GAC001', name: 'Gạch ống 4 lỗ', categoryName: 'Gạch ống', unit: 'viên', buyPrice: 800, stock: 5000, minStock: 1000, maxStock: 10000, warehouseName: 'Kho chính' },
  { id: 4, productId: 4, code: 'GAC002', name: 'Gạch ống 6 lỗ', categoryName: 'Gạch ống', unit: 'viên', buyPrice: 1000, stock: 3000, minStock: 1000, maxStock: 8000, warehouseName: 'Kho chính' },
  { id: 5, productId: 5, code: 'XIM001', name: 'Xi măng Hà Tiên PCB40', categoryName: 'Xi măng', unit: 'bao', buyPrice: 85000, stock: 500, minStock: 100, maxStock: 1000, warehouseName: 'Kho chính' },
  { id: 6, productId: 6, code: 'XIM002', name: 'Xi măng INSEE', categoryName: 'Xi măng', unit: 'bao', buyPrice: 90000, stock: 300, minStock: 100, maxStock: 800, warehouseName: 'Kho chính' },
  { id: 7, productId: 7, code: 'THE001', name: 'Thép phi 10', categoryName: 'Thép xây dựng', unit: 'cây', buyPrice: 120000, stock: 800, minStock: 200, maxStock: 1500, warehouseName: 'Kho chính' },
  { id: 8, productId: 8, code: 'THE002', name: 'Thép phi 12', categoryName: 'Thép xây dựng', unit: 'cây', buyPrice: 150000, stock: 600, minStock: 200, maxStock: 1200, warehouseName: 'Kho chính' },
  { id: 9, productId: 9, code: 'THE003', name: 'Thép phi 16', categoryName: 'Thép xây dựng', unit: 'cây', buyPrice: 200000, stock: 50, minStock: 100, maxStock: 800, warehouseName: 'Kho chính' }, // Low stock
  { id: 10, productId: 10, code: 'DA001', name: 'Đá 1x2', categoryName: 'Đá xây dựng', unit: 'm³', buyPrice: 280000, stock: 100, minStock: 50, maxStock: 200, warehouseName: 'Kho chính' },
  { id: 11, productId: 11, code: 'DA002', name: 'Đá 4x6', categoryName: 'Đá xây dựng', unit: 'm³', buyPrice: 250000, stock: 80, minStock: 50, maxStock: 180, warehouseName: 'Kho chính' },
  { id: 12, productId: 12, code: 'SON001', name: 'Sơn Dulux nội thất', categoryName: 'Sơn nước', unit: 'thùng', buyPrice: 450000, stock: 0, minStock: 20, maxStock: 100, warehouseName: 'Kho chính' }, // Out of stock
  { id: 13, productId: 13, code: 'SON002', name: 'Sơn Jotun ngoại thất', categoryName: 'Sơn nước', unit: 'thùng', buyPrice: 520000, stock: 25, minStock: 20, maxStock: 100, warehouseName: 'Kho chính' },
  { id: 14, productId: 14, code: 'ONG001', name: 'Ống PVC phi 21', categoryName: 'Ống nước', unit: 'cây', buyPrice: 25000, stock: 200, minStock: 50, maxStock: 500, warehouseName: 'Kho phụ' },
  { id: 15, productId: 15, code: 'ONG002', name: 'Ống PVC phi 27', categoryName: 'Ống nước', unit: 'cây', buyPrice: 35000, stock: 150, minStock: 50, maxStock: 400, warehouseName: 'Kho phụ' },
];

const MOCK_CATEGORIES = [
  { id: 1, name: 'Cát xây dựng' },
  { id: 2, name: 'Gạch ống' },
  { id: 3, name: 'Xi măng' },
  { id: 4, name: 'Thép xây dựng' },
  { id: 5, name: 'Đá xây dựng' },
  { id: 6, name: 'Sơn nước' },
  { id: 7, name: 'Ống nước' },
];
// =====================================================

const InventoryList = () => {
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filterCategory, setFilterCategory] = useState(null);
  const [filterStock, setFilterStock] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    setTimeout(() => {
      setInventory(MOCK_INVENTORY);
      setLoading(false);
    }, 500);
  };

  // Filter
  const filteredInventory = inventory.filter(item => {
    const matchSearch = 
      item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      item.code.toLowerCase().includes(searchText.toLowerCase());
    
    const matchCategory = !filterCategory || item.categoryName === filterCategory;
    
    const matchStock = !filterStock || 
      (filterStock === 'out' && item.stock === 0) ||
      (filterStock === 'low' && item.stock > 0 && item.stock < item.minStock) ||
      (filterStock === 'normal' && item.stock >= item.minStock);
    
    return matchSearch && matchCategory && matchStock;
  });

  // Statistics
  const stats = {
    totalItems: inventory.length,
    totalValue: inventory.reduce((sum, item) => sum + (item.stock * item.buyPrice), 0),
    outOfStock: inventory.filter(item => item.stock === 0).length,
    lowStock: inventory.filter(item => item.stock > 0 && item.stock < item.minStock).length,
  };

  // Get stock status
  const getStockStatus = (item) => {
    if (item.stock === 0) return { status: 'out', color: 'red', text: 'Hết hàng' };
    if (item.stock < item.minStock) return { status: 'low', color: 'orange', text: 'Sắp hết' };
    if (item.stock > item.maxStock) return { status: 'over', color: 'blue', text: 'Vượt định mức' };
    return { status: 'normal', color: 'green', text: 'Bình thường' };
  };

  // Table columns
  const columns = [
    {
      title: 'Mã SP',
      dataIndex: 'code',
      key: 'code',
      width: 100,
      fixed: 'left',
      render: (code) => <Text strong style={{ color: '#1890ff' }}>{code}</Text>
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <small style={{ color: '#666' }}>{record.categoryName}</small>
        </div>
      )
    },
    {
      title: 'Kho',
      dataIndex: 'warehouseName',
      key: 'warehouseName',
      width: 100,
    },
    {
      title: 'ĐVT',
      dataIndex: 'unit',
      key: 'unit',
      width: 70,
      align: 'center'
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stock',
      key: 'stock',
      width: 120,
      align: 'center',
      render: (stock, record) => {
        const { color, text } = getStockStatus(record);
        return (
          <Tooltip title={text}>
            <Tag color={color} style={{ minWidth: 80 }}>
              {formatNumber(stock)} {record.unit}
            </Tag>
          </Tooltip>
        );
      },
      sorter: (a, b) => a.stock - b.stock
    },
    {
      title: 'Định mức',
      key: 'stockLevel',
      width: 150,
      render: (_, record) => {
        const percent = record.maxStock > 0 
          ? Math.round((record.stock / record.maxStock) * 100) 
          : 0;
        const status = record.stock === 0 ? 'exception' 
          : record.stock < record.minStock ? 'normal' 
          : 'success';
        return (
          <div>
            <Progress 
              percent={Math.min(percent, 100)} 
              size="small" 
              status={status}
              strokeColor={record.stock < record.minStock ? '#faad14' : undefined}
            />
            <small style={{ color: '#666' }}>
              Min: {formatNumber(record.minStock)} | Max: {formatNumber(record.maxStock)}
            </small>
          </div>
        );
      }
    },
    {
      title: 'Giá nhập',
      dataIndex: 'buyPrice',
      key: 'buyPrice',
      width: 110,
      align: 'right',
      render: (price) => formatCurrency(price)
    },
    {
      title: 'Giá trị tồn',
      key: 'stockValue',
      width: 130,
      align: 'right',
      render: (_, record) => (
        <Text strong style={{ color: '#52c41a' }}>
          {formatCurrency(record.stock * record.buyPrice)}
        </Text>
      ),
      sorter: (a, b) => (a.stock * a.buyPrice) - (b.stock * b.buyPrice)
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 110,
      render: (_, record) => {
        const { color, text } = getStockStatus(record);
        const icon = record.stock === 0 ? <InboxOutlined /> 
          : record.stock < record.minStock ? <WarningOutlined /> 
          : null;
        return <Tag color={color} icon={icon}>{text}</Tag>;
      },
      filters: [
        { text: 'Hết hàng', value: 'out' },
        { text: 'Sắp hết', value: 'low' },
        { text: 'Bình thường', value: 'normal' },
      ],
      onFilter: (value, record) => {
        const { status } = getStockStatus(record);
        return status === value;
      }
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      fixed: 'right',
      render: (_, record) => (
        <Tooltip title="Xem lịch sử">
          <Button 
            type="text" 
            icon={<HistoryOutlined />}
            onClick={() => navigate(`/transactions?product=${record.productId}`)}
          />
        </Tooltip>
      )
    }
  ];

  if (loading) {
    return <Loading tip="Đang tải dữ liệu tồn kho..." />;
  }

  return (
    <div>
      <PageHeader
        title="Tồn kho"
        subtitle="Theo dõi số lượng tồn kho của từng sản phẩm"
        breadcrumbs={[
          { title: 'Kho hàng' },
          { title: 'Tồn kho' }
        ]}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchInventory}>
              Làm mới
            </Button>
            <Button 
              type="primary" 
              icon={<ArrowDownOutlined />}
              onClick={() => navigate('/transactions?type=import')}
            >
              Nhập kho
            </Button>
            <Button 
              icon={<ArrowUpOutlined />}
              onClick={() => navigate('/transactions?type=export')}
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
              title="Tổng mặt hàng" 
              value={stats.totalItems}
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic 
              title="Giá trị tồn kho" 
              value={stats.totalValue}
              formatter={(value) => formatCurrency(value)}
              valueStyle={{ color: '#52c41a', fontSize: 18 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable style={{ borderColor: stats.outOfStock > 0 ? '#ff4d4f' : undefined }}>
            <Statistic 
              title="Hết hàng" 
              value={stats.outOfStock}
              prefix={<InboxOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable style={{ borderColor: stats.lowStock > 0 ? '#faad14' : undefined }}>
            <Statistic 
              title="Sắp hết" 
              value={stats.lowStock}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
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
            placeholder="Danh mục"
            value={filterCategory}
            onChange={setFilterCategory}
            style={{ width: 180 }}
            allowClear
          >
            {MOCK_CATEGORIES.map(cat => (
              <Select.Option key={cat.id} value={cat.name}>
                {cat.name}
              </Select.Option>
            ))}
          </Select>
          
          <Select
            placeholder="Tình trạng kho"
            value={filterStock}
            onChange={setFilterStock}
            style={{ width: 150 }}
            allowClear
          >
            <Select.Option value="out">
              <Tag color="red">Hết hàng</Tag>
            </Select.Option>
            <Select.Option value="low">
              <Tag color="orange">Sắp hết</Tag>
            </Select.Option>
            <Select.Option value="normal">
              <Tag color="green">Bình thường</Tag>
            </Select.Option>
          </Select>
        </Space>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredInventory}
          rowKey="id"
          scroll={{ x: 1300 }}
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} sản phẩm`
          }}
        />
      </Card>
    </div>
  );
};

export default InventoryList;
