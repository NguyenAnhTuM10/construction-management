import { 
  Modal, Descriptions, Table, Tag, Space, Button, 
  Typography, Divider, Timeline, Card, Row, Col, Statistic
} from 'antd';
import { 
  UserOutlined, PhoneOutlined, CalendarOutlined,
  CheckCircleOutlined, ClockCircleOutlined, CarOutlined,
  CloseCircleOutlined, PrinterOutlined, DollarOutlined
} from '@ant-design/icons';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const { Title, Text } = Typography;

const ORDER_STATUS = {
  PENDING: { label: 'Chờ xác nhận', color: 'gold', icon: <ClockCircleOutlined /> },
  CONFIRMED: { label: 'Đã xác nhận', color: 'blue', icon: <CheckCircleOutlined /> },
  PROCESSING: { label: 'Đang xử lý', color: 'processing', icon: <ClockCircleOutlined /> },
  SHIPPING: { label: 'Đang giao', color: 'cyan', icon: <CarOutlined /> },
  COMPLETED: { label: 'Hoàn thành', color: 'success', icon: <CheckCircleOutlined /> },
  CANCELLED: { label: 'Đã hủy', color: 'error', icon: <CloseCircleOutlined /> },
};

const OrderDetailModal = ({ visible, order, onCancel, onUpdateStatus }) => {
  if (!order) return null;

  const statusConfig = ORDER_STATUS[order.status];
  const debt = order.total - order.paidAmount;
  const isPaid = debt === 0;

  // Columns cho bảng sản phẩm
  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: 50,
      render: (_, __, index) => index + 1
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'productName',
      key: 'productName',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'center',
      render: (qty) => <Tag color="blue">{qty}</Tag>
    },
    {
      title: 'Đơn giá',
      dataIndex: 'price',
      key: 'price',
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
      render: (subtotal) => (
        <Text strong style={{ color: '#1890ff' }}>
          {formatCurrency(subtotal)}
        </Text>
      )
    }
  ];

  // Get available status actions
  const getStatusActions = () => {
    const actions = [];
    
    if (order.status === 'PENDING') {
      actions.push(
        <Button key="confirm" type="primary" onClick={() => onUpdateStatus(order, 'CONFIRMED')}>
          Xác nhận đơn
        </Button>
      );
      actions.push(
        <Button key="cancel" danger onClick={() => onUpdateStatus(order, 'CANCELLED')}>
          Hủy đơn
        </Button>
      );
    }
    
    if (order.status === 'CONFIRMED') {
      actions.push(
        <Button key="process" type="primary" onClick={() => onUpdateStatus(order, 'PROCESSING')}>
          Bắt đầu xử lý
        </Button>
      );
    }
    
    if (order.status === 'PROCESSING') {
      actions.push(
        <Button key="ship" type="primary" onClick={() => onUpdateStatus(order, 'SHIPPING')}>
          Giao hàng
        </Button>
      );
    }
    
    if (order.status === 'SHIPPING') {
      actions.push(
        <Button key="complete" type="primary" onClick={() => onUpdateStatus(order, 'COMPLETED')}>
          Hoàn thành
        </Button>
      );
    }
    
    return actions;
  };

  return (
    <Modal
      title={
        <Space>
          <span>Chi tiết đơn hàng</span>
          <Tag color="blue">#{order.id}</Tag>
          <Tag color={statusConfig.color} icon={statusConfig.icon}>
            {statusConfig.label}
          </Tag>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={900}
      footer={[
        <Button key="print" icon={<PrinterOutlined />}>
          In đơn hàng
        </Button>,
        ...getStatusActions(),
        <Button key="close" onClick={onCancel}>
          Đóng
        </Button>
      ]}
    >
      {/* Thông tin chung */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={16}>
          <Card size="small" title="Thông tin khách hàng">
            <Descriptions column={1} size="small">
              <Descriptions.Item label={<><UserOutlined /> Khách hàng</>}>
                <Text strong>{order.customerName}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={<><PhoneOutlined /> Điện thoại</>}>
                {order.customerPhone}
              </Descriptions.Item>
              <Descriptions.Item label={<><CalendarOutlined /> Ngày tạo</>}>
                {formatDateTime(order.createdDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Nhân viên">
                {order.employeeName}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        
        <Col span={8}>
          <Card size="small" title="Thanh toán">
            <Statistic 
              title="Tổng tiền" 
              value={order.total}
              formatter={(value) => formatCurrency(value)}
              valueStyle={{ color: '#1890ff', fontSize: 20 }}
            />
            <Divider style={{ margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text>Đã thanh toán:</Text>
              <Text strong style={{ color: '#52c41a' }}>
                {formatCurrency(order.paidAmount)}
              </Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <Text>Còn nợ:</Text>
              <Text strong style={{ color: debt > 0 ? '#cf1322' : '#52c41a' }}>
                {formatCurrency(debt)}
              </Text>
            </div>
            {!isPaid && order.status !== 'CANCELLED' && (
              <Button 
                type="primary" 
                icon={<DollarOutlined />}
                style={{ marginTop: 12, width: '100%' }}
              >
                Thanh toán
              </Button>
            )}
          </Card>
        </Col>
      </Row>

      {/* Danh sách sản phẩm */}
      <Divider orientation="left">
        Sản phẩm ({order.items?.length || 0} mặt hàng)
      </Divider>
      
      {order.items && order.items.length > 0 ? (
        <Table
          columns={columns}
          dataSource={order.items}
          rowKey="productId"
          pagination={false}
          size="small"
          summary={() => (
            <Table.Summary>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={4} align="right">
                  <Text strong>Tổng cộng:</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <Title level={4} style={{ margin: 0, color: '#cf1322' }}>
                    {formatCurrency(order.total)}
                  </Title>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      ) : (
        <Card>
          <Text type="secondary">Không có chi tiết sản phẩm</Text>
        </Card>
      )}

      {/* Timeline trạng thái */}
      <Divider orientation="left">Lịch sử đơn hàng</Divider>
      <Timeline
        items={[
          {
            color: 'green',
            children: (
              <>
                <Text strong>Tạo đơn hàng</Text>
                <br />
                <Text type="secondary">{formatDateTime(order.createdDate)}</Text>
              </>
            )
          },
          ...(order.status !== 'PENDING' && order.status !== 'CANCELLED' ? [{
            color: 'blue',
            children: <Text strong>Đã xác nhận</Text>
          }] : []),
          ...(order.status === 'PROCESSING' || order.status === 'SHIPPING' || order.status === 'COMPLETED' ? [{
            color: 'blue',
            children: <Text strong>Đang xử lý</Text>
          }] : []),
          ...(order.status === 'SHIPPING' || order.status === 'COMPLETED' ? [{
            color: 'cyan',
            children: <Text strong>Đang giao hàng</Text>
          }] : []),
          ...(order.status === 'COMPLETED' ? [{
            color: 'green',
            children: <Text strong>Hoàn thành</Text>
          }] : []),
          ...(order.status === 'CANCELLED' ? [{
            color: 'red',
            children: <Text strong>Đã hủy</Text>
          }] : []),
        ]}
      />
    </Modal>
  );
};

export default OrderDetailModal;
