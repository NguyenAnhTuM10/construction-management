import { Card, Tag, Space, Avatar, Typography, Progress, Tooltip, Button, Empty } from 'antd';
import { 
  UserOutlined, CalendarOutlined, FlagOutlined, 
  EyeOutlined, EditOutlined, MoreOutlined
} from '@ant-design/icons';
import { formatDate } from '../../utils/formatters';
import dayjs from 'dayjs';

const { Text, Paragraph } = Typography;

const COLUMNS = [
  { key: 'TODO', title: 'Chờ làm', color: '#d9d9d9' },
  { key: 'IN_PROGRESS', title: 'Đang làm', color: '#1890ff' },
  { key: 'REVIEW', title: 'Chờ duyệt', color: '#faad14' },
  { key: 'DONE', title: 'Hoàn thành', color: '#52c41a' },
];

const PRIORITY_COLORS = {
  LOW: '#d9d9d9',
  MEDIUM: '#1890ff',
  HIGH: '#fa8c16',
  URGENT: '#cf1322',
};

const TaskKanban = ({ tasks, onStatusChange, onViewDetail, onEdit }) => {
  
  const isOverdue = (task) => {
    return task.status !== 'DONE' && task.status !== 'CANCELLED' && dayjs(task.dueDate).isBefore(dayjs(), 'day');
  };

  const getTasksByStatus = (status) => {
    return tasks.filter(t => t.status === status);
  };

  const handleDragStart = (e, task) => {
    e.dataTransfer.setData('taskId', task.id.toString());
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    const taskId = parseInt(e.dataTransfer.getData('taskId'));
    if (taskId) {
      onStatusChange(taskId, newStatus);
    }
  };

  const renderTaskCard = (task) => (
    <Card
      key={task.id}
      size="small"
      style={{ 
        marginBottom: 12, 
        cursor: 'grab',
        borderLeft: `4px solid ${PRIORITY_COLORS[task.priority]}`,
        background: isOverdue(task) ? '#fff1f0' : '#fff'
      }}
      draggable
      onDragStart={(e) => handleDragStart(e, task)}
      hoverable
    >
      {/* Title */}
      <div style={{ marginBottom: 8 }}>
        <Text 
          strong 
          style={{ cursor: 'pointer' }}
          onClick={() => onViewDetail(task)}
        >
          {task.title}
        </Text>
        {isOverdue(task) && <Tag color="red" style={{ marginLeft: 8, fontSize: 10 }}>Quá hạn</Tag>}
      </div>

      {/* Tags */}
      <div style={{ marginBottom: 8 }}>
        {task.tags?.slice(0, 2).map(tag => (
          <Tag key={tag} style={{ fontSize: 10, marginBottom: 2 }}>{tag}</Tag>
        ))}
        {task.tags?.length > 2 && <Tag style={{ fontSize: 10 }}>+{task.tags.length - 2}</Tag>}
      </div>

      {/* Progress */}
      {task.status !== 'TODO' && task.status !== 'DONE' && (
        <Progress 
          percent={task.progress} 
          size="small" 
          style={{ marginBottom: 8 }}
          status={isOverdue(task) ? 'exception' : 'active'}
        />
      )}

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space size={4}>
          <Tooltip title={task.assigneeName}>
            <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
          </Tooltip>
          <Tooltip title={`Hạn: ${formatDate(task.dueDate)}`}>
            <Space size={2}>
              <CalendarOutlined style={{ fontSize: 12, color: isOverdue(task) ? '#cf1322' : '#666' }} />
              <Text style={{ fontSize: 11, color: isOverdue(task) ? '#cf1322' : '#666' }}>
                {formatDate(task.dueDate)}
              </Text>
            </Space>
          </Tooltip>
        </Space>
        
        <Space size={0}>
          <Tooltip title="Chi tiết">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => onViewDetail(task)} />
          </Tooltip>
          <Tooltip title="Sửa">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => onEdit(task)} />
          </Tooltip>
        </Space>
      </div>
    </Card>
  );

  return (
    <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
      {COLUMNS.map(column => {
        const columnTasks = getTasksByStatus(column.key);
        return (
          <div 
            key={column.key}
            style={{ 
              flex: '0 0 280px',
              minWidth: 280
            }}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.key)}
          >
            <Card
              title={
                <Space>
                  <div style={{ 
                    width: 12, 
                    height: 12, 
                    borderRadius: '50%', 
                    backgroundColor: column.color 
                  }} />
                  <span>{column.title}</span>
                  <Tag>{columnTasks.length}</Tag>
                </Space>
              }
              size="small"
              style={{ 
                background: '#f5f5f5',
                minHeight: 500
              }}
              bodyStyle={{ padding: 12 }}
            >
              {columnTasks.length > 0 ? (
                columnTasks.map(task => renderTaskCard(task))
              ) : (
                <Empty 
                  image={Empty.PRESENTED_IMAGE_SIMPLE} 
                  description="Không có công việc"
                  style={{ marginTop: 50 }}
                />
              )}
            </Card>
          </div>
        );
      })}
    </div>
  );
};

export default TaskKanban;
