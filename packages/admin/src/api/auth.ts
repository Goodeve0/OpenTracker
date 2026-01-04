import axios from 'axios'
import { API_BASE_URL, API_ENDPOINTS, ApiResponse, LoginData, RegisterData } from './config'

// 创建 axios 实例
const api = axios.create({
  baseURL: '', // 空字符串，使用Vite代理
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// 认证相关 API
export const authAPI = {
  // 用户登录
  login: async (login: string, password: string): Promise<ApiResponse<LoginData>> => {
    const response = await api.post<ApiResponse<LoginData>>(API_ENDPOINTS.login, {
      login,
      password,
    })
    return response.data
  },

  // 用户注册
  register: async (username: string, password: string): Promise<ApiResponse<RegisterData>> => {
    const response = await api.post<ApiResponse<RegisterData>>(API_ENDPOINTS.register, {
      username,
      password,
    })
    return response.data
  },

  // 健康检查
  health: async (): Promise<ApiResponse> => {
    const response = await api.get<ApiResponse>(API_ENDPOINTS.health)
    return response.data
  },
}

export default api
