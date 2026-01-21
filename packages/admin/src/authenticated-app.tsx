import React, { useState, useEffect } from 'react'
import type { MenuProps } from 'antd'
import { Breadcrumb, Layout, theme } from 'antd'
import { useNavigate, Route, Routes, useLocation } from 'react-router-dom'
import HeaderComponent from '@/components/header'
import SiderComponent from '@/components/sider'
import DashboardPage from '@/screens/dashboard'
import VisitorPage from '@/screens/visitor'
import VisitorTrends from '@/screens/visitor/visitor-Trends'
import BehaviorPage from '@/screens/behavior'
import BehaviorVisitedPages from '@/screens/behavior/behavior-visited pages'

import CustomerGrowth from '@/screens/customer/customer-growth'
import CustomerSource from '@/screens/customer/customer-source'
import ErrorPage from '@/screens/error/error-overview'
import ErrorLogsPage from '@/screens/error/error-logs'
import PerformancePage from '@/screens/performance'
import BlankPage from '@/screens/blank'
import VisitorDevice from './screens/visitor/visitor-Device'
import BehaviorEvent from './screens/behavior/behavior-event'

const { Content, Footer } = Layout

const AuthenticatedApp: React.FC = () => {
  const [currentKey, setCurrentKey] = useState('sub11')
  const navigate = useNavigate()
  const location = useLocation()
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  // 路由到菜单key的映射
  const routeToKeyMap: Record<string, string> = {
    '/home/dashboard': 'sub11',
    '/home/visitor/trends': 'sub21',
    '/home/visitor/device': 'sub22',
    '/home/behavior/event': 'sub31',
    '/home/behavior/page': 'sub32',
    '/home/customer/channel': 'sub41',
    '/home/customer/source': 'sub42',
    '/home/error': 'sub51',
    '/home/error/logs': 'sub52',
    '/home/performance': 'sub61',
    '/home/blank': 'sub71',
  }

  // 根据当前URL设置菜单选中状态
  useEffect(() => {
    const key = routeToKeyMap[location.pathname] || 'sub11'
    setCurrentKey(key)
  }, [location.pathname])

  const onMenuClick: MenuProps['onClick'] = (e) => {
    setCurrentKey(e.key)
    // 根据菜单key导航到对应的路由
    const routeMap: Record<string, string> = {
      sub11: '/home/dashboard',
      sub21: '/home/visitor/trends',
      sub22: '/home/visitor/device',
      sub31: '/home/behavior/event',
      sub32: '/home/behavior/page',
      sub41: '/home/customer/channel',
      sub42: '/home/customer/source',
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
          <Content style={{ padding: '0 24px', overflow: 'visible' }}>
            <div style={{ maxHeight: 684, overflow: 'auto' }}>
              <Routes>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="visitor" element={<VisitorPage />} />
                <Route path="visitor/trends" element={<VisitorTrends />} />
                <Route path="visitor/device" element={<VisitorDevice />} />
                <Route path="behavior" element={<BehaviorPage />} />
                <Route path="behavior/page" element={<BehaviorVisitedPages />} />
                <Route path="behavior/event" element={<BehaviorEvent />} />
                <Route path="customer/channel" element={<CustomerGrowth />} />
                <Route path="customer/source" element={<CustomerSource />} />
                <Route path="error" element={<ErrorPage />} />
                <Route path="error/logs" element={<ErrorLogsPage />} />
                <Route path="performance" element={<PerformancePage />} />
                <Route path="blank" element={<BlankPage />} />
              </Routes>
            </div>
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
