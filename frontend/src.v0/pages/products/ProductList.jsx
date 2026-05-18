import { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Input, message, Tag,
  Tooltip, Popconfirm, Card, Row, Col, Statistic,
  Select, Image
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  SearchOutlined, ReloadOutlined, ShoppingOutlined,
  WarningOutlined, InboxOutlined
} from '@ant-design/icons';
import { PageHeader, Loading } from '../../components/common';
import { formatCurrency } from '../../utils/formatters';
import ProductFormModal from './ProductFormModal';

// ===================== MOCK DATA =====================
const MOCK_CATEGORIES = [
  { id: 1, name: 'Cát xây dựng' },
  { id: 2, name: 'Gạch ống' },
  { id: 3, name: 'Xi măng' },
  { id: 4, name: 'Thép xây dựng' },
  { id: 5, name: 'Đá xây dựng' },
  { id: 6, name: 'Sơn nước' },
  { id: 7, name: 'Ống nước' },
];

const MOCK_PRODUCTS = [
  { id: 1, code: 'CAT001', name: 'Cát vàng loại 1', categoryId: 1, categoryName: 'Cát xây dựng', unit: 'm³', buyPrice: 180000, sellPrice: 220000, stock: 150, minStock: 50 },
  { id: 2, code: 'CAT002', name: 'Cát đen san lấp', categoryId: 1, categoryName: 'Cát xây dựng', unit: 'm³', buyPrice: 120000, sellPrice: 150000, stock: 200, minStock: 100 },
  { id: 3, code: 'GAC001', name: 'Gạch ống 4 lỗ', categoryId: 2, categoryName: 'Gạch ống', unit: 'viên', buyPrice: 800, sellPrice: 1200, stock: 5000, minStock: 1000 },
  { id: 4, code: 'GAC002', name: 'Gạch ống 6 lỗ', categoryId: 2, categoryName: 'Gạch ống', unit: 'viên', buyPrice: 1000, sellPrice: 1500, stock: 3000, minStock: 1000 },
  { id: 5, code: 'XIM001', name: 'Xi măng Hà Tiên PCB40', categoryId: 3, categoryName: 'Xi măng', unit: 'bao', buyPrice: 85000, sellPrice: 95000, stock: 500, minStock: 100 },
  { id: 6, code: 'XIM002', name: 'Xi măng INSEE', categoryId: 3, categoryName: 'Xi măng', unit: 'bao', buyPrice: 90000, sellPrice: 105000, stock: 300, minStock: 100 },
  { id: 7, code: 'THE001', name: 'Thép phi 10', categoryId: 4, categoryName: 'Thép xây dựng', unit: 'cây', buyPrice: 120000, sellPrice: 145000, stock: 800, minStock: 200 },
  { id: 8, code: 'THE002', name: 'Thép phi 12', categoryId: 4, categoryName: 'Thép xây dựng', unit: 'cây', buyPrice: 150000, sellPrice: 180000, stock: 600, minStock: 200 },
  { id: 9, code: 'THE003', name: 'Thép phi 16', categoryId: 4, categoryName: 'Thép xây dựng', unit: 'cây', buyPrice: 200000, sellPrice: 240000, stock: 50, minStock: 100 }, // Low stock
  { id: 10, code: 'DA001', name: 'Đá 1x2', categoryId: 5, categoryName: 'Đá xây dựng', unit: 'm³', buyPrice: 280000, sellPrice: 350000, stock: 100, minStock: 50 },
  { id: 11, code: 'DA002', name: 'Đá 4x6', categoryId: 5, categoryName: 'Đá xây dựng', unit: 'm³', buyPrice: 250000, sellPrice: 320000, stock: 80, minStock: 50 },
  { id: 12, code: 'SON001', name: 'Sơn Dulux nội thất', categoryId: 6, categoryName: 'Sơn nước', unit: 'thùng', buyPrice: 450000, sellPrice: 550000, stock: 0, minStock: 20 }, // Out of stock
  { id: 13, code: 'SON002', name: 'Sơn Jotun ngoại thất', categoryId: 6, categoryName: 'Sơn nước', unit: 'thùng', buyPrice: 520000, sellPrice: 650000, stock: 25, minStock: 20 },
  { id: 14, code: 'ONG001', name: 'Ống PVC phi 21', categoryId: 7, categoryName: 'Ống nước', unit: 'cây', buyPrice: 25000, sellPrice: 35000, stock: 200, minStock: 50 },
  { id: 15, code: 'ONG002', name: 'Ống PVC phi 27', categoryId: 7, categoryName: 'Ống nước', unit: 'cây', buyPrice: 35000, sellPrice: 48000, stock: 150, minStock: 50 },
];
// =====================================================

