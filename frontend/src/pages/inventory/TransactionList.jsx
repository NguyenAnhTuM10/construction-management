import { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Input, Tag, Card, Row, Col,
  Statistic, Select, DatePicker, Typography, message, Popconfirm,
  Modal, Descriptions, Divider, Timeline, Tooltip
} from 'antd';
import { 
  PlusOutlined, SearchOutlined, ReloadOutlined,
  ArrowDownOutlined, ArrowUpOutlined, SwapOutlined,
  FileTextOutlined, CheckCircleOutlined, CloseCircleOutlined,
  EyeOutlined, PrinterOutlined, UserOutlined, ShopOutlined,
  CalendarOutlined, InboxOutlined
} from '@ant-design/icons';
import { PageHeader, Loading } from '../../components/common';
import { formatCurrency, formatDateTime, formatNumber } from '../../utils/formatters';
import TransactionFormModal from './TransactionFormModal';
import { inventoryTransactionApi } from '../../api/inventoryApi';
import warehouseApi from '../../api/warehouseApi';
import supplierApi from '../../api/supplierApi';
import productApi from '../../api/productApi';

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

const TRANSACTION_TYPES = {
  IN: { label: 'Nhập kho', color: 'green', icon: <ArrowDownOutlined /> },
  OUT: { label: 'Xuất kho', color: 'red', icon: <ArrowUpOutlined /> },
};

const TRANSACTION_REASONS = {
  PURCHASE: { label: 'Mua hàng từ NCC', color: 'blue' },
  SALE: { label: 'Bán hàng', color: 'orange' },
  RETURN: { label: 'Trả hàng', color: 'purple' },
  ADJUST: { label: 'Điều chỉnh', color: 'cyan' },
};

const TRANSACTION_STATUS = {
  PENDING: { label: 'Chờ xử lý', color: 'gold' },
  COMPLETED: { label: 'Hoàn thành', color: 'success' },
  CANCELLED: { label: 'Đã hủy', color: 'error' },
};

