import { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Statistic, DatePicker, Select, Table, 
  Typography, Space, Button, Segmented
} from 'antd';
import { 
  DollarOutlined, RiseOutlined, FallOutlined, 
  BarChartOutlined, LineChartOutlined, FileExcelOutlined,
  PrinterOutlined, ArrowUpOutlined, ArrowDownOutlined
} from '@ant-design/icons';
import { PageHeader, Loading } from '../../components/common';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// ===================== MOCK DATA =====================
const generateMonthlyData = () => {
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const date = dayjs().subtract(i, 'month');
    const revenue = Math.floor(Math.random() * 500000000) + 300000000;
    const cost = Math.floor(revenue * (0.65 + Math.random() * 0.1));
    const orders = Math.floor(Math.random() * 50) + 30;
    months.push({
      key: date.format('YYYY-MM'),
      month: date.format('MM/YYYY'),
      revenue,
      cost,
      profit: revenue - cost,
      profitMargin: ((revenue - cost) / revenue * 100).toFixed(1),
      orders,
      avgOrderValue: Math.floor(revenue / orders)
    });
  }
  return months;
};

const generateDailyData = () => {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const date = dayjs().subtract(i, 'day');
    const revenue = Math.floor(Math.random() * 30000000) + 10000000;
    const orders = Math.floor(Math.random() * 8) + 2;
    days.push({
      key: date.format('YYYY-MM-DD'),
      date: date.format('DD/MM/YYYY'),
      dayOfWeek: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.day()],
      revenue,
      orders,
      avgOrderValue: Math.floor(revenue / orders)
    });
  }
  return days;
};

const MOCK_TOP_CUSTOMERS = [
  { id: 1, name: 'Công ty TNHH Xây dựng Phú Thịnh', revenue: 245000000, orders: 12, percentage: 18.5 },
  { id: 2, name: 'Công ty CP Đầu tư BĐS Hoàng Gia', revenue: 198000000, orders: 8, percentage: 14.9 },
  { id: 3, name: 'Công ty Xây dựng Minh Đức', revenue: 156000000, orders: 15, percentage: 11.8 },
  { id: 4, name: 'Cửa hàng VLXD Thành Công', revenue: 134000000, orders: 22, percentage: 10.1 },
  { id: 5, name: 'Nhà thầu Nguyễn Văn Hùng', revenue: 98000000, orders: 18, percentage: 7.4 },
];

const MOCK_TOP_PRODUCTS = [
  { id: 1, name: 'Xi măng Hà Tiên PCB40', quantity: 2500, revenue: 237500000, percentage: 15.2 },
  { id: 2, name: 'Thép phi 10', quantity: 1800, revenue: 261000000, percentage: 16.7 },
  { id: 3, name: 'Gạch ống 4 lỗ', quantity: 45000, revenue: 54000000, percentage: 3.5 },
  { id: 4, name: 'Cát vàng loại 1', quantity: 320, revenue: 70400000, percentage: 4.5 },
  { id: 5, name: 'Thép phi 12', quantity: 1200, revenue: 180000000, percentage: 11.5 },
];
// =====================================================

