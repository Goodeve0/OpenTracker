import axios from 'axios'
import { API_BASE_URL, API_ENDPOINTS, ApiResponse, LoginData, RegisterData } from './config'

// 重新创建axios实例，确保配置正确
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
})

// 移除所有现有拦截器
api.interceptors.request.clear()
api.interceptors.response.clear()

// 添加新的请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 添加新的响应拦截器
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken')
      if (window.location.pathname !== '/') {
        window.location.href = '/' // 重定向到登录页面
      }
    }
    return Promise.reject(error)
  }
)

// 个人资料接口响应
export interface UserProfileData {
  user: {
    id: string
    username: string
    name: string
    email: string
    telephone_number: string
    gender: string
    age: number
    bio: string
    avatar: string
    createdAt: string
    updatedAt: string
  }
}

// 更新个人资料请求
export interface UpdateProfileRequest {
  username?: string
  name?: string
  email?: string
  telephone_number?: string
  gender?: string
  age?: number
  bio?: string
  avatar?: string
}

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

  // 获取个人资料
  getProfile: async (): Promise<ApiResponse<UserProfileData>> => {
    try {
      const response = await api.get<ApiResponse<UserProfileData>>(API_ENDPOINTS.profile)
      return response.data
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data
      }
      return {
        code: 500,
        message: '获取个人资料失败，请检查网络连接或稍后重试',
        data: null,
      }
    }
  },

  // 更新个人资料
  updateProfile: async (data: UpdateProfileRequest): Promise<ApiResponse<UserProfileData>> => {
    try {
      const token = localStorage.getItem('authToken')

      // 构造符合服务器要求的数据结构
      // 服务器端实际处理逻辑期望age和telephone_number是string类型，会手动转换为number
      const requestData: any = {
        username: data.username,
        name: data.name,
        email: data.email,
        // 服务器端期望telephone_number是string类型，会手动转换为number
        telephone_number: data.telephone_number ? String(data.telephone_number) : undefined,
        gender: data.gender,
        // 服务器端期望age是string类型，会手动转换为number
        age: data.age ? String(data.age) : undefined,
        bio: data.bio,
        avatar: data.avatar,
      }

      // 过滤掉undefined和null值，只保留实际要修改的字段
      const filteredData = Object.fromEntries(
        Object.entries(requestData).filter(([_, value]) => value !== undefined && value !== null)
      )

      // 设置请求头
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
        withCredentials: false,
      }

      // 发送请求
      const response = await axios.put<ApiResponse<UserProfileData>>(
        API_BASE_URL + API_ENDPOINTS.profile,
        filteredData,
        config
      )

      return response.data
    } catch (error: any) {
      if (error.response) {
        return error.response.data
      }
      return {
        code: 500,
        message: '更新个人资料失败，请检查网络连接或稍后重试',
        data: null,
      }
    }
  },

  // 修改密码
  changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse> => {
    try {
      const token = localStorage.getItem('authToken')

      // 设置请求头
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
        withCredentials: false,
      }

      // 发送请求
      const response = await axios.post<ApiResponse>(
        API_BASE_URL + API_ENDPOINTS.changePassword,
        { currentPassword, newPassword },
        config
      )

      return response.data
    } catch (error: any) {
      if (error.response) {
        return error.response.data
      }
      return {
        code: 500,
        message: '修改密码失败，请检查网络连接或稍后重试',
        data: null,
      }
    }
  },
}

export default api
