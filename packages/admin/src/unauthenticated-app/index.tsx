import { useState } from 'react'
import { Card, Button } from 'antd'
import Login from './login'
import Register from './register'

const AuthPage = () => {
  // 切换状态：true=登录，false=注册
  const [isLogin, setIsLogin] = useState(true)

  // 切换登录/注册
  const toggleAuth = () => {
    setIsLogin(!isLogin)
  }

  return (
    <div style={{ maxWidth: '350px', margin: '50px auto' }}>
      <Card
        title={
          <h2 style={{ margin: 0, textAlign: 'center' }}>{isLogin ? '用户登录' : '用户注册'}</h2>
        }
      >
        {/* 根据状态渲染登录或注册组件 */}
        {isLogin ? <Login /> : <Register />}

        {/* 切换按钮（底部文字链接） */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <span style={{ color: 'rgba(0, 0, 0, 0.65)' }}>
            {isLogin ? '没有账号？' : '已有账号？'}
          </span>
          <Button type="link" onClick={toggleAuth} style={{ padding: 0, marginLeft: 4 }}>
            {isLogin ? '点击注册' : '点击登录'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default AuthPage