const TransactionList = () => {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterWarehouse, setFilterWarehouse] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Detail modal state
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [transRes, warehousesRes, suppliersRes, productsRes] = await Promise.all([
        inventoryTransactionApi.getAll(),
        warehouseApi.getAll(),
        supplierApi.getAll(),
        productApi.getAll()
      ]);
      setTransactions(Array.isArray(transRes.data || transRes) ? (transRes.data || transRes) : []);
      setWarehouses(Array.isArray(warehousesRes.data || warehousesRes) ? (warehousesRes.data || warehousesRes) : []);
      setSuppliers(Array.isArray(suppliersRes.data || suppliersRes) ? (suppliersRes.data || suppliersRes) : []);
      setProducts(Array.isArray(productsRes.data || productsRes) ? (productsRes.data || productsRes) : []);
    } catch (error) {
      console.error('Fetch error:', error);
      message.error(error.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => setModalVisible(true);

  // Xem chi tiết giao dịch
  const handleViewDetail = async (record) => {
    setDetailLoading(true);
    setDetailVisible(true);
    try {
      const res = await inventoryTransactionApi.getById(record.id);
      setSelectedTransaction(res.data || res);
    } catch (error) {
      message.error('Không thể tải chi tiết giao dịch');
      setSelectedTransaction(record);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleComplete = async (record) => {
    try {
      await inventoryTransactionApi.complete(record.id);
      message.success('Hoàn thành giao dịch! Tồn kho đã được cập nhật.');
      fetchData(); // Reload để cập nhật dữ liệu mới nhất
    } catch (error) {
      message.error(error.message || 'Không thể hoàn thành giao dịch');
    }
  };

  const handleCancel = async (record) => {
    try {
      await inventoryTransactionApi.cancel(record.id);
      setTransactions(prev => prev.map(t => t.id === record.id ? { ...t, status: 'CANCELLED' } : t));
      message.success('Đã hủy giao dịch');
    } catch (error) {
      message.error(error.message || 'Không thể hủy giao dịch');
    }
  };

  const handleFormSuccess = async (data) => {
    try {
      const res = await inventoryTransactionApi.create(data);
      message.success('Tạo phiếu giao dịch thành công!');
      setModalVisible(false);
      fetchData(); // Reload data
    } catch (error) {
      message.error(error.message || 'Có lỗi xảy ra');
      throw error;
    }
  };

  const filteredTransactions = transactions.filter(trans => {
    const matchSearch = !searchText || 
      (trans.transactionCode || '').toLowerCase().includes(searchText.toLowerCase()) ||
      (trans.warehouseName || '').toLowerCase().includes(searchText.toLowerCase()) ||
      (trans.supplierName || '').toLowerCase().includes(searchText.toLowerCase());
    const matchType = !filterType || trans.type === filterType;
    const matchStatus = !filterStatus || trans.status === filterStatus;
    const matchWarehouse = !filterWarehouse || trans.warehouseId === filterWarehouse;
    let matchDate = true;
    if (dateRange && dateRange[0] && dateRange[1]) {
      const transDate = new Date(trans.transactionDate);
      matchDate = transDate >= dateRange[0].startOf('day').toDate() && transDate <= dateRange[1].endOf('day').toDate();
    }
    return matchSearch && matchType && matchStatus && matchWarehouse && matchDate;
  });

  const stats = {
    total: transactions.length,
    pending: transactions.filter(t => t.status === 'PENDING').length,
    completed: transactions.filter(t => t.status === 'COMPLETED').length,
    totalImportValue: transactions.filter(t => t.type === 'IN' && t.status === 'COMPLETED').reduce((sum, t) => sum + (t.totalAmount || 0), 0),
    totalExportValue: transactions.filter(t => t.type === 'OUT' && t.status === 'COMPLETED').reduce((sum, t) => sum + (t.totalAmount || 0), 0)
  };

  const columns = [
    {
      title: 'Mã phiếu',
      dataIndex: 'transactionCode',
      key: 'transactionCode',
      width: 140,
      fixed: 'left',
      render: (code, record) => {
        const short = code && code.length > 14 ? code.slice(0, 14) + '…' : (code || '-');
        return (
          <Tooltip title={code} placement="right">
            <Button type="link" onClick={() => handleViewDetail(record)} style={{ padding: 0, fontWeight: 600, fontFamily: 'monospace', fontSize: 12 }}>
              {short}
            </Button>
          </Tooltip>
        );
      }
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (type) => {
        const config = TRANSACTION_TYPES[type] || { label: type, color: 'default' };
        return <Tag color={config.color} icon={config.icon}>{config.label}</Tag>;
      }
    },
    {
      title: 'Lý do',
      dataIndex: 'reason',
      key: 'reason',
      width: 130,
      render: (reason) => {
        const config = TRANSACTION_REASONS[reason] || { label: reason, color: 'default' };
        return <Tag color={config.color}>{config.label}</Tag>;
      }
    },
    {
      title: 'Kho',
      dataIndex: 'warehouseName',
      key: 'warehouseName',
      width: 130,
      ellipsis: true,
      render: (name) => (
        <Space>
          <InboxOutlined style={{ color: '#1890ff' }} />
          <Text>{name}</Text>
        </Space>
      )
    },
    {
      title: 'NCC/Đối tác',
      dataIndex: 'supplierName',
      key: 'supplierName',
      width: 150,
      ellipsis: true,
      render: (name) => name ? (
        <Space>
          <ShopOutlined style={{ color: '#52c41a' }} />
          <Text>{name}</Text>
        </Space>
      ) : <Text type="secondary">-</Text>
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 140,
      align: 'right',
      render: (amount, record) => (
        <Text strong style={{ color: record.type === 'IN' ? '#52c41a' : '#cf1322' }}>
          {formatCurrency(amount || 0)}
        </Text>
      )
    },
    {
      title: 'Ngày GD',
      dataIndex: 'transactionDate',
      key: 'transactionDate',
      width: 140,
      render: (date) => formatDateTime(date),
      sorter: (a, b) => new Date(a.transactionDate) - new Date(b.transactionDate),
      defaultSortOrder: 'descend'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const config = TRANSACTION_STATUS[status] || { label: status, color: 'default' };
        return <Tag color={config.color}>{config.label}</Tag>;
      }
    },
    {
      title: 'Người tạo',
      dataIndex: 'createdByUsername',
      key: 'createdByUsername',
      width: 110,
      render: (name) => (
        <Space>
          <UserOutlined />
          <Text type="secondary">{name || '-'}</Text>
        </Space>
      )
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 130,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="text" 
            size="small" 
            icon={<EyeOutlined />} 
            onClick={() => handleViewDetail(record)}
          />
          {record.status === 'PENDING' && (
            <>
              <Popconfirm 
                title="Xác nhận hoàn thành giao dịch?" 
                description="Tồn kho sẽ được cập nhật sau khi hoàn thành."
                onConfirm={() => handleComplete(record)}
                okText="Hoàn thành"
                cancelText="Hủy"
              >
                <Button type="text" size="small" icon={<CheckCircleOutlined />} style={{ color: '#52c41a' }} />
              </Popconfirm>
              <Popconfirm 
                title="Xác nhận hủy giao dịch?" 
                onConfirm={() => handleCancel(record)}
                okText="Hủy GD"
                cancelText="Không"
              >
                <Button type="text" size="small" icon={<CloseCircleOutlined />} danger />
              </Popconfirm>
            </>
          )}
        </Space>
      )
    }
  ];

  // Detail item columns
  const detailItemColumns = [
    {
      title: 'STT',
      key: 'index',
      width: 50,
      align: 'center',
      render: (_, __, index) => index + 1
    },
    {
      title: 'Mã SP',
      dataIndex: 'productCode',
      key: 'productCode',
      width: 100,
      render: (code) => <Text strong style={{ color: '#1890ff' }}>{code}</Text>
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'productName',
      key: 'productName',
      ellipsis: true
    },
    {
      title: 'ĐVT',
      dataIndex: 'unit',
      key: 'unit',
      width: 70,
      align: 'center'
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 90,
      align: 'right',
      render: (qty) => <Text strong>{formatNumber(qty)}</Text>
    },
    {
      title: 'Đơn giá',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 120,
      align: 'right',
      render: (price) => formatCurrency(price)
    },
    {
      title: 'Thành tiền',
      dataIndex: 'subtotal',
      key: 'subtotal',
      width: 130,
      align: 'right',
      render: (amount) => <Text strong>{formatCurrency(amount)}</Text>
    }
  ];

  if (loading) return <Loading tip="Đang tải giao dịch kho..." />;

  return (
    <div>
      <PageHeader
        title="Giao dịch kho"
        subtitle="Quản lý nhập xuất kho hàng"
        breadcrumbs={[{ title: 'Kho hàng' }, { title: 'Giao dịch' }]}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchData}>Làm mới</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Tạo phiếu mới
            </Button>
          </Space>
        }
      />

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6} lg={4}>
          <Card size="small" hoverable>
            <Statistic 
              title="Tổng phiếu" 
              value={stats.total} 
              prefix={<FileTextOutlined />} 
              valueStyle={{ color: '#1890ff' }} 
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={4}>
          <Card size="small" hoverable>
            <Statistic 
              title="Chờ xử lý" 
              value={stats.pending} 
              valueStyle={{ color: '#faad14' }} 
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={4}>
          <Card size="small" hoverable>
            <Statistic 
              title="Hoàn thành" 
              value={stats.completed} 
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }} 
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={6}>
          <Card size="small" hoverable>
            <Statistic 
              title="Tổng nhập kho" 
              value={stats.totalImportValue} 
              formatter={(v) => formatCurrency(v)} 
              prefix={<ArrowDownOutlined />}
              valueStyle={{ color: '#52c41a', fontSize: 18 }} 
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={6}>
          <Card size="small" hoverable>
            <Statistic 
              title="Tổng xuất kho" 
              value={stats.totalExportValue} 
              formatter={(v) => formatCurrency(v)} 
              prefix={<ArrowUpOutlined />}
              valueStyle={{ color: '#cf1322', fontSize: 18 }} 
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input.Search
            placeholder="Tìm mã phiếu, kho, NCC..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 220 }}
            allowClear
          />
          <Select 
            placeholder="Loại giao dịch" 
            value={filterType} 
            onChange={setFilterType} 
            style={{ width: 130 }} 
            allowClear
          >
            {Object.entries(TRANSACTION_TYPES).map(([key, val]) => (
              <Select.Option key={key} value={key}>
                <Space>{val.icon}{val.label}</Space>
              </Select.Option>
            ))}
          </Select>
          <Select 
            placeholder="Trạng thái" 
            value={filterStatus} 
            onChange={setFilterStatus} 
            style={{ width: 130 }} 
            allowClear
          >
            {Object.entries(TRANSACTION_STATUS).map(([key, val]) => (
              <Select.Option key={key} value={key}>{val.label}</Select.Option>
            ))}
          </Select>
          <Select 
            placeholder="Kho hàng" 
            value={filterWarehouse} 
            onChange={setFilterWarehouse} 
            style={{ width: 150 }} 
            allowClear
          >
            {warehouses.map(wh => (
              <Select.Option key={wh.id} value={wh.id}>{wh.name}</Select.Option>
            ))}
          </Select>
          <RangePicker 
            placeholder={['Từ ngày', 'Đến ngày']} 
            onChange={setDateRange} 
            format="DD/MM/YYYY" 
          />
        </Space>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredTransactions}
          rowKey="id"
          scroll={{ x: 1400 }}
          pagination={{ 
            pageSize: 10, 
            showSizeChanger: true, 
            showTotal: (total) => `Tổng ${total} giao dịch`,
            showQuickJumper: true
          }}
          rowClassName={(record) => 
            record.status === 'CANCELLED' ? 'row-cancelled' : ''
          }
        />
      </Card>

      {/* Create Modal */}
      <TransactionFormModal
        visible={modalVisible}
        warehouses={warehouses}
        suppliers={suppliers}
        products={products}
        onCancel={() => setModalVisible(false)}
        onSuccess={handleFormSuccess}
      />

      {/* Detail Modal */}
      <Modal
        title={
          <Space>
            <FileTextOutlined style={{ color: '#1890ff' }} />
            Chi tiết phiếu {selectedTransaction?.transactionCode}
          </Space>
        }
        open={detailVisible}
        onCancel={() => {
          setDetailVisible(false);
          setSelectedTransaction(null);
        }}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            Đóng
          </Button>,
          selectedTransaction?.status === 'PENDING' && (
            <Popconfirm
              key="complete"
              title="Xác nhận hoàn thành giao dịch?"
              onConfirm={() => {
                handleComplete(selectedTransaction);
                setDetailVisible(false);
              }}
            >
              <Button type="primary" icon={<CheckCircleOutlined />}>
                Hoàn thành
              </Button>
            </Popconfirm>
          ),
          <Button key="print" icon={<PrinterOutlined />} onClick={() => window.print()}>
            In phiếu
          </Button>
        ].filter(Boolean)}
        width={900}
        loading={detailLoading}
      >
        {selectedTransaction && (
          <>
            {/* Header Info */}
            <Row gutter={[24, 16]}>
              <Col span={12}>
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="Mã phiếu">
                    <Text strong style={{ color: '#1890ff', fontSize: 16 }}>
                      {selectedTransaction.transactionCode}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Loại giao dịch">
                    <Tag 
                      color={TRANSACTION_TYPES[selectedTransaction.type]?.color} 
                      icon={TRANSACTION_TYPES[selectedTransaction.type]?.icon}
                    >
                      {TRANSACTION_TYPES[selectedTransaction.type]?.label}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Lý do">
                    <Tag color={TRANSACTION_REASONS[selectedTransaction.reason]?.color}>
                      {TRANSACTION_REASONS[selectedTransaction.reason]?.label}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Trạng thái">
                    <Tag color={TRANSACTION_STATUS[selectedTransaction.status]?.color}>
                      {TRANSACTION_STATUS[selectedTransaction.status]?.label}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              <Col span={12}>
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="Kho hàng">
                    <Space>
                      <InboxOutlined style={{ color: '#1890ff' }} />
                      {selectedTransaction.warehouseName}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Nhà cung cấp">
                    {selectedTransaction.supplierName ? (
                      <Space>
                        <ShopOutlined style={{ color: '#52c41a' }} />
                        {selectedTransaction.supplierName}
                      </Space>
                    ) : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày giao dịch">
                    <Space>
                      <CalendarOutlined />
                      {formatDateTime(selectedTransaction.transactionDate)}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Người tạo">
                    <Space>
                      <UserOutlined />
                      {selectedTransaction.createdByUsername}
                    </Space>
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>

            {selectedTransaction.note && (
              <Card size="small" style={{ marginTop: 16, background: '#fffbe6' }}>
                <Text><strong>Ghi chú:</strong> {selectedTransaction.note}</Text>
              </Card>
            )}

            <Divider>Chi tiết sản phẩm</Divider>

            {/* Items Table */}
            <Table
              columns={detailItemColumns}
              dataSource={selectedTransaction.items || []}
              rowKey="id"
              pagination={false}
              size="small"
              bordered
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row style={{ background: selectedTransaction.type === 'IN' ? '#f6ffed' : '#fff1f0' }}>
                    <Table.Summary.Cell index={0} colSpan={6} align="right">
                      <Text strong style={{ fontSize: 15 }}>TỔNG CỘNG:</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <Title level={4} style={{ margin: 0, color: selectedTransaction.type === 'IN' ? '#52c41a' : '#cf1322' }}>
                        {formatCurrency(selectedTransaction.totalAmount)}
                      </Title>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />

            {/* Timeline */}
            <Divider>Lịch sử</Divider>
            <Timeline
              items={[
                {
                  color: 'blue',
                  children: (
                    <>
                      <Text strong>Tạo phiếu</Text>
                      <br />
                      <Text type="secondary">
                        {formatDateTime(selectedTransaction.createdDate)} - {selectedTransaction.createdByUsername}
                      </Text>
                    </>
                  )
                },
                selectedTransaction.status === 'COMPLETED' && {
                  color: 'green',
                  children: (
                    <>
                      <Text strong>Hoàn thành</Text>
                      <br />
                      <Text type="secondary">Đã cập nhật tồn kho</Text>
                    </>
                  )
                },
                selectedTransaction.status === 'CANCELLED' && {
                  color: 'red',
                  children: (
                    <>
                      <Text strong>Đã hủy</Text>
                    </>
                  )
                }
              ].filter(Boolean)}
            />
          </>
        )}
      </Modal>

      <style>{`
        .row-cancelled {
          opacity: 0.6;
          background: #fafafa;
        }
        .row-cancelled td {
          text-decoration: line-through;
        }
      `}</style>
    </div>
  );
};

export default TransactionList;