import { useState } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { SessionTimeout } from '../common';

const { Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Session Timeout Warning */}
      <SessionTimeout />
      
      {/* Sidebar */}
      <Sidebar 
        collapsed={collapsed} 
        onCollapse={setCollapsed} 
      />

      {/* Main Content Area */}
      <Layout style={{ 
        marginLeft: collapsed ? 80 : 200,
        transition: 'margin-left 0.2s'
      }}>
        {/* Header */}
        <Header 
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />

        {/* Content */}
        <Content style={{
          margin: 24,
          padding: 24,
          background: '#fff',
          borderRadius: 8,
          minHeight: 'calc(100vh - 64px - 48px)' // Trừ header và margin
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
