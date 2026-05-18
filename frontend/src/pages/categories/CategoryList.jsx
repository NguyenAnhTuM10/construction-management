import { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Input, message, 
  Tooltip, Popconfirm, Card, Tag, Modal, Form,
  Row, Col, Statistic
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  SearchOutlined, FolderOutlined, ReloadOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { PageHeader, Loading } from '../../components/common';

// ===================== MOCK DATA =====================
const MOCK_CATEGORIES = [
  { id: 1, name: 'Cát xây dựng', productCount: 12, createdDate: '2024-01-15' },
  { id: 2, name: 'Gạch ống', productCount: 8, createdDate: '2024-01-20' },
  { id: 3, name: 'Xi măng', productCount: 15, createdDate: '2024-02-01' },
  { id: 4, name: 'Thép xây dựng', productCount: 20, createdDate: '2024-02-10' },
  { id: 5, name: 'Đá xây dựng', productCount: 6, createdDate: '2024-02-15' },
  { id: 6, name: 'Gỗ xây dựng', productCount: 10, createdDate: '2024-03-01' },
  { id: 7, name: 'Sơn nước', productCount: 18, createdDate: '2024-03-10' },
  { id: 8, name: 'Ống nước', productCount: 14, createdDate: '2024-03-15' },
  { id: 9, name: 'Dây điện', productCount: 9, createdDate: '2024-03-20' },
  { id: 10, name: 'Vật liệu lợp', productCount: 7, createdDate: '2024-04-01' },
];
// =====================================================

const CategoryList = () => {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch categories (mock)
  const fetchCategories = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setCategories(MOCK_CATEGORIES);
      setLoading(false);
    }, 500);
  };

  // Mở modal tạo mới
  const handleCreate = () => {
    setEditingCategory(null);
    form.resetFields();
    setModalVisible(true);
  };

  // Mở modal sửa
  const handleEdit = (record) => {
    setEditingCategory(record);
    form.setFieldsValue({ name: record.name });
    setModalVisible(true);
  };

  // Xóa danh mục
  const handleDelete = (record) => {
    if (record.productCount > 0) {
      message.warning('Không thể xóa danh mục đang có sản phẩm!');
      return;
    }
    
    setCategories(prev => prev.filter(c => c.id !== record.id));
    message.success('Đã xóa danh mục');
  };

  // Submit form
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingCategory) {
        // Cập nhật
        setCategories(prev => prev.map(c => 
          c.id === editingCategory.id 
            ? { ...c, name: values.name }
            : c
        ));
        message.success('Cập nhật danh mục thành công!');
      } else {
        // Tạo mới
        const newCategory = {
          id: Math.max(...categories.map(c => c.id)) + 1,
          name: values.name,
          productCount: 0,
          createdDate: new Date().toISOString().split('T')[0]
        };
        setCategories(prev => [...prev, newCategory]);
        message.success('Tạo danh mục thành công!');
      }
      
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  // Filter categories
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // Statistics
  const totalProducts = categories.reduce((sum, cat) => sum + cat.productCount, 0);

  // Table columns
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      sorter: (a, b) => a.id - b.id
    },
    {
      title: 'Tên danh mục',
      dataIndex: 'name',
      key: 'name',
      render: (text) => (
        <Space>
          <FolderOutlined style={{ color: '#1890ff' }} />
          <span style={{ fontWeight: 500 }}>{text}</span>
        </Space>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name)
    },
    {
      title: 'Số sản phẩm',
      dataIndex: 'productCount',
      key: 'productCount',
      width: 130,
      align: 'center',
      render: (count) => (
        <Tag color={count > 0 ? 'blue' : 'default'}>
          {count} sản phẩm
        </Tag>
      ),
      sorter: (a, b) => a.productCount - b.productCount
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdDate',
      key: 'createdDate',
      width: 120,
      render: (date) => new Date(date).toLocaleDateString('vi-VN')
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Sửa">
            <Button 
              type="text" 
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          
          <Tooltip title={record.productCount > 0 ? 'Không thể xóa (có sản phẩm)' : 'Xóa'}>
            <Popconfirm
              title="Xác nhận xóa danh mục này?"
              onConfirm={() => handleDelete(record)}
              okText="Xóa"
              cancelText="Hủy"
              disabled={record.productCount > 0}
            >
              <Button 
                type="text" 
                danger
                icon={<DeleteOutlined />}
                disabled={record.productCount > 0}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  if (loading) {
    return <Loading tip="Đang tải danh mục..." />;
  }

  return (
    <div>
      <PageHeader
        title="Quản lý danh mục"
        subtitle="Quản lý danh mục sản phẩm vật liệu xây dựng"
        breadcrumbs={[
          { title: 'Sản phẩm' },
          { title: 'Danh mục' }
        ]}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchCategories}>
              Làm mới
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Thêm danh mục
            </Button>
          </Space>
        }
      />

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} md={6}>
          <Card size="small" hoverable>
            <Statistic 
              title="Tổng danh mục" 
              value={categories.length}
              prefix={<FolderOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card size="small" hoverable>
            <Statistic 
              title="Tổng sản phẩm" 
              value={totalProducts}
              prefix={<AppstoreOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Search */}
      <Card style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Tìm kiếm theo tên danh mục..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredCategories}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} danh mục`
          }}
        />
      </Card>

      {/* Modal Create/Edit */}
      <Modal
        title={editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        okText={editingCategory ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="name"
            label="Tên danh mục"
            rules={[
              { required: true, message: 'Vui lòng nhập tên danh mục!' },
              { min: 2, message: 'Tên danh mục tối thiểu 2 ký tự!' },
              { max: 100, message: 'Tên danh mục tối đa 100 ký tự!' }
            ]}
          >
            <Input 
              prefix={<FolderOutlined />}
              placeholder="Nhập tên danh mục"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoryList;
