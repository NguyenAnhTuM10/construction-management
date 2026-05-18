import { Modal, Descriptions, Tag, Space, Button, Typography, Divider, Card, Row, Col, Table } from 'antd';
import { PrinterOutlined, DollarOutlined, CalendarOutlined, UserOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { formatCurrency } from '../../utils/formatters';

const { Title, Text } = Typography;

const SalaryDetailModal = ({ visible, salary, onCancel }) => {
  if (!salary) return null;

  // Tính toán display values
  const grossSalary = (salary.baseSalary || 0) + (salary.bonus || 0) + (salary.allowance || 0) + (salary.overtimePay || 0);
  
  // Income items
  const incomeItems = [
    { key: '1', item: 'Lương cơ bản', amount: salary.baseSalary || 0 },
    { key: '2', item: 'Thưởng (KPI + Doanh số)', amount: salary.bonus || 0 },
    { key: '3', item: 'Phụ cấp', amount: salary.allowance || 0 },
    { key: '4', item: `Lương tăng ca (${salary.overtimeHours || 0}h)`, amount: salary.overtimePay || 0 },
  ].filter(item => item.amount > 0);

  // Deduction items
  const deductionItems = [
    { key: '1', item: 'BHXH, BHYT, Thuế, Phạt...', amount: salary.deduction || 0 },
  ].filter(item => item.amount > 0);

  const columns = [
    { title: 'Khoản mục', dataIndex: 'item', key: 'item' },
    { 
      title: 'Số tiền', 
      dataIndex: 'amount', 
      key: 'amount', 
      align: 'right',
      render: (amount) => <Text strong>{formatCurrency(amount || 0)}</Text>
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <DollarOutlined style={{ color: '#52c41a' }} />
          <span>Chi tiết bảng lương</span>
          <Tag color="blue">T{salary.month}/{salary.year}</Tag>
          {salary.isPaid 
            ? <Tag color="success" icon={<CheckCircleOutlined />}>Đã trả</Tag>
            : <Tag color="warning" icon={<ClockCircleOutlined />}>Chưa trả</Tag>
          }
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={700}
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
                {salary.departmentName ? <Tag color="blue">{salary.departmentName}</Tag> : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col span={12}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label={<><CalendarOutlined /> Kỳ lương</>}>
                Tháng {salary.month}/{salary.year}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày công">
                <Tag color={(salary.actualWorkDays || 0) >= (salary.workDays || 22) ? 'green' : 'orange'}>
                  {salary.actualWorkDays || 0}/{salary.workDays || 22} ngày
                </Tag>
                {(salary.leaveDays || 0) > 0 && (
                  <Text type="secondary"> (nghỉ {salary.leaveDays} ngày)</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Tăng ca">
                {salary.overtimeHours || 0} giờ
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </Card>

      {/* Income & Deductions */}
      <Row gutter={16}>
        <Col span={12}>
          <Card size="small" title="Thu nhập" style={{ background: '#f6ffed', height: '100%' }}>
            <Table 
              columns={columns} 
              dataSource={incomeItems} 
              pagination={false} 
              size="small"
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell><Text strong>Tổng thu nhập</Text></Table.Summary.Cell>
                  <Table.Summary.Cell align="right">
                    <Text strong style={{ color: '#52c41a' }}>{formatCurrency(grossSalary)}</Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small" title="Khấu trừ" style={{ background: '#fff1f0', height: '100%' }}>
            <Table 
              columns={columns} 
              dataSource={deductionItems} 
              pagination={false} 
              size="small"
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell><Text strong>Tổng khấu trừ</Text></Table.Summary.Cell>
                  <Table.Summary.Cell align="right">
                    <Text strong style={{ color: '#cf1322' }}>{formatCurrency(salary.deduction || 0)}</Text>
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
            {salary.isPaid && salary.paidDate && (
              <Text type="secondary">Đã trả ngày: {salary.paidDate}</Text>
            )}
          </Col>
          <Col>
            <Title level={2} style={{ margin: 0, color: '#52c41a' }}>
              {formatCurrency(salary.totalSalary || 0)}
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