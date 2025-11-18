// src/utils/token.ts
import { User } from '@/types'

// 生成 token（模拟 JWT 格式：用户信息 Base64 + 随机字符串）
export const generateToken = (user: Omit<User, 'password'>): string => {
  const userStr = JSON.stringify(user)
  const base64User = btoa(unescape(encodeURIComponent(userStr))) // Base64 编码用户信息
  const randomStr = Math.random().toString(36).substring(2, 15) // 随机字符串
  return `${base64User}.${randomStr}` // 格式：userInfo.base64.random
}

// 解析 token（从 token 中提取用户信息）
export const parseToken = (token: string): Omit<User, 'password'> | null => {
  try {
    const [base64User] = token.split('.')
    const userStr = decodeURIComponent(escape(atob(base64User)))
    return JSON.parse(userStr)
  } catch (err) {
    return null
  }
}

// 存储 token 到 localStorage
export const setToken = (token: string) => {
  localStorage.setItem('authToken', token)
}

// 获取本地 token
export const getToken = (): string | null => {
  return localStorage.getItem('authToken')
}

// 删除 token（退出登录）
export const removeToken = () => {
  localStorage.removeItem('authToken')
}
