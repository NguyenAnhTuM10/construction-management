import { useState, useEffect } from 'react';
import { 
  Modal, Form, Input, Select, DatePicker, Row, Col, 
  Slider, Tag, Space, Typography
} from 'antd';
import { 
  FileTextOutlined, UserOutlined, FlagOutlined, CalendarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Text } = Typography;

const TASK_PRIORITY = {
  LOW: { label: 'Thấp', color: 'default' },
  MEDIUM: { label: 'Trung bình', color: 'blue' },
  HIGH: { label: 'Cao', color: 'orange' },
  URGENT: { label: 'Khẩn cấp', color: 'red' },
};

const SUGGESTED_TAGS = [
  'Kinh doanh', 'Kế toán', 'Kho vận', 'Quản lý', 
  'Khách hàng VIP', 'Báo cáo', 'Nhập hàng', 'Xuất hàng',
  'Công nợ', 'Báo giá', 'Bảo trì', 'Họp', 'Quan trọng'
];

const TaskFormModal = ({ visible, task, employees, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const isEditing = !!task;

  useEffect(() => {
    if (visible) {
      if (task) {
        form.setFieldsValue({
          title: task.title,
          description: task.description,
          assigneeId: task.assigneeId,
          priority: task.priority,
          dueDate: task.dueDate ? dayjs(task.dueDate) : null,
          startDate: task.startDate ? dayjs(task.startDate) : null,
          progress: task.progress,
          tags: task.tags || []
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          priority: 'MEDIUM',
          progress: 0,
          tags: []
        });
      }
    }
  }, [visible, task, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const taskData = {
        title: values.title,
        description: values.description,
        assigneeId: values.assigneeId,
        priority: values.priority,
        dueDate: values.dueDate?.format('YYYY-MM-DD'),
        startDate: values.startDate?.format('YYYY-MM-DD'),
        progress: values.progress || 0,
        tags: values.tags || []
      };

      setTimeout(() => {
        onSuccess(taskData);
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
          <FileTextOutlined style={{ color: '#1890ff' }} />
          {isEditing ? 'Sửa công việc' : 'Tạo công việc mới'}
        </Space>
      }
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      okText={isEditing ? 'Cập nhật' : 'Tạo công việc'}
      cancelText="Hủy"
      width={700}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="title"
          label="Tiêu đề công việc"
          rules={[
            { required: true, message: 'Vui lòng nhập tiêu đề!' },
            { min: 5, message: 'Tiêu đề tối thiểu 5 ký tự!' },
            { max: 200, message: 'Tiêu đề tối đa 200 ký tự!' }
          ]}
        >
          <Input placeholder="Nhập tiêu đề công việc" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Mô tả chi tiết"
          rules={[{ max: 1000, message: 'Mô tả tối đa 1000 ký tự!' }]}
        >
          <TextArea 
            rows={3} 
            placeholder="Mô tả chi tiết công việc cần làm..."
            maxLength={1000}
            showCount
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="assigneeId"
              label={<><UserOutlined /> Người thực hiện</>}
              rules={[{ required: true, message: 'Vui lòng chọn người thực hiện!' }]}
            >
              <Select placeholder="Chọn nhân viên" showSearch optionFilterProp="children">
                {employees.map(emp => (
                  <Select.Option key={emp.id} value={emp.id}>
                    <Space>
                      <UserOutlined />
                      {emp.code} - {emp.name}
                      <Text type="secondary" style={{ fontSize: 11 }}>({emp.departmentName})</Text>
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="priority"
              label={<><FlagOutlined /> Độ ưu tiên</>}
              rules={[{ required: true }]}
            >
              <Select placeholder="Chọn độ ưu tiên">
                {Object.entries(TASK_PRIORITY).map(([key, value]) => (
                  <Select.Option key={key} value={key}>
                    <Tag color={value.color}>{value.label}</Tag>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="startDate"
              label={<><CalendarOutlined /> Ngày bắt đầu</>}
            >
              <DatePicker 
                style={{ width: '100%' }} 
                format="DD/MM/YYYY"
                placeholder="Chọn ngày bắt đầu"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="dueDate"
              label={<><CalendarOutlined /> Hạn hoàn thành</>}
              rules={[{ required: true, message: 'Vui lòng chọn hạn hoàn thành!' }]}
            >
              <DatePicker 
                style={{ width: '100%' }} 
                format="DD/MM/YYYY"
                placeholder="Chọn ngày deadline"
              />
            </Form.Item>
          </Col>
        </Row>

        {isEditing && (
          <Form.Item
            name="progress"
            label={`Tiến độ: ${form.getFieldValue('progress') || 0}%`}
          >
            <Slider
              min={0}
              max={100}
              step={10}
              marks={{ 0: '0%', 25: '25%', 50: '50%', 75: '75%', 100: '100%' }}
            />
          </Form.Item>
        )}

        <Form.Item
          name="tags"
          label="Nhãn (Tags)"
        >
          <Select
            mode="tags"
            placeholder="Chọn hoặc nhập tags"
            style={{ width: '100%' }}
          >
            {SUGGESTED_TAGS.map(tag => (
              <Select.Option key={tag} value={tag}>{tag}</Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TaskFormModal;
