import { Typography, Space, Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';
import { HomeOutlined } from '@ant-design/icons';

const { Title } = Typography;

const PageHeader = ({ 
  title, 
  subtitle,
  breadcrumbs = [],
  extra 
}) => {
  return (
    <div style={{ marginBottom: 24 }}>
      {/* Breadcrumb */}
      {breadcrumbs.length > 0 && (
        <Breadcrumb style={{ marginBottom: 16 }}>
          <Breadcrumb.Item>
            <Link to="/dashboard">
              <HomeOutlined />
            </Link>
          </Breadcrumb.Item>
          {breadcrumbs.map((item, index) => (
            <Breadcrumb.Item key={index}>
              {item.path ? (
                <Link to={item.path}>{item.title}</Link>
              ) : (
                item.title
              )}
            </Breadcrumb.Item>
          ))}
        </Breadcrumb>
      )}

      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <Title level={3} style={{ marginBottom: subtitle ? 8 : 0 }}>
            {title}
          </Title>
          {subtitle && (
            <Typography.Text type="secondary">
              {subtitle}
            </Typography.Text>
          )}
        </div>
        
        {extra && (
          <Space wrap>
            {extra}
          </Space>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
