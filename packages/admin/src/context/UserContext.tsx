import React, { createContext, useState, useEffect, ReactNode } from 'react'
import { authAPI, UserProfileData } from '@/api/auth'

// 用户信息上下文类型
interface UserContextType {
  username: string
  userInfo: UserProfileData['user'] | null
  updateUserInfo: () => Promise<void>
}

// 创建上下文
export const UserContext = createContext<UserContextType | undefined>(undefined)

// 上下文提供者组件的属性类型
interface UserProviderProps {
  children: ReactNode
}

// 上下文提供者组件
export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  // 用户名状态，默认值为 "管理员"
  const [username, setUsername] = useState('管理员')
  // 用户信息状态
  const [userInfo, setUserInfo] = useState<UserProfileData['user'] | null>(null)

  // 获取用户信息
  const fetchUserInfo = async () => {
    try {
      const response = await authAPI.getProfile()
      if (response.code === 200 && response.data?.user) {
        const user = response.data.user
        setUsername(user.username)
        setUserInfo(user)
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  }

  // 组件挂载时获取用户信息
  useEffect(() => {
    fetchUserInfo()
  }, [])

  // 更新用户信息（供外部调用）
  const updateUserInfo = async () => {
    await fetchUserInfo()
  }

  // 提供上下文值
  const contextValue: UserContextType = {
    username,
    userInfo,
    updateUserInfo,
  }

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
}

// 自定义 Hook，用于访问用户上下文
export const useUser = () => {
  const context = React.useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
