import { useEffect, useCallback, useRef, useState } from 'react';
import { Modal, Button } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

// Thời gian timeout (ms)
const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 phút không hoạt động
const WARNING_BEFORE = 5 * 60 * 1000; // Cảnh báo trước 5 phút

const SessionTimeout = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 phút = 300 giây
  
  const timeoutRef = useRef(null);
  const warningRef = useRef(null);
  const countdownRef = useRef(null);

  // Reset timers
  const resetTimers = useCallback(() => {
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    // Hide warning nếu đang hiển thị
    setShowWarning(false);
    setCountdown(300);

    if (!isAuthenticated) return;

    // Set warning timer (25 phút)
    warningRef.current = setTimeout(() => {
      setShowWarning(true);
      
      // Start countdown
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, IDLE_TIMEOUT - WARNING_BEFORE);

    // Set logout timer (30 phút)
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, IDLE_TIMEOUT);
  }, [isAuthenticated]);

  // Xử lý logout
  const handleLogout = useCallback(async () => {
    setShowWarning(false);
    await logout();
    navigate('/login', { 
      state: { 
        sessionExpired: true,
        message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
      }
    });
  }, [logout, navigate]);

  // Xử lý continue session
  const handleContinue = useCallback(() => {
    resetTimers();
  }, [resetTimers]);

  // Theo dõi hoạt động của user
  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      if (!showWarning) {
        resetTimers();
      }
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Initial setup
    resetTimers();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isAuthenticated, showWarning, resetTimers]);

  // Format countdown
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isAuthenticated) return null;

  return (
    <Modal
      title={
        <span>
          <WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />
          Phiên đăng nhập sắp hết hạn
        </span>
      }
      open={showWarning}
      closable={false}
      maskClosable={false}
      footer={[
        <Button key="logout" onClick={handleLogout}>
          Đăng xuất
        </Button>,
        <Button key="continue" type="primary" onClick={handleContinue}>
          Tiếp tục làm việc
        </Button>
      ]}
    >
      <p>
        Phiên đăng nhập của bạn sẽ tự động kết thúc sau{' '}
        <strong style={{ color: '#ff4d4f', fontSize: 18 }}>
          {formatTime(countdown)}
        </strong>
      </p>
      <p style={{ color: '#666', fontSize: 13 }}>
        Nhấn "Tiếp tục làm việc" để duy trì phiên đăng nhập.
      </p>
    </Modal>
  );
};

export default SessionTimeout;
