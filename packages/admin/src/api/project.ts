import axios from 'axios'
import { API_BASE_URL } from './config'

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

// 项目数据类型
export interface ProjectData {
  id: number
  name: string
  url: string
  apiKey: string
  type: string
  description: string
  status: string
  monitorStatus: string
  userId: number
  createdAt: string
  updatedAt: string
}

// 创建项目请求
export interface CreateProjectRequest {
  name: string
  url: string
  type: string
  apiKey?: string
  description?: string
}

// 更新项目请求
export interface UpdateProjectRequest {
  name?: string
  url?: string
  type?: string
  description?: string
  status?: string
  monitorStatus?: string
}

// API响应类型
export interface ApiResponse<T = any> {
  code: number
  message: string
  data?: T
}

// 项目管理 API
export const projectAPI = {
  // 创建项目
  createProject: async (data: CreateProjectRequest): Promise<ApiResponse<ProjectData>> => {
    try {
      const response = await api.post<ApiResponse<ProjectData>>('/api/project/create', data)
      return response.data
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data
      }
      return {
        code: 500,
        message: '创建项目失败，请检查网络连接或稍后重试',
        data: null,
      }
    }
  },

  // 获取项目列表
  getProjects: async (): Promise<ApiResponse<ProjectData[]>> => {
    try {
      const response = await api.get<ApiResponse<ProjectData[]>>('/api/project/list')
      return response.data
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data
      }
      return {
        code: 500,
        message: '获取项目列表失败，请检查网络连接或稍后重试',
        data: [],
      }
    }
  },

  // 获取项目详情
  getProjectDetail: async (id: number): Promise<ApiResponse<ProjectData>> => {
    try {
      const response = await api.get<ApiResponse<ProjectData>>(`/api/project/detail/${id}`)
      return response.data
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data
      }
      return {
        code: 500,
        message: '获取项目详情失败，请检查网络连接或稍后重试',
        data: null,
      }
    }
  },

  // 更新项目
  updateProject: async (
    id: number,
    data: UpdateProjectRequest
  ): Promise<ApiResponse<ProjectData>> => {
    try {
      const response = await api.put<ApiResponse<ProjectData>>(`/api/project/update/${id}`, data)
      return response.data
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data
      }
      return {
        code: 500,
        message: '更新项目失败，请检查网络连接或稍后重试',
        data: null,
      }
    }
  },

  // 删除项目
  deleteProject: async (id: number): Promise<ApiResponse> => {
    try {
      const response = await api.delete<ApiResponse>(`/api/project/delete/${id}`)
      return response.data
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data
      }
      return {
        code: 500,
        message: '删除项目失败，请检查网络连接或稍后重试',
      }
    }
  },

  // 更新项目监控状态
  updateMonitorStatus: async (
    id: number,
    monitorStatus: 'enabled' | 'disabled'
  ): Promise<ApiResponse<ProjectData>> => {
    try {
      const response = await api.put<ApiResponse<ProjectData>>(`/api/project/monitor/${id}`, {
        monitorStatus,
      })
      return response.data
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data
      }
      return {
        code: 500,
        message: '更新监控状态失败，请检查网络连接或稍后重试',
        data: null,
      }
    }
  },
}

export default api
