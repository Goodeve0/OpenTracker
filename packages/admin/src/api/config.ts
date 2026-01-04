// API 配置 - 连接远程服务器
// 使用 vite.config.ts 中定义的环境变量，无需在此处修改
// 如需切换API地址，请修改 vite.config.ts 文件顶部的 API_BASE_URL 配置
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export const API_ENDPOINTS = {
  health: '/health',
  login: '/api/auth/login',
  register: '/api/auth/register',
  errors: '/api/errors',
}

// API 响应格式
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: any
}

// 用户相关接口响应
export interface LoginData {
  user: {
    id: string
    login: string
  }
}

export interface RegisterData {
  user: {
    id: string
    username: string
  }
}
