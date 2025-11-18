import { useState, useEffect } from 'react'
import axios from 'axios'
import { User } from '@/types'
import { generateToken, setToken } from '@/utils/token'
import { Form, Input, Button, Card, Alert } from 'antd'
import type { Rule } from 'antd/es/form'
const AuthPage = () => {
  // 切换状态：true=登录，false=注册
  const [isLogin, setIsLogin] = useState(true)
  // 表单实例
  const [form] = Form.useForm()
  // 加载状态
  const [loading, setLoading] = useState(false)
  // 提示信息状态 - 保留原始功能
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // 提示自动消失（3秒）- 保留原始功能
  useEffect(() => {
    const timer = setTimeout(() => {
      setSuccessMsg('')
      setErrorMsg('')
    }, 3000)
    return () => clearTimeout(timer)
  }, [successMsg, errorMsg])

  // 清除提示（手动触发）- 保留原始功能
  const clearMsg = () => {
    setSuccessMsg('')
    setErrorMsg('')
  }

  // 切换登录/注册（清空表单和提示）- 保留原始功能
  const toggleAuth = () => {
    setIsLogin(!isLogin)
    form.resetFields() // 重置表单
    clearMsg() // 清除提示信息
  }

  // 注册逻辑 - 保留原始功能，使用antd组件展示提示
  const handleRegister = async (values: { username: string; password: string }) => {
    const { username, password } = values

    setLoading(true)
    try {
      // 检查用户名是否已存在
      const res = await axios.get<User[]>('/api/users', { params: { username } })
      if (res.data.length > 0) {
        setErrorMsg('用户名已被注册，请更换')
        return
      }

      // 注册新用户
      await axios.post<User>('/api/users', { username, password, role: 'user' })
      setSuccessMsg('注册成功！可直接登录')
      // 重置表单
      form.resetFields()
    } catch (err) {
      console.error('注册失败：', err)
      setErrorMsg('注册失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 登录逻辑 - 保留原始功能，使用antd组件展示提示
  const handleLogin = async (values: { username: string; password: string }) => {
    const { username, password } = values

    setLoading(true)
    try {
      // 校验用户
      const res = await axios.get<User[]>('/api/users', {
        params: { username, password },
      })

      // 前端判断：空数组=登录失败
      if (res.data.length === 0) {
        setErrorMsg('用户名或密码错误')
        return
      }

      // 登录成功：生成token并跳转
      const user = res.data[0]
      const token = generateToken({ id: user.id, username: user.username, role: user.role })
      setToken(token)
      setSuccessMsg('登录成功！即将跳转首页')
      setTimeout(() => {
        window.location.href = '/home'
      }, 2000)
    } catch (err) {
      console.error('登录失败：', err)
      // 处理401错误
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setErrorMsg('用户名或密码错误')
      } else {
        setErrorMsg('登录失败，请稍后重试')
      }
    } finally {
      setLoading(false)
    }
  }

  // 提交事件（根据isLogin判断执行登录/注册）
  const handleSubmit = (values: { username: string; password: string }) => {
    clearMsg() // 点击提交先清空之前的提示
    if (isLogin) {
      handleLogin(values)
    } else {
      handleRegister(values)
    }
  }

  return (
    <div style={{ maxWidth: '350px', margin: '50px auto' }}>
      <Card title={<h2 style={{ margin: 0 }}>{isLogin ? '用户登录' : '用户注册'}</h2>}>
        {/* 成功提示 - 使用Alert组件替代原始样式 */}
        {successMsg && (
          <Alert message={successMsg} type="success" showIcon style={{ marginBottom: 16 }} />
        )}

        {/* 错误提示 - 使用Alert组件替代原始样式 */}
        {errorMsg && (
          <Alert message={errorMsg} type="error" showIcon style={{ marginBottom: 16 }} />
        )}

        {/* 表单 */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ username: '', password: '' }}
          // 输入时清空提示 - 保留原始功能
          onValuesChange={() => clearMsg()} // 忽略参数，直接调用clearMsg
        >
          {/* 用户名输入框 */}
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' } as Rule]}
          >
            <Input
              placeholder="请输入用户名"
              disabled={loading}
              // 使用antd的设计样式，去除自定义样式
            />
          </Form.Item>

          {/* 密码输入框 */}
          <Form.Item
            label="密码"
            name="password"
            rules={
              [
                { required: true, message: '请输入密码' },
                { min: 3, message: '密码长度不能少于3位', when: () => !isLogin },
              ] as Rule[]
            }
          >
            <Input.Password
              placeholder={isLogin ? '请输入密码' : '请输入密码（不少于3位）'}
              disabled={loading}
            />
          </Form.Item>

          {/* 提交按钮（根据状态切换文字和类型） */}
          <Form.Item>
            <Button
              type={isLogin ? 'primary' : 'primary'}
              block
              loading={loading}
              htmlType="submit"
              // 使用antd的type属性替代自定义背景色
            >
              {loading ? (isLogin ? '登录中...' : '注册中...') : isLogin ? '立即登录' : '立即注册'}
            </Button>
          </Form.Item>
        </Form>

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
