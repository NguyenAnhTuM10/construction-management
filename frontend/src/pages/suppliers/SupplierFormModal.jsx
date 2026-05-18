import { useState, useEffect } from 'react';
import { Modal, Form, Input, Row, Col, Divider } from 'antd';
import { 
  ShopOutlined, UserOutlined, PhoneOutlined, 
  MailOutlined, HomeOutlined, BankOutlined
} from '@ant-design/icons';

const { TextArea } = Input;

const SupplierFormModal = ({ visible, supplier, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  
  const isEditing = !!supplier;

  useEffect(() => {
    if (visible) {
      if (supplier) {
        form.setFieldsValue({
          name: supplier.name,
          contactPerson: supplier.contactPerson,
          phone: supplier.phone,
          email: supplier.email,
          address: supplier.address,
          bankAccount: supplier.bankAccount,
          bankName: supplier.bankName
        });
      } else {
        form.resetFields();
      }
    }
  }, [visible, supplier, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
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
      title={isEditing ? `Sửa: ${supplier?.name}` : 'Thêm nhà cung cấp mới'}
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
        <Form.Item
          name="name"
          label="Tên nhà cung cấp"
          rules={[
            { required: true, message: 'Vui lòng nhập tên!' },
            { min: 2, message: 'Tên tối thiểu 2 ký tự!' },
            { max: 200, message: 'Tên tối đa 200 ký tự!' }
          ]}
        >
          <Input 
            prefix={<ShopOutlined />}
            placeholder="Nhập tên công ty/cơ sở cung cấp"
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="contactPerson"
              label="Người liên hệ"
              rules={[
                { required: true, message: 'Vui lòng nhập tên người liên hệ!' }
              ]}
            >
              <Input 
                prefix={<UserOutlined />}
                placeholder="Tên người đại diện"
              />
            </Form.Item>
          </Col>
          
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
        </Row>

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
            placeholder="email@company.com"
          />
        </Form.Item>

        <Form.Item
          name="address"
          label="Địa chỉ"
          rules={[
            { max: 255, message: 'Địa chỉ tối đa 255 ký tự!' }
          ]}
        >
          <TextArea 
            placeholder="Nhập địa chỉ chi tiết"
            rows={2}
            showCount
            maxLength={255}
          />
        </Form.Item>

        <Divider>Thông tin ngân hàng (để thanh toán)</Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="bankName"
              label="Tên ngân hàng"
            >
              <Input 
                prefix={<BankOutlined />}
                placeholder="VD: Vietcombank, Techcombank..."
              />
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item
              name="bankAccount"
              label="Số tài khoản"
            >
              <Input 
                placeholder="Số tài khoản ngân hàng"
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default SupplierFormModal;
