import { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Input, message, Tag,
  Tooltip, Popconfirm, Card, Row, Col, Statistic,
  Avatar, Typography, Select
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  SearchOutlined, ReloadOutlined, UserOutlined,
  PhoneOutlined, MailOutlined, TeamOutlined,
  IdcardOutlined
} from '@ant-design/icons';
import { PageHeader, Loading } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils/formatters';
import EmployeeFormModal from './EmployeeFormModal';

const { Text } = Typography;

// ===================== MOCK DATA =====================
const MOCK_DEPARTMENTS = [
  { id: 1, name: 'Ban Giám đốc' },
  { id: 2, name: 'Phòng Kinh doanh' },
  { id: 3, name: 'Phòng Kế toán' },
  { id: 4, name: 'Phòng Kho vận' },
  { id: 5, name: 'Phòng Hành chính' },
];

const MOCK_POSITIONS = [
  { id: 1, name: 'Giám đốc' },
  { id: 2, name: 'Phó Giám đốc' },
  { id: 3, name: 'Trưởng phòng' },
  { id: 4, name: 'Nhân viên' },
  { id: 5, name: 'Thực tập sinh' },
];

const MOCK_EMPLOYEES = [
  { 
    id: 1, code: 'NV001', name: 'Nguyễn Văn An', gender: 'male',
    birthDate: '1985-03-15', phone: '0901234567', email: 'nguyenvanan@vlxd.com', 
    address: '123 Nguyễn Văn Linh, Quận 7, TP.HCM', idCard: '079185012345',
    departmentId: 1, departmentName: 'Ban Giám đốc',
    positionId: 1, positionName: 'Giám đốc',
    baseSalary: 50000000, startDate: '2020-01-01', status: 'active', hasAccount: true
  },
  { 
    id: 2, code: 'NV002', name: 'Trần Thị Bình', gender: 'female',
    birthDate: '1990-07-22', phone: '0912345678', email: 'tranthib@vlxd.com', 
    address: '456 Lê Văn Việt, Quận 9, TP.HCM', idCard: '079190078456',
    departmentId: 2, departmentName: 'Phòng Kinh doanh',
    positionId: 3, positionName: 'Trưởng phòng',
    baseSalary: 25000000, startDate: '2021-03-15', status: 'active', hasAccount: true
  },
  { 
    id: 3, code: 'NV003', name: 'Lê Văn Cường', gender: 'male',
    birthDate: '1992-11-08', phone: '0923456789', email: 'levanc@vlxd.com', 
    address: '789 Võ Văn Tần, Quận 3, TP.HCM', idCard: '079192045678',
    departmentId: 2, departmentName: 'Phòng Kinh doanh',
    positionId: 4, positionName: 'Nhân viên',
    baseSalary: 12000000, startDate: '2022-06-01', status: 'active', hasAccount: true
  },
  { 
    id: 4, code: 'NV004', name: 'Phạm Thị Dung', gender: 'female',
    birthDate: '1988-04-12', phone: '0934567890', email: 'phamthid@vlxd.com', 
    address: '321 Phan Xích Long, Phú Nhuận, TP.HCM', idCard: '079188034567',
    departmentId: 3, departmentName: 'Phòng Kế toán',
    positionId: 3, positionName: 'Trưởng phòng',
    baseSalary: 22000000, startDate: '2021-01-10', status: 'active', hasAccount: true
  },
  { 
    id: 5, code: 'NV005', name: 'Hoàng Văn Em', gender: 'male',
    birthDate: '1995-09-25', phone: '0945678901', email: 'hoangvane@vlxd.com', 
    address: '654 Cách Mạng Tháng 8, Quận 10, TP.HCM', idCard: '079195056789',
    departmentId: 3, departmentName: 'Phòng Kế toán',
    positionId: 4, positionName: 'Nhân viên',
    baseSalary: 10000000, startDate: '2023-02-20', status: 'active', hasAccount: false
  },
  { 
    id: 6, code: 'NV006', name: 'Võ Thị Phương', gender: 'female',
    birthDate: '1993-12-30', phone: '0956789012', email: 'vothip@vlxd.com', 
    address: '987 Nguyễn Thị Minh Khai, Quận 1, TP.HCM', idCard: '079193067890',
    departmentId: 4, departmentName: 'Phòng Kho vận',
    positionId: 3, positionName: 'Trưởng phòng',
    baseSalary: 18000000, startDate: '2021-08-01', status: 'active', hasAccount: true
  },
  { 
    id: 7, code: 'NV007', name: 'Đặng Văn Giang', gender: 'male',
    birthDate: '1998-06-18', phone: '0967890123', email: 'dangvang@vlxd.com', 
    address: '147 Điện Biên Phủ, Bình Thạnh, TP.HCM', idCard: '079198078901',
    departmentId: 4, departmentName: 'Phòng Kho vận',
    positionId: 4, positionName: 'Nhân viên',
    baseSalary: 9000000, startDate: '2023-09-01', status: 'active', hasAccount: false
  },
  { 
    id: 8, code: 'NV008', name: 'Ngô Thị Hương', gender: 'female',
    birthDate: '1991-02-14', phone: '0978901234', email: 'ngothih@vlxd.com', 
    address: '258 Lý Thường Kiệt, Quận 11, TP.HCM', idCard: '079191089012',
    departmentId: 5, departmentName: 'Phòng Hành chính',
    positionId: 4, positionName: 'Nhân viên',
    baseSalary: 8500000, startDate: '2022-11-15', status: 'inactive', hasAccount: false
  },
];
// =====================================================

