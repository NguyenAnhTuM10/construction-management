import { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Input, Tag, Card, Row, Col, 
  Statistic, Select, Progress, Typography, Tooltip, message
} from 'antd';
import { 
  SearchOutlined, ReloadOutlined, DatabaseOutlined,
  WarningOutlined, InboxOutlined, ArrowUpOutlined,
  ArrowDownOutlined, HistoryOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Loading } from '../../components/common';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { inventoryBalanceApi } from '../../api/inventoryApi';
import warehouseApi from '../../api/warehouseApi';

const { Text } = Typography;

const InventoryList = () => {
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState(null);
  const [filterStock, setFilterStock] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [inventoryRes, warehousesRes] = await Promise.all([
        inventoryBalanceApi.getAll(),
        warehouseApi.getAll()
      ]);
      const inventoryData = inventoryRes.data || inventoryRes;
      const warehousesData = warehousesRes.data || warehousesRes;
      setInventory(Array.isArray(inventoryData) ? inventoryData : []);
      setWarehouses(Array.isArray(warehousesData) ? warehousesData : []);
    } catch (error) {
      console.error('Fetch error:', error);
      message.error(error.message || 'Không thể tải dữ liệu tồn kho');
    } finally {
      setLoading(false);
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchSearch = 
      (item.productName || '').toLowerCase().includes(searchText.toLowerCase()) ||
      (item.productCode || '').toLowerCase().includes(searchText.toLowerCase());
    
    const matchWarehouse = !filterWarehouse || item.warehouseId === filterWarehouse;
    
    const minStock = 10; // Default min stock threshold
    const matchStock = !filterStock || 
      (filterStock === 'out' && (item.quantity || 0) === 0) ||
      (filterStock === 'low' && (item.quantity || 0) > 0 && (item.quantity || 0) < minStock) ||
      (filterStock === 'normal' && (item.quantity || 0) >= minStock);
    
    return matchSearch && matchWarehouse && matchStock;
  });

  const stats = {
    total: inventory.length,
    outOfStock: inventory.filter(i => (i.quantity || 0) === 0).length,
    lowStock: inventory.filter(i => (i.quantity || 0) > 0 && (i.quantity || 0) < 10).length,
    totalValue: inventory.reduce((sum, i) => sum + ((i.quantity || 0) * (i.averageCost || 0)), 0)
  };

  const getStockStatus = (quantity) => {
    if (quantity === 0) return { color: 'red', text: 'Hết hàng', icon: <InboxOutlined /> };
    if (quantity < 10) return { color: 'orange', text: 'Sắp hết', icon: <WarningOutlined /> };
    return { color: 'green', text: 'Còn hàng', icon: null };
  };

  const columns = [
    {
      title: 'Mã SP',
      dataIndex: 'productCode',
      key: 'productCode',
      width: 100,
      render: (text) => <span style={{ fontWeight: 500, color: '#1890ff' }}>{text}</span>
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'productName',
      key: 'productName',
      width: 200,
      ellipsis: true,
      sorter: (a, b) => (a.productName || '').localeCompare(b.productName || '')
    },
    {
      title: 'Kho',
      dataIndex: 'warehouseName',
      key: 'warehouseName',
      width: 120,
      render: (name) => <Tag color="blue">{name}</Tag>
    },
    {
      title: 'ĐVT',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
      align: 'center'
    },
    {
      title: 'Tồn kho',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      align: 'center',
      render: (quantity) => {
        const status = getStockStatus(quantity || 0);
        return (
          <Tag color={status.color} icon={status.icon}>
            {formatNumber(quantity || 0)}
          </Tag>
        );
      },
      sorter: (a, b) => (a.quantity || 0) - (b.quantity || 0)
    },
    {
      title: 'Giá vốn TB',
      dataIndex: 'averageCost',
      key: 'averageCost',
      width: 120,
      align: 'right',
      render: (cost) => formatCurrency(cost || 0)
    },
    {
      title: 'Giá trị tồn',
      key: 'totalValue',
      width: 140,
      align: 'right',
      render: (_, record) => (
        <span style={{ fontWeight: 500, color: '#52c41a' }}>
          {formatCurrency((record.quantity || 0) * (record.averageCost || 0))}
        </span>
      ),
      sorter: (a, b) => ((a.quantity || 0) * (a.averageCost || 0)) - ((b.quantity || 0) * (b.averageCost || 0))
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 100,
      render: (_, record) => {
        const status = getStockStatus(record.quantity || 0);
        return <Tag color={status.color}>{status.text}</Tag>;
      }
    }
  ];

  if (loading) return <Loading tip="Đang tải dữ liệu tồn kho..." />;

  return (
    <div>
      <PageHeader
        title="Quản lý tồn kho"
        subtitle="Theo dõi tồn kho sản phẩm theo từng kho"
        breadcrumbs={[{ title: 'Kho hàng' }, { title: 'Tồn kho' }]}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchData}>Làm mới</Button>
            <Button icon={<HistoryOutlined />} onClick={() => navigate('/inventory/transactions')}>Giao dịch kho</Button>
          </Space>
        }
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic title="Tổng mặt hàng" value={stats.total} prefix={<DatabaseOutlined />} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic title="Hết hàng" value={stats.outOfStock} prefix={<InboxOutlined />} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic title="Sắp hết" value={stats.lowStock} prefix={<WarningOutlined />} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic title="Tổng giá trị" value={stats.totalValue} formatter={(v) => formatCurrency(v)} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

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
            placeholder="Chọn kho"
            value={filterWarehouse}
            onChange={setFilterWarehouse}
            style={{ width: 150 }}
            allowClear
          >
            {warehouses.map(w => (
              <Select.Option key={w.id} value={w.id}>{w.name}</Select.Option>
            ))}
          </Select>
          <Select
            placeholder="Trạng thái"
            value={filterStock}
            onChange={setFilterStock}
            style={{ width: 130 }}
            allowClear
          >
            <Select.Option value="out"><Tag color="red">Hết hàng</Tag></Select.Option>
            <Select.Option value="low"><Tag color="orange">Sắp hết</Tag></Select.Option>
            <Select.Option value="normal"><Tag color="green">Còn hàng</Tag></Select.Option>
          </Select>
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredInventory}
          rowKey="id"
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Tổng ${total} mặt hàng` }}
        />
      </Card>
    </div>
  );
};

export default InventoryList;
