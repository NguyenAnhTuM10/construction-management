import { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Input, Tag, Card, Row, Col, 
  Statistic, Select, Typography, message, Tooltip, DatePicker
} from 'antd';
import { 
  PlusOutlined, SearchOutlined, ReloadOutlined, DollarOutlined,
  CheckCircleOutlined, ClockCircleOutlined, EyeOutlined,
  CalculatorOutlined, FileExcelOutlined, SendOutlined
} from '@ant-design/icons';
import { PageHeader, Loading } from '../../components/common';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import SalaryFormModal from './SalaryFormModal';
import SalaryDetailModal from './SalaryDetailModal';
import KPIConfigModal from './KPIConfigModal';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

// ===================== MOCK DATA =====================
const SALARY_STATUS = {
  DRAFT: { label: 'Nháp', color: 'default', icon: <ClockCircleOutlined /> },
  PENDING: { label: 'Chờ duyệt', color: 'gold', icon: <ClockCircleOutlined /> },
  APPROVED: { label: 'Đã duyệt', color: 'blue', icon: <CheckCircleOutlined /> },
  PAID: { label: 'Đã trả', color: 'success', icon: <CheckCircleOutlined /> },
};

const MOCK_EMPLOYEES = [
  { id: 1, code: 'NV001', name: 'Nguyễn Văn An', departmentName: 'Ban Giám đốc', positionName: 'Giám đốc', baseSalary: 50000000 },
  { id: 2, code: 'NV002', name: 'Trần Thị Bình', departmentName: 'Phòng Kinh doanh', positionName: 'Trưởng phòng', baseSalary: 25000000 },
  { id: 3, code: 'NV003', name: 'Lê Văn Cường', departmentName: 'Phòng Kinh doanh', positionName: 'Nhân viên', baseSalary: 12000000 },
  { id: 4, code: 'NV004', name: 'Phạm Thị Dung', departmentName: 'Phòng Kế toán', positionName: 'Trưởng phòng', baseSalary: 22000000 },
  { id: 5, code: 'NV005', name: 'Hoàng Văn Em', departmentName: 'Phòng Kế toán', positionName: 'Nhân viên', baseSalary: 10000000 },
  { id: 6, code: 'NV006', name: 'Võ Thị Phương', departmentName: 'Phòng Kho vận', positionName: 'Trưởng phòng', baseSalary: 18000000 },
  { id: 7, code: 'NV007', name: 'Đặng Văn Giang', departmentName: 'Phòng Kho vận', positionName: 'Nhân viên', baseSalary: 9000000 },
];

