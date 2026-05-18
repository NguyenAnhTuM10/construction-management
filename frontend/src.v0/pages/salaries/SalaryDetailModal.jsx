import { Modal, Descriptions, Tag, Space, Button, Typography, Divider, Card, Row, Col, Progress, Table } from 'antd';
import { PrinterOutlined, DollarOutlined, TrophyOutlined, CalendarOutlined, UserOutlined } from '@ant-design/icons';
import { formatCurrency } from '../../utils/formatters';

const { Title, Text } = Typography;

const SALARY_STATUS = {
  DRAFT: { label: 'Nháp', color: 'default' },
  PENDING: { label: 'Chờ duyệt', color: 'gold' },
  APPROVED: { label: 'Đã duyệt', color: 'blue' },
  PAID: { label: 'Đã trả', color: 'success' },
};

const SalaryDetailModal = ({ visible, salary, onCancel }) => {
  if (!salary) return null;

  const statusConfig = SALARY_STATUS[salary.status];
  
  const getKPIColor = (score) => {
    if (score >= 100) return '#52c41a';
    if (score >= 80) return '#1890ff';
    if (score >= 60) return '#faad14';
    return '#cf1322';
  };

  // Income items
  const incomeItems = [
    { key: '1', item: 'Lương cơ bản (theo ngày công)', amount: Math.round(salary.baseSalary / salary.workDays * salary.actualWorkDays) },
    { key: '2', item: `Thưởng KPI (${salary.kpiScore}%)`, amount: salary.kpiBonus },
    ...(salary.salesBonus > 0 ? [{ key: '3', item: 'Thưởng doanh số', amount: salary.salesBonus }] : []),
    { key: '4', item: `Lương tăng ca (${salary.overtimeHours}h)`, amount: salary.overtimePay },
    { key: '5', item: 'Phụ cấp ăn trưa', amount: salary.allowances?.meal || 0 },
    { key: '6', item: 'Phụ cấp đi lại', amount: salary.allowances?.transport || 0 },
    ...(salary.allowances?.phone > 0 ? [{ key: '7', item: 'Phụ cấp điện thoại', amount: salary.allowances.phone }] : []),
  ];

  // Deduction items
  const deductionItems = [
    { key: '1', item: 'BHXH, BHYT, BHTN (10.5%)', amount: salary.deductions?.insurance || 0 },
    { key: '2', item: 'Thuế TNCN', amount: salary.deductions?.tax || 0 },
    ...(salary.deductions?.latePenalty > 0 ? [{ key: '3', item: 'Phạt đi muộn', amount: salary.deductions.latePenalty }] : []),
  ];

  const columns = [
    { title: 'Khoản mục', dataIndex: 'item', key: 'item' },
    { 
      title: 'Số tiền', dataIndex: 'amount', key: 'amount', align: 'right',
      render: (amount) => <Text strong>{formatCurrency(amount)}</Text>
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <DollarOutlined style={{ color: '#52c41a' }} />
          <span>Chi tiết bảng lương</span>
          <Tag color="blue">T{salary.month}/{salary.year}</Tag>
          <Tag color={statusConfig.color}>{statusConfig.label}</Tag>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="print" icon={<PrinterOutlined />}>In phiếu lương</Button>,
        <Button key="close" type="primary" onClick={onCancel}>Đóng</Button>
      ]}
    >
      {/* Employee Info */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label={<><UserOutlined /> Nhân viên</>}>
                <Text strong>{salary.employeeCode} - {salary.employeeName}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Phòng ban">
                <Tag color="blue">{salary.departmentName}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Chức vụ">{salary.positionName}</Descriptions.Item>
            </Descriptions>
          </Col>
          <Col span={12}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label={<><CalendarOutlined /> Kỳ lương</>}>
                Tháng {salary.month}/{salary.year}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày công">
                <Tag color={salary.actualWorkDays === salary.workDays ? 'green' : 'orange'}>
                  {salary.actualWorkDays}/{salary.workDays} ngày
                </Tag>
                {salary.leaveDays > 0 && <Text type="secondary"> (nghỉ {salary.leaveDays} ngày)</Text>}
              </Descriptions.Item>
              <Descriptions.Item label="Tăng ca">{salary.overtimeHours} giờ</Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </Card>

      {/* KPI Section */}
      <Card size="small" title={<><TrophyOutlined /> Đánh giá KPI</>} style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <Title level={2} style={{ margin: 0, color: getKPIColor(salary.kpiScore) }}>
                {salary.kpiScore}%
              </Title>
              <Text type="secondary">Điểm KPI</Text>
            </div>
          </Col>
          <Col span={8}>
            <Progress 
              type="circle" 
              percent={Math.min(salary.kpiScore, 100)} 
              strokeColor={getKPIColor(salary.kpiScore)}
              format={() => salary.kpiScore >= 100 ? '🎉' : `${salary.kpiScore}%`}
              size={80}
            />
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ margin: 0, color: '#52c41a' }}>
                {formatCurrency(salary.kpiBonus)}
              </Title>
              <Text type="secondary">Thưởng KPI</Text>
            </div>
          </Col>
        </Row>

        {salary.salesTarget > 0 && (
          <>
            <Divider style={{ margin: '12px 0' }} />
            <Row gutter={16}>
              <Col span={8}>
                <Text type="secondary">Chỉ tiêu:</Text>
                <div><Text strong>{formatCurrency(salary.salesTarget)}</Text></div>
              </Col>
              <Col span={8}>
                <Text type="secondary">Thực tế:</Text>
                <div>
                  <Text strong style={{ color: salary.salesActual >= salary.salesTarget ? '#52c41a' : '#faad14' }}>
                    {formatCurrency(salary.salesActual)}
                  </Text>
                </div>
              </Col>
              <Col span={8}>
                <Text type="secondary">Thưởng doanh số:</Text>
                <div><Text strong style={{ color: '#722ed1' }}>{formatCurrency(salary.salesBonus)}</Text></div>
              </Col>
            </Row>
          </>
        )}
      </Card>

      {/* Income & Deductions */}
      <Row gutter={16}>
        <Col span={12}>
          <Card size="small" title="Thu nhập" style={{ background: '#f6ffed' }}>
            <Table 
              columns={columns} 
              dataSource={incomeItems} 
              pagination={false} 
              size="small"
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell><Text strong>Tổng thu nhập</Text></Table.Summary.Cell>
                  <Table.Summary.Cell align="right">
                    <Text strong style={{ color: '#52c41a' }}>{formatCurrency(salary.grossSalary)}</Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small" title="Khấu trừ" style={{ background: '#fff1f0' }}>
            <Table 
              columns={columns} 
              dataSource={deductionItems} 
              pagination={false} 
              size="small"
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell><Text strong>Tổng khấu trừ</Text></Table.Summary.Cell>
                  <Table.Summary.Cell align="right">
                    <Text strong style={{ color: '#cf1322' }}>{formatCurrency(salary.totalDeduction)}</Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Net Salary */}
      <Card style={{ marginTop: 16, background: '#e6f7ff', border: '2px solid #1890ff' }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={4} style={{ margin: 0 }}>THỰC LĨNH</Title>
            {salary.paidDate && <Text type="secondary">Đã trả ngày: {salary.paidDate}</Text>}
          </Col>
          <Col>
            <Title level={2} style={{ margin: 0, color: '#52c41a' }}>
              {formatCurrency(salary.netSalary)}
            </Title>
          </Col>
        </Row>
      </Card>

      {salary.note && (
        <Card size="small" style={{ marginTop: 16 }}>
          <Text type="secondary">Ghi chú:</Text> {salary.note}
        </Card>
      )}
    </Modal>
  );
};

export default SalaryDetailModal;
