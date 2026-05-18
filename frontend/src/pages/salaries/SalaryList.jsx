import { useState, useEffect } from 'react';
import { Table, Button, Space, Input, message, Tag, Card, Row, Col, Statistic, Select, Popconfirm, Tooltip } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined, DollarOutlined, CheckCircleOutlined, ClockCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { PageHeader, Loading } from '../../components/common';
import { formatCurrency } from '../../utils/formatters';
import SalaryFormModal from './SalaryFormModal';
import SalaryDetailModal from './SalaryDetailModal';
import KPIConfigModal from './KPIConfigModal';
import salaryApi from '../../api/salaryApi';
import employeeApi from '../../api/employeeApi';

// ========== DEFAULT CONFIG (lưu localStorage) ==========
const DEFAULT_KPI_CONFIG = {
  kpiBonusPercent: 10,
  salesCommissionPercent: 1,
  overtimeRate: 1.5,
  mealAllowance: 1000000,
  transportAllowance: 500000,
  phoneAllowance: 300000,
  insurancePercent: 10.5,
  latePenaltyPerTime: 100000
};

// Load config từ localStorage
const loadConfig = () => {
  try {
    const saved = localStorage.getItem('kpiConfig');
    return saved ? { ...DEFAULT_KPI_CONFIG, ...JSON.parse(saved) } : DEFAULT_KPI_CONFIG;
  } catch {
    return DEFAULT_KPI_CONFIG;
  }
};