const MOCK_SALARIES = [
  { 
    id: 1, 
    employeeId: 2, employeeCode: 'NV002', employeeName: 'Trần Thị Bình',
    departmentName: 'Phòng Kinh doanh', positionName: 'Trưởng phòng',
    month: 12, year: 2024,
    workDays: 22, actualWorkDays: 21, leaveDays: 1, overtimeHours: 8,
    baseSalary: 25000000,
    // KPI
    kpiScore: 95, kpiBonus: 2375000, // 95% * 10% * baseSalary
    salesTarget: 500000000, salesActual: 520000000, salesBonus: 5200000, // 1% của doanh số
    // Allowances
    allowances: { meal: 800000, transport: 500000, phone: 300000 },
    totalAllowance: 1600000,
    // Deductions
    deductions: { insurance: 2625000, tax: 1500000, latePenalty: 0 },
    totalDeduction: 4125000,
    // Totals
    overtimePay: 1136364, // 8h * (baseSalary/22/8) * 1.5
    grossSalary: 35311364,
    netSalary: 31186364,
    status: 'PAID',
    paidDate: '2024-12-28',
    note: ''
  },
  { 
    id: 2, 
    employeeId: 3, employeeCode: 'NV003', employeeName: 'Lê Văn Cường',
    departmentName: 'Phòng Kinh doanh', positionName: 'Nhân viên',
    month: 12, year: 2024,
    workDays: 22, actualWorkDays: 22, leaveDays: 0, overtimeHours: 12,
    baseSalary: 12000000,
    kpiScore: 110, kpiBonus: 1320000,
    salesTarget: 200000000, salesActual: 245000000, salesBonus: 2450000,
    allowances: { meal: 800000, transport: 500000, phone: 200000 },
    totalAllowance: 1500000,
    deductions: { insurance: 1260000, tax: 0, latePenalty: 0 },
    totalDeduction: 1260000,
    overtimePay: 818182,
    grossSalary: 18088182,
    netSalary: 16828182,
    status: 'PAID',
    paidDate: '2024-12-28',
    note: 'Vượt KPI xuất sắc'
  },
  { 
    id: 3, 
    employeeId: 4, employeeCode: 'NV004', employeeName: 'Phạm Thị Dung',
    departmentName: 'Phòng Kế toán', positionName: 'Trưởng phòng',
    month: 12, year: 2024,
    workDays: 22, actualWorkDays: 20, leaveDays: 2, overtimeHours: 4,
    baseSalary: 22000000,
    kpiScore: 88, kpiBonus: 1936000,
    salesTarget: 0, salesActual: 0, salesBonus: 0,
    allowances: { meal: 800000, transport: 500000, phone: 300000 },
    totalAllowance: 1600000,
    deductions: { insurance: 2310000, tax: 1200000, latePenalty: 200000 },
    totalDeduction: 3710000,
    overtimePay: 500000,
    grossSalary: 24036000,
    netSalary: 20326000,
    status: 'APPROVED',
    paidDate: null,
    note: 'Nghỉ phép 2 ngày'
  },
  { 
    id: 4, 
    employeeId: 5, employeeCode: 'NV005', employeeName: 'Hoàng Văn Em',
    departmentName: 'Phòng Kế toán', positionName: 'Nhân viên',
    month: 12, year: 2024,
    workDays: 22, actualWorkDays: 22, leaveDays: 0, overtimeHours: 0,
    baseSalary: 10000000,
    kpiScore: 100, kpiBonus: 1000000,
    salesTarget: 0, salesActual: 0, salesBonus: 0,
    allowances: { meal: 800000, transport: 500000, phone: 0 },
    totalAllowance: 1300000,
    deductions: { insurance: 1050000, tax: 0, latePenalty: 0 },
    totalDeduction: 1050000,
    overtimePay: 0,
    grossSalary: 12300000,
    netSalary: 11250000,
    status: 'PENDING',
    paidDate: null,
    note: ''
  },
  { 
    id: 5, 
    employeeId: 6, employeeCode: 'NV006', employeeName: 'Võ Thị Phương',
    departmentName: 'Phòng Kho vận', positionName: 'Trưởng phòng',
    month: 12, year: 2024,
    workDays: 22, actualWorkDays: 21, leaveDays: 1, overtimeHours: 16,
    baseSalary: 18000000,
    kpiScore: 92, kpiBonus: 1656000,
    salesTarget: 0, salesActual: 0, salesBonus: 0,
    allowances: { meal: 800000, transport: 500000, phone: 200000 },
    totalAllowance: 1500000,
    deductions: { insurance: 1890000, tax: 800000, latePenalty: 0 },
    totalDeduction: 2690000,
    overtimePay: 1636364,
    grossSalary: 21792364,
    netSalary: 19102364,
    status: 'DRAFT',
    paidDate: null,
    note: ''
  },
];

// KPI Config mặc định
const DEFAULT_KPI_CONFIG = {
  kpiBonusPercent: 10, // % lương cơ bản
  salesCommissionPercent: 1, // % doanh số
  overtimeRate: 1.5, // hệ số tăng ca
  insurancePercent: 10.5, // % BHXH
  mealAllowance: 800000,
  transportAllowance: 500000,
  phoneAllowance: 300000,
  latePenaltyPerTime: 100000,
};
// =====================================================

