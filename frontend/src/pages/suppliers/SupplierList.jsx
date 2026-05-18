import { useState, useEffect } from 'react';
import { Table, Button, Space, Input, message, Tag, Tooltip, Popconfirm, Card, Row, Col, Statistic, Avatar, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined, ShopOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons';
import { PageHeader, Loading } from '../../components/common';
import SupplierFormModal from './SupplierFormModal';
import supplierApi from '../../api/supplierApi';

const { Text } = Typography;

const SupplierList = () => {
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await supplierApi.getAll();
      setSuppliers(Array.isArray(res.data || res) ? (res.data || res) : []);
    } catch (error) { message.error(error.message || 'Không thể tải dữ liệu'); }
    finally { setLoading(false); }
  };

  const handleCreate = () => { setEditingSupplier(null); setModalVisible(true); };
  const handleEdit = (record) => { setEditingSupplier(record); setModalVisible(true); };

  const handleDelete = async (record) => {
    try {
      await supplierApi.delete(record.id);
      setSuppliers(prev => prev.filter(s => s.id !== record.id));
      message.success('Đã xóa nhà cung cấp');
    } catch (error) { message.error(error.message || 'Không thể xóa'); }
  };

  const handleFormSuccess = async (data) => {
    try {
      if (editingSupplier) {
        const res = await supplierApi.update(editingSupplier.id, data);
        setSuppliers(prev => prev.map(s => s.id === editingSupplier.id ? (res.data || res) : s));
        message.success('Cập nhật thành công!');
      } else {
        const res = await supplierApi.create(data);
        setSuppliers(prev => [...prev, res.data || res]);
        message.success('Thêm nhà cung cấp thành công!');
      }
      setModalVisible(false);
    } catch (error) { message.error(error.message || 'Có lỗi xảy ra'); }
  };

  const filteredSuppliers = suppliers.filter(s =>
    (s.name || '').toLowerCase().includes(searchText.toLowerCase()) ||
    (s.phone || '').includes(searchText) ||
    (s.code || '').toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    { title: 'Mã NCC', dataIndex: 'code', key: 'code', width: 100, render: (code) => <span style={{ fontWeight: 500, color: '#1890ff' }}>{code}</span> },
    { title: 'Nhà cung cấp', dataIndex: 'name', key: 'name', width: 250,
      render: (name, record) => (
        <Space>
          <Avatar style={{ backgroundColor: '#52c41a' }} icon={<ShopOutlined />}>{name?.charAt(0)}</Avatar>
          <div><div style={{ fontWeight: 500 }}>{name}</div><Space size={4}><PhoneOutlined style={{ color: '#666', fontSize: 12 }} /><Text type="secondary" style={{ fontSize: 12 }}>{record.phone}</Text></Space></div>
        </Space>
      )
    },
    { title: 'Email', dataIndex: 'email', key: 'email', width: 200, render: (email) => email || <Text type="secondary">-</Text> },
    { title: 'Địa chỉ', dataIndex: 'address', key: 'address', width: 250, ellipsis: true },
    { title: 'Thao tác', key: 'actions', width: 100,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Sửa"><Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} /></Tooltip>
          <Popconfirm title="Xác nhận xóa?" onConfirm={() => handleDelete(record)}><Button type="text" danger icon={<DeleteOutlined />} /></Popconfirm>
        </Space>
      )
    }
  ];

  if (loading) return <Loading tip="Đang tải danh sách nhà cung cấp..." />;

  return (
    <div>
      <PageHeader title="Quản lý nhà cung cấp" subtitle="Quản lý thông tin nhà cung cấp" breadcrumbs={[{ title: 'Mua hàng' }, { title: 'Nhà cung cấp' }]}
        extra={<Space><Button icon={<ReloadOutlined />} onClick={fetchData}>Làm mới</Button><Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>Thêm NCC</Button></Space>}
      />
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}><Card size="small" hoverable><Statistic title="Tổng nhà cung cấp" value={suppliers.length} prefix={<ShopOutlined />} valueStyle={{ color: '#1890ff' }} /></Card></Col>
      </Row>
      <Card style={{ marginBottom: 16 }}><Input.Search placeholder="Tìm theo mã, tên, SĐT..." prefix={<SearchOutlined />} value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ width: 300 }} allowClear /></Card>
      <Card><Table columns={columns} dataSource={filteredSuppliers} rowKey="id" scroll={{ x: 900 }} pagination={{ pageSize: 10, showTotal: (t) => `Tổng ${t} nhà cung cấp` }} /></Card>
      <SupplierFormModal visible={modalVisible} supplier={editingSupplier} onCancel={() => setModalVisible(false)} onSuccess={handleFormSuccess} />
    </div>
  );
};

export default SupplierList;