const ProductList = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filterCategory, setFilterCategory] = useState(null);
  const [filterStock, setFilterStock] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch data (mock)
  const fetchData = async () => {
    setLoading(true);
    setTimeout(() => {
      setProducts(MOCK_PRODUCTS);
      setCategories(MOCK_CATEGORIES);
      setLoading(false);
    }, 500);
  };

  // Handlers
  const handleCreate = () => {
    setEditingProduct(null);
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingProduct(record);
    setModalVisible(true);
  };

  const handleDelete = (record) => {
    setProducts(prev => prev.filter(p => p.id !== record.id));
    message.success('Đã xóa sản phẩm');
  };

  const handleFormSuccess = (productData) => {
    if (editingProduct) {
      // Update
      setProducts(prev => prev.map(p => 
        p.id === editingProduct.id ? { ...p, ...productData } : p
      ));
      message.success('Cập nhật sản phẩm thành công!');
    } else {
      // Create
      const newProduct = {
        ...productData,
        id: Math.max(...products.map(p => p.id)) + 1,
        categoryName: categories.find(c => c.id === productData.categoryId)?.name
      };
      setProducts(prev => [...prev, newProduct]);
      message.success('Tạo sản phẩm thành công!');
    }
    setModalVisible(false);
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchSearch = 
      product.name.toLowerCase().includes(searchText.toLowerCase()) ||
      product.code.toLowerCase().includes(searchText.toLowerCase());
    
    const matchCategory = !filterCategory || product.categoryId === filterCategory;
    
    const matchStock = !filterStock || 
      (filterStock === 'out' && product.stock === 0) ||
      (filterStock === 'low' && product.stock > 0 && product.stock < product.minStock) ||
      (filterStock === 'normal' && product.stock >= product.minStock);
    
    return matchSearch && matchCategory && matchStock;
  });

  // Statistics
  const stats = {
    total: products.length,
    outOfStock: products.filter(p => p.stock === 0).length,
    lowStock: products.filter(p => p.stock > 0 && p.stock < p.minStock).length,
    totalValue: products.reduce((sum, p) => sum + (p.stock * p.buyPrice), 0)
  };

  // Table columns
  const columns = [
    {
      title: 'Mã SP',
      dataIndex: 'code',
      key: 'code',
      width: 100,
      fixed: 'left',
      render: (text) => <span style={{ fontWeight: 500, color: '#1890ff' }}>{text}</span>
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
      ),
      sorter: (a, b) => a.name.localeCompare(b.name)
    },
    {
      title: 'ĐVT',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
      align: 'center'
    },
    {
      title: 'Giá nhập',
      dataIndex: 'buyPrice',
      key: 'buyPrice',
      width: 120,
      align: 'right',
      render: (price) => formatCurrency(price),
      sorter: (a, b) => a.buyPrice - b.buyPrice
    },
    {
      title: 'Giá bán',
      dataIndex: 'sellPrice',
      key: 'sellPrice',
      width: 120,
      align: 'right',
      render: (price) => <span style={{ color: '#52c41a', fontWeight: 500 }}>{formatCurrency(price)}</span>,
      sorter: (a, b) => a.sellPrice - b.sellPrice
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stock',
      key: 'stock',
      width: 120,
      align: 'center',
      render: (stock, record) => {
        let color = 'green';
        let icon = null;
        
        if (stock === 0) {
          color = 'red';
          icon = <InboxOutlined />;
        } else if (stock < record.minStock) {
          color = 'orange';
          icon = <WarningOutlined />;
        }
        
        return (
          <Tag color={color} icon={icon}>
            {stock} {record.unit}
          </Tag>
        );
      },
      sorter: (a, b) => a.stock - b.stock
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Sửa">
            <Button 
              type="text" 
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          
          <Tooltip title="Xóa">
            <Popconfirm
              title="Xác nhận xóa sản phẩm này?"
              description="Hành động này không thể hoàn tác"
              onConfirm={() => handleDelete(record)}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Button 
                type="text" 
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  if (loading) {
    return <Loading tip="Đang tải sản phẩm..." />;
  }

  return (
    <div>
      <PageHeader
        title="Quản lý sản phẩm"
        subtitle="Quản lý danh sách sản phẩm vật liệu xây dựng"
        breadcrumbs={[
          { title: 'Sản phẩm' },
          { title: 'Danh sách' }
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
              Thêm sản phẩm
            </Button>
          </Space>
        }
      />

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic 
              title="Tổng sản phẩm" 
              value={stats.total}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic 
              title="Hết hàng" 
              value={stats.outOfStock}
              prefix={<InboxOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic 
              title="Sắp hết" 
              value={stats.lowStock}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic 
              title="Giá trị tồn kho" 
              value={stats.totalValue}
              formatter={(value) => formatCurrency(value)}
              valueStyle={{ color: '#52c41a' }}
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
            {categories.map(cat => (
              <Select.Option key={cat.id} value={cat.id}>
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
              <Tag color="green">Còn hàng</Tag>
            </Select.Option>
          </Select>
        </Space>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredProducts}
          rowKey="id"
          scroll={{ x: 1000 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} sản phẩm`
          }}
        />
      </Card>

      {/* Modal Create/Edit */}
      <ProductFormModal
        visible={modalVisible}
        product={editingProduct}
        categories={categories}
        onCancel={() => {
          setModalVisible(false);
          setEditingProduct(null);
        }}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};

export default ProductList;
