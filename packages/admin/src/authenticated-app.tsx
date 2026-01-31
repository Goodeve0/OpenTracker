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
    '/home/customer/growth': 'sub41',
    '/home/customer/source': 'sub42',
    '/home/error/overview': 'sub51',
    '/home/error/logs': 'sub52',
    '/home/performance/overview': 'sub61',
    '/home/blank/analysis': 'sub71',
  }

  // 路由名称映射，用于生成面包屑
  const routeNameMap: Record<string, string> = {
    '/home': '首页',
    '/home/dashboard': '数据概览',
    '/home/visitor': '访客分析',
    '/home/visitor/trends': '访客趋势',
    '/home/visitor/device': '设备分析',
    '/home/behavior': '行为分析',
    '/home/behavior/event': '事件分析',
    '/home/behavior/page': '页面访问',
    '/home/customer': '获客分析',
    '/home/customer/growth': '用户增长',
    '/home/customer/source': '来源分析',
    '/home/error': '错误分析',
    '/home/error/logs': '错误日志',
    '/home/error/overview': '错误概览',
    '/home/performance': '性能分析',
    '/home/performance/overview': '性能概览',
    '/home/blank': '白屏监控',
    '/home/blank/analysis': '白屏分析',
  }

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
    const routeMap: Record<string, string> = {
      sub11: '/home/dashboard',
      sub21: '/home/visitor/trends',
      sub22: '/home/visitor/device',
      sub31: '/home/behavior/event',
      sub32: '/home/behavior/page',
      sub41: '/home/customer/growth',
      sub42: '/home/customer/source',
      sub51: '/home/error/overview',
      sub52: '/home/error/logs',
      sub61: '/home/performance/overview',
      sub71: '/home/blank/analysis',
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
