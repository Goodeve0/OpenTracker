import axios from 'axios'
import { getToken, removeToken } from '@/utils/token'

// 创建 axios 实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 5000,
})

// 请求拦截器：添加 token
service.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      // 给请求头添加 Authorization 字段（真实后端常用格式）
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器：处理 token 无效/过期
service.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // token 无效/过期：清除 token + 跳转登录页
      removeToken()
      alert('登录已过期，请重新登录')
      // 跳转登录页（配合 React Router）
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default service
