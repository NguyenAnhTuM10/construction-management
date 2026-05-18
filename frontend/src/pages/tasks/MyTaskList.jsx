// src/pages/tasks/MyTaskList.jsx
import { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Input, message, Tag, Tooltip, Card, 
  Row, Col, Statistic, Select, Modal, Form, Progress, Typography 
} from 'antd';
import { 
  SearchOutlined, ReloadOutlined, CheckCircleOutlined, 
  ClockCircleOutlined, ExclamationCircleOutlined, EyeOutlined,
  SendOutlined, PlayCircleOutlined
} from '@ant-design/icons';
import { PageHeader, Loading } from '../../components/common';
import { formatDateTime, formatDate } from '../../utils/formatters';
import taskApi from '../../api/taskApi';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Text } = Typography;

const TASK_STATUS = {
  TODO: { label: 'Cần làm', color: 'default', icon: <ClockCircleOutlined /> },
  IN_PROGRESS: { label: 'Đang làm', color: 'processing', icon: <ClockCircleOutlined /> },
  REVIEW: { label: 'Chờ duyệt', color: 'warning', icon: <ExclamationCircleOutlined /> },
  COMPLETED: { label: 'Hoàn thành', color: 'success', icon: <CheckCircleOutlined /> },
};

const TASK_PRIORITY = {
  LOW: { label: 'Thấp', color: 'default' },
  MEDIUM: { label: 'Trung bình', color: 'blue' },
  HIGH: { label: 'Cao', color: 'orange' },
  URGENT: { label: 'Khẩn cấp', color: 'red' },
};

