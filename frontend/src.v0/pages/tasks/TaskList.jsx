import { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Input, Tag, Card, Row, Col, 
  Statistic, Select, Typography, message, Tooltip, 
  DatePicker, Avatar, Progress, Tabs, Badge
} from 'antd';
import { 
  PlusOutlined, SearchOutlined, ReloadOutlined, 
  CheckCircleOutlined, ClockCircleOutlined, UserOutlined,
  ExclamationCircleOutlined, CalendarOutlined, EyeOutlined,
  EditOutlined, DeleteOutlined, FlagOutlined,
  UnorderedListOutlined, AppstoreOutlined
} from '@ant-design/icons';
import { PageHeader, Loading } from '../../components/common';
import { formatDate } from '../../utils/formatters';
import TaskFormModal from './TaskFormModal';
import TaskDetailModal from './TaskDetailModal';
import TaskKanban from './TaskKanban';
import dayjs from 'dayjs';

const { Text } = Typography;
const { RangePicker } = DatePicker;

// ===================== MOCK DATA =====================
const TASK_STATUS = {
  TODO: { label: 'Chờ làm', color: 'default', icon: <ClockCircleOutlined /> },
  IN_PROGRESS: { label: 'Đang làm', color: 'processing', icon: <ClockCircleOutlined /> },
  REVIEW: { label: 'Chờ duyệt', color: 'warning', icon: <ExclamationCircleOutlined /> },
  DONE: { label: 'Hoàn thành', color: 'success', icon: <CheckCircleOutlined /> },
  CANCELLED: { label: 'Đã hủy', color: 'error', icon: <ExclamationCircleOutlined /> },
};

const TASK_PRIORITY = {
  LOW: { label: 'Thấp', color: 'default' },
  MEDIUM: { label: 'Trung bình', color: 'blue' },
  HIGH: { label: 'Cao', color: 'orange' },
  URGENT: { label: 'Khẩn cấp', color: 'red' },
};

const MOCK_EMPLOYEES = [
  { id: 1, code: 'NV001', name: 'Nguyễn Văn An', departmentName: 'Ban Giám đốc', avatar: null },
  { id: 2, code: 'NV002', name: 'Trần Thị Bình', departmentName: 'Phòng Kinh doanh', avatar: null },
  { id: 3, code: 'NV003', name: 'Lê Văn Cường', departmentName: 'Phòng Kinh doanh', avatar: null },
  { id: 4, code: 'NV004', name: 'Phạm Thị Dung', departmentName: 'Phòng Kế toán', avatar: null },
  { id: 5, code: 'NV005', name: 'Hoàng Văn Em', departmentName: 'Phòng Kế toán', avatar: null },
  { id: 6, code: 'NV006', name: 'Võ Thị Phương', departmentName: 'Phòng Kho vận', avatar: null },
  { id: 7, code: 'NV007', name: 'Đặng Văn Giang', departmentName: 'Phòng Kho vận', avatar: null },
];

