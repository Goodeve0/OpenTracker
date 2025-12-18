import api from './auth'
import { API_ENDPOINTS, ApiResponse } from './config'
import type { ErrorItem } from '../types/error'

// 错误相关 API
export const errorAPI = {
  // 获取错误列表
  getErrors: async (params?: {
    type?: string
    status?: string
    search?: string
    page?: number
    pageSize?: number
  }): Promise<ApiResponse<{ list: ErrorItem[]; total: number }>> => {
    const response = await api.get<ApiResponse<{ list: ErrorItem[]; total: number }>>(
      API_ENDPOINTS.errors || '/api/errors',
      { params }
    )
    return response.data
  },

  // 获取错误详情
  getErrorDetail: async (id: string): Promise<ApiResponse<ErrorItem>> => {
    const response = await api.get<ApiResponse<ErrorItem>>(
      `${API_ENDPOINTS.errors || '/api/errors'}/${id}`
    )
    return response.data
  },

  // 标记错误为已处理
  resolveError: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.patch<ApiResponse<void>>(
      `${API_ENDPOINTS.errors || '/api/errors'}/${id}/resolve`
    )
    return response.data
  },

  // 删除错误
  deleteError: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(
      `${API_ENDPOINTS.errors || '/api/errors'}/${id}`
    )
    return response.data
  },
}
