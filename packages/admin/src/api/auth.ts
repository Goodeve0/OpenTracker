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
      // 检查当前页面是否已经是登录页面，避免登录失败时页面刷新
      // 登录页面的实际路径是 / 而不是 /login
      if (window.location.pathname !== '/') {
        window.location.href = '/' // 重定向到登录页面
      }
    }
    return Promise.reject(error)
  }
)

// 认证相关 API
export const authAPI = {
  // 用户登录
  login: async (login: string, password: string): Promise<ApiResponse<LoginData>> => {
    try {
      const response = await api.post<ApiResponse<LoginData>>(API_ENDPOINTS.login, {
        login,
        password,
      })
      return response.data
    } catch (error: any) {
      // 直接返回错误响应的数据，而不是抛出错误
      if (error.response?.data) {
        return error.response.data
      }
      // 如果没有响应数据，返回默认错误
      return {
        code: 500,
        message: '登录失败，请检查网络连接或稍后重试',
        data: null,
      }
    }
  },

  // 用户注册
  register: async (username: string, password: string): Promise<ApiResponse<RegisterData>> => {
    try {
      const response = await api.post<ApiResponse<RegisterData>>(API_ENDPOINTS.register, {
        username,
        password,
      })
      return response.data
    } catch (error: any) {
      // 直接返回错误响应的数据，而不是抛出错误
      if (error.response?.data) {
        return error.response.data
      }
      // 如果没有响应数据，返回默认错误
      return {
        code: 500,
        message: '注册失败，请检查网络连接或稍后重试',
        data: null,
      }
    }
  },

  // 健康检查
  health: async (): Promise<ApiResponse> => {
    try {
      const response = await api.get<ApiResponse>(API_ENDPOINTS.health)
      return response.data
    } catch (error: any) {
      // 直接返回错误响应的数据，而不是抛出错误
      if (error.response?.data) {
        return error.response.data
      }
      // 如果没有响应数据，返回默认错误
      return {
        code: 500,
        message: '健康检查失败，请检查网络连接或稍后重试',
        data: null,
      }
    }
  },
}

export default api
