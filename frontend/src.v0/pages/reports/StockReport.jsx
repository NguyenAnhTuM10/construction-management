import { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Statistic, Table, Typography, Space, 
  Button, Tag, Progress, Select, Alert
} from 'antd';
import { 
  InboxOutlined, WarningOutlined, FileExcelOutlined, 
  PrinterOutlined, DollarOutlined
} from '@ant-design/icons';
import { PageHeader, Loading } from '../../components/common';
import { formatCurrency, formatNumber } from '../../utils/formatters';

const { Text } = Typography;

// ===================== MOCK DATA =====================
const MOCK_STOCK = [
  { id: 1, code: 'XIM001', name: 'Xi măng Hà Tiên PCB40', category: 'Xi măng', unit: 'bao', stock: 500, minStock: 100, maxStock: 1000, buyPrice: 85000, sellPrice: 95000 },
  { id: 2, code: 'XIM002', name: 'Xi măng INSEE', category: 'Xi măng', unit: 'bao', stock: 300, minStock: 100, maxStock: 800, buyPrice: 90000, sellPrice: 102000 },
  { id: 3, code: 'THE001', name: 'Thép phi 10', category: 'Thép', unit: 'cây', stock: 800, minStock: 200, maxStock: 1500, buyPrice: 120000, sellPrice: 145000 },
  { id: 4, code: 'THE002', name: 'Thép phi 12', category: 'Thép', unit: 'cây', stock: 600, minStock: 200, maxStock: 1200, buyPrice: 150000, sellPrice: 175000 },
  { id: 5, code: 'THE003', name: 'Thép phi 16', category: 'Thép', unit: 'cây', stock: 50, minStock: 100, maxStock: 800, buyPrice: 200000, sellPrice: 230000 }, // Low
  { id: 6, code: 'GAC001', name: 'Gạch ống 4 lỗ', category: 'Gạch', unit: 'viên', stock: 5000, minStock: 1000, maxStock: 10000, buyPrice: 800, sellPrice: 1200 },
  { id: 7, code: 'GAC002', name: 'Gạch ống 6 lỗ', category: 'Gạch', unit: 'viên', stock: 3000, minStock: 1000, maxStock: 8000, buyPrice: 1000, sellPrice: 1400 },
  { id: 8, code: 'CAT001', name: 'Cát vàng loại 1', category: 'Cát', unit: 'm³', stock: 150, minStock: 50, maxStock: 300, buyPrice: 180000, sellPrice: 220000 },
  { id: 9, code: 'DA001', name: 'Đá 1x2', category: 'Đá', unit: 'm³', stock: 100, minStock: 50, maxStock: 200, buyPrice: 280000, sellPrice: 350000 },
  { id: 10, code: 'SON001', name: 'Sơn Dulux nội thất', category: 'Sơn', unit: 'thùng', stock: 0, minStock: 20, maxStock: 100, buyPrice: 450000, sellPrice: 550000 }, // Out
  { id: 11, code: 'SON002', name: 'Sơn Jotun ngoại thất', category: 'Sơn', unit: 'thùng', stock: 25, minStock: 20, maxStock: 100, buyPrice: 520000, sellPrice: 620000 },
  { id: 12, code: 'ONG001', name: 'Ống PVC phi 21', category: 'Ống nước', unit: 'cây', stock: 200, minStock: 50, maxStock: 500, buyPrice: 25000, sellPrice: 35000 },
];

const MOCK_CATEGORIES = ['Tất cả', 'Xi măng', 'Thép', 'Gạch', 'Cát', 'Đá', 'Sơn', 'Ống nước'];
// =====================================================

