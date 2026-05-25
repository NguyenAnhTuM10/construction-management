import { useState, useEffect, useCallback } from 'react';
import {
  Row, Col, Card, Table, Tag, Button, Alert, Progress,
  Statistic, Tooltip, Typography, Space, message, Modal,
} from 'antd';
import {
  RobotOutlined, ReloadOutlined, WarningOutlined,
  SafetyCertificateOutlined, ShoppingCartOutlined,
  InfoCircleOutlined, FireOutlined, ExperimentOutlined,
} from '@ant-design/icons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as ChartTooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { PageHeader } from '../../components/common';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';
import { formatNumber } from '../../utils/formatters';
import forecastApi from '../../api/forecastApi';

const { Text, Title } = Typography;

// ─────────────────────────── Config ──────────────────────────────────────────

const RISK_CONFIG = {
  CRITICAL: { label: 'Nguy cấp',    color: '#ff4d4f', tagColor: 'error',   icon: '🔴' },
  HIGH:     { label: 'Cao',         color: '#fa8c16', tagColor: 'warning',  icon: '🟠' },
  MEDIUM:   { label: 'Trung bình',  color: '#faad14', tagColor: 'gold',     icon: '🟡' },
  LOW:      { label: 'Thấp',        color: '#52c41a', tagColor: 'success',  icon: '🟢' },
};

const MODEL_CONFIG = {
  xgboost:               { label: 'XGBoost',      color: 'purple', desc: 'Gradient boosting + feature engineering (lag, calendar). Tốt nhất khi có ≥60 ngày data với pattern rõ ràng.' },
  holt_winters:          { label: 'Holt-Winters',  color: 'blue',   desc: 'Double Exponential Smoothing — bắt trend tuyến tính. Phù hợp 14–59 ngày data.' },
  linear_regression:     { label: 'Linear Reg.',   color: 'cyan',   desc: 'Hồi quy tuyến tính trên time index. Phù hợp 7–13 ngày data.' },
  simple_moving_average: { label: 'SMA',           color: 'default', desc: 'Trung bình trượt 3 ngày. Fallback khi <7 ngày data.' },
  no_history:            { label: 'No Data',       color: 'error',   desc: 'Không có lịch sử giao dịch.' },
};

// Nhãn 7 ngày — bắt đầu từ ngày mai (T2–CN)
const DAY_LABELS = ['Ngày 1', 'Ngày 2', 'Ngày 3', 'Ngày 4', 'Ngày 5', 'Ngày 6', 'Ngày 7'];

// ─────────────────────────── Sub-components ──────────────────────────────────

const InventoryDetailCard = ({ label, value, hint, highlight }) => (
  <Col span={12}>
    <div style={{
      background: highlight ? '#fff7e6' : '#fafafa',
      border: `1px solid ${highlight ? '#ffd591' : '#f0f0f0'}`,
      padding: '8px 12px',
      borderRadius: 6,
    }}>
      <Tooltip title={hint}>
        <Text type="secondary" style={{ fontSize: 11 }}>
          {label} <InfoCircleOutlined style={{ opacity: 0.5 }} />
        </Text>
      </Tooltip>
      <div style={{ fontWeight: 700, fontSize: 16, marginTop: 2, color: highlight ? '#fa8c16' : undefined }}>
        {value}
      </div>
    </div>
  </Col>
);

// ── Model Selection Panel ─────────────────────────────────────────────────────