const MOCK_TASKS = [
  {
    id: 1,
    title: 'Liên hệ khách hàng Phú Thịnh về đơn hàng mới',
    description: 'Gọi điện tư vấn và chốt đơn hàng xi măng 500 bao cho công trình mới',
    assigneeId: 2,
    assigneeName: 'Trần Thị Bình',
    assignerId: 1,
    assignerName: 'Nguyễn Văn An',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    dueDate: '2024-12-30',
    startDate: '2024-12-20',
    completedDate: null,
    progress: 60,
    tags: ['Kinh doanh', 'Khách hàng VIP'],
    createdDate: '2024-12-18'
  },
  {
    id: 2,
    title: 'Kiểm kê hàng tồn kho cuối tháng',
    description: 'Thực hiện kiểm kê toàn bộ hàng hóa trong kho, đối chiếu với sổ sách',
    assigneeId: 6,
    assigneeName: 'Võ Thị Phương',
    assignerId: 1,
    assignerName: 'Nguyễn Văn An',
    priority: 'URGENT',
    status: 'TODO',
    dueDate: '2024-12-31',
    startDate: null,
    completedDate: null,
    progress: 0,
    tags: ['Kho vận', 'Quan trọng'],
    createdDate: '2024-12-20'
  },
  {
    id: 3,
    title: 'Hoàn thành báo cáo doanh thu tháng 12',
    description: 'Tổng hợp số liệu doanh thu, chi phí và lợi nhuận tháng 12/2024',
    assigneeId: 4,
    assigneeName: 'Phạm Thị Dung',
    assignerId: 1,
    assignerName: 'Nguyễn Văn An',
    priority: 'HIGH',
    status: 'REVIEW',
    dueDate: '2025-01-05',
    startDate: '2024-12-25',
    completedDate: null,
    progress: 90,
    tags: ['Kế toán', 'Báo cáo'],
    createdDate: '2024-12-22'
  },
  {
    id: 4,
    title: 'Nhập hàng từ NCC Thép Việt Nhật',
    description: 'Tiếp nhận và kiểm tra lô hàng thép phi 10, phi 12 - 1000 cây',
    assigneeId: 7,
    assigneeName: 'Đặng Văn Giang',
    assignerId: 6,
    assignerName: 'Võ Thị Phương',
    priority: 'MEDIUM',
    status: 'DONE',
    dueDate: '2024-12-25',
    startDate: '2024-12-24',
    completedDate: '2024-12-25',
    progress: 100,
    tags: ['Kho vận', 'Nhập hàng'],
    createdDate: '2024-12-23'
  },
  {
    id: 5,
    title: 'Gửi báo giá cho Công ty Hoàng Gia',
    description: 'Chuẩn bị và gửi báo giá vật liệu xây dựng cho dự án căn hộ cao cấp',
    assigneeId: 3,
    assigneeName: 'Lê Văn Cường',
    assignerId: 2,
    assignerName: 'Trần Thị Bình',
    priority: 'HIGH',
    status: 'DONE',
    dueDate: '2024-12-22',
    startDate: '2024-12-20',
    completedDate: '2024-12-21',
    progress: 100,
    tags: ['Kinh doanh', 'Báo giá'],
    createdDate: '2024-12-19'
  },
  {
    id: 6,
    title: 'Đối chiếu công nợ khách hàng',
    description: 'Rà soát và gửi xác nhận công nợ cho các khách hàng có dư nợ > 50 triệu',
    assigneeId: 5,
    assigneeName: 'Hoàng Văn Em',
    assignerId: 4,
    assignerName: 'Phạm Thị Dung',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    dueDate: '2025-01-03',
    startDate: '2024-12-26',
    completedDate: null,
    progress: 40,
    tags: ['Kế toán', 'Công nợ'],
    createdDate: '2024-12-24'
  },
  {
    id: 7,
    title: 'Bảo trì xe tải giao hàng',
    description: 'Đưa xe đi bảo dưỡng định kỳ, thay dầu, kiểm tra phanh',
    assigneeId: 7,
    assigneeName: 'Đặng Văn Giang',
    assignerId: 6,
    assignerName: 'Võ Thị Phương',
    priority: 'LOW',
    status: 'TODO',
    dueDate: '2025-01-10',
    startDate: null,
    completedDate: null,
    progress: 0,
    tags: ['Kho vận', 'Bảo trì'],
    createdDate: '2024-12-25'
  },
  {
    id: 8,
    title: 'Theo dõi đơn hàng #9 - Minh Đức',
    description: 'Kiểm tra tiến độ giao hàng và thu tiền đợt 2',
    assigneeId: 2,
    assigneeName: 'Trần Thị Bình',
    assignerId: 1,
    assignerName: 'Nguyễn Văn An',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    dueDate: '2024-12-28',
    startDate: '2024-12-26',
    completedDate: null,
    progress: 30,
    tags: ['Kinh doanh', 'Theo dõi'],
    createdDate: '2024-12-25'
  },
  {
    id: 9,
    title: 'Cập nhật bảng giá mới năm 2025',
    description: 'Điều chỉnh giá bán sản phẩm theo giá nhập mới từ NCC',
    assigneeId: 2,
    assigneeName: 'Trần Thị Bình',
    assignerId: 1,
    assignerName: 'Nguyễn Văn An',
    priority: 'HIGH',
    status: 'TODO',
    dueDate: '2025-01-02',
    startDate: null,
    completedDate: null,
    progress: 0,
    tags: ['Kinh doanh', 'Giá cả'],
    createdDate: '2024-12-26'
  },
  {
    id: 10,
    title: 'Họp tổng kết năm 2024',
    description: 'Chuẩn bị tài liệu và tổ chức họp tổng kết hoạt động kinh doanh năm 2024',
    assigneeId: 1,
    assigneeName: 'Nguyễn Văn An',
    assignerId: 1,
    assignerName: 'Nguyễn Văn An',
    priority: 'URGENT',
    status: 'IN_PROGRESS',
    dueDate: '2025-01-05',
    startDate: '2024-12-27',
    completedDate: null,
    progress: 50,
    tags: ['Quản lý', 'Họp'],
    createdDate: '2024-12-20'
  },
];
// =====================================================