const StockReport = () => {
  const [loading, setLoading] = useState(true);
  const [stocks, setStocks] = useState([]);
  const [filterCategory, setFilterCategory] = useState('Tất cả');
  const [filterStatus, setFilterStatus] = useState(null);

  useEffect(() => {
    setTimeout(() => {
      setStocks(MOCK_STOCK);
      setLoading(false);
    }, 500);
  }, []);

  // Filter
  const filteredStocks = stocks.filter(item => {
    const matchCategory = filterCategory === 'Tất cả' || item.category === filterCategory;
    const matchStatus = !filterStatus ||
      (filterStatus === 'out' && item.stock === 0) ||
      (filterStatus === 'low' && item.stock > 0 && item.stock < item.minStock) ||
      (filterStatus === 'normal' && item.stock >= item.minStock && item.stock <= item.maxStock) ||
      (filterStatus === 'over' && item.stock > item.maxStock);
    return matchCategory && matchStatus;
  });

  // Calculate summary
  const stats = {
    totalItems: stocks.length,
    totalValue: stocks.reduce((sum, s) => sum + s.stock * s.buyPrice, 0),
    potentialRevenue: stocks.reduce((sum, s) => sum + s.stock * s.sellPrice, 0),
    outOfStock: stocks.filter(s => s.stock === 0).length,
    lowStock: stocks.filter(s => s.stock > 0 && s.stock < s.minStock).length,
    overStock: stocks.filter(s => s.stock > s.maxStock).length,
  };

  // Get stock status
  const getStockStatus = (item) => {
    if (item.stock === 0) return { status: 'out', color: 'red', text: 'Hết hàng' };
    if (item.stock < item.minStock) return { status: 'low', color: 'orange', text: 'Sắp hết' };
    if (item.stock > item.maxStock) return { status: 'over', color: 'blue', text: 'Tồn nhiều' };
    return { status: 'normal', color: 'green', text: 'Bình thường' };
  };

  // Category summary
  const categorySummary = MOCK_CATEGORIES.filter(c => c !== 'Tất cả').map(category => {
    const items = stocks.filter(s => s.category === category);
    return {
      category,
      items: items.length,
      totalStock: items.reduce((sum, s) => sum + s.stock, 0),
      value: items.reduce((sum, s) => sum + s.stock * s.buyPrice, 0),
      lowStock: items.filter(s => s.stock < s.minStock).length,
    };
  });

  // Table columns
  const columns = [
    { 
      title: 'Mã SP', dataIndex: 'code', key: 'code', width: 100,
      render: (code) => <Text strong style={{ color: '#1890ff' }}>{code}</Text>
    },
    { 
      title: 'Tên sản phẩm', dataIndex: 'name', key: 'name', width: 200,
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Tag>{record.category}</Tag>
        </div>
      )
    },
    { title: 'ĐVT', dataIndex: 'unit', key: 'unit', width: 70, align: 'center' },
    { 
      title: 'Tồn kho', dataIndex: 'stock', key: 'stock', width: 100, align: 'center',
      render: (stock, record) => {
        const { color } = getStockStatus(record);
        return <Tag color={color}>{formatNumber(stock)}</Tag>;
      },
      sorter: (a, b) => a.stock - b.stock
    },
    { 
      title: 'Định mức', key: 'stockLevel', width: 150,
      render: (_, record) => {
        const percent = Math.min(Math.round(record.stock / record.maxStock * 100), 100);
        const status = record.stock === 0 ? 'exception' 
          : record.stock < record.minStock ? 'active' 
          : 'success';
        return (
          <div>
            <Progress percent={percent} size="small" status={status} />
            <Text type="secondary" style={{ fontSize: 10 }}>
              Min: {record.minStock} | Max: {record.maxStock}
            </Text>
          </div>
        );
      }
    },
    { 
      title: 'Giá vốn', dataIndex: 'buyPrice', key: 'buyPrice', width: 110, align: 'right',
      render: (v) => formatCurrency(v)
    },
    { 
      title: 'Giá bán', dataIndex: 'sellPrice', key: 'sellPrice', width: 110, align: 'right',
      render: (v) => formatCurrency(v)
    },
    { 
      title: 'Giá trị tồn', key: 'stockValue', width: 130, align: 'right',
      render: (_, record) => (
        <Text strong style={{ color: '#52c41a' }}>
          {formatCurrency(record.stock * record.buyPrice)}
        </Text>
      ),
      sorter: (a, b) => (a.stock * a.buyPrice) - (b.stock * b.buyPrice)
    },
    { 
      title: 'Trạng thái', key: 'status', width: 100,
      render: (_, record) => {
        const { color, text } = getStockStatus(record);
        return <Tag color={color}>{text}</Tag>;
      }
    },
  ];

  // Category columns
  const categoryColumns = [
    { title: 'Danh mục', dataIndex: 'category', key: 'category' },
    { title: 'Số SP', dataIndex: 'items', key: 'items', align: 'center' },
    { title: 'Tổng tồn', dataIndex: 'totalStock', key: 'totalStock', align: 'right', render: (v) => formatNumber(v) },
    { title: 'Giá trị', dataIndex: 'value', key: 'value', align: 'right', render: (v) => formatCurrency(v) },
    { 
      title: 'Cần nhập', dataIndex: 'lowStock', key: 'lowStock', align: 'center',
      render: (v) => v > 0 ? <Tag color="red">{v} SP</Tag> : <Tag color="green">Đủ</Tag>
    },
  ];

  if (loading) return <Loading tip="Đang tải báo cáo tồn kho..." />;

  return (
    <div>
      <PageHeader
        title="Báo cáo tồn kho"
        subtitle="Thống kê và phân tích tình trạng tồn kho"
        breadcrumbs={[{ title: 'Báo cáo' }, { title: 'Tồn kho' }]}
        extra={
          <Space>
            <Button icon={<FileExcelOutlined />}>Xuất Excel</Button>
            <Button icon={<PrinterOutlined />}>In báo cáo</Button>
          </Space>
        }
      />

      {/* Alerts */}
      {(stats.outOfStock > 0 || stats.lowStock > 0) && (
        <Alert
          message={
            <Space>
              {stats.outOfStock > 0 && <Text strong style={{ color: '#cf1322' }}>{stats.outOfStock} sản phẩm hết hàng</Text>}
              {stats.lowStock > 0 && <Text strong style={{ color: '#faad14' }}>{stats.lowStock} sản phẩm sắp hết</Text>}
            </Space>
          }
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic title="Tổng mặt hàng" value={stats.totalItems} prefix={<InboxOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic 
              title="Giá trị tồn kho" 
              value={stats.totalValue} 
              formatter={(v) => formatCurrency(v)}
              valueStyle={{ color: '#1890ff', fontSize: 16 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic 
              title="Doanh thu tiềm năng" 
              value={stats.potentialRevenue} 
              formatter={(v) => formatCurrency(v)}
              valueStyle={{ color: '#52c41a', fontSize: 16 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" style={{ borderColor: stats.outOfStock > 0 ? '#ff4d4f' : undefined }}>
            <Statistic title="Hết hàng" value={stats.outOfStock} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" style={{ borderColor: stats.lowStock > 0 ? '#faad14' : undefined }}>
            <Statistic title="Sắp hết" value={stats.lowStock} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic title="Tồn nhiều" value={stats.overStock} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
      </Row>

      {/* Category Summary */}
      <Card title="Tồn kho theo danh mục" style={{ marginBottom: 24 }}>
        <Table
          columns={categoryColumns}
          dataSource={categorySummary}
          rowKey="category"
          pagination={false}
          size="small"
        />
      </Card>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select 
            value={filterCategory} 
            onChange={setFilterCategory} 
            style={{ width: 150 }}
          >
            {MOCK_CATEGORIES.map(cat => (
              <Select.Option key={cat} value={cat}>{cat}</Select.Option>
            ))}
          </Select>
          <Select 
            placeholder="Tình trạng" 
            value={filterStatus} 
            onChange={setFilterStatus}
            style={{ width: 140 }}
            allowClear
          >
            <Select.Option value="out"><Tag color="red">Hết hàng</Tag></Select.Option>
            <Select.Option value="low"><Tag color="orange">Sắp hết</Tag></Select.Option>
            <Select.Option value="normal"><Tag color="green">Bình thường</Tag></Select.Option>
            <Select.Option value="over"><Tag color="blue">Tồn nhiều</Tag></Select.Option>
          </Select>
        </Space>
      </Card>

      {/* Stock Table */}
      <Card title="Chi tiết tồn kho">
        <Table
          columns={columns}
          dataSource={filteredStocks}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 15, showTotal: (t) => `Tổng ${t} sản phẩm` }}
          summary={(pageData) => {
            const totalValue = pageData.reduce((sum, r) => sum + r.stock * r.buyPrice, 0);
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={7}><Text strong>Tổng trang</Text></Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <Text strong style={{ color: '#52c41a' }}>{formatCurrency(totalValue)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} />
              </Table.Summary.Row>
            );
          }}
        />
      </Card>
    </div>
  );
};

export default StockReport;
