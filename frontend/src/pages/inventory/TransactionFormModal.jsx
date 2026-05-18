import { useState, useEffect } from 'react';
import { 
  Modal, Form, Select, InputNumber, Input, Space, 
  Typography, Card, Tag, Button, Table, Row, Col,
  DatePicker, Divider, message
} from 'antd';
import { 
  ArrowDownOutlined, ArrowUpOutlined, ShopOutlined,
  PlusOutlined, DeleteOutlined, InboxOutlined
} from '@ant-design/icons';
import { formatCurrency } from '../../utils/formatters';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { TextArea } = Input;

const TRANSACTION_REASONS = {
  IN: [
    { value: 'PURCHASE', label: 'Mua hàng từ NCC' },
    { value: 'RETURN', label: 'Khách trả hàng' },
    { value: 'ADJUST', label: 'Điều chỉnh tăng' },
  ],
  OUT: [
    { value: 'SALE', label: 'Bán hàng' },
    { value: 'RETURN', label: 'Trả hàng NCC' },
    { value: 'ADJUST', label: 'Điều chỉnh giảm' },
  ]
};

const TransactionFormModal = ({ 
  visible, 
  warehouses = [],
  products = [], 
  suppliers = [], 
  onCancel, 
  onSuccess 
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [transactionType, setTransactionType] = useState('IN');
  const [items, setItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const isImport = transactionType === 'IN';

  useEffect(() => {
    if (visible) {
      form.resetFields();
      form.setFieldsValue({
        type: 'IN',
        reason: 'PURCHASE',
        transactionDate: dayjs(),
      });
      setTransactionType('IN');
      setItems([]);
      setSelectedProduct(null);
    }
  }, [visible, form]);

  // Khi thay đổi loại giao dịch
  const handleTypeChange = (type) => {
    setTransactionType(type);
    form.setFieldsValue({ 
      reason: type === 'IN' ? 'PURCHASE' : 'SALE',
      supplierId: undefined 
    });
  };

  // Khi chọn sản phẩm để thêm
  const handleProductSelect = (productId) => {
    const product = products.find(p => p.id === productId);
    setSelectedProduct(product);
    form.setFieldsValue({ 
      itemPrice: isImport ? product?.buyPrice : product?.sellPrice,
      itemQuantity: 1
    });
  };

  // Thêm sản phẩm vào danh sách
  const handleAddItem = () => {
    const productId = form.getFieldValue('itemProductId');
    const quantity = form.getFieldValue('itemQuantity');
    const unitPrice = form.getFieldValue('itemPrice');
    const note = form.getFieldValue('itemNote');

    if (!productId) {
      message.warning('Vui lòng chọn sản phẩm!');
      return;
    }
    if (!quantity || quantity < 1) {
      message.warning('Số lượng phải lớn hơn 0!');
      return;
    }
    if (!unitPrice || unitPrice < 0) {
      message.warning('Đơn giá không hợp lệ!');
      return;
    }

    // Kiểm tra sản phẩm đã tồn tại chưa
    if (items.find(item => item.productId === productId)) {
      message.warning('Sản phẩm đã có trong danh sách!');
      return;
    }

    const product = products.find(p => p.id === productId);
    
    const newItem = {
      key: Date.now(),
      productId: productId,
      productCode: product?.code,
      productName: product?.name,
      unit: product?.unit,
      stock: product?.stock || 0,
      quantity: quantity,
      unitPrice: unitPrice,
      subtotal: quantity * unitPrice,
      note: note || ''
    };

    setItems([...items, newItem]);
    
    // Reset form thêm sản phẩm
    form.setFieldsValue({
      itemProductId: undefined,
      itemQuantity: 1,
      itemPrice: undefined,
      itemNote: ''
    });
    setSelectedProduct(null);
  };

  // Xóa sản phẩm khỏi danh sách
  const handleRemoveItem = (key) => {
    setItems(items.filter(item => item.key !== key));
  };

  // Tính tổng tiền
  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

  // Submit
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields(['warehouseId', 'type', 'reason', 'transactionDate']);
      
      if (items.length === 0) {
        message.error('Vui lòng thêm ít nhất một sản phẩm!');
        return;
      }

      setLoading(true);

      const transactionData = {
        warehouseId: values.warehouseId,
        type: values.type,
        reason: values.reason,
        supplierId: values.supplierId || null,
        orderId: values.orderId || null,
        transactionDate: values.transactionDate.format('YYYY-MM-DDTHH:mm:ss'),
        note: values.note || '',
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          note: item.note
        }))
      };

      await onSuccess(transactionData);
      setLoading(false);
    } catch (error) {
      console.error('Validation error:', error);
      setLoading(false);
    }
  };

  // Columns cho bảng sản phẩm
  const itemColumns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'productName',
      key: 'productName',
      render: (name, record) => (
        <div>
          <Text strong>{record.productCode}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>{name}</Text>
        </div>
      )
    },
    {
      title: 'ĐVT',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
      align: 'center'
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stock',
      key: 'stock',
      width: 80,
      align: 'right',
      render: (stock) => <Text type={!isImport && stock < 10 ? 'danger' : 'secondary'}>{stock}</Text>
    },
    {
      title: 'SL',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      align: 'right',
      render: (qty) => <Text strong>{qty}</Text>
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
      render: (amount) => <Text strong style={{ color: '#1890ff' }}>{formatCurrency(amount)}</Text>
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_, record) => (
        <Button 
          type="text" 
          danger 
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveItem(record.key)}
        />
      )
    }
  ];

  return (
    <Modal
      title={
        <Space>
          <InboxOutlined style={{ color: '#1890ff' }} />
          Tạo phiếu giao dịch kho
        </Space>
      }
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="Tạo phiếu"
      cancelText="Hủy"
      width={900}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 16 }}
      >
        {/* Thông tin chung */}
        <Card size="small" title="Thông tin chung" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="type"
                label="Loại giao dịch"
                rules={[{ required: true, message: 'Vui lòng chọn loại!' }]}
              >
                <Select onChange={handleTypeChange}>
                  <Select.Option value="IN">
                    <Space>
                      <ArrowDownOutlined style={{ color: '#52c41a' }} />
                      <span>Nhập kho</span>
                    </Space>
                  </Select.Option>
                  <Select.Option value="OUT">
                    <Space>
                      <ArrowUpOutlined style={{ color: '#cf1322' }} />
                      <span>Xuất kho</span>
                    </Space>
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="reason"
                label="Lý do"
                rules={[{ required: true, message: 'Vui lòng chọn lý do!' }]}
              >
                <Select>
                  {TRANSACTION_REASONS[transactionType]?.map(reason => (
                    <Select.Option key={reason.value} value={reason.value}>
                      {reason.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="transactionDate"
                label="Ngày giao dịch"
                rules={[{ required: true, message: 'Vui lòng chọn ngày!' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  format="DD/MM/YYYY HH:mm"
                  showTime={{ format: 'HH:mm' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="warehouseId"
                label="Kho hàng"
                rules={[{ required: true, message: 'Vui lòng chọn kho!' }]}
              >
                <Select placeholder="Chọn kho hàng" showSearch optionFilterProp="children">
                  {warehouses.map(wh => (
                    <Select.Option key={wh.id} value={wh.id}>
                      {wh.code} - {wh.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="supplierId"
                label="Nhà cung cấp"
                rules={[{ required: isImport && form.getFieldValue('reason') === 'PURCHASE', message: 'Vui lòng chọn NCC!' }]}
              >
                <Select 
                  placeholder="Chọn nhà cung cấp" 
                  showSearch 
                  optionFilterProp="children"
                  allowClear
                  disabled={!isImport}
                >
                  {suppliers.map(supplier => (
                    <Select.Option key={supplier.id} value={supplier.id}>
                      <Space>
                        <ShopOutlined />
                        {supplier.name}
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="note"
                label="Ghi chú"
              >
                <Input placeholder="Ghi chú (nếu có)" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Thêm sản phẩm */}
        <Card 
          size="small" 
          title="Thêm sản phẩm" 
          style={{ marginBottom: 16 }}
          extra={
            <Tag color={isImport ? 'green' : 'red'}>
              {isImport ? 'NHẬP KHO' : 'XUẤT KHO'}
            </Tag>
          }
        >
          <Row gutter={8} align="bottom">
            <Col span={7}>
              <Form.Item
                name="itemProductId"
                label="Sản phẩm"
                style={{ marginBottom: 0 }}
              >
                <Select
                  placeholder="Chọn sản phẩm"
                  onChange={handleProductSelect}
                  showSearch
                  optionFilterProp="children"
                  allowClear
                >
                  {products.map(product => (
                    <Select.Option key={product.id} value={product.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{product.code} - {product.name}</span>
                        <Text type="secondary">Tồn: {product.stock || 0}</Text>
                      </div>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={4}>
              <Form.Item
                name="itemQuantity"
                label="Số lượng"
                style={{ marginBottom: 0 }}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  placeholder="0"
                  addonAfter={selectedProduct?.unit || 'ĐVT'}
                />
              </Form.Item>
            </Col>

            <Col span={5}>
              <Form.Item
                name="itemPrice"
                label={isImport ? 'Giá nhập' : 'Giá xuất'}
                style={{ marginBottom: 0 }}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={1000}
                  placeholder="0"
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  addonAfter="đ"
                />
              </Form.Item>
            </Col>

            <Col span={5}>
              <Form.Item
                name="itemNote"
                label="Ghi chú SP"
                style={{ marginBottom: 0 }}
              >
                <Input placeholder="Ghi chú" />
              </Form.Item>
            </Col>

            <Col span={3}>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleAddItem}
                style={{ width: '100%' }}
              >
                Thêm
              </Button>
            </Col>
          </Row>

          {/* Thông tin sản phẩm đã chọn */}
          {selectedProduct && (
            <Card size="small" style={{ marginTop: 12, background: '#f5f5f5' }}>
              <Row gutter={16}>
                <Col span={6}>
                  <Text type="secondary">Mã SP: </Text>
                  <Text strong style={{ color: '#1890ff' }}>{selectedProduct.code}</Text>
                </Col>
                <Col span={6}>
                  <Text type="secondary">Tồn kho: </Text>
                  <Text strong style={{ color: selectedProduct.stock < 10 ? '#cf1322' : '#52c41a' }}>
                    {selectedProduct.stock || 0} {selectedProduct.unit}
                  </Text>
                </Col>
                <Col span={6}>
                  <Text type="secondary">Giá nhập: </Text>
                  <Text>{formatCurrency(selectedProduct.buyPrice)}</Text>
                </Col>
                <Col span={6}>
                  <Text type="secondary">Giá bán: </Text>
                  <Text>{formatCurrency(selectedProduct.sellPrice)}</Text>
                </Col>
              </Row>
            </Card>
          )}
        </Card>

        {/* Danh sách sản phẩm đã thêm */}
        <Card 
          size="small" 
          title={`Danh sách sản phẩm (${items.length})`}
          style={{ marginBottom: 16 }}
        >
          <Table
            columns={itemColumns}
            dataSource={items}
            pagination={false}
            size="small"
            locale={{ emptyText: 'Chưa có sản phẩm nào' }}
            summary={() => items.length > 0 ? (
              <Table.Summary fixed>
                <Table.Summary.Row style={{ background: isImport ? '#f6ffed' : '#fff1f0' }}>
                  <Table.Summary.Cell index={0} colSpan={5}>
                    <Text strong>TỔNG CỘNG</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <Title level={4} style={{ margin: 0, color: isImport ? '#52c41a' : '#cf1322' }}>
                      {formatCurrency(totalAmount)}
                    </Title>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} />
                </Table.Summary.Row>
              </Table.Summary>
            ) : null}
          />
        </Card>
      </Form>
    </Modal>
  );
};

export default TransactionFormModal;