export interface IUser {
  id: string
  username: string
  password: string
}

export interface IRegisterRequest {
  username: string
  password: string
}

export interface ILoginRequest {
  login: string
  password: string
}

export interface IAuthResponse {
  user: {
    id: string
    username: string
  }
  token?: string
  expiresIn?: string
}

export interface IErrorlog {
  errorType: string
  message: string
  stack?: string
  time?: number
  [key: string]: any // 扩展字段
}

export interface IBehaviorLog {
  event: string
  target?: string
  time?: number
  [key: string]: any
}

export interface IPerformanceLog {
  loadTime?: number
  firstPaint?: number
  time?: number
  [key: string]: any
}

export interface IBlankScreenLog {
  screen: string
  selector?: string
  time?: number
  [key: string]: any
}

//通用响应类型
export interface IApiResponse<T = any> {
  code: number
  message: string
  data?: T
  timestamp: string
}