const MyTaskList = () => {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitForm] = Form.useForm();

  useEffect(() => { 
    fetchMyTasks(); 
  }, []);

  const fetchMyTasks = async () => {
    setLoading(true);
    try {
      const response = await taskApi.getMyTasks();
      setTasks(Array.isArray(response.data) ? response.data : []);
    } catch (error) { 
      message.error(error.message || 'Không thể tải danh sách công việc'); 
    } finally { 
      setLoading(false); 
    }
  };

  // Xem chi tiết task
  const handleViewDetail = async (record) => {
    try {
      const res = await taskApi.getById(record.id);
      setSelectedTask(res.data || res);
      setDetailModalVisible(true);
    } catch (error) { 
      message.error('Không thể tải chi tiết công việc'); 
    }
  };

  // Bắt đầu làm task (TODO -> IN_PROGRESS)
  const handleStartTask = async (record) => {
    try {
      await taskApi.submitResult(record.id, { 
        status: 'IN_PROGRESS',
         result: 'Bắt đầu thực hiện công việc', 
        note: 'Bắt đầu thực hiện công việc'
      });
      message.success('Đã bắt đầu công việc!');
      fetchMyTasks();
    } catch (error) { 
      message.error(error.message || 'Có lỗi xảy ra'); 
    }
  };

  // Mở modal nộp kết quả
  const handleOpenSubmitModal = (record) => {
    setSelectedTask(record);
    submitForm.resetFields();
    submitForm.setFieldsValue({
      progress: record.progress || 0,
    });
    setSubmitModalVisible(true);
  };

  // Nộp kết quả task
  const handleSubmitResult = async () => {
    try {
      const values = await submitForm.validateFields();
      setSubmitLoading(true);

      await taskApi.submitResult(selectedTask.id, {
        progress: values.progress,
        result: values.result,
        note: values.note,
        status: values.progress === 100 ? 'REVIEW' : 'IN_PROGRESS'
      });

      message.success(
        values.progress === 100 
          ? 'Đã gửi kết quả để duyệt!' 
          : 'Đã cập nhật tiến độ!'
      );
      setSubmitModalVisible(false);
      fetchMyTasks();
    } catch (error) {
      message.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchSearch = !searchText || 
      (task.title || '').toLowerCase().includes(searchText.toLowerCase());
    const matchStatus = !filterStatus || task.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Statistics
  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'TODO').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    review: tasks.filter(t => t.status === 'REVIEW').length,
    COMPLETED: tasks.filter(t => t.status === 'COMPLETED').length,
    overdue: tasks.filter(t => {
      return t.status !== 'COMPLETED' && 
             t.status !== 'CANCELLED' && 
             dayjs(t.deadline).isBefore(dayjs(), 'day');
    }).length
  };

  // Check if task is overdue
  const isOverdue = (task) => {
    return task.status !== 'COMPLETED' && 
           task.status !== 'CANCELLED' && 
           dayjs(task.deadline).isBefore(dayjs(), 'day');
  };

  const columns = [
    { 
      title: 'Tiêu đề', 
      dataIndex: 'title', 
      key: 'title', 
      width: 280,
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ cursor: 'pointer' }} onClick={() => handleViewDetail(record)}>
            {text}
          </Text>
          {record.tags?.length > 0 && (
            <Space size={2} style={{ marginTop: 4 }}>
              {record.tags.slice(0, 2).map(tag => (
                <Tag key={tag} style={{ fontSize: 10 }}>{tag}</Tag>
              ))}
            </Space>
          )}
        </Space>
      )
    },
    { 
      title: 'Trạng thái', 
      dataIndex: 'status', 
      key: 'status', 
      width: 120,
      render: (status) => {
        const config = TASK_STATUS[status] || { label: status, color: 'default' };
        return <Tag color={config.color} icon={config.icon}>{config.label}</Tag>;
      }
    },
    { 
      title: 'Độ ưu tiên', 
      dataIndex: 'priority', 
      key: 'priority', 
      width: 110,
      render: (priority) => {
        const config = TASK_PRIORITY[priority] || { label: priority, color: 'default' };
        return <Tag color={config.color}>{config.label}</Tag>;
      }
    },
    { 
      title: 'Tiến độ', 
      dataIndex: 'progress', 
      key: 'progress', 
      width: 120,
      render: (progress, record) => (
        <Progress 
          percent={progress || 0} 
          size="small" 
          status={isOverdue(record) ? 'exception' : progress === 100 ? 'success' : 'active'}
        />
      )
    },
    { 
      title: 'Deadline', 
      dataIndex: 'deadline', 
      key: 'deadline', 
      width: 140,
      render: (date, record) => {
        const overdue = isOverdue(record);
        const daysLeft = dayjs(date).diff(dayjs(), 'day');
        return (
          <Space direction="vertical" size={0}>
            <Text style={{ color: overdue ? '#cf1322' : undefined }}>
              {overdue && <ExclamationCircleOutlined style={{ marginRight: 4 }} />}
              {formatDate(date)}
            </Text>
            {!overdue && record.status !== 'COMPLETED' && daysLeft >= 0 && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                Còn {daysLeft} ngày
              </Text>
            )}
          </Space>
        );
      }
    },
    { 
      title: 'Người giao', 
      dataIndex: 'assignerName', 
      key: 'assignerName', 
      width: 130,
    },
    { 
      title: 'Thao tác', 
      key: 'actions', 
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => handleViewDetail(record)} 
            />
          </Tooltip>
          
          {/* Nút Bắt đầu - chỉ hiện khi TODO */}
          {record.status === 'TODO' && (
            <Tooltip title="Bắt đầu làm">
              <Button 
                type="primary" 
                ghost
                size="small"
                icon={<PlayCircleOutlined />} 
                onClick={() => handleStartTask(record)}
              >
                Bắt đầu
              </Button>
            </Tooltip>
          )}
          
          {/* Nút Cập nhật - chỉ hiện khi IN_PROGRESS */}
          {record.status === 'IN_PROGRESS' && (
            <Tooltip title="Cập nhật tiến độ / Nộp kết quả">
              <Button 
                type="primary" 
                size="small"
                icon={<SendOutlined />} 
                onClick={() => handleOpenSubmitModal(record)}
              >
                Cập nhật
              </Button>
            </Tooltip>
          )}

          {/* Chờ duyệt - chỉ hiện text */}
          {record.status === 'REVIEW' && (
            <Tag color="warning">Đang chờ duyệt</Tag>
          )}

          {/* Hoàn thành */}
          {record.status === 'COMPLETED' && (
            <Tag color="success" icon={<CheckCircleOutlined />}>Đã hoàn thành</Tag>
          )}
        </Space>
      )
    }
  ];

  if (loading) return <Loading tip="Đang tải danh sách công việc..." />;

  return (
    <div>
      <PageHeader 
        title="Công việc của tôi" 
        subtitle="Xem và cập nhật tiến độ công việc được giao" 
        breadcrumbs={[{ title: 'Công việc' }, { title: 'Của tôi' }]}
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchMyTasks}>
            Làm mới
          </Button>
        }
      />

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={4}>
          <Card size="small" hoverable>
            <Statistic 
              title="Tổng" 
              value={stats.total} 
              valueStyle={{ color: '#1890ff' }} 
            />
          </Card>
        </Col>
        <Col xs={12} sm={4}>
          <Card size="small" hoverable>
            <Statistic 
              title="Cần làm" 
              value={stats.todo} 
              prefix={<ClockCircleOutlined />} 
              valueStyle={{ color: '#8c8c8c' }} 
            />
          </Card>
        </Col>
        <Col xs={12} sm={4}>
          <Card size="small" hoverable>
            <Statistic 
              title="Đang làm" 
              value={stats.inProgress} 
              prefix={<ClockCircleOutlined />} 
              valueStyle={{ color: '#1890ff' }} 
            />
          </Card>
        </Col>
        <Col xs={12} sm={4}>
          <Card size="small" hoverable>
            <Statistic 
              title="Chờ duyệt" 
              value={stats.review} 
              prefix={<ExclamationCircleOutlined />} 
              valueStyle={{ color: '#faad14' }} 
            />
          </Card>
        </Col>
        <Col xs={12} sm={4}>
          <Card size="small" hoverable>
            <Statistic 
              title="Hoàn thành" 
              value={stats.COMPLETED} 
              prefix={<CheckCircleOutlined />} 
              valueStyle={{ color: '#52c41a' }} 
            />
          </Card>
        </Col>
        <Col xs={12} sm={4}>
          <Card size="small" hoverable>
            <Statistic 
              title="Quá hạn" 
              value={stats.overdue} 
              prefix={<ExclamationCircleOutlined />} 
              valueStyle={{ color: '#cf1322' }} 
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input.Search 
            placeholder="Tìm theo tiêu đề..." 
            prefix={<SearchOutlined />} 
            value={searchText} 
            onChange={(e) => setSearchText(e.target.value)} 
            style={{ width: 250 }} 
            allowClear 
          />
          <Select 
            placeholder="Trạng thái" 
            value={filterStatus} 
            onChange={setFilterStatus} 
            style={{ width: 150 }} 
            allowClear
          >
            {Object.entries(TASK_STATUS).map(([key, val]) => (
              <Select.Option key={key} value={key}>{val.label}</Select.Option>
            ))}
          </Select>
        </Space>
      </Card>

      {/* Table */}
      <Card>
        <Table 
          columns={columns} 
          dataSource={filteredTasks} 
          rowKey="id" 
          pagination={{ 
            pageSize: 10, 
            showTotal: (t) => `Tổng ${t} công việc` 
          }}
          rowClassName={(record) => isOverdue(record) ? 'table-row-overdue' : ''}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title="Chi tiết công việc"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Đóng
          </Button>
        ]}
        width={700}
      >
        {selectedTask && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Row justify="space-between" align="middle">
                <Col>
                  <Text strong style={{ fontSize: 18 }}>{selectedTask.title}</Text>
                </Col>
                <Col>
                  <Space>
                    <Tag color={TASK_PRIORITY[selectedTask.priority]?.color}>
                      {TASK_PRIORITY[selectedTask.priority]?.label}
                    </Tag>
                    <Tag color={TASK_STATUS[selectedTask.status]?.color}>
                      {TASK_STATUS[selectedTask.status]?.label}
                    </Tag>
                  </Space>
                </Col>
              </Row>
            </Card>

            {selectedTask.description && (
              <Card size="small" title="Mô tả" style={{ marginBottom: 16 }}>
                <Text>{selectedTask.description}</Text>
              </Card>
            )}

            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" title="Thông tin">
                  <p><Text type="secondary">Người giao:</Text> {selectedTask.assignerName}</p>
                  <p><Text type="secondary">Ngày tạo:</Text> {formatDateTime(selectedTask.createdDate)}</p>
                  <p><Text type="secondary">Deadline:</Text> {formatDate(selectedTask.deadline)}</p>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Tiến độ">
                  <Progress 
                    percent={selectedTask.progress || 0} 
                    status={isOverdue(selectedTask) ? 'exception' : 'active'}
                  />
                </Card>
              </Col>
            </Row>

            {selectedTask.result && (
              <Card size="small" title="Kết quả đã nộp" style={{ marginTop: 16 }}>
                <Text>{selectedTask.result}</Text>
              </Card>
            )}
          </div>
        )}
      </Modal>

      {/* Submit Result Modal */}
      <Modal
        title="Cập nhật tiến độ / Nộp kết quả"
        open={submitModalVisible}
        onOk={handleSubmitResult}
        onCancel={() => setSubmitModalVisible(false)}
        confirmLoading={submitLoading}
        okText="Gửi"
        cancelText="Hủy"
      >
        <Form form={submitForm} layout="vertical">
          <Form.Item
            name="progress"
            label="Tiến độ hoàn thành (%)"
            rules={[{ required: true, message: 'Vui lòng chọn tiến độ!' }]}
          >
            <Select>
              {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(val => (
                <Select.Option key={val} value={val}>
                  {val}% {val === 100 && '- Hoàn thành'}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="result"
            label="Kết quả công việc"
            rules={[
              { 
                required: submitForm.getFieldValue('progress') === 100, 
                message: 'Vui lòng nhập kết quả khi hoàn thành 100%!' 
              }
            ]}
          >
            <TextArea 
              rows={4} 
              placeholder="Mô tả kết quả công việc đã thực hiện..."
              maxLength={1000}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="note"
            label="Ghi chú thêm"
          >
            <TextArea 
              rows={2} 
              placeholder="Ghi chú thêm (nếu có)..."
              maxLength={500}
            />
          </Form.Item>
        </Form>

        <Card size="small" style={{ backgroundColor: '#fffbe6', border: '1px solid #ffe58f' }}>
          <Text type="secondary">
            💡 Khi chọn tiến độ 100%, công việc sẽ được chuyển sang trạng thái "Chờ duyệt" 
            để Admin xem xét.
          </Text>
        </Card>
      </Modal>

      <style>{`
        .table-row-overdue {
          background-color: #fff1f0 !important;
        }
        .table-row-overdue:hover > td {
          background-color: #ffccc7 !important;
        }
      `}</style>
    </div>
  );
};

export default MyTaskList;