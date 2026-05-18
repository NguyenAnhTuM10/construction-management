import { 
  Modal, Descriptions, Tag, Space, Button, 
  Typography, Divider, Card, Row, Col, Progress
} from 'antd';
import { 
  PrinterOutlined, DollarOutlined, WalletOutlined,
  BankOutlined, CreditCardOutlined, UserOutlined,
  CalendarOutlined, FileTextOutlined, ShoppingCartOutlined
} from '@ant-design/icons';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const { Title, Text } = Typography;

const PAYMENT_METHODS = {
  CASH: { label: 'Tiền mặt', color: 'green', icon: <WalletOutlined /> },
  BANK_TRANSFER: { label: 'Chuyển khoản', color: 'blue', icon: <BankOutlined /> },
  CREDIT_CARD: { label: 'Thẻ tín dụng', color: 'purple', icon: <CreditCardOutlined /> },
};

const PaymentDetailModal = ({ visible, payment, onCancel }) => {
  if (!payment) return null;

  const methodConfig = PAYMENT_METHODS[payment.paymentMethod];
  const paymentPercent = payment.orderTotal 
    ? Math.round((payment.orderPaidAmount / payment.orderTotal) * 100) 
    : 0;

  return (
    <Modal
      title={
        <Space>
          <DollarOutlined style={{ color: '#52c41a' }} />
          <span>Chi tiết phiếu thu</span>
          <Tag color="blue">#{payment.id}</Tag>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={700}
      footer={[
        <Button key="print" icon={<PrinterOutlined />}>
          In phiếu thu
        </Button>,
        <Button key="close" type="primary" onClick={onCancel}>
          Đóng
        </Button>
      ]}
    >
      {/* Thông tin thanh toán */}
      <Card 
        size="small" 
        style={{ marginBottom: 16, background: '#f6ffed', border: '1px solid #b7eb8f' }}
      >
        <Row align="middle" justify="space-between">
          <Col>
            <Text type="secondary">Số tiền thanh toán</Text>
            <Title level={2} style={{ margin: 0, color: '#52c41a' }}>
              {formatCurrency(payment.amount)}
            </Title>
          </Col>
          <Col>
            <Tag color={methodConfig.color} icon={methodConfig.icon} style={{ fontSize: 14, padding: '4px 12px' }}>
              {methodConfig.label}
            </Tag>
          </Col>
        </Row>
      </Card>

      {/* Thông tin chi tiết */}
      <Descriptions 
        bordered 
        size="small" 
        column={2}
        labelStyle={{ fontWeight: 500, width: 140 }}
      >
        <Descriptions.Item label={<><CalendarOutlined /> Ngày thanh toán</>} span={2}>
          {formatDateTime(payment.paymentDate)}
        </Descriptions.Item>
        
        <Descriptions.Item label={<><ShoppingCartOutlined /> Đơn hàng</>}>
          <Tag color="blue">#{payment.orderId}</Tag>
        </Descriptions.Item>
        
        <Descriptions.Item label={<><UserOutlined /> Khách hàng</>}>
          <Text strong>{payment.customerName}</Text>
        </Descriptions.Item>
        
        {payment.reference && (
          <Descriptions.Item label={<><FileTextOutlined /> Mã giao dịch</>} span={2}>
            <Text code copyable>{payment.reference}</Text>
          </Descriptions.Item>
        )}
        
        <Descriptions.Item label="Người tạo">
          {payment.createdByUsername}
        </Descriptions.Item>
        
        <Descriptions.Item label="Ngày tạo">
          {formatDateTime(payment.createdDate)}
        </Descriptions.Item>
        
        {payment.note && (
          <Descriptions.Item label="Ghi chú" span={2}>
            {payment.note}
          </Descriptions.Item>
        )}
      </Descriptions>

      {/* Thông tin công nợ đơn hàng */}
      <Divider orientation="left">Tình trạng đơn hàng #{payment.orderId}</Divider>
      
      <Card size="small">
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Text type="secondary">Tổng đơn hàng</Text>
            <div>
              <Text strong style={{ fontSize: 16 }}>
                {formatCurrency(payment.orderTotal)}
              </Text>
            </div>
          </Col>
          <Col span={8}>
            <Text type="secondary">Đã thanh toán</Text>
            <div>
              <Text strong style={{ fontSize: 16, color: '#52c41a' }}>
                {formatCurrency(payment.orderPaidAmount)}
              </Text>
            </div>
          </Col>
          <Col span={8}>
            <Text type="secondary">Còn nợ</Text>
            <div>
              <Text strong style={{ 
                fontSize: 16, 
                color: payment.orderRemainingDebt > 0 ? '#cf1322' : '#52c41a' 
              }}>
                {formatCurrency(payment.orderRemainingDebt)}
              </Text>
            </div>
          </Col>
        </Row>
        
        <Divider style={{ margin: '12px 0' }} />
        
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text>Tiến độ thanh toán</Text>
            <Text strong>{paymentPercent}%</Text>
          </div>
          <Progress 
            percent={paymentPercent} 
            status={paymentPercent >= 100 ? 'success' : 'active'}
            strokeColor={paymentPercent >= 100 ? '#52c41a' : '#1890ff'}
          />
        </div>
        
        {payment.orderRemainingDebt === 0 && (
          <Tag color="success" style={{ marginTop: 8 }}>
            ĐÃ THANH TOÁN ĐỦ
          </Tag>
        )}
      </Card>
    </Modal>
  );
};

export default PaymentDetailModal;
