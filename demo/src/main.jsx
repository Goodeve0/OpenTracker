import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// 导入并初始化 OpenTracker SDK
import { initTracker } from '@opentracker/sdk'

// 初始化 SDK
initTracker({
  apiKey: 'demo_project_123', // 这里使用你在后台管理系统中创建的项目的API Key
  serverUrl: 'http://localhost:3000', // OpenTracker 服务端地址
  debug: true, // 开启调试模式
  userId: 'demo_user_123', // 示例用户ID
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
