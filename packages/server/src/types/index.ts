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

//通用响应类型
export interface IApiResponse<T = any> {
  code: number
  message: string
  data?: T
  timestamp: string
}
