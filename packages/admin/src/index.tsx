import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.js'
import 'antd/dist/reset.css' // 引入 Ant Design 重置样式表
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