const RevenueReport = () => {
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('month');
  const [monthlyData, setMonthlyData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [dateRange, setDateRange] = useState([dayjs().subtract(11, 'month'), dayjs()]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    setTimeout(() => {
      setMonthlyData(generateMonthlyData());
      setDailyData(generateDailyData());
      setLoading(false);
    }, 500);
  };

  // Calculate summary
  const currentMonth = monthlyData[monthlyData.length - 1] || {};
  const previousMonth = monthlyData[monthlyData.length - 2] || {};
  const revenueGrowth = previousMonth.revenue 
    ? ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue * 100).toFixed(1)
    : 0;

  const totalRevenue = monthlyData.reduce((sum, m) => sum + m.revenue, 0);
  const totalProfit = monthlyData.reduce((sum, m) => sum + m.profit, 0);
  const totalOrders = monthlyData.reduce((sum, m) => sum + m.orders, 0);
  const avgMonthlyRevenue = monthlyData.length > 0 ? Math.floor(totalRevenue / monthlyData.length) : 0;

  // Table columns for monthly data
  const monthlyColumns = [
    { title: 'Tháng', dataIndex: 'month', key: 'month', width: 100 },
    { 
      title: 'Doanh thu', dataIndex: 'revenue', key: 'revenue', width: 150, align: 'right',
      render: (v) => <Text strong style={{ color: '#1890ff' }}>{formatCurrency(v)}</Text>,
      sorter: (a, b) => a.revenue - b.revenue
    },
    { 
      title: 'Chi phí vốn', dataIndex: 'cost', key: 'cost', width: 150, align: 'right',
      render: (v) => formatCurrency(v)
    },
    { 
      title: 'Lợi nhuận gộp', dataIndex: 'profit', key: 'profit', width: 150, align: 'right',
      render: (v) => <Text style={{ color: v > 0 ? '#52c41a' : '#cf1322' }}>{formatCurrency(v)}</Text>,
      sorter: (a, b) => a.profit - b.profit
    },
    { 
      title: 'Biên LN', dataIndex: 'profitMargin', key: 'profitMargin', width: 100, align: 'center',
      render: (v) => <Text style={{ color: v > 25 ? '#52c41a' : v > 15 ? '#1890ff' : '#faad14' }}>{v}%</Text>
    },
    { 
      title: 'Số đơn', dataIndex: 'orders', key: 'orders', width: 80, align: 'center',
      render: (v) => formatNumber(v)
    },
    { 
      title: 'TB/đơn', dataIndex: 'avgOrderValue', key: 'avgOrderValue', width: 130, align: 'right',
      render: (v) => formatCurrency(v)
    },
  ];

  // Table columns for daily data
  const dailyColumns = [
    { title: 'Ngày', dataIndex: 'date', key: 'date', width: 100 },
    { title: 'Thứ', dataIndex: 'dayOfWeek', key: 'dayOfWeek', width: 60, align: 'center' },
    { 
      title: 'Doanh thu', dataIndex: 'revenue', key: 'revenue', width: 150, align: 'right',
      render: (v) => <Text strong style={{ color: '#1890ff' }}>{formatCurrency(v)}</Text>,
      sorter: (a, b) => a.revenue - b.revenue
    },
    { 
      title: 'Số đơn', dataIndex: 'orders', key: 'orders', width: 80, align: 'center'
    },
    { 
      title: 'TB/đơn', dataIndex: 'avgOrderValue', key: 'avgOrderValue', width: 130, align: 'right',
      render: (v) => formatCurrency(v)
    },
  ];

  // Top customers columns
  const customerColumns = [
    { title: '#', key: 'rank', width: 50, render: (_, __, idx) => idx + 1 },
    { title: 'Khách hàng', dataIndex: 'name', key: 'name', ellipsis: true },
    { title: 'Doanh thu', dataIndex: 'revenue', key: 'revenue', width: 140, align: 'right', render: (v) => formatCurrency(v) },
    { title: 'Số đơn', dataIndex: 'orders', key: 'orders', width: 80, align: 'center' },
    { title: 'Tỷ trọng', dataIndex: 'percentage', key: 'percentage', width: 80, align: 'center', render: (v) => `${v}%` },
  ];

  // Top products columns
  const productColumns = [
    { title: '#', key: 'rank', width: 50, render: (_, __, idx) => idx + 1 },
    { title: 'Sản phẩm', dataIndex: 'name', key: 'name', ellipsis: true },
    { title: 'SL bán', dataIndex: 'quantity', key: 'quantity', width: 90, align: 'right', render: (v) => formatNumber(v) },
    { title: 'Doanh thu', dataIndex: 'revenue', key: 'revenue', width: 140, align: 'right', render: (v) => formatCurrency(v) },
    { title: 'Tỷ trọng', dataIndex: 'percentage', key: 'percentage', width: 80, align: 'center', render: (v) => `${v}%` },
  ];

  if (loading) return <Loading tip="Đang tải báo cáo doanh thu..." />;

  return (
    <div>
      <PageHeader
        title="Báo cáo doanh thu"
        subtitle="Thống kê và phân tích doanh thu bán hàng"
        breadcrumbs={[{ title: 'Báo cáo' }, { title: 'Doanh thu' }]}
        extra={
          <Space>
            <Button icon={<FileExcelOutlined />}>Xuất Excel</Button>
            <Button icon={<PrinterOutlined />}>In báo cáo</Button>
          </Space>
        }
      />

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="Doanh thu tháng này"
              value={currentMonth.revenue || 0}
              formatter={(v) => formatCurrency(v)}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 8 }}>
              {revenueGrowth >= 0 ? (
                <Text style={{ color: '#52c41a' }}><ArrowUpOutlined /> +{revenueGrowth}% vs tháng trước</Text>
              ) : (
                <Text style={{ color: '#cf1322' }}><ArrowDownOutlined /> {revenueGrowth}% vs tháng trước</Text>
              )}
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="Lợi nhuận tháng này"
              value={currentMonth.profit || 0}
              formatter={(v) => formatCurrency(v)}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">Biên LN: {currentMonth.profitMargin || 0}%</Text>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="Tổng doanh thu năm"
              value={totalRevenue}
              formatter={(v) => formatCurrency(v)}
              valueStyle={{ color: '#722ed1', fontSize: 20 }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">TB/tháng: {formatCurrency(avgMonthlyRevenue)}</Text>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="Tổng đơn hàng"
              value={totalOrders}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">TB/đơn: {formatCurrency(Math.floor(totalRevenue / totalOrders))}</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <RangePicker 
            picker="month"
            value={dateRange}
            onChange={setDateRange}
            format="MM/YYYY"
          />
          <Segmented
            options={[
              { label: 'Theo tháng', value: 'month', icon: <BarChartOutlined /> },
              { label: 'Theo ngày', value: 'day', icon: <LineChartOutlined /> },
            ]}
            value={viewMode}
            onChange={setViewMode}
          />
        </Space>
      </Card>

      {/* Data Table */}
      <Card title={viewMode === 'month' ? 'Doanh thu theo tháng' : 'Doanh thu theo ngày'} style={{ marginBottom: 24 }}>
        <Table
          columns={viewMode === 'month' ? monthlyColumns : dailyColumns}
          dataSource={viewMode === 'month' ? monthlyData : dailyData}
          rowKey="key"
          pagination={{ pageSize: viewMode === 'month' ? 12 : 15 }}
          scroll={{ x: 800 }}
          summary={(pageData) => {
            const totalRev = pageData.reduce((sum, r) => sum + r.revenue, 0);
            const totalOrd = pageData.reduce((sum, r) => sum + r.orders, 0);
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={viewMode === 'month' ? 1 : 2}><Text strong>Tổng</Text></Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <Text strong style={{ color: '#1890ff' }}>{formatCurrency(totalRev)}</Text>
                </Table.Summary.Cell>
                {viewMode === 'month' && (
                  <>
                    <Table.Summary.Cell index={2} align="right">
                      <Text strong>{formatCurrency(pageData.reduce((s, r) => s + r.cost, 0))}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="right">
                      <Text strong style={{ color: '#52c41a' }}>{formatCurrency(pageData.reduce((s, r) => s + r.profit, 0))}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4} />
                  </>
                )}
                <Table.Summary.Cell index={5} align="center"><Text strong>{formatNumber(totalOrd)}</Text></Table.Summary.Cell>
                <Table.Summary.Cell index={6} align="right">
                  <Text strong>{formatCurrency(Math.floor(totalRev / totalOrd))}</Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            );
          }}
        />
      </Card>

      {/* Top Customers & Products */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Top 5 khách hàng" extra={<Text type="secondary">Theo doanh thu</Text>}>
            <Table
              columns={customerColumns}
              dataSource={MOCK_TOP_CUSTOMERS}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Top 5 sản phẩm" extra={<Text type="secondary">Theo doanh thu</Text>}>
            <Table
              columns={productColumns}
              dataSource={MOCK_TOP_PRODUCTS}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default RevenueReport;
