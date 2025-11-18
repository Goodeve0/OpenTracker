// src/App.tsx
import React from 'react'
import AuthPage from './components/Authpage' // 引入合并后的组件

const App = () => {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', margin: '30px 0', color: '#333' }}>登录注册</h1>
      {/* 只渲染合并后的认证组件 */}
      <AuthPage />
    </div>
  )
}

export default App
