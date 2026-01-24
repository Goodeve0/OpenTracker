import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.js'
import 'antd/dist/reset.css' // 引入 Ant Design 重置样式表
import { UserVitals } from '../../sdk/plugins/src/index.js'

// 注释掉SDK初始化，避免性能指标不断刷新
// const initTracker = () => {
//   try {
//     // 创建一个简单的引擎实例（不需要实际发送到服务器）
//     const engineInstance = {
//       send: (data: any) => {
//         console.log('SDK Engine Send:', data)
//         // 这里的发送逻辑已经被SDK内部的localStorage存储逻辑替代
//       },
//     }

//     // 初始化UserVitals
//     const userVitals = new UserVitals(engineInstance)
//     console.log('🚀 行为监控SDK初始化成功', userVitals)

//     // 暴露到window以便调试
//     ;(window as any).userVitals = userVitals
//   } catch (error) {
//     console.error('❌ 行为监控SDK初始化失败:', error)
//   }
// }

// 注释掉SDK初始化，避免性能指标不断刷新
// initTracker()

const container = document.getElementById('root')
if (container) {
  ReactDOM.createRoot(container).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
} else {
  console.error('找不到root元素')
}