const SalaryList = () => {
  const [loading, setLoading] = useState(true);
  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterMonth, setFilterMonth] = useState(null);
  const [filterYear, setFilterYear] = useState(null);

  const [formModalVisible, setFormModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState(null);
  const [kpiConfig, setKpiConfig] = useState(loadConfig);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [salRes, empRes] = await Promise.all([
        salaryApi.getAll(), 
        employeeApi.getAll()
      ]);
      
      const salariesData = extractData(salRes);
      const employeesData = extractData(empRes);
      
      // Normalize salary data để FE sử dụng
      const normalizedSalaries = salariesData.map(sal => normalizeSalaryData(sal, employeesData));
      
      setSalaries(normalizedSalaries);
      setEmployees(employeesData);
    } catch (error) { 
      console.error('Fetch error:', error);
      message.error(error.response?.data?.message || error.message || 'Không thể tải dữ liệu'); 
    } finally { 
      setLoading(false); 
    }
  };

  // Helper: Extract data từ response
  const extractData = (response) => {
    const data = response?.data?.data || response?.data || response;
    return Array.isArray(data) ? data : [];
  };

  /**
   * Normalize salary data từ BE response sang format FE cần
   * BE trả về đơn giản, FE tự thêm các field tính toán
   */
  const normalizeSalaryData = (salary, employeesList = []) => {
    const employee = employeesList.find(e => e.id === salary.employeeId) || {};
    
    return {
      // === ID ===
      id: salary.id,
      employeeId: salary.employeeId,
      
      // === Employee Info (từ BE hoặc lookup) ===
      employeeCode: salary.employeeCode || employee.code || employee.user?.username || `EMP${salary.employeeId}`,
      employeeName: salary.employeeName || employee.name || '',
      departmentName: salary.departmentName || employee.departmentName || '',
      positionName: salary.positionName || employee.positionName || '',
      
      // === Period ===
      month: salary.month,
      year: salary.year,
      
      // === Work Days (từ BE) ===
      workDays: salary.workDays || 22,
      actualWorkDays: salary.actualWorkDays || 22,
      leaveDays: salary.leaveDays || 0,
      overtimeHours: salary.overtimeHours || 0,
      
      // === Salary Components (từ BE) ===
      baseSalary: salary.baseSalary || 0,
      bonus: salary.bonus || 0,           // Tổng thưởng
      allowance: salary.allowance || 0,   // Tổng phụ cấp
      overtimePay: salary.overtimePay || 0,
      deduction: salary.deduction || 0,   // Tổng khấu trừ
      totalSalary: salary.totalSalary || 0, // Thực lĩnh
      
      // === Status ===
      isPaid: salary.isPaid || false,
      paidDate: salary.paidDate || null,
      
      // === Note ===
      note: salary.note || '',
      
      // === Computed (cho display) ===
      netSalary: salary.totalSalary || 0,
      grossSalary: (salary.baseSalary || 0) + (salary.bonus || 0) + (salary.allowance || 0) + (salary.overtimePay || 0)
    };
  };

  const handleCreate = () => { 
    setSelectedSalary(null); 
    setFormModalVisible(true); 
  };

  const handleEdit = (record) => { 
    setSelectedSalary(record); 
    setFormModalVisible(true); 
  };

  const handleViewDetail = async (record) => {
    try {
      const res = await salaryApi.getById(record.id);
      const salaryData = res?.data?.data || res?.data || res;
      setSelectedSalary(normalizeSalaryData(salaryData, employees));
      setDetailModalVisible(true);
    } catch (error) { 
      console.error('Get detail error:', error);
      message.error('Không thể tải chi tiết'); 
    }
  };

  const handleDelete = async (record) => {
    if (record.isPaid) {
      message.error('Không thể xóa bảng lương đã thanh toán!');
      return;
    }
    
    try {
      await salaryApi.delete(record.id);
      setSalaries(prev => prev.filter(s => s.id !== record.id));
      message.success('Đã xóa bảng lương');
    } catch (error) { 
      message.error(error.response?.data?.message || error.message || 'Không thể xóa'); 
    }
  };

  const handleMarkPaid = async (record) => {
    try {
      await salaryApi.markAsPaid(record.id);
      setSalaries(prev => prev.map(s => 
        s.id === record.id 
          ? { ...s, isPaid: true, paidDate: new Date().toISOString().split('T')[0] } 
          : s
      ));
      message.success('Đã đánh dấu đã trả lương!');
    } catch (error) { 
      console.error('Mark paid error:', error);
      message.error(error.response?.data?.message || error.message || 'Có lỗi xảy ra'); 
    }
  };

  /**
   * Transform FE form data sang BE request format
   * FE tính chi tiết, gửi tổng về BE
   */
  const transformForBackend = (formData) => {
    return {
      employeeId: formData.employeeId,
      month: formData.month,
      year: formData.year,
      workDays: formData.workDays || 22,
      actualWorkDays: formData.actualWorkDays || 22,
      leaveDays: formData.leaveDays || 0,
      overtimeHours: formData.overtimeHours || 0,
      // BE nhận tổng, FE đã tính sẵn
      bonus: formData.totalBonus || formData.bonus || 0,
      allowance: formData.totalAllowance || formData.allowance || 0,
      deduction: formData.totalDeduction || formData.deduction || 0,
      note: formData.note || ''
    };
  };

  const handleFormSuccess = async (formData) => {
    try {
      const backendData = transformForBackend(formData);
      
      if (selectedSalary) {
        if (selectedSalary.isPaid) {
          message.error('Không thể cập nhật bảng lương đã thanh toán!');
          return;
        }
        
        const res = await salaryApi.update(selectedSalary.id, backendData);
        const updatedData = res?.data?.data || res?.data || res;
        setSalaries(prev => prev.map(s => 
          s.id === selectedSalary.id 
            ? normalizeSalaryData(updatedData, employees) 
            : s
        ));
        message.success('Cập nhật bảng lương thành công!');
      } else {
        const res = await salaryApi.create(backendData);
        const newData = res?.data?.data || res?.data || res;
        setSalaries(prev => [...prev, normalizeSalaryData(newData, employees)]);
        message.success('Tạo bảng lương thành công!');
      }
      setFormModalVisible(false);
    } catch (error) { 
      console.error('Save error:', error);
      message.error(error.response?.data?.message || error.message || 'Có lỗi xảy ra'); 
    }
  };

  const handleConfigSave = (newConfig) => {
    setKpiConfig(newConfig);
    localStorage.setItem('kpiConfig', JSON.stringify(newConfig));
    setConfigModalVisible(false);
    message.success('Đã lưu cấu hình KPI!');
  };

  // Filter salaries
  const filteredSalaries = salaries.filter(sal => {
    const matchSearch = !searchText || 
      (sal.employeeName || '').toLowerCase().includes(searchText.toLowerCase()) ||
      (sal.employeeCode || '').toLowerCase().includes(searchText.toLowerCase());
    const matchStatus = filterStatus === null || sal.isPaid === (filterStatus === 'paid');
    const matchMonth = !filterMonth || sal.month === filterMonth;
    const matchYear = !filterYear || sal.year === filterYear;
    return matchSearch && matchStatus && matchMonth && matchYear;
  });

  // Statistics
  const stats = {
    total: salaries.length,
    paid: salaries.filter(s => s.isPaid).length,
    unpaid: salaries.filter(s => !s.isPaid).length,
    totalAmount: salaries.reduce((sum, s) => sum + (s.totalSalary || 0), 0),
    unpaidAmount: salaries.filter(s => !s.isPaid).reduce((sum, s) => sum + (s.totalSalary || 0), 0)
  };

  // Table columns
  const columns = [
    { 
      title: 'Mã NV', 
      dataIndex: 'employeeCode', 
      key: 'employeeCode', 
      width: 100,
      render: (code) => <Tag>{code || '-'}</Tag>
    },
    { 
      title: 'Nhân viên', 
      dataIndex: 'employeeName', 
      key: 'employeeName', 
      width: 150
    },
    { 
      title: 'Phòng ban', 
      dataIndex: 'departmentName', 
      key: 'departmentName', 
      width: 120,
      render: (name) => name ? <Tag color="blue">{name}</Tag> : '-'
    },
    { 
      title: 'Kỳ lương', 
      key: 'period', 
      width: 100, 
      render: (_, r) => <Tag color="cyan">T{r.month}/{r.year}</Tag>
    },
    { 
      title: 'Ngày công', 
      key: 'workDays', 
      width: 90, 
      align: 'center',
      render: (_, r) => (
        <span style={{ color: r.actualWorkDays < r.workDays ? '#faad14' : '#52c41a' }}>
          {r.actualWorkDays}/{r.workDays}
        </span>
      )
    },
    { 
      title: 'Lương CB', 
      dataIndex: 'baseSalary', 
      key: 'baseSalary', 
      width: 120, 
      align: 'right', 
      render: (v) => formatCurrency(v || 0) 
    },
    { 
      title: 'Thưởng', 
      dataIndex: 'bonus', 
      key: 'bonus', 
      width: 110, 
      align: 'right', 
      render: (v) => <span style={{ color: '#52c41a' }}>+{formatCurrency(v || 0)}</span>
    },
    { 
      title: 'Khấu trừ', 
      dataIndex: 'deduction', 
      key: 'deduction', 
      width: 110, 
      align: 'right', 
      render: (v) => <span style={{ color: '#cf1322' }}>-{formatCurrency(v || 0)}</span>
    },
    { 
      title: 'Thực lĩnh', 
      dataIndex: 'totalSalary', 
      key: 'totalSalary', 
      width: 130, 
      align: 'right', 
      render: (v) => <span style={{ fontWeight: 600, color: '#1890ff' }}>{formatCurrency(v || 0)}</span>,
      sorter: (a, b) => (a.totalSalary || 0) - (b.totalSalary || 0)
    },
    { 
      title: 'Trạng thái', 
      dataIndex: 'isPaid', 
      key: 'isPaid', 
      width: 110,
      filters: [
        { text: 'Đã trả', value: true },
        { text: 'Chưa trả', value: false },
      ],
      onFilter: (value, record) => record.isPaid === value,
      render: (isPaid) => isPaid 
        ? <Tag color="success" icon={<CheckCircleOutlined />}>Đã trả</Tag> 
        : <Tag color="warning" icon={<ClockCircleOutlined />}>Chưa trả</Tag>
    },
    { 
      title: 'Thao tác', 
      key: 'actions', 
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} />
          </Tooltip>
          {!record.isPaid && (
            <>
              <Tooltip title="Sửa">
                <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
              </Tooltip>
              <Popconfirm 
                title="Xác nhận đã trả lương?" 
                description="Sau khi đánh dấu, bạn sẽ không thể sửa hoặc xóa."
                onConfirm={() => handleMarkPaid(record)}
                okText="Xác nhận"
                cancelText="Hủy"
              >
                <Tooltip title="Đánh dấu đã trả">
                  <Button type="text" icon={<CheckCircleOutlined />} style={{ color: '#52c41a' }} />
                </Tooltip>
              </Popconfirm>
              <Popconfirm 
                title="Xác nhận xóa bảng lương này?" 
                onConfirm={() => handleDelete(record)}
                okText="Xóa"
                cancelText="Hủy"
              >
                <Tooltip title="Xóa">
                  <Button type="text" danger icon={<DeleteOutlined />} />
                </Tooltip>
              </Popconfirm>
            </>
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
        subtitle="Quản lý bảng lương nhân viên" 
        breadcrumbs={[{ title: 'Nhân sự' }, { title: 'Bảng lương' }]}
        extra={
          <Space>
            <Button icon={<SettingOutlined />} onClick={() => setConfigModalVisible(true)}>
              Cấu hình KPI
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchData}>Làm mới</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Tạo bảng lương
            </Button>
          </Space>
        }
      />

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic title="Tổng bảng lương" value={stats.total} prefix={<DollarOutlined />} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic title="Đã trả" value={stats.paid} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic title="Chưa trả" value={stats.unpaid} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic title="Tổng chưa trả" value={stats.unpaidAmount} formatter={(v) => formatCurrency(v)} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input.Search 
            placeholder="Tìm theo tên/mã NV..." 
            prefix={<SearchOutlined />} 
            value={searchText} 
            onChange={(e) => setSearchText(e.target.value)} 
            style={{ width: 220 }} 
            allowClear 
          />
          <Select placeholder="Trạng thái" value={filterStatus} onChange={setFilterStatus} style={{ width: 120 }} allowClear>
            <Select.Option value="paid">Đã trả</Select.Option>
            <Select.Option value="unpaid">Chưa trả</Select.Option>
          </Select>
          <Select placeholder="Tháng" value={filterMonth} onChange={setFilterMonth} style={{ width: 100 }} allowClear>
            {[...Array(12)].map((_, i) => <Select.Option key={i + 1} value={i + 1}>Tháng {i + 1}</Select.Option>)}
          </Select>
          <Select placeholder="Năm" value={filterYear} onChange={setFilterYear} style={{ width: 90 }} allowClear>
            {[2024, 2025, 2026].map(y => <Select.Option key={y} value={y}>{y}</Select.Option>)}
          </Select>
          {(searchText || filterStatus || filterMonth || filterYear) && (
            <Button type="link" onClick={() => { setSearchText(''); setFilterStatus(null); setFilterMonth(null); setFilterYear(null); }}>
              Xóa bộ lọc
            </Button>
          )}
        </Space>
      </Card>

      {/* Table */}
      <Card>
        <Table 
          columns={columns} 
          dataSource={filteredSalaries} 
          rowKey="id" 
          scroll={{ x: 1200 }} 
          pagination={{ 
            pageSize: 10, 
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} bảng lương` 
          }} 
        />
      </Card>

      {/* Modals */}
      <SalaryFormModal 
        visible={formModalVisible} 
        salary={selectedSalary} 
        employees={employees}
        config={kpiConfig}
        onCancel={() => { setFormModalVisible(false); setSelectedSalary(null); }} 
        onSuccess={handleFormSuccess} 
      />

      <SalaryDetailModal 
        visible={detailModalVisible} 
        salary={selectedSalary} 
        onCancel={() => { setDetailModalVisible(false); setSelectedSalary(null); }} 
      />

      <KPIConfigModal
        visible={configModalVisible}
        config={kpiConfig}
        onCancel={() => setConfigModalVisible(false)}
        onSave={handleConfigSave}
      />
    </div>
  );
};

export default SalaryList;