import { useState, useEffect } from 'react';
import { Table, Button, Space, Input, message, Tag, Tooltip, Card, Row, Col, Statistic, Select, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { PageHeader, Loading } from '../../components/common';
import { formatDateTime } from '../../utils/formatters';
import TaskFormModal from './TaskFormModal';
import TaskDetailModal from './TaskDetailModal';
import taskApi from '../../api/taskApi';
import employeeApi from '../../api/employeeApi';

const TASK_STATUS = {
  TODO: { label: 'Cần làm', color: 'default' },
  IN_PROGRESS: { label: 'Đang làm', color: 'processing' },
  REVIEW: { label: 'Chờ duyệt', color: 'warning' },
  COMPLETED: { label: 'Hoàn thành', color: 'success' },
};

const TASK_PRIORITY = {
  LOW: { label: 'Thấp', color: 'default' },
  MEDIUM: { label: 'Trung bình', color: 'blue' },
  HIGH: { label: 'Cao', color: 'orange' },
  URGENT: { label: 'Khẩn cấp', color: 'red' },
};

const TaskList = () => {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState(null);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksRes, empRes] = await Promise.all([taskApi.getAll(), employeeApi.getAll()]);
      setTasks(Array.isArray(tasksRes.data || tasksRes) ? (tasksRes.data || tasksRes) : []);
      setEmployees(Array.isArray(empRes.data || empRes) ? (empRes.data || empRes) : []);
    } catch (error) { message.error(error.message || 'Không thể tải dữ liệu'); }
    finally { setLoading(false); }
  };

  const handleCreate = () => { setSelectedTask(null); setFormModalVisible(true); };
  const handleEdit = (record) => { setSelectedTask(record); setFormModalVisible(true); };
  const handleViewDetail = async (record) => {
    try {
      const res = await taskApi.getById(record.id);
      setSelectedTask(res.data || res);
      setDetailModalVisible(true);
    } catch (error) { message.error('Không thể tải chi tiết'); }
  };

  const handleDelete = async (record) => {
    try {
      await taskApi.delete(record.id);
      setTasks(prev => prev.filter(t => t.id !== record.id));
      message.success('Đã xóa công việc');
    } catch (error) { message.error(error.message || 'Không thể xóa'); }
  };

  const handleUpdateStatus = async (record, newStatus) => {
    try {
      await taskApi.updateStatus(record.id, newStatus);
      setTasks(prev => prev.map(t => t.id === record.id ? { ...t, status: newStatus } : t));
      message.success('Cập nhật trạng thái thành công!');
    } catch (error) { message.error(error.message || 'Có lỗi xảy ra'); }
  };

  const handleFormSuccess = async (data) => {
    try {
      if (selectedTask) {
        const res = await taskApi.update(selectedTask.id, data);
        setTasks(prev => prev.map(t => t.id === selectedTask.id ? (res.data || res) : t));
        message.success('Cập nhật công việc thành công!');
      } else {
        const res = await taskApi.create(data);
        setTasks(prev => [...prev, res.data || res]);
        message.success('Tạo công việc thành công!');
      }
      setFormModalVisible(false);
    } catch (error) { message.error(error.message || 'Có lỗi xảy ra'); }
  };

  const handleStatusChange = async (taskId, newStatus, additionalData = {}) => {
    try {
      // Gọi API submitTaskResult với status mới
      const response = await taskApi.submitResult(taskId, {
        status: newStatus,
        ...additionalData // progress, result, v.v.
      });

      // Cập nhật lại task trong state
      setTasks(prev => prev.map(task => 
        task.id === taskId ? (response.data || response) : task
      ));

      // Đóng modal
      setDetailModalVisible(false);

      // Hiển thị thông báo thành công
      message.success('Cập nhật trạng thái thành công!');

      // Refresh lại data để đảm bảo đồng bộ
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      message.error(error.message || 'Không thể cập nhật trạng thái');
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchSearch = !searchText || (task.title || '').toLowerCase().includes(searchText.toLowerCase());
    const matchStatus = !filterStatus || task.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'TODO').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    COMPLETED: tasks.filter(t => t.status === 'COMPLETED').length,
    overdue: tasks.filter(t => t.isOverdue).length
  };

  const columns = [
    { title: 'Tiêu đề', dataIndex: 'title', key: 'title', width: 250, ellipsis: true },
    { title: 'Người thực hiện', dataIndex: 'assignedToName', key: 'assignedToName', width: 150 },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 120,
      render: (status) => {
        const config = TASK_STATUS[status] || { label: status, color: 'default' };
        return <Tag color={config.color}>{config.label}</Tag>;
      }
    },
    { title: 'Độ ưu tiên', dataIndex: 'priority', key: 'priority', width: 110,
      render: (priority) => {
        const config = TASK_PRIORITY[priority] || { label: priority, color: 'default' };
        return <Tag color={config.color}>{config.label}</Tag>;
      }
    },
    { title: 'Deadline', dataIndex: 'deadline', key: 'deadline', width: 150,
      render: (date, record) => (
        <span style={{ color: record.isOverdue ? '#cf1322' : undefined }}>
          {record.isOverdue && <ExclamationCircleOutlined style={{ marginRight: 4 }} />}
          {formatDateTime(date)}
        </span>
      )
    },
    { title: 'Thao tác', key: 'actions', width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem"><Button type="text" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} /></Tooltip>
          <Tooltip title="Sửa"><Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} /></Tooltip>
          <Popconfirm title="Xác nhận xóa?" onConfirm={() => handleDelete(record)}><Button type="text" danger icon={<DeleteOutlined />} /></Popconfirm>
        </Space>
      )
    }
  ];

  if (loading) return <Loading tip="Đang tải danh sách công việc..." />;

  return (
    <div>
      <PageHeader title="Quản lý công việc" subtitle="Giao việc và theo dõi tiến độ" breadcrumbs={[{ title: 'Nhân sự' }, { title: 'Công việc' }]}
        extra={<Space><Button icon={<ReloadOutlined />} onClick={fetchData}>Làm mới</Button><Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>Giao việc</Button></Space>}
      />
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}><Card size="small" hoverable><Statistic title="Tổng" value={stats.total} valueStyle={{ color: '#1890ff' }} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small" hoverable><Statistic title="Đang làm" value={stats.inProgress} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#1890ff' }} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small" hoverable><Statistic title="Hoàn thành" value={stats.COMPLETED} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small" hoverable><Statistic title="Quá hạn" value={stats.overdue} prefix={<ExclamationCircleOutlined />} valueStyle={{ color: '#cf1322' }} /></Card></Col>
      </Row>
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input.Search placeholder="Tìm theo tiêu đề..." prefix={<SearchOutlined />} value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ width: 250 }} allowClear />
          <Select placeholder="Trạng thái" value={filterStatus} onChange={setFilterStatus} style={{ width: 150 }} allowClear>
            {Object.entries(TASK_STATUS).map(([key, val]) => <Select.Option key={key} value={key}>{val.label}</Select.Option>)}
          </Select>
        </Space>
      </Card>
      <Card><Table columns={columns} dataSource={filteredTasks} rowKey="id" pagination={{ pageSize: 10, showTotal: (t) => `Tổng ${t} công việc` }} /></Card>
      <TaskFormModal visible={formModalVisible} task={selectedTask} employees={employees} onCancel={() => setFormModalVisible(false)} onSuccess={handleFormSuccess} />
      <TaskDetailModal visible={detailModalVisible} task={selectedTask} onStatusChange={handleStatusChange}   onCancel={() => setDetailModalVisible(false)} onUpdateStatus={handleUpdateStatus} />
    </div>
  );
};

export default TaskList;
