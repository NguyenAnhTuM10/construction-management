import { useState, useEffect } from 'react';
import { Modal, Form, InputNumber, Row, Col, Divider, Card, Typography, Alert, Space } from 'antd';
import { SettingOutlined, PercentageOutlined, DollarOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { formatCurrency } from '../../utils/formatters';

const { Text, Title } = Typography;

const KPIConfigModal = ({ visible, config, onCancel, onSave }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && config) {
      form.setFieldsValue(config);
    }
  }, [visible, config, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      onSave(values);
    } catch (error) {
      console.error('Validation error:', error);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <SettingOutlined style={{ color: '#1890ff' }} />
          Cấu hình KPI & Lương
        </Space>
      }
      open={visible}
      onOk={handleSave}
      onCancel={onCancel}
      okText="Lưu cấu hình"
      cancelText="Hủy"
      width={700}
    >
      <Alert
        message="Lưu ý"
        description="Các thay đổi cấu hình sẽ áp dụng cho việc tính lương mới. Bảng lương đã tạo sẽ không bị ảnh hưởng."
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 16 }}
      />

      <Form form={form} layout="vertical">
        {/* KPI Config */}
        <Card size="small" title="Cấu hình thưởng KPI" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="kpiBonusPercent"
                label="% thưởng KPI (tính trên lương CB)"
                rules={[{ required: true }]}
                tooltip="Nếu KPI = 100% thì thưởng = X% × Lương cơ bản"
              >
                <InputNumber
                  min={0}
                  max={100}
                  style={{ width: '100%' }}
                  addonAfter="%"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="salesCommissionPercent"
                label="% hoa hồng doanh số"
                rules={[{ required: true }]}
                tooltip="Phần trăm hoa hồng tính trên doanh số thực tế"
              >
                <InputNumber
                  min={0}
                  max={10}
                  step={0.1}
                  style={{ width: '100%' }}
                  addonAfter="%"
                />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
            <Text type="secondary">
              <strong>Công thức tính thưởng KPI:</strong><br />
              Thưởng KPI = (Điểm KPI / 100) × (% thưởng KPI) × Lương cơ bản<br />
              <br />
              <strong>Ví dụ:</strong> KPI = 110%, % thưởng = 10%, Lương CB = 20,000,000<br />
              → Thưởng = (110/100) × (10/100) × 20,000,000 = <strong>{formatCurrency(2200000)}</strong>
            </Text>
          </div>
        </Card>

        {/* Overtime Config */}
        <Card size="small" title="Cấu hình tăng ca" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="overtimeRate"
                label="Hệ số lương tăng ca"
                rules={[{ required: true }]}
                tooltip="Hệ số nhân với lương giờ bình thường"
              >
                <InputNumber
                  min={1}
                  max={3}
                  step={0.1}
                  style={{ width: '100%' }}
                  addonAfter="x"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <div style={{ paddingTop: 30 }}>
                <Text type="secondary">
                  Lương tăng ca = Số giờ × (Lương CB / 22 / 8) × Hệ số
                </Text>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Allowances Config */}
        <Card size="small" title="Cấu hình phụ cấp" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="mealAllowance"
                label="Phụ cấp ăn trưa"
                rules={[{ required: true }]}
              >
                <InputNumber
                  min={0}
                  step={100000}
                  style={{ width: '100%' }}
                  formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={v => v.replace(/\$\s?|(,*)/g, '')}
                  addonAfter="đ"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="transportAllowance"
                label="Phụ cấp đi lại"
                rules={[{ required: true }]}
              >
                <InputNumber
                  min={0}
                  step={100000}
                  style={{ width: '100%' }}
                  formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={v => v.replace(/\$\s?|(,*)/g, '')}
                  addonAfter="đ"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="phoneAllowance"
                label="Phụ cấp điện thoại"
                rules={[{ required: true }]}
                tooltip="Chỉ áp dụng cho cấp Trưởng phòng trở lên"
              >
                <InputNumber
                  min={0}
                  step={100000}
                  style={{ width: '100%' }}
                  formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={v => v.replace(/\$\s?|(,*)/g, '')}
                  addonAfter="đ"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Deductions Config */}
        <Card size="small" title="Cấu hình khấu trừ">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="insurancePercent"
                label="% BHXH, BHYT, BHTN"
                rules={[{ required: true }]}
                tooltip="Phần trăm đóng bảo hiểm tính trên lương cơ bản"
              >
                <InputNumber
                  min={0}
                  max={30}
                  step={0.5}
                  style={{ width: '100%' }}
                  addonAfter="%"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="latePenaltyPerTime"
                label="Phạt đi muộn (mỗi lần)"
                rules={[{ required: true }]}
              >
                <InputNumber
                  min={0}
                  step={50000}
                  style={{ width: '100%' }}
                  formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={v => v.replace(/\$\s?|(,*)/g, '')}
                  addonAfter="đ"
                />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ background: '#fff1f0', padding: 12, borderRadius: 4 }}>
            <Text type="secondary">
              <strong>Thuế TNCN:</strong> Áp dụng 10% cho phần thu nhập chịu thuế &gt; 11,000,000đ<br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                (Công thức đơn giản hóa, thực tế cần tính theo biểu thuế lũy tiến)
              </Text>
            </Text>
          </div>
        </Card>
      </Form>
    </Modal>
  );
};

export default KPIConfigModal;
