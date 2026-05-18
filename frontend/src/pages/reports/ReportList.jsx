import { useState } from 'react';
import { Card, Row, Col, Typography, Space, Button } from 'antd';
import { 
  BarChartOutlined, LineChartOutlined, PieChartOutlined,
  DollarOutlined, ShoppingCartOutlined, TeamOutlined,
  InboxOutlined, FileTextOutlined, RiseOutlined,
  WalletOutlined, ShopOutlined, CalendarOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common';

const { Title, Text } = Typography;

const REPORT_CATEGORIES = [
  {
    key: 'sales',
    title: 'Báo cáo bán hàng',
    icon: <ShoppingCartOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
    color: '#e6f7ff',
    borderColor: '#1890ff',
    reports: [
      { key: 'revenue', title: 'Doanh thu', description: 'Thống kê doanh thu theo thời gian', path: '/reports/revenue' },
      { key: 'orders', title: 'Đơn hàng', description: 'Phân tích đơn hàng, tỷ lệ hoàn thành', path: '/reports/orders' },
      { key: 'products', title: 'Sản phẩm bán chạy', description: 'Top sản phẩm theo doanh số', path: '/reports/top-products' },
    ]
  },
  {
    key: 'finance',
    title: 'Báo cáo tài chính',
    icon: <DollarOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
    color: '#f6ffed',
    borderColor: '#52c41a',
    reports: [
      { key: 'debt', title: 'Công nợ', description: 'Công nợ khách hàng và nhà cung cấp', path: '/reports/debt' },
      { key: 'payment', title: 'Thu chi', description: 'Thống kê thu chi theo kỳ', path: '/reports/payment' },
      { key: 'profit', title: 'Lợi nhuận', description: 'Phân tích lợi nhuận gộp', path: '/reports/profit' },
    ]
  },
  {
    key: 'inventory',
    title: 'Báo cáo kho',
    icon: <InboxOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
    color: '#f9f0ff',
    borderColor: '#722ed1',
    reports: [
      { key: 'stock', title: 'Tồn kho', description: 'Tình trạng tồn kho hiện tại', path: '/reports/stock' },
      { key: 'import-export', title: 'Xuất nhập tồn', description: 'Báo cáo XNT theo kỳ', path: '/reports/import-export' },
      { key: 'slow-moving', title: 'Hàng tồn lâu', description: 'Sản phẩm chậm luân chuyển', path: '/reports/slow-moving' },
    ]
  },
  {
    key: 'hr',
    title: 'Báo cáo nhân sự',
    icon: <TeamOutlined style={{ fontSize: 32, color: '#eb2f96' }} />,
    color: '#fff0f6',
    borderColor: '#eb2f96',
    reports: [
      { key: 'salary', title: 'Bảng lương', description: 'Tổng hợp chi phí lương theo kỳ', path: '/reports/salary' },
      { key: 'kpi', title: 'KPI nhân viên', description: 'Đánh giá hiệu suất làm việc', path: '/reports/kpi' },
      { key: 'commission', title: 'Hoa hồng', description: 'Thống kê hoa hồng bán hàng', path: '/reports/commission' },
    ]
  },
];

const ReportList = () => {
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader
        title="Báo cáo & Thống kê"
        subtitle="Xem các báo cáo phân tích hoạt động kinh doanh"
        breadcrumbs={[{ title: 'Báo cáo' }, { title: 'Tổng quan' }]}
      />

      {/* Quick Access */}
      <Card style={{ marginBottom: 24 }}>
        <Title level={5} style={{ marginBottom: 16 }}>
          <RiseOutlined /> Truy cập nhanh
        </Title>
        <Space wrap>
          <Button type="primary" icon={<BarChartOutlined />} onClick={() => navigate('/reports/revenue')}>
            Doanh thu
          </Button>
          <Button icon={<WalletOutlined />} onClick={() => navigate('/reports/debt')}>
            Công nợ
          </Button>
          <Button icon={<InboxOutlined />} onClick={() => navigate('/reports/stock')}>
            Tồn kho
          </Button>
          <Button icon={<ShoppingCartOutlined />} onClick={() => navigate('/reports/orders')}>
            Đơn hàng
          </Button>
          <Button icon={<TeamOutlined />} onClick={() => navigate('/reports/kpi')}>
            KPI nhân viên
          </Button>
        </Space>
      </Card>

      {/* Report Categories */}
      <Row gutter={[24, 24]}>
        {REPORT_CATEGORIES.map(category => (
          <Col xs={24} lg={12} key={category.key}>
            <Card
              title={
                <Space>
                  {category.icon}
                  <span>{category.title}</span>
                </Space>
              }
              style={{ 
                background: category.color,
                borderColor: category.borderColor,
                height: '100%'
              }}
            >
              <Row gutter={[12, 12]}>
                {category.reports.map(report => (
                  <Col span={24} key={report.key}>
                    <Card
                      size="small"
                      hoverable
                      onClick={() => navigate(report.path)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Space>
                        <FileTextOutlined style={{ color: category.borderColor }} />
                        <div>
                          <Text strong>{report.title}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: 12 }}>{report.description}</Text>
                        </div>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default ReportList;
