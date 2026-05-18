import { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Statistic, Table, Typography, Space, 
  Button, Tag, Tabs, Progress, Alert
} from 'antd';
import { 
  DollarOutlined, UserOutlined, ShopOutlined,
  WarningOutlined, FileExcelOutlined, PrinterOutlined,
  PhoneOutlined
} from '@ant-design/icons';
import { PageHeader, Loading } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils/formatters';

const { Text, Title } = Typography;

// ===================== MOCK DATA =====================
const MOCK_CUSTOMER_DEBT = [
  { 
    id: 1, name: 'Công ty TNHH Xây dựng Phú Thịnh', phone: '0901234567',
    totalDebt: 85000000, overdue: 25000000, lastOrderDate: '2024-12-20',
    daysSinceOrder: 8, creditLimit: 100000000, orders: 5
  },
  { 
    id: 2, name: 'Công ty CP Đầu tư BĐS Hoàng Gia', phone: '0912345678',
    totalDebt: 120000000, overdue: 0, lastOrderDate: '2024-12-25',
    daysSinceOrder: 3, creditLimit: 200000000, orders: 3
  },
  { 
    id: 3, name: 'Công ty Xây dựng Minh Đức', phone: '0923456789',
    totalDebt: 45000000, overdue: 45000000, lastOrderDate: '2024-11-15',
    daysSinceOrder: 43, creditLimit: 50000000, orders: 8
  },
  { 
    id: 4, name: 'Cửa hàng VLXD Thành Công', phone: '0934567890',
    totalDebt: 28000000, overdue: 0, lastOrderDate: '2024-12-22',
    daysSinceOrder: 6, creditLimit: 50000000, orders: 12
  },
  { 
    id: 5, name: 'Nhà thầu Nguyễn Văn Hùng', phone: '0945678901',
    totalDebt: 65000000, overdue: 30000000, lastOrderDate: '2024-12-01',
    daysSinceOrder: 27, creditLimit: 80000000, orders: 6
  },
  { 
    id: 6, name: 'Công ty XD Tân Phát', phone: '0956789012',
    totalDebt: 92000000, overdue: 50000000, lastOrderDate: '2024-11-20',
    daysSinceOrder: 38, creditLimit: 100000000, orders: 4
  },
  { 
    id: 7, name: 'Đại lý VLXD Bình Minh', phone: '0967890123',
    totalDebt: 15000000, overdue: 0, lastOrderDate: '2024-12-26',
    daysSinceOrder: 2, creditLimit: 30000000, orders: 15
  },
];

const MOCK_SUPPLIER_DEBT = [
  { 
    id: 1, name: 'Công ty TNHH Xi măng Hà Tiên', phone: '0283456789',
    totalDebt: 0, lastPurchaseDate: '2024-12-20', daysSincePurchase: 8
  },
  { 
    id: 2, name: 'Công ty CP Thép Việt Nhật', phone: '0287654321',
    totalDebt: 125000000, lastPurchaseDate: '2024-12-18', daysSincePurchase: 10
  },
  { 
    id: 3, name: 'Cơ sở VLXD Phú Thành', phone: '0901234567',
    totalDebt: 35000000, lastPurchaseDate: '2024-12-15', daysSincePurchase: 13
  },
  { 
    id: 4, name: 'Đại lý Gạch Đồng Tâm', phone: '0912345678',
    totalDebt: 48000000, lastPurchaseDate: '2024-12-10', daysSincePurchase: 18
  },
  { 
    id: 5, name: 'Mỏ Cát Tân Uyên', phone: '0274123456',
    totalDebt: 22000000, lastPurchaseDate: '2024-12-22', daysSincePurchase: 6
  },
];

const DEBT_AGING = [
  { period: '0-30 ngày', amount: 280000000, percentage: 56 },
  { period: '31-60 ngày', amount: 120000000, percentage: 24 },
  { period: '61-90 ngày', amount: 65000000, percentage: 13 },
  { period: 'Trên 90 ngày', amount: 35000000, percentage: 7 },
];
// =====================================================