const TaskList = () => {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterPriority, setFilterPriority] = useState(null);
  const [filterAssignee, setFilterAssignee] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    setTimeout(() => {
      setTasks(MOCK_TASKS);
      setLoading(false);
    }, 500);
  };

  // Handlers
  const handleCreate = () => {
    setSelectedTask(null);
    setFormModalVisible(true);
  };

  const handleEdit = (record) => {
    setSelectedTask(record);
    setFormModalVisible(true);
  };

  const handleViewDetail = (record) => {
    setSelectedTask(record);
    setDetailModalVisible(true);
  };

  const handleDelete = (record) => {
    setTasks(prev => prev.filter(t => t.id !== record.id));
    message.success('Đã xóa công việc');
  };

  const handleStatusChange = (taskId, newStatus) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updates = { status: newStatus };
        if (newStatus === 'DONE') {
          updates.completedDate = dayjs().format('YYYY-MM-DD');
          updates.progress = 100;
        }
        if (newStatus === 'IN_PROGRESS' && !t.startDate) {
          updates.startDate = dayjs().format('YYYY-MM-DD');
        }
        return { ...t, ...updates };
      }
      return t;
    }));
    message.success(`Đã chuyển trạng thái thành ${TASK_STATUS[newStatus].label}`);
  };

  const handleFormSuccess = (taskData) => {
    if (selectedTask) {
      setTasks(prev => prev.map(t => 
        t.id === selectedTask.id ? { ...t, ...taskData } : t
      ));
      message.success('Cập nhật công việc thành công!');
    } else {
      const assignee = MOCK_EMPLOYEES.find(e => e.id === taskData.assigneeId);
      const newTask = {
        ...taskData,
        id: Math.max(...tasks.map(t => t.id), 0) + 1,
        assigneeName: assignee?.name,
        assignerId: 1, // Current user
        assignerName: 'Nguyễn Văn An',
        status: 'TODO',
        progress: 0,
        completedDate: null,
        createdDate: dayjs().format('YYYY-MM-DD')
      };
      setTasks(prev => [...prev, newTask]);
      message.success('Tạo công việc thành công!');
    }
    setFormModalVisible(false);
  };

  // Filter
  const filteredTasks = tasks.filter(task => {
    const matchSearch = 
      task.title.toLowerCase().includes(searchText.toLowerCase()) ||
      task.assigneeName.toLowerCase().includes(searchText.toLowerCase());
    const matchStatus = !filterStatus || task.status === filterStatus;
    const matchPriority = !filterPriority || task.priority === filterPriority;
    const matchAssignee = !filterAssignee || task.assigneeId === filterAssignee;
    
    let matchDate = true;
    if (dateRange && dateRange[0] && dateRange[1]) {
      const dueDate = dayjs(task.dueDate);
      matchDate = dueDate >= dateRange[0].startOf('day') && dueDate <= dateRange[1].endOf('day');
    }
    
    return matchSearch && matchStatus && matchPriority && matchAssignee && matchDate;
  });

  // Statistics
  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'TODO').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    review: tasks.filter(t => t.status === 'REVIEW').length,
    done: tasks.filter(t => t.status === 'DONE').length,
    overdue: tasks.filter(t => t.status !== 'DONE' && t.status !== 'CANCELLED' && dayjs(t.dueDate).isBefore(dayjs(), 'day')).length,
  };

  // Check if task is overdue
  const isOverdue = (task) => {
    return task.status !== 'DONE' && task.status !== 'CANCELLED' && dayjs(task.dueDate).isBefore(dayjs(), 'day');
  };

  // Table columns
  const columns = [
    {
      title: 'Công việc',
      dataIndex: 'title',
      key: 'title',
      width: 300,
      render: (text, record) => (
        <div>
          <Space>
            {record.priority === 'URGENT' && <FlagOutlined style={{ color: '#cf1322' }} />}
            <Text strong style={{ cursor: 'pointer' }} onClick={() => handleViewDetail(record)}>
              {text}
            </Text>
          </Space>
          <div>
            {record.tags?.map(tag => (
              <Tag key={tag} style={{ fontSize: 10, marginTop: 4 }}>{tag}</Tag>
            ))}
          </div>
        </div>
      )
    },
    {
      title: 'Người thực hiện',
      dataIndex: 'assigneeName',
      key: 'assigneeName',
      width: 150,
      render: (name) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
          {name}
        </Space>
      )
    },
    {
      title: 'Độ ưu tiên',
      dataIndex: 'priority',
      key: 'priority',
      width: 110,
      render: (priority) => {
        const config = TASK_PRIORITY[priority];
        return <Tag color={config.color}>{config.label}</Tag>;
      },
      filters: Object.entries(TASK_PRIORITY).map(([k, v]) => ({ text: v.label, value: k })),
      onFilter: (value, record) => record.priority === value
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const config = TASK_STATUS[status];
        return <Tag color={config.color} icon={config.icon}>{config.label}</Tag>;
      }
    },
    {
      title: 'Tiến độ',
      dataIndex: 'progress',
      key: 'progress',
      width: 120,
      render: (progress) => (
        <Progress 
          percent={progress} 
          size="small" 
          status={progress === 100 ? 'success' : 'active'}
        />
      )
    },
    {
      title: 'Hạn hoàn thành',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 130,
      render: (date, record) => (
        <Space>
          <CalendarOutlined style={{ color: isOverdue(record) ? '#cf1322' : '#666' }} />
          <Text style={{ color: isOverdue(record) ? '#cf1322' : undefined }}>
            {formatDate(date)}
          </Text>
          {isOverdue(record) && <Tag color="red">Quá hạn</Tag>}
        </Space>
      ),
      sorter: (a, b) => dayjs(a.dueDate).unix() - dayjs(b.dueDate).unix()
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Chi tiết">
            <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} />
          </Tooltip>
          <Tooltip title="Sửa">
            <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
          </Tooltip>
        </Space>
      )
    }
  ];

  if (loading) return <Loading tip="Đang tải danh sách công việc..." />;

  return (
    <div>
      <PageHeader
        title="Quản lý công việc"
        subtitle="Giao việc và theo dõi tiến độ công việc"
        breadcrumbs={[{ title: 'Công việc' }, { title: 'Danh sách' }]}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchTasks}>Làm mới</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Tạo công việc
            </Button>
          </Space>
        }
      />

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={8} sm={4}>
          <Card size="small" hoverable>
            <Statistic title="Tổng" value={stats.total} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={8} sm={4}>
          <Card size="small" hoverable>
            <Statistic title="Chờ làm" value={stats.todo} valueStyle={{ color: '#666' }} />
          </Card>
        </Col>
        <Col xs={8} sm={4}>
          <Card size="small" hoverable>
            <Statistic title="Đang làm" value={stats.inProgress} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={8} sm={4}>
          <Card size="small" hoverable>
            <Statistic title="Chờ duyệt" value={stats.review} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={8} sm={4}>
          <Card size="small" hoverable>
            <Statistic title="Hoàn thành" value={stats.done} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={8} sm={4}>
          <Card size="small" hoverable style={{ borderColor: stats.overdue > 0 ? '#ff4d4f' : undefined }}>
            <Statistic title="Quá hạn" value={stats.overdue} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
      </Row>

      {/* Filters & View Toggle */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space wrap>
              <Input.Search
                placeholder="Tìm theo tiêu đề, người thực hiện..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 250 }}
                allowClear
              />
              <Select placeholder="Trạng thái" value={filterStatus} onChange={setFilterStatus} style={{ width: 130 }} allowClear>
                {Object.entries(TASK_STATUS).map(([k, v]) => (
                  <Select.Option key={k} value={k}><Tag color={v.color}>{v.label}</Tag></Select.Option>
                ))}
              </Select>
              <Select placeholder="Độ ưu tiên" value={filterPriority} onChange={setFilterPriority} style={{ width: 130 }} allowClear>
                {Object.entries(TASK_PRIORITY).map(([k, v]) => (
                  <Select.Option key={k} value={k}><Tag color={v.color}>{v.label}</Tag></Select.Option>
                ))}
              </Select>
              <Select placeholder="Người thực hiện" value={filterAssignee} onChange={setFilterAssignee} style={{ width: 160 }} allowClear showSearch optionFilterProp="children">
                {MOCK_EMPLOYEES.map(e => (
                  <Select.Option key={e.id} value={e.id}>{e.name}</Select.Option>
                ))}
              </Select>
              <RangePicker placeholder={['Hạn từ', 'Hạn đến']} onChange={setDateRange} format="DD/MM/YYYY" />
            </Space>
          </Col>
          <Col>
            <Space>
              <Tooltip title="Danh sách">
                <Button 
                  type={viewMode === 'list' ? 'primary' : 'default'} 
                  icon={<UnorderedListOutlined />}
                  onClick={() => setViewMode('list')}
                />
              </Tooltip>
              <Tooltip title="Kanban">
                <Button 
                  type={viewMode === 'kanban' ? 'primary' : 'default'} 
                  icon={<AppstoreOutlined />}
                  onClick={() => setViewMode('kanban')}
                />
              </Tooltip>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Content - List or Kanban */}
      {viewMode === 'list' ? (
        <Card>
          <Table
            columns={columns}
            dataSource={filteredTasks}
            rowKey="id"
            scroll={{ x: 1200 }}
            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `Tổng ${t} công việc` }}
          />
        </Card>
      ) : (
        <TaskKanban 
          tasks={filteredTasks} 
          onStatusChange={handleStatusChange}
          onViewDetail={handleViewDetail}
          onEdit={handleEdit}
        />
      )}

      {/* Modals */}
      <TaskFormModal
        visible={formModalVisible}
        task={selectedTask}
        employees={MOCK_EMPLOYEES}
        onCancel={() => { setFormModalVisible(false); setSelectedTask(null); }}
        onSuccess={handleFormSuccess}
      />

      <TaskDetailModal
        visible={detailModalVisible}
        task={selectedTask}
        onCancel={() => { setDetailModalVisible(false); setSelectedTask(null); }}
        onStatusChange={handleStatusChange}
        onEdit={() => {
          setDetailModalVisible(false);
          setFormModalVisible(true);
        }}
      />
    </div>
  );
};

export default TaskList;
