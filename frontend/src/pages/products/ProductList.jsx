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
import productApi from '../../api/productApi';
import categoryApi from '../../api/categoryApi';

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

  // Fetch data from API
  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        productApi.getAll(),
        categoryApi.getAll()
      ]);
      
      // Handle API response format: {success, data, message}
      const productsData = productsRes.data || productsRes;
      const categoriesData = categoriesRes.data || categoriesRes;
      
      // Map products with category name
      const productsWithCategory = (Array.isArray(productsData) ? productsData : []).map(p => ({
        ...p,
        categoryId: p.category?.id,
        categoryName: p.category?.name || 'Chưa phân loại',
        minStock: p.minStock || 10 // Default min stock
      }));
      
      setProducts(productsWithCategory);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('Fetch error:', error);
      message.error(error.message || 'Không thể tải dữ liệu sản phẩm');
    } finally {
      setLoading(false);
    }
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

  const handleDelete = async (record) => {
    try {
      await productApi.delete(record.id);
      setProducts(prev => prev.filter(p => p.id !== record.id));
      message.success('Đã xóa sản phẩm');
    } catch (error) {
      message.error(error.message || 'Không thể xóa sản phẩm');
    }
  };

  const handleFormSuccess = async (productData) => {
    try {
      if (editingProduct) {
        // Update
        const res = await productApi.update(editingProduct.id, productData);
        const updatedProduct = res.data || res;
        setProducts(prev => prev.map(p => 
          p.id === editingProduct.id ? {
            ...updatedProduct,
            categoryId: updatedProduct.category?.id,
            categoryName: updatedProduct.category?.name || 'Chưa phân loại',
            minStock: updatedProduct.minStock || 10
          } : p
        ));
        message.success('Cập nhật sản phẩm thành công!');
      } else {
        // Create
        const res = await productApi.create(productData);
        const newProduct = res.data || res;
        setProducts(prev => [...prev, {
          ...newProduct,
          categoryId: newProduct.category?.id,
          categoryName: newProduct.category?.name || 'Chưa phân loại',
          minStock: newProduct.minStock || 10
        }]);
        message.success('Tạo sản phẩm thành công!');
      }
      setModalVisible(false);
    } catch (error) {
      message.error(error.message || 'Có lỗi xảy ra');
    }
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
