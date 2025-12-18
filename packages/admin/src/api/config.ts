// API 配置 - 连接远程服务器
export const API_BASE_URL = ''

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
  data: T
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
