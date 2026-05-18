import { Modal, Descriptions, Tag, Space, Button, Typography, Divider, Card, Row, Col, Progress, Timeline, Avatar } from 'antd';
import { 
  EditOutlined, UserOutlined, CalendarOutlined, FlagOutlined,
  CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { formatDate } from '../../utils/formatters';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const TASK_STATUS = {
  TODO: { label: 'Chờ làm', color: 'default', icon: <ClockCircleOutlined /> },
  IN_PROGRESS: { label: 'Đang làm', color: 'processing', icon: <ClockCircleOutlined /> },
  REVIEW: { label: 'Chờ duyệt', color: 'warning', icon: <ExclamationCircleOutlined /> },
  COMPLETED: { label: 'Hoàn thành', color: 'success', icon: <CheckCircleOutlined /> },
  CANCELLED: { label: 'Đã hủy', color: 'error', icon: <ExclamationCircleOutlined /> },
};

const TASK_PRIORITY = {
  LOW: { label: 'Thấp', color: 'default' },
  MEDIUM: { label: 'Trung bình', color: 'blue' },
  HIGH: { label: 'Cao', color: 'orange' },
  URGENT: { label: 'Khẩn cấp', color: 'red' },
};

const TaskDetailModal = ({ visible, task, onCancel, onStatusChange, onEdit }) => {
  if (!task) return null;

  const statusConfig = TASK_STATUS[task.status];
  const priorityConfig = TASK_PRIORITY[task.priority];
  
  const isOverdue = task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && dayjs(task.dueDate).isBefore(dayjs(), 'day');
  const daysRemaining = dayjs(task.dueDate).diff(dayjs(), 'day');

  // Get next available status
  const getNextStatus = () => {
    switch (task.status) {
      case 'TODO': return 'IN_PROGRESS';
      case 'IN_PROGRESS': return 'REVIEW';
      case 'REVIEW': return 'COMPLETED';
      default: return null;
    }
  };

  const nextStatus = getNextStatus();

  return (
    <Modal
      title={
        <Space>
          <span>Chi tiết công việc</span>
          <Tag color={statusConfig.color} icon={statusConfig.icon}>{statusConfig.label}</Tag>
          {isOverdue && <Tag color="red">Quá hạn</Tag>}
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="edit" icon={<EditOutlined />} onClick={onEdit}>Sửa</Button>,
        ...(nextStatus ? [
          <Button 
            key="next" 
            type="primary" 
            icon={<ArrowRightOutlined />}
            onClick={() => {
              onStatusChange(task.id, nextStatus);
              onCancel();
            }}
          >
            Chuyển sang {TASK_STATUS[nextStatus].label}
          </Button>
        ] : []),
        <Button key="close" onClick={onCancel}>Đóng</Button>
      ]}
    >
      {/* Title & Priority */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row align="middle" justify="space-between">
          <Col span={18}>
            <Title level={4} style={{ margin: 0 }}>{task.title}</Title>
            <Space style={{ marginTop: 8 }}>
              {task.tags?.map(tag => <Tag key={tag}>{tag}</Tag>)}
            </Space>
          </Col>
          <Col span={6} style={{ textAlign: 'right' }}>
            <Tag color={priorityConfig.color} icon={<FlagOutlined />} style={{ fontSize: 14, padding: '4px 12px' }}>
              {priorityConfig.label}
            </Tag>
          </Col>
        </Row>
      </Card>

      {/* Description */}
      {task.description && (
        <Card size="small" title="Mô tả" style={{ marginBottom: 16 }}>
          <Paragraph>{task.description}</Paragraph>
        </Card>
      )}

      {/* Info */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card size="small" title="Phân công">
            <Descriptions column={1} size="small">
              <Descriptions.Item label={<><UserOutlined /> Người thực hiện</>}>
                <Space>
                  <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                  <Text strong>{task.assigneeName}</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Người giao">
                {task.assignerName}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {formatDate(task.createdDate)}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small" title="Thời gian">
            <Descriptions column={1} size="small">
              <Descriptions.Item label={<><CalendarOutlined /> Ngày bắt đầu</>}>
                {task.startDate ? formatDate(task.startDate) : <Text type="secondary">Chưa bắt đầu</Text>}
              </Descriptions.Item>
              <Descriptions.Item label="Hạn hoàn thành">
                <Text style={{ color: isOverdue ? '#cf1322' : undefined }}>
                  {formatDate(task.dueDate)}
                  {!isOverdue && daysRemaining >= 0 && (
                    <Text type="secondary"> (còn {daysRemaining} ngày)</Text>
                  )}
                </Text>
              </Descriptions.Item>
              {task.completedDate && (
                <Descriptions.Item label="Ngày hoàn thành">
                  <Text style={{ color: '#52c41a' }}>{formatDate(task.completedDate)}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* Progress */}
      <Card size="small" title="Tiến độ" style={{ marginBottom: 16 }}>
        <Row align="middle" gutter={16}>
          <Col span={18}>
            <Progress 
              percent={task.progress} 
              status={task.progress === 100 ? 'success' : isOverdue ? 'exception' : 'active'}
              strokeWidth={12}
            />
          </Col>
          <Col span={6} style={{ textAlign: 'center' }}>
            <Title level={3} style={{ margin: 0, color: task.progress === 100 ? '#52c41a' : '#1890ff' }}>
              {task.progress}%
            </Title>
          </Col>
        </Row>
      </Card>

      {/* Status Timeline */}
      <Card size="small" title="Lịch sử trạng thái">
        <Timeline
          items={[
            {
              color: 'green',
              children: (
                <>
                  <Text strong>Tạo công việc</Text>
                  <br />
                  <Text type="secondary">{formatDate(task.createdDate)}</Text>
                </>
              )
            },
            ...(task.startDate ? [{
              color: 'blue',
              children: (
                <>
                  <Text strong>Bắt đầu thực hiện</Text>
                  <br />
                  <Text type="secondary">{formatDate(task.startDate)}</Text>
                </>
              )
            }] : []),
            ...(task.status === 'REVIEW' || task.status === 'COMPLETED' ? [{
              color: 'orange',
              children: <Text strong>Gửi duyệt</Text>
            }] : []),
            ...(task.status === 'COMPLETED' ? [{
              color: 'green',
              children: (
                <>
                  <Text strong>Hoàn thành</Text>
                  <br />
                  <Text type="secondary">{formatDate(task.completedDate)}</Text>
                </>
              )
            }] : []),
            ...(task.status === 'CANCELLED' ? [{
              color: 'red',
              children: <Text strong>Đã hủy</Text>
            }] : []),
          ]}
        />
      </Card>

      {/* Quick Status Change */}
      {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
        <Card size="small" title="Chuyển trạng thái nhanh" style={{ marginTop: 16 }}>
          <Space wrap>
            {Object.entries(TASK_STATUS).map(([key, value]) => (
              key !== 'CANCELLED' && (
                <Button
                  key={key}
                  type={task.status === key ? 'primary' : 'default'}
                  disabled={task.status === key}
                  onClick={() => {
                    onStatusChange(task.id, key);
                    onCancel();
                  }}
                >
                  <Tag color={value.color}>{value.label}</Tag>
                </Button>
              )
            ))}
          </Space>
        </Card>
      )}
    </Modal>
  );
};

export default TaskDetailModal;
