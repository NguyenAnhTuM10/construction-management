import { useState, useEffect } from 'react';
import { 
  Modal, Form, Select, InputNumber, Input, DatePicker,
  Space, Typography, Divider, Card, Alert
} from 'antd';
import { 
  DollarOutlined, WalletOutlined, BankOutlined, 
  CreditCardOutlined, FileTextOutlined
} from '@ant-design/icons';
import { formatCurrency } from '../../utils/formatters';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { TextArea } = Input;

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Tiền mặt', icon: <WalletOutlined /> },
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản ngân hàng', icon: <BankOutlined /> },
  { value: 'CREDIT_CARD', label: 'Thẻ tín dụng', icon: <CreditCardOutlined /> },
];

const PaymentFormModal = ({ 
  visible, 
  orders = [],        // ← Đổi từ ordersWithDebt thành orders và thêm = []
  onCancel, 
  onSuccess 
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (visible) {
      form.resetFields();
      form.setFieldsValue({
        paymentDate: dayjs(),
        paymentMethod: 'CASH'
      });
      setSelectedOrder(null);
    }
  }, [visible, form]);

  // Khi chọn đơn hàng
  const handleOrderChange = (orderId) => {
    const order = orders.find(o => o.id === orderId);  // ← Đổi từ ordersWithDebt thành orders
    setSelectedOrder(order);
    if (order) {
      // Tính debt từ total và paidAmount
      const debt = (order.total || 0) - (order.paidAmount || 0);
      form.setFieldsValue({ amount: debt });
    }
  };

  // Submit form
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const debt = (selectedOrder.total || 0) - (selectedOrder.paidAmount || 0);
      
      if (values.amount > debt) {
        form.setFields([{
          name: 'amount',
          errors: ['Số tiền không được lớn hơn công nợ còn lại!']
        }]);
        return;
      }

      setLoading(true);

      const paymentData = {
        orderId: values.orderId,
        customerId: selectedOrder?.customerId,
        amount: values.amount,
        paymentDate: values.paymentDate.toISOString(),
        paymentMethod: values.paymentMethod,
        reference: values.reference || '',
        note: values.note || ''
      };

      setTimeout(() => {
        onSuccess(paymentData);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Validation error:', error);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <DollarOutlined style={{ color: '#52c41a' }} />
          Tạo phiếu thu mới
        </Space>
      }
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="Tạo phiếu thu"
      cancelText="Hủy"
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 16 }}
      >
        {/* Chọn đơn hàng có công nợ */}
        <Form.Item
          name="orderId"
          label="Đơn hàng cần thanh toán"
          rules={[{ required: true, message: 'Vui lòng chọn đơn hàng!' }]}
        >
          <Select
            placeholder="Chọn đơn hàng có công nợ"
            onChange={handleOrderChange}
            showSearch
            optionFilterProp="children"
          >
            {orders.map(order => {
              const debt = (order.total || 0) - (order.paidAmount || 0);
              return (
                <Select.Option key={order.id} value={order.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>ĐH #{order.id} - {order.customerName}</span>
                    <Text type="danger" style={{ marginLeft: 8 }}>
                      Nợ: {formatCurrency(debt)}
                    </Text>
                  </div>
                </Select.Option>
              );
            })}
          </Select>
        </Form.Item>

        {/* Thông tin đơn hàng đã chọn */}
        {selectedOrder && (
          <Card size="small" style={{ marginBottom: 16, background: '#f5f5f5' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Tổng đơn hàng:</Text>
                <Text strong>{formatCurrency(selectedOrder.total)}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Đã thanh toán:</Text>
                <Text style={{ color: '#52c41a' }}>{formatCurrency(selectedOrder.paidAmount || 0)}</Text>
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text strong>Còn nợ:</Text>
                <Title level={4} style={{ margin: 0, color: '#cf1322' }}>
                  {formatCurrency((selectedOrder.total || 0) - (selectedOrder.paidAmount || 0))}
                </Title>
              </div>
            </Space>
          </Card>
        )}

        {/* Phần còn lại giữ nguyên... */}
        <Form.Item
          name="amount"
          label="Số tiền thanh toán"
          rules={[
            { required: true, message: 'Vui lòng nhập số tiền!' },
            { type: 'number', min: 1000, message: 'Số tiền tối thiểu 1,000đ!' }
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={1000}
            step={100000}
            placeholder="Nhập số tiền"
            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={value => value.replace(/\$\s?|(,*)/g, '')}
            addonAfter="đ"
            size="large"
          />
        </Form.Item>

        <Space style={{ width: '100%' }} size={16}>
          <Form.Item
            name="paymentDate"
            label="Ngày thanh toán"
            rules={[{ required: true, message: 'Vui lòng chọn ngày!' }]}
            style={{ flex: 1 }}
          >
            <DatePicker 
              style={{ width: '100%' }}
              format="DD/MM/YYYY HH:mm"
              showTime={{ format: 'HH:mm' }}
              placeholder="Chọn ngày giờ"
            />
          </Form.Item>

          <Form.Item
            name="paymentMethod"
            label="Phương thức thanh toán"
            rules={[{ required: true, message: 'Vui lòng chọn phương thức!' }]}
            style={{ flex: 1 }}
          >
            <Select placeholder="Chọn phương thức">
              {PAYMENT_METHODS.map(method => (
                <Select.Option key={method.value} value={method.value}>
                  <Space>
                    {method.icon}
                    {method.label}
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Space>

        <Form.Item
          name="reference"
          label="Mã giao dịch / Số hóa đơn"
          tooltip="Mã giao dịch ngân hàng, số hóa đơn..."
        >
          <Input 
            prefix={<FileTextOutlined />}
            placeholder="VD: VCB123456789"
          />
        </Form.Item>

        <Form.Item
          name="note"
          label="Ghi chú"
        >
          <TextArea 
            rows={2}
            placeholder="Ghi chú thêm (nếu có)"
            maxLength={500}
            showCount
          />
        </Form.Item>

        {selectedOrder && (
          <Alert
            message="Lưu ý"
            description={`Sau khi thanh toán, công nợ còn lại của đơn hàng #${selectedOrder.id} sẽ được cập nhật tự động.`}
            type="info"
            showIcon
          />
        )}
      </Form>
    </Modal>
  );
};

export default PaymentFormModal;