const EmployeeList = () => {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filterDepartment, setFilterDepartment] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    setTimeout(() => {
      setEmployees(MOCK_EMPLOYEES);
      setLoading(false);
    }, 500);
  };

  const handleCreate = () => {
    setEditingEmployee(null);
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingEmployee(record);
    setModalVisible(true);
  };

  const handleDelete = (record) => {
    if (record.hasAccount) {
      message.warning('Không thể xóa nhân viên đã có tài khoản!');
      return;
    }
    setEmployees(prev => prev.filter(e => e.id !== record.id));
    message.success('Đã xóa nhân viên');
  };

  const handleToggleStatus = (record) => {
    setEmployees(prev => prev.map(e => 
      e.id === record.id 
        ? { ...e, status: e.status === 'active' ? 'inactive' : 'active' }
        : e
    ));
    message.success(`Đã ${record.status === 'active' ? 'cho nghỉ việc' : 'kích hoạt'} nhân viên`);
  };

  const handleFormSuccess = (employeeData) => {
    if (editingEmployee) {
      setEmployees(prev => prev.map(e => 
        e.id === editingEmployee.id ? { ...e, ...employeeData } : e
      ));
      message.success('Cập nhật nhân viên thành công!');
    } else {
      const newEmployee = {
        ...employeeData,
        id: Math.max(...employees.map(e => e.id)) + 1,
        code: `NV${String(employees.length + 1).padStart(3, '0')}`,
        departmentName: MOCK_DEPARTMENTS.find(d => d.id === employeeData.departmentId)?.name,
        positionName: MOCK_POSITIONS.find(p => p.id === employeeData.positionId)?.name,
        status: 'active',
        hasAccount: false
      };
      setEmployees(prev => [...prev, newEmployee]);
      message.success('Tạo nhân viên thành công!');
    }
    setModalVisible(false);
  };

  const filteredEmployees = employees.filter(emp => {
    const matchSearch = 
      emp.name.toLowerCase().includes(searchText.toLowerCase()) ||
      emp.code.toLowerCase().includes(searchText.toLowerCase()) ||
      emp.phone.includes(searchText);
    const matchDepartment = !filterDepartment || emp.departmentId === filterDepartment;
    const matchStatus = !filterStatus || emp.status === filterStatus;
    return matchSearch && matchDepartment && matchStatus;
  });

  const stats = {
    total: employees.length,
    active: employees.filter(e => e.status === 'active').length,
    totalSalary: employees.filter(e => e.status === 'active').reduce((sum, e) => sum + e.baseSalary, 0),
    withAccount: employees.filter(e => e.hasAccount).length
  };

  const columns = [
    {
      title: 'Mã NV', dataIndex: 'code', key: 'code', width: 90, fixed: 'left',
      render: (code) => <Text strong style={{ color: '#1890ff' }}>{code}</Text>
    },
    {
      title: 'Nhân viên', dataIndex: 'name', key: 'name', width: 200,
      render: (text, record) => (
        <Space>
          <Avatar style={{ backgroundColor: record.gender === 'male' ? '#1890ff' : '#eb2f96' }} icon={<UserOutlined />}>{text.charAt(0)}</Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            <Space size={4}>
              <PhoneOutlined style={{ color: '#666', fontSize: 12 }} />
              <Text type="secondary" style={{ fontSize: 12 }}>{record.phone}</Text>
            </Space>
          </div>
        </Space>
      )
    },
    {
      title: 'Phòng ban', dataIndex: 'departmentName', key: 'departmentName', width: 140,
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    { title: 'Chức vụ', dataIndex: 'positionName', key: 'positionName', width: 120 },
    {
      title: 'Email', dataIndex: 'email', key: 'email', width: 180, ellipsis: true,
      render: (email) => email ? <Space size={4}><MailOutlined style={{ color: '#1890ff' }} /><span>{email}</span></Space> : '-'
    },
    {
      title: 'Lương cơ bản', dataIndex: 'baseSalary', key: 'baseSalary', width: 130, align: 'right',
      render: (salary) => <Text strong style={{ color: '#52c41a' }}>{formatCurrency(salary)}</Text>,
      sorter: (a, b) => a.baseSalary - b.baseSalary
    },
    {
      title: 'Ngày vào', dataIndex: 'startDate', key: 'startDate', width: 110,
      render: (date) => formatDate(date)
    },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 120,
      render: (status, record) => (
        <Space direction="vertical" size={0}>
          <Tag color={status === 'active' ? 'success' : 'default'}>{status === 'active' ? 'Đang làm' : 'Nghỉ việc'}</Tag>
          {record.hasAccount && <Tag color="purple" style={{ fontSize: 10 }}>Có tài khoản</Tag>}
        </Space>
      )
    },
    {
      title: 'Thao tác', key: 'actions', width: 130, fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Sửa"><Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} /></Tooltip>
          <Tooltip title={record.status === 'active' ? 'Cho nghỉ việc' : 'Kích hoạt'}>
            <Button type="text" onClick={() => handleToggleStatus(record)} style={{ color: record.status === 'active' ? '#faad14' : '#52c41a' }}>
              {record.status === 'active' ? '🚫' : '✓'}
            </Button>
          </Tooltip>
          <Popconfirm title="Xác nhận xóa?" onConfirm={() => handleDelete(record)} disabled={record.hasAccount}>
            <Button type="text" danger icon={<DeleteOutlined />} disabled={record.hasAccount} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  if (loading) return <Loading tip="Đang tải danh sách nhân viên..." />;

  return (
    <div>
      <PageHeader
        title="Quản lý nhân viên"
        subtitle="Quản lý thông tin nhân viên công ty"
        breadcrumbs={[{ title: 'Nhân sự' }, { title: 'Nhân viên' }]}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchEmployees}>Làm mới</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>Thêm nhân viên</Button>
          </Space>
        }
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}><Card size="small" hoverable><Statistic title="Tổng nhân viên" value={stats.total} prefix={<TeamOutlined />} valueStyle={{ color: '#1890ff' }} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small" hoverable><Statistic title="Đang làm việc" value={stats.active} prefix={<UserOutlined />} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small" hoverable><Statistic title="Có tài khoản" value={stats.withAccount} prefix={<IdcardOutlined />} valueStyle={{ color: '#722ed1' }} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small" hoverable><Statistic title="Tổng lương cơ bản" value={stats.totalSalary} formatter={(v) => formatCurrency(v)} valueStyle={{ color: '#eb2f96', fontSize: 16 }} /></Card></Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input.Search placeholder="Tìm theo mã, tên, SĐT..." prefix={<SearchOutlined />} value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ width: 280 }} allowClear />
          <Select placeholder="Phòng ban" value={filterDepartment} onChange={setFilterDepartment} style={{ width: 180 }} allowClear>
            {MOCK_DEPARTMENTS.map(d => <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>)}
          </Select>
          <Select placeholder="Trạng thái" value={filterStatus} onChange={setFilterStatus} style={{ width: 140 }} allowClear>
            <Select.Option value="active"><Tag color="success">Đang làm</Tag></Select.Option>
            <Select.Option value="inactive"><Tag color="default">Nghỉ việc</Tag></Select.Option>
          </Select>
        </Space>
      </Card>

      <Card>
        <Table columns={columns} dataSource={filteredEmployees} rowKey="id" scroll={{ x: 1400 }} pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `Tổng ${t} nhân viên` }} />
      </Card>

      <EmployeeFormModal visible={modalVisible} employee={editingEmployee} departments={MOCK_DEPARTMENTS} positions={MOCK_POSITIONS} onCancel={() => { setModalVisible(false); setEditingEmployee(null); }} onSuccess={handleFormSuccess} />
    </div>
  );
};

export default EmployeeList;