const SalaryList = () => {
  const [loading, setLoading] = useState(true);
  const [salaries, setSalaries] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterMonth, setFilterMonth] = useState(dayjs());
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [kpiConfigVisible, setKpiConfigVisible] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState(null);
  const [kpiConfig, setKpiConfig] = useState(DEFAULT_KPI_CONFIG);

  useEffect(() => {
    fetchSalaries();
  }, [filterMonth]);

  const fetchSalaries = async () => {
    setLoading(true);
    setTimeout(() => {
      // Filter by month/year
      const filtered = MOCK_SALARIES.filter(s => 
        s.month === filterMonth.month() + 1 && s.year === filterMonth.year()
      );
      setSalaries(filtered);
      setLoading(false);
    }, 500);
  };

  // Handlers
  const handleCreate = () => {
    setSelectedSalary(null);
    setFormModalVisible(true);
  };

  const handleViewDetail = (record) => {
    setSelectedSalary(record);
    setDetailModalVisible(true);
  };

  const handleApprove = (record) => {
    setSalaries(prev => prev.map(s => 
      s.id === record.id ? { ...s, status: 'APPROVED' } : s
    ));
    message.success('Đã duyệt bảng lương');
  };

  const handlePay = (record) => {
    setSalaries(prev => prev.map(s => 
      s.id === record.id ? { ...s, status: 'PAID', paidDate: dayjs().format('YYYY-MM-DD') } : s
    ));
    message.success('Đã xác nhận trả lương');
  };

  const handleFormSuccess = (salaryData) => {
    if (selectedSalary) {
      setSalaries(prev => prev.map(s => 
        s.id === selectedSalary.id ? { ...s, ...salaryData } : s
      ));
      message.success('Cập nhật bảng lương thành công!');
    } else {
      const newSalary = {
        ...salaryData,
        id: Math.max(...salaries.map(s => s.id), 0) + 1,
        status: 'DRAFT',
        paidDate: null
      };
      setSalaries(prev => [...prev, newSalary]);
      message.success('Tạo bảng lương thành công!');
    }
    setFormModalVisible(false);
  };

  const handleBatchCreate = () => {
    message.info('Tính năng tạo bảng lương hàng loạt sẽ được phát triển sau');
  };

  const handleExportExcel = () => {
    message.info('Tính năng xuất Excel sẽ được phát triển sau');
  };

  // Filter
  const filteredSalaries = salaries.filter(salary => {
    const matchSearch = 
      salary.employeeName.toLowerCase().includes(searchText.toLowerCase()) ||
      salary.employeeCode.toLowerCase().includes(searchText.toLowerCase());
    const matchStatus = !filterStatus || salary.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Statistics
  const stats = {
    totalEmployees: salaries.length,
    totalGross: salaries.reduce((sum, s) => sum + s.grossSalary, 0),
    totalNet: salaries.reduce((sum, s) => sum + s.netSalary, 0),
    totalKPI: salaries.reduce((sum, s) => sum + s.kpiBonus, 0),
    totalSalesBonus: salaries.reduce((sum, s) => sum + s.salesBonus, 0),
    paid: salaries.filter(s => s.status === 'PAID').length,
    pending: salaries.filter(s => s.status === 'PENDING' || s.status === 'DRAFT').length,
  };

  // Get KPI color
  const getKPIColor = (score) => {
    if (score >= 100) return '#52c41a';
    if (score >= 80) return '#1890ff';
    if (score >= 60) return '#faad14';
    return '#cf1322';
  };

  // Table columns
  const columns = [
    {
      title: 'Mã NV', dataIndex: 'employeeCode', key: 'employeeCode', width: 90, fixed: 'left',
      render: (code) => <Text strong style={{ color: '#1890ff' }}>{code}</Text>
    },
    {
      title: 'Nhân viên', dataIndex: 'employeeName', key: 'employeeName', width: 150,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <small style={{ color: '#666' }}>{record.positionName}</small>
        </div>
      )
    },
    {
      title: 'Phòng ban', dataIndex: 'departmentName', key: 'departmentName', width: 130,
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Ngày công', key: 'workDays', width: 90, align: 'center',
      render: (_, record) => (
        <Tooltip title={`${record.actualWorkDays}/${record.workDays} ngày, nghỉ ${record.leaveDays} ngày`}>
          <Tag color={record.actualWorkDays === record.workDays ? 'green' : 'orange'}>
            {record.actualWorkDays}/{record.workDays}
          </Tag>
        </Tooltip>
      )
    },
    {
      title: 'KPI', key: 'kpi', width: 100, align: 'center',
      render: (_, record) => (
        <Tooltip title={`Thưởng KPI: ${formatCurrency(record.kpiBonus)}`}>
          <Tag color={getKPIColor(record.kpiScore)} style={{ fontWeight: 600 }}>
            {record.kpiScore}%
          </Tag>
        </Tooltip>
      )
    },
    {
      title: 'Lương CB', dataIndex: 'baseSalary', key: 'baseSalary', width: 120, align: 'right',
      render: (salary) => formatCurrency(salary)
    },
    {
      title: 'Thưởng KPI', dataIndex: 'kpiBonus', key: 'kpiBonus', width: 110, align: 'right',
      render: (bonus) => <Text style={{ color: '#52c41a' }}>{formatCurrency(bonus)}</Text>
    },
    {
      title: 'Thưởng DT', dataIndex: 'salesBonus', key: 'salesBonus', width: 110, align: 'right',
      render: (bonus) => bonus > 0 ? <Text style={{ color: '#722ed1' }}>{formatCurrency(bonus)}</Text> : '-'
    },
    {
      title: 'Khấu trừ', dataIndex: 'totalDeduction', key: 'totalDeduction', width: 110, align: 'right',
      render: (deduction) => <Text style={{ color: '#cf1322' }}>-{formatCurrency(deduction)}</Text>
    },
    {
      title: 'Thực lĩnh', dataIndex: 'netSalary', key: 'netSalary', width: 130, align: 'right',
      render: (salary) => <Text strong style={{ color: '#52c41a', fontSize: 14 }}>{formatCurrency(salary)}</Text>,
      sorter: (a, b) => a.netSalary - b.netSalary
    },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 110,
      render: (status) => {
        const config = SALARY_STATUS[status];
        return <Tag color={config.color} icon={config.icon}>{config.label}</Tag>;
      }
    },
    {
      title: '', key: 'actions', width: 140, fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Chi tiết">
            <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} />
          </Tooltip>
          {record.status === 'DRAFT' && (
            <Tooltip title="Gửi duyệt">
              <Button type="text" icon={<SendOutlined />} style={{ color: '#faad14' }}
                onClick={() => {
                  setSalaries(prev => prev.map(s => s.id === record.id ? { ...s, status: 'PENDING' } : s));
                  message.success('Đã gửi duyệt');
                }} 
              />
            </Tooltip>
          )}
          {record.status === 'PENDING' && (
            <Tooltip title="Duyệt">
              <Button type="text" icon={<CheckCircleOutlined />} style={{ color: '#1890ff' }} onClick={() => handleApprove(record)} />
            </Tooltip>
          )}
          {record.status === 'APPROVED' && (
            <Tooltip title="Xác nhận trả">
              <Button type="text" icon={<DollarOutlined />} style={{ color: '#52c41a' }} onClick={() => handlePay(record)} />
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  if (loading) return <Loading tip="Đang tải bảng lương..." />;

  return (
    <div>
      <PageHeader
        title="Quản lý lương"
        subtitle={`Bảng lương tháng ${filterMonth.format('MM/YYYY')}`}
        breadcrumbs={[{ title: 'Nhân sự' }, { title: 'Bảng lương' }]}
        extra={
          <Space>
            <Button icon={<CalculatorOutlined />} onClick={() => setKpiConfigVisible(true)}>
              Cấu hình KPI
            </Button>
            <Button icon={<FileExcelOutlined />} onClick={handleExportExcel}>
              Xuất Excel
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchSalaries}>Làm mới</Button>
            <Button onClick={handleBatchCreate}>Tạo hàng loạt</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Tạo bảng lương
            </Button>
          </Space>
        }
      />

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" hoverable>
            <Statistic title="Số nhân viên" value={stats.totalEmployees} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" hoverable>
            <Statistic title="Đã trả" value={stats.paid} suffix={`/${stats.totalEmployees}`} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" hoverable>
            <Statistic title="Chờ xử lý" value={stats.pending} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" hoverable>
            <Statistic title="Tổng thưởng KPI" value={stats.totalKPI} formatter={(v) => formatCurrency(v)} valueStyle={{ color: '#722ed1', fontSize: 14 }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" hoverable>
            <Statistic title="Thưởng doanh số" value={stats.totalSalesBonus} formatter={(v) => formatCurrency(v)} valueStyle={{ color: '#eb2f96', fontSize: 14 }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" hoverable>
            <Statistic title="Tổng thực lĩnh" value={stats.totalNet} formatter={(v) => formatCurrency(v)} valueStyle={{ color: '#52c41a', fontSize: 14 }} />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <DatePicker 
            picker="month" 
            value={filterMonth} 
            onChange={setFilterMonth}
            format="MM/YYYY"
            allowClear={false}
          />
          <Input.Search
            placeholder="Tìm theo mã, tên NV..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 220 }}
            allowClear
          />
          <Select placeholder="Trạng thái" value={filterStatus} onChange={setFilterStatus} style={{ width: 140 }} allowClear>
            {Object.entries(SALARY_STATUS).map(([key, value]) => (
              <Select.Option key={key} value={key}><Tag color={value.color}>{value.label}</Tag></Select.Option>
            ))}
          </Select>
        </Space>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredSalaries}
          rowKey="id"
          scroll={{ x: 1500 }}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `Tổng ${t} bản ghi` }}
          summary={(pageData) => {
            const totalNet = pageData.reduce((sum, r) => sum + r.netSalary, 0);
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={9}><Text strong>Tổng trang</Text></Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <Text strong style={{ color: '#52c41a', fontSize: 15 }}>{formatCurrency(totalNet)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} colSpan={2} />
              </Table.Summary.Row>
            );
          }}
        />
      </Card>

      {/* Modals */}
      <SalaryFormModal
        visible={formModalVisible}
        salary={selectedSalary}
        employees={MOCK_EMPLOYEES}
        kpiConfig={kpiConfig}
        month={filterMonth.month() + 1}
        year={filterMonth.year()}
        onCancel={() => { setFormModalVisible(false); setSelectedSalary(null); }}
        onSuccess={handleFormSuccess}
      />

      <SalaryDetailModal
        visible={detailModalVisible}
        salary={selectedSalary}
        onCancel={() => { setDetailModalVisible(false); setSelectedSalary(null); }}
      />

      <KPIConfigModal
        visible={kpiConfigVisible}
        config={kpiConfig}
        onCancel={() => setKpiConfigVisible(false)}
        onSave={(newConfig) => {
          setKpiConfig(newConfig);
          setKpiConfigVisible(false);
          message.success('Đã lưu cấu hình KPI');
        }}
      />
    </div>
  );
};

export default SalaryList;
