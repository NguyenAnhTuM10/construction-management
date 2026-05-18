import { useState, useEffect } from 'react';
import { Modal, Form, Input, Row, Col } from 'antd';
import { 
  UserOutlined, PhoneOutlined, MailOutlined, HomeOutlined
} from '@ant-design/icons';

const CustomerFormModal = ({ visible, customer, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  
  const isEditing = !!customer;

  useEffect(() => {
    if (visible) {
      if (customer) {
        form.setFieldsValue({
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          address: customer.address
        });
      } else {
        form.resetFields();
      }
    }
  }, [visible, customer, form]);

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

  return (
    <Modal
      title={isEditing ? `Sửa thông tin: ${customer?.name}` : 'Thêm khách hàng mới'}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      okText={isEditing ? 'Cập nhật' : 'Tạo mới'}
      cancelText="Hủy"
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 16 }}
      >
        <Form.Item
          name="name"
          label="Tên khách hàng"
          rules={[
            { required: true, message: 'Vui lòng nhập tên khách hàng!' },
            { min: 2, message: 'Tên tối thiểu 2 ký tự!' },
            { max: 100, message: 'Tên tối đa 100 ký tự!' }
          ]}
        >
          <Input 
            prefix={<UserOutlined />}
            placeholder="Nhập tên khách hàng hoặc công ty"
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="phone"
              label="Số điện thoại"
              rules={[
                { required: true, message: 'Vui lòng nhập số điện thoại!' },
                { 
                  pattern: /^(\+84|0)[0-9]{9,10}$/, 
                  message: 'Số điện thoại không hợp lệ!' 
                }
              ]}
            >
              <Input 
                prefix={<PhoneOutlined />}
                placeholder="0901234567"
              />
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { type: 'email', message: 'Email không hợp lệ!' },
                { max: 100, message: 'Email tối đa 100 ký tự!' }
              ]}
            >
              <Input 
                prefix={<MailOutlined />}
                placeholder="email@example.com"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="address"
          label="Địa chỉ"
          rules={[
            { max: 255, message: 'Địa chỉ tối đa 255 ký tự!' }
          ]}
        >
          <Input.TextArea 
            placeholder="Nhập địa chỉ chi tiết"
            rows={3}
            showCount
            maxLength={255}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CustomerFormModal;
