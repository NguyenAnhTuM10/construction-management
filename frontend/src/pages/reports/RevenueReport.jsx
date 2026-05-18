import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Select, Table, Space, Button, message } from 'antd';
import { DollarOutlined, ShoppingCartOutlined, UserOutlined, FileExcelOutlined } from '@ant-design/icons';
import { PageHeader, Loading } from '../../components/common';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import reportApi from '../../api/reportApi';
import dayjs from 'dayjs';

const RevenueReport = () => {
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(dayjs().year());
  const [month, setMonth] = useState(dayjs().month() + 1);
  const [monthlyData, setMonthlyData] = useState([]);
  const [revenueByProduct, setRevenueByProduct] = useState([]);
  const [revenueByEmployee, setRevenueByEmployee] = useState([]);
  const [summary, setSummary] = useState({});

  useEffect(() => { fetchData(); }, [year, month]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, monthlyRes, productRes, employeeRes] = await Promise.all([
        reportApi.getRevenue(year, month),
        reportApi.getMonthlyRevenue(year),
        reportApi.getRevenueByProduct(year, month),
        reportApi.getRevenueByEmployee(year, month)
      ]);
      
      setSummary(summaryRes.data || summaryRes || {});
      setMonthlyData(Array.isArray(monthlyRes.data || monthlyRes) ? (monthlyRes.data || monthlyRes) : []);
      setRevenueByProduct(Array.isArray(productRes.data || productRes) ? (productRes.data || productRes) : []);
      setRevenueByEmployee(Array.isArray(employeeRes.data || employeeRes) ? (employeeRes.data || employeeRes) : []);
    } catch (error) {
      console.error('Report error:', error);
      message.error(error.message || 'Không thể tải báo cáo');
    } finally { 
      setLoading(false); 
    }
  };

  // Monthly revenue table - mapping đúng field từ BE
  const monthlyColumns = [
    { 
      title: 'Tháng', 
      dataIndex: 'month', 
      key: 'month', 
      width: 80,
      render: (m) => `T${m}`
    },
    { 
      title: 'Thời gian', 
      dataIndex: 'monthName', 
      key: 'monthName', 
      width: 100 
    },
    { 
      title: 'Doanh thu', 
      dataIndex: 'revenue',  // BE trả về 'revenue'
      key: 'revenue', 
      align: 'right',
      render: (v) => (
        <span style={{ fontWeight: 600, color: '#52c41a' }}>
          {formatCurrency(v || 0)}
        </span>
      )
    },
    { 
      title: 'Số đơn', 
      dataIndex: 'orderCount',  // BE trả về 'orderCount'
      key: 'orderCount', 
      align: 'center' 
    },
    { 
      title: 'TB/đơn', 
      key: 'avg', 
      align: 'right', 
      render: (_, r) => formatCurrency(r.orderCount ? (r.revenue || 0) / r.orderCount : 0) 
    }
  ];

  // Product revenue table - mapping đúng field từ BE
  const productColumns = [
    { 
      title: 'Mã SP', 
      dataIndex: 'productCode', 
      key: 'productCode',
      width: 100
    },
    { 
      title: 'Sản phẩm', 
      dataIndex: 'productName', 
      key: 'productName', 
      ellipsis: true 
    },
    { 
      title: 'Danh mục', 
      dataIndex: 'categoryName', 
      key: 'categoryName',
      width: 120
    },
    { 
      title: 'SL bán', 
      dataIndex: 'totalQuantitySold',  // BE trả về 'totalQuantitySold'
      key: 'totalQuantitySold', 
      align: 'center',
      width: 80
    },
    { 
      title: 'Doanh thu', 
      dataIndex: 'totalRevenue',  // BE trả về 'totalRevenue'
      key: 'totalRevenue', 
      align: 'right',
      render: (v) => (
        <span style={{ fontWeight: 600, color: '#52c41a' }}>
          {formatCurrency(v || 0)}
        </span>
      )
    }
  ];

  // Employee revenue table - mapping đúng field từ BE
  const employeeColumns = [
    { 
      title: 'Nhân viên', 
      dataIndex: 'employeeName', 
      key: 'employeeName' 
    },
    { 
      title: 'Phòng ban', 
      dataIndex: 'departmentName', 
      key: 'departmentName',
      width: 150
    },
    { 
      title: 'Số đơn', 
      dataIndex: 'totalOrders',  // BE trả về 'totalOrders'
      key: 'totalOrders', 
      align: 'center',
      width: 80
    },
    { 
      title: 'Doanh thu', 
      dataIndex: 'totalRevenue',  // BE trả về 'totalRevenue'
      key: 'totalRevenue', 
      align: 'right',
      render: (v) => (
        <span style={{ fontWeight: 600, color: '#52c41a' }}>
          {formatCurrency(v || 0)}
        </span>
      )
    },
    { 
      title: 'TB/đơn', 
      dataIndex: 'averageOrderValue',  // BE trả về 'averageOrderValue'
      key: 'averageOrderValue', 
      align: 'right',
      render: (v) => formatCurrency(v || 0)
    }
  ];

  if (loading) return <Loading tip="Đang tải báo cáo doanh thu..." />;

  return (
    <div>
      <PageHeader 
        title="Báo cáo doanh thu" 
        subtitle="Thống kê doanh thu theo thời gian" 
        breadcrumbs={[{ title: 'Báo cáo' }, { title: 'Doanh thu' }]}
        extra={
          <Space>
            <Select value={month} onChange={setMonth} style={{ width: 110 }}>
              {[...Array(12)].map((_, i) => (
                <Select.Option key={i + 1} value={i + 1}>Tháng {i + 1}</Select.Option>
              ))}
            </Select>
            <Select value={year} onChange={setYear} style={{ width: 100 }}>
              {[2023, 2024, 2025, 2026].map(y => (
                <Select.Option key={y} value={y}>{y}</Select.Option>
              ))}
            </Select>
            <Button icon={<FileExcelOutlined />}>Xuất Excel</Button>
          </Space>
        }
      />

      {/* Summary Statistics - mapping đúng field từ BE */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic 
              title={`Doanh thu T${month}/${year}`}
              value={summary.totalRevenue || 0}  // BE: totalRevenue
              prefix={<DollarOutlined />} 
              formatter={(v) => formatCurrency(v)} 
              valueStyle={{ color: '#52c41a' }} 
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic 
              title="Số đơn hàng" 
              value={summary.totalOrders || 0}  // BE: totalOrders
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#1890ff' }} 
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic 
              title="TB/đơn hàng" 
              value={summary.averageOrderValue || 0}  // BE: averageOrderValue
              formatter={(v) => formatCurrency(v)} 
              valueStyle={{ color: '#722ed1' }} 
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic 
              title="Số khách hàng" 
              value={summary.totalCustomers || 0}  // BE: totalCustomers
              prefix={<UserOutlined />}
              valueStyle={{ color: '#eb2f96' }} 
            />
          </Card>
        </Col>
      </Row>

      {/* Tables */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={`Doanh thu theo tháng năm ${year}`} size="small">
            <Table 
              columns={monthlyColumns} 
              dataSource={monthlyData} 
              rowKey="month" 
              pagination={false} 
              size="small"
              summary={(data) => {
                const totalRevenue = data.reduce((sum, r) => sum + (r.revenue || 0), 0);
                const totalOrders = data.reduce((sum, r) => sum + (r.orderCount || 0), 0);
                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 600 }}>
                      <Table.Summary.Cell index={0} colSpan={2}>Tổng năm</Table.Summary.Cell>
                      <Table.Summary.Cell index={2} align="right">
                        <span style={{ color: '#52c41a' }}>{formatCurrency(totalRevenue)}</span>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3} align="center">{totalOrders}</Table.Summary.Cell>
                      <Table.Summary.Cell index={4} align="right">
                        {formatCurrency(totalOrders ? totalRevenue / totalOrders : 0)}
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                );
              }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={`Top sản phẩm bán chạy T${month}/${year}`} size="small">
            <Table 
              columns={productColumns} 
              dataSource={revenueByProduct.slice(0, 10)} 
              rowKey="productId" 
              pagination={false} 
              size="small" 
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card title={`Doanh thu theo nhân viên T${month}/${year}`} size="small">
            <Table 
              columns={employeeColumns} 
              dataSource={revenueByEmployee} 
              rowKey="employeeId" 
              pagination={{ pageSize: 10 }} 
              size="small"
              summary={(data) => {
                const totalRevenue = data.reduce((sum, r) => sum + (r.totalRevenue || 0), 0);
                const totalOrders = data.reduce((sum, r) => sum + (r.totalOrders || 0), 0);
                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 600 }}>
                      <Table.Summary.Cell index={0} colSpan={2}>Tổng cộng</Table.Summary.Cell>
                      <Table.Summary.Cell index={2} align="center">{totalOrders}</Table.Summary.Cell>
                      <Table.Summary.Cell index={3} align="right">
                        <span style={{ color: '#52c41a' }}>{formatCurrency(totalRevenue)}</span>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4} align="right">
                        {formatCurrency(totalOrders ? totalRevenue / totalOrders : 0)}
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                );
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default RevenueReport;