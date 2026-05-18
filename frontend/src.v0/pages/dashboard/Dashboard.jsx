import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Typography, Tag, message, Empty } from 'antd';
import {
  DollarOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  ShoppingOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RiseOutlined
} from '@ant-design/icons';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend 
} from 'recharts';
import { useAuth } from '../../hooks/useAuth';
import { usePermission } from '../../hooks/usePermission';
import { dashboardApi } from '../../api';
import { PageHeader, Loading, StatusTag } from '../../components/common';
import { formatCurrency, formatNumber } from '../../utils/formatters';

const { Title, Text } = Typography;

const Dashboard = () => {
  const { user } = useAuth();
  const { isAdmin, isAccountant, isSale } = usePermission();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardApi.getSummary();
      setData(response.data);
    } catch (error) {
      console.error('Dashboard error:', error);
      // Nếu API lỗi, dùng data mẫu
      setData(getSampleData());
    } finally {
      setLoading(false);
    }
  };

  // Data mẫu khi API chưa ready
  const getSampleData = () => ({
    totalRevenue: 150000000,
    monthlyRevenue: 45000000,
    totalOrders: 256,
    pendingOrders: 12,
    completedOrders: 230,
    cancelledOrders: 14,
    totalCustomers: 89,
    totalCustomerDebt: 25000000,
    totalProducts: 150,
    lowStockProducts: 8,
    outOfStockProducts: 3,
    totalEmployees: 15,
    activeTasks: 24,
    overdueTasks: 5,
    completedTasks: 180,
    totalUnpaidSalary: 35000000,
    unpaidSalaryCount: 5
  });

  // Data mẫu cho biểu đồ doanh thu
  const revenueChartData = [
    { month: 'T1', revenue: 12000000 },
    { month: 'T2', revenue: 15000000 },
    { month: 'T3', revenue: 18000000 },
    { month: 'T4', revenue: 22000000 },
    { month: 'T5', revenue: 19000000 },
    { month: 'T6', revenue: 25000000 },
    { month: 'T7', revenue: 28000000 },
    { month: 'T8', revenue: 32000000 },
    { month: 'T9', revenue: 30000000 },
    { month: 'T10', revenue: 35000000 },
    { month: 'T11', revenue: 38000000 },
    { month: 'T12', revenue: 45000000 },
  ];

  // Data mẫu cho top sản phẩm
  const topProductsData = [
    { name: 'Xi măng PCB40', quantity: 1250 },
    { name: 'Cát xây dựng', quantity: 980 },
    { name: 'Gạch ống', quantity: 856 },
    { name: 'Thép phi 12', quantity: 720 },
    { name: 'Đá 1x2', quantity: 650 },
  ];

  if (loading) {
    return <Loading tip="Đang tải dữ liệu..." />;
  }

  const dashboardData = data || getSampleData();

  // Stat Cards Component
  const StatCard = ({ title, value, icon, color, prefix, suffix }) => (
    <Card hoverable>
      <Statistic
        title={title}
        value={value}
        prefix={icon}
        suffix={suffix}
        valueStyle={{ color }}
      />
    </Card>
  );

  return (
    <div>
      <PageHeader 
        title={`Xin chào, ${user?.username || 'User'}!`}
        subtitle="Tổng quan hệ thống quản lý vật liệu xây dựng"
      />

      {/* Row 1: Thống kê chính */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Doanh thu tháng này"
              value={dashboardData.monthlyRevenue}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#3f8600' }}
              formatter={(value) => formatCurrency(value, '')}
              suffix="đ"
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Tổng đơn hàng"
              value={dashboardData.totalOrders}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 8 }}>
              <Tag color="orange">{dashboardData.pendingOrders} chờ xử lý</Tag>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Khách hàng"
              value={dashboardData.totalCustomers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">
                Công nợ: {formatCurrency(dashboardData.totalCustomerDebt)}
              </Text>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Sản phẩm"
              value={dashboardData.totalProducts}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
            <div style={{ marginTop: 8 }}>
              {dashboardData.lowStockProducts > 0 && (
                <Tag color="warning" icon={<WarningOutlined />}>
                  {dashboardData.lowStockProducts} sắp hết
                </Tag>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Row 2: Biểu đồ */}
      {(isAdmin() || isAccountant()) && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={16}>
            <Card title="Doanh thu theo tháng" extra={<RiseOutlined />}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis 
                    tickFormatter={(value) => `${(value / 1000000).toFixed(0)}tr`}
                  />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), 'Doanh thu']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#1890ff" 
                    strokeWidth={2}
                    dot={{ fill: '#1890ff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          
          <Col xs={24} lg={8}>
            <Card title="Top 5 sản phẩm bán chạy">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProductsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Bar dataKey="quantity" fill="#52c41a" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      )}

      {/* Row 3: Thống kê phụ */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {isAdmin() && (
          <>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Nhân viên"
                  value={dashboardData.totalEmployees}
                  prefix={<TeamOutlined />}
                />
              </Card>
            </Col>
            
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Công việc đang làm"
                  value={dashboardData.activeTasks}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
                {dashboardData.overdueTasks > 0 && (
                  <Tag color="error" style={{ marginTop: 8 }}>
                    {dashboardData.overdueTasks} quá hạn
                  </Tag>
                )}
              </Card>
            </Col>
          </>
        )}
        
        {(isAdmin() || isAccountant()) && (
          <>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Đơn hoàn thành"
                  value={dashboardData.completedOrders}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Lương chưa thanh toán"
                  value={dashboardData.totalUnpaidSalary}
                  formatter={(value) => formatCurrency(value, '')}
                  suffix="đ"
                  valueStyle={{ color: '#faad14' }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {dashboardData.unpaidSalaryCount} bản ghi
                </Text>
              </Card>
            </Col>
          </>
        )}
      </Row>

      {/* Row 4: Quick Info cho Sale */}
      {isSale() && (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card title="Thông tin nhanh">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Statistic
                    title="Đơn hàng của tôi"
                    value={15}
                    prefix={<ShoppingCartOutlined />}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Statistic
                    title="Công việc được giao"
                    value={3}
                    prefix={<ClockCircleOutlined />}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Statistic
                    title="Doanh số tháng này"
                    value={25000000}
                    formatter={(value) => formatCurrency(value, '')}
                    suffix="đ"
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default Dashboard;
