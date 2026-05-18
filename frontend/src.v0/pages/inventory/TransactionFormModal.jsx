import { useState, useEffect } from 'react';
import { 
  Modal, Form, Select, InputNumber, Input, Space, 
  Typography, Divider, Card, Tag
} from 'antd';
import { 
  ArrowDownOutlined, ArrowUpOutlined, ShopOutlined
} from '@ant-design/icons';
import { formatCurrency } from '../../utils/formatters';

const { Text, Title } = Typography;
const { TextArea } = Input;

const TransactionFormModal = ({ visible, type, products, suppliers, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const isImport = type === 'IMPORT';

  useEffect(() => {
    if (visible) {
      form.resetFields();
      setSelectedProduct(null);
    }
  }, [visible, form]);

  // Khi chọn sản phẩm
  const handleProductChange = (productId) => {
    const product = products.find(p => p.id === productId);
    setSelectedProduct(product);
    if (product) {
      form.setFieldsValue({ price: product.buyPrice });
    }
  };

  // Tính tổng tiền
  const quantity = Form.useWatch('quantity', form) || 0;
  const price = Form.useWatch('price', form) || 0;
  const totalAmount = quantity * price;

  // Submit
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const product = products.find(p => p.id === values.productId);
      const supplier = isImport ? suppliers.find(s => s.id === values.supplierId) : null;

      const transactionData = {
        type: type,
        productId: values.productId,
        productCode: product?.code,
        productName: product?.name,
        unit: product?.unit,
        quantity: isImport ? values.quantity : values.quantity,
        price: values.price,
        totalAmount: totalAmount,
        supplierId: values.supplierId,
        supplierName: supplier?.name,
        note: values.note || ''
      };

      setTimeout(() => {
        onSuccess(transactionData);
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
          {isImport ? (
            <ArrowDownOutlined style={{ color: '#52c41a' }} />
          ) : (
            <ArrowUpOutlined style={{ color: '#cf1322' }} />
          )}
          {isImport ? 'Nhập kho' : 'Xuất kho'}
        </Space>
      }
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      okText={isImport ? 'Nhập kho' : 'Xuất kho'}
      okButtonProps={{ 
        style: isImport 
          ? { background: '#52c41a', borderColor: '#52c41a' } 
          : { background: '#cf1322', borderColor: '#cf1322' } 
      }}
      cancelText="Hủy"
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 16 }}
      >
        {/* Chọn sản phẩm */}
        <Form.Item
          name="productId"
          label="Sản phẩm"
          rules={[{ required: true, message: 'Vui lòng chọn sản phẩm!' }]}
        >
          <Select
            placeholder="Chọn sản phẩm"
            onChange={handleProductChange}
            showSearch
            optionFilterProp="children"
          >
            {products.map(product => (
              <Select.Option key={product.id} value={product.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{product.code} - {product.name}</span>
                  <Text type="secondary">{product.unit}</Text>
                </div>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* Thông tin sản phẩm đã chọn */}
        {selectedProduct && (
          <Card size="small" style={{ marginBottom: 16, background: '#f5f5f5' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Mã SP:</Text>
                <Text strong style={{ color: '#1890ff' }}>{selectedProduct.code}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Đơn vị tính:</Text>
                <Tag>{selectedProduct.unit}</Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Giá nhập gần nhất:</Text>
                <Text>{formatCurrency(selectedProduct.buyPrice)}</Text>
              </div>
            </Space>
          </Card>
        )}

        {/* Nhà cung cấp (chỉ khi nhập kho) */}
        {isImport && (
          <Form.Item
            name="supplierId"
            label="Nhà cung cấp"
            rules={[{ required: true, message: 'Vui lòng chọn nhà cung cấp!' }]}
          >
            <Select
              placeholder="Chọn nhà cung cấp"
              showSearch
              optionFilterProp="children"
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
        )}

        {/* Số lượng và đơn giá */}
        <Space style={{ width: '100%' }} size={16}>
          <Form.Item
            name="quantity"
            label="Số lượng"
            rules={[
              { required: true, message: 'Vui lòng nhập số lượng!' },
              { type: 'number', min: 1, message: 'Số lượng tối thiểu là 1!' }
            ]}
            style={{ flex: 1 }}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              placeholder="0"
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              addonAfter={selectedProduct?.unit || 'ĐVT'}
            />
          </Form.Item>

          <Form.Item
            name="price"
            label={isImport ? 'Giá nhập' : 'Giá xuất'}
            rules={[
              { required: true, message: 'Vui lòng nhập giá!' },
              { type: 'number', min: 0, message: 'Giá không hợp lệ!' }
            ]}
            style={{ flex: 1 }}
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
        </Space>

        {/* Tổng tiền */}
        <Card 
          size="small" 
          style={{ 
            marginBottom: 16, 
            background: isImport ? '#f6ffed' : '#fff1f0',
            border: `1px solid ${isImport ? '#b7eb8f' : '#ffa39e'}`
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text strong>Tổng tiền:</Text>
            <Title level={3} style={{ margin: 0, color: isImport ? '#52c41a' : '#cf1322' }}>
              {formatCurrency(totalAmount)}
            </Title>
          </div>
        </Card>

        {/* Ghi chú */}
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
      </Form>
    </Modal>
  );
};

export default TransactionFormModal;
