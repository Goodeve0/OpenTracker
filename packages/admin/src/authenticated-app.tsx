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
import ErrorPage from '@/screens/error'
import ErrorLogsPage from '@/screens/error/error-logs'
import ErrorOverviewPage from '@/screens/error/error-overview'
import PerformancePage from '@/screens/performance'
import PerformanceOverviewPage from '@/screens/performance/overview'
import BlankPage from '@/screens/blank'
import BlankAnalysisPage from '@/screens/blank/components/blank-overview'
import VisitorDevice from './screens/visitor/visitor-Device'
import BehaviorEvent from './screens/behavior/behavior-event'

import { routeToKeyMap, routeNameMap, routeMap } from './config/routeMap'

const { Content, Footer } = Layout

const AuthenticatedApp: React.FC = () => {
  const [currentKey, setCurrentKey] = useState('sub11')
  const navigate = useNavigate()
  const location = useLocation()
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  // 生成面包屑项
  const getBreadcrumbItems = () => {
    const pathSegments = location.pathname.split('/').filter((segment) => segment)
    const breadcrumbItems: Array<{ title: string; href?: string }> = [
      { title: '首页', href: '/home' },
    ]

    let currentPath = ''
    for (const segment of pathSegments) {
      currentPath += `/${segment}`
      if (currentPath === '/home') continue // 跳过首页，已经添加

      const title = routeNameMap[currentPath] || segment
      breadcrumbItems.push({ title })
    }

    return breadcrumbItems
  }

  // 根据当前URL设置菜单选中状态
  useEffect(() => {
    const key = routeToKeyMap[location.pathname] || 'sub11'
    setCurrentKey(key)
  }, [location.pathname])

  const onMenuClick: MenuProps['onClick'] = (e) => {
    setCurrentKey(e.key)
    // 根据菜单key导航到对应的路由
    const route = routeMap[e.key]
    if (route) {
      navigate(route)
    }
  }
  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <HeaderComponent />
      <div style={{ flex: 1, padding: '0 48px', display: 'flex', flexDirection: 'column' }}>
        <Breadcrumb style={{ margin: '16px 0' }} items={getBreadcrumbItems()} />
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
                <Route path="customer/growth" element={<CustomerGrowth />} />
                <Route path="customer/source" element={<CustomerSource />} />
                <Route path="error" element={<ErrorPage />} />
                <Route path="error/logs" element={<ErrorLogsPage />} />
                <Route path="error/overview" element={<ErrorOverviewPage />} />
                <Route path="performance" element={<PerformancePage />} />
                <Route path="performance/overview" element={<PerformanceOverviewPage />} />
                <Route path="blank" element={<BlankPage />} />
                <Route path="blank/analysis" element={<BlankAnalysisPage />} />
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
