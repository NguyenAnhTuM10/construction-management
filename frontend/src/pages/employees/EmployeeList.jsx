import { useState, useEffect } from 'react';
import { Table, Button, Space, Input, message, Tag, Tooltip, Popconfirm, Card, Row, Col, Statistic, Avatar } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined, UserOutlined, TeamOutlined, DollarOutlined } from '@ant-design/icons';
import { PageHeader, Loading } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils/formatters';
import EmployeeFormModal from './EmployeeFormModal';
import employeeApi from '../../api/employeeApi';
import departmentApi from '../../api/departmentApi';

const EmployeeList = () => {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, deptRes] = await Promise.all([employeeApi.getAll(), departmentApi.getAll()]);
      setEmployees(Array.isArray(empRes.data || empRes) ? (empRes.data || empRes) : []);
      setDepartments(Array.isArray(deptRes.data || deptRes) ? (deptRes.data || deptRes) : []);
    } catch (error) {
      message.error(error.message || 'Không thể tải dữ liệu');
    } finally { setLoading(false); }
  };

  const handleCreate = () => { setEditingEmployee(null); setModalVisible(true); };
  const handleEdit = (record) => { setEditingEmployee(record); setModalVisible(true); };

  const handleDelete = async (record) => {
    try {
      await employeeApi.delete(record.id);
      setEmployees(prev => prev.filter(e => e.id !== record.id));
      message.success('Đã xóa nhân viên');
    } catch (error) { message.error(error.message || 'Không thể xóa nhân viên'); }
  };

  const handleFormSuccess = async (data) => {
    try {
      if (editingEmployee) {
        const res = await employeeApi.update(editingEmployee.id, data);
        setEmployees(prev => prev.map(e => e.id === editingEmployee.id ? (res.data || res) : e));
        message.success('Cập nhật nhân viên thành công!');
      } else {
        const res = await employeeApi.create(data);
        setEmployees(prev => [...prev, res.data || res]);
        message.success('Thêm nhân viên thành công!');
      }
      setModalVisible(false);
    } catch (error) { message.error(error.message || 'Có lỗi xảy ra'); }
  };

  const filteredEmployees = employees.filter(e =>
    (e.name || '').toLowerCase().includes(searchText.toLowerCase()) ||
    (e.phone || '').includes(searchText)
  );

  const stats = {
    total: employees.length,
    totalSalary: employees.reduce((sum, e) => sum + (e.salary || 0), 0)
  };

  const columns = [
    { title: 'Nhân viên', dataIndex: 'name', key: 'name', width: 200,
      render: (name, record) => (
        <Space>
          <Avatar style={{ backgroundColor: '#1890ff' }} icon={<UserOutlined />}>{name?.charAt(0)}</Avatar>
          <div><div style={{ fontWeight: 500 }}>{name}</div><small style={{ color: '#666' }}>{record.phone}</small></div>
        </Space>
      )
    },
    { title: 'Phòng ban', dataIndex: 'departmentName', key: 'departmentName', width: 150, render: (dept) => <Tag color="blue">{dept || '-'}</Tag> },
    { title: 'Lương cơ bản', dataIndex: 'salary', key: 'salary', width: 140, align: 'right', render: (s) => formatCurrency(s || 0) },
    { title: 'Ngày vào làm', dataIndex: 'hireDate', key: 'hireDate', width: 120, render: (d) => formatDate(d) },
    { title: 'Thao tác', key: 'actions', width: 100,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Sửa"><Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} /></Tooltip>
          <Popconfirm title="Xác nhận xóa?" onConfirm={() => handleDelete(record)}><Button type="text" danger icon={<DeleteOutlined />} /></Popconfirm>
        </Space>
      )
    }
  ];

  if (loading) return <Loading tip="Đang tải danh sách nhân viên..." />;

  return (
    <div>
      <PageHeader title="Quản lý nhân viên" subtitle="Quản lý thông tin nhân viên" breadcrumbs={[{ title: 'Nhân sự' }, { title: 'Nhân viên' }]}
        extra={<Space><Button icon={<ReloadOutlined />} onClick={fetchData}>Làm mới</Button><Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>Thêm nhân viên</Button></Space>}
      />
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8}><Card size="small" hoverable><Statistic title="Tổng nhân viên" value={stats.total} prefix={<TeamOutlined />} valueStyle={{ color: '#1890ff' }} /></Card></Col>
        <Col xs={12} sm={8}><Card size="small" hoverable><Statistic title="Tổng lương" value={stats.totalSalary} formatter={(v) => formatCurrency(v)} valueStyle={{ color: '#52c41a' }} /></Card></Col>
      </Row>
      <Card style={{ marginBottom: 16 }}><Input.Search placeholder="Tìm theo tên, SĐT..." prefix={<SearchOutlined />} value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ width: 300 }} allowClear /></Card>
      <Card><Table columns={columns} dataSource={filteredEmployees} rowKey="id" pagination={{ pageSize: 10, showTotal: (t) => `Tổng ${t} nhân viên` }} /></Card>
      <EmployeeFormModal visible={modalVisible} employee={editingEmployee} departments={departments} onCancel={() => setModalVisible(false)} onSuccess={handleFormSuccess} />
    </div>
  );
};

export default EmployeeList;
