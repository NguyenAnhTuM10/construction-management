import { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Statistic, Table, Typography, Space, 
  Button, Tag, Progress, Select, DatePicker, Avatar
} from 'antd';
import { 
  TrophyOutlined, UserOutlined, RiseOutlined, FallOutlined,
  FileExcelOutlined, PrinterOutlined, StarOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { PageHeader, Loading } from '../../components/common';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

// ===================== MOCK DATA =====================
const MOCK_KPI_DATA = [
  { 
    id: 1, code: 'NV002', name: 'Trần Thị Bình', 
    department: 'Phòng Kinh doanh', position: 'Trưởng phòng',
    kpiScore: 95, kpiTarget: 100, kpiBonus: 2375000,
    salesTarget: 500000000, salesActual: 520000000, salesBonus: 5200000,
    ordersTarget: 30, ordersActual: 28,
    attendanceRate: 95.5, lateCount: 1, leaveCount: 1,
    tasksCompleted: 12, tasksTotal: 14,
    rating: 'A'
  },
  { 
    id: 2, code: 'NV003', name: 'Lê Văn Cường', 
    department: 'Phòng Kinh doanh', position: 'Nhân viên',
    kpiScore: 110, kpiTarget: 100, kpiBonus: 1320000,
    salesTarget: 200000000, salesActual: 245000000, salesBonus: 2450000,
    ordersTarget: 20, ordersActual: 25,
    attendanceRate: 100, lateCount: 0, leaveCount: 0,
    tasksCompleted: 18, tasksTotal: 18,
    rating: 'S'
  },
  { 
    id: 3, code: 'NV004', name: 'Phạm Thị Dung', 
    department: 'Phòng Kế toán', position: 'Trưởng phòng',
    kpiScore: 88, kpiTarget: 100, kpiBonus: 1936000,
    salesTarget: 0, salesActual: 0, salesBonus: 0,
    ordersTarget: 0, ordersActual: 0,
    attendanceRate: 90.9, lateCount: 2, leaveCount: 2,
    tasksCompleted: 15, tasksTotal: 18,
    rating: 'B'
  },
  { 
    id: 4, code: 'NV005', name: 'Hoàng Văn Em', 
    department: 'Phòng Kế toán', position: 'Nhân viên',
    kpiScore: 100, kpiTarget: 100, kpiBonus: 1000000,
    salesTarget: 0, salesActual: 0, salesBonus: 0,
    ordersTarget: 0, ordersActual: 0,
    attendanceRate: 100, lateCount: 0, leaveCount: 0,
    tasksCompleted: 10, tasksTotal: 10,
    rating: 'A'
  },
  { 
    id: 5, code: 'NV006', name: 'Võ Thị Phương', 
    department: 'Phòng Kho vận', position: 'Trưởng phòng',
    kpiScore: 92, kpiTarget: 100, kpiBonus: 1656000,
    salesTarget: 0, salesActual: 0, salesBonus: 0,
    ordersTarget: 0, ordersActual: 0,
    attendanceRate: 95.5, lateCount: 0, leaveCount: 1,
    tasksCompleted: 22, tasksTotal: 25,
    rating: 'A'
  },
  { 
    id: 6, code: 'NV007', name: 'Đặng Văn Giang', 
    department: 'Phòng Kho vận', position: 'Nhân viên',
    kpiScore: 78, kpiTarget: 100, kpiBonus: 702000,
    salesTarget: 0, salesActual: 0, salesBonus: 0,
    ordersTarget: 0, ordersActual: 0,
    attendanceRate: 86.4, lateCount: 3, leaveCount: 3,
    tasksCompleted: 8, tasksTotal: 12,
    rating: 'C'
  },
];

const DEPARTMENTS = ['Tất cả', 'Phòng Kinh doanh', 'Phòng Kế toán', 'Phòng Kho vận'];

const RATING_CONFIG = {
  'S': { color: '#722ed1', text: 'Xuất sắc', icon: '🏆' },
  'A': { color: '#52c41a', text: 'Tốt', icon: '⭐' },
  'B': { color: '#1890ff', text: 'Khá', icon: '👍' },
  'C': { color: '#faad14', text: 'Trung bình', icon: '📊' },
  'D': { color: '#cf1322', text: 'Yếu', icon: '⚠️' },
};
// =====================================================

const KPIReport = () => {
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState([]);
  const [filterDepartment, setFilterDepartment] = useState('Tất cả');
  const [filterMonth, setFilterMonth] = useState(dayjs());

  useEffect(() => {
    setTimeout(() => {
      setKpiData(MOCK_KPI_DATA);
      setLoading(false);
    }, 500);
  }, []);

  // Filter
  const filteredData = kpiData.filter(item => 
    filterDepartment === 'Tất cả' || item.department === filterDepartment
  );

  // Calculate summary
  const stats = {
    avgKPI: Math.round(kpiData.reduce((sum, k) => sum + k.kpiScore, 0) / kpiData.length),
    totalBonus: kpiData.reduce((sum, k) => sum + k.kpiBonus + k.salesBonus, 0),
    excellent: kpiData.filter(k => k.kpiScore >= 100).length,
    good: kpiData.filter(k => k.kpiScore >= 80 && k.kpiScore < 100).length,
    poor: kpiData.filter(k => k.kpiScore < 80).length,
    totalSales: kpiData.reduce((sum, k) => sum + k.salesActual, 0),
  };

  // Get KPI color
  const getKPIColor = (score) => {
    if (score >= 100) return '#52c41a';
    if (score >= 80) return '#1890ff';
    if (score >= 60) return '#faad14';
    return '#cf1322';
  };

  // Table columns
  const columns = [
    { 
      title: 'Nhân viên', key: 'employee', width: 200, fixed: 'left',
      render: (_, record) => (
        <Space>
          <Avatar style={{ backgroundColor: '#1890ff' }} icon={<UserOutlined />} />
          <div>
            <Text strong>{record.name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>{record.code} - {record.position}</Text>
          </div>
        </Space>
      )
    },
    { 
      title: 'Phòng ban', dataIndex: 'department', key: 'department', width: 140,
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    { 
      title: 'Điểm KPI', dataIndex: 'kpiScore', key: 'kpiScore', width: 120, align: 'center',
      render: (score) => (
        <div>
          <Progress 
            type="circle" 
            percent={Math.min(score, 100)} 
            width={50}
            strokeColor={getKPIColor(score)}
            format={() => `${score}%`}
          />
        </div>
      ),
      sorter: (a, b) => a.kpiScore - b.kpiScore
    },
    { 
      title: 'Doanh số', key: 'sales', width: 180,
      render: (_, record) => record.salesTarget > 0 ? (
        <div>
          <Text>{formatCurrency(record.salesActual)}</Text>
          <Progress 
            percent={Math.round(record.salesActual / record.salesTarget * 100)} 
            size="small"
            status={record.salesActual >= record.salesTarget ? 'success' : 'active'}
          />
          <Text type="secondary" style={{ fontSize: 10 }}>
            Mục tiêu: {formatCurrency(record.salesTarget)}
          </Text>
        </div>
      ) : <Text type="secondary">N/A</Text>
    },
    { 
      title: 'Công việc', key: 'tasks', width: 100, align: 'center',
      render: (_, record) => (
        <div>
          <Text strong>{record.tasksCompleted}/{record.tasksTotal}</Text>
          <Progress 
            percent={Math.round(record.tasksCompleted / record.tasksTotal * 100)} 
            size="small"
            showInfo={false}
          />
        </div>
      )
    },
    { 
      title: 'Chuyên cần', key: 'attendance', width: 110, align: 'center',
      render: (_, record) => (
        <div>
          <Text style={{ color: record.attendanceRate >= 95 ? '#52c41a' : record.attendanceRate >= 90 ? '#faad14' : '#cf1322' }}>
            {record.attendanceRate}%
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 10 }}>
            {record.lateCount > 0 && `Muộn: ${record.lateCount}`}
            {record.lateCount > 0 && record.leaveCount > 0 && ' | '}
            {record.leaveCount > 0 && `Nghỉ: ${record.leaveCount}`}
          </Text>
        </div>
      )
    },
    { 
      title: 'Thưởng KPI', dataIndex: 'kpiBonus', key: 'kpiBonus', width: 120, align: 'right',
      render: (v) => <Text style={{ color: '#52c41a' }}>{formatCurrency(v)}</Text>
    },
    { 
      title: 'Thưởng DS', dataIndex: 'salesBonus', key: 'salesBonus', width: 120, align: 'right',
      render: (v) => v > 0 ? <Text style={{ color: '#722ed1' }}>{formatCurrency(v)}</Text> : '-'
    },
    { 
      title: 'Xếp loại', dataIndex: 'rating', key: 'rating', width: 100, align: 'center',
      render: (rating) => {
        const config = RATING_CONFIG[rating];
        return (
          <Tag color={config.color} style={{ fontWeight: 'bold' }}>
            {config.icon} {rating}
          </Tag>
        );
      }
    },
  ];

  // Department summary
  const deptSummary = DEPARTMENTS.filter(d => d !== 'Tất cả').map(dept => {
    const deptData = kpiData.filter(k => k.department === dept);
    return {
      department: dept,
      employees: deptData.length,
      avgKPI: deptData.length > 0 ? Math.round(deptData.reduce((s, k) => s + k.kpiScore, 0) / deptData.length) : 0,
      totalBonus: deptData.reduce((s, k) => s + k.kpiBonus + k.salesBonus, 0),
      excellent: deptData.filter(k => k.rating === 'S' || k.rating === 'A').length,
    };
  });

  if (loading) return <Loading tip="Đang tải báo cáo KPI..." />;

  return (
    <div>
      <PageHeader
        title="Báo cáo KPI nhân viên"
        subtitle={`Đánh giá hiệu suất làm việc tháng ${filterMonth.format('MM/YYYY')}`}
        breadcrumbs={[{ title: 'Báo cáo' }, { title: 'KPI nhân viên' }]}
        extra={
          <Space>
            <Button icon={<FileExcelOutlined />}>Xuất Excel</Button>
            <Button icon={<PrinterOutlined />}>In báo cáo</Button>
          </Space>
        }
      />

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="KPI trung bình"
              value={stats.avgKPI}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: getKPIColor(stats.avgKPI) }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="Tổng thưởng"
              value={stats.totalBonus}
              formatter={(v) => formatCurrency(v)}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="Đạt/Vượt KPI"
              value={stats.excellent}
              suffix={`/${kpiData.length}`}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="Tổng doanh số"
              value={stats.totalSales}
              formatter={(v) => formatCurrency(v)}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Department Summary */}
      <Card title={<><TeamOutlined /> Tổng hợp theo phòng ban</>} style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          {deptSummary.map(dept => (
            <Col xs={24} sm={8} key={dept.department}>
              <Card size="small" style={{ background: '#f5f5f5' }}>
                <Title level={5} style={{ marginBottom: 8 }}>{dept.department}</Title>
                <Row gutter={8}>
                  <Col span={12}>
                    <Text type="secondary">Số NV:</Text>
                    <br />
                    <Text strong>{dept.employees}</Text>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">KPI TB:</Text>
                    <br />
                    <Text strong style={{ color: getKPIColor(dept.avgKPI) }}>{dept.avgKPI}%</Text>
                  </Col>
                </Row>
                <Row gutter={8} style={{ marginTop: 8 }}>
                  <Col span={12}>
                    <Text type="secondary">Xuất sắc:</Text>
                    <br />
                    <Text strong style={{ color: '#52c41a' }}>{dept.excellent} NV</Text>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">Thưởng:</Text>
                    <br />
                    <Text strong>{formatCurrency(dept.totalBonus)}</Text>
                  </Col>
                </Row>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Rating Legend */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Text strong>Xếp loại:</Text>
          {Object.entries(RATING_CONFIG).map(([key, value]) => (
            <Tag key={key} color={value.color}>{value.icon} {key} - {value.text}</Tag>
          ))}
        </Space>
      </Card>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <DatePicker 
            picker="month"
            value={filterMonth}
            onChange={setFilterMonth}
            format="MM/YYYY"
            allowClear={false}
          />
          <Select 
            value={filterDepartment} 
            onChange={setFilterDepartment}
            style={{ width: 180 }}
          >
            {DEPARTMENTS.map(d => (
              <Select.Option key={d} value={d}>{d}</Select.Option>
            ))}
          </Select>
        </Space>
      </Card>

      {/* KPI Table */}
      <Card title="Chi tiết KPI nhân viên">
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          scroll={{ x: 1400 }}
          pagination={{ pageSize: 10 }}
          summary={(pageData) => {
            const totalKPIBonus = pageData.reduce((sum, r) => sum + r.kpiBonus, 0);
            const totalSalesBonus = pageData.reduce((sum, r) => sum + r.salesBonus, 0);
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={6}><Text strong>Tổng cộng</Text></Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <Text strong style={{ color: '#52c41a' }}>{formatCurrency(totalKPIBonus)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  <Text strong style={{ color: '#722ed1' }}>{formatCurrency(totalSalesBonus)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} />
              </Table.Summary.Row>
            );
          }}
        />
      </Card>
    </div>
  );
};

export default KPIReport;
