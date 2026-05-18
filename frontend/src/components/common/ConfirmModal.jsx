import { Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const { confirm } = Modal;

/**
 * Hiển thị modal xác nhận
 * @param {object} options
 * @param {string} options.title - Tiêu đề
 * @param {string} options.content - Nội dung
 * @param {function} options.onOk - Callback khi xác nhận
 * @param {function} options.onCancel - Callback khi hủy
 * @param {string} options.okText - Text nút xác nhận
 * @param {string} options.cancelText - Text nút hủy
 * @param {string} options.type - Loại: danger, warning, info
 */
export const showConfirm = ({
  title = 'Xác nhận',
  content = 'Bạn có chắc chắn muốn thực hiện hành động này?',
  onOk,
  onCancel,
  okText = 'Xác nhận',
  cancelText = 'Hủy',
  type = 'warning'
}) => {
  const config = {
    title,
    icon: <ExclamationCircleOutlined />,
    content,
    okText,
    cancelText,
    onOk,
    onCancel,
  };

  if (type === 'danger') {
    config.okButtonProps = { danger: true };
  }

  confirm(config);
};

/**
 * Modal xác nhận xóa
 */
export const showDeleteConfirm = ({
  title = 'Xác nhận xóa',
  content = 'Bạn có chắc chắn muốn xóa? Hành động này không thể hoàn tác.',
  itemName = '',
  onOk,
  onCancel
}) => {
  const deleteContent = itemName 
    ? `Bạn có chắc chắn muốn xóa "${itemName}"? Hành động này không thể hoàn tác.`
    : content;

  showConfirm({
    title,
    content: deleteContent,
    onOk,
    onCancel,
    okText: 'Xóa',
    type: 'danger'
  });
};

export default { showConfirm, showDeleteConfirm };
