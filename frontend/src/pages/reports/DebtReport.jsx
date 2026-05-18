import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Typography, Space, Button, message, Input } from 'antd';
import { WarningOutlined, DollarOutlined, UserOutlined, FileExcelOutlined, SearchOutlined } from '@ant-design/icons';
import { PageHeader, Loading } from '../../components/common';
import { formatCurrency } from '../../utils/formatters';
import reportApi from '../../api/reportApi';

const DebtReport = () => {
  const [loading, setLoading] = useState(true);
  const [customerDebts, setCustomerDebts] = useState([]);
  const [searchText, setSearchText] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await reportApi.getCustomerDebt();
      const data = response.data || response || [];
      setCustomerDebts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Debt report error:', error);
      message.error(error.message || 'Không thể tải báo cáo công nợ');
    } finally { 
      setLoading(false); 
    }
  };

  const filteredDebts = customerDebts.filter(d =>
    (d.customerName || '').toLowerCase().includes(searchText.toLowerCase())
  );

  // Tính toán stats từ data BE thực tế
  const stats = {
    totalDebt: customerDebts.reduce((sum, d) => sum + (d.totalDebt || 0), 0),
    customersWithDebt: customerDebts.filter(d => (d.totalDebt || 0) > 0).length,
    totalCustomers: customerDebts.length,
    overdueCount: customerDebts.filter(d => d.isOverLimit).length
  };

  const debtColumns = [
    { 
      title: 'Khách hàng', 
      dataIndex: 'customerName', 
      key: 'customerName', 
      width: 200,
      render: (name) => <span style={{ fontWeight: 500 }}>{name}</span>
    },
    { 
      title: 'Email', 
      dataIndex: 'email', 
      key: 'email', 
      width: 180,
      ellipsis: true 
    },
    { 
      title: 'SĐT', 
      dataIndex: 'phone', 
      key: 'phone', 
      width: 120 
    },
    { 
      title: 'Tổng đơn', 
      dataIndex: 'totalOrders', 
      key: 'totalOrders', 
      align: 'center', 
      width: 90 
    },
    { 
      title: 'Hạn mức', 
      dataIndex: 'creditLimit', 
      key: 'creditLimit', 
      align: 'right', 
      width: 140, 
      render: (v) => formatCurrency(v || 0) 
    },
    { 
      title: 'Công nợ', 
      dataIndex: 'totalDebt', 
      key: 'totalDebt', 
      align: 'right', 
      width: 140,
      render: (v, record) => (
        <span style={{ 
          color: (v || 0) > 0 ? '#cf1322' : '#52c41a', 
          fontWeight: 600 
        }}>
          {formatCurrency(v || 0)}
        </span>
      ),
      sorter: (a, b) => (a.totalDebt || 0) - (b.totalDebt || 0), 
      defaultSortOrder: 'descend'
    },
    { 
      title: 'Còn lại', 
      dataIndex: 'availableCredit', 
      key: 'availableCredit', 
      align: 'right', 
      width: 140,
      render: (v) => (
        <span style={{ color: (v || 0) >= 0 ? '#52c41a' : '#cf1322' }}>
          {formatCurrency(v || 0)}
        </span>
      )
    },
    { 
      title: 'Trạng thái', 
      key: 'status', 
      width: 110,
      render: (_, record) => (
        record.isOverLimit 
          ? <Tag color="red" icon={<WarningOutlined />}>Vượt hạn mức</Tag>
          : <Tag color="green">Bình thường</Tag>
      )
    }
  ];

  if (loading) return <Loading tip="Đang tải báo cáo công nợ..." />;

  return (
    <div>
      <PageHeader 
        title="Báo cáo công nợ" 
        subtitle="Theo dõi công nợ khách hàng" 
        breadcrumbs={[{ title: 'Báo cáo' }, { title: 'Công nợ' }]}
        extra={<Button icon={<FileExcelOutlined />}>Xuất Excel</Button>}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic 
              title="Tổng công nợ" 
              value={stats.totalDebt} 
              prefix={<DollarOutlined />} 
              formatter={(v) => formatCurrency(v)} 
              valueStyle={{ color: '#cf1322' }} 
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic 
              title="Khách có nợ" 
              value={stats.customersWithDebt} 
              prefix={<UserOutlined />} 
              valueStyle={{ color: '#faad14' }} 
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic 
              title="Tổng khách hàng" 
              value={stats.totalCustomers} 
              prefix={<UserOutlined />} 
              valueStyle={{ color: '#1890ff' }} 
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic 
              title="Vượt hạn mức" 
              value={stats.overdueCount} 
              prefix={<WarningOutlined />} 
              valueStyle={{ color: '#cf1322' }} 
            />
          </Card>
        </Col>
      </Row>

      <Card 
        title="Công nợ theo khách hàng" 
        extra={
          <Input.Search 
            placeholder="Tìm khách hàng..." 
            prefix={<SearchOutlined />} 
            value={searchText} 
            onChange={(e) => setSearchText(e.target.value)} 
            style={{ width: 250 }} 
            allowClear 
          />
        }
      >
        <Table 
          columns={debtColumns} 
          dataSource={filteredDebts} 
          rowKey="customerId" 
          scroll={{ x: 1100 }} 
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Tổng ${total} khách hàng` }} 
        />
      </Card>
    </div>
  );
};

export default DebtReport;