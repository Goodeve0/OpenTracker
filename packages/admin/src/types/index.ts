// src/types/index.ts
export interface User {
  id: number
  username: string
  password: string
  role: 'admin' | 'user'
}

export interface LoginResponse {
  success: boolean
  token?: string
  user?: Omit<User, 'password'> // 登录成功后隐藏密码
  message?: string
}

export interface RegisterParams {
  username: string
  password: string
  role?: 'admin' | 'user'
}

// 导入并导出仪表板相关类型
export * from './dashboard'