const DebtReport = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('customer');

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  // Calculate summary
  const customerStats = {
    total: MOCK_CUSTOMER_DEBT.reduce((sum, c) => sum + c.totalDebt, 0),
    overdue: MOCK_CUSTOMER_DEBT.reduce((sum, c) => sum + c.overdue, 0),
    count: MOCK_CUSTOMER_DEBT.filter(c => c.totalDebt > 0).length,
    overdueCount: MOCK_CUSTOMER_DEBT.filter(c => c.overdue > 0).length,
  };

  const supplierStats = {
    total: MOCK_SUPPLIER_DEBT.reduce((sum, s) => sum + s.totalDebt, 0),
    count: MOCK_SUPPLIER_DEBT.filter(s => s.totalDebt > 0).length,
  };

  // Get debt status
  const getDebtStatus = (customer) => {
    if (customer.overdue > 0 && customer.daysSinceOrder > 30) return { color: 'red', text: 'Quá hạn lâu' };
    if (customer.overdue > 0) return { color: 'orange', text: 'Có nợ quá hạn' };
    if (customer.totalDebt > customer.creditLimit * 0.8) return { color: 'gold', text: 'Gần hạn mức' };
    return { color: 'green', text: 'Bình thường' };
  };

  // Customer debt columns
  const customerColumns = [
    { 
      title: 'Khách hàng', dataIndex: 'name', key: 'name', width: 220,
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Space size={4}>
            <PhoneOutlined style={{ fontSize: 11, color: '#666' }} />
            <Text type="secondary" style={{ fontSize: 11 }}>{record.phone}</Text>
          </Space>
        </div>
      )
    },
    { 
      title: 'Tổng nợ', dataIndex: 'totalDebt', key: 'totalDebt', width: 140, align: 'right',
      render: (v) => <Text strong style={{ color: v > 0 ? '#cf1322' : '#52c41a' }}>{formatCurrency(v)}</Text>,
      sorter: (a, b) => a.totalDebt - b.totalDebt,
      defaultSortOrder: 'descend'
    },
    { 
      title: 'Nợ quá hạn', dataIndex: 'overdue', key: 'overdue', width: 130, align: 'right',
      render: (v) => v > 0 ? <Text style={{ color: '#cf1322' }}>{formatCurrency(v)}</Text> : '-'
    },
    { 
      title: 'Hạn mức', key: 'creditUsage', width: 150,
      render: (_, record) => {
        const usage = Math.round(record.totalDebt / record.creditLimit * 100);
        return (
          <div>
            <Progress 
              percent={Math.min(usage, 100)} 
              size="small" 
              status={usage > 90 ? 'exception' : usage > 70 ? 'active' : 'success'}
              format={() => `${usage}%`}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {formatCurrency(record.totalDebt)}/{formatCurrency(record.creditLimit)}
            </Text>
          </div>
        );
      }
    },
    { 
      title: 'Đơn cuối', dataIndex: 'lastOrderDate', key: 'lastOrderDate', width: 100,
      render: (date, record) => (
        <div>
          <Text>{formatDate(date)}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>{record.daysSinceOrder} ngày trước</Text>
        </div>
      )
    },
    { 
      title: 'Trạng thái', key: 'status', width: 120,
      render: (_, record) => {
        const status = getDebtStatus(record);
        return <Tag color={status.color}>{status.text}</Tag>;
      }
    },
    {
      title: '', key: 'action', width: 80,
      render: (_, record) => (
        <Button size="small" icon={<PhoneOutlined />}>
          Liên hệ
        </Button>
      )
    }
  ];

  // Supplier debt columns
  const supplierColumns = [
    { 
      title: 'Nhà cung cấp', dataIndex: 'name', key: 'name', width: 250,
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Space size={4}>
            <PhoneOutlined style={{ fontSize: 11, color: '#666' }} />
            <Text type="secondary" style={{ fontSize: 11 }}>{record.phone}</Text>
          </Space>
        </div>
      )
    },
    { 
      title: 'Công nợ phải trả', dataIndex: 'totalDebt', key: 'totalDebt', width: 150, align: 'right',
      render: (v) => <Text strong style={{ color: v > 0 ? '#cf1322' : '#52c41a' }}>{formatCurrency(v)}</Text>,
      sorter: (a, b) => a.totalDebt - b.totalDebt,
      defaultSortOrder: 'descend'
    },
    { 
      title: 'Nhập hàng gần nhất', dataIndex: 'lastPurchaseDate', key: 'lastPurchaseDate', width: 150,
      render: (date, record) => (
        <div>
          <Text>{formatDate(date)}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>{record.daysSincePurchase} ngày trước</Text>
        </div>
      )
    },
    { 
      title: 'Trạng thái', key: 'status', width: 120,
      render: (_, record) => (
        <Tag color={record.totalDebt === 0 ? 'green' : record.daysSincePurchase > 30 ? 'orange' : 'blue'}>
          {record.totalDebt === 0 ? 'Đã thanh toán' : record.daysSincePurchase > 30 ? 'Cần thanh toán' : 'Trong hạn'}
        </Tag>
      )
    },
  ];

  // Aging columns
  const agingColumns = [
    { title: 'Kỳ hạn', dataIndex: 'period', key: 'period' },
    { 
      title: 'Số tiền', dataIndex: 'amount', key: 'amount', align: 'right',
      render: (v) => <Text strong>{formatCurrency(v)}</Text>
    },
    { 
      title: 'Tỷ trọng', dataIndex: 'percentage', key: 'percentage', width: 200,
      render: (v, record) => (
        <Progress 
          percent={v} 
          strokeColor={record.period.includes('90') ? '#cf1322' : record.period.includes('60') ? '#faad14' : '#1890ff'}
        />
      )
    },
  ];

  if (loading) return <Loading tip="Đang tải báo cáo công nợ..." />;

  return (
    <div>
      <PageHeader
        title="Báo cáo công nợ"
        subtitle="Theo dõi công nợ khách hàng và nhà cung cấp"
        breadcrumbs={[{ title: 'Báo cáo' }, { title: 'Công nợ' }]}
        extra={
          <Space>
            <Button icon={<FileExcelOutlined />}>Xuất Excel</Button>
            <Button icon={<PrinterOutlined />}>In báo cáo</Button>
          </Space>
        }
      />

      {/* Alert for overdue */}
      {customerStats.overdueCount > 0 && (
        <Alert
          message={`Có ${customerStats.overdueCount} khách hàng nợ quá hạn với tổng số tiền ${formatCurrency(customerStats.overdue)}`}
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" type="primary" danger>
              Xem chi tiết
            </Button>
          }
        />
      )}

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title={<><UserOutlined /> Phải thu khách hàng</>}
              value={customerStats.total}
              formatter={(v) => formatCurrency(v)}
              valueStyle={{ color: '#cf1322' }}
            />
            <Text type="secondary">{customerStats.count} khách hàng</Text>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="Nợ quá hạn"
              value={customerStats.overdue}
              formatter={(v) => formatCurrency(v)}
              valueStyle={{ color: '#cf1322' }}
            />
            <Text type="secondary">{customerStats.overdueCount} khách hàng</Text>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title={<><ShopOutlined /> Phải trả NCC</>}
              value={supplierStats.total}
              formatter={(v) => formatCurrency(v)}
              valueStyle={{ color: '#722ed1' }}
            />
            <Text type="secondary">{supplierStats.count} nhà cung cấp</Text>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="Cân đối công nợ"
              value={customerStats.total - supplierStats.total}
              formatter={(v) => formatCurrency(Math.abs(v))}
              prefix={customerStats.total > supplierStats.total ? '+' : '-'}
              valueStyle={{ color: customerStats.total > supplierStats.total ? '#52c41a' : '#cf1322' }}
            />
            <Text type="secondary">Phải thu - Phải trả</Text>
          </Card>
        </Col>
      </Row>

      {/* Debt Aging */}
      <Card title="Phân tích tuổi nợ khách hàng" style={{ marginBottom: 24 }}>
        <Table
          columns={agingColumns}
          dataSource={DEBT_AGING}
          rowKey="period"
          pagination={false}
          size="small"
        />
      </Card>

      {/* Tabs */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'customer',
              label: <><UserOutlined /> Công nợ khách hàng ({customerStats.count})</>,
              children: (
                <Table
                  columns={customerColumns}
                  dataSource={MOCK_CUSTOMER_DEBT}
                  rowKey="id"
                  scroll={{ x: 1100 }}
                  pagination={{ pageSize: 10 }}
                  summary={() => (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0}><Text strong>Tổng cộng</Text></Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <Text strong style={{ color: '#cf1322' }}>{formatCurrency(customerStats.total)}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} align="right">
                        <Text strong style={{ color: '#cf1322' }}>{formatCurrency(customerStats.overdue)}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3} colSpan={4} />
                    </Table.Summary.Row>
                  )}
                />
              )
            },
            {
              key: 'supplier',
              label: <><ShopOutlined /> Công nợ nhà cung cấp ({supplierStats.count})</>,
              children: (
                <Table
                  columns={supplierColumns}
                  dataSource={MOCK_SUPPLIER_DEBT}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  summary={() => (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0}><Text strong>Tổng cộng</Text></Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <Text strong style={{ color: '#cf1322' }}>{formatCurrency(supplierStats.total)}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} colSpan={2} />
                    </Table.Summary.Row>
                  )}
                />
              )
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default DebtReport;
