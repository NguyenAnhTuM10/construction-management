import { useState, useEffect } from 'react';
import { 
  Modal, Form, Select, Table, InputNumber, Button, 
  Space, Typography, Divider, Card, Empty, message
} from 'antd';
import { PlusOutlined, DeleteOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { formatCurrency } from '../../utils/formatters';

const { Text, Title } = Typography;

const OrderFormModal = ({ visible, order, customers, products, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [orderItems, setOrderItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  
  const isEditing = !!order;

  useEffect(() => {
    if (visible) {
      if (order) {
        form.setFieldsValue({
          customerId: order.customerId
        });
        setOrderItems(order.items || []);
      } else {
        form.resetFields();
        setOrderItems([]);
      }
      setSelectedProduct(null);
      setQuantity(1);
    }
  }, [visible, order, form]);

  // Thêm sản phẩm vào đơn
  const handleAddItem = () => {
    if (!selectedProduct) {
      message.warning('Vui lòng chọn sản phẩm!');
      return;
    }
    if (quantity <= 0) {
      message.warning('Số lượng phải > 0!');
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    
    // Check if product already in list
    const existingIndex = orderItems.findIndex(item => item.productId === selectedProduct);
    
    if (existingIndex >= 0) {
      // Update quantity
      const newItems = [...orderItems];
      newItems[existingIndex].quantity += quantity;
      newItems[existingIndex].subtotal = newItems[existingIndex].quantity * newItems[existingIndex].price;
      setOrderItems(newItems);
    } else {
      // Add new item
      const newItem = {
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        unit: product.unit,
        quantity: quantity,
        price: product.sellPrice,
        subtotal: quantity * product.sellPrice
      };
      setOrderItems([...orderItems, newItem]);
    }

    setSelectedProduct(null);
    setQuantity(1);
    message.success('Đã thêm sản phẩm');
  };

  // Xóa sản phẩm khỏi đơn
  const handleRemoveItem = (productId) => {
    setOrderItems(orderItems.filter(item => item.productId !== productId));
  };

  // Cập nhật số lượng
  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity <= 0) return;
    setOrderItems(orderItems.map(item => 
      item.productId === productId 
        ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.price }
        : item
    ));
  };

  // Cập nhật giá
  const handlePriceChange = (productId, newPrice) => {
    if (newPrice < 0) return;
    setOrderItems(orderItems.map(item => 
      item.productId === productId 
        ? { ...item, price: newPrice, subtotal: item.quantity * newPrice }
        : item
    ));
  };

  // Tính tổng tiền
  const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

  // Submit
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (orderItems.length === 0) {
        message.warning('Vui lòng thêm ít nhất 1 sản phẩm!');
        return;
      }

      setLoading(true);

      const customer = customers.find(c => c.id === values.customerId);
      
      const orderData = {
        customerId: values.customerId,
        customerName: customer?.name,
        customerPhone: customer?.phone,
        items: orderItems,
        total: totalAmount,
        itemCount: orderItems.length,
        employeeId: 1, // TODO: get from current user
        employeeName: 'Nguyễn Văn A' // TODO: get from current user
      };

      setTimeout(() => {
        onSuccess(orderData);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Validation error:', error);
    }
  };

  // Columns cho bảng sản phẩm trong đơn
  const itemColumns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'productName',
      key: 'productName',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <small style={{ color: '#666' }}>{record.productCode}</small>
        </div>
      )
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
      width: 100,
      render: (qty, record) => (
        <InputNumber
          min={1}
          value={qty}
          onChange={(value) => handleQuantityChange(record.productId, value)}
          size="small"
          style={{ width: 70 }}
        />
      )
    },
    {
      title: 'Đơn giá',
      dataIndex: 'price',
      key: 'price',
      width: 130,
      render: (price, record) => (
        <InputNumber
          min={0}
          value={price}
          onChange={(value) => handlePriceChange(record.productId, value)}
          formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={value => value.replace(/\$\s?|(,*)/g, '')}
          size="small"
          style={{ width: 110 }}
        />
      )
    },
    {
      title: 'Thành tiền',
      dataIndex: 'subtotal',
      key: 'subtotal',
      width: 120,
      align: 'right',
      render: (subtotal) => (
        <Text strong style={{ color: '#1890ff' }}>
          {formatCurrency(subtotal)}
        </Text>
      )
    },
    {
      title: '',
      key: 'action',
      width: 50,
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveItem(record.productId)}
          size="small"
        />
      )
    }
  ];

  return (
    <Modal
      title={
        <Space>
          <ShoppingCartOutlined />
          {isEditing ? `Sửa đơn hàng #${order?.id}` : 'Tạo đơn hàng mới'}
        </Space>
      }
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      okText={isEditing ? 'Cập nhật' : 'Tạo đơn hàng'}
      cancelText="Hủy"
      width={900}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        {/* Chọn khách hàng */}
        <Form.Item
          name="customerId"
          label="Khách hàng"
          rules={[{ required: true, message: 'Vui lòng chọn khách hàng!' }]}
        >
          <Select
            placeholder="Chọn khách hàng"
            showSearch
            optionFilterProp="children"
            style={{ width: '100%' }}
          >
            {customers.map(c => (
              <Select.Option key={c.id} value={c.id}>
                {c.name} - {c.phone}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Divider>Sản phẩm trong đơn</Divider>

        {/* Thêm sản phẩm */}
        <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
          <Space wrap>
            <Select
              placeholder="Chọn sản phẩm"
              value={selectedProduct}
              onChange={setSelectedProduct}
              style={{ width: 300 }}
              showSearch
              optionFilterProp="children"
            >
              {products.map(p => (
                <Select.Option key={p.id} value={p.id}>
                  {p.code} - {p.name} ({formatCurrency(p.sellPrice)}/{p.unit})
                </Select.Option>
              ))}
            </Select>
            
            <InputNumber
              placeholder="SL"
              min={1}
              value={quantity}
              onChange={setQuantity}
              style={{ width: 80 }}
            />
            
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleAddItem}
            >
              Thêm
            </Button>
          </Space>
        </Card>

        {/* Danh sách sản phẩm */}
        {orderItems.length > 0 ? (
          <Table
            columns={itemColumns}
            dataSource={orderItems}
            rowKey="productId"
            pagination={false}
            size="small"
            summary={() => (
              <Table.Summary>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={4}>
                    <Text strong>Tổng cộng ({orderItems.length} sản phẩm)</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <Title level={4} style={{ margin: 0, color: '#cf1322' }}>
                      {formatCurrency(totalAmount)}
                    </Title>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} />
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        ) : (
          <Empty 
            description="Chưa có sản phẩm nào" 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Form>
    </Modal>
  );
};

export default OrderFormModal;
