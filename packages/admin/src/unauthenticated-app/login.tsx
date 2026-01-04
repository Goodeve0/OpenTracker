import { useState, useEffect } from 'react'
import { Form, Input, Button, Alert } from 'antd'
import type { Rule } from 'antd/es/form'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '@/api/auth'
import { setToken } from '@/utils/token'

const Login = () => {
  // 导航钩子
  const navigate = useNavigate()
  // 表单实例
  const [form] = Form.useForm()
  // 加载状态
  const [loading, setLoading] = useState(false)
  // 提示信息状态
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // 提示自动消失（3秒）
  useEffect(() => {
    const timer = setTimeout(() => {
      setSuccessMsg('')
      setErrorMsg('')
    }, 3000)
    return () => clearTimeout(timer)
  }, [successMsg, errorMsg])

  // 清除提示
  const clearMsg = () => {
    setSuccessMsg('')
    setErrorMsg('')
  }

  // 登录逻辑
  const handleLogin = async (values: { login: string; password: string }) => {
    const { login, password } = values
    clearMsg()

    setLoading(true)
    try {
      // 使用正确的参数名调用API
      const response = await authAPI.login(login, password)

      if (response.code === 200) {
        // 登录成功：保存token并跳转
        const { user } = response.data
        const tokenData = { id: user.id, username: user.login }
        setToken(JSON.stringify(tokenData))
        setSuccessMsg('登录成功！即将跳转首页')

        setTimeout(() => {
          // 登录成功后跳转到主页
          navigate('/home')
        }, 2000)
      } else {
        // 登录失败
        setErrorMsg(response.message || '用户名或密码错误')
      }
    } catch (err: any) {
      console.error('登录失败：', err)
      // 处理400和401错误（用户名或密码错误等）
      if (err.response?.status === 400 || err.response?.status === 401) {
        // 检查是否有服务器返回的具体错误消息
        const serverMessage = err.response?.data?.message
        setErrorMsg(serverMessage || '用户名或密码错误')
      } else {
        setErrorMsg('登录失败，请检查网络连接或稍后重试')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 350, margin: '20px auto', padding: 20 }}>
      <h2 style={{ textAlign: 'center', marginBottom: 20 }}>用户登录</h2>

      {/* 成功提示 */}
      {successMsg && (
        <Alert message={successMsg} type="success" showIcon style={{ marginBottom: 16 }} />
      )}

      {/* 错误提示 */}
      {errorMsg && <Alert message={errorMsg} type="error" showIcon style={{ marginBottom: 16 }} />}

      {/* Ant Design 表单 */}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleLogin}
        initialValues={{ login: '', password: '' }}
        // 输入时清空提示
        onValuesChange={() => clearMsg()}
      >
        {/* 用户名输入框 */}
        <Form.Item
          label="用户名"
          name="login"
          rules={[{ required: true, message: '请输入用户名' } as Rule]}
        >
          <Input placeholder="请输入用户名" disabled={loading} />
        </Form.Item>

        {/* 密码输入框 */}
        <Form.Item
          label="密码"
          name="password"
          rules={[{ required: true, message: '请输入密码' } as Rule]}
        >
          <Input.Password placeholder="请输入密码" disabled={loading} />
        </Form.Item>

        {/* 提交按钮 */}
        <Form.Item>
          <Button type="primary" block loading={loading} htmlType="submit">
            {loading ? '登录中...' : '立即登录'}
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default Login
