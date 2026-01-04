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
      // token 无效/过期：清除 token
      removeToken()
      // 检查当前页面是否已经是登录页面，避免登录失败时页面刷新
      // 登录页面的实际路径是 / 而不是 /login
      if (window.location.pathname !== '/') {
        alert('登录已过期，请重新登录')
        window.location.href = '/' // 重定向到登录页面
      }
    }
    return Promise.reject(error)
  }
)

export default service