const ModelSelectionPanel = ({ record }) => {
  const scores = record.modelScores || {};
  const hasScores = Object.keys(scores).length > 0;
  const winner = record.modelUsed;
  const winnerCfg = MODEL_CONFIG[winner] || { label: winner, color: 'default', desc: '' };

  // Confidence breakdown
  const conf = Math.round((record.confidenceScore || 0) * 100);
  const confColor = conf >= 70 ? '#52c41a' : conf >= 50 ? '#faad14' : '#ff4d4f';
  const confLabel = conf >= 70 ? 'Cao' : conf >= 50 ? 'Trung bình' : 'Thấp';

  if (!hasScores) {
    return (
      <div style={{ background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 8, padding: '12px 16px' }}>
        <Text strong style={{ fontSize: 13 }}>🤖 Model AI được sử dụng</Text>
        <div style={{ marginTop: 8 }}>
          <Tag color={winnerCfg.color} style={{ fontWeight: 600 }}>{winnerCfg.label}</Tag>
          <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
            {winner === 'no_history'
              ? 'Không có lịch sử giao dịch để dự báo.'
              : 'Chọn theo quy tắc — chưa đủ data để so sánh các model (cần ≥14 ngày).'}
          </Text>
        </div>
        {winnerCfg.desc && (
          <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4, color: '#888' }}>
            {winnerCfg.desc}
          </Text>
        )}
      </div>
    );
  }

  // Sort models by MAE ascending (best first)
  const sorted = Object.entries(scores).sort(([, a], [, b]) => a - b);
  const bestMAE = sorted[0]?.[1] ?? 0;
  const maxMAE  = sorted[sorted.length - 1]?.[1] ?? 1;

  // Explanation text
  const winnerMAE = scores[winner];
  const runnerUp  = sorted.find(([k]) => k !== winner);
  const improvement = runnerUp
    ? Math.round(((runnerUp[1] - winnerMAE) / runnerUp[1]) * 100)
    : 0;

  return (
    <div style={{ background: '#f9f0ff', border: '1px solid #d3adf7', borderRadius: 8, padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text strong style={{ fontSize: 13 }}>🤖 Tại sao chọn {winnerCfg.label}?</Text>
        <Tooltip title={`Confidence ${conf}% — ${confLabel}: dựa trên lượng data (${Math.round(record.avgDailyDemand * 90)} ngày ước tính), độ biến động demand, và sai số MAE thực tế.`}>
          <span style={{ cursor: 'help', fontSize: 11, color: confColor, fontWeight: 600 }}>
            Tin cậy: {conf}% ({confLabel}) <InfoCircleOutlined />
          </span>
        </Tooltip>
      </div>

      {/* Explanation text */}
      <div style={{
        background: 'white', borderRadius: 6, padding: '8px 12px',
        marginBottom: 10, borderLeft: '3px solid #722ed1',
      }}>
        <Text style={{ fontSize: 12 }}>
          Hệ thống đã chạy <strong>{sorted.length} model</strong> trên 7 ngày validation gần nhất.{' '}
          <Tag color={winnerCfg.color} style={{ margin: '0 2px' }}>{winnerCfg.label}</Tag>
          {' '}có sai số thấp nhất <strong>(MAE = {winnerMAE?.toFixed(2)})</strong>
          {runnerUp && (
            <> — tốt hơn {MODEL_CONFIG[runnerUp[0]]?.label || runnerUp[0]} {improvement}%</>
          )}.
        </Text>
        <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
          {winnerCfg.desc}
        </Text>
      </div>

      {/* MAE comparison bars */}
      <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 6 }}>
        MAE thấp hơn = dự báo chính xác hơn trên validation set (7 ngày gần nhất):
      </Text>
      {sorted.map(([model, mae]) => {
        const cfg = MODEL_CONFIG[model] || { label: model, color: 'default' };
        const isWinner = model === winner;
        const barPct = maxMAE > 0 ? Math.round((mae / maxMAE) * 100) : 0;
        const tagColors = { purple: '#722ed1', blue: '#1677ff', cyan: '#13c2c2', default: '#8c8c8c' };
        const barColor = isWinner ? (tagColors[cfg.color] || '#722ed1') : '#d9d9d9';

        return (
          <div key={model} style={{ marginBottom: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 100, flexShrink: 0 }}>
                <Tag color={isWinner ? cfg.color : 'default'} style={{ margin: 0, fontWeight: isWinner ? 700 : 400 }}>
                  {isWinner ? '✅ ' : ''}{cfg.label}
                </Tag>
              </div>
              <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 4, height: 14, overflow: 'hidden' }}>
                <div style={{
                  width: `${barPct}%`, height: '100%',
                  background: barColor, borderRadius: 4,
                  transition: 'width 0.3s',
                }} />
              </div>
              <Text style={{ width: 52, textAlign: 'right', fontSize: 12, fontWeight: isWinner ? 700 : 400, flexShrink: 0 }}>
                {mae.toFixed(2)}
              </Text>
            </div>
          </div>
        );
      })}
      <Text type="secondary" style={{ fontSize: 10, marginTop: 4, display: 'block' }}>
        * MAE = Mean Absolute Error (đơn vị: {record.unit}/ngày). Được đo trên 7 ngày hold-out trước khi retrain trên toàn bộ data.
      </Text>
    </div>
  );
};

// ─────────────────────────── Expanded Row ────────────────────────────────────

