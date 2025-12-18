// src/App.tsx
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { getToken } from '@/utils/token'
import UnauthenticatedApp from './unauthenticated-app' // 非认证页面（登录/注册）
import AuthenticatedApp from './authenticated-app' // 认证后页面（主页）
import UserProfilePage from '@/screens/user' // 个人资料页面

// 路由守卫组件
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // 检查是否存在token
  const isAuthenticated = !!getToken()

  if (!isAuthenticated) {
    // 未登录则重定向到登录页面
    return <Navigate to="/" replace />
  }

  // 已登录则渲染子组件
  return <>{children}</>
}

// 未认证路由守卫（已登录用户不能访问登录/注册页）
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = !!getToken()

  if (isAuthenticated) {
    // 已登录则重定向到主页
    return <Navigate to="/home" replace />
  }

  // 未登录则渲染子组件
  return <>{children}</>
}

const App = () => {
  return (
    <Router>
      <div style={{ maxWidth: '100%' }}>
        <Routes>
          {/* 根路径 - 登录/注册页面 */}
          <Route
            path="/"
            element={
              <PublicRoute>
                <UnauthenticatedApp />
              </PublicRoute>
            }
          />

          {/* 主页 - 需要认证才能访问 */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <AuthenticatedApp />
              </ProtectedRoute>
            }
          />
          {/* 允许AuthenticatedApp处理所有/home下的子路径 */}
          <Route
            path="/home/*"
            element={
              <ProtectedRoute>
                <AuthenticatedApp />
              </ProtectedRoute>
            }
          />

          {/* 个人资料页面 - 直接放在根级，不嵌套在authenticated-app中 */}
          <Route
            path="/user"
            element={
              <ProtectedRoute>
                <UserProfilePage />
              </ProtectedRoute>
            }
          />

          {/* 捕获所有未匹配的路由，已登录用户重定向到/home，未登录用户重定向到/ */}
          <Route
            path="*"
            element={!!getToken() ? <Navigate to="/home" replace /> : <Navigate to="/" replace />}
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
