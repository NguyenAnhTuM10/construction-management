import { useState, useEffect, useMemo } from 'react';
import { 
  Modal, Form, Select, InputNumber, Input, Row, Col, 
  Divider, Card, Typography, Space, Slider, Tag, Alert
} from 'antd';
import { 
  UserOutlined, TrophyOutlined, RiseOutlined, DollarOutlined
} from '@ant-design/icons';
import { formatCurrency } from '../../utils/formatters';

const { Text, Title } = Typography;
const { TextArea } = Input;

const SalaryFormModal = ({ 
  visible, 
  salary, 
  employees = [], 
  config = {},
  onCancel, 
  onSuccess 
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Watch form values for real-time calculation
  const workDays = Form.useWatch('workDays', form) || 22;
  const actualWorkDays = Form.useWatch('actualWorkDays', form) || 22;
  const overtimeHours = Form.useWatch('overtimeHours', form) || 0;
  const kpiScore = Form.useWatch('kpiScore', form) || 100;
  const salesActual = Form.useWatch('salesActual', form) || 0;
  const salesTarget = Form.useWatch('salesTarget', form) || 0;
  const lateCount = Form.useWatch('lateCount', form) || 0;

  const currentDate = new Date();
  const month = salary?.month || currentDate.getMonth() + 1;
  const year = salary?.year || currentDate.getFullYear();
  const isEditing = !!salary;

  // Default config values
  const cfg = {
    kpiBonusPercent: config.kpiBonusPercent || 10,
    salesCommissionPercent: config.salesCommissionPercent || 1,
    overtimeRate: config.overtimeRate || 1.5,
    mealAllowance: config.mealAllowance || 1000000,
    transportAllowance: config.transportAllowance || 500000,
    phoneAllowance: config.phoneAllowance || 300000,
    insurancePercent: config.insurancePercent || 10.5,
    latePenaltyPerTime: config.latePenaltyPerTime || 100000
  };

  useEffect(() => {
    if (visible) {
      if (salary) {
        const emp = employees.find(e => e.id === salary.employeeId);
        setSelectedEmployee(emp);
        form.setFieldsValue({
          employeeId: salary.employeeId,
          workDays: salary.workDays || 22,
          actualWorkDays: salary.actualWorkDays || 22,
          leaveDays: salary.leaveDays || 0,
          overtimeHours: salary.overtimeHours || 0,
          kpiScore: 100, // Default, vì BE không lưu
          salesTarget: 0,
          salesActual: 0,
          lateCount: 0,
          note: salary.note || ''
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          workDays: 22,
          actualWorkDays: 22,
          leaveDays: 0,
          overtimeHours: 0,
          kpiScore: 100,
          salesTarget: 0,
          salesActual: 0,
          lateCount: 0
        });
        setSelectedEmployee(null);
      }
    }
  }, [visible, salary, form, employees]);

  // ========== CALCULATE SALARY COMPONENTS ==========
  const calculations = useMemo(() => {
    if (!selectedEmployee) return null;

    const baseSalary = selectedEmployee.baseSalary || 0;
    const dailyRate = baseSalary / workDays;
    const hourlyRate = dailyRate / 8;

    // 1. Lương theo ngày công thực tế
    const proratedBaseSalary = Math.round(dailyRate * actualWorkDays);

    // 2. Thưởng KPI = (kpiScore / 100) × (kpiBonusPercent / 100) × baseSalary
    const kpiBonus = Math.round((kpiScore / 100) * (cfg.kpiBonusPercent / 100) * baseSalary);

    // 3. Thưởng doanh số (chỉ cho phòng kinh doanh)
    const salesBonus = salesTarget > 0 && salesActual > 0
      ? Math.round(salesActual * (cfg.salesCommissionPercent / 100))
      : 0;

    // 4. Tổng thưởng
    const totalBonus = kpiBonus + salesBonus;

    // 5. Lương tăng ca
    const overtimePay = Math.round(overtimeHours * hourlyRate * cfg.overtimeRate);

    // 6. Phụ cấp
    const isManager = (selectedEmployee.positionName || '').toLowerCase().includes('trưởng');
    const mealAllowance = cfg.mealAllowance;
    const transportAllowance = cfg.transportAllowance;
    const phoneAllowance = isManager ? cfg.phoneAllowance : 0;
    const totalAllowance = mealAllowance + transportAllowance + phoneAllowance;

    // 7. Khấu trừ
    const insurance = Math.round(baseSalary * (cfg.insurancePercent / 100));
    const latePenalty = lateCount * cfg.latePenaltyPerTime;
    
    // Thuế TNCN (đơn giản: 10% phần vượt 11 triệu)
    const taxableBase = proratedBaseSalary + totalBonus + overtimePay + totalAllowance - insurance;
    const taxableIncome = taxableBase - 11000000;
    const tax = taxableIncome > 0 ? Math.round(taxableIncome * 0.1) : 0;
    
    const totalDeduction = insurance + tax + latePenalty;

    // 8. Tổng thu nhập & Thực lĩnh
    const grossSalary = proratedBaseSalary + totalBonus + overtimePay + totalAllowance;
    const netSalary = grossSalary - totalDeduction;

    return {
      baseSalary,
      proratedBaseSalary,
      kpiBonus,
      salesBonus,
      totalBonus,
      overtimePay,
      allowances: { meal: mealAllowance, transport: transportAllowance, phone: phoneAllowance },
      totalAllowance,
      deductions: { insurance, tax, latePenalty },
      totalDeduction,
      grossSalary,
      netSalary
    };
  }, [selectedEmployee, workDays, actualWorkDays, overtimeHours, kpiScore, salesActual, salesTarget, lateCount, cfg]);

  // Handle employee selection
  const handleEmployeeChange = (employeeId) => {
    const emp = employees.find(e => e.id === employeeId);
    setSelectedEmployee(emp);
    
    // Set default sales target cho phòng kinh doanh
    if (emp?.departmentName?.toLowerCase().includes('kinh doanh')) {
      const isManager = (emp.positionName || '').toLowerCase().includes('trưởng');
      form.setFieldsValue({
        salesTarget: isManager ? 500000000 : 200000000
      });
    } else {
      form.setFieldsValue({ salesTarget: 0, salesActual: 0 });
    }
  };

  // KPI color based on score
  const getKPIColor = (score) => {
    if (score >= 100) return '#52c41a';
    if (score >= 80) return '#1890ff';
    if (score >= 60) return '#faad14';
    return '#cf1322';
  };

  // Submit form
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Data gửi về BE (tổng hợp)
      const salaryData = {
        employeeId: values.employeeId,
        month,
        year,
        workDays: values.workDays,
        actualWorkDays: values.actualWorkDays,
        leaveDays: values.leaveDays || 0,
        overtimeHours: values.overtimeHours || 0,
        // Gửi TỔNG về BE
        totalBonus: calculations.totalBonus,
        totalAllowance: calculations.totalAllowance,
        totalDeduction: calculations.totalDeduction,
        note: values.note || ''
      };

      setTimeout(() => {
        onSuccess(salaryData);
        setLoading(false);
      }, 300);
    } catch (error) {
      console.error('Validation error:', error);
    }
  };

  const isSalesDept = selectedEmployee?.departmentName?.toLowerCase().includes('kinh doanh');

  return (
    <Modal
      title={
        <Space>
          <DollarOutlined style={{ color: '#52c41a' }} />
          {isEditing ? `Sửa bảng lương: ${salary?.employeeName}` : `Tạo bảng lương T${month}/${year}`}
        </Space>
      }
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      okText={isEditing ? 'Cập nhật' : 'Tạo bảng lương'}
      cancelText="Hủy"
      width={900}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        
        {/* ========== CHỌN NHÂN VIÊN ========== */}
        <Form.Item
          name="employeeId"
          label="Chọn nhân viên"
          rules={[{ required: true, message: 'Vui lòng chọn nhân viên!' }]}
        >
          <Select
            placeholder="Chọn nhân viên"
            onChange={handleEmployeeChange}
            showSearch
            optionFilterProp="children"
            disabled={isEditing}
          >
            {employees.filter(e => e.active !== false).map(emp => (
              <Select.Option key={emp.id} value={emp.id}>
                <Space>
                  <UserOutlined />
                  {emp.code || emp.user?.username || `EMP${emp.id}`} - {emp.name}
                  {emp.departmentName && <Tag color="blue">{emp.departmentName}</Tag>}
                  <Text type="secondary">({formatCurrency(emp.baseSalary || 0)})</Text>
                </Space>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {selectedEmployee && (
          <>
            {/* ========== THÔNG TIN NHÂN VIÊN ========== */}
            <Card size="small" style={{ marginBottom: 16, background: '#f5f5f5' }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Text>Lương cơ bản:</Text>{' '}
                  <Text strong>{formatCurrency(selectedEmployee.baseSalary || 0)}</Text>
                </Col>
                <Col span={8}>
                  <Text>Phòng ban:</Text>{' '}
                  <Tag color="blue">{selectedEmployee.departmentName || '-'}</Tag>
                </Col>
                <Col span={8}>
                  <Text>Chức vụ:</Text>{' '}
                  <Text strong>{selectedEmployee.positionName || '-'}</Text>
                </Col>
              </Row>
            </Card>

            {/* ========== NGÀY CÔNG ========== */}
            <Divider>Ngày công & Tăng ca</Divider>
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item name="workDays" label="Ngày công chuẩn" rules={[{ required: true }]}>
                  <InputNumber min={1} max={31} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="actualWorkDays" label="Ngày công thực tế" rules={[{ required: true }]}>
                  <InputNumber min={0} max={31} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="leaveDays" label="Ngày nghỉ phép">
                  <InputNumber min={0} max={31} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="overtimeHours" label="Giờ tăng ca">
                  <InputNumber min={0} max={100} step={0.5} style={{ width: '100%' }} addonAfter="giờ" />
                </Form.Item>
              </Col>
            </Row>

            {/* ========== KPI ========== */}
            <Divider><TrophyOutlined /> Đánh giá KPI</Divider>
            <Row gutter={16}>
              <Col span={16}>
                <Form.Item 
                  name="kpiScore" 
                  label={<Space>Điểm KPI <Tag color={getKPIColor(kpiScore)}>{kpiScore}%</Tag></Space>}
                >
                  <Slider
                    min={0}
                    max={150}
                    marks={{ 0: '0%', 60: '60%', 80: '80%', 100: '100%', 120: '120%', 150: '150%' }}
                    tooltip={{ formatter: (v) => `${v}%` }}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Thưởng KPI">
                  <Card size="small" style={{ background: '#f6ffed', textAlign: 'center' }}>
                    <Title level={4} style={{ margin: 0, color: '#52c41a' }}>
                      {formatCurrency(calculations?.kpiBonus || 0)}
                    </Title>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      = {kpiScore}% × {cfg.kpiBonusPercent}% × Lương CB
                    </Text>
                  </Card>
                </Form.Item>
              </Col>
            </Row>

            {/* ========== DOANH SỐ (chỉ cho Sales) ========== */}
            {isSalesDept && (
              <>
                <Divider><RiseOutlined /> Doanh số bán hàng</Divider>
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item name="salesTarget" label="Chỉ tiêu doanh số">
                      <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        step={10000000}
                        formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={v => v.replace(/\$\s?|(,*)/g, '')}
                        addonAfter="đ"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="salesActual" label="Doanh số thực tế">
                      <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        step={10000000}
                        formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={v => v.replace(/\$\s?|(,*)/g, '')}
                        addonAfter="đ"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="Thưởng doanh số">
                      <Card size="small" style={{ background: '#f9f0ff', textAlign: 'center' }}>
                        <Title level={4} style={{ margin: 0, color: '#722ed1' }}>
                          {formatCurrency(calculations?.salesBonus || 0)}
                        </Title>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          = {cfg.salesCommissionPercent}% × Doanh số
                        </Text>
                      </Card>
                    </Form.Item>
                  </Col>
                </Row>
                {salesActual > 0 && salesTarget > 0 && (
                  <Alert
                    message={salesActual >= salesTarget 
                      ? `🎉 Đạt ${Math.round(salesActual / salesTarget * 100)}% chỉ tiêu!` 
                      : `⚠️ Đạt ${Math.round(salesActual / salesTarget * 100)}% chỉ tiêu`}
                    type={salesActual >= salesTarget ? 'success' : 'warning'}
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                )}
              </>
            )}

            {/* ========== KHẤU TRỪ ========== */}
            <Divider>Khấu trừ</Divider>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="lateCount" label="Số lần đi muộn">
                  <InputNumber min={0} max={30} style={{ width: '100%' }} addonAfter="lần" />
                </Form.Item>
              </Col>
              <Col span={16}>
                <Card size="small" style={{ background: '#fff1f0' }}>
                  <Space split={<Divider type="vertical" />} wrap>
                    <Text>BHXH: <Text strong>{formatCurrency(calculations?.deductions?.insurance || 0)}</Text></Text>
                    <Text>Thuế: <Text strong>{formatCurrency(calculations?.deductions?.tax || 0)}</Text></Text>
                    <Text>Phạt: <Text strong>{formatCurrency(calculations?.deductions?.latePenalty || 0)}</Text></Text>
                  </Space>
                </Card>
              </Col>
            </Row>

            {/* ========== TỔNG KẾT ========== */}
            <Divider>Tổng kết</Divider>
            <Card style={{ background: '#e6f7ff', border: '1px solid #91d5ff' }}>
              <Row gutter={[16, 8]}>
                <Col span={8}><Text>Lương theo ngày công:</Text></Col>
                <Col span={4} style={{ textAlign: 'right' }}>
                  <Text strong>{formatCurrency(calculations?.proratedBaseSalary || 0)}</Text>
                </Col>
                <Col span={8}><Text>Phụ cấp:</Text></Col>
                <Col span={4} style={{ textAlign: 'right' }}>
                  <Text strong style={{ color: '#52c41a' }}>+{formatCurrency(calculations?.totalAllowance || 0)}</Text>
                </Col>
                
                <Col span={8}><Text>Thưởng KPI:</Text></Col>
                <Col span={4} style={{ textAlign: 'right' }}>
                  <Text strong style={{ color: '#52c41a' }}>+{formatCurrency(calculations?.kpiBonus || 0)}</Text>
                </Col>
                <Col span={8}><Text>Lương tăng ca:</Text></Col>
                <Col span={4} style={{ textAlign: 'right' }}>
                  <Text strong>+{formatCurrency(calculations?.overtimePay || 0)}</Text>
                </Col>
                
                {isSalesDept && (
                  <>
                    <Col span={8}><Text>Thưởng doanh số:</Text></Col>
                    <Col span={4} style={{ textAlign: 'right' }}>
                      <Text strong style={{ color: '#722ed1' }}>+{formatCurrency(calculations?.salesBonus || 0)}</Text>
                    </Col>
                  </>
                )}
                <Col span={8}><Text>Tổng khấu trừ:</Text></Col>
                <Col span={4} style={{ textAlign: 'right' }}>
                  <Text strong style={{ color: '#cf1322' }}>-{formatCurrency(calculations?.totalDeduction || 0)}</Text>
                </Col>
                
                <Col span={24}><Divider style={{ margin: '8px 0' }} /></Col>
                
                <Col span={8}><Text strong style={{ fontSize: 16 }}>THỰC LĨNH:</Text></Col>
                <Col span={16} style={{ textAlign: 'right' }}>
                  <Title level={3} style={{ margin: 0, color: '#52c41a' }}>
                    {formatCurrency(calculations?.netSalary || 0)}
                  </Title>
                </Col>
              </Row>
            </Card>

            {/* ========== GHI CHÚ ========== */}
            <Form.Item name="note" label="Ghi chú" style={{ marginTop: 16 }}>
              <TextArea rows={2} placeholder="Ghi chú thêm (nếu có)" maxLength={500} showCount />
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
};

export default SalaryFormModal;