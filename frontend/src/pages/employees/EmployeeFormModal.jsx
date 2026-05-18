import { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, DatePicker, Row, Col, Divider, Radio } from 'antd';
import { UserOutlined, PhoneOutlined, MailOutlined, HomeOutlined, IdcardOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { TextArea } = Input;

const EmployeeFormModal = ({ 
  visible, 
  employee, 
  departments = [],  // ← THÊM giá trị mặc định
  positions = [],    // ← THÊM giá trị mặc định
  onCancel, 
  onSuccess 
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const isEditing = !!employee;

  useEffect(() => {
    if (visible) {
      if (employee) {
        form.setFieldsValue({
          name: employee.name,
          gender: employee.gender,
          birthDate: employee.birthDate ? dayjs(employee.birthDate) : null,
          phone: employee.phone,
          email: employee.email,
          idCard: employee.idCard,
          address: employee.address,
          departmentId: employee.departmentId,
          positionId: employee.positionId,
          baseSalary: employee.baseSalary,
          startDate: employee.startDate ? dayjs(employee.startDate) : null,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ gender: 'male', baseSalary: 10000000, startDate: dayjs() });
      }
    }
  }, [visible, employee, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const employeeData = {
        ...values,
        birthDate: values.birthDate?.format('YYYY-MM-DD'),
        startDate: values.startDate?.format('YYYY-MM-DD'),
      };
      setTimeout(() => {
        onSuccess(employeeData);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Validation error:', error);
    }
  };

  return (
    <Modal
      title={isEditing ? `Sửa: ${employee?.name}` : 'Thêm nhân viên mới'}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      okText={isEditing ? 'Cập nhật' : 'Tạo mới'}
      cancelText="Hủy"
      width={750}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col span={16}>
            <Form.Item name="name" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }, { min: 2, message: 'Tối thiểu 2 ký tự!' }]}>
              <Input prefix={<UserOutlined />} placeholder="Nhập họ và tên" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="gender" label="Giới tính" rules={[{ required: true }]}>
              <Radio.Group>
                <Radio value="male">Nam</Radio>
                <Radio value="female">Nữ</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="birthDate" label="Ngày sinh">
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày sinh" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Vui lòng nhập SĐT!' }, { pattern: /^(\+84|0)[0-9]{9,10}$/, message: 'SĐT không hợp lệ!' }]}>
              <Input prefix={<PhoneOutlined />} placeholder="0901234567" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="idCard" label="Số CCCD/CMND" rules={[{ pattern: /^[0-9]{9,12}$/, message: 'Số CCCD không hợp lệ!' }]}>
              <Input prefix={<IdcardOutlined />} placeholder="079123456789" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Email không hợp lệ!' }]}>
          <Input prefix={<MailOutlined />} placeholder="email@company.com" />
        </Form.Item>

        <Form.Item name="address" label="Địa chỉ">
          <TextArea rows={2} placeholder="Nhập địa chỉ" maxLength={255} showCount />
        </Form.Item>

        <Divider>Thông tin công việc</Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="departmentId" label="Phòng ban" rules={[{ required: true, message: 'Vui lòng chọn phòng ban!' }]}>
              <Select placeholder="Chọn phòng ban">
                {departments.map(d => <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>)}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="positionId" label="Chức vụ">
              <Select placeholder="Chọn chức vụ">
                {positions.map(p => <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>)}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="baseSalary" label="Lương cơ bản" rules={[{ required: true, message: 'Vui lòng nhập lương!' }, { type: 'number', min: 0, message: 'Lương không hợp lệ!' }]}>
              <InputNumber style={{ width: '100%' }} min={0} step={500000} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={v => v.replace(/\$\s?|(,*)/g, '')} addonAfter="đ" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="startDate" label="Ngày vào làm" rules={[{ required: true, message: 'Vui lòng chọn ngày!' }]}>
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default EmployeeFormModal;