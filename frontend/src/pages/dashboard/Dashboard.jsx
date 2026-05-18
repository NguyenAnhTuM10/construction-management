import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, message, Typography, Space } from 'antd';
import { DollarOutlined, ShoppingCartOutlined, UserOutlined, InboxOutlined, WarningOutlined, TeamOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { PageHeader, Loading } from '../../components/common';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import dashboardApi from '../../api/dashboardApi';
import orderApi from '../../api/orderApi';
import taskApi from '../../api/taskApi';

const { Title } = Typography;

const ORDER_STATUS = {
  PENDING: { label: 'Chờ xử lý', color: 'gold' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'blue' },
  PROCESSING: { label: 'Đang xử lý', color: 'processing' },
  SHIPPING: { label: 'Đang giao', color: 'cyan' },
  COMPLETED: { label: 'Hoàn thành', color: 'success' },
  CANCELLED: { label: 'Đã hủy', color: 'error' }
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, ordersRes, tasksRes] = await Promise.all([
        dashboardApi.getSummary(),
        orderApi.getAll(),
        taskApi.getOverdue().catch(() => ({ data: [] }))
      ]);
      setSummary(summaryRes.data || summaryRes || {});
      const ordersData = ordersRes.data || ordersRes || [];
      setRecentOrders(Array.isArray(ordersData) ? ordersData.slice(0, 5) : []);
      setOverdueTasks(Array.isArray(tasksRes.data || tasksRes) ? (tasksRes.data || tasksRes).slice(0, 5) : []);
    } catch (error) {
      console.error('Dashboard error:', error);
      message.error(error.message || 'Không thể tải dữ liệu dashboard');
    } finally { setLoading(false); }
  };

  const orderColumns = [
    { title: 'Mã', dataIndex: 'id', key: 'id', width: 70, render: (id) => <span style={{ color: '#1890ff' }}>#{id}</span> },
    { title: 'Khách hàng', dataIndex: 'customerName', key: 'customerName', ellipsis: true },
    { title: 'Tổng tiền', dataIndex: 'total', key: 'total', align: 'right', render: (v) => formatCurrency(v || 0) },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', 
      render: (status) => {
        const config = ORDER_STATUS[status] || { label: status, color: 'default' };
        return <Tag color={config.color}>{config.label}</Tag>;
      }
    },
    { title: 'Ngày tạo', dataIndex: 'createdDate', key: 'createdDate', render: (d) => formatDateTime(d) }
  ];

  const taskColumns = [
    { title: 'Công việc', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: 'Người thực hiện', dataIndex: 'assignedToName', key: 'assignedToName' },
    { title: 'Deadline', dataIndex: 'deadline', key: 'deadline', render: (d) => <span style={{ color: '#cf1322' }}>{formatDateTime(d)}</span> }
  ];

  if (loading) return <Loading tip="Đang tải dashboard..." />;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Tổng quan hệ thống quản lý vật liệu xây dựng" />

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} md={6}>
          <Card hoverable>
            <Statistic
              title="Doanh thu tháng"
              value={summary.monthlyRevenue || 0}
              prefix={<DollarOutlined />}
              formatter={(v) => formatCurrency(v)}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card hoverable>
            <Statistic
              title="Đơn hàng tháng"
              value={summary.monthlyOrders || 0}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card hoverable>
            <Statistic
              title="Khách hàng"
              value={summary.totalCustomers || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card hoverable>
            <Statistic
              title="Sản phẩm"
              value={summary.totalProducts || 0}
              prefix={<InboxOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Second row stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} md={6}>
          <Card hoverable>
            <Statistic
              title="Công nợ khách hàng"
              value={summary.totalDebt || 0}
              prefix={<WarningOutlined />}
              formatter={(v) => formatCurrency(v)}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card hoverable>
            <Statistic
              title="Sắp hết hàng"
              value={summary.lowStockProducts || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card hoverable>
            <Statistic
              title="Nhân viên"
              value={summary.totalEmployees || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card hoverable>
            <Statistic
              title="Đơn chờ xử lý"
              value={summary.pendingOrders || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tables */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="Đơn hàng gần đây" size="small">
            <Table
              columns={orderColumns}
              dataSource={recentOrders}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title={<span style={{ color: '#cf1322' }}>Công việc quá hạn</span>} size="small">
            {overdueTasks.length > 0 ? (
              <Table
                columns={taskColumns}
                dataSource={overdueTasks}
                rowKey="id"
                pagination={false}
                size="small"
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 20, color: '#52c41a' }}>
                <CheckCircleOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                <div>Không có công việc quá hạn</div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
