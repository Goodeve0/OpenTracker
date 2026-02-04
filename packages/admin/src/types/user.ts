// 个人信息数据类型
export interface UserData {
  id: string
  username: string
  gender: '男' | '女' | string
  age: number
  email: string
  telephone_number: string
  bio: string
  avatar: string
}

// 项目数据类型
export interface ProjectData {
  id: number
  name: string
  url: string
  apiKey: string
  status: 'running' | 'stopped' | 'pending'
  createdAt: string
  updatedAt: string
  type: string
  description: string
  monitorStatus: 'enabled' | 'disabled'
  userId: number
  errorCount?: number
  performanceScore?: number
}
