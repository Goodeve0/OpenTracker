import React from 'react'
import { Card, Tabs } from 'antd'
import { BugOutlined, CodeOutlined, ApiOutlined, ThunderboltOutlined } from '@ant-design/icons'

import JsErrorTable from './components/js-error-table'
import FrameworkErrorTable from './components/framework-error-table'
import ApiErrorTable from './components/api-error-table'
import CrashErrorTable from './components/crash-error-table'

const ErrorLogs = () => {
  const items = [
    {
      key: 'js',
      label: (
        <span>
          <BugOutlined />
          JS 运行时错误
        </span>
      ),
      children: <JsErrorTable />,
    },
    {
      key: 'framework',
      label: (
        <span>
          <CodeOutlined />
          React 组件错误
        </span>
      ),
      children: <FrameworkErrorTable />,
    },
    {
      key: 'api',
      label: (
        <span>
          <ApiOutlined />
          API 网络异常
        </span>
      ),
      children: <ApiErrorTable />,
    },
    {
      key: 'crash',
      label: (
        <span>
          <ThunderboltOutlined />
          页面崩溃
        </span>
      ),
      children: <CrashErrorTable />,
    },
  ]

  // 页面布局
  return (
    <div style={{ padding: 24 }}>
      <Card title="前端监控日志查询" styles={{ body: { padding: 0 } }}>
        <Tabs defaultActiveKey="js" items={items} type="card" size="large" />
      </Card>
    </div>
  )
}

export default ErrorLogs
