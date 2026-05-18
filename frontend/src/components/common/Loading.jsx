import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const Loading = ({ 
  size = 'large', 
  tip = 'Đang tải...', 
  fullScreen = false 
}) => {
  const antIcon = <LoadingOutlined style={{ fontSize: size === 'large' ? 40 : 24 }} spin />;

  if (fullScreen) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        zIndex: 9999
      }}>
        <Spin indicator={antIcon} size={size} />
        {tip && <div style={{ marginTop: 16, color: '#666' }}>{tip}</div>}
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '50px 0',
      minHeight: 200
    }}>
      <Spin indicator={antIcon} size={size} />
      {tip && <div style={{ marginTop: 16, color: '#666' }}>{tip}</div>}
    </div>
  );
};

export default Loading;
