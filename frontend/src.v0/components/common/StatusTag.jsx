import { Tag } from 'antd';
import { 
  ORDER_STATUS_LABELS, 
  ORDER_STATUS_COLORS,
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_COLORS,
  TRANSACTION_TYPE_LABELS,
  PAYMENT_METHOD_LABELS
} from '../../utils/constants';

/**
 * Component hiển thị trạng thái với màu sắc
 */
const StatusTag = ({ 
  type = 'order', 
  status, 
  customLabel,
  customColor 
}) => {
  let label = customLabel || status;
  let color = customColor;

  switch (type) {
    case 'order':
      label = customLabel || ORDER_STATUS_LABELS[status] || status;
      color = customColor || ORDER_STATUS_COLORS[status] || 'default';
      break;
    
    case 'task':
      label = customLabel || TASK_STATUS_LABELS[status] || status;
      // Task status colors
      const taskColors = {
        PENDING: 'orange',
        IN_PROGRESS: 'processing',
        COMPLETED: 'success',
        CANCELLED: 'error'
      };
      color = customColor || taskColors[status] || 'default';
      break;
    
    case 'priority':
      label = customLabel || TASK_PRIORITY_LABELS[status] || status;
      color = customColor || TASK_PRIORITY_COLORS[status] || 'default';
      break;
    
    case 'transaction':
      label = customLabel || TRANSACTION_TYPE_LABELS[status] || status;
      color = customColor || (status === 'IMPORT' ? 'green' : 'blue');
      break;
    
    case 'payment':
      label = customLabel || PAYMENT_METHOD_LABELS[status] || status;
      color = customColor || 'blue';
      break;
    
    case 'salary':
      label = customLabel || (status ? 'Đã trả' : 'Chưa trả');
      color = customColor || (status ? 'success' : 'warning');
      break;

    case 'active':
      label = customLabel || (status ? 'Hoạt động' : 'Ngừng');
      color = customColor || (status ? 'success' : 'default');
      break;
    
    default:
      break;
  }

  return <Tag color={color}>{label}</Tag>;
};

export default StatusTag;
