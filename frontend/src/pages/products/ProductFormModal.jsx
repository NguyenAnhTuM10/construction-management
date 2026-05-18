import { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, Row, Col, Divider } from 'antd';
import { 
  BarcodeOutlined, ShoppingOutlined, DollarOutlined,
  InboxOutlined
} from '@ant-design/icons';

const ProductFormModal = ({ visible, product, categories, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  
  const isEditing = !!product;

  useEffect(() => {
    if (visible) {
      if (product) {
        form.setFieldsValue({
          code: product.code,
          name: product.name,
          categoryId: product.categoryId,
          unit: product.unit,
          buyPrice: product.buyPrice,
          sellPrice: product.sellPrice,
          stock: product.stock,
          minStock: product.minStock
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          unit: 'cái',
          stock: 0,
          minStock: 10
        });
      }
    }
  }, [visible, product, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        onSuccess(values);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Validation error:', error);
    }
  };

  // Tự động tính lợi nhuận
  const buyPrice = Form.useWatch('buyPrice', form);
  const sellPrice = Form.useWatch('sellPrice', form);
  const profit = sellPrice && buyPrice ? sellPrice - buyPrice : 0;
  const profitPercent = buyPrice ? ((profit / buyPrice) * 100).toFixed(1) : 0;

  return (
    <Modal
      title={isEditing ? `Sửa sản phẩm: ${product?.name}` : 'Thêm sản phẩm mới'}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      okText={isEditing ? 'Cập nhật' : 'Tạo mới'}
      cancelText="Hủy"
      width={700}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 16 }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="code"
              label="Mã sản phẩm"
              rules={[
                { required: true, message: 'Vui lòng nhập mã sản phẩm!' },
                { max: 50, message: 'Mã sản phẩm tối đa 50 ký tự!' }
              ]}
            >
              <Input 
                prefix={<BarcodeOutlined />}
                placeholder="VD: XIM001"
                disabled={isEditing}
              />
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item
              name="categoryId"
              label="Danh mục"
              rules={[{ required: true, message: 'Vui lòng chọn danh mục!' }]}
            >
              <Select placeholder="Chọn danh mục">
                {categories.map(cat => (
                  <Select.Option key={cat.id} value={cat.id}>
                    {cat.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="name"
          label="Tên sản phẩm"
          rules={[
            { required: true, message: 'Vui lòng nhập tên sản phẩm!' },
            { min: 2, message: 'Tên sản phẩm tối thiểu 2 ký tự!' },
            { max: 200, message: 'Tên sản phẩm tối đa 200 ký tự!' }
          ]}
        >
          <Input 
            prefix={<ShoppingOutlined />}
            placeholder="Nhập tên sản phẩm"
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="unit"
              label="Đơn vị tính"
              rules={[{ required: true, message: 'Vui lòng nhập đơn vị!' }]}
            >
              <Select placeholder="Chọn đơn vị">
                <Select.Option value="cái">Cái</Select.Option>
                <Select.Option value="viên">Viên</Select.Option>
                <Select.Option value="bao">Bao</Select.Option>
                <Select.Option value="cây">Cây</Select.Option>
                <Select.Option value="kg">Kg</Select.Option>
                <Select.Option value="m³">m³</Select.Option>
                <Select.Option value="m²">m²</Select.Option>
                <Select.Option value="thùng">Thùng</Select.Option>
                <Select.Option value="hộp">Hộp</Select.Option>
                <Select.Option value="cuộn">Cuộn</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          
          <Col span={8}>
            <Form.Item
              name="stock"
              label="Tồn kho hiện tại"
              rules={[{ required: true, message: 'Vui lòng nhập số lượng!' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                placeholder="0"
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>
          </Col>
          
          <Col span={8}>
            <Form.Item
              name="minStock"
              label="Tồn kho tối thiểu"
              rules={[{ required: true, message: 'Vui lòng nhập!' }]}
              tooltip="Cảnh báo khi tồn kho thấp hơn mức này"
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                placeholder="10"
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider>Giá cả</Divider>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="buyPrice"
              label="Giá nhập"
              rules={[
                { required: true, message: 'Vui lòng nhập giá nhập!' },
                { type: 'number', min: 0, message: 'Giá phải >= 0!' }
              ]}
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
          
          <Col span={8}>
            <Form.Item
              name="sellPrice"
              label="Giá bán"
              rules={[
                { required: true, message: 'Vui lòng nhập giá bán!' },
                { type: 'number', min: 0, message: 'Giá phải >= 0!' }
              ]}
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
          
          <Col span={8}>
            <Form.Item label="Lợi nhuận">
              <div style={{ 
                padding: '8px 12px', 
                background: profit > 0 ? '#f6ffed' : '#fff1f0',
                border: `1px solid ${profit > 0 ? '#b7eb8f' : '#ffa39e'}`,
                borderRadius: 6,
                textAlign: 'center'
              }}>
                <div style={{ 
                  fontWeight: 600, 
                  fontSize: 16,
                  color: profit > 0 ? '#52c41a' : '#cf1322'
                }}>
                  {profit.toLocaleString('vi-VN')} đ
                </div>
                <small style={{ color: '#666' }}>
                  ({profitPercent}%)
                </small>
              </div>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default ProductFormModal;
