import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Space, Button, message } from 'antd';
import { DatabaseOutlined, WarningOutlined, InboxOutlined, FileExcelOutlined, ShopOutlined } from '@ant-design/icons';
import { PageHeader, Loading } from '../../components/common';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import reportApi from '../../api/reportApi';

const StockReport = () => {
  const [loading, setLoading] = useState(true);
  const [inventorySummary, setInventorySummary] = useState({});
  const [inventoryByWarehouse, setInventoryByWarehouse] = useState([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, warehouseRes] = await Promise.all([
        reportApi.getInventorySummary(),
        reportApi.getInventoryByWarehouse()
      ]);
      
      // Summary là object, không phải array
      const summaryData = summaryRes.data || summaryRes || {};
      setInventorySummary(summaryData);
      
      // Warehouse là array
      const warehouseData = warehouseRes.data || warehouseRes || [];
      setInventoryByWarehouse(Array.isArray(warehouseData) ? warehouseData : []);
    } catch (error) {
      console.error('Stock report error:', error);
      message.error(error.message || 'Không thể tải báo cáo tồn kho');
    } finally { 
      setLoading(false); 
    }
  };

  const warehouseColumns = [
    { 
      title: 'Mã kho', 
      dataIndex: 'warehouseCode', 
      key: 'warehouseCode', 
      width: 100,
      render: (code) => <Tag color="blue">{code}</Tag>
    },
    { 
      title: 'Tên kho', 
      dataIndex: 'warehouseName', 
      key: 'warehouseName', 
      width: 200 
    },
    { 
      title: 'Số mặt hàng', 
      dataIndex: 'productCount', 
      key: 'productCount', 
      align: 'center', 
      width: 120,
      render: (v) => <span style={{ fontWeight: 500 }}>{formatNumber(v || 0)}</span>
    },
    { 
      title: 'Tổng SL tồn', 
      dataIndex: 'totalQuantity', 
      key: 'totalQuantity', 
      align: 'center', 
      width: 120, 
      render: (v) => formatNumber(v || 0) 
    },
    { 
      title: 'Tổng giá trị', 
      dataIndex: 'totalValue', 
      key: 'totalValue', 
      align: 'right', 
      width: 150, 
      render: (v) => (
        <span style={{ fontWeight: 600, color: '#52c41a' }}>
          {formatCurrency(v || 0)}
        </span>
      ),
      sorter: (a, b) => (a.totalValue || 0) - (b.totalValue || 0),
      defaultSortOrder: 'descend'
    }
  ];

  if (loading) return <Loading tip="Đang tải báo cáo tồn kho..." />;

  return (
    <div>
      <PageHeader 
        title="Báo cáo tồn kho" 
        subtitle="Thống kê tồn kho theo kho hàng" 
        breadcrumbs={[{ title: 'Báo cáo' }, { title: 'Tồn kho' }]}
        extra={<Button icon={<FileExcelOutlined />}>Xuất Excel</Button>}
      />

      {/* Summary Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic 
              title="Tổng mặt hàng" 
              value={inventorySummary.totalProducts || 0} 
              prefix={<DatabaseOutlined />} 
              valueStyle={{ color: '#1890ff' }} 
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic 
              title="Tổng SL tồn kho" 
              value={inventorySummary.totalQuantity || 0} 
              prefix={<InboxOutlined />} 
              formatter={(v) => formatNumber(v)}
              valueStyle={{ color: '#722ed1' }} 
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic 
              title="Tổng giá trị" 
              value={inventorySummary.totalValue || 0} 
              formatter={(v) => formatCurrency(v)} 
              valueStyle={{ color: '#52c41a' }} 
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic 
              title="Sắp hết / Hết hàng" 
              value={`${inventorySummary.lowStockProducts || 0} / ${inventorySummary.outOfStockProducts || 0}`}
              prefix={<WarningOutlined />} 
              valueStyle={{ color: '#faad14' }} 
            />
          </Card>
        </Col>
      </Row>

      {/* Alert cards for low stock */}
      {(inventorySummary.lowStockProducts > 0 || inventorySummary.outOfStockProducts > 0) && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {inventorySummary.outOfStockProducts > 0 && (
            <Col xs={24} sm={12}>
              <Card 
                size="small" 
                style={{ borderColor: '#ff4d4f', background: '#fff2f0' }}
              >
                <Space>
                  <InboxOutlined style={{ color: '#cf1322', fontSize: 24 }} />
                  <div>
                    <div style={{ fontWeight: 600, color: '#cf1322' }}>
                      {inventorySummary.outOfStockProducts} sản phẩm hết hàng
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      Cần nhập thêm hàng ngay
                    </div>
                  </div>
                </Space>
              </Card>
            </Col>
          )}
          {inventorySummary.lowStockProducts > 0 && (
            <Col xs={24} sm={12}>
              <Card 
                size="small" 
                style={{ borderColor: '#faad14', background: '#fffbe6' }}
              >
                <Space>
                  <WarningOutlined style={{ color: '#faad14', fontSize: 24 }} />
                  <div>
                    <div style={{ fontWeight: 600, color: '#d48806' }}>
                      {inventorySummary.lowStockProducts} sản phẩm sắp hết
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      Tồn kho dưới 10 đơn vị
                    </div>
                  </div>
                </Space>
              </Card>
            </Col>
          )}
        </Row>
      )}

      {/* Inventory by Warehouse Table */}
      <Card 
        title={
          <Space>
            <ShopOutlined />
            <span>Tồn kho theo kho hàng</span>
          </Space>
        }
      >
        <Table 
          columns={warehouseColumns} 
          dataSource={inventoryByWarehouse} 
          rowKey="warehouseId" 
          pagination={false}
          summary={(data) => {
            const totalProducts = data.reduce((sum, r) => sum + (r.productCount || 0), 0);
            const totalQty = data.reduce((sum, r) => sum + (r.totalQuantity || 0), 0);
            const totalValue = data.reduce((sum, r) => sum + (r.totalValue || 0), 0);
            
            return (
              <Table.Summary fixed>
                <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 600 }}>
                  <Table.Summary.Cell index={0} colSpan={2}>
                    Tổng cộng
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="center">
                    {formatNumber(totalProducts)}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="center">
                    {formatNumber(totalQty)}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="right">
                    <span style={{ color: '#52c41a' }}>{formatCurrency(totalValue)}</span>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            );
          }}
        />
      </Card>
    </div>
  );
};

export default StockReport;