const ExpandedRow = ({ record }) => {
  const chartData = (record.dailyForecast || []).map((qty, i) => ({
    day: DAY_LABELS[i],
    qty,
  }));

  const needsOrder = record.currentStock <= record.reorderPoint;

  return (
    <Row gutter={[24, 16]} style={{ padding: '8px 16px 16px' }}>
      {/* Bar chart */}
      <Col xs={24} lg={14}>
        <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
          Dự báo nhu cầu 7 ngày tới ({record.unit})
        </Text>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <ChartTooltip
              formatter={(v) => [formatNumber(v) + ' ' + record.unit, 'Nhu cầu dự báo']}
              contentStyle={{ borderRadius: 8, border: '1px solid #f0f0f0' }}
            />
            <Bar dataKey="qty" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {chartData.map((entry, idx) => (
                <Cell key={idx} fill={entry.qty > record.avgDailyDemand * 1.2 ? '#ff7a45' : '#1677ff'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <Text type="secondary" style={{ fontSize: 11 }}>
          * Cột màu cam = nhu cầu cao bất thường (&gt;120% trung bình)
        </Text>
      </Col>

      {/* Inventory KPIs */}
      <Col xs={24} lg={10}>
        <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
          Thông số tồn kho
        </Text>
        <Row gutter={[8, 8]}>
          <InventoryDetailCard
            label="Safety Stock"
            value={formatNumber(record.safetyStock)}
            hint="Dự phòng rủi ro = Z × σ_demand × √lead_time (Z=1.65, service level 95%)"
          />
          <InventoryDetailCard
            label="Reorder Point"
            value={formatNumber(record.reorderPoint)}
            hint="Ngưỡng cần đặt hàng = avg_demand × lead_time + safety_stock"
            highlight={needsOrder}
          />
          <InventoryDetailCard
            label="EOQ"
            value={formatNumber(record.eoq)}
            hint="Economic Order Quantity — số lượng tối ưu mỗi lần đặt = √(2DS/H)"
          />
          <InventoryDetailCard
            label="Đề xuất đặt ngay"
            value={formatNumber(record.recommendedReorderQty)}
            hint="Đủ cho 30 ngày tới + safety buffer, tối thiểu 1 lô EOQ"
            highlight={needsOrder}
          />
        </Row>
        {needsOrder && (
          <Alert
            type="warning"
            showIcon
            message={`Tồn kho (${formatNumber(record.currentStock)}) đã dưới ROP (${formatNumber(record.reorderPoint)}) — cần đặt hàng ngay!`}
            style={{ marginTop: 8, fontSize: 12 }}
          />
        )}
      </Col>

      {/* Model Selection Reasoning — full width */}
      <Col xs={24}>
        <ModelSelectionPanel record={record} />
      </Col>
    </Row>
  );
};

// ─────────────────────────── Main Page ───────────────────────────────────────

const ForecastDashboard = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole([ROLES.ADMIN]);

  const [loading, setLoading]       = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [data, setData]             = useState([]);

  const fetchForecasts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await forecastApi.getLatest();
      setData(res.data || []);
    } catch (err) {
      message.error('Không thể tải dữ liệu dự báo: ' + (err.message || 'Lỗi không xác định'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchForecasts(); }, [fetchForecasts]);

  const handleTrigger = () => {
    Modal.confirm({
      title: 'Chạy dự báo AI ngay?',
      icon: <ExperimentOutlined />,
      content: (
        <div>
          <p>Hệ thống sẽ:</p>
          <ol style={{ paddingLeft: 20, margin: 0 }}>
            <li>Lấy lịch sử 90 ngày cho tất cả sản phẩm có giao dịch</li>
            <li>Gọi AI service (XGBoost / Holt-Winters / SMA)</li>
            <li>Lưu kết quả vào database</li>
          </ol>
          <p style={{ marginTop: 8, color: '#888' }}>Quá trình có thể mất 10–30 giây.</p>
        </div>
      ),
      okText: 'Chạy',
      cancelText: 'Hủy',
      onOk: async () => {
        setTriggering(true);
        try {
          await forecastApi.trigger();
          message.success('Dự báo hoàn thành! Đang tải kết quả mới...');
          await fetchForecasts();
        } catch (err) {
          message.error('Lỗi: ' + (err.message || 'AI service không phản hồi. Kiểm tra container.'));
        } finally {
          setTriggering(false);
        }
      },
    });
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const criticalItems  = data.filter(d => d.stockoutRisk === 'CRITICAL');
  const highRiskCount  = data.filter(d => ['CRITICAL', 'HIGH'].includes(d.stockoutRisk)).length;
  const needsOrderCount = data.filter(d => d.currentStock <= d.reorderPoint).length;
  const avgConfidence  = data.length
    ? Math.round(data.reduce((s, d) => s + (d.confidenceScore || 0), 0) / data.length * 100)
    : 0;

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns = [
    {
      title: 'Sản phẩm',
      key: 'product',
      width: 210,
      fixed: 'left',
      render: (_, r) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>{r.productName}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>
            {r.productCode} · {r.unit}
          </Text>
        </div>
      ),
    },
    {
      title: 'Tồn kho',
      dataIndex: 'currentStock',
      key: 'currentStock',
      align: 'right',
      width: 95,
      sorter: (a, b) => a.currentStock - b.currentStock,
      render: (v, r) => (
        <Tooltip title={`ROP: ${formatNumber(r.reorderPoint)}`}>
          <Text
            strong
            style={{ color: v <= r.reorderPoint ? '#ff4d4f' : undefined }}
          >
            {formatNumber(v)}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: 'Cầu TB/ngày',
      dataIndex: 'avgDailyDemand',
      key: 'avgDailyDemand',
      align: 'right',
      width: 110,
      sorter: (a, b) => a.avgDailyDemand - b.avgDailyDemand,
      render: (v) => formatNumber(Math.round(v)),
    },
    {
      title: 'Dự báo 7 ngày',
      dataIndex: 'predictedDemand7Days',
      key: 'predictedDemand7Days',
      align: 'right',
      width: 120,
      sorter: (a, b) => a.predictedDemand7Days - b.predictedDemand7Days,
      render: (v) => (
        <Text strong style={{ color: '#1677ff' }}>{formatNumber(v)}</Text>
      ),
    },
    {
      title: 'Hết hàng sau',
      dataIndex: 'daysUntilStockout',
      key: 'daysUntilStockout',
      align: 'center',
      width: 115,
      sorter: (a, b) => a.daysUntilStockout - b.daysUntilStockout,
      render: (v) => {
        const color = v <= 3 ? '#ff4d4f' : v <= 7 ? '#fa8c16' : v <= 14 ? '#faad14' : '#52c41a';
        return (
          <Text strong style={{ color }}>
            {v >= 9999 ? '∞' : `${v} ngày`}
          </Text>
        );
      },
    },
    {
      title: 'Rủi ro',
      dataIndex: 'stockoutRisk',
      key: 'stockoutRisk',
      align: 'center',
      width: 115,
      filters: Object.entries(RISK_CONFIG).map(([k, v]) => ({ text: v.label, value: k })),
      onFilter: (val, r) => r.stockoutRisk === val,
      defaultSortOrder: null,
      sorter: (a, b) => {
        const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return (order[a.stockoutRisk] ?? 4) - (order[b.stockoutRisk] ?? 4);
      },
      render: (risk) => {
        const cfg = RISK_CONFIG[risk] || RISK_CONFIG.LOW;
        return (
          <Tag color={cfg.tagColor} style={{ fontWeight: 600, borderRadius: 4, margin: 0 }}>
            {cfg.icon} {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: 'Tin cậy',
      dataIndex: 'confidenceScore',
      key: 'confidenceScore',
      align: 'center',
      width: 110,
      sorter: (a, b) => a.confidenceScore - b.confidenceScore,
      render: (v) => {
        const pct = Math.round(v * 100);
        const color = pct >= 70 ? '#52c41a' : pct >= 50 ? '#faad14' : '#ff4d4f';
        return (
          <Tooltip title={`${pct}% — ${pct >= 70 ? 'Cao' : pct >= 50 ? 'Trung bình' : 'Thấp'}`}>
            <div>
              <Progress percent={pct} size="small" strokeColor={color} showInfo={false} />
              <Text style={{ fontSize: 11, color }}>{pct}%</Text>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: 'Đề xuất đặt',
      dataIndex: 'recommendedReorderQty',
      key: 'recommendedReorderQty',
      align: 'right',
      width: 115,
      sorter: (a, b) => a.recommendedReorderQty - b.recommendedReorderQty,
      render: (v, r) => (
        <Tooltip title="Nhấn mở rộng hàng để xem chi tiết Safety Stock / ROP / EOQ">
          <Text
            strong
            style={{ color: r.currentStock <= r.reorderPoint ? '#fa8c16' : undefined }}
          >
            {formatNumber(v)}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: 'Model AI',
      dataIndex: 'modelUsed',
      key: 'modelUsed',
      align: 'center',
      width: 120,
      filters: Object.entries(MODEL_CONFIG).map(([k, v]) => ({ text: v.label, value: k })),
      onFilter: (val, r) => r.modelUsed === val,
      render: (model) => {
        const cfg = MODEL_CONFIG[model] || { label: model, color: 'default' };
        return <Tag color={cfg.color} style={{ margin: 0 }}>{cfg.label}</Tag>;
      },
    },
  ];

  // ── Row class by risk ─────────────────────────────────────────────────────
  const rowClassName = (r) => {
    if (r.stockoutRisk === 'CRITICAL') return 'forecast-row-critical';
    if (r.stockoutRisk === 'HIGH')     return 'forecast-row-high';
    return '';
  };

  const forecastDate = data[0]?.forecastDate
    ? new Date(data[0].forecastDate).toLocaleDateString('vi-VN')
    : null;

  return (
    <div>
      <PageHeader
        title={
          <Space>
            <RobotOutlined style={{ color: '#722ed1' }} />
            Dự Báo Tồn Kho AI
          </Space>
        }
        subtitle={
          forecastDate
            ? `Kết quả ngày ${forecastDate} · ${data.length} sản phẩm · Tự động cập nhật lúc 2:00 AM`
            : 'Chưa có dữ liệu — nhấn "Chạy Dự Báo" để bắt đầu'
        }
        breadcrumbs={[{ title: 'Kho hàng', path: '/warehouses' }, { title: 'Dự Báo AI' }]}
        extra={
          isAdmin && (
            <Button
              type="primary"
              icon={<ReloadOutlined spin={triggering} />}
              onClick={handleTrigger}
              loading={triggering}
              style={{ background: '#722ed1', borderColor: '#722ed1' }}
            >
              Chạy Dự Báo Ngay
            </Button>
          )
        }
      />

      {/* CRITICAL alert banner */}
      {criticalItems.length > 0 && (
        <Alert
          type="error"
          showIcon
          icon={<FireOutlined />}
          message={
            <span>
              <strong>{criticalItems.length} sản phẩm</strong> sẽ hết hàng trong &le;3 ngày:{' '}
              <strong>{criticalItems.map(d => d.productName).join(', ')}</strong>
            </span>
          }
          action={
            isAdmin && (
              <Button size="small" danger onClick={handleTrigger}>
                Xem chi tiết
              </Button>
            )
          }
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Stats row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic
              title="Sản phẩm đã dự báo"
              value={data.length}
              prefix={<SafetyCertificateOutlined style={{ color: '#1677ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            size="small"
            hoverable
            style={{ borderColor: highRiskCount > 0 ? '#ff4d4f' : undefined }}
          >
            <Statistic
              title="Rủi ro cao (Critical+High)"
              value={highRiskCount}
              prefix={<WarningOutlined />}
              valueStyle={{ color: highRiskCount > 0 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            size="small"
            hoverable
            style={{ borderColor: needsOrderCount > 0 ? '#fa8c16' : undefined }}
          >
            <Statistic
              title="Cần đặt hàng ngay"
              value={needsOrderCount}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: needsOrderCount > 0 ? '#fa8c16' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Statistic
              title="Độ tin cậy trung bình"
              value={avgConfidence}
              suffix="%"
              prefix={<RobotOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: avgConfidence >= 70 ? '#52c41a' : '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main table */}
      <Card>
        {!loading && data.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <RobotOutlined style={{ fontSize: 56, color: '#d9d9d9', marginBottom: 16 }} />
            <Title level={4} type="secondary">Chưa có dữ liệu dự báo</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              Bước 1: Chạy seed script để có dữ liệu lịch sử
            </Text>
            <Text code style={{ display: 'block', marginBottom: 8 }}>
              cd scripts && python seed_historical_data.py
            </Text>
            {isAdmin && (
              <>
                <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                  Bước 2: Nhấn nút bên dưới để chạy AI forecast
                </Text>
                <Button
                  type="primary"
                  icon={<RobotOutlined />}
                  onClick={handleTrigger}
                  loading={triggering}
                  style={{ background: '#722ed1', borderColor: '#722ed1' }}
                >
                  Chạy Dự Báo Ngay
                </Button>
              </>
            )}
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            loading={loading}
            expandable={{
              expandedRowRender: (record) => <ExpandedRow record={record} />,
              rowExpandable: (r) => (r.dailyForecast || []).length > 0,
              expandRowByClick: false,
            }}
            rowClassName={rowClassName}
            scroll={{ x: 1150 }}
            pagination={{
              pageSize: 15,
              showSizeChanger: true,
              showTotal: (total) => `${total} sản phẩm`,
            }}
          />
        )}
      </Card>

      {/* Row highlight styles */}
      <style>{`
        .forecast-row-critical td { background-color: #fff1f0 !important; }
        .forecast-row-high td     { background-color: #fff7e6 !important; }
      `}</style>
    </div>
  );
};

export default ForecastDashboard;
