import { useState, useEffect } from 'react'
import axios from 'axios'
import { User } from '@/types'
import { generateToken, setToken } from '@/utils/token'

const Login = () => {
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setSuccessMsg('')
      setErrorMsg('')
    }, 3000)
    return () => clearTimeout(timer)
  }, [successMsg, errorMsg])

  const clearMsg = () => {
    setSuccessMsg('')
    setErrorMsg('')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMsg()

    if (!form.username.trim() || !form.password.trim()) {
      setErrorMsg('用户名和密码不能为空')
      return
    }

    setLoading(true)
    try {
      const res = await axios.get<User[]>('/api/users', {
        params: { username: form.username, password: form.password },
      })
      // 登录成功（状态码 200）
      const user = res.data[0]
      const token = generateToken({ id: user.id, username: user.username, role: user.role })
      setToken(token)
      setSuccessMsg('登录成功！即将跳转首页')
      setTimeout(() => {
        window.location.href = '/home'
      }, 2000)
    } catch (err) {
      // 登录失败（状态码 401）
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setErrorMsg('用户名或密码错误')
      } else {
        setErrorMsg('登录失败，请稍后重试')
      }
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
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>用户登录</h2>

      {/* 表单 */}
      <form
        onSubmit={handleLogin}
        style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
      >
        {/* 用户名输入框 */}
        <div>
          <input
            type="text"
            value={form.username}
            onChange={(e) => {
              setForm({ ...form, username: e.target.value })
              clearMsg()
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
              clearMsg()
            }}
            placeholder="请输入密码"
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

        {/* 登录按钮 */}
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: '#007bff',
            color: 'white',
            fontSize: '16px',
            cursor: 'pointer',
            opacity: loading ? 0.8 : 1,
          }}
        >
          {loading ? '登录中...' : '立即登录'}
        </button>
      </form>

      {/* 成功提示 */}
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

      {/* 错误提示 */}
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

export default Login
