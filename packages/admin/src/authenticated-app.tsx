import React, { useState } from 'react'
import type { MenuProps } from 'antd'
import { Breadcrumb, Layout, theme } from 'antd'
import { useNavigate, Route, Routes } from 'react-router-dom'
import HeaderComponent from '@/components/header'
import SiderComponent from '@/components/sider'
import DashboardPage from '@/screens/dashboard'
import VisitorPage from '@/screens/visitor'
import BehaviorPage from '@/screens/behavior'
import CustomerPage from '@/screens/customer'
import ErrorPage from '@/screens/error/error-overview'
import ErrorLogsPage from '@/screens/error/error-logs'
import PerformancePage from '@/screens/performance'
import BlankPage from '@/screens/blank'

const { Content, Footer } = Layout

const AuthenticatedApp: React.FC = () => {
  const [currentKey, setCurrentKey] = useState('sub1')
  const navigate = useNavigate()
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  const onMenuClick: MenuProps['onClick'] = (e) => {
    setCurrentKey(e.key)
    // 根据菜单key导航到对应的路由
    const routeMap: Record<string, string> = {
      sub11: '/home/dashboard',
      sub21: '/home/visitor',
      sub31: '/home/behavior',
      sub41: '/home/customer',
      sub51: '/home/error',
      sub52: '/home/error/logs',
      sub61: '/home/performance',
      sub71: '/home/blank',
    }
    const route = routeMap[e.key]
    if (route) {
      navigate(route)
    }
  }
  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <HeaderComponent />
      <div style={{ flex: 1, padding: '0 48px', display: 'flex', flexDirection: 'column' }}>
        <Breadcrumb
          style={{ margin: '16px 0' }}
          items={[{ title: 'Home' }, { title: 'List' }, { title: 'App' }]}
        />
        <Layout
          style={{
            flex: 1,
            padding: '24px 0',
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            display: 'flex',
          }}
        >
          <SiderComponent
            currentKey={currentKey}
            onMenuClick={onMenuClick}
            colorBgContainer={colorBgContainer}
          />
          <Content style={{ padding: '0 24px', maxHeight: 684, overflow: 'auto' }}>
            <Routes>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="visitor" element={<VisitorPage />} />
              <Route path="behavior" element={<BehaviorPage />} />
              <Route path="customer" element={<CustomerPage />} />
              <Route path="error" element={<ErrorPage />} />
              <Route path="error/logs" element={<ErrorLogsPage />} />
              <Route path="performance" element={<PerformancePage />} />
              <Route path="blank" element={<BlankPage />} />
            </Routes>
          </Content>
        </Layout>
      </div>
      <Footer style={{ textAlign: 'center' }}>
        Ant Design ©{new Date().getFullYear()} Created by Ant UED
      </Footer>
    </Layout>
  )
}

export default AuthenticatedApp
