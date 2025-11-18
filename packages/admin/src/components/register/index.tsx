import { useState, useEffect } from 'react'
import axios from 'axios'
import { RegisterParams, User } from '@/types'

const Register = () => {
  const [form, setForm] = useState<RegisterParams>({
    username: '',
    password: '',
    role: 'user',
  })
  const [loading, setLoading] = useState(false)
  // 提示状态：仅 success/error/''，确保只有一种提示显示
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // 提示自动消失（3秒）
  useEffect(() => {
    const timer = setTimeout(() => {
      setSuccessMsg('')
      setErrorMsg('')
    }, 3000)
    return () => clearTimeout(timer) // 组件卸载时清除定时器，避免内存泄漏
  }, [successMsg, errorMsg])

  // 清除提示（手动触发）
  const clearMsg = () => {
    setSuccessMsg('')
    setErrorMsg('')
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMsg() // 点击注册先清空之前的提示

    // 表单校验（无 alert，用 errorMsg 显示）
    if (!form.username.trim()) {
      setErrorMsg('用户名不能为空')
      return
    }
    if (!form.password.trim()) {
      setErrorMsg('密码不能为空')
      return
    }
    if (form.password.length < 3) {
      setErrorMsg('密码长度不能少于3位')
      return
    }

    setLoading(true)
    try {
      // 1. 检查用户名是否已存在
      const existingRes = await axios.get<User[]>('/api/users', {
        params: { username: form.username },
      })

      if (existingRes.data.length > 0) {
        setErrorMsg('用户名已被注册，请更换')
        setLoading(false)
        return
      }

      // 2. 注册新用户
      await axios.post<User>('/api/users', form)
      setSuccessMsg('注册成功！可直接登录')
      // 重置表单
      setForm({ username: '', password: '', role: 'user' })
    } catch (err) {
      setErrorMsg('注册失败，请稍后重试')
      console.error('注册失败：', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        maxWidth: '350px',
        margin: '20px auto',
        padding: '20px',
        border: '1px solid #eee',
        borderRadius: '8px',
      }}
    >
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>用户注册</h2>

      {/* 表单 */}
      <form
        onSubmit={handleRegister}
        style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
      >
        {/* 用户名输入框 */}
        <div>
          <input
            type="text"
            value={form.username}
            onChange={(e) => {
              setForm({ ...form, username: e.target.value })
              clearMsg() // 输入时清空提示
            }}
            placeholder="请输入用户名"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '16px',
            }}
          />
        </div>

        {/* 密码输入框 */}
        <div>
          <input
            type="password"
            value={form.password}
            onChange={(e) => {
              setForm({ ...form, password: e.target.value })
              clearMsg() // 输入时清空提示
            }}
            placeholder="请输入密码（不少于6位）"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '16px',
            }}
          />
        </div>

        {/* 注册按钮 */}
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: '#28a745',
            color: 'white',
            fontSize: '16px',
            cursor: 'pointer',
            opacity: loading ? 0.8 : 1,
          }}
        >
          {loading ? '注册中...' : '立即注册'}
        </button>
      </form>

      {/* 成功提示（绿色，顶部显示） */}
      {successMsg && (
        <div
          style={{
            marginTop: '15px',
            padding: '10px',
            borderRadius: '4px',
            backgroundColor: '#d4edda',
            color: '#155724',
            fontSize: '14px',
            textAlign: 'center',
            border: '1px solid #c3e6cb',
          }}
        >
          {successMsg}
        </div>
      )}

      {/* 错误提示（红色，顶部显示） */}
      {errorMsg && (
        <div
          style={{
            marginTop: '15px',
            padding: '10px',
            borderRadius: '4px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            fontSize: '14px',
            textAlign: 'center',
            border: '1px solid #f5c6cb',
          }}
        >
          {errorMsg}
        </div>
      )}
    </div>
  )
}

export default Register
